import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createVercelProject, createDeployment, mapReadyState, VercelNotConfiguredError } from "@/lib/vercel";
import { parseGithubRepoUrl } from "@/lib/github";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!project.repo_url) {
    return NextResponse.json({ error: "저장소가 아직 연결되지 않았습니다." }, { status: 400 });
  }

  const { data: pipeline } = await supabase
    .from("pipeline_state")
    .select("*")
    .eq("project_id", id)
    .maybeSingle();

  if (pipeline?.current_step === "deploying" || pipeline?.current_step === "live") {
    return NextResponse.json({ skipped: true });
  }
  // repo_url이 이미 있다는 건 push 단계는 끝났다는 뜻이므로, 'failed'는 배포 단계 재시도로 간주한다.
  if (pipeline?.current_step !== "github_pushed" && pipeline?.current_step !== "failed") {
    return NextResponse.json({ error: "저장소 push가 아직 완료되지 않았습니다." }, { status: 400 });
  }

  const repoInfo = parseGithubRepoUrl(project.repo_url);
  if (!repoInfo) {
    return NextResponse.json({ error: "저장소 URL을 해석하지 못했습니다." }, { status: 400 });
  }

  try {
    const vercelProject = await createVercelProject({
      name: project.name,
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      framework: project.framework,
    });

    // 프로젝트 생성(gitRepository 연결)만으로는 첫 배포가 자동 시작되지 않아 명시적으로 트리거한다.
    const deployment = await createDeployment({
      name: project.name,
      owner: repoInfo.owner,
      repo: repoInfo.repo,
    });

    await supabase.from("deployments").insert({
      project_id: id,
      host: "vercel",
      host_project_id: deployment.id,
      status: mapReadyState(deployment.readyState),
      url: deployment.url,
      log_url: deployment.inspectorUrl,
    });
    await supabase
      .from("pipeline_state")
      .update({ current_step: "deploying", last_error: null, updated_at: new Date().toISOString() })
      .eq("project_id", id);
    await supabase.from("projects").update({ status: "building" }).eq("id", id);
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "deploy",
      target_type: "project",
      target_id: id,
      after_jsonb: { vercel_project_id: vercelProject.id, deployment_id: deployment.id },
    });

    return NextResponse.json({ vercel_project_id: vercelProject.id, deployment_id: deployment.id });
  } catch (err) {
    const message =
      err instanceof VercelNotConfiguredError
        ? err.message
        : err instanceof Error
          ? err.message
          : "호스팅 배포에 실패했습니다.";
    await supabase
      .from("pipeline_state")
      .update({ current_step: "failed", last_error: message, updated_at: new Date().toISOString() })
      .eq("project_id", id);
    await supabase.from("projects").update({ status: "error" }).eq("id", id);
    return NextResponse.json({ error: message }, { status: err instanceof VercelNotConfiguredError ? 503 : 400 });
  }
}

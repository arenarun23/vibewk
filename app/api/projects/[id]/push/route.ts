import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRepoWithSuffix, putFile, GithubNotConfiguredError } from "@/lib/github";
import { scanFilesForSecrets } from "@/lib/secretScan";

function scaffoldFiles(projectName: string) {
  const now = new Date().toISOString();
  return [
    {
      path: "README.md",
      content: `# ${projectName}\n\nVibeDeploy Hub로 생성됨 · ${now}\n`,
    },
    { path: ".gitignore", content: "node_modules\n.env\n.env.local\n.next\ndist\n" },
  ];
}

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

  if (project.source_type === "existing_repo") {
    return NextResponse.json({ repo_url: project.repo_url, skipped: true });
  }

  const { data: pipeline } = await supabase
    .from("pipeline_state")
    .select("*")
    .eq("project_id", id)
    .maybeSingle();

  if (pipeline?.current_step === "github_pushed" || pipeline?.current_step === "deploying" || pipeline?.current_step === "live") {
    return NextResponse.json({ repo_url: project.repo_url, skipped: true });
  }

  const { data: files } = await supabase.from("project_files").select("path, content").eq("project_id", id);
  if (!files || files.length === 0) {
    return NextResponse.json({ error: "저장된 파일이 없습니다." }, { status: 400 });
  }

  // FR-003.5: push 전 시크릿 스캔 게이트
  const scan = scanFilesForSecrets(files);
  if (!scan.clean) {
    const message = `시크릿 패턴이 감지되어 push가 차단되었습니다: ${scan.findings
      .map((f) => `${f.path} (${f.rule})`)
      .join(", ")}`;
    await supabase
      .from("pipeline_state")
      .update({ current_step: "failed", last_error: message, updated_at: new Date().toISOString() })
      .eq("project_id", id);
    await supabase.from("projects").update({ status: "error" }).eq("id", id);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const { owner, repo, html_url } = await createRepoWithSuffix(project.name);

    const allFiles = [...scaffoldFiles(project.name), ...files];
    for (const file of allFiles) {
      await putFile(owner, repo, file.path, file.content, `Add ${file.path} (VibeDeploy Hub)`);
    }

    await supabase.from("projects").update({ repo_url: html_url }).eq("id", id);
    await supabase
      .from("pipeline_state")
      .update({ current_step: "github_pushed", last_error: null, updated_at: new Date().toISOString() })
      .eq("project_id", id);
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "github_push",
      target_type: "project",
      target_id: id,
      after_jsonb: { repo_url: html_url },
    });

    return NextResponse.json({ repo_url: html_url });
  } catch (err) {
    const message =
      err instanceof GithubNotConfiguredError
        ? err.message
        : err instanceof Error
          ? err.message
          : "GitHub 저장소 생성/push에 실패했습니다.";
    await supabase
      .from("pipeline_state")
      .update({ current_step: "failed", last_error: message, updated_at: new Date().toISOString() })
      .eq("project_id", id);
    await supabase.from("projects").update({ status: "error" }).eq("id", id);
    return NextResponse.json({ error: message }, { status: err instanceof GithubNotConfiguredError ? 503 : 400 });
  }
}

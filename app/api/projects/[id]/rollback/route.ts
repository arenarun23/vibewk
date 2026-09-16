import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVercelProjectByName, promoteDeployment, VercelNotConfiguredError } from "@/lib/vercel";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: deployments } = await supabase
    .from("deployments")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const target = (deployments ?? []).find((d) => d.status === "ready");
  if (!target) {
    return NextResponse.json({ error: "롤백할 이전 성공 배포가 없습니다." }, { status: 400 });
  }

  try {
    const vercelProject = await getVercelProjectByName(project.name);
    if (!vercelProject) {
      return NextResponse.json({ error: "Vercel 프로젝트를 찾을 수 없습니다." }, { status: 400 });
    }

    await promoteDeployment(vercelProject.id, target.host_project_id);

    await supabase
      .from("projects")
      .update({ status: "live", live_url: target.url })
      .eq("id", id);
    await supabase
      .from("pipeline_state")
      .update({ current_step: "live", last_error: null, updated_at: new Date().toISOString() })
      .eq("project_id", id);
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "rollback",
      target_type: "project",
      target_id: id,
      after_jsonb: { promoted_deployment_id: target.host_project_id, url: target.url },
    });

    return NextResponse.json({ ok: true, url: target.url });
  } catch (err) {
    const message =
      err instanceof VercelNotConfiguredError
        ? err.message
        : err instanceof Error
          ? err.message
          : "롤백에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: err instanceof VercelNotConfiguredError ? 503 : 400 });
  }
}

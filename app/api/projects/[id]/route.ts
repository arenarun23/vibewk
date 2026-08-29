import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDeployment, mapReadyState } from "@/lib/vercel";
import type { ProjectDetail } from "@/lib/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (projectError) {
    return NextResponse.json({ error: "프로젝트를 불러오지 못했습니다." }, { status: 400 });
  }
  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const [{ data: pipeline }, { data: files }, { data: deployments }] = await Promise.all([
    supabase.from("pipeline_state").select("*").eq("project_id", id).maybeSingle(),
    supabase.from("project_files").select("*").eq("project_id", id).order("path"),
    supabase.from("deployments").select("*").eq("project_id", id).order("created_at", { ascending: false }),
  ]);

  // FR-011: 진행 중인 배포가 있으면 Vercel 최신 상태로 갱신 (경량 폴링)
  const latest = deployments?.[0];
  if (latest && (latest.status === "queued" || latest.status === "building")) {
    try {
      const live = await getDeployment(latest.host_project_id);
      const status = mapReadyState(live.readyState);
      if (status !== latest.status) {
        await supabase
          .from("deployments")
          .update({ status, url: live.url })
          .eq("id", latest.id);
        latest.status = status;
        latest.url = live.url;
        if (status === "ready") {
          await supabase
            .from("projects")
            .update({ status: "live", live_url: live.url })
            .eq("id", id);
          await supabase
            .from("pipeline_state")
            .update({ current_step: "live" })
            .eq("project_id", id);
        } else if (status === "error") {
          await supabase.from("projects").update({ status: "error" }).eq("id", id);
          await supabase
            .from("pipeline_state")
            .update({ current_step: "failed", last_error: "호스팅 빌드 실패" })
            .eq("project_id", id);
        }
      }
    } catch (err) {
      // Vercel 미설정/일시 오류 — 기존 상태 그대로 반환하되 서버 로그에는 남긴다
      console.error("Vercel 배포 상태 조회 실패:", err);
    }
  }

  const detail: ProjectDetail = {
    project,
    pipeline: pipeline ?? null,
    files: files ?? [],
    deployments: deployments ?? [],
  };
  return NextResponse.json(detail);
}

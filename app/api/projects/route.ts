import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRepoUrl, validateNewProject, type NewProjectInput } from "@/lib/validation";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "프로젝트 목록을 불러오지 못했습니다." }, { status: 400 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<NewProjectInput> | null;
  if (!body) {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const { valid, error: validationError } = validateNewProject(body);
  if (!valid) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // EX-2.E1: 동일 사용자가 1분 이내 5건 초과 생성 시 차단
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .gte("created_at", oneMinuteAgo);
  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "1분 내 생성 가능한 프로젝트 수(5개)를 초과했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }

  const repoUrl =
    body.source_type === "existing_repo" && body.existing_repo_url
      ? (() => {
          const parsed = parseRepoUrl(body.existing_repo_url!);
          return parsed ? `https://github.com/${parsed.owner}/${parsed.repo}` : null;
        })()
      : null;

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      name: body.name,
      framework: body.framework,
      hosting: body.hosting,
      source_type: body.source_type,
      repo_url: repoUrl,
    })
    .select()
    .single();

  if (insertError) {
    const message = insertError.code === "23505" ? "이미 사용 중인 프로젝트 이름입니다." : "프로젝트를 생성하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: insertError.code === "23505" ? 409 : 400 });
  }

  if (body.source_type === "paste" && body.files) {
    const { error: filesError } = await supabase
      .from("project_files")
      .insert(body.files.map((f) => ({ project_id: project.id, path: f.path, content: f.content })));
    if (filesError) {
      return NextResponse.json({ error: "파일을 저장하지 못했습니다." }, { status: 400 });
    }
  }

  const { error: pipelineError } = await supabase.from("pipeline_state").insert({
    project_id: project.id,
    current_step: body.source_type === "existing_repo" ? "github_pushed" : "created",
  });
  if (pipelineError) {
    return NextResponse.json({ error: "파이프라인 상태를 초기화하지 못했습니다." }, { status: 400 });
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "project_create",
    target_type: "project",
    target_id: project.id,
    after_jsonb: { name: project.name, source_type: project.source_type },
  });

  return NextResponse.json(project, { status: 201 });
}

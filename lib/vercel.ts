import type { Framework } from "./types";

const VERCEL_API = "https://api.vercel.com";

export class VercelNotConfiguredError extends Error {
  constructor() {
    super("VERCEL_TOKEN이 설정되지 않았습니다.");
    this.name = "VercelNotConfiguredError";
  }
}

const FRAMEWORK_SLUG: Record<Framework, string> = {
  nextjs: "nextjs",
  vite: "vite",
  sveltekit: "sveltekit",
};

function requireToken() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new VercelNotConfiguredError();
  return token;
}

function teamQuery() {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function createVercelProject(input: {
  name: string;
  owner: string;
  repo: string;
  framework: Framework;
}): Promise<{ id: string; name: string }> {
  const token = requireToken();
  const res = await fetch(`${VERCEL_API}/v10/projects${teamQuery()}`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      name: input.name,
      framework: FRAMEWORK_SLUG[input.framework],
      gitRepository: { type: "github", repo: `${input.owner}/${input.repo}` },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel 프로젝트 생성 실패 (${res.status}): ${body}`);
  }
  const data = await res.json();
  return { id: data.id, name: data.name };
}

/**
 * 프로젝트 생성(gitRepository 연결)만으로는 초기 배포가 자동으로 시작되지 않아
 * 명시적으로 gitSource 기반 배포를 트리거해야 한다 (실제 API 동작 확인됨).
 */
export async function createDeployment(input: {
  name: string;
  owner: string;
  repo: string;
  ref?: string;
}): Promise<{ id: string; readyState: string; url: string | null }> {
  const token = requireToken();
  const res = await fetch(`${VERCEL_API}/v13/deployments${teamQuery()}`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      name: input.name,
      target: "production",
      gitSource: {
        type: "github",
        org: input.owner,
        repo: input.repo,
        ref: input.ref ?? "main",
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel 배포 트리거 실패 (${res.status}): ${body}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    readyState: data.readyState ?? data.status,
    url: data.url ? `https://${data.url}` : null,
  };
}

export async function getDeployment(
  deploymentId: string,
): Promise<{ id: string; readyState: string; url: string | null }> {
  const token = requireToken();
  const res = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery()}`, {
    headers: headers(token),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel 배포 조회 실패 (${res.status}): ${body}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    readyState: data.readyState ?? data.status,
    url: data.url ? `https://${data.url}` : null,
  };
}

export function mapReadyState(state: string): "queued" | "building" | "ready" | "error" {
  switch (state) {
    case "READY":
      return "ready";
    case "ERROR":
    case "CANCELED":
      return "error";
    case "BUILDING":
    case "INITIALIZING":
    case "DEPLOYING":
      return "building";
    default:
      return "queued";
  }
}

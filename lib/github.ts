const GITHUB_API = "https://api.github.com";

export class GithubNotConfiguredError extends Error {
  constructor() {
    super("GITHUB_TOKEN 또는 GITHUB_DEFAULT_OWNER가 설정되지 않았습니다.");
    this.name = "GithubNotConfiguredError";
  }
}

function requireConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_DEFAULT_OWNER;
  if (!token || !owner) throw new GithubNotConfiguredError();
  return { token, owner };
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/** AC-4.1: 이름 충돌 시 -v2, -v3 ... 자동 suffix, 최대 5회 시도 */
export async function createRepoWithSuffix(baseName: string): Promise<{ owner: string; repo: string; html_url: string }> {
  const { token, owner } = requireConfig();

  for (let attempt = 0; attempt < 5; attempt++) {
    const name = attempt === 0 ? baseName : `${baseName}-v${attempt + 1}`;
    const res = await fetch(`${GITHUB_API}/user/repos`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ name, private: true, auto_init: false }),
    });

    if (res.status === 201) {
      const data = await res.json();
      return { owner: data.owner.login, repo: data.name, html_url: data.html_url };
    }
    if (res.status === 422) continue; // name already exists — try next suffix
    const body = await res.text();
    throw new Error(`GitHub 저장소 생성 실패 (${res.status}): ${body}`);
  }
  throw new Error("사용 가능한 저장소 이름을 찾지 못했습니다 (5회 시도 초과).");
}

/** 새 저장소에 파일 생성 (신규 repo이므로 sha 조회 불필요) */
export async function putFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
): Promise<{ sha: string }> {
  const { token } = requireConfig();
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message,
        content: Buffer.from(content, "utf-8").toString("base64"),
      }),
    },
  );
  if (res.status !== 201) {
    const body = await res.text();
    throw new Error(`GitHub 파일 push 실패 (${path}, ${res.status}): ${body}`);
  }
  const data = await res.json();
  return { sha: data.content.sha as string };
}

export function parseGithubRepoUrl(input: string): { owner: string; repo: string } | null {
  const match = /^(?:https:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(input.trim());
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export async function verifyGithubToken(): Promise<boolean> {
  const { token } = requireConfig();
  const res = await fetch(`${GITHUB_API}/user`, { headers: headers(token) });
  return res.ok;
}

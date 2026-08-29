import type { Framework, Hosting, SourceType } from "./types";

const NAME_RE = /^[a-z0-9-]{3,63}$/;
const PATH_RE = /^[^/].{0,255}$/;
const REPO_URL_RE = /^(?:https:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/;

export interface FileInput {
  path: string;
  content: string;
}

export interface NewProjectInput {
  name: string;
  framework: Framework;
  hosting: Hosting;
  source_type: SourceType;
  existing_repo_url?: string;
  files?: FileInput[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateProjectName(name: string): string | null {
  if (!NAME_RE.test(name)) {
    return "프로젝트 이름은 영문 소문자·숫자·하이픈으로 3~63자여야 합니다.";
  }
  return null;
}

export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  const match = REPO_URL_RE.exec(input.trim());
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export function validateNewProject(input: Partial<NewProjectInput>): ValidationResult {
  if (!input.name || validateProjectName(input.name)) {
    return { valid: false, error: validateProjectName(input.name ?? "") ?? "이름을 입력해 주세요." };
  }
  if (input.framework !== "nextjs" && input.framework !== "vite" && input.framework !== "sveltekit") {
    return { valid: false, error: "프레임워크를 선택해 주세요." };
  }
  if (input.hosting !== "vercel") {
    return { valid: false, error: "호스팅을 선택해 주세요." };
  }
  if (input.source_type === "existing_repo") {
    if (!input.existing_repo_url || !parseRepoUrl(input.existing_repo_url)) {
      return { valid: false, error: "GitHub 저장소 URL이 올바르지 않습니다. (예: owner/repo)" };
    }
    return { valid: true };
  }
  if (input.source_type === "paste") {
    if (!input.files || input.files.length === 0) {
      return { valid: false, error: "파일을 하나 이상 추가해 주세요." };
    }
    for (const f of input.files) {
      if (!PATH_RE.test(f.path)) {
        return { valid: false, error: `파일 경로가 올바르지 않습니다: ${f.path}` };
      }
      if (!f.content || f.content.length === 0) {
        return { valid: false, error: `파일 내용이 비어 있습니다: ${f.path}` };
      }
      if (f.content.length > 1_000_000) {
        return { valid: false, error: `파일이 너무 큽니다(1MB 초과): ${f.path}` };
      }
    }
    return { valid: true };
  }
  return { valid: false, error: "소스 타입을 선택해 주세요." };
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "비밀번호는 영문과 숫자를 모두 포함해야 합니다.";
  }
  return null;
}

export function mapAuthErrorToKorean(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("user already")) {
    return "이미 가입된 이메일입니다.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid email or password")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (lower.includes("password should be at least")) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }
  if (lower.includes("unable to validate email") || lower.includes("invalid email")) {
    return "올바른 이메일 형식이 아닙니다.";
  }
  if (lower.includes("email not confirmed")) {
    return "이메일 인증이 필요합니다. 받은 편지함을 확인해 주세요.";
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

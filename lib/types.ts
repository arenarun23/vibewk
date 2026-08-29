export type Framework = "nextjs" | "vite" | "sveltekit";
export type Hosting = "vercel";
export type SourceType = "paste" | "existing_repo";
export type ProjectStatus = "pending" | "building" | "live" | "error" | "cancelled";
export type DeploymentStatus = "queued" | "building" | "ready" | "error";

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  framework: Framework;
  hosting: Hosting;
  source_type: SourceType;
  repo_url: string | null;
  live_url: string | null;
  status: ProjectStatus;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
  created_at: string;
}

export type PipelineStep =
  | "created"
  | "security_gate"
  | "github_pushed"
  | "deploying"
  | "live"
  | "failed";

export interface PipelineState {
  id: string;
  project_id: string;
  current_step: PipelineStep;
  idempotency_key: string;
  last_error: string | null;
  updated_at: string;
}

export interface Deployment {
  id: string;
  project_id: string;
  host: string;
  host_project_id: string;
  commit_sha: string | null;
  status: DeploymentStatus;
  url: string | null;
  log_url: string | null;
  created_at: string;
}

export interface ProjectDetail {
  project: Project;
  pipeline: PipelineState | null;
  files: ProjectFile[];
  deployments: Deployment[];
}

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  nextjs: "Next.js",
  vite: "Vite",
  sveltekit: "SvelteKit",
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  pending: "대기",
  building: "빌드 중",
  live: "Live",
  error: "오류",
  cancelled: "취소됨",
};

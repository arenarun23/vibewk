const SECRET_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: "OpenAI API Key", pattern: /sk-[A-Za-z0-9]{20,}/ },
  { name: "Anthropic API Key", pattern: /sk-ant-[A-Za-z0-9-]{20,}/ },
  { name: "GitHub Personal Access Token", pattern: /github_pat_[A-Za-z0-9_]{20,}/ },
  { name: "GitHub OAuth Token", pattern: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: "Vercel Token", pattern: /vcp_[A-Za-z0-9]{20,}/ },
  { name: "Cloudflare Token", pattern: /cfut_[A-Za-z0-9]{20,}/ },
  { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "Generic private key block", pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

export interface SecretScanFinding {
  path: string;
  rule: string;
}

export interface SecretScanResult {
  clean: boolean;
  findings: SecretScanFinding[];
}

export function scanFilesForSecrets(files: { path: string; content: string }[]): SecretScanResult {
  const findings: SecretScanFinding[] = [];
  for (const file of files) {
    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(file.content)) {
        findings.push({ path: file.path, rule: name });
      }
    }
  }
  return { clean: findings.length === 0, findings };
}

import type { TransactionType } from "./types";

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  memo?: string | null;
  txn_date: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof TransactionInput, string>>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateTransactionInput(input: Partial<TransactionInput>): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  if (input.type !== "income" && input.type !== "expense") {
    errors.type = "유형은 수입 또는 지출이어야 합니다.";
  }

  if (
    typeof input.amount !== "number" ||
    Number.isNaN(input.amount) ||
    input.amount <= 0
  ) {
    errors.amount = "금액은 0보다 큰 숫자여야 합니다.";
  }

  if (!input.txn_date || !DATE_RE.test(input.txn_date)) {
    errors.txn_date = "날짜를 올바르게 입력해 주세요.";
  }

  if (!input.category || !input.category.trim()) {
    errors.category = "카테고리를 선택해 주세요.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "비밀번호는 8자 이상이어야 합니다.";
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

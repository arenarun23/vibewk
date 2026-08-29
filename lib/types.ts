export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  memo: string | null;
  txn_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface CategorySummary {
  category: string;
  amount: number;
  ratio: number; // 0~1
}

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
  byCategory: CategorySummary[];
}

export const DEFAULT_CATEGORIES = ["식비", "교통", "쇼핑", "주거", "문화", "기타"] as const;

export const FALLBACK_CATEGORY = "기타";

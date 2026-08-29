import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MonthSummary } from "@/lib/types";

const MONTH_RE = /^\d{4}-\d{2}$/;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month");
  if (!month || !MONTH_RE.test(month)) {
    return NextResponse.json(
      { error: "month 파라미터는 YYYY-MM 형식이어야 합니다." },
      { status: 400 },
    );
  }

  const from = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const to = new Date(y, m, 1).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, category")
    .gte("txn_date", from)
    .lt("txn_date", to);

  if (error) {
    return NextResponse.json({ error: "요약 정보를 불러오지 못했습니다." }, { status: 400 });
  }

  let income = 0;
  let expense = 0;
  const byCategoryMap = new Map<string, number>();

  for (const row of data) {
    const amount = Number(row.amount);
    if (row.type === "income") {
      income += amount;
    } else {
      expense += amount;
      byCategoryMap.set(row.category, (byCategoryMap.get(row.category) ?? 0) + amount);
    }
  }

  const byCategory = Array.from(byCategoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      ratio: expense > 0 ? amount / expense : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const summary: MonthSummary = {
    income,
    expense,
    balance: income - expense,
    byCategory,
  };

  return NextResponse.json(summary);
}

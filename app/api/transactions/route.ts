import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateTransactionInput, type TransactionInput } from "@/lib/validation";

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
  const to = new Date(y, m, 1).toISOString().slice(0, 10); // 다음 달 1일 (exclusive)

  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, category, memo, txn_date, created_at")
    .gte("txn_date", from)
    .lt("txn_date", to)
    .order("txn_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "거래 목록을 불러오지 못했습니다." }, { status: 400 });
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

  const body = (await request.json().catch(() => null)) as Partial<TransactionInput> | null;
  if (!body) {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const { valid, errors } = validateTransactionInput(body);
  if (!valid) {
    return NextResponse.json({ error: "입력값을 확인해 주세요.", fields: errors }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: body.type,
      amount: body.amount,
      category: body.category,
      memo: body.memo ?? null,
      txn_date: body.txn_date,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "거래를 등록하지 못했습니다." }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

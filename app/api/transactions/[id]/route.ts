import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateTransactionInput, type TransactionInput } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
    .update({
      type: body.type,
      amount: body.amount,
      category: body.category,
      memo: body.memo ?? null,
      txn_date: body.txn_date,
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "거래를 수정하지 못했습니다." }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "거래를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "거래를 삭제하지 못했습니다." }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "거래를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

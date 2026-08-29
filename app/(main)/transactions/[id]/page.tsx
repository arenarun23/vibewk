import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransactionForm from "@/components/TransactionForm";
import type { Transaction } from "@/lib/types";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle<Transaction>();

  if (!data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-bold text-gray-900">거래 수정</h1>
      <TransactionForm transaction={data} />
    </div>
  );
}

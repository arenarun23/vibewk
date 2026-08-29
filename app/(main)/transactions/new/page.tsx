"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TransactionForm from "@/components/TransactionForm";

function NewTransactionForm() {
  const searchParams = useSearchParams();
  const defaultDate = searchParams.get("date") ?? undefined;
  return <TransactionForm defaultDate={defaultDate} />;
}

export default function NewTransactionPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-bold text-gray-900">거래 등록</h1>
      <Suspense fallback={null}>
        <NewTransactionForm />
      </Suspense>
    </div>
  );
}

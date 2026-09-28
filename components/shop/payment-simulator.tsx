"use client";

import { useState } from "react";
import { completeSimulatedPayment } from "@/app/(shop)/checkout/actions";

export function PaymentSimulator({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState<"success" | "fail" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(outcome: "success" | "fail") {
    setLoading(outcome);
    setError(null);
    const result = await completeSimulatedPayment(orderId, outcome);
    if ("error" in result) {
      setLoading(null);
      setError(result.error);
      return;
    }
    window.location.href = result.redirectUrl;
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => run("success")}
        disabled={loading !== null}
        className="rounded-sm bg-ink px-6 py-3.5 text-sm text-paper transition-colors hover:bg-ink/90 disabled:opacity-50"
      >
        {loading === "success" ? "در حال ثبت…" : "پرداخت موفق"}
      </button>
      <button
        type="button"
        onClick={() => run("fail")}
        disabled={loading !== null}
        className="rounded-sm border border-line bg-white px-6 py-3.5 text-sm transition-colors hover:border-ink disabled:opacity-50"
      >
        {loading === "fail" ? "در حال ثبت…" : "انصراف / پرداخت ناموفق"}
      </button>
      {error && <p role="alert" className="text-sm text-sale">{error}</p>}
    </div>
  );
}

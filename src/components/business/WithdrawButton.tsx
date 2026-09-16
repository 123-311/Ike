"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawDealAction } from "@/app/business/actions";

export default function WithdrawButton({ dealId }: { dealId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Withdraw this deal? It will no longer be shown publicly.")) return;
        startTransition(async () => {
          await withdrawDealAction(dealId);
          router.refresh();
        });
      }}
      className="rounded-lg border border-danger/40 text-danger px-3 py-1.5 text-xs font-medium"
    >
      Withdraw
    </button>
  );
}

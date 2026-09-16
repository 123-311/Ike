"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSavedDeal } from "@/app/deals/actions";

export default function UnsaveButton({ dealId }: { dealId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleSavedDeal(dealId);
          router.refresh();
        })
      }
      className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-danger"
    >
      Remove
    </button>
  );
}

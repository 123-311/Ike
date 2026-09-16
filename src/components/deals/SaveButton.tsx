"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSavedDeal } from "@/app/deals/actions";

export default function SaveButton({
  dealId,
  initiallySaved,
  isLoggedIn,
}: {
  dealId: string;
  initiallySaved: boolean;
  isLoggedIn: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
      >
        ♡ Log in to save
      </button>
    );
  }

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleSavedDeal(dealId);
          setSaved(result.saved);
        })
      }
      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
        saved
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-foreground"
      }`}
    >
      {saved ? "♥ Saved" : "♡ Save"}
    </button>
  );
}

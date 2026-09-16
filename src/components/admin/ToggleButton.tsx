"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ToggleButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: (next: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await onToggle(!active);
          router.refresh();
        })
      }
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
        active ? "border-danger/40 text-danger" : "border-primary text-primary"
      }`}
    >
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}

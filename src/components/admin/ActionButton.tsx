"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ActionButton({
  action,
  children,
  confirmText,
  variant = "default",
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  confirmText?: string;
  variant?: "default" | "danger" | "primary";
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const styles =
    variant === "danger"
      ? "border-danger/40 text-danger"
      : variant === "primary"
      ? "border-primary text-primary"
      : "border-border";

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        startTransition(async () => {
          try {
            await action();
            router.refresh();
          } catch (e) {
            alert(e instanceof Error ? e.message : "Something went wrong.");
          }
        });
      }}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${styles}`}
    >
      {pending ? "..." : children}
    </button>
  );
}

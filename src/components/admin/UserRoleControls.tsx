"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserActiveAction, setUserRoleAction } from "@/app/admin/actions";

export default function UserRoleControls({
  userId,
  role,
  isActive,
}: {
  userId: string;
  role: "ADMIN" | "CUSTOMER";
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex gap-2 text-xs">
      <button
        disabled={pending}
        onClick={() =>
          run(() => setUserRoleAction(userId, role === "ADMIN" ? "CUSTOMER" : "ADMIN"))
        }
        className="rounded-lg border border-border px-3 py-1.5 font-medium disabled:opacity-50"
      >
        {role === "ADMIN" ? "Revoke admin" : "Make admin"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (isActive && !confirm("Deactivate this user? They will be signed out and unable to log in.")) return;
          run(() => setUserActiveAction(userId, !isActive));
        }}
        className={`rounded-lg border px-3 py-1.5 font-medium disabled:opacity-50 ${
          isActive ? "border-danger/40 text-danger" : "border-primary text-primary"
        }`}
      >
        {isActive ? "Deactivate" : "Reactivate"}
      </button>
    </div>
  );
}

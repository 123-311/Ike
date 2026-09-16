"use client";

import { useActionState, useState } from "react";
import type { AdminFormState } from "@/app/admin/actions";
import { FormError, FormSuccess } from "@/components/ui/Field";

export default function RejectForm({
  action,
}: {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-danger/40 text-danger px-3 py-1.5 text-xs font-medium"
      >
        Reject
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 w-full">
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <textarea
        name="reason"
        required
        placeholder="Reason for rejection..."
        rows={2}
        className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-danger text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {pending ? "..." : "Confirm reject"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

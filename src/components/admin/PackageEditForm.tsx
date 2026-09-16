"use client";

import { useActionState } from "react";
import { updatePackageAction } from "@/app/admin/catalog/actions";
import { FormError, FormSuccess } from "@/components/ui/Field";

type SerializablePackage = {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  active: boolean;
};

export default function PackageEditForm({ pkg }: { pkg: SerializablePackage }) {
  const boundAction = updatePackageAction.bind(null, pkg.id);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="rounded-xl border border-border bg-surface p-3">
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end text-sm">
        <label className="flex flex-col">
          <span className="text-xs text-muted mb-1">Name</span>
          <input name="name" defaultValue={pkg.name} className="rounded border border-border px-2 py-1.5" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-muted mb-1">Duration (days)</span>
          <input
            name="durationDays"
            type="number"
            min="1"
            defaultValue={pkg.durationDays}
            className="rounded border border-border px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-muted mb-1">Price (KSh)</span>
          <input
            name="price"
            type="number"
            min="0"
            defaultValue={pkg.price}
            className="rounded border border-border px-2 py-1.5"
          />
        </label>
        <label className="flex items-center gap-2 pb-1.5">
          <input type="checkbox" name="active" defaultChecked={pkg.active} />
          <span className="text-xs">Active</span>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary text-primary-contrast px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          {pending ? "..." : "Save"}
        </button>
      </div>
    </form>
  );
}

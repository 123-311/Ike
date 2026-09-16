"use client";

import { useActionState, useRef, useEffect } from "react";
import { createPackageAction } from "@/app/admin/catalog/actions";
import { FormError, FormSuccess, SubmitButton } from "@/components/ui/Field";

export default function CreatePackageForm() {
  const [state, formAction, pending] = useActionState(createPackageAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="rounded-xl border border-border bg-surface p-4 mb-6">
      <h2 className="font-semibold mb-2">Add a new package</h2>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <select name="type" required className="rounded-lg border border-border px-2 py-2 col-span-2">
          <option value="BUSINESS_SUBSCRIPTION">Business Subscription</option>
          <option value="FEATURED_BUSINESS">Featured Business</option>
          <option value="DEAL_BOOST">Deal Boost</option>
          <option value="SPONSORED_DEAL">Sponsored Deal</option>
          <option value="ADVERTISING">Advertising</option>
        </select>
        <input name="name" placeholder="Package name" required className="rounded-lg border border-border px-2 py-2 col-span-2" />
        <input name="durationDays" type="number" min="1" placeholder="Duration (days)" required className="rounded-lg border border-border px-2 py-2" />
        <input name="price" type="number" min="0" placeholder="Price (KSh)" required className="rounded-lg border border-border px-2 py-2" />
        <input name="description" placeholder="Description (optional)" className="rounded-lg border border-border px-2 py-2 col-span-2" />
      </div>
      <div className="mt-2">
        <SubmitButton pending={pending} full={false}>
          Add package
        </SubmitButton>
      </div>
    </form>
  );
}

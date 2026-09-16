"use client";

import { useActionState, useRef, useEffect } from "react";
import { FormError, FormSuccess, SubmitButton } from "@/components/ui/Field";
import type { CatalogFormState } from "@/app/admin/catalog/actions";

export default function SimpleCreateForm({
  action,
  fields,
  submitLabel,
}: {
  action: (prev: CatalogFormState, formData: FormData) => Promise<CatalogFormState>;
  fields: { name: string; placeholder: string; required?: boolean }[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="rounded-xl border border-border bg-surface p-4 mb-4">
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <div className="flex flex-wrap gap-2">
        {fields.map((f) => (
          <input
            key={f.name}
            name={f.name}
            placeholder={f.placeholder}
            required={f.required}
            className="flex-1 min-w-[120px] rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        ))}
        <SubmitButton pending={pending} full={false}>
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/account/actions";
import { Field, FormError, FormSuccess, SubmitButton } from "@/components/ui/Field";

export default function ProfileForm({ name, phone }: { name: string; phone: string | null }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={formAction} className="rounded-xl border border-border bg-surface p-4">
      <h2 className="font-semibold mb-3">Profile details</h2>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <Field label="Full name" name="name" defaultValue={name} required />
      <Field label="Phone number" name="phone" defaultValue={phone ?? ""} required />
      <SubmitButton pending={pending} full={false}>
        Save changes
      </SubmitButton>
    </form>
  );
}

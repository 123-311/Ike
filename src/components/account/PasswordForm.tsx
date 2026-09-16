"use client";

import { useActionState, useRef, useEffect } from "react";
import { changePasswordAction } from "@/app/account/actions";
import { Field, FormError, FormSuccess, SubmitButton } from "@/components/ui/Field";

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="rounded-xl border border-border bg-surface p-4">
      <h2 className="font-semibold mb-3">Change password</h2>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <Field
        label="Current password"
        name="currentPassword"
        type="password"
        required
        autoComplete="current-password"
      />
      <Field
        label="New password"
        name="newPassword"
        type="password"
        required
        autoComplete="new-password"
      />
      <SubmitButton pending={pending} full={false}>
        Update password
      </SubmitButton>
    </form>
  );
}

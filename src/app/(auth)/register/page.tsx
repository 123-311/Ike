"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "../actions";
import { Field, FormError, SubmitButton } from "@/components/ui/Field";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <div className="max-w-sm mx-auto py-6">
      <h1 className="text-2xl font-bold mb-1">Create your account</h1>
      <p className="text-sm text-muted mb-6">
        Browse deals, save favourites, and register a business any time —
        your customer account stays active either way.
      </p>
      <form action={formAction}>
        <FormError message={state?.error} />
        <Field label="Full name" name="name" required autoComplete="name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field
          label="Phone number"
          name="phone"
          required
          placeholder="0712345678"
          autoComplete="tel"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
        />
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}

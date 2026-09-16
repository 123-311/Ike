"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "../actions";
import { Field, FormError, SubmitButton } from "@/components/ui/Field";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="max-w-sm mx-auto py-6">
      <h1 className="text-2xl font-bold mb-1">Log in</h1>
      <p className="text-sm text-muted mb-6">Welcome back to Mtaani Deals.</p>
      <form action={formAction}>
        <FormError message={state?.error} />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <SubmitButton pending={pending}>Log in</SubmitButton>
      </form>
      <p className="mt-4 text-sm text-muted">
        New to Mtaani Deals?{" "}
        <Link href="/register" className="text-primary font-medium">
          Create an account
        </Link>
      </p>
    </div>
  );
}

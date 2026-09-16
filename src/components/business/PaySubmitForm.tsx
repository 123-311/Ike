"use client";

import { useActionState } from "react";
import { submitPaymentAction } from "@/app/business/promote/actions";
import { Field, FormError, SubmitButton } from "@/components/ui/Field";

export default function PaySubmitForm({
  packageId,
  dealId,
}: {
  packageId: string;
  dealId?: string;
}) {
  const [state, formAction, pending] = useActionState(submitPaymentAction, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="packageId" value={packageId} />
      {dealId && <input type="hidden" name="dealId" value={dealId} />}
      <FormError message={state?.error} />
      <Field
        label="M-PESA transaction code"
        name="transactionCode"
        required
        placeholder="e.g. QGH7XXXXX1"
      />
      <SubmitButton pending={pending}>Submit for verification</SubmitButton>
      <p className="mt-3 text-xs text-muted text-center">
        Your promotion activates only after an admin verifies this payment.
        Submitting does not mean payment is confirmed yet.
      </p>
    </form>
  );
}

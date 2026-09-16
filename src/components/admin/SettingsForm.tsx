"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/admin/settings/actions";
import { Field, TextAreaField, FormError, FormSuccess, SubmitButton } from "@/components/ui/Field";

export default function SettingsForm({
  values,
}: {
  values: {
    mpesa_receiving_number: string;
    payment_instructions: string;
    payment_receiving_status: string;
    supported_payment_method_label: string;
    brand_tagline: string;
    max_active_deals_per_business: string;
  };
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, undefined);

  return (
    <form action={formAction}>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />

      <Field
        label="M-PESA Personal Receiving Number"
        name="mpesa_receiving_number"
        defaultValue={values.mpesa_receiving_number}
        placeholder="0700000000"
      />
      <p className="text-xs text-muted -mt-2 mb-3">
        Personal number only — never a Till or PayBill. This is separate
        from any business&apos;s contact or WhatsApp number.
      </p>

      <label className="block text-sm font-medium mb-3">
        <span className="block mb-1">Payment receiving status</span>
        <select
          name="payment_receiving_status"
          defaultValue={values.payment_receiving_status}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5"
        >
          <option value="ENABLED">Enabled — accept new payments</option>
          <option value="DISABLED">Disabled — block new payment submissions</option>
        </select>
      </label>

      <TextAreaField
        label="Payment instructions"
        name="payment_instructions"
        defaultValue={values.payment_instructions}
        rows={4}
      />

      <Field
        label="Payment method label"
        name="supported_payment_method_label"
        defaultValue={values.supported_payment_method_label}
      />

      <Field label="Brand tagline" name="brand_tagline" defaultValue={values.brand_tagline} />

      <Field
        label="Max active deals per business"
        name="max_active_deals_per_business"
        type="number"
        min="1"
        defaultValue={values.max_active_deals_per_business}
      />

      <SubmitButton pending={pending}>Save settings</SubmitButton>
    </form>
  );
}

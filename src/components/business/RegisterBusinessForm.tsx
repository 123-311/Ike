"use client";

import { useActionState } from "react";
import { registerBusinessAction } from "@/app/business/actions";
import { Field, TextAreaField, SelectField, FormError, SubmitButton } from "@/components/ui/Field";

export default function RegisterBusinessForm({
  categories,
  counties,
}: {
  categories: { id: string; name: string }[];
  counties: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(registerBusinessAction, undefined);

  return (
    <form action={formAction}>
      <FormError message={state?.error} />
      <Field label="Business name" name="name" required />
      <SelectField
        label="Category"
        name="categoryId"
        required
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <SelectField
        label="County"
        name="countyId"
        required
        options={counties.map((c) => ({ value: c.id, label: c.name }))}
      />
      <Field label="Location / address" name="location" required placeholder="e.g. Moi Avenue, near..." />
      <Field label="Phone number" name="phone" required placeholder="0712345678" />
      <Field label="WhatsApp number (optional)" name="whatsapp" placeholder="0712345678" />
      <TextAreaField label="Description" name="description" required placeholder="Tell customers about your business" />
      <Field
        label="Logo image URL (optional)"
        name="logoUrl"
        type="url"
        placeholder="https://example.com/logo.jpg"
      />
      <SubmitButton pending={pending}>Submit for review</SubmitButton>
    </form>
  );
}

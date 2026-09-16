"use client";

import { useActionState } from "react";
import { updateBusinessProfileAction } from "@/app/business/actions";
import { Field, TextAreaField, SelectField, FormError, FormSuccess, SubmitButton } from "@/components/ui/Field";
import type { Business } from "@prisma/client";

export default function EditBusinessForm({
  business,
  categories,
  counties,
}: {
  business: Business;
  categories: { id: string; name: string }[];
  counties: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateBusinessProfileAction, undefined);

  return (
    <form action={formAction}>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <Field label="Business name" name="name" required defaultValue={business.name} />
      <SelectField
        label="Category"
        name="categoryId"
        required
        defaultValue={business.categoryId}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <SelectField
        label="County"
        name="countyId"
        required
        defaultValue={business.countyId}
        options={counties.map((c) => ({ value: c.id, label: c.name }))}
      />
      <Field label="Location / address" name="location" required defaultValue={business.location} />
      <Field label="Phone number" name="phone" required defaultValue={business.phone} />
      <Field label="WhatsApp number (optional)" name="whatsapp" defaultValue={business.whatsapp ?? ""} />
      <TextAreaField label="Description" name="description" required defaultValue={business.description} />
      <Field
        label="Logo image URL (optional)"
        name="logoUrl"
        type="url"
        placeholder="https://example.com/logo.jpg"
        defaultValue={business.logoUrl ?? ""}
      />
      <SubmitButton pending={pending}>Save changes</SubmitButton>
    </form>
  );
}

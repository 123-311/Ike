"use client";

import { useActionState } from "react";
import { Field, TextAreaField, SelectField, FormError, FormSuccess, SubmitButton } from "@/components/ui/Field";
import type { FormState } from "@/app/business/actions";

// A plain, RSC-serializable subset of Deal — Prisma's Decimal fields
// cannot cross the Server->Client Component boundary directly.
export type SerializableDeal = {
  title: string;
  description: string;
  originalPrice: number;
  dealPrice: number;
  categoryId: string;
  countyId: string;
  location: string;
  expiryDate: string; // ISO date string
  imageUrl?: string;
};

export default function DealForm({
  deal,
  categories,
  counties,
  action,
}: {
  deal?: SerializableDeal;
  categories: { id: string; name: string }[];
  counties: { id: string; name: string }[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const expiryDefault = deal ? deal.expiryDate.slice(0, 10) : "";

  return (
    <form action={formAction}>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <Field label="Deal title" name="title" required defaultValue={deal?.title} placeholder="e.g. 50% Off Full Body Massage" />
      <TextAreaField label="Description" name="description" required defaultValue={deal?.description} />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Original price (KSh)"
          name="originalPrice"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={deal ? String(deal.originalPrice) : undefined}
        />
        <Field
          label="Deal price (KSh)"
          name="dealPrice"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={deal ? String(deal.dealPrice) : undefined}
        />
      </div>
      <SelectField
        label="Category"
        name="categoryId"
        required
        defaultValue={deal?.categoryId}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <SelectField
        label="County"
        name="countyId"
        required
        defaultValue={deal?.countyId}
        options={counties.map((c) => ({ value: c.id, label: c.name }))}
      />
      <Field label="Location" name="location" required defaultValue={deal?.location} />
      <Field label="Expiry date" name="expiryDate" type="date" required defaultValue={expiryDefault} />
      <Field
        label="Image URL (optional)"
        name="imageUrl"
        type="url"
        placeholder="https://example.com/photo.jpg"
        defaultValue={deal?.imageUrl}
      />
      <SubmitButton pending={pending}>{deal ? "Save changes" : "Submit for review"}</SubmitButton>
    </form>
  );
}

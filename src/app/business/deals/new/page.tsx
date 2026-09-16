import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusinessOrRedirect } from "@/lib/business";
import { prisma } from "@/lib/db";
import DealForm from "@/components/business/DealForm";
import { createDealAction } from "@/app/business/actions";

export default async function NewDealPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/deals/new");
  await getOwnedBusinessOrRedirect(user);

  const [categories, counties] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.county.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">Add a Deal</h1>
      <p className="text-sm text-muted mb-4">
        Discount and savings are calculated automatically from your prices.
        New deals start as Pending Approval.
      </p>
      <DealForm categories={categories} counties={counties} action={createDealAction} />
    </div>
  );
}

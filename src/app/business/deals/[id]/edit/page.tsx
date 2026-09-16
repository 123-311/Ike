import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusinessOrRedirect } from "@/lib/business";
import { prisma } from "@/lib/db";
import { decimalToNumber } from "@/lib/discount";
import DealForm from "@/components/business/DealForm";
import { updateDealAction } from "@/app/business/actions";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/business/deals/${id}/edit`);
  const business = await getOwnedBusinessOrRedirect(user);

  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal || deal.businessId !== business.id) notFound();

  const [categories, counties] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.county.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const boundAction = updateDealAction.bind(null, deal.id);

  const serializedDeal = {
    title: deal.title,
    description: deal.description,
    originalPrice: decimalToNumber(deal.originalPrice),
    dealPrice: decimalToNumber(deal.dealPrice),
    categoryId: deal.categoryId,
    countyId: deal.countyId,
    location: deal.location,
    expiryDate: deal.expiryDate.toISOString(),
    imageUrl: deal.images[0] ?? "",
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Edit Deal</h1>
      <DealForm deal={serializedDeal} categories={categories} counties={counties} action={boundAction} />
    </div>
  );
}

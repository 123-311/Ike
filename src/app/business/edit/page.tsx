import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusinessOrRedirect } from "@/lib/business";
import { prisma } from "@/lib/db";
import EditBusinessForm from "@/components/business/EditBusinessForm";

export default async function EditBusinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/edit");
  const business = await getOwnedBusinessOrRedirect(user);

  const [categories, counties] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.county.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Manage Business Profile</h1>
      <EditBusinessForm business={business} categories={categories} counties={counties} />
    </div>
  );
}

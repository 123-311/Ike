import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import RegisterBusinessForm from "@/components/business/RegisterBusinessForm";

export default async function BusinessRegisterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/register");

  const existing = await prisma.business.findFirst({ where: { ownerId: user.id } });
  if (existing) redirect("/business");

  const [categories, counties] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.county.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">Register your business</h1>
      <p className="text-sm text-muted mb-6">
        Your business starts as <strong>Pending Verification</strong>. An
        admin reviews and approves it before it becomes publicly visible.
        You keep full customer features the whole time.
      </p>
      <RegisterBusinessForm categories={categories} counties={counties} />
    </div>
  );
}

import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export async function getOwnedBusinessOrRedirect(user: User) {
  const business = await prisma.business.findFirst({ where: { ownerId: user.id } });
  if (!business) redirect("/business/register");
  return business;
}

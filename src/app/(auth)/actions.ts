"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { loginSchema, registerSchema } from "@/lib/validation/schemas";

export type AuthActionState = { error?: string } | undefined;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const ip = await clientIp();
  const rl = checkRateLimit(`register:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) {
    return { error: "An account with that email or phone already exists." };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role: "CUSTOMER",
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const ip = await clientIp();
  const rl = checkRateLimit(`login:${ip}`, 15, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return { error: "Invalid email or password." };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  "use server";
  await destroySession();
  redirect("/");
}

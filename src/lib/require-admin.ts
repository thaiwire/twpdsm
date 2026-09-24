import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

/** Redirects non-admins to a 404 (no admin-only route reveals its existence). */
export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") notFound();
  return session;
}

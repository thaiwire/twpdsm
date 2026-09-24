"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

function uniqueConstraintTarget(err: unknown): string[] | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") {
    return null;
  }
  const target = err.meta?.target;
  return Array.isArray(target) ? (target as string[]) : typeof target === "string" ? [target] : [];
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const email = (formData.get("email") as string).trim().toLowerCase();
  const name = (formData.get("name") as string).trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const departmentId = formData.get("departmentId") as string;

  if (password.length < 8) {
    redirect(
      `/admin/users/new?error=${encodeURIComponent("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")}`
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: { email, name, passwordHash, role, departmentId },
    });
  } catch (err) {
    const target = uniqueConstraintTarget(err);
    if (target) {
      const message = target.includes("email")
        ? `อีเมล "${email}" มีผู้ใช้งานอยู่แล้ว`
        : "ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว";
      redirect(`/admin/users/new?error=${encodeURIComponent(message)}`);
    }
    throw err;
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUser(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  const role = formData.get("role") as string;
  const departmentId = formData.get("departmentId") as string;
  const isActive = formData.get("isActive") === "on";
  const newPassword = (formData.get("newPassword") as string) || "";
  const documentTypeAccessIds = formData.getAll("documentTypeAccess") as string[];

  const data: {
    name: string;
    role: string;
    departmentId: string;
    isActive: boolean;
    passwordHash?: string;
  } = { name, role, departmentId, isActive };

  if (newPassword) {
    if (newPassword.length < 8) {
      redirect(
        `/admin/users/${id}/edit?error=${encodeURIComponent("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")}`
      );
    }
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data }),
      prisma.documentTypeAccess.deleteMany({ where: { userId: id } }),
      prisma.documentTypeAccess.createMany({
        data: documentTypeAccessIds.map((documentTypeId) => ({ userId: id, documentTypeId })),
      }),
    ]);
  } catch (err) {
    if (uniqueConstraintTarget(err)) {
      redirect(
        `/admin/users/${id}/edit?error=${encodeURIComponent("ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว")}`
      );
    }
    throw err;
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();

  if (session.user.id === id) {
    return { error: "ไม่สามารถลบบัญชีของตัวเองได้" };
  }

  const [documentCount, auditCount] = await Promise.all([
    prisma.document.count({ where: { createdById: id } }),
    prisma.documentAudit.count({ where: { userId: id } }),
  ]);

  if (documentCount > 0 || auditCount > 0) {
    return {
      error: `ไม่สามารถลบได้ เนื่องจากผู้ใช้นี้สร้างเอกสาร ${documentCount} รายการ และมีประวัติการใช้งาน ${auditCount} รายการ กรุณาปิดใช้งานแทน`,
    };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  return {};
}

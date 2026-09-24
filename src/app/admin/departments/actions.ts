"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function createDepartment(formData: FormData) {
  await requireAdmin();

  const code = (formData.get("code") as string).trim().toUpperCase();
  const name = (formData.get("name") as string).trim();

  try {
    await prisma.department.create({ data: { code, name } });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      redirect(
        `/admin/departments/new?error=${encodeURIComponent(`รหัสหน่วยงาน "${code}" มีอยู่แล้ว`)}`
      );
    }
    throw err;
  }

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function updateDepartment(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  const isActive = formData.get("isActive") === "on";

  await prisma.department.update({ where: { id }, data: { name, isActive } });
  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function deleteDepartment(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const [userCount, documentCount] = await Promise.all([
    prisma.user.count({ where: { departmentId: id } }),
    prisma.document.count({ where: { departmentId: id } }),
  ]);

  if (userCount > 0 || documentCount > 0) {
    return {
      error: `ไม่สามารถลบได้ เนื่องจากมีผู้ใช้ ${userCount} คน และเอกสาร ${documentCount} รายการผูกอยู่กับหน่วยงานนี้ กรุณาปิดใช้งานแทน`,
    };
  }

  await prisma.department.delete({ where: { id } });
  revalidatePath("/admin/departments");
  return {};
}

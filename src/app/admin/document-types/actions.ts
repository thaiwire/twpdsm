"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function createDocumentType(formData: FormData) {
  await requireAdmin();

  const code = (formData.get("code") as string).trim().toUpperCase();
  const name = (formData.get("name") as string).trim();
  const numberFormat = (formData.get("numberFormat") as string).trim() || "{code}-{year}-{seq:4}";
  const ownerDepartmentId = (formData.get("ownerDepartmentId") as string) || null;

  try {
    await prisma.documentType.create({ data: { code, name, numberFormat, ownerDepartmentId } });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      redirect(
        `/admin/document-types/new?error=${encodeURIComponent(`รหัสประเภท "${code}" มีอยู่แล้ว`)}`
      );
    }
    throw err;
  }

  revalidatePath("/admin/document-types");
  redirect("/admin/document-types");
}

export async function updateDocumentType(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  const numberFormat = (formData.get("numberFormat") as string).trim();
  const isActive = formData.get("isActive") === "on";
  const ownerDepartmentId = (formData.get("ownerDepartmentId") as string) || null;

  await prisma.documentType.update({
    where: { id },
    data: { name, numberFormat, isActive, ownerDepartmentId },
  });
  revalidatePath("/admin/document-types");
  redirect("/admin/document-types");
}

export async function deleteDocumentType(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const documentCount = await prisma.document.count({ where: { documentTypeId: id } });

  if (documentCount > 0) {
    return {
      error: `ไม่สามารถลบได้ เนื่องจากมีเอกสาร ${documentCount} รายการผูกอยู่กับประเภทนี้ กรุณาปิดใช้งานแทน`,
    };
  }

  await prisma.documentType.delete({ where: { id } });
  revalidatePath("/admin/document-types");
  return {};
}

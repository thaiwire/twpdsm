"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  saveAvatarFile,
  deleteAvatarFile,
  isAllowedAvatarMimeType,
  MAX_AVATAR_SIZE_BYTES,
  MAX_AVATAR_SIZE_MB,
} from "@/lib/storage";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword.length < 8) {
    redirect(`/profile?error=${encodeURIComponent("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร")}`);
  }

  if (newPassword !== confirmPassword) {
    redirect(`/profile?error=${encodeURIComponent("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน")}`);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    redirect(`/profile?error=${encodeURIComponent("รหัสผ่านปัจจุบันไม่ถูกต้อง")}`);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } });

  redirect("/profile?success=password");
}

export async function updateAvatar(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    redirect(`/profile?error=${encodeURIComponent("กรุณาเลือกรูปภาพ")}`);
  }

  if (!isAllowedAvatarMimeType(file.type)) {
    redirect(`/profile?error=${encodeURIComponent("รองรับเฉพาะไฟล์รูปภาพ PNG, JPEG, WEBP หรือ GIF")}`);
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    redirect(
      `/profile?error=${encodeURIComponent(`ไฟล์มีขนาดเกิน ${MAX_AVATAR_SIZE_MB} MB กรุณาเลือกไฟล์ที่เล็กลง`)}`
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { avatarPath: true },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storagePath } = await saveAvatarFile(session.user.id, file.name, buffer);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarPath: storagePath },
  });

  if (user.avatarPath) {
    await deleteAvatarFile(user.avatarPath);
  }

  revalidatePath("/profile");
  redirect("/profile?success=avatar");
}

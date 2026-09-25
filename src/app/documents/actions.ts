"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canDeleteDocument, canApproveDocument, canEditDocument } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { deleteDocumentFile, saveDocumentFile, MAX_UPLOAD_SIZE_MB, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage";

export async function deleteDocument(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "กรุณาเข้าสู่ระบบ" };
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: { files: true },
  });

  if (!document) {
    return { error: "ไม่พบเอกสารนี้" };
  }

  if (!canDeleteDocument(session.user, document.departmentId, document.approvedAt !== null)) {
    return {
      error: document.approvedAt
        ? "เอกสารนี้ถูกอนุมัติแล้ว ลบได้เฉพาะหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบ"
        : "ไม่มีสิทธิ์ลบเอกสารนี้",
    };
  }

  await Promise.all(document.files.map((f) => deleteDocumentFile(f.storagePath)));

  // Logged before the delete so it's in the same transaction as the delete
  // itself; documentId is set to NULL (not cascaded away) once the document
  // is gone, but documentNumber/documentTitle keep the row readable — see the
  // schema comment on DocumentAudit for why it isn't CASCADE.
  await prisma.$transaction([
    prisma.documentAudit.create({
      data: {
        documentId: document.id,
        documentNumber: document.documentNumber,
        documentTitle: document.title,
        userId: session.user.id,
        action: "DELETE",
      },
    }),
    prisma.document.delete({ where: { id } }),
  ]);

  revalidatePath("/documents");
  return {};
}

export async function deleteDocumentAttachment(fileId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "กรุณาเข้าสู่ระบบ" };
  }

  const file = await prisma.documentFile.findUnique({
    where: { id: fileId },
    include: { document: true },
  });

  if (!file) {
    return { error: "ไม่พบไฟล์นี้" };
  }

  if (
    !canDeleteDocument(session.user, file.document.departmentId, file.document.approvedAt !== null)
  ) {
    return {
      error: file.document.approvedAt
        ? "เอกสารนี้ถูกอนุมัติแล้ว ลบไฟล์แนบได้เฉพาะหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบ"
        : "ไม่มีสิทธิ์ลบไฟล์นี้",
    };
  }

  await prisma.$transaction([
    prisma.documentFile.delete({ where: { id: fileId } }),
    prisma.documentAudit.create({
      data: {
        documentId: file.document.id,
        documentNumber: file.document.documentNumber,
        documentTitle: file.document.title,
        userId: session.user.id,
        action: "DELETE",
        detail: file.fileName,
      },
    }),
  ]);
  await deleteDocumentFile(file.storagePath);

  revalidatePath(`/documents/${file.documentId}`);
  return {};
}

export async function updateDocument(id: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/documents/${id}/edit?error=${encodeURIComponent("กรุณาเข้าสู่ระบบ")}`);
  }

  const document = await prisma.document.findUnique({ where: { id } });

  if (!document) {
    notFound();
  }

  if (!canEditDocument(session.user, document.departmentId, document.approvedAt !== null)) {
    const message = document.approvedAt
      ? "เอกสารนี้ถูกอนุมัติแล้ว แก้ไขได้เฉพาะหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบ"
      : "ไม่มีสิทธิ์แก้ไขเอกสารนี้";
    redirect(`/documents/${id}/edit?error=${encodeURIComponent(message)}`);
  }

  const title = formData.get("title")?.toString().trim();
  const documentDateRaw = formData.get("documentDate")?.toString();
  const description = formData.get("description")?.toString().trim() || null;

  if (!title) {
    redirect(`/documents/${id}/edit?error=${encodeURIComponent("กรุณาระบุชื่อเอกสาร")}`);
  }
  if (!documentDateRaw) {
    redirect(`/documents/${id}/edit?error=${encodeURIComponent("กรุณาระบุวันที่เอกสาร")}`);
  }

  await prisma.$transaction([
    prisma.document.update({
      where: { id },
      data: { title, description, documentDate: new Date(documentDateRaw) },
    }),
    prisma.documentAudit.create({
      data: {
        documentId: document.id,
        documentNumber: document.documentNumber,
        documentTitle: title,
        userId: session.user.id,
        action: "UPDATE",
      },
    }),
  ]);

  revalidatePath(`/documents/${id}`);
  redirect(`/documents/${id}`);
}

export async function uploadDocumentFiles(id: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/documents/${id}/edit?error=${encodeURIComponent("กรุณาเข้าสู่ระบบ")}`);
  }

  const document = await prisma.document.findUnique({ where: { id } });

  if (!document) {
    notFound();
  }

  if (!canEditDocument(session.user, document.departmentId, document.approvedAt !== null)) {
    const message = document.approvedAt
      ? "เอกสารนี้ถูกอนุมัติแล้ว เพิ่มไฟล์แนบได้เฉพาะหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบ"
      : "ไม่มีสิทธิ์เพิ่มไฟล์แนบให้เอกสารนี้";
    redirect(`/documents/${id}/edit?error=${encodeURIComponent(message)}`);
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    redirect(`/documents/${id}/edit?error=${encodeURIComponent("กรุณาเลือกไฟล์ที่จะอัปโหลด")}`);
  }

  for (const file of files) {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      redirect(
        `/documents/${id}/edit?error=${encodeURIComponent(
          `ไฟล์ ${file.name} มีขนาดเกิน ${MAX_UPLOAD_SIZE_MB}MB`
        )}`
      );
    }
  }

  for (const file of files) {
    const data = Buffer.from(await file.arrayBuffer());
    const saved = await saveDocumentFile(document.id, file.name, data);
    await prisma.$transaction([
      prisma.documentFile.create({
        data: {
          documentId: document.id,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: data.byteLength,
          storagePath: saved.storagePath,
        },
      }),
      prisma.documentAudit.create({
        data: {
          documentId: document.id,
          documentNumber: document.documentNumber,
          documentTitle: document.title,
          userId: session.user.id,
          action: "UPDATE",
          detail: file.name,
        },
      }),
    ]);
  }

  revalidatePath(`/documents/${id}`);
  redirect(`/documents/${id}`);
}

export async function unapproveDocument(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "กรุณาเข้าสู่ระบบ" };
  }

  const document = await prisma.document.findUnique({ where: { id } });

  if (!document) {
    return { error: "ไม่พบเอกสารนี้" };
  }

  if (!canApproveDocument(session.user, document.departmentId)) {
    return { error: "มีเพียงหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบเท่านั้นที่ยกเลิกการอนุมัติได้" };
  }

  if (!document.approvedAt) {
    return { error: "เอกสารนี้ยังไม่ได้รับการอนุมัติ" };
  }

  await prisma.$transaction([
    prisma.document.update({
      where: { id },
      data: { approvedAt: null, approvedById: null },
    }),
    prisma.documentAudit.create({
      data: {
        documentId: document.id,
        documentNumber: document.documentNumber,
        documentTitle: document.title,
        userId: session.user.id,
        action: "UNAPPROVE",
      },
    }),
  ]);

  revalidatePath(`/documents/${id}`);
  return {};
}

export async function approveDocument(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "กรุณาเข้าสู่ระบบ" };
  }

  const document = await prisma.document.findUnique({ where: { id } });

  if (!document) {
    return { error: "ไม่พบเอกสารนี้" };
  }

  if (!canApproveDocument(session.user, document.departmentId)) {
    return { error: "มีเพียงหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบเท่านั้นที่อนุมัติเอกสารได้" };
  }

  if (document.approvedAt) {
    return { error: "เอกสารนี้ถูกอนุมัติไปแล้ว" };
  }

  await prisma.$transaction([
    prisma.document.update({
      where: { id },
      data: { approvedAt: new Date(), approvedById: session.user.id },
    }),
    prisma.documentAudit.create({
      data: {
        documentId: document.id,
        documentNumber: document.documentNumber,
        documentTitle: document.title,
        userId: session.user.id,
        action: "APPROVE",
      },
    }),
  ]);

  revalidatePath(`/documents/${id}`);
  return {};
}

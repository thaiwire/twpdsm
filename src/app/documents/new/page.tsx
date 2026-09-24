import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/document-number";
import { saveDocumentFile, MAX_UPLOAD_SIZE_MB, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage";
import { AppShell } from "@/components/AppShell";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const { error } = await searchParams;

  if (user.role === "VIEWER") notFound();

  const [departments, documentTypes] = await Promise.all([
    prisma.department.findMany({
      where: user.role === "ADMIN" ? { isActive: true } : { id: user.departmentId },
      orderBy: { name: "asc" },
    }),
    prisma.documentType.findMany({
      where: {
        isActive: true,
        // only document types with no owner, or owned by this user's department, are creatable —
        // ADMIN bypasses ownership entirely
        ...(user.role === "ADMIN"
          ? {}
          : { OR: [{ ownerDepartmentId: null }, { ownerDepartmentId: user.departmentId }] }),
      },
      orderBy: { name: "asc" },
    }),
  ]);

  async function createDocument(formData: FormData) {
    "use server";
    const session = await auth();
    const user = session!.user;

    if (user.role === "VIEWER") {
      throw new Error("บัญชีนี้เป็นแบบดูอย่างเดียว ไม่สามารถสร้างเอกสารได้");
    }

    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const documentTypeId = formData.get("documentTypeId") as string;
    const departmentId = formData.get("departmentId") as string;
    const documentDate = new Date(formData.get("documentDate") as string);
    const files = (formData.getAll("files") as File[]).filter((f) => f.size > 0);

    if (user.role !== "ADMIN" && departmentId !== user.departmentId) {
      throw new Error("ไม่มีสิทธิ์สร้างเอกสารให้หน่วยงานอื่น");
    }

    if (user.role !== "ADMIN") {
      const documentType = await prisma.documentType.findUnique({
        where: { id: documentTypeId },
      });
      if (
        documentType?.ownerDepartmentId &&
        documentType.ownerDepartmentId !== user.departmentId
      ) {
        throw new Error("ประเภทเอกสารนี้สงวนสิทธิ์การสร้างไว้ให้หน่วยงานเจ้าของเท่านั้น");
      }
    }

    const oversizedFile = files.find((f) => f.size > MAX_UPLOAD_SIZE_BYTES);
    if (oversizedFile) {
      redirect(
        `/documents/new?error=${encodeURIComponent(
          `ไฟล์ "${oversizedFile.name}" มีขนาดเกิน ${MAX_UPLOAD_SIZE_MB} MB กรุณาเลือกไฟล์ที่เล็กลง`
        )}`
      );
    }

    const documentId = await prisma.$transaction(async (tx) => {
      const documentNumber = await generateDocumentNumber(documentTypeId, tx);

      const doc = await tx.document.create({
        data: {
          documentNumber,
          title,
          description,
          documentTypeId,
          departmentId,
          documentDate,
          createdById: user.id,
        },
      });

      await tx.documentAudit.create({
        data: {
          documentId: doc.id,
          documentNumber: doc.documentNumber,
          documentTitle: doc.title,
          userId: user.id,
          action: "CREATE",
        },
      });

      return doc.id;
    });

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { storagePath } = await saveDocumentFile(documentId, file.name, buffer);
      await prisma.documentFile.create({
        data: {
          documentId,
          fileName: file.name,
          storagePath,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: buffer.byteLength,
        },
      });
    }

    redirect(`/documents/${documentId}`);
  }

  return (
    <AppShell
      userLabel={session!.user.name ?? session!.user.email ?? undefined}
      userId={user.id}
      isAdmin={user.role === "ADMIN"}
      role={user.role}
    >
      <div className="flex justify-center">
        <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">สร้างเอกสารใหม่</h1>
          <p className="mt-1 text-sm text-gray-500">
            กรอกรายละเอียดเอกสาร ระบบจะสร้างเลขที่เอกสารให้อัตโนมัติ
          </p>

          {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form action={createDocument} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อเรื่อง</label>
              <input
                name="title"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รายละเอียด</label>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900">ประเภทเอกสาร</label>
                <select
                  name="documentTypeId"
                  required
                  disabled={documentTypes.length === 0}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {documentTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {documentTypes.length === 0 && (
                  <p className="text-xs text-red-600">
                    หน่วยงานของคุณไม่มีสิทธิ์สร้างเอกสารประเภทใดเลย
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900">หน่วยงาน</label>
                <select
                  name="departmentId"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">วันที่เอกสาร</label>
              <input
                type="date"
                name="documentDate"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ไฟล์แนบ</label>
              <input
                type="file"
                name="files"
                multiple
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                แนบได้หลายไฟล์พร้อมกัน — ขนาดไฟล์สูงสุด {MAX_UPLOAD_SIZE_MB} MB ต่อไฟล์
              </p>
            </div>

            <p className="text-xs text-gray-500">
              เลขที่เอกสารจะถูกสร้างให้อัตโนมัติตามรูปแบบของประเภทเอกสารที่เลือก
            </p>

            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              บันทึกเอกสาร
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

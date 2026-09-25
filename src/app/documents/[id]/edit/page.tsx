import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditDocument, canViewDocument } from "@/lib/access";
import { AppShell } from "@/components/AppShell";
import { FilePreview } from "@/components/FilePreview";
import { DeleteButton } from "@/components/DeleteButton";
import { MAX_UPLOAD_SIZE_MB } from "@/lib/storage";
import { updateDocument, uploadDocumentFiles, deleteDocumentAttachment } from "../../actions";

export default async function EditDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await auth();
  const user = session!.user;

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { documentType: true, department: true, files: true },
  });

  if (!doc) notFound();
  if (!(await canViewDocument(user, doc.departmentId, doc.documentTypeId))) notFound();

  const isApproved = doc.approvedAt !== null;
  if (!canEditDocument(user, doc.departmentId, isApproved)) notFound();

  const updateDocumentWithId = updateDocument.bind(null, id);
  const uploadDocumentFilesWithId = uploadDocumentFiles.bind(null, id);

  return (
    <AppShell
      userLabel={session!.user.name ?? session!.user.email ?? undefined}
      userId={user.id}
      isAdmin={user.role === "ADMIN"}
      role={user.role}
    >
      <div className="mx-auto max-w-2xl">
        <Link href={`/documents/${id}`} className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปหน้ารายละเอียดเอกสาร
        </Link>

        <div className="mt-3 rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">แก้ไขเอกสาร</h1>
          <p className="mt-1 font-mono text-sm text-gray-500">{doc.documentNumber}</p>

          {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form action={updateDocumentWithId} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อเรื่อง</label>
              <input
                name="title"
                required
                defaultValue={doc.title}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รายละเอียด</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={doc.description ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900">ประเภทเอกสาร</label>
                <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                  {doc.documentType.name}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900">หน่วยงาน</label>
                <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                  {doc.department.name}
                </p>
              </div>
            </div>
            <p className="-mt-3 text-xs text-gray-500">
              ไม่สามารถเปลี่ยนประเภทเอกสารหรือหน่วยงานได้ เนื่องจากเลขที่เอกสารถูกสร้างขึ้นตามค่านี้แล้ว
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">วันที่เอกสาร</label>
              <input
                type="date"
                name="documentDate"
                required
                defaultValue={doc.documentDate.toISOString().slice(0, 10)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              บันทึกการแก้ไข
            </button>
          </form>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-sm font-semibold text-gray-900">ไฟล์แนบ</h2>
          <ul className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-200 text-sm">
            {doc.files.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-4 py-2.5">
                <span>{f.fileName}</span>
                <div className="flex items-center gap-4">
                  <FilePreview
                    fileName={f.fileName}
                    mimeType={f.mimeType}
                    previewUrl={`/api/documents/${doc.id}/files/${f.id}?inline=1`}
                  />
                  <a
                    href={`/api/documents/${doc.id}/files/${f.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    ดาวน์โหลด
                  </a>
                  <DeleteButton
                    id={f.id}
                    itemLabel={`ไฟล์ ${f.fileName}`}
                    action={deleteDocumentAttachment}
                  />
                </div>
              </li>
            ))}
            {doc.files.length === 0 && (
              <li className="px-4 py-3 text-gray-400">ไม่มีไฟล์แนบ</li>
            )}
          </ul>

          <form action={uploadDocumentFilesWithId} className="mt-4 space-y-1.5">
            <label className="text-sm font-semibold text-gray-900">เพิ่มไฟล์แนบ</label>
            <input
              type="file"
              name="files"
              multiple
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              แนบได้หลายไฟล์พร้อมกัน — ขนาดไฟล์สูงสุด {MAX_UPLOAD_SIZE_MB} MB ต่อไฟล์
            </p>
            <button
              type="submit"
              className="mt-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              อัปโหลดไฟล์
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

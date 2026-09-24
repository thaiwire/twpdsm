import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDeleteDocument, canApproveDocument, canViewDocument } from "@/lib/access";
import { AppShell } from "@/components/AppShell";
import { FilePreview } from "@/components/FilePreview";
import { FormattedDate } from "@/components/FormattedDate";
import { DeleteButton } from "@/components/DeleteButton";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { ApproveButton } from "@/components/ApproveButton";
import { deleteDocument, deleteDocumentAttachment, approveDocument } from "../actions";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user;

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      department: true,
      documentType: true,
      createdBy: true,
      approvedBy: true,
      files: true,
    },
  });

  if (!doc) notFound();
  if (!(await canViewDocument(user, doc.departmentId, doc.documentTypeId))) notFound();

  const isApproved = doc.approvedAt !== null;
  const canDelete = canDeleteDocument(user, doc.departmentId, isApproved);
  const canApprove = !isApproved && canApproveDocument(user, doc.departmentId);

  return (
    <AppShell
      userLabel={session!.user.name ?? session!.user.email ?? undefined}
      userId={user.id}
      isAdmin={user.role === "ADMIN"}
      role={user.role}
    >
      <div className="mx-auto max-w-2xl">
        <Link href="/documents" className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปรายการเอกสาร
        </Link>

        <div className="mt-3 rounded-lg bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{doc.title}</h1>
              <p className="mt-1 font-mono text-sm text-gray-500">{doc.documentNumber}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {canApprove && (
                <ApproveButton
                  id={doc.id}
                  itemLabel={`เอกสาร ${doc.documentNumber}`}
                  action={approveDocument}
                />
              )}
              {canDelete && (
                <DeleteDocumentButton
                  id={doc.id}
                  itemLabel={`เอกสาร ${doc.documentNumber}`}
                  action={deleteDocument}
                />
              )}
            </div>
          </div>

          <div className="mt-4">
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                ✓ อนุมัติแล้ว โดย {doc.approvedBy?.name}
                {doc.approvedAt && (
                  <>
                    {" "}
                    เมื่อ <FormattedDate date={doc.approvedAt} />
                  </>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                รออนุมัติ
              </span>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-gray-500">ประเภทเอกสาร</dt>
            <dd>{doc.documentType.name}</dd>

            <dt className="text-gray-500">หน่วยงาน</dt>
            <dd>{doc.department.name}</dd>

            <dt className="text-gray-500">วันที่เอกสาร</dt>
            <dd>
              <FormattedDate date={doc.documentDate} />
            </dd>

            <dt className="text-gray-500">สถานะ</dt>
            <dd>{doc.status}</dd>

            <dt className="text-gray-500">สร้างโดย</dt>
            <dd>{doc.createdBy.name}</dd>

            {doc.description && (
              <>
                <dt className="text-gray-500">รายละเอียด</dt>
                <dd className="whitespace-pre-wrap">{doc.description}</dd>
              </>
            )}
          </dl>

          <h2 className="mt-8 text-sm font-semibold text-gray-900">ไฟล์แนบ</h2>
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
                  {canDelete && (
                    <DeleteButton
                      id={f.id}
                      itemLabel={`ไฟล์ ${f.fileName}`}
                      action={deleteDocumentAttachment}
                    />
                  )}
                </div>
              </li>
            ))}
            {doc.files.length === 0 && (
              <li className="px-4 py-3 text-gray-400">ไม่มีไฟล์แนบ</li>
            )}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

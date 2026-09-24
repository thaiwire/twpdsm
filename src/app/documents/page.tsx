import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentScopeFilter, canDeleteDocument } from "@/lib/access";
import { AppShell } from "@/components/AppShell";
import { DeleteButton } from "@/components/DeleteButton";
import { FilePreview } from "@/components/FilePreview";
import { FormattedDate } from "@/components/FormattedDate";
import { Pagination } from "@/components/Pagination";
import { DOCUMENTS_PAGE_SIZE } from "@/lib/config";
import { deleteDocument } from "./actions";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dateFrom?: string; dateTo?: string; page?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const { q, dateFrom, dateTo, page: pageParam } = await searchParams;

  const documentDateFilter: { gte?: Date; lte?: Date } = {};
  if (dateFrom) documentDateFilter.gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    documentDateFilter.lte = end;
  }

  const where = {
    AND: [
      await documentScopeFilter(user),
      ...(q
        ? [{ OR: [{ documentNumber: { contains: q } }, { title: { contains: q } }] }]
        : []),
      ...(dateFrom || dateTo ? [{ documentDate: documentDateFilter }] : []),
    ],
  };

  const totalCount = await prisma.document.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / DOCUMENTS_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(pageParam) || 1));

  const documents = await prisma.document.findMany({
    where,
    include: {
      department: true,
      documentType: true,
      files: { select: { id: true, fileName: true, mimeType: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * DOCUMENTS_PAGE_SIZE,
    take: DOCUMENTS_PAGE_SIZE,
  });

  const canDelete = new Map(
    documents.map((doc) => [
      doc.id,
      canDeleteDocument(user, doc.departmentId, doc.approvedAt !== null),
    ])
  );

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/documents?${qs}` : "/documents";
  }

  return (
    <AppShell
      userLabel={session!.user.name ?? session!.user.email ?? undefined}
      userId={user.id}
      isAdmin={user.role === "ADMIN"}
      role={user.role}
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">เอกสารทั้งหมด</h1>
            <p className="text-sm text-gray-500">
              {user.role === "ADMIN" || user.role === "VIEWER"
                ? "ทุกหน่วยงาน"
                : `หน่วยงาน: ${user.departmentName}`}
            </p>
          </div>
          {user.role !== "VIEWER" && (
            <Link
              href="/documents/new"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + สร้างเอกสาร
            </Link>
          )}
        </header>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form className="mb-6 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">เลขที่เอกสาร / ชื่อเรื่อง</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="ค้นหาตามเลขที่เอกสารหรือชื่อเรื่อง..."
                className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">วันที่เอกสารตั้งแต่</label>
              <input
                type="date"
                name="dateFrom"
                defaultValue={dateFrom}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">ถึงวันที่</label>
              <input
                type="date"
                name="dateTo"
                defaultValue={dateTo}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              ค้นหา
            </button>
            {(q || dateFrom || dateTo) && (
              <Link
                href="/documents"
                className="px-2 py-2 text-sm text-gray-500 hover:underline"
              >
                ล้างตัวกรอง
              </Link>
            )}
          </form>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">เลขที่เอกสาร</th>
                  <th className="px-4 py-3">ชื่อเรื่อง</th>
                  <th className="px-4 py-3">ประเภท</th>
                  <th className="px-4 py-3">หน่วยงาน</th>
                  <th className="px-4 py-3">วันที่เอกสาร</th>
                  <th className="px-4 py-3">ไฟล์แนบ</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {doc.documentNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{doc.title}</td>
                    <td className="px-4 py-3">{doc.documentType.name}</td>
                    <td className="px-4 py-3">{doc.department.name}</td>
                    <td className="px-4 py-3">
                      <FormattedDate date={doc.documentDate} />
                    </td>
                    <td className="px-4 py-3">
                      {doc.files.length === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : doc.files.length === 1 ? (
                        <div className="flex items-center gap-3">
                          <FilePreview
                            fileName={doc.files[0].fileName}
                            mimeType={doc.files[0].mimeType}
                            previewUrl={`/api/documents/${doc.id}/files/${doc.files[0].id}?inline=1`}
                          />
                          <a
                            href={`/api/documents/${doc.id}/files/${doc.files[0].id}`}
                            className="text-blue-600 hover:underline"
                          >
                            ดาวน์โหลด
                          </a>
                        </div>
                      ) : (
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {doc.files.length} ไฟล์
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {doc.approvedAt ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          อนุมัติแล้ว
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          รออนุมัติ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete.get(doc.id) && (
                        <DeleteButton
                          id={doc.id}
                          itemLabel={`เอกสาร ${doc.documentNumber}`}
                          action={deleteDocument}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      ไม่พบเอกสาร
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} buildHref={buildPageHref} />
        </div>
      </div>
    </AppShell>
  );
}

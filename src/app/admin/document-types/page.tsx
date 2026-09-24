import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteDocumentType } from "./actions";

export default async function DocumentTypesAdminPage() {
  const session = await requireAdmin();

  const documentTypes = await prisma.documentType.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } }, ownerDepartment: true },
  });

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">จัดการประเภทเอกสาร</h1>
            <p className="text-sm text-gray-500">
              กำหนดประเภทเอกสารและรูปแบบเลขที่เอกสาร เช่น{" "}
              <code className="rounded bg-gray-100 px-1">{"{code}-{year}-{seq:4}"}</code>
            </p>
          </div>
          <Link
            href="/admin/document-types/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + เพิ่มประเภทเอกสาร
          </Link>
        </header>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">รหัส</th>
                <th className="px-4 py-3">ชื่อประเภทเอกสาร</th>
                <th className="px-4 py-3">รูปแบบเลขที่เอกสาร</th>
                <th className="px-4 py-3">หน่วยงานเจ้าของ</th>
                <th className="px-4 py-3">เอกสาร</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documentTypes.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-mono text-gray-500">{t.code}</td>
                  <td className="px-4 py-3 text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.numberFormat}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {t.ownerDepartment ? (
                      t.ownerDepartment.name
                    ) : (
                      <span className="text-gray-400">ทุกหน่วยงาน</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t._count.documents}</td>
                  <td className="px-4 py-3">
                    {t.isActive ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        ใช้งาน
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        ปิดใช้งาน
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/document-types/${t.id}/edit`}
                        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        แก้ไข
                      </Link>
                      <DeleteButton
                        id={t.id}
                        itemLabel={`ประเภทเอกสาร ${t.name}`}
                        action={deleteDocumentType}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {documentTypes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    ยังไม่มีประเภทเอกสาร
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

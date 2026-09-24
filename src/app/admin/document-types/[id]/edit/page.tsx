import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { updateDocumentType } from "../../actions";

export default async function EditDocumentTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();

  const [documentType, departments] = await Promise.all([
    prisma.documentType.findUnique({ where: { id } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  if (!documentType) notFound();

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/admin/document-types" className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปรายการประเภทเอกสาร
        </Link>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">แก้ไขประเภทเอกสาร</h1>
          <p className="mt-1 text-sm text-gray-500">รหัสประเภท: {documentType.code}</p>

          <form action={updateDocumentType} className="mt-6 space-y-5">
            <input type="hidden" name="id" value={documentType.id} />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อประเภทเอกสาร</label>
              <input
                name="name"
                required
                defaultValue={documentType.name}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รูปแบบเลขที่เอกสาร</label>
              <input
                name="numberFormat"
                required
                defaultValue={documentType.numberFormat}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">หน่วยงานเจ้าของ</label>
              <select
                name="ownerDepartmentId"
                defaultValue={documentType.ownerDepartmentId ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">ทุกหน่วยงานสร้างได้ (ไม่กำหนดเจ้าของ)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                ถ้ากำหนดหน่วยงานเจ้าของ จะมีเพียงหน่วยงานนั้นเท่านั้นที่สร้างเอกสารประเภทนี้ได้
                หน่วยงานอื่นจะดูได้อย่างเดียว
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked={documentType.isActive} />
              ใช้งาน
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                บันทึกการแก้ไข
              </button>
              <Link
                href="/admin/document-types"
                className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ยกเลิก
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

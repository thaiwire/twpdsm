import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { createDocumentType } from "../actions";

export default async function NewDocumentTypePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAdmin();
  const { error } = await searchParams;

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

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
          <h1 className="text-xl font-semibold text-gray-900">เพิ่มประเภทเอกสารใหม่</h1>
          <p className="mt-1 text-sm text-gray-500">
            กำหนดรหัส ชื่อ และรูปแบบเลขที่เอกสาร เช่น{" "}
            <code className="rounded bg-gray-100 px-1">{"{code}-{year}-{seq:4}"}</code>
          </p>

          {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form action={createDocumentType} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รหัสประเภท</label>
              <input
                name="code"
                required
                maxLength={20}
                placeholder="MEMO"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อประเภทเอกสาร</label>
              <input
                name="name"
                required
                placeholder="บันทึกข้อความ"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รูปแบบเลขที่เอกสาร</label>
              <input
                name="numberFormat"
                defaultValue="{code}-{year}-{seq:4}"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">หน่วยงานเจ้าของ</label>
              <select
                name="ownerDepartmentId"
                defaultValue=""
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

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                เพิ่มประเภทเอกสาร
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

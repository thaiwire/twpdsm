import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { AppShell } from "@/components/AppShell";
import { createDepartment } from "../actions";

export default async function NewDepartmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAdmin();
  const { error } = await searchParams;

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/admin/departments" className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปรายการหน่วยงาน
        </Link>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">เพิ่มหน่วยงานใหม่</h1>
          <p className="mt-1 text-sm text-gray-500">กรอกรหัสและชื่อหน่วยงาน</p>

          {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form action={createDepartment} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รหัสหน่วยงาน</label>
              <input
                name="code"
                required
                maxLength={20}
                placeholder="HR"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อหน่วยงาน</label>
              <input
                name="name"
                required
                placeholder="ฝ่ายทรัพยากรบุคคล"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                เพิ่มหน่วยงาน
              </button>
              <Link
                href="/admin/departments"
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

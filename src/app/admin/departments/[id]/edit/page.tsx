import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { updateDepartment } from "../../actions";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();

  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) notFound();

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
          <h1 className="text-xl font-semibold text-gray-900">แก้ไขหน่วยงาน</h1>
          <p className="mt-1 text-sm text-gray-500">รหัสหน่วยงาน: {department.code}</p>

          <form action={updateDepartment} className="mt-6 space-y-5">
            <input type="hidden" name="id" value={department.id} />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อหน่วยงาน</label>
              <input
                name="name"
                required
                defaultValue={department.name}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked={department.isActive} />
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

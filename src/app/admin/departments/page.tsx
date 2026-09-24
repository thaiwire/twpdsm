import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteDepartment } from "./actions";

export default async function DepartmentsAdminPage() {
  const session = await requireAdmin();

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, documents: true } } },
  });

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">จัดการหน่วยงาน</h1>
            <p className="text-sm text-gray-500">เพิ่ม แก้ไข หรือปิดใช้งานหน่วยงาน</p>
          </div>
          <Link
            href="/admin/departments/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + เพิ่มหน่วยงาน
          </Link>
        </header>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">รหัส</th>
                <th className="px-4 py-3">ชื่อหน่วยงาน</th>
                <th className="px-4 py-3">ผู้ใช้</th>
                <th className="px-4 py-3">เอกสาร</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departments.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-mono text-gray-500">{d.code}</td>
                  <td className="px-4 py-3 text-gray-900">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500">{d._count.users}</td>
                  <td className="px-4 py-3 text-gray-500">{d._count.documents}</td>
                  <td className="px-4 py-3">
                    {d.isActive ? (
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
                        href={`/admin/departments/${d.id}/edit`}
                        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        แก้ไข
                      </Link>
                      <DeleteButton
                        id={d.id}
                        itemLabel={`หน่วยงาน ${d.name}`}
                        action={deleteDepartment}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    ยังไม่มีหน่วยงาน
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

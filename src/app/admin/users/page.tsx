import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteUser } from "./actions";

export default async function UsersAdminPage() {
  const session = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { department: true },
  });

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">จัดการผู้ใช้งาน</h1>
            <p className="text-sm text-gray-500">เพิ่ม แก้ไขสิทธิ์ หรือปิดใช้งานบัญชีผู้ใช้</p>
          </div>
          <Link
            href="/admin/users/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + เพิ่มผู้ใช้
          </Link>
        </header>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">สิทธิ์</th>
                <th className="px-4 py-3">หน่วยงาน</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.department.name}</td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
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
                        href={`/admin/users/${u.id}/edit`}
                        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        แก้ไข
                      </Link>
                      {u.id !== session.user.id && (
                        <DeleteButton
                          id={u.id}
                          itemLabel={`ผู้ใช้ ${u.name}`}
                          action={deleteUser}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    ยังไม่มีผู้ใช้
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

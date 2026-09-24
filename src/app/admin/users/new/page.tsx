import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { PasswordInput } from "@/components/PasswordInput";
import { createUser } from "../actions";

export default async function NewUserPage({
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
        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปรายการผู้ใช้งาน
        </Link>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">เพิ่มผู้ใช้ใหม่</h1>
          <p className="mt-1 text-sm text-gray-500">กรอกข้อมูลบัญชีผู้ใช้และกำหนดสิทธิ์</p>

          {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form action={createUser} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อ</label>
              <input
                name="name"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">อีเมล</label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รหัสผ่าน</label>
              <PasswordInput
                name="password"
                required
                minLength={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900">สิทธิ์</label>
                <select
                  name="role"
                  defaultValue="STAFF"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER (อนุมัติ/ลบเอกสารที่อนุมัติแล้วในหน่วยงานตน)</option>
                  <option value="VIEWER">VIEWER (ดูอย่างเดียว ทุกหน่วยงาน)</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900">หน่วยงาน</label>
                <select
                  name="departmentId"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                เพิ่มผู้ใช้
              </button>
              <Link
                href="/admin/users"
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

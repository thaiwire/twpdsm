import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { PasswordInput } from "@/components/PasswordInput";
import { updateUser } from "../../actions";

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await requireAdmin();

  const [user, departments, documentTypes, grantedAccess] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.documentType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.documentTypeAccess.findMany({ where: { userId: id }, select: { documentTypeId: true } }),
  ]);

  if (!user) notFound();

  const grantedTypeIds = new Set(grantedAccess.map((g) => g.documentTypeId));

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
          <h1 className="text-xl font-semibold text-gray-900">แก้ไขผู้ใช้งาน</h1>
          <p className="mt-1 text-sm text-gray-500">{user.email}</p>

          {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form action={updateUser} className="mt-6 space-y-5">
            <input type="hidden" name="id" value={user.id} />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อ</label>
              <input
                name="name"
                required
                defaultValue={user.name}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900">สิทธิ์</label>
                <select
                  name="role"
                  defaultValue={user.role}
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
                  defaultValue={user.departmentId}
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

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รหัสผ่านใหม่</label>
              <PasswordInput
                name="newPassword"
                minLength={8}
                placeholder="เว้นว่างถ้าไม่ต้องการเปลี่ยนรหัสผ่าน"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked={user.isActive} />
              ใช้งาน
            </label>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">
                สิทธิ์ดูเอกสารข้ามหน่วยงาน (ตามประเภทเอกสาร)
              </label>
              <p className="text-xs text-gray-500">
                เลือกประเภทเอกสารที่ผู้ใช้นี้จะเห็นได้จากทุกหน่วยงาน นอกเหนือจากเอกสารของหน่วยงานตัวเอง
                เช่น ให้ฝ่ายบัญชีดู &ldquo;ใบกำกับภาษี&rdquo; ของทุกหน่วยงานได้
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-md border border-gray-200 p-3">
                {documentTypes.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="documentTypeAccess"
                      value={t.id}
                      defaultChecked={grantedTypeIds.has(t.id)}
                    />
                    {t.name}
                  </label>
                ))}
                {documentTypes.length === 0 && (
                  <p className="text-sm text-gray-400">ยังไม่มีประเภทเอกสาร</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                บันทึกการแก้ไข
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

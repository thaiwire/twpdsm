import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { PasswordInput } from "@/components/PasswordInput";
import { MAX_AVATAR_SIZE_MB } from "@/lib/storage";
import { changePassword, updateAvatar } from "./actions";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { error, success } = await searchParams;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { department: true },
  });

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin={session.user.role === "ADMIN"}
      role={session.user.role}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">โปรไฟล์ของฉัน</h1>
          <p className="text-sm text-gray-500">
            {user.name} — {user.email} — {user.department.name}
          </p>
        </header>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        {success === "password" && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            เปลี่ยนรหัสผ่านสำเร็จ
          </p>
        )}
        {success === "avatar" && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            อัปเดตรูปโปรไฟล์สำเร็จ
          </p>
        )}

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">รูปโปรไฟล์</h2>
          <div className="mt-4 flex items-center gap-6">
            {user.avatarPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/users/${user.id}/avatar`}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl text-gray-500">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}

            <form action={updateAvatar} className="flex-1 space-y-2">
              <input
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp,image/gif"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                รองรับ PNG, JPEG, WEBP, GIF — ขนาดไฟล์สูงสุด {MAX_AVATAR_SIZE_MB} MB
              </p>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                อัปโหลดรูปใหม่
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">เปลี่ยนรหัสผ่าน</h2>
          <form action={changePassword} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</label>
              <PasswordInput
                name="currentPassword"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
              <PasswordInput
                name="newPassword"
                required
                minLength={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
              <PasswordInput
                name="confirmPassword"
                required
                minLength={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              เปลี่ยนรหัสผ่าน
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/SidebarNav";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function AppShell({
  children,
  userLabel,
  userId,
  isAdmin,
  role,
}: {
  children: ReactNode;
  userLabel?: string;
  userId?: string;
  isAdmin?: boolean;
  role?: string;
}) {
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { avatarPath: true } })
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between bg-[#0f1420] px-6 text-white">
        <span className="text-lg font-semibold">ระบบจัดเก็บเอกสาร</span>
        {userLabel && (
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <Link href="/profile" className="flex items-center gap-2 hover:text-white">
              {user?.avatarPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/users/${userId}/avatar`}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-600 text-xs">
                  {userLabel.charAt(0).toUpperCase()}
                </span>
              )}
              <span>{userLabel}</span>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded border border-gray-600 px-3 py-1 hover:bg-white/10">
                ออกจากระบบ
              </button>
            </form>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        <SidebarNav isAdmin={isAdmin} canCreateDocuments={role !== "VIEWER"} />
        <main className="flex-1 bg-gray-100 p-8">{children}</main>
      </div>
    </div>
  );
}

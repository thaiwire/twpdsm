import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { Pagination } from "@/components/Pagination";
import { FormattedDate } from "@/components/FormattedDate";
import { AUDIT_LOG_PAGE_SIZE } from "@/lib/config";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "สร้างเอกสาร",
  DOWNLOAD: "ดาวน์โหลด",
  DELETE: "ลบ",
  UPDATE: "แก้ไข",
  ARCHIVE: "จัดเก็บถาวร",
  APPROVE: "อนุมัติ",
};

const ACTION_BADGE_CLASSES: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  DOWNLOAD: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  APPROVE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-amber-100 text-amber-700",
  ARCHIVE: "bg-gray-100 text-gray-600",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; userId?: string; page?: string }>;
}) {
  const session = await requireAdmin();
  const { q, action, userId, page: pageParam } = await searchParams;

  const where = {
    ...(q
      ? {
          OR: [
            { documentNumber: { contains: q } },
            { documentTitle: { contains: q } },
          ],
        }
      : {}),
    ...(action ? { action } : {}),
    ...(userId ? { userId } : {}),
  };

  const totalCount = await prisma.documentAudit.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / AUDIT_LOG_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(pageParam) || 1));

  const [logs, users] = await Promise.all([
    prisma.documentAudit.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_LOG_PAGE_SIZE,
      take: AUDIT_LOG_PAGE_SIZE,
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (action) params.set("action", action);
    if (userId) params.set("userId", userId);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/admin/audit-log?${qs}` : "/admin/audit-log";
  }

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">ประวัติการใช้งานเอกสาร</h1>
          <p className="text-sm text-gray-500">
            ตรวจสอบว่าใครสร้าง ลบ หรือดาวน์โหลดเอกสารเมื่อใด — รายการยังคงอยู่แม้เอกสารต้นฉบับถูกลบไปแล้ว
          </p>
        </header>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form className="mb-6 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">เลขที่เอกสาร / ชื่อเรื่อง</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="ค้นหา..."
                className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">การกระทำ</label>
              <select
                name="action"
                defaultValue={action ?? ""}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">ทั้งหมด</option>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">ผู้ใช้</label>
              <select
                name="userId"
                defaultValue={userId ?? ""}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">ทั้งหมด</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              ค้นหา
            </button>
            {(q || action || userId) && (
              <Link
                href="/admin/audit-log"
                className="px-2 py-2 text-sm text-gray-500 hover:underline"
              >
                ล้างตัวกรอง
              </Link>
            )}
          </form>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">วันที่/เวลา</th>
                  <th className="px-4 py-3">การกระทำ</th>
                  <th className="px-4 py-3">เอกสาร</th>
                  <th className="px-4 py-3">โดย</th>
                  <th className="px-4 py-3">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      <FormattedDate date={log.createdAt} /> {log.createdAt.toTimeString().slice(0, 5)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          ACTION_BADGE_CLASSES[log.action] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.documentId ? (
                        <Link
                          href={`/documents/${log.documentId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {log.documentNumber}
                        </Link>
                      ) : (
                        <span title="เอกสารนี้ถูกลบไปแล้ว">{log.documentNumber}</span>
                      )}
                      <span className="block text-xs text-gray-400">{log.documentTitle}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.user.name}
                      <span className="block text-xs text-gray-400">{log.user.email}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.detail ?? "-"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      ไม่พบประวัติการใช้งาน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} buildHref={buildPageHref} />
        </div>
      </div>
    </AppShell>
  );
}

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  role: string;
  departmentId: string;
};

/** Roles that are scoped to their own department (as opposed to ADMIN/VIEWER, who see everything). */
function isDepartmentScopedRole(role: string): boolean {
  return role === "STAFF" || role === "MANAGER";
}

/**
 * Document type IDs this user can view across ALL departments, on top of
 * their own department's documents — granted per-user via DocumentTypeAccess
 * (e.g. an accounting staff member given access to "ใบกำกับภาษี" so they can
 * see invoices raised by sales, without seeing sales' other document types).
 * Admins and VIEWERs already see everything, so this is only meaningful for
 * department-scoped roles (STAFF/MANAGER); returns [] otherwise to avoid an
 * unnecessary query.
 */
export async function extraViewableDocumentTypeIds(user: SessionUser): Promise<string[]> {
  if (!isDepartmentScopedRole(user.role)) return [];
  const grants = await prisma.documentTypeAccess.findMany({
    where: { userId: user.id },
    select: { documentTypeId: true },
  });
  return grants.map((g) => g.documentTypeId);
}

/**
 * Admins and viewers see all departments; staff/managers are scoped to their
 * own department, plus any document types they've been granted
 * cross-department access to via DocumentTypeAccess. VIEWER is a read-only,
 * cross-department role (e.g. an executive who needs to see everything) — it
 * never grants create/edit/delete or access to /admin/*.
 */
export async function documentScopeFilter(
  user: SessionUser
): Promise<Prisma.DocumentWhereInput> {
  if (user.role === "ADMIN" || user.role === "VIEWER") return {};

  const extraTypeIds = await extraViewableDocumentTypeIds(user);
  if (extraTypeIds.length === 0) {
    return { departmentId: user.departmentId };
  }

  return {
    OR: [{ departmentId: user.departmentId }, { documentTypeId: { in: extraTypeIds } }],
  };
}

/** Can view/preview/download/print a document — same as the read scope above. */
export async function canViewDocument(
  user: SessionUser,
  documentDepartmentId: string,
  documentTypeId: string
): Promise<boolean> {
  if (user.role === "ADMIN" || user.role === "VIEWER") return true;
  if (user.departmentId === documentDepartmentId) return true;

  const extraTypeIds = await extraViewableDocumentTypeIds(user);
  return extraTypeIds.includes(documentTypeId);
}

/** Can create/edit a document — VIEWER and cross-department type access are excluded, unlike canViewDocument. */
export function canManageDocument(user: SessionUser, documentDepartmentId: string) {
  if (user.role === "VIEWER") return false;
  return user.role === "ADMIN" || user.departmentId === documentDepartmentId;
}

/**
 * Can approve a document (mark it as ถูกต้องแล้ว) — only ADMIN, or a MANAGER
 * in the same department as the document. Plain STAFF/VIEWER never can, even
 * for their own department's documents.
 */
export function canApproveDocument(user: SessionUser, documentDepartmentId: string) {
  if (user.role === "ADMIN") return true;
  return user.role === "MANAGER" && user.departmentId === documentDepartmentId;
}

/**
 * Can delete a document or one of its attachments. Once a document is
 * approved (approvedAt is set), only ADMIN or a MANAGER in the same
 * department may delete it or its files — the point of approval is that an
 * ordinary STAFF member (even the one who created it) can no longer remove
 * it. Unapproved documents follow the normal canManageDocument rule.
 */
export function canDeleteDocument(
  user: SessionUser,
  documentDepartmentId: string,
  isApproved: boolean
) {
  if (!isApproved) return canManageDocument(user, documentDepartmentId);
  return canApproveDocument(user, documentDepartmentId);
}

/**
 * Can edit a document's fields, or add/remove attachments on it. Same gate as
 * canDeleteDocument — once approved, only ADMIN or a MANAGER in the same
 * department may still change it (a plain STAFF member can no longer edit an
 * approved document, even the one they created). Kept as a distinct function
 * from canDeleteDocument (even though the rule is currently identical) since
 * "who can edit" and "who can delete" are separate questions that could
 * diverge later — don't collapse them into one just because they match today.
 */
export function canEditDocument(
  user: SessionUser,
  documentDepartmentId: string,
  isApproved: boolean
) {
  if (!isApproved) return canManageDocument(user, documentDepartmentId);
  return canApproveDocument(user, documentDepartmentId);
}

export function isAdmin(user: SessionUser) {
  return user.role === "ADMIN";
}

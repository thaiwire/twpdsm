# ระบบจัดเก็บเอกสารภายในองค์กร (twp_document_system)

Internal document management system. Next.js (App Router) + Prisma 7 + Microsoft SQL Server.

## Data model

- **User** — login account, belongs to one `Department`, has a `role` of `ADMIN`, `MANAGER`, `STAFF`, or `VIEWER`.
- **Department** (หน่วยงาน) — organizational unit. Staff only see documents belonging to their own department; admins see everything.
- **DocumentType** (ประเภทเอกสาร) — e.g. บันทึกข้อความ, สัญญา. Carries a `numberFormat` template (e.g. `{code}-{year}-{seq:4}`) used to auto-generate document numbers. Optionally has an `ownerDepartmentId` — when set, only that department (or ADMIN) can *create* documents of this type; other departments can still view it if their department already has visibility, or via `DocumentTypeAccess`.
- **DocumentTypeAccess** — per-user grant to *view* a document type across all departments (not just create it) — e.g. an accounting staff member given view access to "ใบกำกับภาษี" raised by sales, without any create/edit/delete rights.
- **Document** — the record itself. `documentNumber` (เลขที่เอกสาร) is unique and is the primary search key. `approvedAt`/`approvedById` are set once a MANAGER (or ADMIN) approves it as ถูกต้องแล้ว — see Approval below.
- **DocumentFile** — one or more file attachments per document, stored on local disk under `storage/documents/<documentId>/` ([src/lib/storage.ts](src/lib/storage.ts)) with only metadata (name, path, mime type, size) in the DB.
- **DocumentAudit** — append-only log of create/download/delete/approve actions per document/user, for traceability. `documentId` is nullable with `onDelete: SetNull` (not `Cascade`) — deleting a document must not also erase the log entry that recorded *who* deleted it, so `documentNumber`/`documentTitle` are snapshotted onto the row at write time, keeping the log readable even after the source document is gone. See [/admin/audit-log](src/app/admin/audit-log/page.tsx).

See [prisma/schema.prisma](prisma/schema.prisma) for the full schema. Note: SQL Server has no native enum type and disallows multiple cascade paths to the same table, so role/status/action fields are plain strings and cross-department/user foreign keys use `onDelete: NoAction`.

## Access control

- `ADMIN` — full access across all departments, plus the `/admin/*` management screens. Always bypasses the approval lock (see below).
- `MANAGER` — same scope as STAFF (own department, plus any `DocumentTypeAccess` grants) but can additionally **approve** a document in their own department, and delete an approved document/attachment in their own department (plain STAFF cannot, once approved — see Approval below).
- `STAFF` — scoped to their own department only (enforced server-side in [src/lib/access.ts](src/lib/access.ts), applied to every list/detail/download query — not just hidden in the UI). Can freely create/delete their own department's documents *until* a MANAGER approves one.
- `VIEWER` — read-only, but across *all* departments, not just their own. For a department that needs to see (and print) documents raised by other departments — e.g. accounting needing sales' invoices — without being able to create, edit, or delete anything, or reach `/admin/*`. `canViewDocument()` (read) is intentionally a separate function from `canManageDocument()`/`canDeleteDocument()` (write) in `access.ts` so a VIEWER's own-department match never accidentally grants write access.
- **Document-type ownership** — a finer-grained alternative to VIEWER: set a document type's owner department in [/admin/document-types](src/app/admin/document-types) so only that department can *create* it (e.g. only Accounting can create "ใบกำกับภาษี" invoices, only Production can create "ใบสั่งผลิต" production orders). Combine with `DocumentTypeAccess` grants (set per-user in [/admin/users/\[id\]/edit](src/app/admin/users/[id]/edit/page.tsx)) so specific staff in *other* departments can still view (not create) that type across all departments. Enforced both in the create-document type dropdown (filtered out entirely) and server-side in the create action (defense in depth).

### Approval (ยืนยันความถูกต้อง)

A document starts unapproved; anyone with delete rights on it (ADMIN, or its own department's STAFF/MANAGER) can delete it or its attachments. Once a MANAGER (or ADMIN) approves it via the "อนุมัติเอกสาร" button on its detail page ([ApproveButton.tsx](src/components/ApproveButton.tsx) → `approveDocument` in [documents/actions.ts](src/app/documents/actions.ts), which sets `approvedAt`/`approvedById` and writes an `APPROVE` audit entry), the document **locks**: `canDeleteDocument()` then requires ADMIN, or a MANAGER in the same department — a plain STAFF member, even the one who created it, can no longer delete the document or any of its attachments. There's no "unapprove" — it's a one-way gate, matching "อนุมัติแล้ว ไม่สามารถลบได้".

Auth is [NextAuth](https://authjs.dev) v5 with a Credentials provider (email + bcrypt-hashed password), JWT sessions. [src/proxy.ts](src/proxy.ts) (Next.js 16's name for what used to be `middleware.ts`) gates all routes except `/login` using an Edge-safe config ([src/lib/auth.config.ts](src/lib/auth.config.ts)) — the Prisma-backed `authorize()` callback only runs in the Node runtime ([src/lib/auth.ts](src/lib/auth.ts)), since Prisma Client cannot run on the Edge runtime. Admin-only pages are additionally guarded server-side by [src/lib/require-admin.ts](src/lib/require-admin.ts), which 404s non-admins rather than redirecting (so the route's existence isn't revealed).

## Features

### Documents (`/documents`)

- List, scoped by department for staff / all departments for admins.
- Search by document number (`q`) and by document-date range (`dateFrom` / `dateTo`).
- Create ([/documents/new](src/app/documents/new/page.tsx)) — document number is auto-generated from the selected document type's `numberFormat` ([src/lib/document-number.ts](src/lib/document-number.ts)); multiple files can be attached on creation (`<input type="file" multiple>`, saved individually in a loop, each validated against `MAX_UPLOAD_SIZE_MB` before any are written).
- Detail view ([/documents/\[id\]](src/app/documents/[id]/page.tsx)) with file list, download links, approval status, and a per-file delete button ([src/components/DeleteButton.tsx](src/components/DeleteButton.tsx) + `deleteDocumentAttachment` in [src/app/documents/actions.ts](src/app/documents/actions.ts)) for removing a wrongly-uploaded attachment without deleting the whole document — both the document-level and attachment-level delete buttons only render when `canDeleteDocument()` allows it (see Approval above).
- File download ([/api/documents/\[id\]/files/\[fileId\]](src/app/api/documents/[id]/files/[fileId]/route.ts)) — access-checked and logged to `DocumentAudit`. The same route serves inline previews (`?inline=1`) for PDFs and images via [src/components/FilePreview.tsx](src/components/FilePreview.tsx), which also has a "พิมพ์" (print) button.
- Pagination ([src/components/Pagination.tsx](src/components/Pagination.tsx)), page size set by `DOCUMENTS_PAGE_SIZE` in `.env`.
- Document dates are always rendered `dd/mm/yyyy` (Gregorian/ค.ศ.) via [src/components/FormattedDate.tsx](src/components/FormattedDate.tsx), independent of server or browser locale — the `<input type="date">` filters in the search form still show whatever format the visitor's own OS/browser locale dictates (that's native browser behavior and isn't something the app can override without dropping the native date picker).

### Admin management (`/admin/*`, ADMIN role only)

Departments, document types, and users each follow the same list/create/edit/delete pattern:

- **List** (`/admin/departments`, `/admin/document-types`, `/admin/users`) — read-only table with an "+ เพิ่ม..." button and a "แก้ไข" / "ลบ" link per row.
- **Create** (`.../new`) — dedicated page, separate from the list.
- **Edit** (`.../[id]/edit`) — dedicated page, separate from the list.
- **Delete** — a custom confirmation modal ([src/components/DeleteButton.tsx](src/components/DeleteButton.tsx), not the browser's native `confirm()`). Deletion is blocked server-side with an explanatory message if the record still has dependents (e.g. a department with users or documents, a document type with documents, a user who created documents or has audit history) — the message tells the admin to deactivate (`isActive`) instead. An admin cannot delete their own account. On success, `DeleteButton` calls `router.refresh()` by default so the deleted row disappears immediately without a manual page reload (a document's own delete button passes a custom `onDeleted` instead, to navigate back to the list since the detail page it was on no longer exists).

Server actions for each entity live in that entity's own `actions.ts` (e.g. [src/app/admin/users/actions.ts](src/app/admin/users/actions.ts)) and are shared between the create and edit pages.

### Password fields

All password inputs (login, create user, reset user password) use [src/components/PasswordInput.tsx](src/components/PasswordInput.tsx), a show/hide toggle (eye icon) wrapping a plain `<input>`.

### Profile (`/profile`)

Every logged-in user (any role) can change their own password and upload a profile picture — click their name/avatar in the top bar. Password change re-verifies the current password server-side before accepting a new one ([src/app/profile/actions.ts](src/app/profile/actions.ts)). Avatars are stored under `storage/avatars/` (separate from document attachments) and served via [/api/users/\[id\]/avatar](src/app/api/users/[id]/avatar/route.ts); max size is `MAX_AVATAR_SIZE_MB` in `.env`. The old avatar file is deleted once a new one is saved, so uploads don't accumulate orphaned files.

## Setup

1. Provide a SQL Server instance and point `DATABASE_URL` at it in `.env` (a local Docker SQL Server works fine — see the example already in `.env`).
2. Set a real `AUTH_SECRET` in `.env` (`openssl rand -base64 32`).
3. Install dependencies and create the schema:

```bash
npm install
npm run db:migrate
npm run db:seed
```

The seed script creates two departments (IT, HR), two document types (MEMO, CONTRACT), and an admin login: `admin@company.local` / `Admin@1234`.

4. Run the dev server:

```bash
npm run dev
```

The dev server binds to all network interfaces, so it's also reachable from other machines on the LAN at `http://<this-machine's-IP>:3000`, not just `http://localhost:3000`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` — ESLint
- `npm run db:migrate` — create/apply Prisma migrations interactively (local dev only)
- `npm run db:migrate:deploy` — apply already-committed migrations non-interactively (use this on servers/CI — see [install.md](install.md))
- `npm run db:seed` — seed reference data + admin user
- `npm run db:studio` — Prisma Studio GUI

## Not yet implemented

Document edit UI (title/description/type/department can't be changed after creation) and an "ARCHIVE" status transition — the data model already supports both (`status` field, `UPDATE`/`ARCHIVE` audit actions), but there's no screen for them yet.

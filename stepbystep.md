# คู่มือสร้างระบบจัดเก็บเอกสารภายในองค์กร ทีละขั้นตอน

เอกสารนี้อธิบายลำดับขั้นตอนการสร้างโปรเจกต์นี้ตั้งแต่ศูนย์ ให้อ่านตามลำดับ — แต่ละ step ต่อยอดจาก step ก่อนหน้า ถ้าต้องเริ่มโปรเจกต์ใหม่คล้ายกันนี้ ทำตามลำดับนี้ได้เลย

**Tech stack**: Next.js 16 (App Router) + TypeScript + Prisma 7 + Microsoft SQL Server + NextAuth v5 + Tailwind CSS v4

---

## Step 0: เตรียมความพร้อม

ก่อนเริ่ม ให้ตัดสินใจเรื่องต่อไปนี้ (จะเปลี่ยนทีหลังได้ แต่ตัดสินใจล่วงหน้าจะทำงานลื่นกว่า):

1. **Entity หลัก** — ระบบนี้มี 6 ตาราง: `User`, `Department` (หน่วยงาน), `DocumentType` (ประเภทเอกสาร), `Document` (เอกสาร), `DocumentFile` (ไฟล์แนบ), `DocumentAudit` (audit log)
2. **Role ที่ต้องการ** — เริ่มจาก `ADMIN`/`STAFF` ก่อนพอ แล้วค่อยเพิ่ม role พิเศษทีหลังถ้าจำเป็น (ดู Step 10)
3. **ที่เก็บไฟล์** — local disk (`storage/` ในโปรเจกต์) พอสำหรับ dev/on-prem; ถ้า deploy บน cloud ค่อยเปลี่ยนเป็น object storage ทีหลัง
4. **Database** — ต้องมี SQL Server instance พร้อมใช้งาน (local, Docker, หรือ remote) ก่อนเริ่ม Step 2

---

## Step 1: Scaffold โปรเจกต์ Next.js

```bash
npx create-next-app@latest . --ts --app --eslint --tailwind --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

ตัวเลือกสำคัญ:
- `--src-dir` — เก็บโค้ดใน `src/` แยกจาก config files
- `--import-alias "@/*"` — import path แบบ `@/lib/...` แทน relative path ยาวๆ
- `--app` — ใช้ App Router (ไม่ใช่ Pages Router)

หลัง scaffold เสร็จ **ลบไฟล์ auto-generated ที่ไม่เกี่ยวข้อง** ถ้ามี (บาง Next.js version สร้าง `AGENTS.md`, `.claude/`, skill files มาด้วย — ลบทิ้งได้ถ้าไม่ได้ตั้งใจใช้)

ตรวจสอบว่า build ผ่านตั้งแต่ต้น:

```bash
npm run build
```

---

## Step 2: ติดตั้ง Prisma + Database driver

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlserver
```

**สำคัญสำหรับ Prisma 7**: เวอร์ชันนี้บังคับใช้ driver adapter แทนการต่อ DB ผ่าน connection string ตรงๆ — สำหรับ SQL Server ต้องติดตั้งเพิ่ม:

```bash
npm install @prisma/adapter-mssql
```

แล้วสร้าง Prisma Client แบบ singleton พร้อม adapter ที่ [src/lib/prisma.ts](src/lib/prisma.ts):

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const adapter = new PrismaMssql(process.env.DATABASE_URL!);
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

ตั้งค่า `.env`:

```
DATABASE_URL="sqlserver://localhost:1433;database=mydb;user=sa;password=YourStrong!Passw0rd;trustServerCertificate=true"
```

**ข้อควรระวังเฉพาะ SQL Server** (ต่างจาก Postgres/MySQL):
- ไม่รองรับ native `enum` ใน Prisma schema — ใช้ `String` แทน แล้วเขียน comment บอกค่าที่เป็นไปได้
- ไม่อนุญาตให้มี multiple cascade delete paths ไปยังตารางเดียวกัน — ถ้า schema มี relation ซ้อนกันหลายทาง (เช่น `User` → `Document` ผ่านทั้ง `createdBy` และ `Department`) ต้องตั้ง `onDelete: NoAction` ในบาง relation เพื่อตัด path ที่ซ้ำ
- `String? @unique` (nullable unique) จะปฏิเสธค่า `NULL` ซ้ำกันสองแถว (ต่างจาก Postgres ที่ยอมให้ NULL ซ้ำได้) — ถ้าต้องการให้ NULL ซ้ำได้ ต้องใช้ filtered unique index ผ่าน raw migration (`CREATE UNIQUE NONCLUSTERED INDEX ... WHERE col IS NOT NULL`)

---

## Step 3: ออกแบบ Prisma schema

เขียน [prisma/schema.prisma](prisma/schema.prisma) ให้ครบ entity หลักก่อน (ยังไม่ต้องใส่ฟีเจอร์เสริม):

```prisma
model User {
  id           String  @id @default(cuid())
  email        String  @unique
  name         String
  passwordHash String
  role         String  @default("STAFF") // "ADMIN" | "STAFF"
  isActive     Boolean @default(true)
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Department {
  id       String  @id @default(cuid())
  code     String  @unique
  name     String
  isActive Boolean @default(true)
  users     User[]
  documents Document[]
}

model DocumentType {
  id           String  @id @default(cuid())
  code         String  @unique
  name         String
  numberFormat String  @default("{code}-{year}-{seq:4}")
  isActive     Boolean @default(true)
  documents Document[]
}

model Document {
  id             String   @id @default(cuid())
  documentNumber String   @unique // primary search key
  title          String
  description    String?  @db.NVarChar(Max)
  status         String   @default("ACTIVE")
  documentTypeId String
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  departmentId   String
  department     Department @relation(fields: [departmentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  documentDate   DateTime
  createdById    String
  createdBy      User @relation(fields: [createdById], references: [id], onDelete: NoAction, onUpdate: NoAction)
  files          DocumentFile[]
  auditLogs      DocumentAudit[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([departmentId])
  @@index([documentTypeId])
  @@index([status])
  @@index([documentDate])
}

model DocumentFile {
  id          String   @id @default(cuid())
  documentId  String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  fileName    String
  storagePath String
  mimeType    String
  sizeBytes   Int
  uploadedAt  DateTime @default(now())
}

model DocumentAudit {
  id         String   @id @default(cuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  action     String   // "CREATE" | "UPDATE" | "DOWNLOAD" | "ARCHIVE"
  detail     String?
  createdAt  DateTime @default(now())
}
```

ประเด็นออกแบบสำคัญ:
- **`documentNumber` เป็น primary search key** — ทำ `@unique` และสร้าง index เผื่อค้นหาเพิ่มเติม
- **`numberFormat` เป็น template string** ที่ generate เลขที่เอกสารอัตโนมัติ (ดู Step 6)
- **`DocumentFile` แยกจาก `Document`** — เก็บแค่ metadata ในฐานข้อมูล ตัวไฟล์จริงอยู่บน disk (ดู Step 7)
- **`DocumentAudit` เป็น append-only log** — ไม่มีการ update/delete แถวนี้เลย ใช้ตรวจสอบย้อนหลัง

รัน migration แรก:

```bash
npx prisma migrate dev --name start
npx prisma generate
```

---

## Step 4: Authentication (NextAuth v5)

ติดตั้ง:

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

**โครงสร้างสำคัญ**: NextAuth ต้องแยก config เป็น 2 ไฟล์ เพราะ Prisma Client รันบน Edge runtime ไม่ได้ แต่ middleware (ที่ Next.js 16 เรียกว่า proxy) รันบน Edge runtime โดย default:

1. [src/lib/auth.config.ts](src/lib/auth.config.ts) — config แบบ Edge-safe (ไม่มี provider ที่แตะ DB) ใช้ใน middleware
2. [src/lib/auth.ts](src/lib/auth.ts) — config เต็มรูปแบบ มี `Credentials` provider ที่ query DB + bcrypt compare รันเฉพาะ Node runtime

```ts
// src/lib/auth.config.ts — Edge-safe
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    session: async ({ session, token }) => { /* map token → session.user */ return session; },
  },
};
```

```ts
// src/lib/auth.ts — full config, Node runtime only
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [Credentials({ authorize: async (credentials) => {
    // query prisma.user, bcrypt.compare, return user object
  }})],
  callbacks: { jwt: ..., session: ... },
});
```

สร้าง API route handler ที่ [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/[...nextauth]/route.ts):

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

สร้าง proxy (middleware) ที่ [src/proxy.ts](src/proxy.ts) — ใช้ `authConfig` (Edge-safe) ไม่ใช่ `auth.ts` เต็มรูปแบบ:

```ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
const { auth } = NextAuth(authConfig);
export default auth((req) => { /* redirect ถ้าไม่ login */ });
export const config = { matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"] };
```

ขยาย type ของ session ที่ [src/types/next-auth.d.ts](src/types/next-auth.d.ts) เพื่อให้ `session.user` มี `role`, `departmentId` เป็นต้น

สร้างหน้า [/login](src/app/login/page.tsx) เป็น Server Component + Server Action (ไม่ต้องใช้ client-side form library):

```tsx
async function login(formData: FormData) {
  "use server";
  await signIn("credentials", { email, password, redirectTo: target });
}
```

---

## Step 5: Layout พื้นฐาน + Theme

สร้าง component โครงหน้าที่ใช้ร่วมกันทุกหน้า:

- [src/components/AppShell.tsx](src/components/AppShell.tsx) — topbar (โลโก้ + user info + ปุ่ม logout) + sidebar + main content area
- [src/components/SidebarNav.tsx](src/components/SidebarNav.tsx) — เมนูซ้าย ไฮไลต์ path ปัจจุบันด้วย `usePathname()`

จุดสำคัญ: **แยกฟอร์ม logout ออกจากลิงก์อื่นๆ** — อย่าเอาลิงก์ไปซ้อนใน `<form>` เดียวกับปุ่ม submit อื่น เพราะ `<a>`/`<Link>` ที่ซ้อนอยู่ใน `<form>` จะไม่ได้ผลตามที่ตั้งใจ (ใช้ sibling elements แทน)

ปรับ [globals.css](src/app/globals.css) กำหนด theme สี — ถ้าต้องการ light theme ตายตัว (ไม่ auto dark mode) ให้ลบ `@media (prefers-color-scheme: dark)` block ออก

---

## Step 6: Business logic — เลขที่เอกสารอัตโนมัติ

สร้าง [src/lib/document-number.ts](src/lib/document-number.ts) — generate เลขที่เอกสารจาก template string ของ `DocumentType.numberFormat`:

```ts
export async function generateDocumentNumber(documentTypeId: string, tx = prisma) {
  const type = await tx.documentType.findUniqueOrThrow({ where: { id: documentTypeId } });
  const year = new Date().getFullYear();
  const count = await tx.document.count({
    where: { documentTypeId, documentDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
  });
  const seq = count + 1;
  return type.numberFormat.replace(/\{(code|year|seq)(?::(\d+))?\}/g, (_, key, pad) => {
    if (key === "code") return type.code;
    if (key === "year") return String(year);
    if (key === "seq") return pad ? String(seq).padStart(Number(pad), "0") : String(seq);
    return "";
  });
}
```

**ต้องเรียกฟังก์ชันนี้ภายใน transaction เดียวกับการ insert เอกสาร** (`prisma.$transaction`) ไม่งั้นจะมีโอกาสได้เลขซ้ำเมื่อมีการสร้างเอกสารพร้อมกันสองคำขอ (race condition)

---

## Step 7: จัดเก็บไฟล์แนบ

สร้าง [src/lib/storage.ts](src/lib/storage.ts) — helper สำหรับ save/read/delete ไฟล์บน local disk:

```ts
const STORAGE_ROOT = path.join(process.cwd(), "storage", "documents"); // ต้อง static path เท่านั้น
```

**เหตุผลที่ path ต้อง static ไม่ผูกกับ env var**: ถ้าใช้ `process.env.SOME_PATH` มา build path ตรงๆ Next.js file tracing จะดึงทั้งโปรเจกต์เข้าไปใน server bundle (เพราะ static analysis หา path ไม่เจอ) ทำให้ deploy ช้าและใหญ่ผิดปกติ — ถ้าจำเป็นต้อง configurable ให้ mount volume ทับ path ที่ fix ไว้แทน

ทุกครั้งที่ resolve path จาก input ของผู้ใช้ (เช่น `storagePath` จาก DB) **ต้องตรวจสอบว่า resolved path ยังอยู่ภายใน storage root** ป้องกัน path traversal:

```ts
function assertInsidePath(root: string, fullPath: string) {
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(root)) throw new Error("path escapes storage root");
  return resolved;
}
```

เพิ่ม `/storage/` ใน `.gitignore`

---

## Step 8: CRUD หลัก — เอกสาร

ลำดับสร้างหน้าเอกสาร:

1. **[/documents](src/app/documents/page.tsx)** — list + ค้นหาตามเลขที่เอกสาร (`documentNumber: { contains: q }`) + filter ช่วงวันที่
2. **[/documents/new](src/app/documents/new/page.tsx)** — ฟอร์มสร้าง ใช้ Server Action เดียวกับหน้า (ไม่แยก `actions.ts` ก็ได้สำหรับหน้าที่ logic ไม่ซับซ้อน) — เรียก `generateDocumentNumber` ใน transaction, แล้วค่อย save ไฟล์แนบนอก transaction เพราะ I/O ดิสก์ไม่ควรอยู่ใน DB transaction — ใช้ `<input type="file" multiple>` + `formData.getAll("files")` เพื่อแนบได้หลายไฟล์พร้อมกันตั้งแต่แรก (แต่ละไฟล์ validate ขนาดแยกกัน แล้ว save เป็น `DocumentFile` แยกแถวใน loop)
3. **[/documents/[id]](src/app/documents/[id]/page.tsx)** — detail view + รายการไฟล์แนบ พร้อมปุ่มลบรายไฟล์ (ใช้ `DeleteButton` component ตัวเดียวกับที่ใช้ลบ record อื่นๆ — ไม่ต้องสร้างใหม่ เพราะ signature `action: (id) => Promise<{error?}>` generic พอสำหรับ entity ไหนก็ได้)
4. **[/api/documents/[id]/files/[fileId]](src/app/api/documents/[id]/files/[fileId]/route.ts)** — API route สำหรับดาวน์โหลด/พรีวิวไฟล์ ตรวจสิทธิ์ก่อนทุกครั้ง แล้ว log ลง `DocumentAudit`

เมื่อ CRUD พื้นฐานเสร็จ ค่อยเพิ่ม delete ทั้งสองระดับใน [src/app/documents/actions.ts](src/app/documents/actions.ts) — ใช้ modal ยืนยันเอง (ไม่ใช้ `confirm()` ของ browser เพราะ UX ไม่สอดคล้องกับ design ของแอป):
- **ลบทั้งเอกสาร** — ลบไฟล์ทั้งหมดบนดิสก์ก่อนลบ record, ปฏิเสธถ้ามี dependent record
- **ลบไฟล์แนบรายไฟล์** — เผื่อผู้ใช้แนบไฟล์ผิดแล้วอยากลบโดยไม่ต้องลบทั้งเอกสาร ลบ DB row ก่อนค่อยลบไฟล์บนดิสก์ (ถ้าลบไฟล์ fail จะเหลือ orphan ไฟล์บนดิสก์ที่ไม่มีอันตราย ดีกว่า DB row ชี้ไปยังไฟล์ที่หายแล้ว)

**ข้อควรระวังของ `DeleteButton`**: เพราะ component เรียก server action ผ่าน `useTransition` (ไม่ใช่ `<form action>`), Next.js ไม่ auto-refresh Server Component ให้เองหลัง `revalidatePath()` — ต้องเรียก `router.refresh()` เองใน callback หลังลบสำเร็จ ไม่งั้นแถวที่ลบไปแล้วจะยังค้างแสดงบนหน้าจนกว่าจะ reload มือ (ถ้าต้อง navigate ไปหน้าอื่นแทน เช่นลบทั้งเอกสารจากหน้า detail ของเอกสารนั้นเอง ให้ใช้ `router.push()` แทน)

---

## Step 9: Access control layer

รวม logic การตรวจสิทธิ์ไว้ที่จุดเดียว [src/lib/access.ts](src/lib/access.ts) — **อย่ากระจาย `if (user.role === "ADMIN")` ไปทั่วโค้ด** เพราะแก้กฎทีหลังจะลืมจุดใดจุดหนึ่งได้ง่าย:

```ts
export function documentScopeFilter(user: SessionUser): Prisma.DocumentWhereInput {
  if (user.role === "ADMIN") return {};
  return { departmentId: user.departmentId };
}

export function canManageDocument(user: SessionUser, documentDepartmentId: string) {
  return user.role === "ADMIN" || user.departmentId === documentDepartmentId;
}
```

ใช้ `documentScopeFilter()` ใน **ทุก** query ที่ list เอกสาร และใช้ `canManageDocument()` ใน **ทุก** จุดที่ต้อง gate การแก้ไข/ลบ/ดาวน์โหลด (ทั้งฝั่ง UI ซ่อนปุ่ม และฝั่ง server action/API route ตรวจซ้ำ — ฝั่ง UI อย่างเดียวไม่พอเพราะ bypass ผ่าน URL ตรงๆ ได้)

สำหรับหน้า admin-only สร้าง guard แยก [src/lib/require-admin.ts](src/lib/require-admin.ts) ที่ **404 แทน redirect** เมื่อไม่มีสิทธิ์ (ไม่เปิดเผยว่า route นี้มีอยู่จริง):

```ts
export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") notFound();
  return session;
}
```

---

## Step 10: หน้า admin จัดการข้อมูลอ้างอิง

สร้างหน้า CRUD สำหรับ `Department`, `DocumentType`, `User` ที่ `/admin/*` — ทำตาม pattern เดียวกันทั้ง 3 entity เพื่อความสม่ำเสมอ:

```
/admin/<entity>              — list อย่างเดียว (read-only table) + ปุ่ม "+ เพิ่ม..."
/admin/<entity>/new          — หน้าแยกสำหรับสร้าง
/admin/<entity>/[id]/edit    — หน้าแยกสำหรับแก้ไข
/admin/<entity>/actions.ts   — server actions (create/update/delete) ใช้ร่วมกันทั้ง list/new/edit
```

**อย่าฝังฟอร์ม add/edit ไว้ในหน้า list เดียวกัน** — แยกเป็นหน้าของตัวเองตั้งแต่แรกจะดูแลง่ายกว่า (ฟอร์มยาวไม่ดันตารางเบี้ยว, URL แชร์ได้ตรงจุด)

สร้าง component ที่ใช้ซ้ำได้ 3 ตัว:
- [src/components/DeleteButton.tsx](src/components/DeleteButton.tsx) — client component, modal ยืนยันเอง, เรียก server action ผ่าน `useTransition`, แสดง error ถ้าลบไม่ได้ (มี dependent record)
- [src/components/PasswordInput.tsx](src/components/PasswordInput.tsx) — input password พร้อมปุ่มโชว์/ซ่อน
- [src/components/Pagination.tsx](src/components/Pagination.tsx) — Server Component ล้วน (ไม่ใช้ client JS) แบ่งหน้าด้วย query param `?page=`

**การจัดการ error จาก unique constraint**: อย่าปล่อยให้ raw Prisma error ขึ้นจอผู้ใช้ — ครอบ `try/catch` รอบ `create`/`update` ที่แตะ field `@unique`, ตรวจ `err.code === "P2002"` แล้ว redirect กลับพร้อม query param `?error=...` ให้หน้าแสดงข้อความที่อ่านง่าย

---

## Step 11: ฟีเจอร์เสริม (ทำหลังจากพื้นฐานเสถียรแล้ว)

เรียงตามลำดับความซับซ้อนที่เพิ่มขึ้น เพิ่มทีละอย่าง ทดสอบให้ผ่านก่อนค่อยไปอันถัดไป:

1. **จำกัดขนาดไฟล์อัปโหลด** — ตั้งค่าผ่าน `.env` (`MAX_UPLOAD_SIZE_MB`) แต่อย่าลืมว่า Next.js Server Actions มี body size limit ของตัวเอง (default 1MB) ต้องปรับใน [next.config.ts](next.config.ts) ด้วย (`experimental.serverActions.bodySizeLimit`) ไม่งั้นไฟล์ใหญ่กว่า 1MB จะถูกปฏิเสธก่อนถึงจุดตรวจสอบของแอปเอง

2. **พรีวิวไฟล์ (PDF/รูปภาพ)** — เพิ่ม query param `?inline=1` ใน API route เปลี่ยน `Content-Disposition` จาก `attachment` เป็น `inline` ให้ browser render แทนดาวน์โหลด แล้วสร้าง modal component แสดง `<iframe>` (PDF) หรือ `<img>` (รูปภาพ)

3. **Role เพิ่มเติมแบบ read-only ข้ามหน่วยงาน** (เช่น executive เห็นทุกอย่าง) — เพิ่ม role string ใหม่ (เช่น `VIEWER`) ใน `access.ts`, **แยกฟังก์ชันอ่าน (`canViewDocument`) ออกจากฟังก์ชันเขียน (`canManageDocument`) อย่างเด็ดขาด** — บั๊กที่พบบ่อยที่สุดของ feature นี้คือให้สิทธิ์ดูข้ามหน่วยงานกลายเป็นสิทธิ์แก้ไข/ลบโดยไม่ตั้งใจ เพราะ department ของ user บังเอิญตรงกับเอกสาร

4. **สิทธิ์ดูข้ามหน่วยงานแบบเจาะจงตามประเภทเอกสาร** — ถ้า role แบบเหมารวม (ข้อ 3) กว้างเกินไป ให้ทำตาราง join `User` ↔ `DocumentType` (many-to-many) แทน แล้วรวมเข้ากับ query ด้วย `OR`:
   ```ts
   { OR: [{ departmentId: user.departmentId }, { documentTypeId: { in: grantedTypeIds } }] }
   ```

5. **จำกัดว่าหน่วยงานไหน "สร้าง" เอกสารประเภทไหนได้** — เพิ่ม `ownerDepartmentId` (nullable) ใน `DocumentType` ชี้ไปยัง `Department` แยกจากสิทธิ์ดู (ข้อ 4) โดยสิ้นเชิง — "ดูได้" กับ "สร้างได้" เป็นคนละสิทธิ์กัน อย่าปนกัน กรองใน dropdown เลือกประเภทเอกสารตอนสร้าง (ไม่ใช่แค่ validate ตอน submit) และ validate ซ้ำฝั่ง server เสมอ

6. **หน้าโปรไฟล์ผู้ใช้** (เปลี่ยนรหัสผ่าน + อัปโหลดรูป) — แยก storage root ของรูปโปรไฟล์ออกจากไฟล์เอกสาร (`storage/avatars/` แยกจาก `storage/documents/`), ลบไฟล์เก่าทิ้งทุกครั้งที่อัปโหลดใหม่ (ไม่งั้นไฟล์ขยะสะสม), เปลี่ยนรหัสผ่านต้อง verify รหัสผ่านเดิมก่อนเสมอ

7. **บังคับ format วันที่ให้เหมือนกันทุกเครื่อง** — ถ้าต้องการ fix รูปแบบวันที่ที่ *แสดงผล* (เช่น `dd/mm/yyyy` เสมอ) อย่าใช้ `date.toLocaleDateString(locale)` เพราะ locale ที่มี region เป็นไทย (`th-TH`) จะ default เป็นปีพุทธศักราช (พ.ศ.) ไม่ใช่ ค.ศ. — เขียน format เองจาก `getUTCDate()`/`getUTCMonth()`/`getUTCFullYear()` แทน (**ใช้ UTC getters ไม่ใช่ local getters** ถ้าค่าวันที่ถูกเก็บเป็น UTC midnight จาก `<input type="date">` ไม่งั้นในโซนเวลาที่อยู่หลัง UTC วันที่จะเพี้ยนไปหนึ่งวัน) วิธีนี้ทำให้ component ไม่ต้องเป็น client component หรือกังวลเรื่อง hydration mismatch เลย เพราะ render เหมือนกันทั้ง server/client
   - ข้อควรรู้แยกต่างหาก: **native `<input type="date">` ไม่มีทางบังคับ format การพิมพ์ได้จากโค้ดเว็บ** — format ของช่อง input (`mm/dd/yyyy` vs `dd/mm/yyyy`) เป็นไปตาม region ของ OS/browser ผู้ใช้เสมอ ถ้าอยากบังคับ format การพิมพ์ต้องเปลี่ยนเป็น text input + เขียน validation/parsing เองทั้งหมด ซึ่งแลกกับการเสีย native date picker UI ไป — ปกติไม่คุ้มที่จะทำแค่เพื่อเรื่อง format

---

## Step 12: ตรวจสอบก่อนส่งมอบ/deploy ทุกครั้ง

รันทั้ง 3 คำสั่งนี้หลังแก้โค้ดทุกครั้งที่มีนัยสำคัญ (ไม่ใช่แค่ตอนจบโปรเจกต์):

```bash
npx tsc --noEmit   # typecheck
npm run build      # ตรวจ build จริง จับปัญหาที่ typecheck อย่างเดียวจับไม่ได้ (เช่น Edge runtime incompatibility)
npm run lint       # ESLint
```

**จุดที่ typecheck ผ่านแต่ build อาจ fail**:
- โมดูลที่ใช้ Node.js API (เช่น Prisma Client, `fs`) ถูก import เข้าไปใน middleware/proxy โดยไม่ตั้งใจ (ผ่าน chain ของ import) — Edge runtime รันไม่ได้
- Dynamic path ที่ build จาก env var ทำให้ file tracing ดึงไฟล์เกินจำเป็น

**หลัง `prisma migrate` หรือ `prisma generate` ทุกครั้ง ต้อง restart dev server** — Node process ที่รันอยู่จะยังใช้ Prisma Client เวอร์ชันเก่าค้างในหน่วยความจำ ทำให้ field/model ที่เพิ่งเพิ่มมาแสดงเป็น `undefined` แม้โค้ดจะถูกต้องแล้วก็ตาม (อาการ: `TypeError: Cannot read properties of undefined (reading 'findMany')`)

ก่อนเชื่อว่าฟีเจอร์ authorization ทำงานถูกต้อง **ต้องทดสอบทั้งเคสบวกและเคสลบจริงในเบราว์เซอร์** ไม่ใช่แค่ดู query ที่เขียนแล้วเชื่อว่าถูก — สร้าง user ทดสอบในหน่วยงาน/สิทธิ์ต่างกัน แล้ว login สลับไปมาดูว่าเห็น/ไม่เห็นตรงตามที่ออกแบบจริง เคสที่พบบ่อยคือข้อมูลทดสอบทั้งหมดอยู่ในหน่วยงานเดียวกันโดยบังเอิญ ทำให้ดูเหมือน filter ทำงาน (หรือไม่ทำงาน) ทั้งที่จริงยังไม่ได้ทดสอบ cross-department จริงๆ

---

## สรุปลำดับ Step ทั้งหมด

| Step | สิ่งที่ทำ | Output |
|---|---|---|
| 0 | ตัดสินใจ scope | แผนคร่าวๆ |
| 1 | Scaffold Next.js | โปรเจกต์ build ผ่าน |
| 2 | ติดตั้ง Prisma + adapter | ต่อ DB ได้ |
| 3 | ออกแบบ schema | migration แรก |
| 4 | Auth (NextAuth v5) | login ได้ |
| 5 | Layout พื้นฐาน | AppShell, Sidebar |
| 6 | เลขที่เอกสารอัตโนมัติ | `generateDocumentNumber` |
| 7 | จัดเก็บไฟล์แนบ | `storage.ts` |
| 8 | CRUD เอกสาร | list/create/detail/delete |
| 9 | Access control | `access.ts`, `require-admin.ts` |
| 10 | Admin CRUD (หน่วยงาน/ประเภท/ผู้ใช้) | `/admin/*` |
| 11 | ฟีเจอร์เสริม | เลือกทำตามความจำเป็นจริง |
| 12 | ตรวจสอบต่อเนื่อง | typecheck + build + lint + manual test ทุกครั้ง |

โครงสร้างไฟล์จริงของโปรเจกต์นี้หลังทำครบทุก step อยู่ใน [README.md](README.md) — อ่านคู่กันเพื่อดูว่าแต่ละ step ที่อธิบายไว้ข้างบนสุดท้ายกลายเป็นไฟล์ไหนบ้าง

# Workshop: สร้างระบบจัดเก็บเอกสารภายในองค์กร ตั้งแต่ศูนย์ (ฉบับละเอียดทุกไฟล์)

Workshop นี้พาสร้างโปรเจกต์ `twp_document_system` ทั้งหมดตั้งแต่โฟลเดอร์ว่าง จนได้ระบบที่ใช้งานจริงได้ โดยใช้โครงสร้างเดียวกับ [stepbystep.md](stepbystep.md) (Step 0 → Step 12) แต่ต่างกันตรงที่:

| | [stepbystep.md](stepbystep.md) | workshop.md (ไฟล์นี้) |
|---|---|---|
| เป้าหมาย | อธิบาย "ลำดับและเหตุผล" ของการออกแบบ | ลงมือทำตามได้จริงทีละคำสั่ง ทีละไฟล์ |
| โค้ด | ตัวอย่างย่อ (snippet) | **โค้ดเต็มทุกไฟล์** คัดลอกไปวางได้ทันที |
| คำอธิบาย | ระดับแนวคิด | อธิบายทีละส่วนของไฟล์ + จุดที่มักพลาด |

> **วิธีใช้ workshop นี้**: ทำตามลำดับจากบนลงล่าง ห้ามข้าม step — ท้ายแต่ละ step จะมีหัวข้อ **✅ ตรวจสอบ** บอกว่าต้องเห็นผลอะไรก่อนไป step ถัดไป ถ้ายังไม่เห็นผลตามนั้น ให้แก้ให้ผ่านก่อน

**Tech stack**: Next.js 16 (App Router) + TypeScript + Prisma 7 + Microsoft SQL Server + NextAuth v5 + Tailwind CSS v4

---

## สารบัญ

- [Step 0: เตรียมเครื่องและตัดสินใจ scope](#step-0-เตรียมเครื่องและตัดสินใจ-scope)
- [Step 1: Scaffold โปรเจกต์ Next.js](#step-1-scaffold-โปรเจกต์-nextjs)
- [Step 2: ติดตั้ง Prisma + SQL Server adapter](#step-2-ติดตั้ง-prisma--sql-server-adapter)
- [Step 3: ออกแบบ Prisma schema + migration + seed](#step-3-ออกแบบ-prisma-schema--migration--seed)
- [Step 4: Authentication (NextAuth v5)](#step-4-authentication-nextauth-v5)
- [Step 5: Layout พื้นฐาน + Theme](#step-5-layout-พื้นฐาน--theme)
- [Step 6: Business logic — เลขที่เอกสารอัตโนมัติ + ค่า config](#step-6-business-logic--เลขที่เอกสารอัตโนมัติ--ค่า-config)
- [Step 7: จัดเก็บไฟล์แนบ (storage)](#step-7-จัดเก็บไฟล์แนบ-storage)
- [Step 8: Access control layer](#step-8-access-control-layer)
- [Step 9: CRUD หลัก — เอกสาร](#step-9-crud-หลัก--เอกสาร)
- [Step 10: หน้า admin จัดการข้อมูลอ้างอิง + audit log](#step-10-หน้า-admin-จัดการข้อมูลอ้างอิง--audit-log)
- [Step 11: ฟีเจอร์เสริม — โปรไฟล์ผู้ใช้ + ทบทวนฟีเจอร์ทั้งหมด](#step-11-ฟีเจอร์เสริม--โปรไฟล์ผู้ใช้--ทบทวนฟีเจอร์ทั้งหมด)
- [Step 12: ตรวจสอบก่อนส่งมอบ/deploy](#step-12-ตรวจสอบก่อนส่งมอบdeploy)
- [ภาคผนวก A: โครงสร้างไฟล์สุดท้าย](#ภาคผนวก-a-โครงสร้างไฟล์สุดท้าย)
- [ภาคผนวก B: ปัญหาที่พบบ่อยและวิธีแก้](#ภาคผนวก-b-ปัญหาที่พบบ่อยและวิธีแก้)

> **หมายเหตุเรื่องลำดับ Step**: ใน [stepbystep.md](stepbystep.md) Step 8 คือ CRUD และ Step 9 คือ Access control — ใน workshop นี้ **สลับกัน** (Access control มาก่อน) เพราะหน้าเอกสารทุกหน้า `import` ฟังก์ชันจาก `access.ts` ถ้าสร้างหน้าก่อนจะ compile ไม่ผ่าน
>
> อีกจุดที่ต่าง: stepbystep.md ค่อยๆ เพิ่ม schema ทีละส่วน (และจงใจเขียนแบบผิดก่อนเพื่อให้เห็นปัญหา) — workshop นี้ใช้ **schema ฉบับสมบูรณ์ตั้งแต่ Step 3** เพื่อให้ผู้เรียนไม่ต้องรัน migration แก้ซ้ำหลายรอบ แต่จะอธิบายเหตุผลของแต่ละการตัดสินใจไว้ครบ

---

## Step 0: เตรียมเครื่องและตัดสินใจ scope

### 0.1 ติดตั้งโปรแกรมที่จำเป็น

| โปรแกรม | เวอร์ชันที่แนะนำ | ใช้ทำอะไร | ตรวจสอบด้วยคำสั่ง |
|---|---|---|---|
| Node.js | 20 LTS ขึ้นไป (แนะนำ 22) | รัน Next.js / Prisma | `node -v` |
| npm | มาพร้อม Node | ติดตั้ง package | `npm -v` |
| Git | ล่าสุด | version control | `git --version` |
| SQL Server | 2019 / 2022 (Express/Developer ก็ได้) | ฐานข้อมูล | ต่อผ่าน SSMS / Azure Data Studio ได้ |
| VS Code | ล่าสุด | editor (แนะนำ extension: Prisma, Tailwind CSS IntelliSense, ESLint) | - |

**ถ้ายังไม่มี SQL Server** — วิธีเร็วที่สุดคือรันผ่าน Docker:

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 --name mssql -d mcr.microsoft.com/mssql/server:2022-latest
```

อธิบาย:
- `ACCEPT_EULA=Y` — ยอมรับ license ของ Microsoft (บังคับ ไม่งั้น container ไม่ start)
- `MSSQL_SA_PASSWORD` — รหัสผ่านของ user `sa` ต้องยาว ≥ 8 ตัว มีตัวใหญ่ ตัวเล็ก ตัวเลข และสัญลักษณ์ ไม่งั้น container จะ start แล้วดับเอง
- `-p 1433:1433` — เปิด port มาตรฐานของ SQL Server ให้เครื่องเราต่อได้

จากนั้นสร้าง database เปล่าชื่อ `twp_document_system` (ผ่าน SSMS หรือคำสั่ง `CREATE DATABASE twp_document_system;`) — จริงๆ แล้ว `prisma migrate dev` จะสร้าง database ให้เองถ้ายังไม่มี แต่สร้างเองก่อนจะช่วยยืนยันว่า user/password ใช้ได้จริง

### 0.2 ตัดสินใจ scope ก่อนเริ่ม

1. **Entity หลัก (7 ตาราง)**
   - `User` — ผู้ใช้งาน
   - `Department` — หน่วยงาน
   - `DocumentType` — ประเภทเอกสาร (กำหนดรูปแบบเลขที่เอกสาร)
   - `DocumentTypeAccess` — สิทธิ์ดูเอกสารข้ามหน่วยงานรายประเภท (many-to-many ระหว่าง User ↔ DocumentType)
   - `Document` — เอกสาร
   - `DocumentFile` — ไฟล์แนบ (1 เอกสารมีหลายไฟล์)
   - `DocumentAudit` — ประวัติการใช้งาน (audit log)
2. **Role** — 4 ระดับ

   | Role | เห็นเอกสาร | สร้าง/ลบ | อนุมัติ | เข้า /admin |
   |---|---|---|---|---|
   | `ADMIN` | ทุกหน่วยงาน | ทุกหน่วยงาน | ได้ทุกหน่วยงาน | ได้ |
   | `MANAGER` | หน่วยงานตัวเอง (+ประเภทที่ได้รับสิทธิ์) | หน่วยงานตัวเอง (ลบเอกสารที่อนุมัติแล้วได้) | หน่วยงานตัวเอง | ไม่ได้ |
   | `STAFF` | หน่วยงานตัวเอง (+ประเภทที่ได้รับสิทธิ์) | หน่วยงานตัวเอง (ลบเอกสารที่อนุมัติแล้วไม่ได้) | ไม่ได้ | ไม่ได้ |
   | `VIEWER` | ทุกหน่วยงาน (อ่านอย่างเดียว) | ไม่ได้ | ไม่ได้ | ไม่ได้ |

3. **ที่เก็บไฟล์** — local disk ที่ `storage/documents/` และ `storage/avatars/` ในโปรเจกต์
4. **Database** — SQL Server ที่เตรียมไว้ในข้อ 0.1

---

## Step 1: Scaffold โปรเจกต์ Next.js

### 1.1 สร้างโปรเจกต์

เปิด terminal ในโฟลเดอร์ว่างที่ต้องการ (เช่น `D:\twp_dev\src\twp_document_system`) แล้วรัน:

```bash
npx create-next-app@latest . --ts --app --eslint --tailwind --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

อธิบายทุก flag:

| Flag | ความหมาย | เหตุผลที่เลือก |
|---|---|---|
| `.` | สร้างในโฟลเดอร์ปัจจุบัน | ไม่ต้องมีโฟลเดอร์ซ้อน |
| `--ts` | ใช้ TypeScript | จับ bug ตั้งแต่ตอนเขียน, Prisma generate type ให้อัตโนมัติ |
| `--app` | App Router (`src/app/`) | รองรับ Server Components + Server Actions ซึ่งทั้งโปรเจกต์ใช้ |
| `--eslint` | ติดตั้ง ESLint | ตรวจโค้ดตามมาตรฐาน Next.js |
| `--tailwind` | ติดตั้ง Tailwind CSS v4 | เขียน style ผ่าน className ไม่ต้องมีไฟล์ CSS แยก |
| `--src-dir` | เก็บโค้ดใน `src/` | แยกโค้ดออกจาก config files ที่ root |
| `--import-alias "@/*"` | import ด้วย `@/lib/...` | ไม่ต้องเขียน `../../../lib` |
| `--no-turbopack` | ใช้ webpack | เสถียรกว่าสำหรับ Prisma/Node module บางตัว |
| `--use-npm` | ใช้ npm | ให้ lock file เป็น `package-lock.json` |

หลังรันเสร็จ จะได้โครงสร้างประมาณนี้:

```
.
├── public/              # ไฟล์ static (รูป svg ตัวอย่าง)
├── src/app/
│   ├── favicon.ico
│   ├── globals.css      # CSS หลัก (จะแก้ใน Step 5)
│   ├── layout.tsx       # root layout (จะแก้ใน Step 5)
│   └── page.tsx         # หน้าแรก (จะแก้ใน Step 5)
├── eslint.config.mjs
├── next.config.ts       # จะแก้ใน 1.3
├── package.json         # จะแก้ใน 1.2 / 2.x
├── postcss.config.mjs
└── tsconfig.json
```

> ถ้า Next.js เวอร์ชันที่ใช้สร้างไฟล์เกินมา เช่น `AGENTS.md`, `CLAUDE.md`, โฟลเดอร์ `.claude/` — ลบทิ้งได้ถ้าไม่ได้ตั้งใจใช้

### 1.2 ไฟล์ config ที่ได้จาก scaffold (ไม่ต้องแก้ แต่ต้องเข้าใจ)

**`tsconfig.json`** — ส่วนสำคัญคือ `paths`:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

แปลว่า `import { prisma } from "@/lib/prisma"` จะชี้ไปที่ `src/lib/prisma.ts`

**`postcss.config.mjs`** — เปิดใช้ Tailwind v4 ผ่าน PostCSS plugin:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**`eslint.config.mjs`** — ใช้กฎของ Next.js (core-web-vitals + typescript):

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

### 1.3 แก้ `next.config.ts`

แทนที่เนื้อหาทั้งไฟล์ด้วย:

```ts
import type { NextConfig } from "next";

// Server Actions default to a 1MB body limit; raise it to match
// MAX_UPLOAD_SIZE_MB (see .env) so document attachments aren't rejected
// before reaching the app's own size check in src/lib/storage.ts.
const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB) || 20;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.9.200.75"],
  experimental: {
    serverActions: {
      bodySizeLimit: `${maxUploadSizeMb}mb`,
    },
  },
};

export default nextConfig;
```

อธิบาย:
- **`bodySizeLimit`** — Server Actions ของ Next.js รับ request body ได้แค่ **1MB โดย default** ถ้าไม่ปรับ ผู้ใช้อัปโหลดไฟล์ PDF ขนาด 2MB จะถูก Next.js ปฏิเสธก่อนถึงโค้ดตรวจขนาดของเราเอง (ได้ error แบบอ่านไม่รู้เรื่อง) เราจึงดึงค่าเดียวกับ `MAX_UPLOAD_SIZE_MB` ใน `.env` มาตั้ง ให้ทั้งสองจุดตรงกัน
- **`|| 20`** — ถ้าไม่ได้ตั้ง env ไว้ ใช้ 20MB
- **`allowedDevOrigins`** — อนุญาตให้เครื่องอื่นใน LAN (เช่น IP `192.9.200.75`) เปิด dev server ผ่าน IP ได้ ตอนรัน `npm run dev` — **เปลี่ยนเป็น IP เครื่องของคุณเอง** หรือลบบรรทัดนี้ทิ้งถ้าเปิดแค่ `localhost`

### 1.4 แก้ `.gitignore`

เพิ่ม 2 ส่วนนี้ไว้ท้ายไฟล์ `.gitignore` (ส่วนอื่นที่ scaffold สร้างไว้ให้คงไว้):

```gitignore
/src/generated/prisma

# uploaded document attachments (local dev storage)
/storage/
```

อธิบาย:
- `/src/generated/prisma` — Prisma Client ที่ generate อัตโนมัติ (Step 2) ไม่ควร commit เพราะสร้างใหม่ได้เสมอด้วย `npx prisma generate`
- `/storage/` — ไฟล์ที่ผู้ใช้อัปโหลด ห้าม commit เด็ดขาด (ข้อมูลจริงขององค์กร + ขนาดใหญ่)
- `.env*` มีอยู่แล้วใน `.gitignore` ที่ scaffold สร้าง — ตรวจให้แน่ใจว่ามี เพราะ `.env` จะเก็บรหัสผ่าน database

### ✅ ตรวจสอบ Step 1

```bash
npm run build
```

ต้อง build ผ่านไม่มี error — ถ้า build ไม่ผ่านตั้งแต่ตอนนี้ ปัญหาอยู่ที่ environment (Node version) ไม่ใช่โค้ดเรา

---

## Step 2: ติดตั้ง Prisma + SQL Server adapter

### 2.1 ติดตั้ง package

```bash
npm install prisma @prisma/client @prisma/adapter-mssql
npm install -D dotenv tsx
```

| Package | หน้าที่ |
|---|---|
| `prisma` | CLI สำหรับ migrate / generate / studio |
| `@prisma/client` | runtime ของ Prisma Client |
| `@prisma/adapter-mssql` | **driver adapter** สำหรับ SQL Server — Prisma 7 บังคับใช้ adapter แทนการต่อ DB ด้วย connection string ตรงๆ |
| `dotenv` | ให้ `prisma.config.ts` และ `seed.ts` อ่าน `.env` ได้ (Next.js อ่าน `.env` เองอยู่แล้ว แต่ Prisma CLI / script ธรรมดาไม่อ่าน) |
| `tsx` | รันไฟล์ TypeScript ตรงๆ (ใช้รัน `prisma/seed.ts`) |

### 2.2 Init Prisma

```bash
npx prisma init --datasource-provider sqlserver
```

คำสั่งนี้จะสร้าง:
- `prisma/schema.prisma` — ไฟล์ schema (จะเขียนใหม่ทั้งไฟล์ใน Step 3)
- `prisma.config.ts` — config ของ Prisma CLI (Prisma 7 ย้าย URL ของ database ออกจาก schema มาไว้ที่นี่)
- `.env` — ไฟล์ environment variable

### 2.3 ไฟล์ `prisma.config.ts`

แทนที่เนื้อหาด้วย:

```ts
// This file was generated by Prisma, and assumes you have installed the following:
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

อธิบาย:
- `import "dotenv/config"` — โหลดค่าใน `.env` เข้า `process.env` **ต้องอยู่บรรทัดแรก** ก่อนอ่าน `DATABASE_URL`
- `schema` / `migrations.path` — บอก CLI ว่า schema และโฟลเดอร์ migration อยู่ไหน
- `datasource.url` — connection string ที่ CLI ใช้ตอน `migrate` (ส่วน runtime ของแอปจะใช้ adapter ใน `src/lib/prisma.ts` แทน)

> **ชื่อไฟล์**: Prisma CLI หาไฟล์ชื่อ `prisma.config.ts` ที่ root โดยอัตโนมัติ (ในโปรเจกต์ต้นแบบไฟล์นี้ถูกเปลี่ยนชื่อเป็น `prisma7.config.ts` — ถ้าใช้ชื่ออื่น ต้องส่ง `--config prisma7.config.ts` ให้ทุกคำสั่ง prisma เอง แนะนำให้ใช้ชื่อมาตรฐาน `prisma.config.ts`)

### 2.4 ไฟล์ `.env`

แทนที่เนื้อหาด้วย (แก้ค่า user/password/database ให้ตรงกับเครื่องคุณ):

```env
# Local SQL Server connection (Docker example: sqlserver://localhost:1433;database=...)
DATABASE_URL="sqlserver://localhost:1433;database=twp_document_system;user=sa;password=YourStrong!Passw0rd;trustServerCertificate=true"

# NextAuth — สร้างค่าด้วย `npx auth secret` (Step 4)
AUTH_SECRET="เปลี่ยนเป็นค่าสุ่มยาวๆ"

# Uploaded document attachments are stored under ./storage/documents (fixed path, see src/lib/storage.ts)

# Maximum size (in MB) allowed for a single uploaded document attachment
MAX_UPLOAD_SIZE_MB=20

# Number of documents shown per page in the documents list
DOCUMENTS_PAGE_SIZE=20

# Maximum size (in MB) allowed for a profile picture upload
MAX_AVATAR_SIZE_MB=5

# Number of rows shown per page in the admin audit log
AUDIT_LOG_PAGE_SIZE=30
```

อธิบาย connection string ของ SQL Server (คั่นด้วย `;` ไม่ใช่ `&` แบบ Postgres):
- `sqlserver://localhost:1433` — host และ port
- `database=...` — ชื่อ database
- `user=` / `password=` — บัญชี SQL Server authentication
- `trustServerCertificate=true` — ยอมรับ self-signed certificate (จำเป็นสำหรับ dev / Docker; production ควรใช้ certificate จริง)

> ถ้ารหัสผ่านมีอักขระพิเศษอย่าง `;` `=` `{` `}` ให้ครอบรหัสผ่านด้วย `{}` เช่น `password={my;pass}`

### 2.5 ไฟล์ `src/lib/prisma.ts` — Prisma Client แบบ singleton

สร้างโฟลเดอร์ `src/lib/` แล้วสร้างไฟล์:

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMssql(process.env.DATABASE_URL!);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

อธิบายทีละส่วน:
- **`@/generated/prisma/client`** — Prisma 7 generate client ไปไว้ที่ `src/generated/prisma` (กำหนดใน `generator` ของ schema ใน Step 3) ไม่ใช่ `node_modules/.prisma` แบบเวอร์ชันเก่า — **ตอนนี้ import นี้จะยัง error เพราะยังไม่ได้ generate** ไม่ต้องตกใจ จะหายหลัง Step 3
- **`new PrismaMssql(DATABASE_URL)`** — สร้าง adapter ที่ต่อ SQL Server ผ่าน driver `mssql` แล้วส่งให้ `PrismaClient`
- **ทำไมต้องเก็บไว้ใน `globalThis`** — ตอน dev, Next.js hot-reload module บ่อยมาก ถ้าสร้าง `new PrismaClient()` ทุกครั้งที่ reload จะเปิด connection pool ใหม่เรื่อยๆ จนเต็ม (error "too many connections") การเก็บ instance ไว้ใน `globalThis` ทำให้ reload แล้วใช้ตัวเดิม
- **`NODE_ENV !== "production"`** — production ไม่มี hot-reload จึงไม่ต้องเก็บ global

**ข้อควรระวังเฉพาะ SQL Server** (ต่างจาก Postgres/MySQL — จะเจอใน Step 3):
- ไม่รองรับ `enum` ใน Prisma schema → ใช้ `String` แล้วเขียน comment บอกค่าที่เป็นไปได้
- ไม่อนุญาตให้มี **multiple cascade paths** ไปยังตารางเดียวกัน → ต้องใส่ `onDelete: NoAction` ในบาง relation
- `String? @unique` ไม่ยอมให้มี `NULL` ซ้ำสองแถว → ต้องใช้ filtered unique index

---

## Step 3: ออกแบบ Prisma schema + migration + seed

### 3.1 ไฟล์ `prisma/schema.prisma`

แทนที่เนื้อหาทั้งไฟล์ด้วย:

```prisma
// Prisma schema for the internal document management system (twp_document_system)
// Datasource: Microsoft SQL Server

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlserver"
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

// UserRole: "ADMIN" (full access across all departments) | "STAFF" (own department only)
// | "VIEWER" (read-only across all departments — view/preview/download/print, no create/edit/delete, no /admin access)
// | "MANAGER" (same scope as STAFF, plus can approve documents in their own department and
//   delete an approved document/attachment in their own department — see canDeleteDocument in access.ts)
// SQL Server connector does not support native enums, so roles/statuses are plain strings.
model User {
  id           String  @id @default(cuid())
  employeeCode String? @unique // รหัสพนักงาน (optional)
  email        String  @unique
  name         String
  passwordHash String
  avatarPath   String? // path/key ของรูปโปรไฟล์ (relative ต่อ storage/avatars), see src/lib/storage.ts
  role         String  @default("STAFF")
  isActive     Boolean @default(true)

  departmentId String
  department   Department @relation(fields: [departmentId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  createdDocuments  Document[]      @relation("DocumentCreatedBy")
  approvedDocuments Document[]      @relation("DocumentApprovedBy")
  auditLogs         DocumentAudit[]

  // Extra document types this user may view across all departments (in
  // addition to their own department's documents) — see DocumentTypeAccess.
  documentTypeAccess DocumentTypeAccess[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([departmentId])
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

// หน่วยงาน
model Department {
  id   String @id @default(cuid())
  code String @unique // รหัสหน่วยงาน เช่น "HR", "IT"
  name String // ชื่อหน่วยงาน

  isActive Boolean @default(true)

  users     User[]
  documents Document[]

  // ประเภทเอกสารที่หน่วยงานนี้เป็น "เจ้าของ" (มีสิทธิ์สร้างเอกสารประเภทนั้น)
  ownedDocumentTypes DocumentType[] @relation("DocumentTypeOwner")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ประเภทเอกสาร
model DocumentType {
  id   String @id @default(cuid())
  code String @unique // รหัสประเภท เช่น "MEMO", "CONTRACT"
  name String // ชื่อประเภทเอกสาร

  // running-number config used when generating เลขที่เอกสาร, e.g. "{code}-{year}-{seq:4}"
  numberFormat String @default("{code}-{year}-{seq:4}")
  isActive     Boolean @default(true)

  // หน่วยงานเจ้าของประเภทเอกสารนี้ — มีเพียงหน่วยงานนี้ (หรือ admin) เท่านั้นที่สร้างเอกสารประเภทนี้ได้
  // ถ้าเป็น null ทุกหน่วยงานสร้างเอกสารประเภทนี้ได้ตามปกติ
  ownerDepartmentId String?
  ownerDepartment   Department? @relation("DocumentTypeOwner", fields: [ownerDepartmentId], references: [id], onDelete: SetNull, onUpdate: NoAction)

  documents Document[]
  userAccess DocumentTypeAccess[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerDepartmentId])
}

// ให้สิทธิ์ user ดูเอกสารประเภทนี้ได้ข้ามหน่วยงาน (นอกเหนือจากเอกสารของหน่วยงานตัวเอง)
// เช่น ผู้ใช้ฝ่ายบัญชีได้รับสิทธิ์ดูประเภท "ใบกำกับภาษี" จากทุกหน่วยงาน
model DocumentTypeAccess {
  id String @id @default(cuid())

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  documentTypeId String
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, documentTypeId])
  @@index([documentTypeId])
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

// DocumentStatus: "DRAFT" | "ACTIVE" | "ARCHIVED"
model Document {
  id String @id @default(cuid())

  // เลขที่เอกสาร - unique, primary search key
  documentNumber String @unique

  title       String
  description String? @db.NVarChar(Max)
  status      String  @default("ACTIVE")

  documentTypeId String
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  departmentId String
  department   Department @relation(fields: [departmentId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  documentDate DateTime // วันที่ของเอกสาร (เช่น วันที่ลงนาม)

  createdById String
  createdBy   User   @relation("DocumentCreatedBy", fields: [createdById], references: [id], onDelete: NoAction, onUpdate: NoAction)

  // ถ้า approvedAt ไม่เป็น null แปลว่าเอกสารนี้ "ถูกต้องแล้ว" — ลบเอกสาร/ไฟล์แนบไม่ได้
  // ยกเว้น ADMIN หรือ MANAGER ของหน่วยงานเดียวกับเอกสารนี้ (ดู canDeleteDocument ใน access.ts)
  approvedAt   DateTime?
  approvedById String?
  approvedBy   User?     @relation("DocumentApprovedBy", fields: [approvedById], references: [id], onDelete: NoAction, onUpdate: NoAction)

  files     DocumentFile[]
  auditLogs DocumentAudit[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // เลขที่เอกสารคือ primary search key; ดัชนีเพิ่มเติมรองรับการค้นตามหน่วยงาน/ประเภท/สถานะ
  @@index([departmentId])
  @@index([documentTypeId])
  @@index([status])
  @@index([documentDate])
}

// ไฟล์แนบของเอกสาร (รองรับหลายไฟล์ต่อ 1 เอกสาร)
model DocumentFile {
  id String @id @default(cuid())

  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  fileName    String // ชื่อไฟล์ต้นฉบับ
  storagePath String // path/key ที่เก็บจริงบน disk หรือ object storage
  mimeType    String
  sizeBytes   Int

  uploadedAt DateTime @default(now())

  @@index([documentId])
}

// audit trail: บันทึกการสร้าง/ลบ/ดาวน์โหลดเอกสาร
// action: "CREATE" | "UPDATE" | "DOWNLOAD" | "DELETE" | "ARCHIVE" | "APPROVE"
//
// documentId เป็น nullable + onDelete: SetNull (ไม่ใช่ Cascade) โดยตั้งใจ —
// ถ้า cascade ไปด้วย แถว audit ของการ "ลบ" เอกสารจะถูกลบทิ้งไปพร้อมกับเอกสารที่มันบันทึกไว้
// ทำให้ตรวจสอบย้อนหลังไม่ได้ว่าใครลบเอกสารไปเมื่อไหร่ — จึงเก็บ documentNumber/documentTitle
// เป็น snapshot ไว้ในแถวเองด้วย เพื่อให้ log ยังอ่านได้แม้เอกสารต้นฉบับถูกลบไปแล้ว
model DocumentAudit {
  id String @id @default(cuid())

  documentId String?
  document   Document? @relation(fields: [documentId], references: [id], onDelete: SetNull, onUpdate: NoAction)

  documentNumber String // snapshot ตอน log ถูกสร้าง ใช้แสดงผลได้แม้เอกสารถูกลบไปแล้ว
  documentTitle  String

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  action String
  detail String?

  createdAt DateTime @default(now())

  @@index([documentId])
  @@index([userId])
  @@index([createdAt])
}
```

### 3.2 อธิบาย schema แบบละเอียด

#### ส่วนหัวไฟล์

- **`generator client`** — `provider = "prisma-client"` คือ generator ใหม่ของ Prisma 7 (แทน `prisma-client-js`) และ `output` บังคับต้องระบุ — เราให้ generate ไปที่ `src/generated/prisma` ซึ่งอยู่ใน `.gitignore` แล้ว
- **`datasource db`** — ไม่มี `url` ในนี้ เพราะ Prisma 7 ย้ายไปไว้ใน `prisma.config.ts` (CLI) และ adapter (runtime)

#### ชนิดข้อมูลพื้นฐานที่ใช้ซ้ำทุก model

| รูปแบบ | ความหมาย |
|---|---|
| `id String @id @default(cuid())` | primary key เป็น string สุ่มแบบ cuid (เช่น `cm1x2y3z...`) — เดายากกว่าเลข running, ใส่ใน URL ได้ปลอดภัย |
| `createdAt DateTime @default(now())` | เวลาสร้าง ใส่อัตโนมัติ |
| `updatedAt DateTime @updatedAt` | เวลาแก้ไขล่าสุด Prisma อัปเดตให้อัตโนมัติทุกครั้งที่ `update` |
| `isActive Boolean @default(true)` | "ปิดใช้งาน" แทนการลบ — ใช้กับข้อมูลที่มี record อื่นอ้างอิงอยู่ |

#### Model `User`

- `role String @default("STAFF")` — เป็น string เพราะ SQL Server ไม่รองรับ enum ค่าที่ใช้: `ADMIN`/`MANAGER`/`STAFF`/`VIEWER`
- `employeeCode String? @unique` — optional แต่ต้องไม่ซ้ำ → **มีปัญหาบน SQL Server** (อธิบายใน 3.4)
- `passwordHash` — เก็บ hash จาก bcrypt ไม่เก็บรหัสผ่านจริงเด็ดขาด
- `avatarPath` — path ของรูปโปรไฟล์ relative ต่อ `storage/avatars/`
- `createdDocuments` / `approvedDocuments` — User มี relation ไป `Document` **สองทาง** (คนสร้าง และคนอนุมัติ) จึงต้องตั้งชื่อ relation (`"DocumentCreatedBy"`, `"DocumentApprovedBy"`) ให้ Prisma แยกออก

#### Model `Department`

- `code @unique` — รหัสสั้นเช่น `HR`, `IT` ห้ามซ้ำ
- `ownedDocumentTypes` — ขาย้อนกลับของ `DocumentType.ownerDepartment` (relation ชื่อ `"DocumentTypeOwner"`)

#### Model `DocumentType`

- `numberFormat` — template สำหรับสร้างเลขที่เอกสาร รองรับ placeholder `{code}`, `{year}`, `{seq}`, `{seq:N}` (เติม 0 ข้างหน้าให้ครบ N หลัก) — เช่น `{code}-{year}-{seq:4}` → `MEMO-2026-0007`
- `ownerDepartmentId String?` + `onDelete: SetNull` — ถ้ากำหนด เฉพาะหน่วยงานนี้สร้างเอกสารประเภทนี้ได้ ถ้าลบหน่วยงานเจ้าของ ค่าจะกลายเป็น `null` (= ทุกหน่วยงานสร้างได้) แทนที่จะลบประเภทเอกสารทิ้ง

#### Model `DocumentTypeAccess` (ตาราง join)

- เชื่อม `User` ↔ `DocumentType` แบบ many-to-many
- `@@unique([userId, documentTypeId])` — กันไม่ให้ให้สิทธิ์ซ้ำคู่เดิม
- `onDelete: Cascade` ทั้งสองขา — ลบ user หรือประเภทเอกสาร สิทธิ์ที่เกี่ยวข้องหายไปด้วย (ถูกต้อง เพราะสิทธิ์ไม่มีความหมายถ้าไม่มีเจ้าของ)

#### Model `Document`

- `documentNumber @unique` — **primary search key** ที่ผู้ใช้ค้นหา
- `description @db.NVarChar(Max)` — ปกติ Prisma map `String` เป็น `NVARCHAR(1000)` สำหรับรายละเอียดยาวๆ ต้องขยายเป็น `MAX`
- `onDelete: NoAction, onUpdate: NoAction` บน `documentType`, `department`, `createdBy` — **นี่คือจุดสำคัญของ SQL Server**: ถ้าปล่อย default (Cascade) SQL Server จะเจอ path การ cascade หลายเส้นทางมาที่ `Document` (เช่น `Department → User → Document` และ `Department → Document`) แล้ว migration จะ fail ด้วย error *"may cause cycles or multiple cascade paths"* — การตั้ง `NoAction` บอกว่า "ห้ามลบ parent ถ้ายังมี Document อ้างอิงอยู่" ซึ่งตรงกับ business rule อยู่แล้ว (โค้ดฝั่ง admin จะเช็คก่อนลบและแนะนำให้ "ปิดใช้งาน" แทน)
- `approvedAt` / `approvedById` — ระบบอนุมัติ (Step 11) `null` = ยังไม่อนุมัติ
- `@@index` 4 ตัว — เร่งความเร็ว query ที่ filter ตามหน่วยงาน, ประเภท, สถานะ, วันที่

#### Model `DocumentFile`

- เก็บแค่ **metadata** (ชื่อไฟล์, path, mime type, ขนาด) ตัวไฟล์จริงอยู่บน disk
- `onDelete: Cascade` — ลบเอกสาร → แถวไฟล์แนบหายด้วย (ตัวไฟล์บน disk โค้ดลบเองใน Step 9)

#### Model `DocumentAudit` — ทำไมไม่ Cascade

ถ้าเขียนแบบ "ธรรมชาติ" คือ `documentId String` + `onDelete: Cascade` จะเกิดปัญหา: ตอนลบเอกสาร เราบันทึก log `"DELETE"` แล้วลบเอกสาร → cascade ลบ log ทั้งหมดของเอกสารนั้นทิ้ง **รวมถึง log ที่บอกว่าใครเป็นคนลบ** → audit trail ของการลบไม่เคยอยู่รอดเลย

วิธีแก้ที่ใช้ในสคีมานี้:
1. `documentId String?` + `onDelete: SetNull` — เอกสารถูกลบ log ยังอยู่ แค่ `documentId` กลายเป็น `null`
2. `documentNumber` / `documentTitle` เป็น **snapshot** — copy ค่ามาเก็บตอนสร้าง log ไม่ต้อง join กับ `Document` ตอนแสดง (เพราะถ้าเอกสารถูกลบ join จะไม่ได้อะไร)

### 3.3 รัน migration แรก

```bash
npx prisma migrate dev --name start
```

คำสั่งนี้ทำ 3 อย่าง:
1. เปรียบเทียบ schema กับ database แล้วสร้างไฟล์ SQL ที่ `prisma/migrations/<timestamp>_start/migration.sql`
2. รัน SQL นั้นกับ database
3. รัน `prisma generate` ให้อัตโนมัติ → ได้โฟลเดอร์ `src/generated/prisma/`

ลองเปิดไฟล์ `migration.sql` ดู จะเห็นว่า Prisma ครอบทุกอย่างด้วย `BEGIN TRY / BEGIN TRAN ... COMMIT TRAN / END TRY BEGIN CATCH ... ROLLBACK` — ถ้ามีคำสั่งไหน fail ทั้ง migration จะ rollback ไม่ค้างครึ่งๆ กลางๆ

### 3.4 Migration แบบเขียนเอง: filtered unique index สำหรับ `employeeCode`

**ปัญหา**: SQL Server ถือว่า `NULL` สองค่า "ซ้ำกัน" สำหรับ `UNIQUE` constraint (ต่างจาก Postgres) → ถ้ามี user สองคนที่ไม่ได้กรอก `employeeCode` คนที่สองจะสร้างไม่ได้ (error P2002)

**วิธีแก้**: สร้าง migration เปล่าแล้วเขียน SQL เอง

```bash
npx prisma migrate dev --create-only --name employee_code_filtered_unique
```

`--create-only` = สร้างไฟล์ migration แต่ยังไม่รัน เปิดไฟล์ `prisma/migrations/<timestamp>_employee_code_filtered_unique/migration.sql` ที่ได้ แล้วแทนที่เนื้อหาด้วย:

```sql
-- SQL Server's plain UNIQUE constraint treats multiple NULLs as duplicates
-- (unlike Postgres), so any two users without an employeeCode collided on
-- create. Replace it with a filtered unique index that only enforces
-- uniqueness among non-NULL values.
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_employeeCode_key];

CREATE UNIQUE NONCLUSTERED INDEX [User_employeeCode_key]
    ON [dbo].[User]([employeeCode])
    WHERE [employeeCode] IS NOT NULL;
```

อธิบาย:
- `DROP CONSTRAINT` — ลบ unique constraint แบบปกติที่ Prisma สร้างใน migration แรก
- `CREATE UNIQUE ... WHERE [employeeCode] IS NOT NULL` — **filtered index** บังคับความไม่ซ้ำเฉพาะแถวที่มีค่า แถวที่เป็น `NULL` จะมีกี่แถวก็ได้
- ใช้ชื่อ index เดิม (`User_employeeCode_key`) เพื่อให้ Prisma ยังมองว่า schema ตรงกัน

รัน migration นี้:

```bash
npx prisma migrate dev
```

### 3.5 ไฟล์ `prisma/seed.ts` — ข้อมูลเริ่มต้น

สร้างไฟล์ `prisma/seed.ts`:

```ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import bcrypt from "bcryptjs";

const adapter = new PrismaMssql(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const itDept = await prisma.department.upsert({
    where: { code: "IT" },
    update: {},
    create: { code: "IT", name: "ฝ่ายเทคโนโลยีสารสนเทศ" },
  });

  await prisma.department.upsert({
    where: { code: "HR" },
    update: {},
    create: { code: "HR", name: "ฝ่ายทรัพยากรบุคคล" },
  });

  await prisma.documentType.upsert({
    where: { code: "MEMO" },
    update: {},
    create: { code: "MEMO", name: "บันทึกข้อความ", numberFormat: "{code}-{year}-{seq:4}" },
  });

  await prisma.documentType.upsert({
    where: { code: "CONTRACT" },
    update: {},
    create: { code: "CONTRACT", name: "สัญญา", numberFormat: "{code}-{year}-{seq:4}" },
  });

  const passwordHash = await bcrypt.hash("Admin@1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@company.local" },
    update: {},
    create: {
      email: "admin@company.local",
      name: "System Admin",
      passwordHash,
      role: "ADMIN",
      departmentId: itDept.id,
    },
  });

  console.log("Seed complete. Login with admin@company.local / Admin@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

อธิบาย:
- **ทำไมไม่ import `@/lib/prisma`** — seed รันด้วย `tsx` นอก Next.js จึงไม่รู้จัก alias `@/` และไม่มี Next.js โหลด `.env` ให้ → ต้อง `import "dotenv/config"` เอง และใช้ relative path `../src/generated/prisma/client`
- **`upsert` แทน `create`** — รัน seed ซ้ำกี่ครั้งก็ไม่ error (ถ้ามีอยู่แล้วก็ไม่ทำอะไร เพราะ `update: {}`) เรียกว่า **idempotent**
- **`bcrypt.hash(..., 10)`** — 10 คือ cost factor (จำนวนรอบ 2^10) ค่ามาตรฐานที่สมดุลระหว่างความปลอดภัยกับความเร็ว
- สร้าง admin คนแรกไว้ในหน่วยงาน IT เพราะหน้าจัดการผู้ใช้ต้อง login เป็น admin ก่อน (ไก่กับไข่)

seed ใช้ `bcryptjs` ซึ่งยังไม่ได้ติดตั้ง ให้ติดตั้งก่อน (จะใช้อีกครั้งใน Step 4):

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### 3.6 แก้ `package.json` — เพิ่ม scripts

แก้ส่วน `"scripts"` และเพิ่มส่วน `"prisma"`:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
```

| Script | ใช้เมื่อ |
|---|---|
| `npm run db:migrate` | dev — แก้ schema แล้วสร้าง migration ใหม่ |
| `npm run db:migrate:deploy` | production — รัน migration ที่มีอยู่แล้วเท่านั้น (ไม่สร้างใหม่ ไม่ reset DB) |
| `npm run db:seed` | ใส่ข้อมูลเริ่มต้น |
| `npm run db:studio` | เปิด GUI ดู/แก้ข้อมูลในเบราว์เซอร์ |

รัน seed:

```bash
npm run db:seed
```

### ✅ ตรวจสอบ Step 3

1. terminal แสดง `Seed complete. Login with admin@company.local / Admin@1234`
2. รัน `npm run db:studio` → เปิดเบราว์เซอร์ เห็นตาราง 7 ตาราง, `Department` มี 2 แถว, `DocumentType` มี 2 แถว, `User` มี 1 แถว
3. มีโฟลเดอร์ `src/generated/prisma/` แล้ว และ error ใน `src/lib/prisma.ts` หายไป

---

## Step 4: Authentication (NextAuth v5)

### 4.1 ติดตั้ง

```bash
npm install next-auth@beta
```

(`bcryptjs` ติดตั้งไปแล้วใน Step 3.5)

สร้างค่า `AUTH_SECRET` (ใช้เข้ารหัส JWT ของ session) แล้วนำไปใส่ใน `.env`:

```bash
npx auth secret
```

คำสั่งนี้จะเขียน `AUTH_SECRET` ลงไฟล์ `.env.local` ให้อัตโนมัติ — ย้ายค่าไปไว้ใน `.env` แทนค่า `"เปลี่ยนเป็นค่าสุ่มยาวๆ"` (หรือเก็บไว้ใน `.env.local` ก็ได้ Next.js อ่านทั้งสองไฟล์) **ห้ามใช้ค่าเดียวกันระหว่าง dev กับ production** และห้าม commit

### 4.2 ภาพรวมโครงสร้าง auth (อ่านก่อนเขียนโค้ด)

```
Browser ──► src/proxy.ts (Edge runtime)          ← ใช้ auth.config.ts (ไม่มี DB)
              │  ยังไม่ login? → redirect /login
              ▼
           Page / Server Action (Node runtime)    ← ใช้ auth.ts (มี Prisma + bcrypt)
              │  await auth() → session.user
              ▼
           /api/auth/[...nextauth]                 ← endpoint ของ NextAuth (signin/signout/callback)
```

**ทำไมต้องแยก config เป็น 2 ไฟล์**: `proxy.ts` (ชื่อใหม่ของ middleware ใน Next.js 16) รันบน **Edge runtime** ซึ่งไม่มี Node.js API → ใช้ Prisma Client และ bcrypt ไม่ได้ ถ้า `proxy.ts` import `auth.ts` (ที่ import Prisma) build จะพัง เราจึงแยก:
- `auth.config.ts` — ส่วนที่ Edge ใช้ได้ (ไม่มี provider ที่แตะ DB) → proxy ใช้แค่เช็คว่ามี session cookie หรือไม่
- `auth.ts` — config เต็ม มี Credentials provider → ใช้ใน page / server action / API route

### 4.3 ไฟล์ `src/types/next-auth.d.ts` — ขยาย type ของ session

สร้างโฟลเดอร์ `src/types/` แล้วสร้างไฟล์:

```ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    departmentId: string;
    departmentName: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      departmentId: string;
      departmentName: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    departmentId?: string;
    departmentName?: string;
  }
}
```

อธิบาย:
- โดย default `session.user` ของ NextAuth มีแค่ `name`, `email`, `image` — แต่แอปเราต้องรู้ `role` และ `departmentId` ทุกหน้าเพื่อตรวจสิทธิ์
- **`declare module`** = TypeScript "module augmentation" คือการเพิ่ม field เข้าไปใน type ของ library โดยไม่ต้องแก้โค้ด library
- `& DefaultSession["user"]` — รวม field ของเรากับ field เดิม (`name`/`email`/`image`)
- `interface User` — type ของ object ที่ `authorize()` return
- `interface JWT` — type ของ token ที่เก็บใน cookie (optional เพราะตอนแรกยังไม่มีค่า)

### 4.4 ไฟล์ `src/lib/auth.config.ts` — config ที่ Edge-safe

```ts
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config (no Prisma/bcrypt) used by middleware to check
 * session presence only. The Credentials provider itself lives in auth.ts,
 * which runs in the Node.js runtime.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string;
        session.user.departmentName = token.departmentName as string;
      }
      return session;
    },
  },
};
```

อธิบาย:
- `pages.signIn: "/login"` — บอก NextAuth ว่าหน้า login ของเราอยู่ที่ `/login` (ไม่ใช้หน้า default ของ NextAuth)
- `providers: []` — ว่างโดยตั้งใจ เพราะ provider จริงต้องแตะ DB
- `callbacks.session` — แปลงข้อมูลจาก JWT token (`token`) มาใส่ใน `session.user` ที่โค้ดเราอ่าน — `token.sub` คือ user id (NextAuth ใส่ให้อัตโนมัติจาก `id` ที่ `authorize()` return)

### 4.5 ไฟล์ `src/lib/auth.ts` — config เต็ม

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { department: true },
        });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
          departmentName: user.department.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string;
        session.user.departmentName = token.departmentName as string;
      }
      return session;
    },
  },
});
```

อธิบายทีละส่วน:
- **`...authConfig`** — เอา config ส่วน Edge-safe มาใช้ต่อ (เช่น `pages.signIn`) แล้ว override/เพิ่มส่วนที่ต้องใช้ Node
- **`session: { strategy: "jwt" }`** — เก็บ session เป็น JWT ใน cookie (เข้ารหัสด้วย `AUTH_SECRET`) ไม่ต้องมีตาราง session ใน DB — จำเป็นสำหรับ Credentials provider
- **`Credentials({...})`** — login ด้วย email + password ที่เราตรวจเอง
- **`authorize`** — หัวใจของการ login:
  1. ดึง email/password จาก form
  2. หา user จาก email พร้อม `include: { department: true }` เพื่อเอาชื่อหน่วยงาน
  3. **user ถูกปิดใช้งาน (`isActive = false`) → login ไม่ได้**
  4. `bcrypt.compare` เทียบรหัสผ่านกับ hash
  5. return object ที่จะถูกเก็บลง JWT — **return `null` = login ล้มเหลว** (NextAuth จะ throw `AuthError`)
  - สังเกตว่าทุกกรณีที่ fail return `null` เหมือนกัน ไม่บอกว่า "ไม่พบ email" หรือ "รหัสผิด" — ป้องกันการเดาว่า email ไหนมีอยู่ในระบบ
- **`callbacks.jwt`** — เรียกทุกครั้งที่สร้าง/อ่าน token; `user` มีค่า **เฉพาะตอน login ครั้งแรก** เราจึง copy `role`/`departmentId`/`departmentName` ลง token ตอนนั้นครั้งเดียว
- **`callbacks.session`** — เหมือนใน `auth.config.ts` (ต้องเขียนซ้ำเพราะ `callbacks` ของเราเขียนทับ `callbacks` ที่ spread มาจาก `authConfig` ทั้งก้อน)
- **export** 4 ตัว: `handlers` (ใช้ใน API route), `signIn`/`signOut` (เรียกจาก server action), `auth()` (อ่าน session ใน server component)

> **ข้อจำกัดที่ต้องรู้**: เพราะ role/หน่วยงานถูก copy ลง JWT ตอน login ถ้า admin เปลี่ยน role ของ user คนนั้น **user ต้อง logout แล้ว login ใหม่** สิทธิ์ใหม่จึงจะมีผล

### 4.6 ไฟล์ `src/app/api/auth/[...nextauth]/route.ts`

สร้างโฟลเดอร์ `src/app/api/auth/[...nextauth]/` (ชื่อโฟลเดอร์มีจุด 3 จุดและวงเล็บเหลี่ยมจริงๆ) แล้วสร้างไฟล์:

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

อธิบาย:
- `[...nextauth]` คือ **catch-all route** — จับทุก path ใต้ `/api/auth/` เช่น `/api/auth/session`, `/api/auth/callback/credentials`, `/api/auth/signout` แล้วส่งให้ NextAuth จัดการ
- ใน App Router ไฟล์ `route.ts` export ฟังก์ชันชื่อ HTTP method (`GET`, `POST`) — เรา export handler ของ NextAuth ตรงๆ

### 4.7 ไฟล์ `src/proxy.ts` — ป้องกันทุกหน้าที่ต้อง login

สร้างที่ `src/proxy.ts` (ระดับเดียวกับโฟลเดอร์ `app/` **ไม่ใช่** ข้างใน `app/`):

```ts
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/documents", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

อธิบาย:
- **Next.js 16 เปลี่ยนชื่อ `middleware.ts` เป็น `proxy.ts`** — หน้าที่เหมือนเดิม: รันก่อนทุก request
- `NextAuth(authConfig)` — สร้าง instance ใหม่จาก config **Edge-safe** (ไม่ใช่ import จาก `auth.ts`!)
- `req.auth` — session (ถ้ามี cookie ที่ถูกต้อง) หรือ `null`
- **ยังไม่ login + ไม่ได้อยู่หน้า login** → redirect ไป `/login?callbackUrl=/หน้าเดิม` เพื่อ login เสร็จแล้วพากลับมาหน้าเดิม
- **login แล้ว + เข้าหน้า login** → เด้งไป `/documents` (ไม่ต้อง login ซ้ำ)
- `matcher` — regex บอกว่า proxy ทำงานกับทุก path **ยกเว้น** `api/auth` (endpoint ของ NextAuth เอง ต้องเข้าได้ตอนยังไม่ login), ไฟล์ static ของ Next.js และ `favicon.ico`

> proxy เป็นแค่ **ด่านแรก** — ทุก page/action/API route ยังต้องเรียก `auth()` ตรวจซ้ำเสมอ (Step 8)

### 4.8 ไฟล์ `src/components/PasswordInput.tsx` — ช่องรหัสผ่านพร้อมปุ่มโชว์/ซ่อน

หน้า login ใช้ component นี้ จึงสร้างก่อน — สร้างโฟลเดอร์ `src/components/` แล้วสร้างไฟล์:

```tsx
"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

export function PasswordInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const inputId = props.id ?? id;

  return (
    <div className="relative">
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        className={`${className ?? ""} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
      >
        {visible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5"
          >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
```

อธิบาย:
- **`"use client"`** — บรรทัดแรกบอก Next.js ว่านี่คือ **Client Component** (รันในเบราว์เซอร์) เพราะใช้ `useState` และ `onClick` ซึ่ง Server Component ใช้ไม่ได้
- **`InputHTMLAttributes<HTMLInputElement>`** — รับ props ทุกตัวที่ `<input>` ปกติรับได้ (`name`, `required`, `minLength`, `placeholder` ...) แล้ว spread ต่อด้วย `{...props}` → ใช้แทน `<input type="password">` ได้ทุกที่
- **`type={visible ? "text" : "password"}`** — สลับประเภท input เพื่อโชว์/ซ่อน
- **`pr-10`** — เว้นที่ขวาให้ปุ่มรูปตาไม่ทับตัวอักษร
- **`type="button"`** บนปุ่มรูปตา — **สำคัญมาก** ถ้าไม่ใส่ ปุ่มใน `<form>` จะเป็น `type="submit"` โดย default กดแล้วจะ submit ฟอร์มทันที
- **`tabIndex={-1}`** — กด Tab ข้ามปุ่มรูปตาไปช่องถัดไปเลย
- `useId()` — สร้าง id ที่ไม่ซ้ำ ใช้เมื่อผู้เรียกไม่ได้ส่ง `id` มา

### 4.9 ไฟล์ `src/app/login/page.tsx` — หน้า login

```tsx
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { PasswordInput } from "@/components/PasswordInput";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const target = (formData.get("callbackUrl") as string) || "/documents";

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: target,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=1&callbackUrl=${encodeURIComponent(target)}`);
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1420]">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-lg"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">ระบบจัดเก็บเอกสารภายในองค์กร</h1>
          <p className="mt-1 text-sm text-gray-500">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            อีเมลหรือรหัสผ่านไม่ถูกต้อง
          </p>
        )}

        <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/documents"} />

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="user@company.local"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            รหัสผ่าน
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  );
}
```

อธิบายทีละส่วน:
- **Server Component + Server Action** — ทั้งหน้าไม่มี `"use client"` ไม่ต้องใช้ `useState`/`fetch` เลย: ฟอร์ม `action={login}` จะส่ง `FormData` ไปรันฟังก์ชัน `login` บน server ให้เอง
- **`searchParams: Promise<...>`** — ใน Next.js 15+ `searchParams` และ `params` เป็น Promise ต้อง `await` ก่อนใช้
- **`"use server"`** ในฟังก์ชัน `login` — ประกาศให้ฟังก์ชันนี้เป็น Server Action (ฟังก์ชันที่ client เรียกผ่าน form ได้ แต่รันบน server)
- **`signIn("credentials", {...})`** — เรียก `authorize()` ใน `auth.ts`; ถ้าสำเร็จ NextAuth ตั้ง cookie แล้ว redirect ไป `redirectTo`
- **`try/catch` + `AuthError`** — login ไม่สำเร็จ NextAuth จะ throw `AuthError` → เรา redirect กลับมาหน้า login พร้อม `?error=1` ให้แสดงข้อความ
- **`throw err` ท้าย catch — สำคัญ**: `redirect()` ของ Next.js ทำงานโดยการ *throw* error พิเศษ (`NEXT_REDIRECT`) ตอน `signIn` สำเร็จมันก็ throw redirect ออกมา ถ้าเรา catch แล้วกลืนทิ้ง redirect จะไม่เกิด → ต้อง re-throw ทุก error ที่ไม่ใช่ `AuthError`
- **hidden input `callbackUrl`** — ส่งต่อค่าจาก URL (ที่ proxy ใส่ไว้) ไปให้ server action รู้ว่า login แล้วจะพาไปไหน

### ✅ ตรวจสอบ Step 4

```bash
npm run dev
```

1. เปิด `http://localhost:3000/` → ต้องถูก redirect ไป `/login?callbackUrl=%2F`
2. ใส่รหัสผิด → เห็นข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
3. login ด้วย `admin@company.local` / `Admin@1234` → จะ redirect ไปหน้าที่ **ยังไม่มี (404)** ซึ่งถูกต้อง เพราะยังไม่ได้สร้างหน้าเอกสาร — สิ่งที่ต้องเช็คคือ DevTools → Application → Cookies มี `authjs.session-token` แล้ว
4. ลองเข้า `http://localhost:3000/login` อีกครั้ง → ต้องเด้งไป `/documents` (เพราะ login แล้ว)

---

## Step 5: Layout พื้นฐาน + Theme

### 5.1 ไฟล์ `src/app/globals.css`

แทนที่เนื้อหาทั้งไฟล์ด้วย:

```css
@import "tailwindcss";

:root {
  --background: #f3f4f6;
  --foreground: #171717;
  --sidebar-bg: #131a2b;
  --sidebar-active: #2563eb;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

อธิบาย:
- **`@import "tailwindcss"`** — Tailwind v4 ใช้บรรทัดเดียวนี้แทน `@tailwind base/components/utilities` ของ v3 และไม่ต้องมี `tailwind.config.js`
- **`:root { --... }`** — CSS variable กำหนดสีหลักของแอป (พื้นหลังเทาอ่อน, sidebar น้ำเงินเข้ม)
- **`@theme inline`** — ผูก CSS variable เข้ากับ theme ของ Tailwind ทำให้ใช้ class `bg-background` / `text-foreground` ได้
- **ลบ `@media (prefers-color-scheme: dark)` ที่ scaffold ใส่มาออก** — แอปนี้ใช้ light theme ตายตัว ถ้าไม่ลบ เครื่องที่ตั้ง OS เป็น dark mode จะได้ตัวอักษรขาวบนพื้นขาวในบางจุด

### 5.2 ไฟล์ `src/app/layout.tsx` — root layout

แทนที่เนื้อหาด้วย:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบจัดเก็บเอกสารภายในองค์กร",
  description: "Internal document management system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

อธิบาย:
- **root layout** ครอบทุกหน้าในแอป — มีได้ไฟล์เดียว ต้องมี `<html>` และ `<body>`
- `metadata` — title ที่แสดงบน tab เบราว์เซอร์
- `lang="th"` — บอกเบราว์เซอร์/screen reader ว่าเนื้อหาเป็นภาษาไทย
- `LayoutProps<"/">` — type helper ที่ Next.js 16 generate ให้อัตโนมัติ (ไม่ต้อง import)
- **ไม่ใส่ AppShell (topbar + sidebar) ที่นี่** เพราะหน้า login ไม่ต้องมี sidebar — แต่ละหน้าจะครอบ `<AppShell>` เอง

### 5.3 ไฟล์ `src/app/page.tsx` — หน้าแรก

แทนที่เนื้อหาด้วย:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/documents");
}
```

หน้า `/` ไม่มีเนื้อหาของตัวเอง — ส่งต่อไปหน้ารายการเอกสารทันที

### 5.4 ไฟล์ `src/components/SidebarNav.tsx` — เมนูซ้าย

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_NAV_ITEMS = [{ href: "/documents", label: "เอกสารทั้งหมด" }];
const CREATE_NAV_ITEM = { href: "/documents/new", label: "สร้างเอกสาร" };

const ADMIN_NAV_ITEMS = [
  { href: "/admin/departments", label: "หน่วยงาน" },
  { href: "/admin/document-types", label: "ประเภทเอกสาร" },
  { href: "/admin/users", label: "ผู้ใช้งาน" },
  { href: "/admin/audit-log", label: "ประวัติการใช้งาน" },
];

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const isActive = href === "/documents" ? pathname === "/documents" : pathname.startsWith(href);

  return (
    <li>
      <Link
        href={href}
        className={`block rounded px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

export function SidebarNav({
  isAdmin,
  canCreateDocuments = true,
}: {
  isAdmin?: boolean;
  canCreateDocuments?: boolean;
}) {
  const pathname = usePathname();
  const navItems = canCreateDocuments ? [...BASE_NAV_ITEMS, CREATE_NAV_ITEM] : BASE_NAV_ITEMS;

  return (
    <nav className="w-64 shrink-0 bg-[#131a2b] py-4">
      <ul className="space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}
      </ul>

      {isAdmin && (
        <>
          <p className="mt-6 px-7 text-xs font-semibold uppercase tracking-wide text-gray-500">
            จัดการระบบ
          </p>
          <ul className="mt-2 space-y-1 px-3">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} />
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}
```

อธิบาย:
- **ต้องเป็น Client Component** เพราะใช้ `usePathname()` (hook อ่าน URL ปัจจุบันในเบราว์เซอร์) เพื่อไฮไลต์เมนูที่กำลังเปิดอยู่
- **เงื่อนไข `isActive`**:
  - `/documents` ใช้ **เท่ากันพอดี** (`===`) — ถ้าใช้ `startsWith` ตอนอยู่หน้า `/documents/new` เมนู "เอกสารทั้งหมด" จะไฮไลต์พร้อมกับ "สร้างเอกสาร"
  - เมนูอื่นใช้ `startsWith` — อยู่หน้า `/admin/users/abc/edit` เมนู "ผู้ใช้งาน" ยังไฮไลต์
- **`canCreateDocuments`** — role `VIEWER` จะไม่เห็นเมนู "สร้างเอกสาร"
- **`isAdmin`** — เมนูกลุ่ม "จัดการระบบ" โชว์เฉพาะ admin (เป็นแค่การซ่อน UI — การป้องกันจริงอยู่ที่ `requireAdmin()` ใน Step 8)

### 5.5 ไฟล์ `src/components/AppShell.tsx` — โครงหน้าหลัก

```tsx
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
```

อธิบาย:
- **`async` Server Component** — query DB ได้ตรงๆ ใน component: ดึง `avatarPath` ของ user มาตัดสินใจว่าจะแสดงรูปโปรไฟล์หรือตัวอักษรแรกของชื่อ
- **`select: { avatarPath: true }`** — ดึงเฉพาะ field ที่ใช้ ไม่ดึง `passwordHash` มาโดยไม่จำเป็น
- **รูปโปรไฟล์** — ชี้ไป API route `/api/users/[id]/avatar` (สร้างใน Step 11) — ใช้ `<img>` ธรรมดาแทน `next/image` เพราะเป็นรูปที่ต้องผ่านการตรวจ session (comment `eslint-disable` บอก ESLint ว่าตั้งใจ)
- **ปุ่มออกจากระบบ** — ใช้ `<form>` + inline Server Action เรียก `signOut` → ไม่ต้องมี client JS
- **จุดสำคัญ: แยกฟอร์ม logout ออกจากลิงก์อื่น** — `<Link href="/profile">` กับ `<form>` เป็น sibling กัน ไม่ใช่ลิงก์ซ้อนอยู่ใน form (ลิงก์/ปุ่มที่อยู่ใน form เดียวกันกับปุ่ม submit อื่นจะทำงานผิดคาด)
- **layout**: `header` สูง 64px (`h-16`) ด้านบน, ข้างล่างแบ่งเป็น sidebar กว้าง 256px (`w-64`) + main ที่ขยายเต็มพื้นที่ที่เหลือ (`flex-1`)

**วิธีใช้ AppShell ในทุกหน้า** (จะเห็นใน Step 9–11):

```tsx
<AppShell
  userLabel={session.user.name ?? session.user.email ?? undefined}
  userId={session.user.id}
  isAdmin={session.user.role === "ADMIN"}
  role={session.user.role}
>
  {/* เนื้อหาของหน้า */}
</AppShell>
```

### ✅ ตรวจสอบ Step 5

```bash
npx tsc --noEmit
```

ต้องไม่มี error — ยังดูหน้าจอ AppShell ไม่ได้เพราะยังไม่มีหน้าที่ใช้มัน จะเห็นจริงใน Step 9

---

## Step 6: Business logic — เลขที่เอกสารอัตโนมัติ + ค่า config

### 6.1 ไฟล์ `src/lib/config.ts` — ค่าตั้งค่าจาก `.env`

```ts
const DEFAULT_DOCUMENTS_PAGE_SIZE = 20;

export const DOCUMENTS_PAGE_SIZE = (() => {
  const parsed = Number(process.env.DOCUMENTS_PAGE_SIZE);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DOCUMENTS_PAGE_SIZE;
})();

const DEFAULT_AUDIT_LOG_PAGE_SIZE = 30;

export const AUDIT_LOG_PAGE_SIZE = (() => {
  const parsed = Number(process.env.AUDIT_LOG_PAGE_SIZE);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_AUDIT_LOG_PAGE_SIZE;
})();
```

อธิบาย:
- รวมค่าที่ปรับได้จาก `.env` ไว้ที่เดียว หน้าอื่น import ค่าที่ validate แล้วไปใช้ ไม่ต้องอ่าน `process.env` เอง
- **`(() => { ... })()`** — IIFE (ฟังก์ชันที่เรียกตัวเองทันที) คำนวณค่าครั้งเดียวตอนโหลด module
- **validate เสมอ** — `Number("abc")` ได้ `NaN`, `Number(undefined)` ได้ `NaN`, ค่าติดลบ/ทศนิยมก็ไม่สมเหตุสมผล → ถ้าไม่ผ่าน `Number.isInteger(parsed) && parsed > 0` ใช้ค่า default แทน แอปจะไม่พังเพราะพิมพ์ `.env` ผิด

### 6.2 ไฟล์ `src/lib/document-number.ts` — สร้างเลขที่เอกสาร

```ts
import { prisma } from "@/lib/prisma";

/**
 * Generates a document number using a type's numberFormat template, e.g.
 * "{code}-{year}-{seq:4}" -> "MEMO-2026-0007".
 * Sequence resets per document type per year, derived by counting existing
 * documents of that type within the current year (not a separate counter
 * table, so this must run inside the same transaction as the insert to
 * avoid duplicate numbers under concurrent writes).
 */
export async function generateDocumentNumber(
  documentTypeId: string,
  tx: Pick<typeof prisma, "documentType" | "document"> = prisma
): Promise<string> {
  const type = await tx.documentType.findUniqueOrThrow({
    where: { id: documentTypeId },
  });

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const countThisYear = await tx.document.count({
    where: {
      documentTypeId,
      documentDate: { gte: yearStart, lt: yearEnd },
    },
  });

  const seq = countThisYear + 1;

  return type.numberFormat.replace(
    /\{(code|year|seq)(?::(\d+))?\}/g,
    (_match, key: string, pad?: string) => {
      if (key === "code") return type.code;
      if (key === "year") return String(year);
      if (key === "seq") {
        return pad ? String(seq).padStart(Number(pad), "0") : String(seq);
      }
      return "";
    }
  );
}
```

อธิบายทีละขั้น:

1. **พารามิเตอร์ `tx`** — รับได้ทั้ง `prisma` ตัวปกติ หรือ transaction client (`tx` ใน `prisma.$transaction(async (tx) => ...)`) — type `Pick<typeof prisma, "documentType" | "document">` แปลว่า "object อะไรก็ได้ที่มี `.documentType` และ `.document` แบบเดียวกับ prisma" ซึ่ง transaction client ก็มี
2. **หาประเภทเอกสาร** — `findUniqueOrThrow` ถ้าไม่เจอจะ throw เลย (ไม่ต้องเช็ค null เอง)
3. **นับเอกสารประเภทนี้ในปีนี้** — ใช้ `documentDate` อยู่ในช่วง 1 ม.ค. ปีนี้ ถึง ก่อน 1 ม.ค. ปีหน้า → เลขลำดับ **reset ทุกปี แยกตามประเภท**
4. **`seq = count + 1`** — เอกสารถัดไป
5. **แทนค่า placeholder ด้วย regex** `/\{(code|year|seq)(?::(\d+))?\}/g`:

   | ส่วนของ regex | จับอะไร |
   |---|---|
   | `\{` ... `\}` | วงเล็บปีกกาจริงๆ |
   | `(code\|year\|seq)` | กลุ่มที่ 1 → `key` |
   | `(?::(\d+))?` | ส่วน `:4` (optional) — กลุ่มที่ 2 → `pad` คือตัวเลข |
   | `g` | แทนทุกตำแหน่งในสตริง |

   ตัวอย่าง: format `{code}-{year}-{seq:4}`, code `MEMO`, ปี 2026, มีเอกสารแล้ว 6 ฉบับ → `MEMO-2026-0007`

**ข้อควรระวัง (สำคัญมาก)**: ฟังก์ชันนี้ **ต้องถูกเรียกใน transaction เดียวกับการ insert เอกสาร** — ถ้าผู้ใช้ 2 คนกดบันทึกพร้อมกัน ทั้งคู่อาจ count ได้ 6 เท่ากัน → ได้เลข `0007` ซ้ำกัน → คนที่สองจะเจอ unique constraint error แทนที่จะได้เลขผิด (ไม่มีข้อมูลเสีย แต่ต้องกดใหม่) — ถ้าระบบมีการสร้างเอกสารพร้อมกันสูงมาก ควรเปลี่ยนไปใช้ตาราง counter แยก + row lock

> **ข้อจำกัดของ design นี้**: ถ้าลบเอกสารกลางปี count จะลดลง เลขถัดไปอาจชนกับเลขที่มีอยู่แล้ว (เช่น มี 0001–0007 ลบ 0003 → count = 6 → สร้างใหม่ได้ 0007 ซ้ำ) — `documentNumber @unique` จะกันไม่ให้บันทึกซ้ำ แต่ผู้ใช้จะเจอ error; ถ้าองค์กรลบเอกสารบ่อย ให้เปลี่ยนไปหาเลขสูงสุด (`max`) แทนการ `count`

---

## Step 7: จัดเก็บไฟล์แนบ (storage)

### 7.1 ไฟล์ `src/lib/storage.ts`

```ts
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Statically scoped (not built from an env var) so Next.js file tracing doesn't
// pull the whole project into the server bundle. Override via a bind mount at
// this fixed path in deployment if a different location is needed.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "documents");
const AVATAR_STORAGE_ROOT = path.join(process.cwd(), "storage", "avatars");

const DEFAULT_MAX_UPLOAD_SIZE_MB = 20;

export const MAX_UPLOAD_SIZE_MB = (() => {
  const parsed = Number(process.env.MAX_UPLOAD_SIZE_MB);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_UPLOAD_SIZE_MB;
})();

export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const DEFAULT_MAX_AVATAR_SIZE_MB = 5;

export const MAX_AVATAR_SIZE_MB = (() => {
  const parsed = Number(process.env.MAX_AVATAR_SIZE_MB);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_AVATAR_SIZE_MB;
})();

export const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const ALLOWED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function isAllowedAvatarMimeType(mimeType: string): boolean {
  return ALLOWED_AVATAR_MIME_TYPES.includes(mimeType);
}

function assertInsidePath(root: string, fullPath: string) {
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(root)) {
    throw new Error("Resolved storage path escapes the storage root");
  }
  return resolved;
}

export async function saveDocumentFile(
  documentId: string,
  originalFileName: string,
  data: Buffer
): Promise<{ storagePath: string }> {
  const dir = path.join(STORAGE_ROOT, documentId);
  await mkdir(dir, { recursive: true });

  const safeExt = path.extname(originalFileName).slice(0, 20);
  const storedName = `${randomUUID()}${safeExt}`;
  const fullPath = assertInsidePath(STORAGE_ROOT, path.join(dir, storedName));

  await writeFile(fullPath, data);

  // store path relative to storage root so it stays portable across environments
  return { storagePath: path.join(documentId, storedName) };
}

export async function readDocumentFile(storagePath: string): Promise<Buffer> {
  const fullPath = assertInsidePath(STORAGE_ROOT, path.join(STORAGE_ROOT, storagePath));
  return readFile(fullPath);
}

export async function deleteDocumentFile(storagePath: string): Promise<void> {
  const fullPath = assertInsidePath(STORAGE_ROOT, path.join(STORAGE_ROOT, storagePath));
  await unlink(fullPath).catch(() => undefined);
}

export async function saveAvatarFile(
  userId: string,
  originalFileName: string,
  data: Buffer
): Promise<{ storagePath: string }> {
  await mkdir(AVATAR_STORAGE_ROOT, { recursive: true });

  const safeExt = path.extname(originalFileName).slice(0, 10) || ".jpg";
  const storedName = `${userId}-${randomUUID()}${safeExt}`;
  const fullPath = assertInsidePath(AVATAR_STORAGE_ROOT, path.join(AVATAR_STORAGE_ROOT, storedName));

  await writeFile(fullPath, data);

  return { storagePath: storedName };
}

export async function readAvatarFile(storagePath: string): Promise<Buffer> {
  const fullPath = assertInsidePath(AVATAR_STORAGE_ROOT, path.join(AVATAR_STORAGE_ROOT, storagePath));
  return readFile(fullPath);
}

export async function deleteAvatarFile(storagePath: string): Promise<void> {
  const fullPath = assertInsidePath(AVATAR_STORAGE_ROOT, path.join(AVATAR_STORAGE_ROOT, storagePath));
  await unlink(fullPath).catch(() => undefined);
}
```

### 7.2 อธิบายแบบละเอียด

**โครงสร้างโฟลเดอร์ที่ได้บน disk**:

```
storage/
├── documents/
│   ├── <documentId-1>/
│   │   ├── 3f2a...-uuid.pdf
│   │   └── 9b1c...-uuid.jpg
│   └── <documentId-2>/
│       └── ...
└── avatars/
    └── <userId>-<uuid>.png
```

**1. ทำไม path ต้อง "static" ไม่อ่านจาก env var**
`path.join(process.cwd(), "storage", "documents")` — Next.js ตอน build จะวิเคราะห์โค้ด (file tracing) ว่า server ต้องใช้ไฟล์อะไรบ้าง ถ้าเขียน `path.join(process.env.STORAGE_PATH, ...)` มันเดาไม่ได้ว่า path คืออะไร เลยดึง **ทั้งโปรเจกต์** เข้าไปใน bundle → build ช้าและใหญ่ผิดปกติ ถ้าตอน deploy อยากเก็บไฟล์ที่อื่น ให้ mount volume / สร้าง symlink ทับ `storage/` แทน

**2. ค่าจำกัดขนาด** — `MAX_UPLOAD_SIZE_MB` ใช้ pattern เดียวกับ `config.ts` (validate แล้ว fallback) แต่ใช้ `Number.isFinite` เพราะยอมให้เป็นทศนิยมได้ (เช่น 0.5 MB) แล้วแปลงเป็น bytes (`× 1024 × 1024`) ไว้เทียบกับ `file.size`

**3. `assertInsidePath` — ป้องกัน path traversal**
ถ้ามีคนแก้ค่า `storagePath` ใน DB เป็น `../../.env` แล้วสั่งดาวน์โหลด → `path.join(STORAGE_ROOT, "../../.env")` จะชี้ออกนอกโฟลเดอร์ storage ไปอ่านไฟล์ความลับได้ — ฟังก์ชันนี้ `path.resolve` ให้เป็น absolute path ที่ตัด `..` แล้ว เช็คว่ายัง **ขึ้นต้นด้วย root** อยู่หรือไม่ ถ้าไม่ → throw ทันที **ทุกฟังก์ชันที่อ่าน/เขียน/ลบไฟล์เรียก assert นี้ก่อนเสมอ**

**4. `saveDocumentFile`**
- สร้างโฟลเดอร์ย่อยตาม `documentId` (`recursive: true` = ไม่ error ถ้ามีอยู่แล้ว)
- **ตั้งชื่อไฟล์ใหม่เป็น UUID** + นามสกุลเดิม — ไม่ใช้ชื่อไฟล์ที่ผู้ใช้ส่งมา เพราะอาจมีอักขระแปลก/ภาษาไทย/ชื่อซ้ำ/`../` — ชื่อเดิมเก็บไว้ใน DB (`DocumentFile.fileName`) สำหรับแสดงผลและตอนดาวน์โหลด
- `.slice(0, 20)` — ตัดนามสกุลที่ยาวผิดปกติ
- return **relative path** (`<documentId>/<uuid>.pdf`) ไม่ใช่ absolute → ย้ายโปรเจกต์ไปเครื่องอื่น/โฟลเดอร์อื่นได้โดย DB ไม่ต้องแก้

**5. `deleteDocumentFile`** — `.catch(() => undefined)` = ถ้าไฟล์ไม่มีอยู่แล้ว (เคยลบไปแล้ว) ก็ไม่ error — การลบควร idempotent

**6. ฟังก์ชันของ avatar** — แยก root (`storage/avatars/`) ออกจากไฟล์เอกสาร ชื่อไฟล์ขึ้นต้นด้วย `userId` ให้ไล่ดูบน disk ง่าย, `|| ".jpg"` กรณีไฟล์ไม่มีนามสกุล, `isAllowedAvatarMimeType` จำกัดเฉพาะรูปภาพ 4 ชนิด

> อย่าลืม: `/storage/` ต้องอยู่ใน `.gitignore` (ทำแล้วใน Step 1.4)

---

## Step 8: Access control layer

> ใน stepbystep.md หัวข้อนี้คือ Step 9 — ย้ายมาก่อน CRUD เพราะหน้าเอกสารทุกหน้า import ฟังก์ชันจากไฟล์นี้

**หลักการ**: รวม logic ตรวจสิทธิ์ไว้ **ที่เดียว** — ห้ามเขียน `if (user.role === "ADMIN")` กระจายไปทั่วโค้ด เพราะวันหนึ่งที่ต้องแก้กฎ (เช่น เพิ่ม role ใหม่) จะลืมแก้บางจุด แล้วกลายเป็นช่องโหว่

### 8.1 ไฟล์ `src/lib/access.ts`

```ts
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

export function isAdmin(user: SessionUser) {
  return user.role === "ADMIN";
}
```

### 8.2 อธิบายฟังก์ชันทีละตัว

| ฟังก์ชัน | ตอบคำถาม | ใช้ที่ไหน |
|---|---|---|
| `isDepartmentScopedRole` | role นี้ถูกจำกัดให้เห็นแค่หน่วยงานตัวเองหรือไม่ | ภายในไฟล์นี้ |
| `extraViewableDocumentTypeIds` | user นี้ได้รับสิทธิ์พิเศษดูประเภทเอกสารอะไรบ้างจากทุกหน่วยงาน | ภายในไฟล์นี้ |
| `documentScopeFilter` | เงื่อนไข `where` สำหรับ **list** เอกสาร | หน้า `/documents` |
| `canViewDocument` | ดู/พรีวิว/ดาวน์โหลดเอกสาร **1 ฉบับ** ได้ไหม | หน้า detail, API ดาวน์โหลด |
| `canManageDocument` | สร้าง/แก้ไขเอกสารของหน่วยงานนี้ได้ไหม | ใช้ภายใน `canDeleteDocument` |
| `canApproveDocument` | อนุมัติเอกสารได้ไหม | ปุ่ม/action อนุมัติ |
| `canDeleteDocument` | ลบเอกสาร/ไฟล์แนบได้ไหม (ขึ้นกับสถานะอนุมัติ) | ปุ่ม/action ลบ |

**`SessionUser`** — type ที่มีแค่ 3 field ที่จำเป็น → `session.user` ส่งเข้ามาได้เลย (มี field มากกว่าก็ได้ TypeScript ยอม)

**`isDepartmentScopedRole`** — ถ้าวันหนึ่งเพิ่ม role ใหม่ที่ scope เหมือน STAFF ให้แก้ **ที่นี่ที่เดียว** (บทเรียนจากตอนเพิ่ม MANAGER: ถ้าเขียน `role !== "STAFF"` กระจายหลายที่ MANAGER จะเสียสิทธิ์ `DocumentTypeAccess` ไปโดยไม่ตั้งใจ)

**`documentScopeFilter`** — return `Prisma.DocumentWhereInput` (object เงื่อนไขที่ใส่ใน `where` ได้เลย):
- ADMIN/VIEWER → `{}` (ไม่มีเงื่อนไข = เห็นทั้งหมด)
- STAFF/MANAGER ไม่มีสิทธิ์พิเศษ → `{ departmentId: <ของตัวเอง> }`
- STAFF/MANAGER มีสิทธิ์พิเศษ → `{ OR: [หน่วยงานตัวเอง, ประเภทที่ได้สิทธิ์] }`

**แยก "ดู" ออกจาก "จัดการ" อย่างเด็ดขาด** — `canViewDocument` กับ `canManageDocument` เป็นคนละฟังก์ชันโดยตั้งใจ: VIEWER **ดูได้ทุกอย่าง แต่ห้ามแก้ไข/ลบอะไรเลย**, คนที่ได้สิทธิ์ดูข้ามหน่วยงาน (`DocumentTypeAccess`) ก็ **ดูได้อย่างเดียว** — บั๊กที่พบบ่อยคือใช้ฟังก์ชันเดียวกันทั้งดูและแก้ แล้วสิทธิ์ดูกลายเป็นสิทธิ์ลบ

**`canDeleteDocument` = ประกอบจากสองกฎ**:

```
ยังไม่อนุมัติ → ใช้กฎปกติ (canManageDocument): ADMIN หรือคนในหน่วยงานเดียวกัน (ยกเว้น VIEWER)
อนุมัติแล้ว  → ใช้กฎเข้มกว่า (canApproveDocument): ADMIN หรือ MANAGER ของหน่วยงานเดียวกันเท่านั้น
```

**กฎทอง**: ใช้ฟังก์ชันเหล่านี้ **ทั้งสองฝั่ง** — ฝั่ง UI (ซ่อนปุ่ม) และฝั่ง server action/API route (ตรวจซ้ำก่อนทำจริง) — ซ่อนปุ่มอย่างเดียวไม่พอ เพราะคนสามารถยิง request ตรงๆ ได้

### 8.3 ไฟล์ `src/lib/require-admin.ts`

```ts
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

/** Redirects non-admins to a 404 (no admin-only route reveals its existence). */
export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") notFound();
  return session;
}
```

อธิบาย:
- เรียกบรรทัดแรกของ **ทุก** หน้าและทุก server action ใต้ `/admin/*`
- **ตอบ 404 แทน 403/redirect** — คนที่ไม่ใช่ admin จะไม่รู้ด้วยซ้ำว่า URL นี้มีอยู่จริง (ลดข้อมูลที่ผู้ไม่หวังดีเอาไปใช้ได้)
- return `session` ออกไป → ผู้เรียกใช้ต่อได้เลย ไม่ต้อง `auth()` ซ้ำ (และ TypeScript รู้ว่า session ไม่เป็น null เพราะ `notFound()` มี type `never`)

---

## Step 9: CRUD หลัก — เอกสาร

ลำดับการสร้างไฟล์ใน step นี้:

1. Component ที่ใช้ร่วมกัน 6 ตัว (9.1–9.6)
2. Server actions ของเอกสาร (9.7)
3. หน้า list (9.8) → หน้าสร้าง (9.9) → หน้า detail (9.10)
4. API route ดาวน์โหลด/พรีวิวไฟล์ (9.11)

### 9.1 ไฟล์ `src/components/FormattedDate.tsx` — แสดงวันที่ dd/mm/yyyy

```tsx
/**
 * Renders a date as dd/mm/yyyy (Gregorian / ค.ศ.), fixed regardless of locale.
 * Uses UTC getters because document dates are stored as UTC midnight (parsed
 * from a plain "YYYY-MM-DD" <input type="date"> value) — local-time getters
 * would shift the displayed day in timezones behind UTC.
 */
export function FormattedDate({ date }: { date: string | Date }) {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();

  return (
    <>
      {dd}/{mm}/{yyyy}
    </>
  );
}
```

อธิบาย:
- **ทำไมไม่ใช้ `toLocaleDateString("th-TH")`** — locale ไทยจะแสดงเป็น **พ.ศ.** (2569) และรูปแบบขึ้นกับเครื่อง server/browser → เขียน format เองได้ผลเหมือนกันทุกที่
- **ทำไมใช้ `getUTC...`** — `<input type="date">` ส่งค่า `"2026-09-24"` มา `new Date("2026-09-24")` จะได้เวลา **00:00 UTC** ถ้าใช้ `getDate()` (เวลาท้องถิ่น) บนเครื่องที่อยู่โซนหลัง UTC (เช่น อเมริกา) จะได้วันที่ 23 แทน
- `getUTCMonth()` นับจาก 0 จึงต้อง `+ 1`
- `padStart(2, "0")` — เติม 0 ให้ครบสองหลัก (`5` → `05`)
- ไม่มี `"use client"` → เป็น Server Component ได้ ไม่มีปัญหา hydration mismatch เพราะผลเหมือนกันทั้ง server/client

### 9.2 ไฟล์ `src/components/Pagination.tsx` — แบ่งหน้า

```tsx
import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );

  return (
    <nav className="mt-4 flex items-center justify-between text-sm">
      <p className="text-gray-500">
        หน้า {page} จาก {totalPages}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <Link
            href={buildHref(prevPage)}
            aria-disabled={page === 1}
            className={`rounded border px-3 py-1.5 ${
              page === 1
                ? "pointer-events-none border-gray-200 text-gray-300"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            ก่อนหน้า
          </Link>
        </li>

        {pageNumbers.map((p, idx) => {
          const prev = pageNumbers[idx - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <li key={p} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-gray-400">…</span>}
              <Link
                href={buildHref(p)}
                className={`rounded border px-3 py-1.5 ${
                  p === page
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p}
              </Link>
            </li>
          );
        })}

        <li>
          <Link
            href={buildHref(nextPage)}
            aria-disabled={page === totalPages}
            className={`rounded border px-3 py-1.5 ${
              page === totalPages
                ? "pointer-events-none border-gray-200 text-gray-300"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            ถัดไป
          </Link>
        </li>
      </ul>
    </nav>
  );
}
```

อธิบาย:
- **Server Component ล้วน** — ทุกปุ่มคือ `<Link>` ไปยัง URL ที่มี `?page=N` ไม่ต้องมี JavaScript ฝั่ง client เลย และ URL แชร์/bookmark ได้
- **`buildHref`** — ผู้เรียกส่งฟังก์ชันสร้าง URL มาเอง เพราะแต่ละหน้ามี query param อื่นที่ต้องคงไว้ (เช่นคำค้นหา) — Pagination ไม่ต้องรู้เรื่องนั้น
- **เลือกเลขหน้าที่จะแสดง** — หน้าแรก, หน้าสุดท้าย และหน้ารอบๆ หน้าปัจจุบัน ±2 เช่นอยู่หน้า 10 จาก 20 → `1 … 8 9 10 11 12 … 20`
- **`showEllipsis`** — ถ้าเลขหน้าติดกันใน list ห่างกันเกิน 1 ให้แสดง `…` คั่น
- **`pointer-events-none`** — ปิดการคลิกปุ่ม "ก่อนหน้า" ตอนอยู่หน้า 1 (และ "ถัดไป" ตอนอยู่หน้าสุดท้าย)
- มีแค่หน้าเดียว (`totalPages <= 1`) → ไม่แสดงอะไร

### 9.3 ไฟล์ `src/components/DeleteButton.tsx` — ปุ่มลบพร้อม modal ยืนยัน

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeleteButton({
  id,
  itemLabel,
  action,
  onDeleted,
}: {
  id: string;
  itemLabel: string;
  action: (id: string) => Promise<{ error?: string }>;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await action(id);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        if (onDeleted) {
          onDeleted();
        } else {
          router.refresh();
        }
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
      >
        ลบ
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            {error ? (
              <>
                <h2 className="text-base font-semibold text-gray-900">ไม่สามารถลบได้</h2>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    ปิด
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-gray-900">ยืนยันการลบ</h2>
                <p className="mt-2 text-sm text-gray-600">
                  ต้องการลบ &ldquo;{itemLabel}&rdquo; ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPending ? "กำลังลบ..." : "ลบ"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

อธิบาย:
- **ใช้ซ้ำได้กับทุก entity** — รับ `action: (id) => Promise<{ error?: string }>` ใช้ลบได้ทั้ง เอกสาร, ไฟล์แนบ, หน่วยงาน, ประเภทเอกสาร, ผู้ใช้ — แค่ส่ง server action คนละตัวเข้ามา
- **ส่ง server action เป็น prop ได้** — Next.js อนุญาตให้ Server Component ส่งฟังก์ชันที่มี `"use server"` ให้ Client Component เรียกได้ (มันจะกลายเป็น RPC call ไป server)
- **modal ยืนยันเอง แทน `confirm()` ของเบราว์เซอร์** — หน้าตาสอดคล้องกับแอป และแสดง error จาก server ในกล่องเดียวกันได้
- **สัญญา (contract) ของ action**: return `{}` = สำเร็จ, return `{ error: "ข้อความ" }` = ลบไม่ได้ (เช่นมีข้อมูลอื่นผูกอยู่) → modal สลับไปแสดงหน้า "ไม่สามารถลบได้"
- **`useTransition`** — `isPending` เป็น `true` ระหว่างรอ server → ปิดปุ่มกันกดซ้ำ + แสดง "กำลังลบ..."
- **`router.refresh()` — จุดที่มักพลาด**: เพราะเรียก action ผ่าน `startTransition` (ไม่ใช่ `<form action>`) Next.js **ไม่ re-render Server Component ให้อัตโนมัติ** แม้ action จะเรียก `revalidatePath()` แล้วก็ตาม → ต้องเรียก `router.refresh()` เอง ไม่งั้นแถวที่ลบไปแล้วยังค้างอยู่บนจอ
- **`onDeleted`** (optional) — ให้ผู้เรียกกำหนดพฤติกรรมหลังลบเองได้ (ใช้ใน 9.4)

### 9.4 ไฟล์ `src/components/DeleteDocumentButton.tsx`

```tsx
"use client";

import { useRouter } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";

export function DeleteDocumentButton({
  id,
  itemLabel,
  action,
}: {
  id: string;
  itemLabel: string;
  action: (id: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();

  return (
    <DeleteButton
      id={id}
      itemLabel={itemLabel}
      action={action}
      onDeleted={() => router.push("/documents")}
    />
  );
}
```

อธิบาย:
- ใช้ในหน้า **detail ของเอกสาร** — ถ้าลบเอกสารจากหน้าของมันเองแล้วเรียก `router.refresh()` หน้าจะพยายามโหลดเอกสารที่ไม่มีแล้ว → 404 — จึงส่ง `onDeleted` ให้ `router.push("/documents")` พากลับหน้า list แทน
- **ทำไมต้องแยกเป็น component** — Server Component (หน้า detail) ส่งฟังก์ชันธรรมดาอย่าง `() => router.push(...)` ข้ามไป Client Component ไม่ได้ (ส่งได้เฉพาะ server action) จึงต้องห่อ logic นี้ไว้ในฝั่ง client

### 9.5 ไฟล์ `src/components/ApproveButton.tsx` — ปุ่มอนุมัติ

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ApproveButton({
  id,
  itemLabel,
  action,
}: {
  id: string;
  itemLabel: string;
  action: (id: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await action(id);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        อนุมัติเอกสาร
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            {error ? (
              <>
                <h2 className="text-base font-semibold text-gray-900">ไม่สามารถอนุมัติได้</h2>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    ปิด
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-gray-900">ยืนยันการอนุมัติ</h2>
                <p className="mt-2 text-sm text-gray-600">
                  ยืนยันว่า &ldquo;{itemLabel}&rdquo; ถูกต้องแล้ว? หลังอนุมัติ จะลบเอกสารหรือไฟล์แนบได้เฉพาะหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบเท่านั้น
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isPending ? "กำลังอนุมัติ..." : "ยืนยันอนุมัติ"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

อธิบาย: โครงสร้างเหมือน `DeleteButton` ทุกอย่าง (modal ยืนยัน + `useTransition` + `router.refresh()`) ต่างแค่สี (เขียว) และข้อความ — ข้อความยืนยัน **เตือนผลที่ตามมา** ว่าอนุมัติแล้วลบได้เฉพาะหัวหน้างาน/admin เพราะการอนุมัติเป็น one-way (ไม่มีปุ่มยกเลิกอนุมัติ)

### 9.6 ไฟล์ `src/components/FilePreview.tsx` — พรีวิว PDF/รูปภาพ + พิมพ์

```tsx
"use client";

import { useState } from "react";

const PREVIEWABLE_PREFIXES = ["image/"];
const PREVIEWABLE_TYPES = ["application/pdf"];

export function isPreviewable(mimeType: string): boolean {
  return (
    PREVIEWABLE_TYPES.includes(mimeType) ||
    PREVIEWABLE_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
  );
}

export function FilePreview({
  fileName,
  mimeType,
  previewUrl,
}: {
  fileName: string;
  mimeType: string;
  previewUrl: string;
}) {
  const [open, setOpen] = useState(false);

  if (!isPreviewable(mimeType)) return null;

  function handlePrint() {
    const printWindow = window.open(previewUrl, "_blank");
    if (!printWindow) return;
    printWindow.addEventListener("load", () => printWindow.print());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-blue-600 hover:underline"
      >
        ดูตัวอย่าง
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="truncate text-sm font-medium text-gray-900">{fileName}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  พิมพ์
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="ปิด"
                  className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-2">
              {mimeType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title={fileName}
                  className="h-[75vh] w-full rounded border border-gray-200 bg-white"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="mx-auto max-h-[75vh] max-w-full rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

อธิบาย:
- **`isPreviewable`** — พรีวิวได้เฉพาะ PDF และรูปภาพทุกชนิด (`image/*`) ซึ่งเบราว์เซอร์ render เองได้ ไฟล์ Word/Excel ไม่แสดงปุ่ม (return `null`) ให้ดาวน์โหลดอย่างเดียว
- **`previewUrl`** — จะเป็น `/api/documents/<id>/files/<fileId>?inline=1` — พารามิเตอร์ `inline=1` ทำให้ API ตอบ `Content-Disposition: inline` เบราว์เซอร์จึงแสดงแทนการดาวน์โหลด (ดู 9.11)
- **PDF → `<iframe>`** ใช้ PDF viewer ในตัวเบราว์เซอร์, **รูป → `<img>`**
- **พิมพ์** — เปิดไฟล์ใน tab ใหม่ รอโหลดเสร็จ (`load`) แล้วสั่ง `print()` — ถ้าเบราว์เซอร์บล็อก popup `window.open` จะได้ `null` → ไม่ทำอะไร

### 9.7 ไฟล์ `src/app/documents/actions.ts` — server actions ของเอกสาร

สร้างโฟลเดอร์ `src/app/documents/` แล้วสร้างไฟล์:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canDeleteDocument, canApproveDocument } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { deleteDocumentFile } from "@/lib/storage";

export async function deleteDocument(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "กรุณาเข้าสู่ระบบ" };
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: { files: true },
  });

  if (!document) {
    return { error: "ไม่พบเอกสารนี้" };
  }

  if (!canDeleteDocument(session.user, document.departmentId, document.approvedAt !== null)) {
    return {
      error: document.approvedAt
        ? "เอกสารนี้ถูกอนุมัติแล้ว ลบได้เฉพาะหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบ"
        : "ไม่มีสิทธิ์ลบเอกสารนี้",
    };
  }

  await Promise.all(document.files.map((f) => deleteDocumentFile(f.storagePath)));

  // Logged before the delete so it's in the same transaction as the delete
  // itself; documentId is set to NULL (not cascaded away) once the document
  // is gone, but documentNumber/documentTitle keep the row readable — see the
  // schema comment on DocumentAudit for why it isn't CASCADE.
  await prisma.$transaction([
    prisma.documentAudit.create({
      data: {
        documentId: document.id,
        documentNumber: document.documentNumber,
        documentTitle: document.title,
        userId: session.user.id,
        action: "DELETE",
      },
    }),
    prisma.document.delete({ where: { id } }),
  ]);

  revalidatePath("/documents");
  return {};
}

export async function deleteDocumentAttachment(fileId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "กรุณาเข้าสู่ระบบ" };
  }

  const file = await prisma.documentFile.findUnique({
    where: { id: fileId },
    include: { document: true },
  });

  if (!file) {
    return { error: "ไม่พบไฟล์นี้" };
  }

  if (
    !canDeleteDocument(session.user, file.document.departmentId, file.document.approvedAt !== null)
  ) {
    return {
      error: file.document.approvedAt
        ? "เอกสารนี้ถูกอนุมัติแล้ว ลบไฟล์แนบได้เฉพาะหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบ"
        : "ไม่มีสิทธิ์ลบไฟล์นี้",
    };
  }

  await prisma.$transaction([
    prisma.documentFile.delete({ where: { id: fileId } }),
    prisma.documentAudit.create({
      data: {
        documentId: file.document.id,
        documentNumber: file.document.documentNumber,
        documentTitle: file.document.title,
        userId: session.user.id,
        action: "DELETE",
        detail: file.fileName,
      },
    }),
  ]);
  await deleteDocumentFile(file.storagePath);

  revalidatePath(`/documents/${file.documentId}`);
  return {};
}

export async function approveDocument(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "กรุณาเข้าสู่ระบบ" };
  }

  const document = await prisma.document.findUnique({ where: { id } });

  if (!document) {
    return { error: "ไม่พบเอกสารนี้" };
  }

  if (!canApproveDocument(session.user, document.departmentId)) {
    return { error: "มีเพียงหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบเท่านั้นที่อนุมัติเอกสารได้" };
  }

  if (document.approvedAt) {
    return { error: "เอกสารนี้ถูกอนุมัติไปแล้ว" };
  }

  await prisma.$transaction([
    prisma.document.update({
      where: { id },
      data: { approvedAt: new Date(), approvedById: session.user.id },
    }),
    prisma.documentAudit.create({
      data: {
        documentId: document.id,
        documentNumber: document.documentNumber,
        documentTitle: document.title,
        userId: session.user.id,
        action: "APPROVE",
      },
    }),
  ]);

  revalidatePath(`/documents/${id}`);
  return {};
}
```

อธิบาย:
- **`"use server"` บนสุดของไฟล์** — ทุกฟังก์ชันที่ export จากไฟล์นี้เป็น Server Action → Client Component (`DeleteButton`, `ApproveButton`) เรียกได้
- **ทุก action เริ่มด้วยรูปแบบเดียวกัน** (จำไว้ใช้กับทุก action ที่เขียนเอง):
  1. `auth()` — ยังไม่ login → return error
  2. โหลดข้อมูลจาก DB — ไม่เจอ → return error
  3. ตรวจสิทธิ์ด้วยฟังก์ชันจาก `access.ts` — **ห้ามเชื่อว่า UI ซ่อนปุ่มแล้ว** เพราะ server action ถูกเรียกตรงได้
  4. ทำงานจริง
  5. `revalidatePath` — บอก Next.js ให้ล้าง cache ของหน้าที่แสดงข้อมูลนี้
- **ข้อความ error บอกเหตุผลต่างกัน** ตามสถานะอนุมัติ — ผู้ใช้รู้ว่าทำไมลบไม่ได้

**`deleteDocument` — ลำดับการลบ**:
1. ลบไฟล์บน disk ทั้งหมดก่อน (`Promise.all` = ลบพร้อมกันทุกไฟล์)
2. `$transaction([...])` — **บันทึก audit "DELETE" แล้วลบเอกสาร** ในทรานแซกชันเดียว: สำเร็จทั้งคู่หรือไม่เกิดทั้งคู่ — แถว `DocumentFile` ถูก cascade ลบตาม, แถว audit ทั้งหมดของเอกสารนี้ (รวมแถว DELETE ที่เพิ่งสร้าง) ถูก `SET NULL` ที่ `documentId` แต่ยังอยู่ครบ

**`deleteDocumentAttachment` — ลำดับกลับกัน**: ลบแถว DB ก่อน แล้วค่อยลบไฟล์บน disk — เหตุผล: ถ้าลบไฟล์บน disk ไม่สำเร็จ จะเหลือแค่ "ไฟล์กำพร้า" บน disk ที่ไม่มีใครอ้างถึง (ไม่อันตราย) ดีกว่ากรณีกลับกันที่ DB ยังชี้ไปยังไฟล์ที่หายไปแล้ว (ผู้ใช้กดดาวน์โหลดแล้ว error) — `detail: file.fileName` บันทึกว่าลบไฟล์ไหน

**`approveDocument`**:
- ตรวจ `approvedAt` ซ้ำ — กันการอนุมัติซ้ำ (เช่นเปิดสองแท็บ)
- update + audit "APPROVE" ในทรานแซกชันเดียว
- ไม่มี action "ยกเลิกอนุมัติ" — เป็น one-way gate โดยตั้งใจ

**Array form ของ `$transaction([...])`** vs **callback form `$transaction(async (tx) => ...)`**: array form ใช้เมื่อคำสั่งทั้งหมดรู้ล่วงหน้าและไม่ขึ้นกับผลของกันและกัน, callback form (ใช้ใน 9.9) ใช้เมื่อคำสั่งหลังต้องใช้ผลจากคำสั่งก่อน

### 9.8 ไฟล์ `src/app/documents/page.tsx` — รายการเอกสาร + ค้นหา

```tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentScopeFilter, canDeleteDocument } from "@/lib/access";
import { AppShell } from "@/components/AppShell";
import { DeleteButton } from "@/components/DeleteButton";
import { FilePreview } from "@/components/FilePreview";
import { FormattedDate } from "@/components/FormattedDate";
import { Pagination } from "@/components/Pagination";
import { DOCUMENTS_PAGE_SIZE } from "@/lib/config";
import { deleteDocument } from "./actions";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dateFrom?: string; dateTo?: string; page?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const { q, dateFrom, dateTo, page: pageParam } = await searchParams;

  const documentDateFilter: { gte?: Date; lte?: Date } = {};
  if (dateFrom) documentDateFilter.gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    documentDateFilter.lte = end;
  }

  const where = {
    AND: [
      await documentScopeFilter(user),
      ...(q
        ? [{ OR: [{ documentNumber: { contains: q } }, { title: { contains: q } }] }]
        : []),
      ...(dateFrom || dateTo ? [{ documentDate: documentDateFilter }] : []),
    ],
  };

  const totalCount = await prisma.document.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / DOCUMENTS_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(pageParam) || 1));

  const documents = await prisma.document.findMany({
    where,
    include: {
      department: true,
      documentType: true,
      files: { select: { id: true, fileName: true, mimeType: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * DOCUMENTS_PAGE_SIZE,
    take: DOCUMENTS_PAGE_SIZE,
  });

  const canDelete = new Map(
    documents.map((doc) => [
      doc.id,
      canDeleteDocument(user, doc.departmentId, doc.approvedAt !== null),
    ])
  );

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/documents?${qs}` : "/documents";
  }

  return (
    <AppShell
      userLabel={session!.user.name ?? session!.user.email ?? undefined}
      userId={user.id}
      isAdmin={user.role === "ADMIN"}
      role={user.role}
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">เอกสารทั้งหมด</h1>
            <p className="text-sm text-gray-500">
              {user.role === "ADMIN" || user.role === "VIEWER"
                ? "ทุกหน่วยงาน"
                : `หน่วยงาน: ${user.departmentName}`}
            </p>
          </div>
          {user.role !== "VIEWER" && (
            <Link
              href="/documents/new"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + สร้างเอกสาร
            </Link>
          )}
        </header>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form className="mb-6 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">เลขที่เอกสาร / ชื่อเรื่อง</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="ค้นหาตามเลขที่เอกสารหรือชื่อเรื่อง..."
                className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">วันที่เอกสารตั้งแต่</label>
              <input
                type="date"
                name="dateFrom"
                defaultValue={dateFrom}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">ถึงวันที่</label>
              <input
                type="date"
                name="dateTo"
                defaultValue={dateTo}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              ค้นหา
            </button>
            {(q || dateFrom || dateTo) && (
              <Link
                href="/documents"
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
                  <th className="px-4 py-3">เลขที่เอกสาร</th>
                  <th className="px-4 py-3">ชื่อเรื่อง</th>
                  <th className="px-4 py-3">ประเภท</th>
                  <th className="px-4 py-3">หน่วยงาน</th>
                  <th className="px-4 py-3">วันที่เอกสาร</th>
                  <th className="px-4 py-3">ไฟล์แนบ</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {doc.documentNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{doc.title}</td>
                    <td className="px-4 py-3">{doc.documentType.name}</td>
                    <td className="px-4 py-3">{doc.department.name}</td>
                    <td className="px-4 py-3">
                      <FormattedDate date={doc.documentDate} />
                    </td>
                    <td className="px-4 py-3">
                      {doc.files.length === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : doc.files.length === 1 ? (
                        <div className="flex items-center gap-3">
                          <FilePreview
                            fileName={doc.files[0].fileName}
                            mimeType={doc.files[0].mimeType}
                            previewUrl={`/api/documents/${doc.id}/files/${doc.files[0].id}?inline=1`}
                          />
                          <a
                            href={`/api/documents/${doc.id}/files/${doc.files[0].id}`}
                            className="text-blue-600 hover:underline"
                          >
                            ดาวน์โหลด
                          </a>
                        </div>
                      ) : (
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {doc.files.length} ไฟล์
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {doc.approvedAt ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          อนุมัติแล้ว
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          รออนุมัติ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete.get(doc.id) && (
                        <DeleteButton
                          id={doc.id}
                          itemLabel={`เอกสาร ${doc.documentNumber}`}
                          action={deleteDocument}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      ไม่พบเอกสาร
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
```

อธิบายทีละส่วน:

**1. อ่าน session** — `session!.user` ใช้ `!` (non-null assertion) ได้เพราะ `proxy.ts` การันตีแล้วว่าหน้านี้เข้าได้เฉพาะคนที่ login

**2. ตัวกรองวันที่** — `dateTo` ตั้งเวลาเป็น 23:59:59.999 เพื่อให้ "ถึงวันที่ 24" รวมเอกสารของวันที่ 24 ทั้งวัน (ถ้าไม่ตั้ง จะได้แค่ 00:00 ของวันที่ 24)

**3. สร้าง `where` แบบประกอบ** — `AND: [...]` รวมเงื่อนไข 3 กลุ่ม:
- `documentScopeFilter(user)` — **ขอบเขตสิทธิ์ (ใส่เสมอ ห้ามลืม)**
- คำค้นหา (ถ้ามี) — ค้นทั้งเลขที่เอกสาร **หรือ** ชื่อเรื่อง ด้วย `contains` (SQL `LIKE '%q%'`)
- ช่วงวันที่ (ถ้ามี)
- เทคนิค `...(cond ? [x] : [])` — ใส่ element เข้า array เฉพาะเมื่อเงื่อนไขเป็นจริง

**4. Pagination** — `count` ก่อนเพื่อคำนวณจำนวนหน้า แล้ว clamp เลขหน้าที่รับจาก URL ให้อยู่ในช่วง 1..totalPages (กันคนพิมพ์ `?page=-5` หรือ `?page=abc`) แล้วใช้ `skip`/`take` ดึงเฉพาะหน้านั้น

**5. `include` เฉพาะที่ใช้** — `files: { select: { id, fileName, mimeType } }` ไม่ดึง `storagePath` มาหน้า list (ไม่จำเป็นและไม่ควรเปิดเผย)

**6. คำนวณสิทธิ์ลบล่วงหน้า** เก็บใน `Map` — อ่านง่ายกว่าเรียกฟังก์ชันใน JSX

**7. ฟอร์มค้นหาเป็น GET form ธรรมดา** — `<form>` ที่ไม่มี `action` จะ submit เป็น query string ไปที่ URL เดิม (`/documents?q=...&dateFrom=...`) → Server Component อ่านจาก `searchParams` ไม่ต้องมี client JS, และ `defaultValue` ทำให้ช่องค้นหาจำค่าเดิมไว้

**8. คอลัมน์ไฟล์แนบ** — ไม่มีไฟล์ → `-`, มี 1 ไฟล์ → ปุ่มพรีวิว + ดาวน์โหลดตรงนั้นเลย, หลายไฟล์ → ลิงก์ "N ไฟล์" ไปหน้า detail

**9. ปุ่มตามสิทธิ์** — VIEWER ไม่เห็นปุ่ม "+ สร้างเอกสาร", ปุ่มลบแสดงเฉพาะแถวที่ `canDelete` เป็นจริง

### 9.9 ไฟล์ `src/app/documents/new/page.tsx` — สร้างเอกสาร

```tsx
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/document-number";
import { saveDocumentFile, MAX_UPLOAD_SIZE_MB, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage";
import { AppShell } from "@/components/AppShell";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const { error } = await searchParams;

  if (user.role === "VIEWER") notFound();

  const [departments, documentTypes] = await Promise.all([
    prisma.department.findMany({
      where: user.role === "ADMIN" ? { isActive: true } : { id: user.departmentId },
      orderBy: { name: "asc" },
    }),
    prisma.documentType.findMany({
      where: {
        isActive: true,
        // only document types with no owner, or owned by this user's department, are creatable —
        // ADMIN bypasses ownership entirely
        ...(user.role === "ADMIN"
          ? {}
          : { OR: [{ ownerDepartmentId: null }, { ownerDepartmentId: user.departmentId }] }),
      },
      orderBy: { name: "asc" },
    }),
  ]);

  async function createDocument(formData: FormData) {
    "use server";
    const session = await auth();
    const user = session!.user;

    if (user.role === "VIEWER") {
      throw new Error("บัญชีนี้เป็นแบบดูอย่างเดียว ไม่สามารถสร้างเอกสารได้");
    }

    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const documentTypeId = formData.get("documentTypeId") as string;
    const departmentId = formData.get("departmentId") as string;
    const documentDate = new Date(formData.get("documentDate") as string);
    const files = (formData.getAll("files") as File[]).filter((f) => f.size > 0);

    if (user.role !== "ADMIN" && departmentId !== user.departmentId) {
      throw new Error("ไม่มีสิทธิ์สร้างเอกสารให้หน่วยงานอื่น");
    }

    if (user.role !== "ADMIN") {
      const documentType = await prisma.documentType.findUnique({
        where: { id: documentTypeId },
      });
      if (
        documentType?.ownerDepartmentId &&
        documentType.ownerDepartmentId !== user.departmentId
      ) {
        throw new Error("ประเภทเอกสารนี้สงวนสิทธิ์การสร้างไว้ให้หน่วยงานเจ้าของเท่านั้น");
      }
    }

    const oversizedFile = files.find((f) => f.size > MAX_UPLOAD_SIZE_BYTES);
    if (oversizedFile) {
      redirect(
        `/documents/new?error=${encodeURIComponent(
          `ไฟล์ "${oversizedFile.name}" มีขนาดเกิน ${MAX_UPLOAD_SIZE_MB} MB กรุณาเลือกไฟล์ที่เล็กลง`
        )}`
      );
    }

    const documentId = await prisma.$transaction(async (tx) => {
      const documentNumber = await generateDocumentNumber(documentTypeId, tx);

      const doc = await tx.document.create({
        data: {
          documentNumber,
          title,
          description,
          documentTypeId,
          departmentId,
          documentDate,
          createdById: user.id,
        },
      });

      await tx.documentAudit.create({
        data: {
          documentId: doc.id,
          documentNumber: doc.documentNumber,
          documentTitle: doc.title,
          userId: user.id,
          action: "CREATE",
        },
      });

      return doc.id;
    });

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { storagePath } = await saveDocumentFile(documentId, file.name, buffer);
      await prisma.documentFile.create({
        data: {
          documentId,
          fileName: file.name,
          storagePath,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: buffer.byteLength,
        },
      });
    }

    redirect(`/documents/${documentId}`);
  }

  return (
    <AppShell
      userLabel={session!.user.name ?? session!.user.email ?? undefined}
      userId={user.id}
      isAdmin={user.role === "ADMIN"}
      role={user.role}
    >
      <div className="flex justify-center">
        <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">สร้างเอกสารใหม่</h1>
          <p className="mt-1 text-sm text-gray-500">
            กรอกรายละเอียดเอกสาร ระบบจะสร้างเลขที่เอกสารให้อัตโนมัติ
          </p>

          {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form action={createDocument} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อเรื่อง</label>
              <input
                name="title"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รายละเอียด</label>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900">ประเภทเอกสาร</label>
                <select
                  name="documentTypeId"
                  required
                  disabled={documentTypes.length === 0}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {documentTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {documentTypes.length === 0 && (
                  <p className="text-xs text-red-600">
                    หน่วยงานของคุณไม่มีสิทธิ์สร้างเอกสารประเภทใดเลย
                  </p>
                )}
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

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">วันที่เอกสาร</label>
              <input
                type="date"
                name="documentDate"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ไฟล์แนบ</label>
              <input
                type="file"
                name="files"
                multiple
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                แนบได้หลายไฟล์พร้อมกัน — ขนาดไฟล์สูงสุด {MAX_UPLOAD_SIZE_MB} MB ต่อไฟล์
              </p>
            </div>

            <p className="text-xs text-gray-500">
              เลขที่เอกสารจะถูกสร้างให้อัตโนมัติตามรูปแบบของประเภทเอกสารที่เลือก
            </p>

            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              บันทึกเอกสาร
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
```

อธิบายแบบละเอียด:

**ส่วนเตรียมฟอร์ม (render หน้า)**
- VIEWER เข้าหน้านี้ → `notFound()`
- `Promise.all` — query หน่วยงานและประเภทเอกสาร **พร้อมกัน** (เร็วกว่าทำทีละอัน)
- **dropdown หน่วยงาน**: ADMIN เห็นทุกหน่วยงานที่เปิดใช้งาน, คนอื่นเห็นแค่หน่วยงานตัวเอง
- **dropdown ประเภทเอกสาร**: กรองเฉพาะประเภทที่ "ไม่มีเจ้าของ" หรือ "หน่วยงานเราเป็นเจ้าของ" — กรองตั้งแต่ใน dropdown ผู้ใช้จะไม่เห็นตัวเลือกที่เลือกไม่ได้ (UX ดีกว่าปล่อยให้เลือกแล้วค่อย error)

**Server Action `createDocument` — ขั้นตอน**
1. **`auth()` ใหม่อีกครั้ง** ข้างใน action — ห้ามใช้ `user` จากตัวแปรด้านนอก เพราะ action ถูกเรียกแยกเป็นอีก request หนึ่ง
2. ดึงค่าจาก `FormData` — `formData.getAll("files")` ได้ไฟล์ทั้งหมดจาก `<input type="file" multiple>`; `.filter(f => f.size > 0)` ตัดกรณีไม่ได้เลือกไฟล์ (เบราว์เซอร์ส่งไฟล์เปล่าขนาด 0 มา)
3. **validate ซ้ำฝั่ง server ทุกอย่างที่ UI กรองไว้แล้ว** — หน่วยงานต้องเป็นของตัวเอง, ประเภทต้องสร้างได้ — เพราะคนสามารถแก้ HTML ส่งค่าอื่นมาได้
4. **ตรวจขนาดไฟล์ทุกไฟล์** ก่อนแตะ DB — ถ้าเกินให้ `redirect` กลับพร้อม `?error=` แสดงชื่อไฟล์ที่เกิน
5. **Transaction (callback form)**: สร้างเลขที่เอกสาร → insert เอกสาร → insert audit "CREATE" — ทั้งสามอยู่ในทรานแซกชันเดียว เลขที่เอกสารจึงไม่ซ้ำ (ดู Step 6) และไม่มีเอกสารที่ไม่มี log
6. **บันทึกไฟล์ "นอก" transaction** — I/O ของ disk ช้า ถ้าอยู่ใน transaction จะถือ lock ของ DB นาน และ disk rollback ไม่ได้อยู่แล้ว — แต่ละไฟล์: แปลง `File` → `Buffer` → เขียนลง disk → insert แถว `DocumentFile`
7. `file.type || "application/octet-stream"` — บางไฟล์เบราว์เซอร์ไม่รู้ชนิด ใช้ชนิด generic
8. `redirect` ไปหน้า detail ของเอกสารที่เพิ่งสร้าง

**ส่วนฟอร์ม**
- `defaultValue={new Date().toISOString().slice(0, 10)}` — วันที่เริ่มต้นเป็นวันนี้ ในรูป `YYYY-MM-DD` ที่ `<input type="date">` ต้องการ
- `<form action={createDocument}>` กับ `<input type="file">` — Server Action รองรับ upload ไฟล์ได้เลย ไม่ต้องตั้ง `encType` เอง (แต่ต้องปรับ `bodySizeLimit` ใน `next.config.ts` แล้วตาม Step 1.3)

### 9.10 ไฟล์ `src/app/documents/[id]/page.tsx` — รายละเอียดเอกสาร

สร้างโฟลเดอร์ `src/app/documents/[id]/` (`[id]` คือ dynamic segment — ส่วนของ URL ที่เปลี่ยนได้):

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDeleteDocument, canApproveDocument, canViewDocument } from "@/lib/access";
import { AppShell } from "@/components/AppShell";
import { FilePreview } from "@/components/FilePreview";
import { FormattedDate } from "@/components/FormattedDate";
import { DeleteButton } from "@/components/DeleteButton";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { ApproveButton } from "@/components/ApproveButton";
import { deleteDocument, deleteDocumentAttachment, approveDocument } from "../actions";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user;

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      department: true,
      documentType: true,
      createdBy: true,
      approvedBy: true,
      files: true,
    },
  });

  if (!doc) notFound();
  if (!(await canViewDocument(user, doc.departmentId, doc.documentTypeId))) notFound();

  const isApproved = doc.approvedAt !== null;
  const canDelete = canDeleteDocument(user, doc.departmentId, isApproved);
  const canApprove = !isApproved && canApproveDocument(user, doc.departmentId);

  return (
    <AppShell
      userLabel={session!.user.name ?? session!.user.email ?? undefined}
      userId={user.id}
      isAdmin={user.role === "ADMIN"}
      role={user.role}
    >
      <div className="mx-auto max-w-2xl">
        <Link href="/documents" className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปรายการเอกสาร
        </Link>

        <div className="mt-3 rounded-lg bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{doc.title}</h1>
              <p className="mt-1 font-mono text-sm text-gray-500">{doc.documentNumber}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {canApprove && (
                <ApproveButton
                  id={doc.id}
                  itemLabel={`เอกสาร ${doc.documentNumber}`}
                  action={approveDocument}
                />
              )}
              {canDelete && (
                <DeleteDocumentButton
                  id={doc.id}
                  itemLabel={`เอกสาร ${doc.documentNumber}`}
                  action={deleteDocument}
                />
              )}
            </div>
          </div>

          <div className="mt-4">
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                ✓ อนุมัติแล้ว โดย {doc.approvedBy?.name}
                {doc.approvedAt && (
                  <>
                    {" "}
                    เมื่อ <FormattedDate date={doc.approvedAt} />
                  </>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                รออนุมัติ
              </span>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-gray-500">ประเภทเอกสาร</dt>
            <dd>{doc.documentType.name}</dd>

            <dt className="text-gray-500">หน่วยงาน</dt>
            <dd>{doc.department.name}</dd>

            <dt className="text-gray-500">วันที่เอกสาร</dt>
            <dd>
              <FormattedDate date={doc.documentDate} />
            </dd>

            <dt className="text-gray-500">สถานะ</dt>
            <dd>{doc.status}</dd>

            <dt className="text-gray-500">สร้างโดย</dt>
            <dd>{doc.createdBy.name}</dd>

            {doc.description && (
              <>
                <dt className="text-gray-500">รายละเอียด</dt>
                <dd className="whitespace-pre-wrap">{doc.description}</dd>
              </>
            )}
          </dl>

          <h2 className="mt-8 text-sm font-semibold text-gray-900">ไฟล์แนบ</h2>
          <ul className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-200 text-sm">
            {doc.files.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-4 py-2.5">
                <span>{f.fileName}</span>
                <div className="flex items-center gap-4">
                  <FilePreview
                    fileName={f.fileName}
                    mimeType={f.mimeType}
                    previewUrl={`/api/documents/${doc.id}/files/${f.id}?inline=1`}
                  />
                  <a
                    href={`/api/documents/${doc.id}/files/${f.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    ดาวน์โหลด
                  </a>
                  {canDelete && (
                    <DeleteButton
                      id={f.id}
                      itemLabel={`ไฟล์ ${f.fileName}`}
                      action={deleteDocumentAttachment}
                    />
                  )}
                </div>
              </li>
            ))}
            {doc.files.length === 0 && (
              <li className="px-4 py-3 text-gray-400">ไม่มีไฟล์แนบ</li>
            )}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
```

อธิบาย:
- **`params: Promise<{ id: string }>`** — ค่า `[id]` จาก URL (เช่น `/documents/cm1abc` → `id = "cm1abc"`) ต้อง `await`
- **ไม่พบ หรือ ไม่มีสิทธิ์ดู → `notFound()` ทั้งคู่** — ไม่บอกว่า "มีเอกสารนี้แต่คุณดูไม่ได้" (ป้องกันการเดา id)
- **คำนวณ flag สิทธิ์ 3 ตัว** แล้วใช้ใน JSX:
  - `canApprove` = ยังไม่อนุมัติ **และ** มีสิทธิ์อนุมัติ
  - `canDelete` = ใช้กับทั้งปุ่มลบเอกสาร **และ** ปุ่มลบไฟล์แนบทุกไฟล์ (กฎเดียวกัน — ถ้าลืมเปลี่ยนจุดใดจุดหนึ่งตอนเพิ่มระบบอนุมัติ จะกลายเป็นช่องโหว่ที่ลบไฟล์ของเอกสารที่อนุมัติแล้วได้)
- **ปุ่มลบเอกสารใช้ `DeleteDocumentButton`** (ลบแล้วพากลับ `/documents`) ส่วน **ปุ่มลบไฟล์ใช้ `DeleteButton`** (ลบแล้ว refresh หน้าเดิม)
- **`<dl>/<dt>/<dd>`** — HTML สำหรับรายการ "หัวข้อ: ค่า" จัดเป็น grid 2 คอลัมน์
- `whitespace-pre-wrap` — รักษาการขึ้นบรรทัดใหม่ของรายละเอียดที่ผู้ใช้พิมพ์

### 9.11 ไฟล์ `src/app/api/documents/[id]/files/[fileId]/route.ts` — ดาวน์โหลด/พรีวิวไฟล์

สร้างโฟลเดอร์ `src/app/api/documents/[id]/files/[fileId]/` แล้วสร้างไฟล์:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewDocument } from "@/lib/access";
import { readDocumentFile } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await params;
  const inline = new URL(req.url).searchParams.get("inline") === "1";

  const file = await prisma.documentFile.findUnique({
    where: { id: fileId },
    include: { document: true },
  });

  if (!file || file.documentId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await canViewDocument(session.user, file.document.departmentId, file.document.documentTypeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readDocumentFile(file.storagePath);

  await prisma.documentAudit.create({
    data: {
      documentId: file.documentId,
      documentNumber: file.document.documentNumber,
      documentTitle: file.document.title,
      userId: session.user.id,
      action: "DOWNLOAD",
      detail: file.fileName,
    },
  });

  const disposition = inline ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `${disposition}; filename="${encodeURIComponent(file.fileName)}"`,
      "Content-Length": String(file.sizeBytes),
    },
  });
}
```

อธิบาย:
- **ทำไมไม่เก็บไฟล์ใน `public/`** — ไฟล์ใน `public/` ใครก็เปิดได้ถ้ารู้ URL, ไม่มีการตรวจสิทธิ์, ไม่มี log — เราจึงเก็บไว้นอก `public/` แล้วให้ API route นี้เป็น **ประตูเดียว** ที่ต้องผ่านการตรวจสิทธิ์ทุกครั้ง
- **`route.ts` + `export async function GET`** — API route ของ App Router
- **ขั้นตอนตรวจสอบ 3 ชั้น**: ยังไม่ login → 401, ไม่พบไฟล์ **หรือ ไฟล์ไม่ได้เป็นของเอกสาร id นี้** → 404 (กันการเอา fileId ของเอกสารอื่นมาใส่ใน URL ของเอกสารที่ตัวเองดูได้), ไม่มีสิทธิ์ดูเอกสาร → 403
- **บันทึก audit "DOWNLOAD"** ทุกครั้ง (รวมการพรีวิว) พร้อมชื่อไฟล์ใน `detail`
- **`Content-Disposition`**:
  - `attachment` → เบราว์เซอร์ดาวน์โหลดไฟล์
  - `inline` (เมื่อมี `?inline=1`) → เบราว์เซอร์แสดงผลในหน้า (ใช้กับ iframe/img ใน `FilePreview`)
  - `filename="..."` ใช้ `encodeURIComponent` เพราะชื่อไฟล์ภาษาไทยใส่ใน HTTP header ตรงๆ ไม่ได้
- **`new Uint8Array(buffer)`** — `NextResponse` รับ body เป็น `Uint8Array` (Buffer ของ Node ต้องแปลงก่อนเพื่อให้ type ตรง)

### ✅ ตรวจสอบ Step 9

```bash
npm run dev
```

login เป็น admin แล้วทดสอบ:
1. `/documents` → เห็น AppShell (topbar + sidebar) + ตารางว่าง "ไม่พบเอกสาร"
2. กด "+ สร้างเอกสาร" → กรอกข้อมูล แนบ PDF 1 ไฟล์ + รูป 1 ไฟล์ → บันทึก → ถูกพาไปหน้า detail เลขที่เอกสารเป็น `MEMO-2026-0001` (ปีตามปีปัจจุบัน)
3. สร้างอีกฉบับประเภทเดียวกัน → ได้ `...-0002`
4. หน้า detail: กด "ดูตัวอย่าง" → เห็น PDF/รูปใน modal, กด "ดาวน์โหลด" → ได้ไฟล์ชื่อเดิม
5. ลบไฟล์แนบ 1 ไฟล์ → หายจากรายการทันที (ไม่ต้อง reload) และหายจากโฟลเดอร์ `storage/documents/<id>/`
6. กลับหน้า list ทดสอบค้นหาด้วยเลขที่เอกสาร และช่วงวันที่
7. กด "อนุมัติเอกสาร" → สถานะเปลี่ยนเป็น "อนุมัติแล้ว โดย System Admin"
8. เปิด Prisma Studio ดูตาราง `DocumentAudit` → มีแถว CREATE, DOWNLOAD, DELETE, APPROVE

---

## Step 10: หน้า admin จัดการข้อมูลอ้างอิง + audit log

ทั้ง 3 entity (หน่วยงาน, ประเภทเอกสาร, ผู้ใช้) ใช้ **pattern เดียวกัน** เพื่อให้ดูแลง่าย:

```
src/app/admin/<entity>/
├── page.tsx              — /admin/<entity>              ตาราง list (อ่านอย่างเดียว) + ปุ่ม "+ เพิ่ม..."
├── new/page.tsx          — /admin/<entity>/new          ฟอร์มสร้าง (หน้าแยก)
├── [id]/edit/page.tsx    — /admin/<entity>/[id]/edit    ฟอร์มแก้ไข (หน้าแยก)
└── actions.ts            — server actions: create / update / delete ใช้ร่วมกันทุกหน้า
```

**กฎของทุกไฟล์ใน `/admin`**:
1. บรรทัดแรกของทุก page และทุก action ต้องเรียก `await requireAdmin()`
2. **อย่าฝังฟอร์มเพิ่ม/แก้ไขไว้ในหน้า list** — แยกหน้าตั้งแต่แรก: ฟอร์มยาวไม่ดันตารางเบี้ยว, URL แชร์ได้ตรงจุด, โค้ดแต่ละไฟล์สั้น
3. **จัดการ unique constraint error** — ห้ามปล่อย error ดิบของ Prisma ขึ้นจอ: ครอบ `try/catch` ตรวจ `err.code === "P2002"` แล้ว `redirect` กลับพร้อม `?error=ข้อความภาษาไทย`
4. **ลบไม่ได้ถ้ามีข้อมูลผูกอยู่** — นับ record ที่อ้างอิงก่อน ถ้ามี → return `{ error }` แนะนำให้ "ปิดใช้งาน" แทน

### 10.1 หน่วยงาน — `src/app/admin/departments/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function createDepartment(formData: FormData) {
  await requireAdmin();

  const code = (formData.get("code") as string).trim().toUpperCase();
  const name = (formData.get("name") as string).trim();

  try {
    await prisma.department.create({ data: { code, name } });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      redirect(
        `/admin/departments/new?error=${encodeURIComponent(`รหัสหน่วยงาน "${code}" มีอยู่แล้ว`)}`
      );
    }
    throw err;
  }

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function updateDepartment(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  const isActive = formData.get("isActive") === "on";

  await prisma.department.update({ where: { id }, data: { name, isActive } });
  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function deleteDepartment(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const [userCount, documentCount] = await Promise.all([
    prisma.user.count({ where: { departmentId: id } }),
    prisma.document.count({ where: { departmentId: id } }),
  ]);

  if (userCount > 0 || documentCount > 0) {
    return {
      error: `ไม่สามารถลบได้ เนื่องจากมีผู้ใช้ ${userCount} คน และเอกสาร ${documentCount} รายการผูกอยู่กับหน่วยงานนี้ กรุณาปิดใช้งานแทน`,
    };
  }

  await prisma.department.delete({ where: { id } });
  revalidatePath("/admin/departments");
  return {};
}
```

อธิบาย:
- **`isUniqueConstraintError`** — `P2002` คือรหัส error ของ Prisma สำหรับ "ค่าซ้ำกับ unique constraint" (ในที่นี้คือ `code` ซ้ำ)
- **`.trim().toUpperCase()`** — ทำความสะอาดข้อมูล: ตัดช่องว่างหัวท้าย และบังคับรหัสเป็นตัวใหญ่ (`hr` → `HR`) กันการได้ `HR` กับ `hr` เป็นสองหน่วยงาน
- **`redirect` อยู่ใน `catch` แล้วตามด้วย `throw err`** — `redirect` เองก็ throw (หยุดฟังก์ชันทันที) ส่วน error อื่นที่ไม่ใช่ P2002 ให้ throw ต่อ (ไม่กลืน error ที่ไม่รู้จัก)
- **checkbox** — ถ้าติ๊ก ค่าที่ส่งมาคือ `"on"` ถ้าไม่ติ๊กจะไม่ส่งมาเลย (`null`) → `=== "on"` ได้ boolean ถูกต้อง
- **update ไม่ให้แก้ `code`** — รหัสเป็นตัวอ้างอิงถาวร แก้ได้แค่ชื่อและสถานะ
- **create/update ใช้ `redirect`** (เรียกจาก `<form action>`) ส่วน **delete return `{ error? }`** (เรียกจาก `DeleteButton`) — สองรูปแบบนี้ต่างกันเพราะวิธีเรียกต่างกัน
- **`revalidatePath` ก่อน `redirect`** — ล้าง cache หน้า list ให้เห็นข้อมูลใหม่ทันที

### 10.2 หน่วยงาน — `src/app/admin/departments/page.tsx`

```tsx
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
```

อธิบาย:
- **`include: { _count: { select: { users: true, documents: true } } }`** — Prisma นับจำนวน record ที่ผูกอยู่ให้ในคิวรีเดียว (ไม่ต้อง query แยกทุกแถว) แสดงให้ admin เห็นก่อนกดลบว่าหน่วยงานนี้ "ใช้งานอยู่แค่ไหน"
- `isAdmin` (ไม่มีค่า) ใน JSX = `isAdmin={true}` — หน้านี้ผ่าน `requireAdmin()` แล้วจึงเป็น admin แน่นอน
- badge สีเขียว/เทา แสดงสถานะใช้งาน

### 10.3 หน่วยงาน — `src/app/admin/departments/new/page.tsx`

```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { AppShell } from "@/components/AppShell";
import { createDepartment } from "../actions";

export default async function NewDepartmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAdmin();
  const { error } = await searchParams;

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/admin/departments" className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปรายการหน่วยงาน
        </Link>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">เพิ่มหน่วยงานใหม่</h1>
          <p className="mt-1 text-sm text-gray-500">กรอกรหัสและชื่อหน่วยงาน</p>

          {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form action={createDepartment} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รหัสหน่วยงาน</label>
              <input
                name="code"
                required
                maxLength={20}
                placeholder="HR"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อหน่วยงาน</label>
              <input
                name="name"
                required
                placeholder="ฝ่ายทรัพยากรบุคคล"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                เพิ่มหน่วยงาน
              </button>
              <Link
                href="/admin/departments"
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
```

อธิบาย:
- **`?error=`** — ถ้า `createDepartment` redirect กลับมาเพราะรหัสซ้ำ หน้าจะแสดงกล่องสีแดงพร้อมข้อความ
- class `uppercase` — **แสดงผล** เป็นตัวใหญ่ขณะพิมพ์ (แค่ CSS) ส่วนการแปลงจริงอยู่ใน action (`toUpperCase()`)
- `required` / `maxLength` — validation ฝั่ง browser (ด่านแรก เพื่อ UX) — ไม่ใช่การป้องกันจริง
- ปุ่ม "ยกเลิก" เป็น `<Link>` ไม่ใช่ `<button>` → กดแล้วไม่ submit ฟอร์ม

### 10.4 หน่วยงาน — `src/app/admin/departments/[id]/edit/page.tsx`

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { updateDepartment } from "../../actions";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();

  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) notFound();

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/admin/departments" className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปรายการหน่วยงาน
        </Link>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">แก้ไขหน่วยงาน</h1>
          <p className="mt-1 text-sm text-gray-500">รหัสหน่วยงาน: {department.code}</p>

          <form action={updateDepartment} className="mt-6 space-y-5">
            <input type="hidden" name="id" value={department.id} />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อหน่วยงาน</label>
              <input
                name="name"
                required
                defaultValue={department.name}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked={department.isActive} />
              ใช้งาน
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                บันทึกการแก้ไข
              </button>
              <Link
                href="/admin/departments"
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
```

อธิบาย:
- `../../actions` — ไฟล์นี้อยู่ลึกสองชั้น (`[id]/edit/`) จึงถอยขึ้นสองระดับไปหา `actions.ts`
- **`<input type="hidden" name="id">`** — ส่ง id ไปกับฟอร์ม เพราะ action รับแค่ `FormData` ไม่รู้ว่ามาจาก URL ไหน
- **`defaultValue` / `defaultChecked`** — ค่าเริ่มต้นจาก DB แต่ผู้ใช้แก้ได้ (ถ้าใช้ `value` จะต้องมี `onChange` ซึ่ง Server Component ทำไม่ได้)
- แสดง `code` เป็นข้อความเฉยๆ ไม่ใช่ช่องกรอก → แก้ไม่ได้

### 10.5 ประเภทเอกสาร — `src/app/admin/document-types/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function createDocumentType(formData: FormData) {
  await requireAdmin();

  const code = (formData.get("code") as string).trim().toUpperCase();
  const name = (formData.get("name") as string).trim();
  const numberFormat = (formData.get("numberFormat") as string).trim() || "{code}-{year}-{seq:4}";
  const ownerDepartmentId = (formData.get("ownerDepartmentId") as string) || null;

  try {
    await prisma.documentType.create({ data: { code, name, numberFormat, ownerDepartmentId } });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      redirect(
        `/admin/document-types/new?error=${encodeURIComponent(`รหัสประเภท "${code}" มีอยู่แล้ว`)}`
      );
    }
    throw err;
  }

  revalidatePath("/admin/document-types");
  redirect("/admin/document-types");
}

export async function updateDocumentType(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  const numberFormat = (formData.get("numberFormat") as string).trim();
  const isActive = formData.get("isActive") === "on";
  const ownerDepartmentId = (formData.get("ownerDepartmentId") as string) || null;

  await prisma.documentType.update({
    where: { id },
    data: { name, numberFormat, isActive, ownerDepartmentId },
  });
  revalidatePath("/admin/document-types");
  redirect("/admin/document-types");
}

export async function deleteDocumentType(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const documentCount = await prisma.document.count({ where: { documentTypeId: id } });

  if (documentCount > 0) {
    return {
      error: `ไม่สามารถลบได้ เนื่องจากมีเอกสาร ${documentCount} รายการผูกอยู่กับประเภทนี้ กรุณาปิดใช้งานแทน`,
    };
  }

  await prisma.documentType.delete({ where: { id } });
  revalidatePath("/admin/document-types");
  return {};
}
```

จุดที่ต่างจากหน่วยงาน:
- **`numberFormat` ว่าง → ใช้ default** `{code}-{year}-{seq:4}`
- **`ownerDepartmentId` เป็น `"" → null`** — option แรกของ dropdown มี `value=""` หมายถึง "ไม่กำหนดเจ้าของ" ต้องแปลงเป็น `null` ก่อนบันทึก (ถ้าบันทึก `""` จะ foreign key error เพราะไม่มีหน่วยงาน id ว่าง)
- ลบได้เฉพาะเมื่อไม่มีเอกสารใช้ประเภทนี้ — `DocumentTypeAccess` ที่ผูกอยู่จะถูก cascade ลบตามอัตโนมัติ (ตามที่กำหนดใน schema)

### 10.6 ประเภทเอกสาร — `src/app/admin/document-types/page.tsx`

```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteDocumentType } from "./actions";

export default async function DocumentTypesAdminPage() {
  const session = await requireAdmin();

  const documentTypes = await prisma.documentType.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } }, ownerDepartment: true },
  });

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">จัดการประเภทเอกสาร</h1>
            <p className="text-sm text-gray-500">
              กำหนดประเภทเอกสารและรูปแบบเลขที่เอกสาร เช่น{" "}
              <code className="rounded bg-gray-100 px-1">{"{code}-{year}-{seq:4}"}</code>
            </p>
          </div>
          <Link
            href="/admin/document-types/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + เพิ่มประเภทเอกสาร
          </Link>
        </header>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">รหัส</th>
                <th className="px-4 py-3">ชื่อประเภทเอกสาร</th>
                <th className="px-4 py-3">รูปแบบเลขที่เอกสาร</th>
                <th className="px-4 py-3">หน่วยงานเจ้าของ</th>
                <th className="px-4 py-3">เอกสาร</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documentTypes.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-mono text-gray-500">{t.code}</td>
                  <td className="px-4 py-3 text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.numberFormat}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {t.ownerDepartment ? (
                      t.ownerDepartment.name
                    ) : (
                      <span className="text-gray-400">ทุกหน่วยงาน</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t._count.documents}</td>
                  <td className="px-4 py-3">
                    {t.isActive ? (
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
                        href={`/admin/document-types/${t.id}/edit`}
                        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        แก้ไข
                      </Link>
                      <DeleteButton
                        id={t.id}
                        itemLabel={`ประเภทเอกสาร ${t.name}`}
                        action={deleteDocumentType}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {documentTypes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    ยังไม่มีประเภทเอกสาร
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
```

อธิบาย:
- `include: { ..., ownerDepartment: true }` — ดึงชื่อหน่วยงานเจ้าของมาแสดง ถ้าไม่มี (`null`) แสดง "ทุกหน่วยงาน"
- **`{"{code}-{year}-{seq:4}"}`** ใน JSX — ต้องครอบด้วย `{"..."}` เพราะ `{` `}` ใน JSX คือ expression ถ้าเขียนตรงๆ จะ error

### 10.7 ประเภทเอกสาร — `src/app/admin/document-types/new/page.tsx`

```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { createDocumentType } from "../actions";

export default async function NewDocumentTypePage({
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
        <Link href="/admin/document-types" className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปรายการประเภทเอกสาร
        </Link>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">เพิ่มประเภทเอกสารใหม่</h1>
          <p className="mt-1 text-sm text-gray-500">
            กำหนดรหัส ชื่อ และรูปแบบเลขที่เอกสาร เช่น{" "}
            <code className="rounded bg-gray-100 px-1">{"{code}-{year}-{seq:4}"}</code>
          </p>

          {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form action={createDocumentType} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รหัสประเภท</label>
              <input
                name="code"
                required
                maxLength={20}
                placeholder="MEMO"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อประเภทเอกสาร</label>
              <input
                name="name"
                required
                placeholder="บันทึกข้อความ"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รูปแบบเลขที่เอกสาร</label>
              <input
                name="numberFormat"
                defaultValue="{code}-{year}-{seq:4}"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">หน่วยงานเจ้าของ</label>
              <select
                name="ownerDepartmentId"
                defaultValue=""
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">ทุกหน่วยงานสร้างได้ (ไม่กำหนดเจ้าของ)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                ถ้ากำหนดหน่วยงานเจ้าของ จะมีเพียงหน่วยงานนั้นเท่านั้นที่สร้างเอกสารประเภทนี้ได้
                หน่วยงานอื่นจะดูได้อย่างเดียว
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                เพิ่มประเภทเอกสาร
              </button>
              <Link
                href="/admin/document-types"
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
```

อธิบาย:
- query หน่วยงานที่เปิดใช้งานมาทำ dropdown "หน่วยงานเจ้าของ"
- `font-mono` บนช่อง `numberFormat` — ฟอนต์ความกว้างเท่ากันทุกตัว อ่าน template ง่าย

### 10.8 ประเภทเอกสาร — `src/app/admin/document-types/[id]/edit/page.tsx`

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { updateDocumentType } from "../../actions";

export default async function EditDocumentTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();

  const [documentType, departments] = await Promise.all([
    prisma.documentType.findUnique({ where: { id } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  if (!documentType) notFound();

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/admin/document-types" className="text-sm text-blue-600 hover:underline">
          &larr; กลับไปรายการประเภทเอกสาร
        </Link>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">แก้ไขประเภทเอกสาร</h1>
          <p className="mt-1 text-sm text-gray-500">รหัสประเภท: {documentType.code}</p>

          <form action={updateDocumentType} className="mt-6 space-y-5">
            <input type="hidden" name="id" value={documentType.id} />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">ชื่อประเภทเอกสาร</label>
              <input
                name="name"
                required
                defaultValue={documentType.name}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">รูปแบบเลขที่เอกสาร</label>
              <input
                name="numberFormat"
                required
                defaultValue={documentType.numberFormat}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">หน่วยงานเจ้าของ</label>
              <select
                name="ownerDepartmentId"
                defaultValue={documentType.ownerDepartmentId ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">ทุกหน่วยงานสร้างได้ (ไม่กำหนดเจ้าของ)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                ถ้ากำหนดหน่วยงานเจ้าของ จะมีเพียงหน่วยงานนั้นเท่านั้นที่สร้างเอกสารประเภทนี้ได้
                หน่วยงานอื่นจะดูได้อย่างเดียว
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked={documentType.isActive} />
              ใช้งาน
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                บันทึกการแก้ไข
              </button>
              <Link
                href="/admin/document-types"
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
```

อธิบาย:
- `defaultValue={documentType.ownerDepartmentId ?? ""}` — ถ้าไม่มีเจ้าของ (`null`) ให้เลือก option แรก (`""`)
- **คำเตือนเรื่องแก้ `numberFormat`** — แก้ได้ แต่มีผลเฉพาะเอกสารที่สร้าง **หลังจากนี้** เลขที่ของเอกสารเก่าไม่เปลี่ยน และเลข running คำนวณจากจำนวนเอกสารทั้งปี ถ้าเปลี่ยนรูปแบบกลางปีเลขอาจกระโดด

### 10.9 ผู้ใช้ — `src/app/admin/users/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

function uniqueConstraintTarget(err: unknown): string[] | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") {
    return null;
  }
  const target = err.meta?.target;
  return Array.isArray(target) ? (target as string[]) : typeof target === "string" ? [target] : [];
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const email = (formData.get("email") as string).trim().toLowerCase();
  const name = (formData.get("name") as string).trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const departmentId = formData.get("departmentId") as string;

  if (password.length < 8) {
    redirect(
      `/admin/users/new?error=${encodeURIComponent("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")}`
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: { email, name, passwordHash, role, departmentId },
    });
  } catch (err) {
    const target = uniqueConstraintTarget(err);
    if (target) {
      const message = target.includes("email")
        ? `อีเมล "${email}" มีผู้ใช้งานอยู่แล้ว`
        : "ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว";
      redirect(`/admin/users/new?error=${encodeURIComponent(message)}`);
    }
    throw err;
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUser(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  const role = formData.get("role") as string;
  const departmentId = formData.get("departmentId") as string;
  const isActive = formData.get("isActive") === "on";
  const newPassword = (formData.get("newPassword") as string) || "";
  const documentTypeAccessIds = formData.getAll("documentTypeAccess") as string[];

  const data: {
    name: string;
    role: string;
    departmentId: string;
    isActive: boolean;
    passwordHash?: string;
  } = { name, role, departmentId, isActive };

  if (newPassword) {
    if (newPassword.length < 8) {
      redirect(
        `/admin/users/${id}/edit?error=${encodeURIComponent("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")}`
      );
    }
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data }),
      prisma.documentTypeAccess.deleteMany({ where: { userId: id } }),
      prisma.documentTypeAccess.createMany({
        data: documentTypeAccessIds.map((documentTypeId) => ({ userId: id, documentTypeId })),
      }),
    ]);
  } catch (err) {
    if (uniqueConstraintTarget(err)) {
      redirect(
        `/admin/users/${id}/edit?error=${encodeURIComponent("ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว")}`
      );
    }
    throw err;
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();

  if (session.user.id === id) {
    return { error: "ไม่สามารถลบบัญชีของตัวเองได้" };
  }

  const [documentCount, auditCount] = await Promise.all([
    prisma.document.count({ where: { createdById: id } }),
    prisma.documentAudit.count({ where: { userId: id } }),
  ]);

  if (documentCount > 0 || auditCount > 0) {
    return {
      error: `ไม่สามารถลบได้ เนื่องจากผู้ใช้นี้สร้างเอกสาร ${documentCount} รายการ และมีประวัติการใช้งาน ${auditCount} รายการ กรุณาปิดใช้งานแทน`,
    };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  return {};
}
```

อธิบายจุดที่ต่างจาก entity อื่น:
- **`uniqueConstraintTarget`** — User มี unique 2 field (`email`, `employeeCode`) จึงอ่าน `err.meta.target` เพื่อรู้ว่า **field ไหน** ซ้ำ แล้วแสดงข้อความให้ตรง
- **email `.toLowerCase()`** — `Admin@Company.local` กับ `admin@company.local` ต้องเป็นคนเดียวกัน
- **รหัสผ่านขั้นต่ำ 8 ตัว** ตรวจฝั่ง server (ฟอร์มมี `minLength={8}` แต่ไม่พอ) แล้ว **hash ด้วย bcrypt ก่อนบันทึกเสมอ**
- **แก้ไขผู้ใช้: รหัสผ่านใหม่เป็น optional** — เว้นว่าง = ไม่เปลี่ยน (`passwordHash?` ใน type ของ `data` จะไม่ถูกใส่)
- **สิทธิ์ดูข้ามหน่วยงาน (`DocumentTypeAccess`)** — ฟอร์มเป็น checkbox หลายตัวชื่อเดียวกัน → `formData.getAll("documentTypeAccess")` ได้ array ของ id ที่ติ๊ก แล้ว **ลบของเดิมทั้งหมด + สร้างใหม่ตามที่ติ๊ก** (replace-all) ในทรานแซกชันเดียวกับการ update user — ง่ายกว่าคำนวณ diff ว่าอันไหนเพิ่ม/ลบ
- **ห้ามลบตัวเอง** — กัน admin ล็อกตัวเองออกจากระบบ
- **ลบไม่ได้ถ้ามีเอกสารหรือ audit log** — ผู้ใช้เป็นส่วนหนึ่งของประวัติ (audit ต้องอ้างถึง "ใคร" ได้เสมอ) → ให้ปิดใช้งานแทน (`isActive = false` → login ไม่ได้ ตาม `authorize()` ใน Step 4)

### 10.10 ผู้ใช้ — `src/app/admin/users/page.tsx`

```tsx
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
```

อธิบาย: ซ่อนปุ่มลบในแถวของตัวเอง (`u.id !== session.user.id`) — สอดคล้องกับการตรวจใน `deleteUser` (UI ซ่อน + server ตรวจซ้ำ เหมือนกฎใน Step 8)

### 10.11 ผู้ใช้ — `src/app/admin/users/new/page.tsx`

```tsx
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
```

อธิบาย:
- ใช้ `PasswordInput` (Step 4.8) ซ้ำ — แสดงให้เห็นว่า component ที่รับ props แบบ `<input>` ใช้ได้ทุกที่
- dropdown role มีคำอธิบายสั้นๆ ในวงเล็บ ช่วยให้ admin เลือกถูก
- **ทุก user ต้องมีหน่วยงาน** (แม้แต่ VIEWER/ADMIN) เพราะ `departmentId` เป็น required ใน schema

### 10.12 ผู้ใช้ — `src/app/admin/users/[id]/edit/page.tsx`

```tsx
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
```

อธิบาย:
- **query 4 อย่างพร้อมกัน** ด้วย `Promise.all` — ผู้ใช้, หน่วยงาน, ประเภทเอกสาร, สิทธิ์ที่ให้ไว้แล้ว
- **`new Set(...)`** — แปลง list สิทธิ์ที่ให้ไว้เป็น Set เพื่อเช็ค `has(id)` ได้เร็ว ใช้ตั้ง `defaultChecked` ของ checkbox
- **checkbox ชื่อเดียวกันหลายตัว** (`name="documentTypeAccess"`, `value={t.id}`) → ติ๊กกี่ตัวก็ส่งไปหลายค่า action ใช้ `getAll` รับ
- ช่องรหัสผ่านใหม่ไม่มี `required` + placeholder บอกว่าเว้นว่างได้
- สิทธิ์ดูข้ามหน่วยงาน **มีผลกับ STAFF/MANAGER เท่านั้น** (ADMIN/VIEWER เห็นทุกอย่างอยู่แล้ว — ดู `isDepartmentScopedRole` ใน Step 8)

### 10.13 ประวัติการใช้งาน — `src/app/admin/audit-log/page.tsx`

```tsx
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
```

อธิบาย:
- **`ACTION_LABELS` / `ACTION_BADGE_CLASSES`** — แปลรหัส action เป็นภาษาไทยและสี badge; `?? log.action` / `?? "bg-gray-100..."` เป็น fallback ถ้าวันหนึ่งมี action ใหม่ที่ยังไม่ได้เพิ่มในตาราง
- **ตัวกรอง 3 แบบ** (คำค้นหา, การกระทำ, ผู้ใช้) รวมเป็น `where` ด้วย spread แบบมีเงื่อนไข
- **ค้นหาจาก snapshot** (`documentNumber`/`documentTitle` ในตาราง audit เอง) ไม่ join กับ `Document` → ค้นเจอแม้เอกสารถูกลบไปแล้ว
- **ลิงก์ไปเอกสารเฉพาะตอน `documentId` ยังไม่เป็น `null`** — ถ้าเอกสารถูกลบ แสดงเป็นข้อความธรรมดาพร้อม tooltip "เอกสารนี้ถูกลบไปแล้ว" (ถ้าทำเป็นลิงก์จะพาไปหน้า 404)
- `include: { user: { select: {...} } }` — ดึงเฉพาะชื่อ/อีเมลของผู้ใช้ ไม่ดึง `passwordHash`
- `log.createdAt.toTimeString().slice(0, 5)` — แสดงเวลา `HH:MM` ตามเวลาท้องถิ่นของ server

### ✅ ตรวจสอบ Step 10

login เป็น admin แล้วทดสอบ:
1. `/admin/departments` → เพิ่มหน่วยงาน `ACC` "ฝ่ายบัญชี" → เพิ่มซ้ำด้วยรหัส `acc` → ต้องเห็นข้อความ `รหัสหน่วยงาน "ACC" มีอยู่แล้ว`
2. ลองลบหน่วยงาน IT (มี admin อยู่) → modal แสดง "ไม่สามารถลบได้ เนื่องจากมีผู้ใช้ 1 คน..."
3. `/admin/document-types` → เพิ่มประเภท `INV` "ใบกำกับภาษี" กำหนดเจ้าของเป็นฝ่ายบัญชี
4. `/admin/users` → สร้างผู้ใช้ทดสอบ (ใช้ในการทดสอบสิทธิ์ Step 12):
   - `staff.hr@company.local` — STAFF, ฝ่ายทรัพยากรบุคคล
   - `manager.hr@company.local` — MANAGER, ฝ่ายทรัพยากรบุคคล
   - `staff.acc@company.local` — STAFF, ฝ่ายบัญชี
   - `viewer@company.local` — VIEWER, ฝ่ายเทคโนโลยีสารสนเทศ
5. ลองลบตัวเอง → ไม่มีปุ่มลบในแถวตัวเอง
6. `/admin/audit-log` → เห็นประวัติจาก Step 9 ทั้งหมด ลองกรองตาม action = "ลบ"
7. **ทดสอบ 404**: logout แล้ว login เป็น `staff.hr@...` → เข้า `/admin/users` ตรงๆ ต้องได้หน้า 404

---

## Step 11: ฟีเจอร์เสริม — โปรไฟล์ผู้ใช้ + ทบทวนฟีเจอร์ทั้งหมด

ใน stepbystep.md Step 11 คือรายการฟีเจอร์เสริม 9 ข้อที่ค่อยๆ เพิ่มทีหลัง — ใน workshop นี้ **8 ข้อถูกสร้างไปแล้วในโค้ดของ Step 3–10** (เพราะใช้ schema และโค้ดฉบับสมบูรณ์ตั้งแต่ต้น) เหลือข้อเดียวที่ต้องสร้างไฟล์ใหม่คือ **หน้าโปรไฟล์ผู้ใช้**

### 11.1 ไฟล์ `src/app/profile/actions.ts`

สร้างโฟลเดอร์ `src/app/profile/` แล้วสร้างไฟล์:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  saveAvatarFile,
  deleteAvatarFile,
  isAllowedAvatarMimeType,
  MAX_AVATAR_SIZE_BYTES,
  MAX_AVATAR_SIZE_MB,
} from "@/lib/storage";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword.length < 8) {
    redirect(`/profile?error=${encodeURIComponent("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร")}`);
  }

  if (newPassword !== confirmPassword) {
    redirect(`/profile?error=${encodeURIComponent("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน")}`);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    redirect(`/profile?error=${encodeURIComponent("รหัสผ่านปัจจุบันไม่ถูกต้อง")}`);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } });

  redirect("/profile?success=password");
}

export async function updateAvatar(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    redirect(`/profile?error=${encodeURIComponent("กรุณาเลือกรูปภาพ")}`);
  }

  if (!isAllowedAvatarMimeType(file.type)) {
    redirect(`/profile?error=${encodeURIComponent("รองรับเฉพาะไฟล์รูปภาพ PNG, JPEG, WEBP หรือ GIF")}`);
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    redirect(
      `/profile?error=${encodeURIComponent(`ไฟล์มีขนาดเกิน ${MAX_AVATAR_SIZE_MB} MB กรุณาเลือกไฟล์ที่เล็กลง`)}`
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { avatarPath: true },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storagePath } = await saveAvatarFile(session.user.id, file.name, buffer);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarPath: storagePath },
  });

  if (user.avatarPath) {
    await deleteAvatarFile(user.avatarPath);
  }

  revalidatePath("/profile");
  redirect("/profile?success=avatar");
}
```

อธิบาย:

**`changePassword`**
1. ตรวจความยาว → ตรวจว่าช่องยืนยันตรงกัน (ตรวจเรื่องที่ไม่ต้องแตะ DB ก่อน)
2. **ต้อง verify รหัสผ่านปัจจุบันก่อนเสมอ** — กันกรณีคนอื่นมาใช้เครื่องที่ login ค้างไว้แล้วเปลี่ยนรหัสยึดบัญชี
3. hash รหัสใหม่แล้วบันทึก → redirect พร้อม `?success=password` ให้หน้าแสดงข้อความสำเร็จ
- ใช้ `session.user.id` จาก session เท่านั้น **ไม่รับ user id จากฟอร์ม** → เปลี่ยนรหัสของคนอื่นไม่ได้แน่นอน

**`updateAvatar`** — ลำดับสำคัญ:
1. validate: มีไฟล์ไหม → ชนิดไฟล์เป็นรูปไหม → ขนาดเกินไหม
2. จำ `avatarPath` เดิมไว้ก่อน
3. บันทึกไฟล์ใหม่ลง disk → อัปเดต DB ให้ชี้ไฟล์ใหม่
4. **ลบไฟล์เก่าทิ้งทีหลังสุด** — ถ้าไม่ลบ ไฟล์ขยะจะสะสมทุกครั้งที่เปลี่ยนรูป และลบหลังจาก DB อัปเดตสำเร็จแล้ว (ถ้าขั้นก่อนหน้า fail รูปเก่ายังใช้ได้)
- `redirect` ของ Next.js มี type `never` → TypeScript รู้ว่าหลัง `if (!file ...) redirect(...)` ตัวแปร `file` ไม่เป็น `null` แล้ว

### 11.2 ไฟล์ `src/app/profile/page.tsx`

```tsx
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
```

อธิบาย:
- **สองฟอร์มแยกกันในหน้าเดียว** — แต่ละฟอร์มมี action ของตัวเอง กดปุ่มหนึ่งไม่กระทบอีกฟอร์ม
- **ข้อความผลลัพธ์ผ่าน query string** — `?error=...` (แดง) และ `?success=password|avatar` (เขียว) — วิธีง่ายที่สุดในการส่งผลลัพธ์จาก Server Action กลับมาแสดงโดยไม่ต้องใช้ client state
- `accept="image/..."` — ให้หน้าต่างเลือกไฟล์กรองเฉพาะรูป (แค่ช่วย UX — server ตรวจ mime type ซ้ำอยู่แล้ว)
- ใช้ `findUniqueOrThrow` เพราะ user ที่ login อยู่ต้องมีใน DB แน่นอน

### 11.3 ไฟล์ `src/app/api/users/[id]/avatar/route.ts` — ส่งรูปโปรไฟล์

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readAvatarFile } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { avatarPath: true },
  });

  if (!user?.avatarPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readAvatarFile(user.avatarPath);
  const ext = user.avatarPath.split(".").pop()?.toLowerCase();
  const mimeType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : "image/jpeg";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
```

อธิบาย:
- **ทุกคนที่ login แล้วดูรูปโปรไฟล์ของใครก็ได้** (ไม่ตรวจว่าเป็นเจ้าของ) — รูปโปรไฟล์ไม่ใช่ข้อมูลลับภายในองค์กร แต่คนนอกที่ไม่ได้ login ดูไม่ได้
- `_req` — ขึ้นต้นด้วย `_` บอกว่ารับพารามิเตอร์นี้แต่ไม่ได้ใช้ (ESLint จะไม่เตือน)
- **หา mime type จากนามสกุลไฟล์** — เพราะไม่ได้เก็บ mime type ของ avatar ไว้ใน DB (ไฟล์ผ่านการ validate ชนิดตอนอัปโหลดแล้ว)
- **`Cache-Control: private, max-age=3600`** — ให้เบราว์เซอร์ cache รูปไว้ 1 ชั่วโมง (topbar โหลดรูปทุกหน้า ไม่ต้องดึงซ้ำ) — `private` = ห้าม proxy/CDN กลางทาง cache เพราะต้อง login
  - ผลข้างเคียง: เปลี่ยนรูปแล้ว topbar อาจยังเห็นรูปเก่าจนกว่า cache หมดอายุ (หน้าโปรไฟล์ใช้ URL เดียวกัน) — ถ้าต้องการให้เห็นทันที ให้ต่อ `?v=<avatarPath>` ท้าย URL รูป

### 11.4 ทบทวน: ฟีเจอร์เสริมทั้ง 9 ข้อของ stepbystep.md อยู่ตรงไหนในโค้ด

| # | ฟีเจอร์ (stepbystep.md Step 11) | อยู่ในไฟล์ (workshop step) | จุดสำคัญที่ต้องจำ |
|---|---|---|---|
| 1 | จำกัดขนาดไฟล์อัปโหลด | `next.config.ts` (1.3), `storage.ts` (7.1), `documents/new/page.tsx` (9.9) | ต้องปรับ **ทั้ง** `bodySizeLimit` ของ Next.js **และ** ตรวจขนาดในโค้ดเอง |
| 2 | พรีวิวไฟล์ PDF/รูป | `FilePreview.tsx` (9.6), API route `?inline=1` (9.11) | `Content-Disposition: inline` vs `attachment` |
| 3 | Role `VIEWER` (อ่านอย่างเดียวทุกหน่วยงาน) | `access.ts` (8.1), `SidebarNav`, `documents/page.tsx`, `documents/new/page.tsx` | แยก `canViewDocument` ออกจาก `canManageDocument` เด็ดขาด |
| 4 | สิทธิ์ดูข้ามหน่วยงานรายประเภทเอกสาร | ตาราง `DocumentTypeAccess` (3.1), `access.ts`, `admin/users/[id]/edit` (10.12) | รวมเข้า query ด้วย `OR` |
| 5 | หน่วยงานเจ้าของประเภทเอกสาร | `DocumentType.ownerDepartmentId` (3.1), `documents/new/page.tsx` (9.9), admin document-types (10.5–10.8) | "ดูได้" กับ "สร้างได้" คนละสิทธิ์ — กรองใน dropdown **และ** ตรวจซ้ำฝั่ง server |
| 6 | หน้าโปรไฟล์ (เปลี่ยนรหัส + รูป) | `profile/*` + avatar API (11.1–11.3) | verify รหัสเดิมก่อน, ลบรูปเก่าทิ้ง, แยก storage root |
| 7 | Audit log ที่รอดแม้เอกสารถูกลบ | `DocumentAudit` (3.1–3.2), ทุกจุดที่ `documentAudit.create`, `admin/audit-log` (10.13) | `SetNull` + snapshot `documentNumber`/`documentTitle` |
| 8 | Format วันที่ `dd/mm/yyyy` ตายตัว | `FormattedDate.tsx` (9.1) | ใช้ `getUTC*`, ไม่ใช้ `toLocaleDateString("th-TH")` (ได้ พ.ศ.) — ส่วน `<input type="date">` บังคับ format การพิมพ์จากโค้ดไม่ได้ ขึ้นกับ OS/browser |
| 9 | ระบบอนุมัติ + role `MANAGER` | `Document.approvedAt/approvedById` (3.1), `access.ts`, `ApproveButton.tsx`, `documents/actions.ts`, หน้า list/detail | อนุมัติแล้วลบได้เฉพาะ ADMIN/MANAGER หน่วยงานเดียวกัน — ต้องใช้ `canDeleteDocument` **ทุกจุด** ที่มีปุ่มลบ (ทั้งเอกสารและไฟล์แนบ) |

#### ถ้าทำตาม stepbystep.md แบบค่อยๆ เพิ่ม schema (ไม่ได้ใช้ schema สมบูรณ์ตั้งแต่ต้น)

ข้อ 7 จะต้องแก้ตาราง `DocumentAudit` ที่มีข้อมูลอยู่แล้ว ซึ่ง **ต้องแยกเป็น 2 migration** เพราะ SQL Server compile ทั้ง script เป็น batch เดียว (ถ้า `UPDATE` อ้างถึง column ที่เพิ่ง `ADD` ในสคริปต์เดียวกันจะได้ error `Invalid column name`):

**Migration ที่ 1** — `npx prisma migrate dev --create-only --name audit_survives_document_delete` แล้วแก้ SQL เป็น:

```sql
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[DocumentAudit] DROP CONSTRAINT [DocumentAudit_documentId_fkey];

-- AlterTable
ALTER TABLE [dbo].[DocumentAudit] ALTER COLUMN [documentId] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[DocumentAudit] ADD [documentNumber] NVARCHAR(1000) NULL,
[documentTitle] NVARCHAR(1000) NULL;

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentAudit_createdAt_idx] ON [dbo].[DocumentAudit]([createdAt]);

-- AddForeignKey (SET NULL instead of the original CASCADE)
ALTER TABLE [dbo].[DocumentAudit] ADD CONSTRAINT [DocumentAudit_documentId_fkey] FOREIGN KEY ([documentId]) REFERENCES [dbo].[Document]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
```

**Migration ที่ 2** — `npx prisma migrate dev --create-only --name audit_backfill_snapshot_columns` แล้วแก้ SQL เป็น:

```sql
BEGIN TRY

BEGIN TRAN;

UPDATE [a]
SET [a].[documentNumber] = [d].[documentNumber],
    [a].[documentTitle] = [d].[title]
FROM [dbo].[DocumentAudit] AS [a]
INNER JOIN [dbo].[Document] AS [d] ON [d].[id] = [a].[documentId]
WHERE [a].[documentNumber] IS NULL;

-- Any row without a matching Document gets a placeholder so the
-- NOT NULL constraint below can be applied safely.
UPDATE [dbo].[DocumentAudit]
SET [documentNumber] = N'(unknown)',
    [documentTitle] = N'(unknown)'
WHERE [documentNumber] IS NULL;

ALTER TABLE [dbo].[DocumentAudit] ALTER COLUMN [documentNumber] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[DocumentAudit] ALTER COLUMN [documentTitle] NVARCHAR(1000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
```

อธิบาย: migration แรกเพิ่ม column แบบ nullable ก่อน (ตารางมีข้อมูลอยู่แล้ว ถ้าเพิ่มแบบ `NOT NULL` เลยจะ fail), migration ที่สอง backfill ค่าจากเอกสารที่ยัง join ได้ (`UPDATE ... FROM ... INNER JOIN`) ใส่ placeholder ให้แถวที่เหลือ แล้วค่อยบังคับ `NOT NULL`

> ผู้ที่ทำ workshop นี้ตั้งแต่ต้นด้วย schema ฉบับสมบูรณ์ **ไม่ต้องรัน 2 migration นี้** — ใส่ไว้เป็นความรู้สำหรับกรณีต้องแก้ระบบที่ใช้งานจริงอยู่แล้ว

### ✅ ตรวจสอบ Step 11

1. คลิกชื่อตัวเองที่ topbar → เข้า `/profile`
2. อัปโหลดรูป PNG → topbar และหน้าโปรไฟล์แสดงรูป, มีไฟล์ใน `storage/avatars/`
3. อัปโหลดรูปใหม่อีกครั้ง → ไฟล์เก่าใน `storage/avatars/` ต้องหายไป (เหลือไฟล์เดียว)
4. อัปโหลดไฟล์ `.txt` → ข้อความ error "รองรับเฉพาะไฟล์รูปภาพ..."
5. เปลี่ยนรหัสผ่านโดยใส่รหัสปัจจุบันผิด → error "รหัสผ่านปัจจุบันไม่ถูกต้อง"
6. เปลี่ยนรหัสผ่านถูกต้อง → logout แล้ว login ด้วยรหัสใหม่ได้

---

## Step 12: ตรวจสอบก่อนส่งมอบ/deploy

### 12.1 คำสั่งตรวจสอบ 3 ตัว (รันทุกครั้งที่แก้โค้ดอย่างมีนัยสำคัญ)

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

```bash
npm run build
```

| คำสั่ง | ตรวจอะไร |
|---|---|
| `npx tsc --noEmit` | type error ทั้งโปรเจกต์ (`--noEmit` = ตรวจอย่างเดียวไม่สร้างไฟล์) |
| `npm run lint` | กฎ ESLint ของ Next.js (เช่น ใช้ hook ผิดที่, `<img>` ไม่มีเหตุผล) |
| `npm run build` | build production จริง — **จับปัญหาที่ typecheck จับไม่ได้** |

**ปัญหาที่ typecheck ผ่านแต่ build fail**:
- โมดูลที่ใช้ Node.js API (Prisma, `fs`, bcrypt) ถูก import เข้า `proxy.ts` โดยไม่ตั้งใจผ่าน chain ของ import → Edge runtime รันไม่ได้ (เหตุผลที่ต้องแยก `auth.config.ts` ใน Step 4)
- path ที่สร้างจาก env var ทำให้ file tracing ดึงไฟล์เกินจำเป็น (เหตุผลที่ path ใน `storage.ts` ต้อง static)

### 12.2 กฎหลัง `prisma migrate` / `prisma generate`

**ต้อง restart dev server ทุกครั้ง** — Node process ที่รันอยู่ยังถือ Prisma Client เวอร์ชันเก่าไว้ในหน่วยความจำ (และถูกเก็บไว้ใน `globalThis` ตาม Step 2.5 ด้วย) อาการ: `TypeError: Cannot read properties of undefined (reading 'findMany')` ทั้งที่โค้ดถูกต้อง

### 12.3 ทดสอบสิทธิ์ในเบราว์เซอร์จริง (Authorization test matrix)

**อย่าเชื่อว่าสิทธิ์ถูกต้องแค่เพราะอ่านโค้ดแล้วดูถูก** — ต้อง login สลับทีละ user ที่สร้างไว้ใน Step 10 แล้วตรวจตามตาราง

เตรียมข้อมูลก่อน (login เป็น admin):
- สร้างเอกสาร MEMO 1 ฉบับของ **ฝ่ายทรัพยากรบุคคล** (HR-DOC)
- สร้างเอกสาร INV 1 ฉบับของ **ฝ่ายบัญชี** (ACC-DOC)
- แก้ผู้ใช้ `staff.hr@...` ให้สิทธิ์ดูข้ามหน่วยงานประเภท "ใบกำกับภาษี"

> สำคัญ: ข้อมูลทดสอบต้อง **อยู่ต่างหน่วยงานกันจริง** — ถ้าเอกสารทดสอบทั้งหมดอยู่หน่วยงานเดียวกันโดยบังเอิญ จะดูเหมือน filter ทำงานถูกทั้งที่ยังไม่ได้ทดสอบจริง

| ทดสอบ | staff.hr | manager.hr | staff.acc | viewer | admin |
|---|---|---|---|---|---|
| เห็น HR-DOC ในรายการ | ✅ | ✅ | ❌ | ✅ | ✅ |
| เห็น ACC-DOC ในรายการ | ✅ (ได้สิทธิ์ INV) | ❌ | ✅ | ✅ | ✅ |
| เปิด URL ของ ACC-DOC ตรงๆ | ✅ | 404 | ✅ | ✅ | ✅ |
| ดาวน์โหลดไฟล์ของ ACC-DOC | ✅ | 403 | ✅ | ✅ | ✅ |
| ปุ่มลบบน ACC-DOC | ❌ (ดูได้อย่างเดียว) | - | ✅ | ❌ | ✅ |
| เห็นปุ่ม "+ สร้างเอกสาร" | ✅ | ✅ | ✅ | ❌ | ✅ |
| dropdown ประเภทมี "ใบกำกับภาษี" | ❌ (เจ้าของคือบัญชี) | ❌ | ✅ | - | ✅ |
| ปุ่ม "อนุมัติ" บน HR-DOC | ❌ | ✅ | - | ❌ | ✅ |
| ลบ HR-DOC **หลังอนุมัติแล้ว** | ❌ (ปุ่มลบหายไป) | ✅ | - | ❌ | ✅ |
| เข้า `/admin/users` | 404 | 404 | 404 | 404 | ✅ |
| `/documents/new` | ✅ | ✅ | ✅ | 404 | ✅ |

> จำไว้ว่า role ถูกเก็บใน JWT ตอน login — ถ้าแก้ role ของผู้ใช้ทดสอบ ต้องให้ผู้ใช้นั้น **logout แล้ว login ใหม่** ก่อนทดสอบ

### 12.4 ขั้นตอน deploy แบบย่อ (production)

```bash
npm ci
```

```bash
npx prisma generate
```

```bash
npm run db:migrate:deploy
```

```bash
npm run build
```

```bash
npm run start
```

- `npm ci` — ติดตั้งตาม `package-lock.json` เป๊ะๆ
- `db:migrate:deploy` — รันเฉพาะ migration ที่ยังไม่ได้รัน **ห้ามใช้ `migrate dev` บน production** (มันอาจ reset database)
- `.env` ของ production ต้องมี `DATABASE_URL` และ `AUTH_SECRET` ของ production เอง
- โฟลเดอร์ `storage/` ต้องมีสิทธิ์เขียน และ **ต้องอยู่ในแผน backup** เดียวกับ database (DB กับไฟล์ต้องสอดคล้องกัน)
- คู่มือ deploy แบบละเอียดดูที่ [install.md](install.md) / [installwin.md](installwin.md) / [installwinbypm2.md](installwinbypm2.md)

### สรุปลำดับ Step ทั้งหมด

| Step | สิ่งที่ทำ | ไฟล์ที่สร้าง/แก้ |
|---|---|---|
| 0 | เตรียมเครื่อง + ตัดสินใจ scope | - |
| 1 | Scaffold Next.js | `next.config.ts`, `.gitignore` |
| 2 | Prisma + adapter | `prisma.config.ts`, `.env`, `src/lib/prisma.ts` |
| 3 | Schema + migration + seed | `prisma/schema.prisma`, migration filtered index, `prisma/seed.ts`, `package.json` |
| 4 | Auth | `src/types/next-auth.d.ts`, `src/lib/auth.config.ts`, `src/lib/auth.ts`, `api/auth/[...nextauth]/route.ts`, `src/proxy.ts`, `PasswordInput.tsx`, `login/page.tsx` |
| 5 | Layout | `globals.css`, `layout.tsx`, `page.tsx`, `SidebarNav.tsx`, `AppShell.tsx` |
| 6 | เลขที่เอกสาร + config | `src/lib/config.ts`, `src/lib/document-number.ts` |
| 7 | Storage | `src/lib/storage.ts` |
| 8 | Access control | `src/lib/access.ts`, `src/lib/require-admin.ts` |
| 9 | CRUD เอกสาร | `FormattedDate`, `Pagination`, `DeleteButton`, `DeleteDocumentButton`, `ApproveButton`, `FilePreview`, `documents/actions.ts`, `documents/page.tsx`, `documents/new/page.tsx`, `documents/[id]/page.tsx`, `api/documents/[id]/files/[fileId]/route.ts` |
| 10 | Admin | `admin/departments/*` (4), `admin/document-types/*` (4), `admin/users/*` (4), `admin/audit-log/page.tsx` |
| 11 | โปรไฟล์ + ทบทวนฟีเจอร์ | `profile/actions.ts`, `profile/page.tsx`, `api/users/[id]/avatar/route.ts` |
| 12 | ตรวจสอบ | - |

---

## ภาคผนวก A: โครงสร้างไฟล์สุดท้าย

```
twp_document_system/
├── .env                                   # (ไม่ commit) DATABASE_URL, AUTH_SECRET, ค่าจำกัดต่างๆ
├── .gitignore
├── eslint.config.mjs
├── next.config.ts                         # bodySizeLimit ของ Server Actions
├── package.json                           # scripts db:*
├── postcss.config.mjs
├── prisma.config.ts                       # config ของ Prisma CLI
├── tsconfig.json
├── prisma/
│   ├── schema.prisma                      # 7 models
│   ├── seed.ts                            # หน่วยงาน/ประเภท/admin เริ่มต้น
│   └── migrations/
│       ├── <ts>_start/migration.sql
│       └── <ts>_employee_code_filtered_unique/migration.sql
├── storage/                               # (ไม่ commit) ไฟล์ที่อัปโหลด
│   ├── documents/<documentId>/<uuid>.<ext>
│   └── avatars/<userId>-<uuid>.<ext>
└── src/
    ├── proxy.ts                           # ด่านตรวจ login (Edge)
    ├── generated/prisma/                  # (ไม่ commit) Prisma Client
    ├── types/
    │   └── next-auth.d.ts
    ├── lib/
    │   ├── access.ts                      # กฎสิทธิ์ทั้งหมด
    │   ├── auth.config.ts                 # NextAuth (Edge-safe)
    │   ├── auth.ts                        # NextAuth (Node, Credentials)
    │   ├── config.ts                      # page size
    │   ├── document-number.ts             # สร้างเลขที่เอกสาร
    │   ├── prisma.ts                      # Prisma singleton
    │   ├── require-admin.ts               # guard หน้า admin
    │   └── storage.ts                     # อ่าน/เขียน/ลบไฟล์
    ├── components/
    │   ├── AppShell.tsx                   # topbar + sidebar (server)
    │   ├── ApproveButton.tsx              # (client)
    │   ├── DeleteButton.tsx               # (client) ใช้ร่วมทุก entity
    │   ├── DeleteDocumentButton.tsx       # (client) ลบแล้วกลับหน้า list
    │   ├── FilePreview.tsx                # (client) modal พรีวิว + พิมพ์
    │   ├── FormattedDate.tsx              # dd/mm/yyyy
    │   ├── Pagination.tsx                 # (server)
    │   ├── PasswordInput.tsx              # (client)
    │   └── SidebarNav.tsx                 # (client)
    └── app/
        ├── globals.css
        ├── layout.tsx
        ├── page.tsx                       # redirect → /documents
        ├── login/page.tsx
        ├── profile/
        │   ├── actions.ts
        │   └── page.tsx
        ├── documents/
        │   ├── actions.ts                 # delete / deleteAttachment / approve
        │   ├── page.tsx                   # list + ค้นหา
        │   ├── new/page.tsx               # สร้าง
        │   └── [id]/page.tsx              # detail
        ├── admin/
        │   ├── audit-log/page.tsx
        │   ├── departments/{page,new/page,[id]/edit/page,actions}
        │   ├── document-types/{page,new/page,[id]/edit/page,actions}
        │   └── users/{page,new/page,[id]/edit/page,actions}
        └── api/
            ├── auth/[...nextauth]/route.ts
            ├── documents/[id]/files/[fileId]/route.ts
            └── users/[id]/avatar/route.ts
```

---

## ภาคผนวก B: ปัญหาที่พบบ่อยและวิธีแก้

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `Cannot find module '@/generated/prisma/client'` | ยังไม่ได้ generate Prisma Client | `npx prisma generate` |
| `Cannot read properties of undefined (reading 'findMany')` หลังเพิ่ม model | dev server ยังใช้ client เก่า | หยุด `npm run dev` แล้วรันใหม่ |
| migration fail: *may cause cycles or multiple cascade paths* | SQL Server ไม่ยอม cascade หลายเส้นทาง | ใส่ `onDelete: NoAction, onUpdate: NoAction` ใน relation ที่ซ้อน |
| สร้าง user คนที่สองไม่ได้ (P2002 ที่ `employeeCode`) | SQL Server ถือว่า NULL ซ้ำกัน | ทำ filtered unique index ตาม Step 3.4 |
| migration fail: `Invalid column name` | `UPDATE` อ้าง column ที่เพิ่ง `ADD` ใน script เดียวกัน | แยกเป็น 2 migration (Step 11.4) |
| อัปโหลดไฟล์ > 1MB แล้ว error แปลกๆ | ยังไม่ได้ปรับ `bodySizeLimit` | แก้ `next.config.ts` ตาม Step 1.3 แล้ว restart |
| login สำเร็จแต่ไม่ redirect / ค้าง | catch error ใน server action แล้วกลืน `NEXT_REDIRECT` | re-throw error ที่ไม่ใช่ `AuthError` (Step 4.9) |
| `MissingSecret` / login ไม่ได้บน production | ไม่ได้ตั้ง `AUTH_SECRET` | ตั้งใน `.env` ของเครื่อง production |
| build fail: module `fs`/`crypto` not found in Edge | `proxy.ts` import ไฟล์ที่ใช้ Prisma/Node | ให้ proxy import แค่ `auth.config.ts` |
| ลบแล้วแถวยังค้างบนจอ | เรียก action ผ่าน `useTransition` แต่ไม่ `router.refresh()` | ดู `DeleteButton` (Step 9.3) |
| วันที่แสดงเป็น พ.ศ. หรือเพี้ยนไป 1 วัน | ใช้ `toLocaleDateString("th-TH")` หรือ local getters | ใช้ `FormattedDate` (Step 9.1) |
| เปลี่ยน role แล้วผู้ใช้ยังได้สิทธิ์เดิม | role ถูกเก็บใน JWT ตอน login | ให้ผู้ใช้ logout แล้ว login ใหม่ |
| เชื่อมต่อ DB ไม่ได้: certificate error | SQL Server ใช้ self-signed certificate | ใส่ `trustServerCertificate=true` ใน `DATABASE_URL` |

---

อ่านประกอบ:
- [stepbystep.md](stepbystep.md) — เหตุผลของการออกแบบแต่ละขั้น (ฉบับย่อ)
- [feature.md](feature.md) — ภาพรวมฟีเจอร์และ flow การทำงานของระบบที่เสร็จแล้ว
- [README.md](README.md) — โครงสร้างโปรเจกต์

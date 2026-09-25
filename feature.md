# สรุปฟีเจอร์และ Flow การทำงานของระบบ

ระบบจัดเก็บเอกสารภายในองค์กร (twp_document_system) — Next.js + Prisma + Microsoft SQL Server

เอกสารนี้สรุปฟีเจอร์ทั้งหมดที่มีในระบบ พร้อม flow การทำงานตั้งแต่ login จนถึงการจัดการเอกสาร สำหรับใช้อ้างอิงภาพรวมของระบบ (ดูรายละเอียดเชิงเทคนิคเพิ่มเติมได้ที่ [README.md](README.md), ดูขั้นตอนสร้างระบบตั้งแต่ศูนย์ได้ที่ [stepbystep.md](stepbystep.md), ดูขั้นตอน deploy ได้ที่ [install.md](install.md))

---

## 1. ภาพรวมระบบ

ระบบสำหรับเก็บเอกสารขององค์กร โดยแบ่งเอกสารตาม **หน่วยงาน** (Department) และ **ประเภทเอกสาร** (DocumentType) แต่ละเอกสารมี **เลขที่เอกสาร** (เช่น `INV-2026-0001`) ที่สร้างอัตโนมัติ พร้อมแนบไฟล์ได้หลายไฟล์ ระบบมีการควบคุมสิทธิ์การเข้าถึงตามหน่วยงานและบทบาท (role) ของผู้ใช้ และมีระบบอนุมัติเอกสารเพื่อป้องกันการลบเอกสารที่ตรวจสอบแล้วว่าถูกต้อง

---

## 2. บทบาทผู้ใช้ (User Roles)

ระบบมี 4 บทบาท กำหนดที่ field `role` ของ `User` (plain string ไม่ใช่ enum เพราะ SQL Server ไม่รองรับ native enum):

| Role | ขอบเขตการดู | สร้าง/แก้ไขเอกสาร | ลบเอกสาร | อนุมัติ/ยกเลิกอนุมัติ | เข้า `/admin/*` |
|---|---|---|---|---|---|
| **ADMIN** | ทุกหน่วยงาน | ได้ทุกหน่วยงาน แม้เอกสารอนุมัติแล้ว | ได้เสมอ แม้เอกสารอนุมัติแล้ว | ได้ทุกหน่วยงาน | ได้ |
| **MANAGER** | หน่วยงานตัวเอง + สิทธิ์พิเศษที่ได้รับ | หน่วยงานตัวเอง แม้เอกสารอนุมัติแล้ว | หน่วยงานตัวเอง — ลบได้แม้เอกสารอนุมัติแล้ว | เฉพาะหน่วยงานตัวเอง | ไม่ได้ |
| **STAFF** | หน่วยงานตัวเอง + สิทธิ์พิเศษที่ได้รับ | หน่วยงานตัวเอง — **แก้ไข/เพิ่ม-ลบไฟล์แนบไม่ได้ถ้าเอกสารอนุมัติแล้ว** | หน่วยงานตัวเอง — **ลบไม่ได้ถ้าเอกสารอนุมัติแล้ว** | ไม่ได้ | ไม่ได้ |
| **VIEWER** | ทุกหน่วยงาน (อ่านอย่างเดียว) | ไม่ได้ | ไม่ได้ | ไม่ได้ | ไม่ได้ |

"สิทธิ์พิเศษที่ได้รับ" หมายถึงการมองเห็นเอกสาร**ประเภทหนึ่งๆ ข้ามหน่วยงาน** ที่ admin กำหนดให้เป็นรายบุคคล (ดูหัวข้อ 6)

---

## 3. Flow: การเข้าสู่ระบบ (Login)

```
ผู้ใช้กรอกอีเมล/รหัสผ่าน
        │
        ▼
NextAuth Credentials Provider ตรวจสอบกับฐานข้อมูล
  - หา User ด้วย email
  - เช็ค isActive = true
  - bcrypt.compare รหัสผ่าน
        │
        ▼
ถูกต้อง → สร้าง JWT session (role, departmentId, departmentName)
        │
        ▼
Proxy (middleware) ตรวจสอบทุก request:
  - ไม่มี session → redirect ไป /login
  - มี session แล้วพยายามเข้า /login → redirect ไป /documents
        │
        ▼
เข้าสู่หน้า /documents (รายการเอกสาร)
```

**จุดสำคัญทางเทคนิค**: NextAuth แยก config เป็น 2 ไฟล์ — `auth.config.ts` (Edge-safe ไม่แตะฐานข้อมูล) ใช้ใน proxy/middleware ซึ่งรันบน Edge runtime, และ `auth.ts` (เต็มรูปแบบ มี Prisma) รันเฉพาะ Node runtime เพราะ Prisma Client รันบน Edge ไม่ได้

---

## 4. Flow: การสร้างเอกสาร

```
ผู้ใช้กด "+ สร้างเอกสาร" (ไม่แสดงให้ VIEWER)
        │
        ▼
หน้าฟอร์ม /documents/new
  - Dropdown "ประเภทเอกสาร" กรองเฉพาะประเภทที่:
      • ไม่มีหน่วยงานเจ้าของ (ownerDepartmentId = null) หรือ
      • หน่วยงานเจ้าของ = หน่วยงานผู้ใช้
      • (ADMIN ไม่ถูกกรอง เห็นทุกประเภท)
  - Dropdown "หน่วยงาน" — STAFF/MANAGER/VIEWER เลือกได้แค่หน่วยงานตัวเอง, ADMIN เลือกได้ทุกหน่วยงาน
  - ไฟล์แนบ: เลือกได้หลายไฟล์พร้อมกัน (multiple)
        │
        ▼
กด "บันทึกเอกสาร" → Server Action ตรวจสอบซ้ำฝั่ง server:
  1. role ไม่ใช่ VIEWER
  2. departmentId ตรงกับผู้ใช้ (ถ้าไม่ใช่ ADMIN)
  3. ประเภทเอกสารนี้ไม่ได้ถูกสงวนไว้ให้หน่วยงานอื่น (double-check ownerDepartmentId)
  4. ไฟล์แต่ละไฟล์ไม่เกิน MAX_UPLOAD_SIZE_MB
        │
        ▼
Transaction: generateDocumentNumber() + document.create() + documentAudit.create(action="CREATE")
        │
        ▼
บันทึกไฟล์แนบทีละไฟล์ลง disk (storage/documents/<documentId>/) + documentFile.create()
        │
        ▼
Redirect ไปหน้ารายละเอียดเอกสารที่สร้างเสร็จ
```

### การสร้างเลขที่เอกสารอัตโนมัติ

แต่ละ `DocumentType` มี template `numberFormat` (ค่าเริ่มต้น `{code}-{year}-{seq:4}`) เช่นประเภท "ใบกำกับภาษี" รหัส `INV` → ได้เลขที่ `INV-2026-0001`, `INV-2026-0002`, ... โดยนับจำนวนเอกสารประเภทเดียวกันในปีนั้น (`documentDate`) แล้ว +1 คำนวณและ insert ในทรานแซกชันเดียวกันเพื่อกันเลขซ้ำ (race condition) เมื่อมีคนสร้างเอกสารพร้อมกัน

---

## 5. Flow: การดูรายการ/ค้นหาเอกสาร

```
เข้าหน้า /documents
        │
        ▼
Query กรองด้วย documentScopeFilter(user):
  - ADMIN/VIEWER → เห็นทุกเอกสาร
  - STAFF/MANAGER → เห็นเฉพาะ:
      (เอกสารของหน่วยงานตัวเอง) OR (เอกสารประเภทที่ได้รับสิทธิ์ดูข้ามหน่วยงาน)
        │
        ▼
รวมกับตัวกรองค้นหา (ถ้ามี) ด้วย AND:
  - q: ค้นหาเลขที่เอกสาร OR ชื่อเรื่อง (contains)
  - dateFrom / dateTo: ช่วงวันที่เอกสาร
        │
        ▼
แบ่งหน้า (pagination) ตาม DOCUMENTS_PAGE_SIZE
        │
        ▼
แสดงตาราง: เลขที่เอกสาร, ชื่อเรื่อง, ประเภท, หน่วยงาน, วันที่ (dd/mm/yyyy เสมอ),
           ไฟล์แนบ (ดูตัวอย่าง/ดาวน์โหลดถ้ามี 1 ไฟล์, ลิงก์ "N ไฟล์" ถ้ามีหลายไฟล์),
           สถานะอนุมัติ, ปุ่มลบ (ถ้ามีสิทธิ์)
```

**ข้อควรระวังที่แก้ไปแล้ว**: การรวม scope filter กับ search filter ต้องใช้ `AND: [...]` ไม่ใช่ spread object ตรงๆ เพราะทั้งคู่อาจมี key `OR` ชนกัน (STAFF/MANAGER ที่มีสิทธิ์ดูข้ามหน่วยงานจะมี `OR` ใน scope filter) — ถ้า spread ตรงๆ การค้นหาจะเขียนทับ scope filter ทำให้สิทธิ์รั่วไหล

---

## 6. Flow: สิทธิ์ดูเอกสารข้ามหน่วยงาน (DocumentTypeAccess)

สำหรับกรณีที่หน่วยงานหนึ่งต้องดูเอกสารของอีกหน่วยงาน แต่เฉพาะบาง**ประเภท** เช่น ฝ่ายบัญชีต้องดู "ใบกำกับภาษี" ที่ฝ่ายขายออกให้ แต่ไม่ต้องเห็นเอกสารประเภทอื่นของฝ่ายขาย

```
Admin เข้า /admin/users/[id]/edit
        │
        ▼
ติ๊กเลือกประเภทเอกสารที่ต้องการให้ user นี้ดูได้ข้ามหน่วยงาน (checkbox list)
        │
        ▼
บันทึก → sync ตาราง DocumentTypeAccess (ลบของเดิมทั้งหมด + สร้างใหม่ตามที่ติ๊ก)
        │
        ▼
เมื่อ user login และเข้า /documents หรือเปิดเอกสาร:
  documentScopeFilter() / canViewDocument() จะรวมเอกสารที่ตรงประเภทที่ได้รับสิทธิ์
  เข้ากับเอกสารของหน่วยงานตัวเอง (แม้เอกสารนั้นอยู่คนละหน่วยงาน)
```

**สำคัญ**: สิทธิ์นี้ให้แค่ "ดู" (view/download/print) เท่านั้น — ไม่ได้แปลว่าแก้ไขหรือลบได้ `canViewDocument()` (อ่าน) กับ `canManageDocument()`/`canDeleteDocument()` (เขียน) เป็นคนละฟังก์ชันแยกกันเด็ดขาดในโค้ด เพื่อไม่ให้สิทธิ์ดูข้ามหน่วยงานกลายเป็นสิทธิ์เขียนโดยไม่ตั้งใจ

---

## 7. Flow: จำกัดว่าหน่วยงานไหน "สร้าง" เอกสารประเภทไหนได้ (Document Type Ownership)

คนละเรื่องกับข้อ 6 — ข้อ 6 คือสิทธิ์**ดู**ข้ามหน่วยงาน ส่วนนี้คือสิทธิ์**สร้าง**

```
Admin เข้า /admin/document-types/[id]/edit หรือ /new
        │
        ▼
เลือก "หน่วยงานเจ้าของ" (ownerDepartmentId) — หรือปล่อยว่างให้ทุกหน่วยงานสร้างได้
        │
        ▼
เมื่อ user (ไม่ใช่ ADMIN) เข้าหน้าสร้างเอกสาร:
  Dropdown "ประเภทเอกสาร" กรองไม่ให้เห็นประเภทที่หน่วยงานอื่นเป็นเจ้าของ
  (ถ้าไม่มีประเภทให้เลือกเลย จะมีข้อความแจ้งเตือน)
        │
        ▼
ถ้า bypass ผ่าน request ตรงๆ (ไม่ผ่าน UI) → Server Action ตรวจซ้ำอีกชั้น (defense in depth)
```

ตัวอย่าง: กำหนดให้ "ใบกำกับภาษี" มีเจ้าของเป็นฝ่ายบัญชี → มีแค่ฝ่ายบัญชี (หรือ ADMIN) สร้างเอกสารประเภทนี้ได้ ฝ่ายอื่นสร้างไม่ได้เลย แต่ยังดูได้ถ้าได้รับสิทธิ์ตามข้อ 6

---

## 8. Flow: การอนุมัติเอกสาร (Approval) — ลบไม่ได้เมื่อถูกต้องแล้ว

```
เอกสารถูกสร้างขึ้น → สถานะเริ่มต้น: "รออนุมัติ" (approvedAt = null)
  → ใครก็ตามที่มีสิทธิ์จัดการเอกสาร (เจ้าของหน่วยงาน/ADMIN) ลบได้ตามปกติ
        │
        ▼
MANAGER (ของหน่วยงานเดียวกับเอกสาร) หรือ ADMIN เข้าหน้ารายละเอียดเอกสาร
เห็นปุ่ม "อนุมัติเอกสาร" (ผู้ใช้อื่นไม่เห็นปุ่มนี้)
        │
        ▼
กดปุ่ม → Modal ยืนยัน ("ยืนยันว่าเอกสารนี้ถูกต้องแล้ว?")
        │
        ▼
ยืนยัน → Transaction:
  - document.update({ approvedAt: now(), approvedById: user.id })
  - documentAudit.create({ action: "APPROVE" })
        │
        ▼
เอกสารกลายเป็นสถานะ "อนุมัติแล้ว" (แสดง badge เขียว "✓ อนุมัติแล้ว โดย [ชื่อ] เมื่อ [วันที่]")
        │
        ▼
จากนี้ไป: canDeleteDocument() และ canEditDocument() จะปฏิเสธการลบ/แก้ไข ยกเว้น
  - ADMIN (ทำได้เสมอ)
  - MANAGER ของหน่วยงานเดียวกับเอกสาร
  STAFF ธรรมดา (แม้เป็นคนสร้างเอกสารเอง) แก้ไข/ลบไม่ได้อีกต่อไป — ปุ่มแก้ไข/ลบหายไปจาก UI
  และถ้าพยายาม bypass ผ่าน server action ตรงๆ จะได้ error message อธิบายเหตุผล
```

**ขอบเขตของการล็อก**: ครอบคลุมทั้ง "แก้ไขข้อมูลเอกสาร", "เพิ่ม/ลบไฟล์แนบ" และ "ลบทั้งเอกสาร" — ไม่ใช่แค่ตัวเอกสาร

### การยกเลิกอนุมัติ (Unapprove)

เดิมออกแบบให้การอนุมัติเป็นทางเดียว (one-way gate) แต่ในทางปฏิบัติ MANAGER/ADMIN ต้องการเปิดให้แก้ไขเอกสารที่อนุมัติไปแล้วได้ในบางกรณี จึงเพิ่มการ "ยกเลิกอนุมัติ" เพื่อย้อนเอกสารกลับไปเป็นสถานะรออนุมัติ:

```
MANAGER (ของหน่วยงานเดียวกับเอกสาร) หรือ ADMIN เข้าหน้ารายละเอียดเอกสารที่อนุมัติแล้ว
เห็นปุ่ม "ยกเลิกการอนุมัติ" (สิทธิ์เดียวกับคนที่อนุมัติได้ — canApproveDocument())
        │
        ▼
กดปุ่ม → Modal ยืนยัน (เตือนว่าเอกสารจะกลับไปแก้ไขได้อีกครั้ง)
        │
        ▼
ยืนยัน → Transaction:
  - document.update({ approvedAt: null, approvedById: null })
  - documentAudit.create({ action: "UNAPPROVE" })
        │
        ▼
เอกสารกลับไปสถานะ "รออนุมัติ" → STAFF ของหน่วยงานนั้นแก้ไข/เพิ่ม-ลบไฟล์แนบ/ลบเอกสารได้ตามปกติอีกครั้ง
```

---

## 9. Flow: การแก้ไขเอกสาร / จัดการไฟล์แนบ (เฉพาะเอกสารที่ยังไม่อนุมัติ)

```
ผู้ใช้เข้าหน้ารายละเอียดเอกสาร เห็นปุ่ม "แก้ไข" (แสดงเฉพาะถ้า canEditDocument() = true)
  - เอกสารยังไม่อนุมัติ → ใครก็ตามที่จัดการเอกสารของหน่วยงานนั้นได้ (STAFF/MANAGER/ADMIN)
  - เอกสารอนุมัติแล้ว → เฉพาะ MANAGER ของหน่วยงานเดียวกันหรือ ADMIN (ดูข้อ 8)
        │
        ▼
กด "แก้ไข" → หน้า /documents/[id]/edit
  - แก้ไขได้: ชื่อเรื่อง, รายละเอียด, วันที่เอกสาร
  - แก้ไขไม่ได้: ประเภทเอกสาร, หน่วยงาน (เพราะเลขที่เอกสารถูกสร้างจากค่านี้ตั้งแต่แรก
    เปลี่ยนภายหลังจะทำให้เลขที่เอกสารกับประเภทไม่ตรงกัน)
        │
        ▼
บันทึก → Server Action ตรวจสิทธิ์ซ้ำ (canEditDocument()) แล้ว
  document.update() + documentAudit.create(action="UPDATE") → redirect กลับหน้ารายละเอียด

ในหน้าเดียวกัน ยังมี:
  - รายการไฟล์แนบเดิม พร้อมปุ่มลบต่อไฟล์ (ใช้ deleteDocumentAttachment เดิม สิทธิ์เดียวกับ canEditDocument())
  - ฟอร์มเพิ่มไฟล์แนบใหม่ (เลือกได้หลายไฟล์) → uploadDocumentFiles()
      ตรวจขนาดไฟล์ไม่เกิน MAX_UPLOAD_SIZE_MB ต่อไฟล์ แล้วบันทึกทีละไฟล์
      พร้อม documentAudit.create(action="UPDATE", detail=ชื่อไฟล์) ต่อไฟล์ที่เพิ่ม
```

---

## 10. Flow: การลบเอกสาร / ไฟล์แนบ

```
ผู้ใช้กดปุ่ม "ลบ" (แสดงเฉพาะถ้า canDeleteDocument() = true ตามกฎข้อ 8)
        │
        ▼
Modal ยืนยันการลบ (custom modal ไม่ใช่ confirm() ของ browser)
        │
        ▼
ยืนยัน → Server Action ตรวจสิทธิ์ซ้ำ (กันการ bypass ผ่าน request ตรงๆ)
        │
        ├── กรณีลบทั้งเอกสาร:
        │     1. log DocumentAudit (action="DELETE") ก่อน — เก็บ documentNumber/documentTitle
        │        เป็น snapshot ไว้ในแถว log เอง (เผื่อเอกสารถูกลบไปแล้วอ่าน log ไม่ได้)
        │     2. ลบไฟล์ทั้งหมดบน disk
        │     3. ลบ record Document (DocumentFile/DocumentAudit ที่เหลือ SET NULL ไม่ cascade)
        │
        └── กรณีลบไฟล์แนบรายไฟล์:
              1. ลบ record DocumentFile
              2. log DocumentAudit (action="DELETE", detail=ชื่อไฟล์)
              3. ลบไฟล์บน disk
        │
        ▼
router.refresh() อัตโนมัติ → แถว/ไฟล์ที่ลบหายจากหน้าทันที ไม่ต้อง reload มือ
(กรณีลบทั้งเอกสารจากหน้ารายละเอียดของเอกสารนั้นเอง → redirect กลับไปหน้ารายการแทน)
```

**เหตุผลที่ DocumentAudit ไม่ cascade delete ตาม Document**: ถ้า cascade ไปด้วย log ที่บันทึกไว้ว่า "ใครลบเอกสารนี้" จะหายไปพร้อมกับเอกสารที่มันบันทึกไว้ ทำให้ตรวจสอบย้อนหลังไม่ได้เลย จึงออกแบบให้ `documentId` เป็น nullable + `onDelete: SetNull` และ snapshot ข้อมูลสำคัญ (เลขที่เอกสาร/ชื่อเรื่อง) ไว้ในแถว log เอง

---

## 11. Flow: การดาวน์โหลด/พรีวิวไฟล์

```
ผู้ใช้กด "ดาวน์โหลด" หรือ "ดูตัวอย่าง" (เฉพาะไฟล์ PDF/รูปภาพ)
        │
        ▼
เรียก /api/documents/[id]/files/[fileId]
  - ตรวจ session (ต้อง login)
  - ตรวจสิทธิ์ canViewDocument() ตามหน่วยงาน/ประเภทเอกสาร
        │
        ▼
อ่านไฟล์จาก disk (storage/documents/...) พร้อมตรวจสอบว่า path ไม่หลุดออกจาก storage root
(ป้องกัน path traversal)
        │
        ▼
log DocumentAudit (action="DOWNLOAD", detail=ชื่อไฟล์)
        │
        ▼
ส่งไฟล์กลับ:
  - ปกติ (ดาวน์โหลด): Content-Disposition: attachment
  - พรีวิว (?inline=1): Content-Disposition: inline → browser render ในหน้าแทนดาวน์โหลด
        │
        ▼
[เฉพาะพรีวิว] Modal เปิดขึ้น แสดง <iframe> (PDF) หรือ <img> (รูปภาพ)
  มีปุ่ม "พิมพ์" — เปิดไฟล์แท็บใหม่แล้วสั่งพิมพ์อัตโนมัติ
```

---

## 12. Flow: การจัดการข้อมูลอ้างอิง (Admin)

เฉพาะ ADMIN เข้าได้ (`requireAdmin()` — 404 แทน redirect เพื่อไม่เปิดเผยว่า route มีอยู่)

หน่วยงาน, ประเภทเอกสาร, ผู้ใช้ ทั้ง 3 อย่างใช้ pattern เดียวกัน:

```
/admin/<entity>              — ตารางรายการอย่างเดียว (read-only)
/admin/<entity>/new          — หน้าแยกสำหรับสร้างใหม่
/admin/<entity>/[id]/edit    — หน้าแยกสำหรับแก้ไข
```

- **สร้าง/แก้ไข**: แยกหน้ากันชัดเจน ไม่ฝังฟอร์มในตาราง
- **ลบ**: Modal ยืนยันเอง — ถูกบล็อกฝั่ง server พร้อมข้อความอธิบายถ้ายังมี record ที่ขึ้นต่อกันอยู่ (เช่น ลบหน่วยงานที่ยังมีผู้ใช้/เอกสารอยู่ไม่ได้, ลบประเภทเอกสารที่มีเอกสารผูกอยู่ไม่ได้) — ระบบจะแนะนำให้ "ปิดใช้งาน" (isActive) แทน
- Admin ลบบัญชีตัวเองไม่ได้

---

## 13. Flow: ประวัติการใช้งาน (Audit Log)

```
ทุกครั้งที่มีการ CREATE / UPDATE / DOWNLOAD / DELETE / APPROVE / UNAPPROVE เอกสารหรือไฟล์แนบ
        │
        ▼
บันทึกลง DocumentAudit: documentId (nullable), documentNumber/documentTitle (snapshot),
                          userId, action, detail (ถ้ามี เช่น ชื่อไฟล์), createdAt
        │
        ▼
Admin เข้า /admin/audit-log
        │
        ▼
กรองได้ตาม: คำค้นหา (เลขที่เอกสาร/ชื่อเรื่อง), การกระทำ, ผู้ใช้
        │
        ▼
ตารางแสดง: วันที่/เวลา, การกระทำ (badge สี), เอกสาร (ลิงก์ไปเอกสารถ้ายังไม่ถูกลบ),
           ผู้กระทำ, รายละเอียด
        │
        ▼
แบ่งหน้าตาม AUDIT_LOG_PAGE_SIZE
```

**คุณสมบัติเด่น**: log ยังอ่านได้ครบแม้เอกสารต้นฉบับถูกลบไปแล้ว (ดูเหตุผลในข้อ 10) — ตอบโจทย์ "ตรวจสอบว่าใคร add/edit/delete/download/approve เอกสาร" ได้แม้เอกสารนั้นไม่มีอยู่แล้ว

---

## 14. Flow: โปรไฟล์ผู้ใช้ (Profile)

ทุก role เข้าได้ที่ `/profile` (คลิกชื่อ/รูปที่มุมขวาบนของทุกหน้า)

```
เปลี่ยนรหัสผ่าน:
  กรอกรหัสผ่านเดิม + รหัสผ่านใหม่ + ยืนยันรหัสผ่านใหม่
        │
        ▼
  Server Action ตรวจสอบรหัสผ่านเดิมถูกต้องก่อน (bcrypt.compare) แล้วค่อย hash รหัสใหม่บันทึก

อัปโหลดรูปโปรไฟล์:
  เลือกไฟล์ (PNG/JPEG/WEBP/GIF, ไม่เกิน MAX_AVATAR_SIZE_MB)
        │
        ▼
  บันทึกไฟล์ใหม่ลง storage/avatars/ → อัปเดต avatarPath → ลบไฟล์เก่าทิ้ง (ไม่สะสมไฟล์ขยะ)
        │
        ▼
  รูปแสดงที่ topbar ทุกหน้าผ่าน /api/users/[id]/avatar
```

---

## 15. รายการฟีเจอร์ทั้งหมด (สรุปย่อ)

| ฟีเจอร์ | อยู่ที่ |
|---|---|
| Login / Logout | `/login`, [auth.ts](src/lib/auth.ts) |
| รายการเอกสาร + ค้นหา (เลขที่/ชื่อเรื่อง) + กรองช่วงวันที่ + แบ่งหน้า | [/documents](src/app/documents/page.tsx) |
| สร้างเอกสาร + แนบไฟล์หลายไฟล์พร้อมกัน | [/documents/new](src/app/documents/new/page.tsx) |
| เลขที่เอกสารอัตโนมัติตาม template | [document-number.ts](src/lib/document-number.ts) |
| รายละเอียดเอกสาร + ไฟล์แนบ | [/documents/\[id\]](src/app/documents/[id]/page.tsx) |
| **แก้ไขเอกสาร (ชื่อเรื่อง/รายละเอียด/วันที่) + เพิ่ม/ลบไฟล์แนบ** (เฉพาะเอกสารยังไม่อนุมัติ หรือ MANAGER/ADMIN) | [/documents/\[id\]/edit](src/app/documents/[id]/edit/page.tsx) |
| ดาวน์โหลด / พรีวิว (PDF, รูปภาพ) / พิมพ์ | [FilePreview.tsx](src/components/FilePreview.tsx) |
| ลบเอกสาร / ลบไฟล์แนบรายไฟล์ | [documents/actions.ts](src/app/documents/actions.ts) |
| **อนุมัติเอกสาร (ล็อกการแก้ไข/ลบ)** | [ApproveButton.tsx](src/components/ApproveButton.tsx) |
| **ยกเลิกการอนุมัติ (เปิดให้แก้ไขได้อีกครั้ง)** | [UnapproveButton.tsx](src/components/UnapproveButton.tsx) |
| จำกัดสิทธิ์ดูตามหน่วยงาน | [access.ts](src/lib/access.ts) |
| สิทธิ์ดูข้ามหน่วยงานตามประเภทเอกสาร | `DocumentTypeAccess`, [/admin/users/\[id\]/edit](src/app/admin/users/[id]/edit/page.tsx) |
| จำกัดหน่วยงานที่สร้างเอกสารแต่ละประเภทได้ | `ownerDepartmentId`, [/admin/document-types](src/app/admin/document-types) |
| Role: ADMIN / MANAGER / STAFF / VIEWER | [access.ts](src/lib/access.ts) |
| จัดการหน่วยงาน (CRUD) | [/admin/departments](src/app/admin/departments) |
| จัดการประเภทเอกสาร (CRUD) | [/admin/document-types](src/app/admin/document-types) |
| จัดการผู้ใช้ (CRUD) | [/admin/users](src/app/admin/users) |
| **ประวัติการใช้งาน (Audit Log)** | [/admin/audit-log](src/app/admin/audit-log/page.tsx) |
| โปรไฟล์: เปลี่ยนรหัสผ่าน + อัปโหลดรูป | [/profile](src/app/profile/page.tsx) |
| แสดงวันที่แบบ dd/mm/yyyy คงที่ (ค.ศ.) | [FormattedDate.tsx](src/components/FormattedDate.tsx) |
| จำกัดขนาดไฟล์อัปโหลด (เอกสาร/รูปโปรไฟล์) | `.env`: `MAX_UPLOAD_SIZE_MB`, `MAX_AVATAR_SIZE_MB` |

---

## 16. ตารางฐานข้อมูลทั้งหมด

| ตาราง | หน้าที่ |
|---|---|
| `User` | บัญชีผู้ใช้ — role, หน่วยงาน, รหัสผ่าน (hash), รูปโปรไฟล์ |
| `Department` | หน่วยงาน |
| `DocumentType` | ประเภทเอกสาร — รูปแบบเลขที่เอกสาร, หน่วยงานเจ้าของ (ถ้ามี) |
| `DocumentTypeAccess` | สิทธิ์ดูเอกสารข้ามหน่วยงานตามประเภท (many-to-many User↔DocumentType) |
| `Document` | เอกสาร — เลขที่, ชื่อเรื่อง, หน่วยงาน, ประเภท, สถานะอนุมัติ |
| `DocumentFile` | ไฟล์แนบของเอกสาร (metadata; ไฟล์จริงอยู่บน disk) |
| `DocumentAudit` | ประวัติการใช้งาน — CREATE/UPDATE/DOWNLOAD/DELETE/APPROVE/UNAPPROVE พร้อม snapshot |

ดู schema เต็มที่ [prisma/schema.prisma](prisma/schema.prisma)

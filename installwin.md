# ติดตั้งและรันบน Windows Server 2019

คู่มือนี้อธิบายการ deploy `twp_document_system` บน Windows Server 2019 โดยใช้ **NSSM** รัน Next.js เป็น Windows Service (restart อัตโนมัติเมื่อเครื่อง reboot หรือแอป crash — เทียบเท่า PM2/systemd บน Linux) และ **IIS** เป็น reverse proxy หน้าเว็บ (แทน Nginx ในคู่มือ Ubuntu — ดู [install.md](install.md))

**สมมติฐาน**: มี Windows Server 2019 พร้อมใช้งาน (bare metal, VM, หรือ cloud instance) ที่เข้าถึงผ่าน RDP ได้ และมี SQL Server instance ที่ server เข้าถึงได้ (จะรันบนเครื่องเดียวกันหรือแยกเครื่องก็ได้) รันคำสั่งทั้งหมดใน **PowerShell แบบ Run as Administrator**

---

## Step 1: ติดตั้ง Node.js

ดาวน์โหลด Node.js 20 LTS (Windows Installer .msi) จาก https://nodejs.org/ แล้วติดตั้งตามปกติ หรือติดตั้งผ่าน `winget`:

```powershell
winget install OpenJS.NodeJS.LTS
```

ปิดแล้วเปิด PowerShell ใหม่ จากนั้นตรวจสอบเวอร์ชัน:

```powershell
node -v
npm -v
```

ควรได้ Node `v20.x` ขึ้นไป (Next.js 16 ต้องการ Node ≥ 20.9)

---

## Step 2: ติดตั้ง IIS + URL Rewrite + Application Request Routing (ARR)

เปิดใช้งาน IIS ผ่าน Server Manager หรือ PowerShell:

```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

ดาวน์โหลดและติดตั้งโมดูลเสริมที่ IIS ไม่มีมาให้ในตัว (จำเป็นสำหรับ reverse proxy):

- **URL Rewrite Module**: https://www.iis.net/downloads/microsoft/url-rewrite
- **Application Request Routing (ARR) 3.0**: https://www.iis.net/downloads/microsoft/application-request-routing

ติดตั้งทั้งสองตัว (.msi) ตามลำดับ แล้ว**รีสตาร์ท IIS**:

```powershell
iisreset
```

เปิดใช้งาน proxy ใน ARR — เปิด **IIS Manager** → คลิกชื่อ server (root level, ไม่ใช่ site) → ดับเบิลคลิก **Application Request Routing Cache** → ที่แถบขวา คลิก **Server Proxy Settings...** → ติ๊ก **Enable proxy** → Apply

---

## Step 3: เตรียม SQL Server connectivity

ถ้า SQL Server รันอยู่บนเครื่องอื่น ตรวจสอบว่า server เข้าถึง port 1433 ได้ก่อน:

```powershell
Test-NetConnection -ComputerName <sql-server-host> -Port 1433
```

ถ้าต้องการรัน SQL Server บนเครื่องเดียวกัน ให้ติดตั้ง **SQL Server 2019/2022 (Standard/Express)** ตามปกติผ่าน installer ของ Microsoft (ไม่แนะนำใช้ Docker บน Windows Server 2019 เพราะต้องเปิด Hyper-V/WSL2 เพิ่ม ซับซ้อนกว่าเครื่อง Linux) — ตั้งค่า **Mixed Mode Authentication** (SQL Server + Windows) ตอนติดตั้ง เพื่อให้ใช้ user/password (`sa`) เชื่อมต่อแบบเดียวกับที่แอปนี้ใช้

สร้างฐานข้อมูลเปล่าไว้ล่วงหน้าผ่าน **SQL Server Management Studio (SSMS)** หรือ `sqlcmd`:

```powershell
sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "CREATE DATABASE twpdocument"
```

---

## Step 4: ดึงโค้ดขึ้น server

สร้างโฟลเดอร์สำหรับเก็บแอป (หลีกเลี่ยง path ที่มีเว้นวรรค เช่น `C:\Program Files\`):

```powershell
New-Item -ItemType Directory -Path "C:\apps\twp_document_system" -Force
Set-Location "C:\apps\twp_document_system"
git clone <repository-url> .
```

(ถ้าไม่ได้ใช้ git ให้ copy โค้ดขึ้นไปแทนผ่าน RDP/network share — ยกเว้น `node_modules`, `.next`, `storage\`)

---

## Step 5: ติดตั้ง dependencies

```powershell
npm ci
```

ใช้ `npm ci` แทน `npm install` บน server เพราะยึดตาม `package-lock.json` เป๊ะๆ ทำให้ deploy ซ้ำได้ผลลัพธ์เดิมทุกครั้ง

---

## Step 6: ตั้งค่า `.env`

สร้างไฟล์ `.env` ที่ root โปรเจกต์ (ใช้ Notepad หรือ VS Code):

```
DATABASE_URL="sqlserver://<sql-host>:1433;database=twpdocument;user=sa;password=<your-password>;trustServerCertificate=true"

AUTH_SECRET="<เปลี่ยนเป็นค่าสุ่มจริง ห้ามใช้ placeholder>"

MAX_UPLOAD_SIZE_MB=20
DOCUMENTS_PAGE_SIZE=20
MAX_AVATAR_SIZE_MB=5
AUDIT_LOG_PAGE_SIZE=30
```

**AUTH_SECRET ต้องเปลี่ยนจาก placeholder เสมอ** — generate ค่าจริงด้วย PowerShell (เทียบเท่า `openssl rand -base64 32`):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

คัดลอกผลลัพธ์ไปแทนที่ `AUTH_SECRET` ใน `.env`

จำกัดสิทธิ์อ่านไฟล์ `.env` ให้เฉพาะ Administrators และบัญชีที่รัน service (ตั้งใน Step 9):

```powershell
icacls ".env" /inheritance:r /grant:r "Administrators:F" "SYSTEM:F"
```

---

## Step 7: รัน Prisma migration + seed ข้อมูลเริ่มต้น

```powershell
npx prisma generate
npm run db:migrate:deploy
npm run db:seed
```

- `prisma generate` — สร้าง Prisma Client ให้ตรงกับ schema ปัจจุบัน (ต้องรันทุกครั้งหลัง `npm ci` เพราะ Client ไม่ได้ commit ไว้ใน git)
- `db:migrate:deploy` — รัน migration ที่ commit ไว้แล้วทั้งหมดตามลำดับ (ใช้บน production เท่านั้น **ห้ามใช้** `prisma migrate dev` เพราะเป็นโหมด interactive สำหรับ local dev)
- `db:seed` — สร้างหน่วยงาน/ประเภทเอกสารเริ่มต้น + บัญชี admin (`admin@company.local` / `Admin@1234`) — **ต้องเปลี่ยนรหัสผ่านนี้ทันทีหลัง deploy จริง** ผ่านหน้า `/profile` หรือ `/admin/users`

---

## Step 8: Build โปรเจกต์

```powershell
npm run build
```

ตรวจสอบว่า build ผ่านไม่มี error ก่อนไปขั้นตอนถัดไป — ถ้า build fail ห้ามข้ามไปตั้ง service เพราะจะรันโค้ดเก่าที่ค้างจาก build ครั้งก่อนโดยไม่รู้ตัว

เตรียมโฟลเดอร์เก็บไฟล์แนบ:

```powershell
New-Item -ItemType Directory -Path "storage\documents" -Force
New-Item -ItemType Directory -Path "storage\avatars" -Force
```

โฟลเดอร์นี้เก็บไฟล์แนบเอกสารและรูปโปรไฟล์จริง (ไม่ได้อยู่ในฐานข้อมูล) **ต้อง backup โฟลเดอร์นี้คู่กับฐานข้อมูลเสมอ** — backup แค่ DB จะทำให้ metadata ในตารางชี้ไปยังไฟล์ที่ไม่มีอยู่จริง

---

## Step 9: ติดตั้ง NSSM และตั้งเป็น Windows Service

ดาวน์โหลด NSSM จาก https://nssm.cc/download (เลือก `nssm-2.24.zip` หรือรุ่นล่าสุด) แตกไฟล์แล้วคัดลอก `nssm.exe` (เลือกโฟลเดอร์ `win64`) ไปไว้ที่ path ที่เรียกใช้ได้ง่าย เช่น `C:\nssm\nssm.exe`

หา path เต็มของ `npm.cmd` ก่อน (จำเป็นสำหรับตั้งค่า NSSM):

```powershell
(Get-Command npm).Source
```

โดยทั่วไปจะได้ประมาณ `C:\Program Files\nodejs\npm.cmd`

ติดตั้ง service ด้วย NSSM (แบบ GUI):

```powershell
C:\nssm\nssm.exe install TwpDocumentSystem
```

หน้าต่าง NSSM GUI จะเปิดขึ้น กรอก:

- **Path**: `C:\Program Files\nodejs\npm.cmd` (path ที่ได้จากคำสั่งด้านบน)
- **Startup directory**: `C:\apps\twp_document_system`
- **Arguments**: `run start`

แท็บ **Details**:
- **Display name**: `TWP Document System`
- **Startup type**: `Automatic`

แท็บ **I/O** (เพื่อเก็บ log แยกไฟล์):
- **Output (stdout)**: `C:\apps\twp_document_system\logs\service-out.log`
- **Error (stderr)**: `C:\apps\twp_document_system\logs\service-err.log`

แท็บ **Environment**: เพิ่มบรรทัด `PORT=3000` (ถ้าต้องการกำหนด port ชัดเจน — ปกติ Next.js `start` ใช้ port 3000 เป็นค่าเริ่มต้นอยู่แล้ว)

สร้างโฟลเดอร์ log ก่อนกด Install:

```powershell
New-Item -ItemType Directory -Path "C:\apps\twp_document_system\logs" -Force
```

กด **Install service**

หรือติดตั้งแบบไม่ใช้ GUI (คำสั่งเดียวจบ) ก็ได้:

```powershell
C:\nssm\nssm.exe install TwpDocumentSystem "C:\Program Files\nodejs\npm.cmd" "run start"
C:\nssm\nssm.exe set TwpDocumentSystem AppDirectory "C:\apps\twp_document_system"
C:\nssm\nssm.exe set TwpDocumentSystem AppStdout "C:\apps\twp_document_system\logs\service-out.log"
C:\nssm\nssm.exe set TwpDocumentSystem AppStderr "C:\apps\twp_document_system\logs\service-err.log"
C:\nssm\nssm.exe set TwpDocumentSystem Start SERVICE_AUTO_START
```

---

## Step 10: สั่งรัน service

```powershell
Start-Service TwpDocumentSystem
Get-Service TwpDocumentSystem
```

สถานะควรเป็น `Running` ตรวจสอบ log ถ้ามีปัญหา:

```powershell
Get-Content "C:\apps\twp_document_system\logs\service-out.log" -Tail 50
Get-Content "C:\apps\twp_document_system\logs\service-err.log" -Tail 50
```

ทดสอบว่าแอปตอบสนองบนเครื่องนี้เอง (ก่อนตั้ง reverse proxy):

```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing | Select-Object StatusCode
```

ควรได้ `StatusCode : 200` หรือ redirect ไปหน้า login

**คำสั่งจัดการ service ที่ใช้บ่อย**:

```powershell
Start-Service TwpDocumentSystem     # เริ่มรัน
Stop-Service TwpDocumentSystem      # หยุด
Restart-Service TwpDocumentSystem   # restart (หลัง deploy โค้ดใหม่)
```

---

## Step 11: ตั้งค่า IIS เป็น reverse proxy

เปิด **IIS Manager** → คลิกขวาที่ **Sites** → **Add Website**

- **Site name**: `twp-document-system`
- **Physical path**: สร้างโฟลเดอร์เปล่าไว้รับ site นี้ เช่น `C:\inetpub\twp-document-system` (ไม่ใช่โฟลเดอร์โปรเจกต์ — IIS แค่ทำหน้าที่ proxy ไม่ต้อง serve ไฟล์จริง)
- **Binding**: Type `http`, Port `80`, Host name = โดเมนที่ใช้จริง (หรือเว้นว่างถ้ายังไม่มีโดเมน)

กด OK สร้าง site แล้วเปิดโฟลเดอร์ `C:\inetpub\twp-document-system` สร้างไฟล์ `web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNode" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    <!-- ต้อง >= MAX_UPLOAD_SIZE_MB ใน .env (หน่วย byte) ไม่งั้นไฟล์แนบใหญ่จะถูก IIS ปฏิเสธก่อนถึงแอป -->
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="26214400" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

(`maxAllowedContentLength="26214400"` = 25 MB เป็นไบต์ — ปรับตามค่า `MAX_UPLOAD_SIZE_MB` ที่ตั้งไว้ใน `.env`)

รีสตาร์ท site:

```powershell
iisreset
```

**ตั้ง HTTPS** — จำเป็นสำหรับ production จริงเพราะระบบมีฟอร์ม login/password ส่งรหัสผ่าน:

- ใช้ certificate จาก Certificate Authority ภายในองค์กร (ถ้ามี Active Directory Certificate Services) แล้ว bind ผ่าน IIS Manager → เลือก site → **Bindings...** → **Add** → Type `https` เลือก certificate
- หรือใช้ **win-acme** (https://www.win-acme.com/) สำหรับขอ certificate จาก Let's Encrypt อัตโนมัติบน Windows

---

## Step 12: ตั้งค่า Windows Firewall

เปิดเฉพาะ port ที่จำเป็นจากภายนอก (80/443 ผ่าน IIS) และปิด port 3000 ไม่ให้เข้าถึงจากนอกเครื่อง:

```powershell
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# ปิด port 3000 จากเครื่องอื่น (อนุญาตเฉพาะ localhost ผ่าน default deny ของ inbound)
New-NetFirewallRule -DisplayName "Block Node App Direct Access" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Block -RemoteAddress Any
```

---

## ขั้นตอนอัปเดตโค้ดใหม่ (deploy ครั้งถัดไป)

```powershell
Set-Location "C:\apps\twp_document_system"
git pull
npm ci
npx prisma generate
npm run db:migrate:deploy   # รันเฉพาะถ้ามี migration ใหม่
npm run build
Restart-Service TwpDocumentSystem
```

**เหตุผลที่ต้องรัน `prisma generate` ทุกครั้งหลัง `git pull`**: ถ้า schema เปลี่ยน แล้วลืมรัน จะได้ Prisma Client รุ่นเก่าที่ไม่มี field/model ใหม่ ทำให้เกิด error `Cannot read properties of undefined` แม้โค้ดแอปจะถูกต้องแล้วก็ตาม

**เหตุผลที่ต้อง `Restart-Service` เสมอหลัง build**: NSSM ไม่รู้ว่าไฟล์ `.next\` เปลี่ยน มันแค่รัน process เดิมที่โหลดโค้ดเก่าไว้ในหน่วยความจำค้างอยู่ ถ้าไม่ restart จะยังเห็นเวอร์ชันก่อน build ใหม่อยู่

---

## Checklist ก่อนเปิดใช้งานจริง (production)

- [ ] เปลี่ยน `AUTH_SECRET` เป็นค่าสุ่มจริง ไม่ใช่ placeholder
- [ ] เปลี่ยนรหัสผ่านบัญชี admin ที่มาจาก seed script (`admin@company.local` / `Admin@1234`)
- [ ] `.env` จำกัดสิทธิ์อ่านเฉพาะ Administrators/SYSTEM (Step 6)
- [ ] ตั้ง HTTPS ผ่าน IIS แล้ว (ระบบมีฟอร์ม login/password)
- [ ] `maxAllowedContentLength` ใน `web.config` ตรงหรือมากกว่า `MAX_UPLOAD_SIZE_MB`
- [ ] `storage\` และฐานข้อมูล มีแผน backup ร่วมกัน (ไม่ backup แยกกันคนละตาราง)
- [ ] Service ตั้งเป็น `Automatic` startup แล้ว (แอปรันคืนอัตโนมัติหลัง server reboot) — ทดสอบด้วยการ reboot เครื่องจริงหนึ่งครั้งก่อนใช้งานจริง
- [ ] Firewall ปิด port 3000 จากภายนอก เปิดเฉพาะผ่าน IIS (80/443)
- [ ] ARR proxy enabled แล้วใน IIS (Step 2) — ถ้าลืมขั้นตอนนี้ IIS จะไม่ forward request ไปยัง Node app เลย

# ติดตั้งและรันบน Windows Server 2019 ด้วย PM2

คู่มือนี้อธิบายการ deploy `twp_document_system` บน Windows Server 2019 โดยใช้ **PM2** จัดการ process (เหมือนคู่มือ Ubuntu — ดู [install.md](install.md)) ร่วมกับ **IIS** เป็น reverse proxy หน้าเว็บ

**ต่างจาก [installwin.md](installwin.md) (NSSM) ตรงไหน**: เอกสารนี้ใช้ PM2 แทน NSSM ในการรัน/ดูแล process — เหมาะถ้าทีมคุ้นเคยกับ PM2 อยู่แล้วจากฝั่ง Linux และต้องการใช้คำสั่ง `pm2 status`/`pm2 logs`/`pm2 restart` แบบเดียวกันข้ามแพลตฟอร์ม ข้อควรรู้: **PM2 บน Windows ไม่มี systemd ให้พึ่งพา** (`pm2 startup systemd` ใช้ไม่ได้) จึงต้องติดตั้งแพ็กเกจเสริม `pm2-windows-startup` เพื่อให้ PM2 รันตอนเครื่อง boot อัตโนมัติ — เป็นขั้นตอนที่ [installwin.md](installwin.md) (ใช้ NSSM ซึ่งเป็น Windows Service โดยตรง) ไม่ต้องมี

**สมมติฐาน**: มี Windows Server 2019 พร้อมใช้งาน (bare metal, VM, หรือ cloud instance) ที่เข้าถึงผ่าน RDP ได้ และมี SQL Server instance ที่ server เข้าถึงได้ (จะรันบนเครื่องเดียวกันหรือแยกเครื่องก็ได้) รันคำสั่งทั้งหมดใน **PowerShell แบบ Run as Administrator**

---

## Step 1: ติดตั้ง Node.js

ดาวน์โหลด Node.js 20 LTS (Windows Installer .msi) จาก https://nodejs.org/ หรือติดตั้งผ่าน `winget`:

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

## Step 2: ติดตั้ง PM2 และแพ็กเกจสำหรับ auto-start บน Windows

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

`pm2-windows-startup` คือส่วนที่ทำให้ PM2 รันตอนเครื่อง boot อัตโนมัติบน Windows (ทดแทน `pm2 startup systemd` ที่ใช้บน Linux ไม่ได้ — ดู Step 12)

ตรวจสอบ:

```powershell
pm2 -v
```

---

## Step 3: ติดตั้ง IIS + URL Rewrite + Application Request Routing (ARR)

เปิดใช้งาน IIS:

```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

ดาวน์โหลดและติดตั้งโมดูลเสริมที่ IIS ไม่มีมาให้ในตัว (จำเป็นสำหรับ reverse proxy):

- **URL Rewrite Module**: https://www.iis.net/downloads/microsoft/url-rewrite
- **Application Request Routing (ARR) 3.0**: https://www.iis.net/downloads/microsoft/application-request-routing

ติดตั้งทั้งสองตัว (.msi) แล้ว**รีสตาร์ท IIS**:

```powershell
iisreset
```

เปิดใช้งาน proxy ใน ARR — เปิด **IIS Manager** → คลิกชื่อ server (root level) → ดับเบิลคลิก **Application Request Routing Cache** → แถบขวา **Server Proxy Settings...** → ติ๊ก **Enable proxy** → Apply

---

## Step 4: เตรียม SQL Server connectivity

ถ้า SQL Server รันอยู่บนเครื่องอื่น ตรวจสอบว่า server เข้าถึง port 1433 ได้ก่อน:

```powershell
Test-NetConnection -ComputerName <sql-server-host> -Port 1433
```

ถ้าต้องการรัน SQL Server บนเครื่องเดียวกัน ติดตั้ง **SQL Server 2019/2022 (Standard/Express)** ผ่าน installer ของ Microsoft ตั้งค่า **Mixed Mode Authentication** (SQL Server + Windows) ตอนติดตั้ง เพื่อใช้ user/password (`sa`) เชื่อมต่อแบบเดียวกับที่แอปนี้ใช้

สร้างฐานข้อมูลเปล่าไว้ล่วงหน้า:

```powershell
sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "CREATE DATABASE twpdocument"
```

---

## Step 5: ดึงโค้ดขึ้น server

```powershell
New-Item -ItemType Directory -Path "C:\apps\twp_document_system" -Force
Set-Location "C:\apps\twp_document_system"
git clone <repository-url> .
```

(ถ้าไม่ได้ใช้ git ให้ copy โค้ดขึ้นไปแทน — ยกเว้น `node_modules`, `.next`, `storage\`)

---

## Step 6: ติดตั้ง dependencies

```powershell
npm ci
```

ใช้ `npm ci` แทน `npm install` บน server เพราะยึดตาม `package-lock.json` เป๊ะๆ ทำให้ deploy ซ้ำได้ผลลัพธ์เดิมทุกครั้ง

---

## Step 7: ตั้งค่า `.env`

สร้างไฟล์ `.env` ที่ root โปรเจกต์:

```
DATABASE_URL="sqlserver://<sql-host>:1433;database=twpdocument;user=sa;password=<your-password>;trustServerCertificate=true"

AUTH_SECRET="<เปลี่ยนเป็นค่าสุ่มจริง ห้ามใช้ placeholder>"

MAX_UPLOAD_SIZE_MB=20
DOCUMENTS_PAGE_SIZE=20
MAX_AVATAR_SIZE_MB=5
AUDIT_LOG_PAGE_SIZE=30
```

**AUTH_SECRET ต้องเปลี่ยนจาก placeholder เสมอ** — generate ค่าจริงด้วย PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

คัดลอกผลลัพธ์ไปแทนที่ `AUTH_SECRET` ใน `.env`

จำกัดสิทธิ์อ่านไฟล์ `.env`:

```powershell
icacls ".env" /inheritance:r /grant:r "Administrators:F" "SYSTEM:F"
```

---

## Step 8: รัน Prisma migration + seed ข้อมูลเริ่มต้น

```powershell
npx prisma generate
npm run db:migrate:deploy
npm run db:seed
```

- `prisma generate` — สร้าง Prisma Client ให้ตรงกับ schema ปัจจุบัน (ต้องรันทุกครั้งหลัง `npm ci`)
- `db:migrate:deploy` — รัน migration ที่ commit ไว้แล้วทั้งหมด (ใช้บน production เท่านั้น **ห้ามใช้** `prisma migrate dev`)
- `db:seed` — สร้างหน่วยงาน/ประเภทเอกสารเริ่มต้น + บัญชี admin (`admin@company.local` / `Admin@1234`) — **ต้องเปลี่ยนรหัสผ่านนี้ทันทีหลัง deploy จริง**

---

## Step 9: Build โปรเจกต์

```powershell
npm run build
```

ตรวจสอบว่า build ผ่านไม่มี error ก่อนไปขั้นตอนถัดไป

เตรียมโฟลเดอร์เก็บไฟล์แนบ:

```powershell
New-Item -ItemType Directory -Path "storage\documents" -Force
New-Item -ItemType Directory -Path "storage\avatars" -Force
```

โฟลเดอร์นี้เก็บไฟล์แนบเอกสารและรูปโปรไฟล์จริง **ต้อง backup คู่กับฐานข้อมูลเสมอ**

---

## Step 10: สร้างไฟล์ PM2 ecosystem config

สร้างไฟล์ `ecosystem.config.js` ที่ root โปรเจกต์:

```js
module.exports = {
  apps: [
    {
      name: "twp-document-system",
      cwd: "C:\\apps\\twp_document_system",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "500M",
      out_file: "C:\\apps\\twp_document_system\\logs\\out.log",
      error_file: "C:\\apps\\twp_document_system\\logs\\error.log",
      time: true,
    },
  ],
};
```

หมายเหตุ:
- ใช้ `\\` (double backslash) ใน path เพราะเป็นไฟล์ JavaScript — path string ต้อง escape backslash
- `instances: 1` — แอปใช้ local disk (`storage\`) เป็นที่เก็บไฟล์ ถ้าต้องการ scale หลาย instance ให้พิจารณาย้ายไป object storage ก่อน
- `max_memory_restart` — PM2 จะ restart อัตโนมัติถ้าโปรเซสกินแรมเกินที่ตั้งไว้

สร้างโฟลเดอร์ log:

```powershell
New-Item -ItemType Directory -Path "C:\apps\twp_document_system\logs" -Force
```

---

## Step 11: สั่งรันด้วย PM2

```powershell
pm2 start ecosystem.config.js
```

ตรวจสอบสถานะ:

```powershell
pm2 status
pm2 logs twp-document-system --lines 50
```

ทดสอบว่าแอปตอบสนองบนเครื่องนี้เอง (ก่อนตั้ง reverse proxy):

```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing | Select-Object StatusCode
```

ควรได้ `StatusCode : 200` หรือ redirect ไปหน้า login

---

## Step 12: ตั้งให้ PM2 รันตอน boot อัตโนมัติ

```powershell
pm2 save
pm2-startup install
```

`pm2-startup install` (มาจากแพ็กเกจ `pm2-windows-startup` ที่ติดตั้งใน Step 2) จะสร้าง Scheduled Task ที่รัน PM2 daemon ตอน Windows เริ่มทำงาน แล้วโหลด process list ที่ `pm2 save` บันทึกไว้กลับมาอัตโนมัติ — **เป็นกลไกคนละแบบกับ `pm2 startup systemd` บน Linux เพราะ Windows ไม่มี systemd** ให้ผูกกับ service manager ของ OS โดยตรงเหมือน Linux

ตรวจสอบว่าตั้ง Scheduled Task สำเร็จ:

```powershell
Get-ScheduledTask -TaskName "PM2*"
```

**ทดสอบสำคัญ**: ต้อง **reboot เครื่องจริงหนึ่งครั้ง** แล้วเช็คว่า `pm2 status` กลับมาเห็น process รันอยู่เอง — ไม่ควรข้ามการทดสอบนี้ เพราะการตั้งค่า auto-start บน Windows ผ่าน PM2 มีรายงานปัญหาเรื่องความเสถียรมากกว่า NSSM/systemd อยู่บ้าง (ดูหัวข้อ "ข้อจำกัดที่ควรรู้" ท้ายเอกสาร)

**คำสั่งจัดการที่ใช้บ่อย** (เหมือนกับบน Linux ทุกคำสั่ง):

```powershell
pm2 status                              # ดูสถานะ process ทั้งหมด
pm2 logs twp-document-system            # ดู log แบบ real-time
pm2 restart twp-document-system         # restart แอป (หลัง deploy โค้ดใหม่)
pm2 stop twp-document-system            # หยุดแอปชั่วคราว
pm2 monit                               # dashboard ดู CPU/memory แบบ real-time
```

---

## Step 13: ตั้งค่า IIS เป็น reverse proxy

PM2 รันแอปที่ port 3000 บน localhost เท่านั้น — ตั้ง IIS รับ traffic จาก port 80/443 แล้ว proxy ต่อ ไม่เปิด port 3000 ออก internet ตรงๆ

เปิด **IIS Manager** → คลิกขวาที่ **Sites** → **Add Website**

- **Site name**: `twp-document-system`
- **Physical path**: สร้างโฟลเดอร์เปล่าไว้รับ site นี้ เช่น `C:\inetpub\twp-document-system` (ไม่ใช่โฟลเดอร์โปรเจกต์)
- **Binding**: Type `http`, Port `80`, Host name = โดเมนที่ใช้จริง (หรือเว้นว่างถ้ายังไม่มีโดเมน)

กด OK แล้วสร้างไฟล์ `web.config` ในโฟลเดอร์ `C:\inetpub\twp-document-system`:

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

(`maxAllowedContentLength="26214400"` = 25 MB เป็นไบต์ — ปรับตามค่า `MAX_UPLOAD_SIZE_MB` ที่ตั้งไว้)

รีสตาร์ท:

```powershell
iisreset
```

**ตั้ง HTTPS** — จำเป็นสำหรับ production จริงเพราะระบบมีฟอร์ม login/password:

- ใช้ certificate จาก Certificate Authority ภายในองค์กร (ถ้ามี Active Directory Certificate Services) แล้ว bind ผ่าน IIS Manager → เลือก site → **Bindings...** → **Add** → Type `https`
- หรือใช้ **win-acme** (https://www.win-acme.com/) สำหรับขอ certificate จาก Let's Encrypt อัตโนมัติบน Windows

---

## Step 14: ตั้งค่า Windows Firewall

```powershell
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# ปิด port 3000 จากเครื่องอื่น
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
pm2 restart twp-document-system
```

**เหตุผลที่ต้องรัน `prisma generate` ทุกครั้งหลัง `git pull`**: ถ้า schema เปลี่ยน แล้วลืมรัน จะได้ Prisma Client รุ่นเก่าที่ไม่มี field/model ใหม่ ทำให้เกิด error `Cannot read properties of undefined` แม้โค้ดแอปจะถูกต้องแล้วก็ตาม

**เหตุผลที่ต้อง `pm2 restart` เสมอหลัง build**: PM2 ไม่รู้ว่าไฟล์ `.next\` เปลี่ยน มันแค่รัน process เดิมที่โหลดโค้ดเก่าไว้ในหน่วยความจำค้างอยู่ ถ้าไม่ restart จะยังเห็นเวอร์ชันก่อน build ใหม่อยู่

---

## ข้อจำกัดที่ควรรู้เกี่ยวกับ PM2 บน Windows

- **ไม่มี systemd** — auto-start ต้องพึ่ง `pm2-windows-startup` (Scheduled Task) แทน ซึ่งความเสถียรขึ้นอยู่กับการตั้งค่า Task Scheduler ของเครื่องนั้นๆ มากกว่า NSSM (ซึ่งลงทะเบียนเป็น native Windows Service โดยตรง) — ถ้าองค์กรมีนโยบาย GPO ที่จำกัด Scheduled Task หรือปิดการรันตอน login อาจกระทบการ auto-start ของ PM2
- **PM2 GUI/cluster mode บน Windows** มีข้อจำกัดมากกว่าบน Linux (เช่น `exec_mode: "cluster"` ไม่เสถียรเท่า `"fork"` — เอกสารนี้จึงใช้ `fork` เสมอ)
- ถ้าต้องการความเสถียรของ auto-restart ที่ผูกกับ Windows Service Manager โดยตรง (แนะนำสำหรับ production ที่ต้องรองรับ reboot บ่อยหรือมี policy เข้มงวด) ให้พิจารณาใช้ [installwin.md](installwin.md) (NSSM) แทน

---

## Checklist ก่อนเปิดใช้งานจริง (production)

- [ ] เปลี่ยน `AUTH_SECRET` เป็นค่าสุ่มจริง ไม่ใช่ placeholder
- [ ] เปลี่ยนรหัสผ่านบัญชี admin ที่มาจาก seed script (`admin@company.local` / `Admin@1234`)
- [ ] `.env` จำกัดสิทธิ์อ่านเฉพาะ Administrators/SYSTEM (Step 7)
- [ ] ตั้ง HTTPS ผ่าน IIS แล้ว
- [ ] `maxAllowedContentLength` ใน `web.config` ตรงหรือมากกว่า `MAX_UPLOAD_SIZE_MB`
- [ ] `storage\` และฐานข้อมูล มีแผน backup ร่วมกัน
- [ ] `pm2 save` + `pm2-startup install` ตั้งไว้แล้ว **และทดสอบ reboot เครื่องจริงแล้วว่า process กลับมาเองจริง** (Step 12)
- [ ] Firewall ปิด port 3000 จากภายนอก เปิดเฉพาะผ่าน IIS (80/443)
- [ ] ARR proxy enabled แล้วใน IIS (Step 3) — ถ้าลืมขั้นตอนนี้ IIS จะไม่ forward request ไปยัง Node app เลย

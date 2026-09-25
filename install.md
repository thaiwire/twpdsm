# ติดตั้งและรันบน Ubuntu Server ด้วย PM2

คู่มือนี้อธิบายการ deploy `twp_document_system` บน Ubuntu Server (ทดสอบกับ Ubuntu 22.04/24.04) โดยใช้ PM2 จัดการ process ให้รันค้างและ restart อัตโนมัติเมื่อเครื่อง reboot หรือแอป crash

**สมมติฐาน**: มี Ubuntu server พร้อมใช้งาน (bare metal, VM, หรือ cloud instance) ที่เข้าถึงผ่าน SSH ได้ และมี SQL Server instance ที่ server เข้าถึงได้ (จะรันบนเครื่องเดียวกันหรือแยกเครื่องก็ได้)

---

## Step 1: ติดตั้ง Node.js

โปรเจกต์นี้ใช้ Node 20 (Next.js 16 ต้องการ Node ≥ 20.9) ติดตั้งผ่าน NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

ตรวจสอบเวอร์ชัน:

```bash
node -v   # ควรได้ v20.x
npm -v
```

---

## Step 2: ติดตั้ง PM2

```bash
sudo npm install -g pm2
```

ตรวจสอบ:

```bash
pm2 -v
```

---

## Step 3: เตรียม SQL Server connectivity

ถ้า SQL Server รันอยู่บนเครื่องอื่น (หรือ Docker บนเครื่องเดียวกัน) ให้ตรวจสอบว่า server เข้าถึง port 1433 ได้ก่อน:

```bash
nc -zv <sql-server-host> 1433
```

ถ้าไม่มี SQL Server อยู่แล้ว และต้องการรันบนเครื่องเดียวกันผ่าน Docker:

```bash
sudo apt-get install -y docker.io
sudo docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong!Passw0rd" \
  -p 1433:1433 --name sqlserver --restart unless-stopped \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

สร้างฐานข้อมูลเปล่าไว้ล่วงหน้า (Prisma migration จะสร้างตารางเองแต่ไม่สร้าง database):

```bash
sudo docker exec -it sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U SA -P 'YourStrong!Passw0rd' -C \
  -Q "CREATE DATABASE twpdocument"
```

---

## Step 4: ดึงโค้ดขึ้น server

```bash
sudo mkdir -p /opt/apps
sudo chown $USER:$USER /opt/apps
cd /opt/apps
git clone <repository-url> twp_document_system
cd twp_document_system
```

(ถ้าไม่ได้ใช้ git ให้ `scp`/`rsync` โค้ดขึ้นไปแทน — ยกเว้น `node_modules`, `.next`, `storage/`)

---

## Step 5: ติดตั้ง dependencies

```bash
npm ci
```

ใช้ `npm ci` แทน `npm install` บน server เพราะ `npm ci` ยึดตาม `package-lock.json` เป๊ะๆ ไม่คำนวณ dependency tree ใหม่ ทำให้ deploy ซ้ำได้ผลลัพธ์เดิมทุกครั้ง

---

## Step 6: ตั้งค่า `.env`

```bash
cp .env.example .env   # ถ้ามี .env.example — ถ้าไม่มีให้สร้างไฟล์ .env ใหม่ตามด้านล่าง
nano .env
```

ค่าที่ต้องตั้งจริงสำหรับ production:

```bash
DATABASE_URL="sqlserver://<sql-host>:1433;database=twpdocument;user=sa;password=<your-password>;trustServerCertificate=true"

# สร้างด้วย: openssl rand -base64 32
AUTH_SECRET="<เปลี่ยนเป็นค่าสุ่มจริง ห้ามใช้ placeholder>"

MAX_UPLOAD_SIZE_MB=20
DOCUMENTS_PAGE_SIZE=20
MAX_AVATAR_SIZE_MB=5
AUDIT_LOG_PAGE_SIZE=30
```

**AUTH_SECRET ต้องเปลี่ยนจาก placeholder เสมอ** — รันคำสั่งนี้เพื่อ generate ค่าจริง:

```bash
openssl rand -base64 32
```

คัดลอกผลลัพธ์ไปแทนที่ `AUTH_SECRET` ใน `.env`

ตั้งสิทธิ์ไฟล์ไม่ให้คนอื่นอ่านได้ (มี password/secret อยู่ข้างใน):

```bash
chmod 600 .env
```

---

## Step 7: รัน Prisma migration + seed ข้อมูลเริ่มต้น

```bash
npx prisma generate
npm run db:migrate:deploy
npm run db:seed
```

- `prisma generate` — สร้าง Prisma Client ให้ตรงกับ schema ปัจจุบัน (ต้องรันทุกครั้งหลัง `npm ci` เพราะ Client ไม่ได้ commit ไว้ใน git)
- `db:migrate:deploy` — รัน migration ที่ commit ไว้แล้วทั้งหมดตามลำดับ (ใช้คำสั่งนี้บน production เท่านั้น **ห้ามใช้** `prisma migrate dev` เพราะเป็นโหมด interactive สำหรับ local dev และจะพยายามสร้าง migration ใหม่ถ้า schema กับ migration ไม่ตรงกัน)
- `db:seed` — สร้างหน่วยงาน/ประเภทเอกสารเริ่มต้น + บัญชี admin (`admin@company.local` / `Admin@1234`) — **ต้องเปลี่ยนรหัสผ่านนี้ทันทีหลัง deploy จริง** ผ่านหน้า `/profile` หรือ `/admin/users`

---

## Step 8: Build โปรเจกต์

```bash
npm run build
```

ตรวจสอบว่า build ผ่านไม่มี error ก่อนไปขั้นตอนถัดไป — ถ้า build fail ห้ามข้ามไปรัน `pm2 start` เพราะจะรันโค้ดเก่าที่ค้างจาก build ครั้งก่อนโดยไม่รู้ตัว

---

## Step 9: เตรียมโฟลเดอร์เก็บไฟล์แนบ

```bash
mkdir -p storage/documents storage/avatars
```

โฟลเดอร์นี้เก็บไฟล์แนบเอกสารและรูปโปรไฟล์จริง (ไม่ได้อยู่ในฐานข้อมูล) **ต้อง backup โฟลเดอร์นี้คู่กับฐานข้อมูลเสมอ** — backup แค่ DB จะทำให้ metadata ในตารางชี้ไปยังไฟล์ที่ไม่มีอยู่จริง

---

## Step 10: สร้างไฟล์ PM2 ecosystem config

สร้างไฟล์ `ecosystem.config.js` ที่ root โปรเจกต์:

```js
module.exports = {
  apps: [
    {
      name: "twp-document-system",
      cwd: "/opt/apps/twp_document_system",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "500M",
      out_file: "/var/log/pm2/twp-document-system-out.log",
      error_file: "/var/log/pm2/twp-document-system-error.log",
      time: true,
    },
  ],
};
```

หมายเหตุ:
- `instances: 1` — เพราะแอปใช้ local disk (`storage/`) เป็นที่เก็บไฟล์ ถ้ารันหลาย instance บนเครื่องเดียวกันจะไม่มีปัญหาเรื่อง race เพราะ path ต่างกันตาม `documentId`/`userId` แต่ถ้าต้องการ scale ให้พิจารณาย้ายไป object storage ก่อน (ดูหมายเหตุท้ายเอกสาร)
- `max_memory_restart` — PM2 จะ restart อัตโนมัติถ้าโปรเซสกินแรมเกินที่ตั้งไว้ ป้องกัน memory leak สะสม
- log path `/var/log/pm2/` ต้องสร้างและให้สิทธิ์ก่อน (ดูขั้นตอนถัดไป)

สร้างโฟลเดอร์ log:

```bash
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

---

## Step 11: สั่งรันด้วย PM2

```bash
pm2 start ecosystem.config.js
```

ตรวจสอบสถานะ:

```bash
pm2 status
pm2 logs twp-document-system --lines 50
```

ทดสอบว่าแอปตอบสนอง:

```bash
curl -I http://localhost:3000
```

ควรได้ `HTTP/1.1 200 OK` หรือ redirect ไปหน้า login

---

## Step 12: ตั้งให้ PM2 รันตอน boot อัตโนมัติ

```bash
pm2 save
pm2 startup systemd
```

คำสั่ง `pm2 startup` จะ print คำสั่ง `sudo env PATH=$PATH ...` ออกมาให้ก๊อปไปรันต่อ (ต้องรันตามที่มันบอกเป๊ะๆ เพราะ path จะต่างกันไปตามเครื่อง) — หลังรันเสร็จ PM2 จะสร้าง systemd service ที่ boot ตอนเครื่องเปิดและ restart process ที่ `pm2 save` ไว้อัตโนมัติ

ทดสอบว่าติดตั้ง systemd service ถูกต้อง:

```bash
sudo systemctl status pm2-$USER
```

---

## Step 13: ตั้งค่า reverse proxy ด้วย Nginx (แนะนำ)

PM2 รันแอปที่ port 3000 บน localhost เท่านั้น — สำหรับ production ควรตั้ง Nginx เป็น reverse proxy รับ traffic จาก port 80/443 แล้วส่งต่อ ไม่เปิด port 3000 ออก internet ตรงๆ

```bash
sudo apt-get install -y nginx
```

สร้างไฟล์ config `/etc/nginx/sites-available/twp-document-system`:

```nginx
server {
    listen 80;
    server_name your-domain.example.com;

    client_max_body_size 25M;  # ต้อง >= MAX_UPLOAD_SIZE_MB ใน .env ไม่งั้นไฟล์แนบใหญ่จะถูก Nginx ปฏิเสธก่อนถึงแอป

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

เปิดใช้งาน:

```bash
sudo ln -s /etc/nginx/sites-available/twp-document-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**ตั้ง HTTPS** ด้วย Let's Encrypt (จำเป็นสำหรับ production จริง เพราะระบบมีการส่งรหัสผ่านผ่าน login form):

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example.com
```

---

## Step 14: ตั้งค่า firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

ห้ามเปิด port 3000 ออกจาก firewall โดยตรง — ให้ traffic ทั้งหมดผ่าน Nginx เท่านั้น

---

## คำสั่งที่ใช้บ่อยหลัง deploy

```bash
pm2 status                              # ดูสถานะ process ทั้งหมด
pm2 logs twp-document-system            # ดู log แบบ real-time
pm2 restart twp-document-system         # restart แอป (หลัง deploy โค้ดใหม่)
pm2 stop twp-document-system            # หยุดแอปชั่วคราว
pm2 monit                               # dashboard ดู CPU/memory แบบ real-time
```

---

## ขั้นตอนอัปเดตโค้ดใหม่ (deploy ครั้งถัดไป)

```bash
cd /opt/apps/twp_document_system
git pull
npm ci
npx prisma generate
npm run db:migrate:deploy   # รันเฉพาะถ้ามี migration ใหม่
npm run build
pm2 restart twp-document-system
npm run build && pm2 restart twp-document-system --update-env
```

**เหตุผลที่ต้องรัน `prisma generate` ทุกครั้งหลัง `git pull`**: ถ้า schema เปลี่ยน แล้วลืมรัน จะได้ Prisma Client รุ่นเก่าที่ไม่มี field/model ใหม่ ทำให้เกิด error `Cannot read properties of undefined` แม้โค้ดแอปจะถูกต้องแล้วก็ตาม (เจอปัญหานี้บ่อยระหว่างพัฒนา — อาการเดียวกับตอน dev server ไม่ได้ restart หลัง migrate)

**เหตุผลที่ต้อง `pm2 restart` เสมอหลัง build**: PM2 ไม่รู้ว่าไฟล์ `.next/` เปลี่ยน มันแค่รัน process เดิมที่โหลดโค้ดเก่าไว้ในหน่วยความจำค้างอยู่ ถ้าไม่ restart จะยังเห็นเวอร์ชันก่อน build ใหม่อยู่

---

## Checklist ก่อนเปิดใช้งานจริง (production)

- [ ] เปลี่ยน `AUTH_SECRET` เป็นค่าสุ่มจริง ไม่ใช่ placeholder
- [ ] เปลี่ยนรหัสผ่านบัญชี admin ที่มาจาก seed script (`admin@company.local` / `Admin@1234`)
- [ ] `.env` มีสิทธิ์ `600` (อ่านได้เฉพาะ owner)
- [ ] ตั้ง HTTPS ผ่าน Nginx + Let's Encrypt แล้ว (ระบบมีฟอร์ม login/password)
- [ ] `client_max_body_size` ใน Nginx ตรงหรือมากกว่า `MAX_UPLOAD_SIZE_MB`
- [ ] `storage/` และฐานข้อมูล มีแผน backup ร่วมกัน (ไม่ backup แยกกันคนละตาราง)
- [ ] `pm2 save` + `pm2 startup` ตั้งไว้แล้ว (แอปรันคืนอัตโนมัติหลัง server reboot)
- [ ] Firewall ปิด port 3000 จากภายนอก เปิดเฉพาะผ่าน Nginx

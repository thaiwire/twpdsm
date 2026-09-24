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

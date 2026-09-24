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

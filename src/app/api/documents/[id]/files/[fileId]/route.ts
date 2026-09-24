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

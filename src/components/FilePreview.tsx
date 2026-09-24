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

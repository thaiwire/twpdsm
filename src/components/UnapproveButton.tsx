"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function UnapproveButton({
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
        className="rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
      >
        ยกเลิกการอนุมัติ
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            {error ? (
              <>
                <h2 className="text-base font-semibold text-gray-900">ไม่สามารถยกเลิกการอนุมัติได้</h2>
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
                <h2 className="text-base font-semibold text-gray-900">ยืนยันการยกเลิกอนุมัติ</h2>
                <p className="mt-2 text-sm text-gray-600">
                  ต้องการยกเลิกการอนุมัติ &ldquo;{itemLabel}&rdquo; ใช่หรือไม่? เอกสารจะกลับไปเป็นสถานะรออนุมัติ
                  และเจ้าหน้าที่ในหน่วยงานจะสามารถแก้ไขเอกสารหรือไฟล์แนบได้อีกครั้ง
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
                    className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิกอนุมัติ"}
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

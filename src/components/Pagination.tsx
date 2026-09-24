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

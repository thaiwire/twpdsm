"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_NAV_ITEMS = [{ href: "/documents", label: "เอกสารทั้งหมด" }];
const CREATE_NAV_ITEM = { href: "/documents/new", label: "สร้างเอกสาร" };

const ADMIN_NAV_ITEMS = [
  { href: "/admin/departments", label: "หน่วยงาน" },
  { href: "/admin/document-types", label: "ประเภทเอกสาร" },
  { href: "/admin/users", label: "ผู้ใช้งาน" },
  { href: "/admin/audit-log", label: "ประวัติการใช้งาน" },
];

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const isActive = href === "/documents" ? pathname === "/documents" : pathname.startsWith(href);

  return (
    <li>
      <Link
        href={href}
        className={`block rounded px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

export function SidebarNav({
  isAdmin,
  canCreateDocuments = true,
}: {
  isAdmin?: boolean;
  canCreateDocuments?: boolean;
}) {
  const pathname = usePathname();
  const navItems = canCreateDocuments ? [...BASE_NAV_ITEMS, CREATE_NAV_ITEM] : BASE_NAV_ITEMS;

  return (
    <nav className="w-64 shrink-0 bg-[#131a2b] py-4">
      <ul className="space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}
      </ul>

      {isAdmin && (
        <>
          <p className="mt-6 px-7 text-xs font-semibold uppercase tracking-wide text-gray-500">
            จัดการระบบ
          </p>
          <ul className="mt-2 space-y-1 px-3">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} />
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderActions from "@/components/HeaderActions";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/danh-muc", label: "Khám phá Tour" },
  { href: "/tai-khoan", label: "Tài Khoản" },
];

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/quan-tri");

  if (isAdminRoute) {
    return <div className="min-h-screen bg-slate-100 text-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen text-slate-900">
      {/* 1. Header bao ngoài: flex, justify-between để đẩy Logo & Cụm phải ra 2 đầu */}
      <header className="sticky top-0 z-40 border-b border-sky-100/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-3 md:px-10">
          
          {/* KHỐI 1 (Bên trái): Logo & Title */}
          <div className="flex flex-col shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-700">
              Travel Website
            </p>
            <Link href="/" className="font-display text-2xl font-bold text-sky-950">
              BETOURIST
            </Link>
          </div>

          {/* KHỐI 2 (Ở giữa): Menu "Viên thuốc" (Chìa khóa nằm ở đây) */}
          {/* hidden md:flex: Ẩn trên mobi, hiện trên máy tính */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-slate-100/70 p-1.5 border border-slate-200/50 shadow-inner">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                // Class cho từng item menu: rounded-full để bo tròn khi hover
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-sky-800 hover:shadow-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* KHỐI 3 (Bên phải): Cụm nút bấm Login/Register (HeaderActions) */}
          <div className="flex shrink-0">
             <HeaderActions />
          </div>

        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:px-10">
        {children}
      </main>

      <footer className="border-t border-sky-100 bg-white/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-slate-500 md:px-10">
          <p className="font-display text-lg text-slate-700">BETOURIST Frontend Demo</p>
          <p>Giao dien Next.js co ket noi du lieu that tu backend BETOURIST qua folder apiService.</p>
        </div>
      </footer>
    </div>
  );
}
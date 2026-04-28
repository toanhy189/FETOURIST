"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderActions from "@/components/HeaderActions";
import ChatWidget from "@/components/chat/ChatWidget";
import TourMegaMenu from "./header/TourMegaMenu";
import Footer from "./footer/Footer";

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (isAdminRoute) {
    return <div className="min-h-screen bg-slate-100 text-slate-900">{children}</div>;
  }

  // Hàm phụ trợ để kiểm tra xem một nút có đang active hay không
  const isActiveRoute = (route) => pathname === route;

  return (
    <div className="min-h-screen text-slate-900 flex flex-col">
      <header
        className={`fixed left-0 right-0 top-0 z-50 w-full border-b border-sky-100/70 bg-white/85 backdrop-blur-xl transition-transform duration-300 ease-in-out ${isVisible ? "translate-y-0" : "-translate-y-full"
          }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-8">

          {/* LOGO */}
          <div className="flex flex-col space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-700">
              Travel Website
            </p>
            <Link href="/" className="font-display text-2xl font-bold text-sky-900">
              BETOURIST
            </Link>
          </div>

          {/* THANH MENU (PILL SHAPE) */}
          <nav className="hidden md:flex items-center rounded-full border border-slate-200/80 bg-slate-50/50 p-1 shadow-sm">

            {/* Nút: Trang Chủ */}
            <Link
              href="/"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${isActiveRoute("/")
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-sky-800"
                }`}
            >
              Trang Chủ
            </Link>

            {/* Nút: Giới thiệu */}
            <Link
              href="/gioi-thieu"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${isActiveRoute("/gioi-thieu")
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-sky-800"
                }`}
            >
              Giới thiệu
            </Link>

            {/* Nút: Mega Menu của phần Tour */}
            {/* TourMegaMenu tự định dạng style bên trong nó để đồng bộ với thanh menu này */}
            <TourMegaMenu />

            {/* Nút: Điểm đến */}
            <Link
              href="/diem-den"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${isActiveRoute("/diem-den")
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-sky-800"
                }`}
            >
              Điểm đến
            </Link>

            {/* Nút: Liên hệ */}
            <Link
              href="/lien-he"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${isActiveRoute("/lien-he")
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-sky-800"
                }`}
            >
              Liên hệ
            </Link>

          </nav>

          {/* NÚT ACTIONS BÊN PHẢI */}
          <div className="flex items-center gap-3">
            <HeaderActions />
          </div>

        </div>
      </header>

      <main className="mx-auto flex-grow w-full max-w-6xl px-4 pb-16 pt-24 md:px-8">
        {children}
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}

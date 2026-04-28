"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderActions from "@/components/HeaderActions";
import ChatWidget from "@/components/chat/ChatWidget";
import TourMegaMenu from "./header/TourMegaMenu";
import Footer from "./footer/Footer";
import { cn } from "@/utils/cn";

function HeaderLogoMark() {
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-sky-600 shadow-[0_12px_28px_-18px_rgba(2,132,199,0.85)] ring-2 ring-sky-100">
      <svg viewBox="0 0 42 42" aria-hidden="true" className="h-9 w-9">
        <path
          d="M35.5 7.8 5.4 19.6c-1.9.7-1.8 3.4.1 4l9.1 2.7 2.7 9.1c.6 2 3.3 2.1 4 .2L33.7 5.9c.4-1.1-.8-2.2-1.9-1.7Z"
          fill="currentColor"
          opacity="0.95"
        />
        <path
          d="m15.1 25.8 8.5-8.5"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isAccountRoute = pathname?.startsWith("/tai-khoan");
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
        className={`fixed left-0 right-0 top-0 z-50 w-full border-b border-sky-100/70 bg-white/92 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.8)] backdrop-blur-xl transition-transform duration-300 ease-in-out ${isVisible ? "translate-y-0" : "-translate-y-full"
          }`}
      >
        <div className="mx-auto flex h-[76px] w-full max-w-[1380px] items-center justify-between px-5 md:px-8">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <HeaderLogoMark />
            <span className="flex flex-col leading-none">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-sky-600">
                Travel Website
              </span>
              <span className="mt-1 text-[1.65rem] font-black uppercase tracking-tight text-sky-700">
                TRAVELPTIT
              </span>
            </span>
          </Link>

          {/* THANH MENU (PILL SHAPE) */}
          <nav className="hidden md:flex items-center rounded-full border border-slate-200/80 bg-white/75 p-1 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.75)]">

            {/* Nút: Trang Chủ */}
            <Link
              href="/"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${isActiveRoute("/")
                ? "bg-sky-600 text-white shadow-md shadow-sky-200"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-sky-800"
                }`}
            >
              Trang Chủ
            </Link>

            {/* Nút: Giới thiệu */}
            <Link
              href="/gioi-thieu"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${isActiveRoute("/gioi-thieu")
                ? "bg-sky-600 text-white shadow-md shadow-sky-200"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-sky-800"
                }`}
            >
              Giới thiệu
            </Link>

            {/* Nút: Mega Menu của phần Tour */}
            {/* TourMegaMenu tự định dạng style bên trong nó để đồng bộ với thanh menu này */}
            <TourMegaMenu />

            {/* Nút: Liên hệ */}
            <Link
              href="/lien-he"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${isActiveRoute("/lien-he")
                ? "bg-sky-600 text-white shadow-md shadow-sky-200"
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

      <main
        className={cn(
          "flex-grow w-full pb-0 pt-[76px]",
          isAccountRoute
            ? "max-w-none px-2 md:px-3 lg:px-4"
            : "max-w-none px-0 md:px-0"
        )}
      >
        {children}
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}

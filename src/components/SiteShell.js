import Link from "next/link";
import HeaderActions from "@/components/HeaderActions";

const navItems = [
  { href: "/", label: "Trang Chu" },
  { href: "/danh-muc", label: "Kham Pha Tour" },
  { href: "/tai-khoan", label: "Tai Khoan" },
];

export default function SiteShell({ children }) {
  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-sky-100/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4 md:grid-cols-[auto,1fr,auto] md:items-center md:px-8">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-700">
              Travel Website
            </p>
            <Link href="/" className="font-display text-2xl text-sky-900">
              BETOURIST
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200/80 px-3 py-2 transition hover:border-sky-300 hover:text-sky-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <HeaderActions />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 md:px-8">
        {children}
      </main>

      <footer className="border-t border-sky-100 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 md:px-8">
          <p className="font-display text-lg text-slate-700">BETOURIST Frontend Demo</p>
          <p>Giao dien Next.js co ket noi du lieu that tu backend BETOURIST qua folder apiService.</p>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";

function FooterLogoMark() {
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sky-300">
      <svg viewBox="0 0 42 42" aria-hidden="true" className="h-11 w-11">
        <path
          d="M35.5 7.8 5.4 19.6c-1.9.7-1.8 3.4.1 4l9.1 2.7 2.7 9.1c.6 2 3.3 2.1 4 .2L33.7 5.9c.4-1.1-.8-2.2-1.9-1.7Z"
          fill="currentColor"
        />
        <path d="m15.1 25.8 8.5-8.5" stroke="#06345f" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="relative z-10 w-full overflow-hidden bg-[linear-gradient(135deg,#052b52_0%,#073b70_48%,#021a34_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
        <div className="absolute -left-20 bottom-0 h-28 w-[420px] rounded-[50%] border border-sky-300/20" />
        <div className="absolute right-10 top-2 h-20 w-[520px] rounded-[50%] border border-sky-300/20" />
      </div>

      <div className="relative mx-auto flex min-h-[112px] w-full max-w-[1360px] items-center justify-between gap-6 px-6 py-6 md:px-10">
        <Link href="/" className="flex items-center gap-3 text-2xl font-black tracking-tight text-white">
          <FooterLogoMark />
          TravelPTIT
        </Link>

        <p className="text-center text-sm text-sky-100">
          © 2026 TravelPTIT. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

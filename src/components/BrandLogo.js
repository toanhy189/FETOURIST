"use client";

import Link from "next/link";

export function BrandMark({ className = "h-12 w-12", compact = false }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_10px_24px_-16px_rgba(15,23,42,0.6)] ring-1 ring-emerald-100 ${className}`}
    >
      <span className="absolute inset-0 bg-[conic-gradient(from_25deg,#f97316_0_22%,#facc15_22%_39%,#ffffff_39%_46%,#22c55e_46%_76%,#0f766e_76%_100%)]" />
      <span className="absolute bottom-0 left-0 h-[44%] w-[72%] rounded-tr-full bg-emerald-700" />
      <span className="absolute bottom-[13%] left-[16%] h-[33%] w-[70%] rotate-[-12deg] rounded-t-full bg-emerald-100" />
      <span className="absolute bottom-[19%] left-[23%] h-[27%] w-[28%] rotate-[-28deg] rounded-tl-full bg-white" />
      <span className="absolute bottom-[17%] right-[18%] h-[34%] w-[24%] rotate-[28deg] rounded-tr-full bg-white" />
      <span className="absolute left-[13%] top-[13%] h-[17%] w-[17%] rounded-full bg-white" />
      <span className="absolute right-[13%] top-[14%] h-[18%] w-[18%] rounded-full bg-white/90" />
      {!compact ? (
        <span className="absolute bottom-[18%] left-1/2 -translate-x-1/2 text-[0.48rem] font-black tracking-[0.08em] text-emerald-800">
          PT
        </span>
      ) : null}
    </span>
  );
}

export default function BrandLogo({ href = "/", markClassName, textClassName, compact = false }) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <BrandMark className={markClassName} compact={compact} />
      <span
        className={`font-black uppercase leading-none tracking-[0.01em] text-emerald-950 ${textClassName || "text-3xl"}`}
      >
        TRAVELPTIT
      </span>
    </Link>
  );
}

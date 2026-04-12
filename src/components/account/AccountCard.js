"use client";

export default function AccountCard({ title, description, children, action }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-white px-6 py-5 md:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      </div>

      <div className="px-6 py-6 md:px-7">{children}</div>
    </section>
  );
}
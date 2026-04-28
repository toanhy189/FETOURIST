import Link from "next/link";

const featureCards = [
  {
    title: "Tour đa dạng",
    text: "Hàng ngàn hành trình hấp dẫn",
    color: "bg-blue-600",
  },
  {
    title: "Dịch vụ tận tâm",
    text: "Đồng hành cùng bạn 24/7",
    color: "bg-orange-500",
  },
  {
    title: "An toàn & uy tín",
    text: "Cam kết chất lượng hàng đầu",
    color: "bg-emerald-500",
  },
];

export default function GioiThieuPage() {
  return (
    <div className="travel-page-shell min-h-screen">
      <section className="relative z-10 h-[210px] overflow-hidden md:h-[250px]">
        <img
          src="/images/bia1.jpg"
          alt="Banner giới thiệu"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/42" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="text-5xl font-black tracking-tight md:text-6xl">Giới thiệu</h1>
          <nav className="mt-5 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.18em]">
            <Link href="/" className="text-white/90 transition hover:text-white">Trang chủ</Link>
            <span className="text-orange-400">/</span>
            <span className="text-white">Giới thiệu</span>
          </nav>
        </div>
      </section>

      <section className="travel-content pb-10 pt-10 md:pt-12">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <div className="relative">
            <div className="overflow-hidden rounded-[1.5rem] border-[8px] border-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.9)]">
              <img
                src="/images/unnamed.jpg"
                alt="Cầu Vàng Đà Nẵng"
                className="h-[245px] w-full object-cover md:h-[285px]"
              />
            </div>
            <div className="absolute right-4 top-4 flex h-24 w-24 flex-col items-center justify-center rounded-full border-[6px] border-white bg-orange-500 text-center text-white shadow-xl md:-right-3 md:top-3 md:h-28 md:w-28">
              <span className="text-3xl font-black leading-none md:text-4xl">5+</span>
              <span className="mt-1 text-[10px] font-black uppercase leading-tight">Năm kinh nghiệm</span>
            </div>
          </div>

          <div>
            <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-emerald-700">
              Về chúng tôi
            </span>
            <h2 className="mt-4 max-w-2xl text-[2.25rem] font-black leading-tight tracking-tight text-slate-900 md:text-[2.7rem]">
              Kinh Nghiệm Và Công Ty Du Lịch Chuyên Nghiệp Ở Việt Nam
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Chúng tôi chuyên tạo ra những trải nghiệm thành phố khó quên cho du khách muốn khám phá trái tim và tâm hồn của cảnh quan đô thị.
            </p>
            <Link
              href="/danh-muc"
              className="mt-6 inline-flex rounded-full bg-sky-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-sky-700"
            >
              Khám Phá Tours →
            </Link>
          </div>
        </div>

        <div className="travel-soft-panel mt-10 grid items-center gap-10 rounded-[1.5rem] p-7 md:p-10 lg:grid-cols-[0.88fr_1fr]">
          <div>
            <h2 className="text-[2rem] font-black leading-tight tracking-tight text-slate-900 md:text-[2.35rem]">
              Du Lịch Với Sự Tự Tin Là Lý Do Hàng Đầu Để Chọn Công Ty Chúng Tôi
            </h2>
            <p className="mt-4 border-l-4 border-orange-500 pl-4 text-sm leading-6 text-slate-600">
              Chúng tôi hợp tác chặt chẽ với khách hàng để hiểu rõ những thách thức và mục tiêu.
            </p>

            <div className="mt-7 flex flex-wrap gap-8">
              <div>
                <div className="text-3xl font-black text-slate-900">100+</div>
                <div className="mt-1 text-[11px] font-black uppercase tracking-wider text-slate-400">Điểm đến phổ biến</div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">1m+</div>
                <div className="mt-1 text-[11px] font-black uppercase tracking-wider text-slate-400">Khách hàng hài lòng</div>
              </div>
            </div>

            <Link
              href="/danh-muc"
              className="mt-7 inline-flex rounded-full bg-white px-7 py-3 text-sm font-black text-slate-900 shadow-[0_18px_34px_-26px_rgba(15,23,42,0.8)] ring-1 ring-slate-200 transition hover:text-sky-700"
            >
              Khám Phá Các Tour ↗
            </Link>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border-[8px] border-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.9)]">
            <img
              src="/images/photo-1469854523086-cc02fe5d8800.jpg"
              alt="Xe du lịch trên cung đường"
              className="h-[270px] w-full object-cover md:h-[315px]"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-[1.7rem] font-black tracking-tight text-slate-900 md:text-[2rem]">
            Cùng Chúng Tôi Tạo Ra Những Trải Nghiệm Tuyệt Vời
          </h2>
          <div className="mx-auto mt-3 h-1 w-36 rounded-full bg-orange-500" />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {featureCards.map((card) => (
            <div key={card.title} className="travel-soft-panel rounded-2xl p-5">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${card.color} text-white`}>
                <span className="h-5 w-5 rounded-full border-2 border-current" />
              </div>
              <h3 className="text-lg font-black text-slate-900">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{card.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

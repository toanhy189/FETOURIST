"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Component hỗ trợ hiệu ứng nổi lên
const Reveal = ({ children, delay = 0, x = 0, y = 50 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: y, x: x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default function GioiThieuPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      
      {/* --- SECTION 1: HERO BANNER --- */}
      <section className="relative h-[400px] w-full overflow-hidden flex items-center justify-center">
        <img
          src="/images/bia1.jpg" 
          alt="Banner giới thiệu"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/40"></div>

        <Reveal y={30}>
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
              Giới thiệu
            </h1>
            <nav className="flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest">
              <Link href="/" className="hover:text-orange-400 transition-colors">Trang chủ</Link>
              <span className="text-orange-400">/</span>
              <span className="text-white/80">Giới thiệu</span>
            </nav>
          </div>
        </Reveal>
      </section>

      {/* --- SECTION 2: KINH NGHIỆM & CÔNG TY --- */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Hình ảnh bên trái */}
          <div className="w-full lg:w-1/2 relative">
            <Reveal x={-50} y={0}>
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white">
                <img
                  src="/images/unnamed.jpg"
                  alt="Experience"
                  className="w-full h-[500px] object-cover"
                />
              </div>
              <div className="absolute -top-6 -right-6 bg-orange-500 text-white w-36 h-36 rounded-full flex flex-col items-center justify-center border-[8px] border-white shadow-xl rotate-12">
                <span className="text-4xl font-black">5+</span>
                <span className="text-[10px] font-bold uppercase text-center leading-tight">
                  Năm kinh <br /> nghiệm
                </span>
              </div>
            </Reveal>
          </div>

          {/* Nội dung bên phải */}
          <div className="w-full lg:w-1/2 space-y-8">
            <Reveal delay={0.2}>
              <div className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                Về chúng tôi
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-[1.1] mt-4">
                Kinh Nghiệm Và Công Ty Du Lịch Chuyên Nghiệp Ở Việt Nam
              </h2>
            </Reveal>

            <Reveal delay={0.3}>
              <p className="text-slate-500 leading-relaxed text-lg">
                Chúng tôi chuyên tạo ra những trải nghiệm thành phố khó quên cho du khách muốn khám phá trái tim và tâm hồn của cảnh quan đô thị.
              </p>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["Trải nghiệm tuyệt vời", "Đội ngũ Chuyên nghiệp", "Du lịch Chi phí Thấp", "Hỗ trợ Trực tuyến 24/7"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.5}>
              {/* CẬP NHẬT: Hover đổi sang màu cam */}
              <Link 
                href="/danh-muc"
                className="inline-block px-10 py-4 bg-white text-white rounded-full font-bold shadow-lg shadow-green-200 hover:bg-orange-500 hover:shadow-orange-200 hover:-translate-y-1 transition-all duration-300"
              >
                Khám Phá Tours
                <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: SỰ TỰ TIN LÝ DO --- */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            {/* Nội dung bên trái */}
            <div className="w-full lg:w-1/2 space-y-8 order-2 lg:order-1">
              <Reveal delay={0.2} x={-30} y={0}>
                <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-[1.1]">
                  Du Lịch Với Sự Tự Tin Lý Do Hàng Đầu Để Chọn Công Ty Của Chúng Tôi
                </h2>
                <div className="pl-6 border-l-4 border-orange-500 mt-6">
                  <p className="text-slate-600 text-lg leading-relaxed italic">
                    Chúng tôi hợp tác chặt chẽ với khách hàng để hiểu rõ những thách thức và mục tiêu.
                  </p>
                </div>

                <div className="flex items-center gap-16 py-8">
                  <div>
                    <div className="text-5xl font-black text-slate-900">0k+</div>
                    <div className="text-xs font-bold uppercase text-slate-400 tracking-widest mt-2">Điểm đến phổ biến</div>
                  </div>
                  <div>
                    <div className="text-5xl font-black text-slate-900">4m+</div>
                    <div className="text-xs font-bold uppercase text-slate-400 tracking-widest mt-2">Khách hàng hài lòng</div>
                  </div>
                </div>

                {/* CẬP NHẬT: Hover đổi sang màu cam */}
                <Link 
                  href="/diem-den"
                  className="inline-block px-10 py-4 bg-white text-white rounded-full font-bold shadow-lg shadow-green-200 hover:bg-orange-500 hover:shadow-orange-200 hover:-translate-y-1 transition-all duration-300"
                >
                  Khám Phá Các Điểm Đến ↗
                </Link>
              </Reveal>
            </div>

            {/* Hình ảnh bên phải */}
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <Reveal delay={0.4} x={50} y={0}>
                <div className="rounded-[4rem] overflow-hidden shadow-2xl">
                  <img
                    src="/images/photo-1469854523086-cc02fe5d8800.jpg"
                    alt="Confident Travel"
                    className="w-full h-[550px] object-cover"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER TITLE --- */}
      <section className="py-24 bg-white text-center">
        <Reveal>
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-black text-slate-400 leading-tight">
              Gặp Gỡ Những Hướng Dẫn Viên Du Lịch Giàu Kinh Nghiệm Của Chúng Tôi
            </h2>
            <div className="mt-6 w-24 h-1.5 bg-orange-500 mx-auto rounded-full"></div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
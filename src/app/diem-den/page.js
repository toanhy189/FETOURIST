import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";

export const dynamic = "force-dynamic";

export default async function DiemDenPage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = params?.category || ""; // Mặc định trống

  // Lấy dữ liệu từ DB
  const [categoryResult, tourResult] = await Promise.all([
    getCategories({ limit: 50 }),
    getTours({ 
      category: activeCategory, // Lọc tour theo miền đang chọn
      limit: 12 
    }),
  ]);

  const categories = categoryResult?.categories || [];
  const tours = tourResult?.tours || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <section className="bg-white py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
            Khám Phá Các Địa Điểm Phổ Biến
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Website <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">100+</span> trải nghiệm phổ biến nhất mà bạn sẽ nhớ
          </p>

          {/* Lấy dlieu từ db*/}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/diem-den"
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeCategory === ""
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Tất cả
            </Link>
            
            {categories.map((cat) => {
              // Hàm bỏ chữ TOur
              const displayName = cat.name.replace(/Tour\s+/i, "");

              return (
                <Link
                  key={cat.id}
                  href={`/diem-den?category=${cat.slug}`}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                    activeCategory === cat.slug
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {displayName}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* TOURS LIST SECTION */}
      <section className="container mx-auto px-4 py-12">
        {tours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-300">
             <div className="text-5xl mb-4">🏝️</div>
             <p className="text-slate-500 font-bold">Chưa có tour nào cho khu vực này.</p>
          </div>
        )}
      </section>
    </div>
  );
}
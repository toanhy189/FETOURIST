import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";
import FilterSidebar from "@/components/tour/FilterSidebar";

export const dynamic = "force-dynamic";

async function loadCategoryPageData(searchParams) {
  const params = await searchParams;

  // 1. LẤY THÊM THAM SỐ departure TỪ URL
  const category = params?.category || "";
  const search = params?.search || "";
  const startDate = params?.startDate || "";
  const duration = params?.duration || "";
  const priceRange = params?.priceRange || "";
  const departure = params?.departure || ""; // <-- THÊM DÒNG NÀY

  const [categoryResult, tourResult] = await Promise.allSettled([
    getCategories({ limit: 50 }),
    getTours({
      limit: 12,
      search: search,
      category: category,
      startDate: startDate,
      duration: duration,
      priceRange: priceRange,
      departure: departure, // <-- PHẢI TRUYỀN VÀO ĐÂY ĐỂ GỬI LÊN SERVER
    }),
  ]);

  return {
    categories: categoryResult.status === "fulfilled" ? categoryResult.value.categories : [],
    tours: tourResult.status === "fulfilled" ? tourResult.value.tours : [],
    activeCategory: category,
    activeSearch: search,
    activeDeparture: departure, // Thêm để có thể hiển thị nếu cần
    errors: [categoryResult, tourResult]
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason?.message || "Lỗi tải dữ liệu"),
  };
}

export default async function CategoryPage({ searchParams }) {
  const { categories, tours, activeCategory, activeSearch, activeDeparture, errors } =
    await loadCategoryPageData(searchParams);

  const currentCategoryName = categories.find(c => c.slug === activeCategory)?.name || "Tất cả Tour";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="container mx-auto px-4 pt-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          
          {/* BÊN TRÁI: Cột Sidebar */}
          <aside className="w-full lg:w-1/4">
            <div className="sticky top-24 space-y-6">
              {/* BỘ LỌC CHI TIẾT */}
              <FilterSidebar categories={categories} />
            </div>
          </aside>

          {/* BÊN PHẢI: Danh sách kết quả */}
          <main className="flex-1">
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {activeSearch 
                    ? `Kết quả cho: "${activeSearch}"` 
                    : activeDeparture 
                      ? `Tour khởi hành từ: ${activeDeparture}` 
                      : currentCategoryName
                  }
                </h1>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                  <p className="text-sm text-slate-500">
                    Tìm thấy <span className="font-bold text-slate-900">{tours.length}</span> tour phù hợp
                  </p>
                </div>
              </div>
            </div>

            {/* Hiển thị lỗi */}
            {errors.length > 0 && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                {errors.join(", ")}
              </div>
            )}

            {/* Danh sách Tour */}
            {tours.length > 0 ? (
              <div className="flex flex-col gap-6">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white py-24 text-center">
                <div className="mb-4 text-6xl">🔍</div>
                <h3 className="text-xl font-bold text-slate-800">Không tìm thấy tour nào</h3>
                <p className="text-slate-500 mt-2">Vui lòng thử chọn địa điểm hoặc ngày khởi hành khác.</p>
                <Link 
                  href="/danh-muc" 
                  className="mt-6 rounded-lg bg-sky-600 px-6 py-2 text-sm font-bold text-white hover:bg-sky-700 transition-colors"
                >
                  Xóa tất cả bộ lọc
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
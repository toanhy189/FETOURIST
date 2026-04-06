import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";
import FilterSidebar from "@/components/tour/FilterSidebar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Danh Mục Tour | BETOURIST",
  description: "Trang danh mục tour du lịch với bộ lọc chuyên nghiệp.",
};

// Hàm xử lý logic lấy dữ liệu (Giữ nguyên logic của bạn)
async function loadCategoryPageData(searchParams) {
  const params = await searchParams;
  const selectedCategory = params?.category?.trim() || "";
  const searchValue = params?.search?.trim() || "";

  const [categoryResult, tourResult] = await Promise.allSettled([
    getCategories({ limit: 20 }),
    getTours({
      limit: 12,
      search: searchValue,
      category: selectedCategory,
    }),
  ]);

  return {
    categories: categoryResult.status === "fulfilled" ? categoryResult.value.categories : [],
    tours: tourResult.status === "fulfilled" ? tourResult.value.tours : [],
    errors: [categoryResult, tourResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message || "Không thể tải dữ liệu."),
    selectedCategory,
    searchValue,
  };
}

export default async function CategoryPage({ searchParams }) {
  const { categories, tours, errors, selectedCategory, searchValue } =
    await loadCategoryPageData(searchParams);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* 1. Header trang danh mục */}
      <div className="bg-white border-b border-slate-200 mb-8">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-slate-900">Tất cả Tour du lịch</h1>
          <p className="text-slate-500 mt-2 text-sm">Tìm thấy {tours.length} tour phù hợp với yêu cầu của bạn</p>
        </div>
      </div>

      {/* 2. Bố cục chính: SIDEBAR + MAIN CONTENT */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
          
          {/* CỘT TRÁI: BỘ LỌC (Sidebar) */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <FilterSidebar />
            </div>
          </aside>

          {/* CỘT PHẢI: DANH SÁCH TOUR DẠNG LIST */}
          <main className="space-y-6">
            {/* Thanh công cụ nhỏ phía trên danh sách */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-sm font-medium text-slate-600">
                Ưu tiên hiển thị: <span className="text-sky-600 font-bold cursor-pointer">Tour mới nhất</span>
              </span>
              <div className="flex gap-4">
                 <Link href="/" className="text-xs font-bold text-slate-400 hover:text-sky-600 underline">Về trang chủ</Link>
              </div>
            </div>

            {/* Danh sách các TourCard */}
            {tours.length > 0 ? (
              <div className="flex flex-col gap-6"> 
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-20 text-center text-slate-400">
                <p className="text-lg">😢 Không tìm thấy tour nào phù hợp với bộ lọc.</p>
                <Link href="/danh-muc" className="mt-4 inline-block text-sky-600 font-bold">Xóa tất cả bộ lọc</Link>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";
import FilterSidebar from "@/components/tour/FilterSidebar";

export const dynamic = "force-dynamic";

// Hàm xử lý lấy dữ liệu dựa trên các tham số từ URL
async function loadCategoryPageData(searchParams) {
  const params = await searchParams; // Next.js 15 yêu cầu await searchParams

  // 1. Trích xuất các bộ lọc từ URL
  const category = params?.category || "";
  const search = params?.search || "";
  const startDate = params?.startDate || "";
  const duration = params?.duration || "";
  const priceRange = params?.priceRange || "";

  // 2. Gọi đồng thời API lấy danh mục và danh sách Tour có kèm bộ lọc
  const [categoryResult, tourResult] = await Promise.allSettled([
    getCategories({ limit: 50 }),
    getTours({
      limit: 12,
      search: search,
      category: category,
      startDate: startDate,    // Truyền ngày bắt đầu
      duration: duration,      // Truyền khoảng thời gian (VD: 1-2)
      priceRange: priceRange,  // Truyền khoảng giá (VD: 0-3000000)
    }),
  ]);

  return {
    categories: categoryResult.status === "fulfilled" ? categoryResult.value.categories : [],
    tours: tourResult.status === "fulfilled" ? tourResult.value.tours : [],
    activeCategory: category,
    activeSearch: search,
    errors: [categoryResult, tourResult]
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason?.message || "Lỗi tải dữ liệu"),
  };
}

export default async function CategoryPage({ searchParams }) {
  const { categories, tours, activeCategory, activeSearch, errors } =
    await loadCategoryPageData(searchParams);

  // Tìm tên danh mục hiện tại để hiển thị tiêu đề
  const currentCategoryName = categories.find(c => c.slug === activeCategory)?.name || "Tất cả Tour";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="container mx-auto px-4 pt-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          
          {/* BÊN TRÁI: Cột bộ lọc (Sidebar) */}
          <aside className="w-full lg:w-1/4">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* BÊN PHẢI: Danh sách kết quả */}
          <main className="flex-1">
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {activeSearch ? `Kết quả cho: "${activeSearch}"` : currentCategoryName}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Tìm thấy <span className="font-bold text-slate-800">{tours.length}</span> tour phù hợp
                </p>
              </div>
            </div>

            {/* Hiển thị lỗi nếu có */}
            {errors.length > 0 && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {errors.join(", ")}
              </div>
            )}

            {/* Hiển thị danh sách Tour dạng List */}
            {tours.length > 0 ? (
              <div className="flex flex-col gap-6">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 text-center">
                <span className="text-5xl">🔍</span>
                <h3 className="mt-4 text-lg font-bold text-slate-800">Không tìm thấy tour nào</h3>
                <p className="text-slate-500 text-sm">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
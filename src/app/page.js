import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";
import SearchForm from "@/components/searchForm/searchForm";

export const dynamic = "force-dynamic";

// --- HÀM HELPER ---
const categoryFallbackCover = "linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(3, 105, 161, 0.82), rgba(16, 185, 129, 0.7))";
function getCategoryCoverStyle(imageUrl) {
  if (!imageUrl) return { background: categoryFallbackCover };
  return { backgroundImage: `url("${imageUrl}")`, backgroundPosition: "center", backgroundSize: "cover" };
}

// --- HÀM LẤY DỮ LIỆU (BẠN ĐANG THIẾU CÁI NÀY NÊN BÁO LỖI) ---
async function loadHomePageData() {
  const [categoryResult, tourResult] = await Promise.allSettled([
    getCategories({ limit: 50 }),
    getTours({ limit: 6, sortBy: "createdAt", sortOrder: "desc" }),
  ]);
  return {
    categories: categoryResult.status === "fulfilled" ? categoryResult.value.categories : [],
    featuredTours: tourResult.status === "fulfilled" ? tourResult.value.tours : [],
    errors: [categoryResult, tourResult].filter(r => r.status === "rejected").map(r => r.reason?.message || "Lỗi tải dữ liệu"),
  };
}

export default async function Home() {
  const { categories, featuredTours, errors } = await loadHomePageData();
  const parentCategories = categories.filter((category) => !category.parentCategory);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Giữ nguyên các Section cũ của bạn ở đây (Banner, SearchForm, Categories...) */}
      <div className="relative left-1/2 h-[240px] w-screen -translate-x-1/2 overflow-hidden md:h-[300px] lg:h-[340px]">
        <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: 'url("/sl_260302_top-banner1.webp")' }} />
      </div>
      <SearchForm />
      
      {/* Phần hiển thị Tour nổi bật (Dạng lưới như cũ) */}
      <section className="container mx-auto mt-14 space-y-6 px-4">
        <h2 className="font-display text-2xl font-bold uppercase text-slate-800">Tour nổi bật</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>
    </div>
  );
}
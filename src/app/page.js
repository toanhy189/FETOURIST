import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";
import SearchForm from "@/components/searchForm/searchForm";

export const dynamic = "force-dynamic";

// --- CÁC HÀM HỖ TRỢ GIAO DIỆN ---
const categoryFallbackCover =
  "linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(3, 105, 161, 0.82), rgba(16, 185, 129, 0.7))";

function getCategoryCoverStyle(imageUrl) {
  if (!imageUrl) {
    return { background: categoryFallbackCover };
  }

  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  };
}

// --- HÀM LẤY DỮ LIỆU TỪ SERVER ---
async function loadHomePageData() {
  const [categoryResult, tourResult] = await Promise.allSettled([
    getCategories({ limit: 50 }),
    getTours({ limit: 6, sortBy: "createdAt", sortOrder: "desc" }),
  ]);

  return {
    categories: categoryResult.status === "fulfilled" ? categoryResult.value.categories : [],
    featuredTours: tourResult.status === "fulfilled" ? tourResult.value.tours : [],
    errors: [categoryResult, tourResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message || "Không thể tải dữ liệu từ server."),
  };
}

// --- COMPONENT TRANG CHỦ ---
export default async function Home() {
  const { categories, featuredTours, errors } = await loadHomePageData();
  const parentCategories = categories.filter((category) => !category.parentCategory);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 1. Phần Banner - Giữ nguyên */}
      <div className="relative left-1/2 h-[240px] w-screen -translate-x-1/2 overflow-hidden md:h-[300px] lg:h-[340px]">
        <div
          aria-label="Banner du lịch BETOURIST"
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: 'url("/sl_260302_top-banner1.webp")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      </div>

      {/* Thanh tìm kiếm */}
      <SearchForm />

      <div className="mt-14 space-y-20">
        {/* Hiển thị lỗi nếu có */}
        {errors.length > 0 && (
          <section className="container mx-auto px-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-sm">
              {errors.map((errorMessage, index) => (
                <p key={index}>⚠️ {errorMessage}</p>
              ))}
            </div>
          </section>
        )}

        {/* 2. Section: Danh mục nổi bật - Dạng Grid */}
        <section className="container mx-auto space-y-8 px-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="font-display text-2xl font-bold uppercase text-slate-800 tracking-tight">
              Khám phá danh mục nổi bật
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parentCategories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/danh-muc?category=${category.slug}`}
                className="group relative block h-64 w-full overflow-hidden rounded-2xl bg-slate-200 shadow-md md:h-80 transition-all hover:shadow-xl"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                  style={getCategoryCoverStyle(category.imageUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                  <h3 className="text-xl font-bold uppercase tracking-widest text-white drop-shadow-2xl">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-xs font-medium text-slate-200 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 uppercase tracking-tighter">
                    Xem ngay các tour du lịch →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Section: Banner Quảng cáo - Giữ nguyên */}
        <section className="container mx-auto px-4">
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[3rem] border border-slate-100 bg-white px-6 py-20 text-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50/50 to-teal-100/30" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Khám phá muôn nơi cùng{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  TRAVELPTIT
                </span>
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-slate-600 md:text-lg">
                <span>Hệ thống có</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-6 py-2 font-black text-emerald-800 shadow-sm">
                  24,080+
                </span>
                <span>điểm đến đang chờ bạn trải nghiệm</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Section: Tour nổi bật - Đã chuyển sang dạng LIST (Danh sách) */}
        <section className="container mx-auto space-y-8 px-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="font-display text-2xl font-bold uppercase text-slate-800 tracking-tight">
              Tour nổi bật nhất
            </h2>
            <Link href="/danh-muc" className="text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors">
              Xem tất cả tour →
            </Link>
          </div>

          {featuredTours.length > 0 ? (
            /* Dùng flex-col kết hợp max-w-5xl để danh sách tour tập trung ở giữa màn hình */
            <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full"> 
              {featuredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400 font-medium">
              Hiện tại chưa có tour nổi bật nào được xuất bản.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
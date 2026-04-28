import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getFeaturedTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";
import SearchForm from "@/components/searchForm/searchForm";

export const dynamic = "force-dynamic";

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

async function loadHomePageData() {
  const [categoryResult, topRatedResult, bestSellerResult] = await Promise.allSettled([
    getCategories({ limit: 50 }),
    getFeaturedTours({ limit: 6, criteria: "rating" }),
    getFeaturedTours({ limit: 6, criteria: "booking" }),
  ]);

  return {
    categories: categoryResult.status === "fulfilled" ? categoryResult.value.categories : [],
    topRatedTours: topRatedResult.status === "fulfilled" ? topRatedResult.value.tours : [],
    bestSellerTours: bestSellerResult.status === "fulfilled" ? bestSellerResult.value.tours : [],
    errors: [categoryResult, topRatedResult, bestSellerResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message || "Không thể tải dữ liệu từ server."),
  };
}

export default async function Home() {
  const { categories, topRatedTours, bestSellerTours, errors } = await loadHomePageData();
  const parentCategories = categories.filter((category) => !category.parentCategory);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="relative left-1/2 h-[320px] w-screen -translate-x-1/2 overflow-hidden md:h-[400px] lg:h-[460px]">
        <div
          aria-label="Banner du lịch BETOURIST"
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: 'url("/sl_260302_top-banner1.webp")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center px-4 md:bottom-8">
          <SearchForm />
        </div>
      </div>


      <div className="mt-14 space-y-12">
        {errors.length > 0 ? (
          <section className="container mx-auto px-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
              {errors.map((errorMessage, index) => (
                <p key={index}>{errorMessage}</p>
              ))}
            </div>
          </section>
        ) : null}

        <section className="container mx-auto mt-8 space-y-6 px-4">
          <h2 className="text-center font-display text-2xl font-bold uppercase text-slate-800 md:text-left">
            Khám phá danh mục nổi bật
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parentCategories.map((category) => (
              <Link
                key={category.id}
                href={`/danh-muc?category=${category.slug}`}
                className="group relative block h-64 w-full overflow-hidden rounded-2xl bg-slate-200 shadow-md md:h-80"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                  style={getCategoryCoverStyle(category.imageUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-center text-xl font-bold uppercase tracking-wide text-white drop-shadow-lg">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto space-y-6 px-4">
          <h2 className="text-center font-display text-2xl font-bold uppercase text-slate-800 md:text-left">
            Tour rating cao nhất
          </h2>

          {topRatedTours.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topRatedTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Chưa có tour để hiển thị.
            </div>
          )}
        </section>

        <section className="container mx-auto space-y-6 px-4">
          <h2 className="text-center font-display text-2xl font-bold uppercase text-slate-800 md:text-left">
            Tour bán chạy
          </h2>

          {bestSellerTours.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bestSellerTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Chưa có tour để hiển thị.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
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

export default async function Home() {
  const { categories, featuredTours, errors } = await loadHomePageData();
  const parentCategories = categories.filter((category) => !category.parentCategory);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="relative left-1/2 h-[240px] w-screen -translate-x-1/2 overflow-hidden md:h-[300px] lg:h-[340px]">
        <div
          aria-label="Banner du lịch BETOURIST"
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: 'url("/sl_260302_top-banner1.webp")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      </div>

      <SearchForm />

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

        <section className="container mx-auto my-16 px-4">
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white px-6 py-20 text-center shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50/50 to-teal-100/30" />
            <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-teal-200/40 blur-[100px]" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-200/40 blur-[100px]" />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm md:text-4xl lg:text-5xl">
                Khám phá muôn nơi cùng{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  TRAVELPTIT
                </span>
              </h2>

              <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-slate-600 md:text-base">
                <span>Website có</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-5 py-2 font-bold text-emerald-800 shadow-sm">
                  24,080+
                </span>
                <span>điểm đến phổ biến nhất mà bạn sẽ nhớ mãi</span>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto space-y-6 px-4">
          <h2 className="text-center font-display text-2xl font-bold uppercase text-slate-800 md:text-left">
            Tour nổi bật
          </h2>

          {featuredTours.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Chưa có tour published để hiển thị.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

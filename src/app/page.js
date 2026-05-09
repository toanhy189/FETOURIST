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
  const [categoryResult, featuredResult] = await Promise.allSettled([
    getCategories({ limit: 50 }),
    getFeaturedTours({ limit: 6 }),
  ]);

  return {
    categories:
      categoryResult.status === "fulfilled"
        ? categoryResult.value.categories
        : [],
    featuredTours:
      featuredResult.status === "fulfilled" ? featuredResult.value.tours : [],
    errors: [categoryResult, featuredResult]
      .filter((result) => result.status === "rejected")
      .map(
        (result) =>
          result.reason?.message || "Không thể tải dữ liệu từ server."
      ),
  };
}

export default async function Home() {
  const { categories, featuredTours, errors } = await loadHomePageData();
  const parentCategories = categories.filter((category) => !category.parentCategory);
  const featuredCategories = parentCategories.slice(0, 3);

  return (
    <div className="travel-page-shell min-h-screen pb-14">
      <section className="relative z-30 h-[390px] w-full overflow-visible md:h-[420px] lg:h-[430px]">
        <div className="absolute inset-0 overflow-hidden">
          <div
            aria-label="Banner du lịch TRAVELPTIT"
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: 'url("/sl_260302_top-banner1.webp")',
              backgroundPosition: "center 48%",
              filter: "saturate(1.08) contrast(1.04)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 36%, rgba(255,255,255,0) 72%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/35 to-transparent" />
        </div>

        <div className="absolute bottom-5 left-1/2 z-40 w-[calc(100%_-_2rem)] max-w-[1360px] -translate-x-1/2 md:bottom-6">
          <SearchForm />
        </div>
      </section>

      <div className="relative z-10 space-y-16">
        {errors.length > 0 ? (
          <section className="travel-content mt-8">
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
              {errors.map((errorMessage, index) => (
                <p key={index}>{errorMessage}</p>
              ))}
            </div>
          </section>
        ) : null}

        <section className="travel-content mt-8 space-y-6">
          <div className="flex items-center justify-center gap-5">
            <span className="hidden h-px w-28 bg-gradient-to-r from-transparent to-pink-300 md:block" />
            <h2 className="text-center font-display text-[1.7rem] font-black uppercase tracking-tight text-slate-900 md:text-[2rem]">
              Khám phá danh mục nổi bật
            </h2>
            <span className="hidden h-px w-28 bg-gradient-to-l from-transparent to-pink-300 md:block" />
          </div>

          <div className="mx-auto grid max-w-[1060px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCategories.map((category, index) => (
              <Link
                key={category.id}
                href={`/danh-muc?category=${category.slug}`}
                className="group relative block h-[250px] w-full overflow-hidden rounded-[1.25rem] border-[6px] border-white bg-slate-200 shadow-[0_20px_48px_-30px_rgba(15,23,42,0.8)]"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                  style={getCategoryCoverStyle(category.imageUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/20 to-transparent" />
                <div className="absolute left-5 top-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/70 bg-white/20 text-white shadow-lg backdrop-blur">
                  <span className="text-2xl font-black">{index + 1}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-lg">
                    {category.name}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-sm font-medium text-white/90">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="travel-content space-y-8 pb-4">
          <div className="text-center">
            <h2 className="font-serif text-[2.4rem] font-black uppercase tracking-tight text-slate-900 md:text-[3.15rem]">
              Tour nổi bật
            </h2>
            <div className="mx-auto mt-1 h-1 w-36 rounded-full bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
          </div>

          {featuredTours.length > 0 ? (
            <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
              {featuredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Chưa có tour để hiển thị.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

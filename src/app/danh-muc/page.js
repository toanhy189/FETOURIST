import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Danh Muc Tour | BETOURIST",
  description: "Trang danh muc tour du lich dang doc du lieu tu backend BETOURIST.",
};

function buildCategoryHref(searchValue, categorySlug) {
  const params = new URLSearchParams();

  if (searchValue) {
    params.set("search", searchValue);
  }

  if (categorySlug) {
    params.set("category", categorySlug);
  }

  const query = params.toString();
  return query ? `/danh-muc?${query}` : "/danh-muc";
}

async function loadCategoryPageData(searchParams) {
  const params = await searchParams;
  const selectedCategory =
    typeof params?.category === "string" && params.category.trim().length > 0
      ? params.category.trim()
      : "";
  const searchValue =
    typeof params?.search === "string" && params.search.trim().length > 0
      ? params.search.trim()
      : "";

  // Query string cua UI duoc doi thang sang params ma backend BETOURIST dang support.
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
      .map((result) => result.reason?.message || "Khong the tai du lieu."),
    selectedCategory,
    searchValue,
  };
}

export default async function CategoryPage({ searchParams }) {
  const { categories, tours, errors, selectedCategory, searchValue } =
    await loadCategoryPageData(searchParams);
  const activeCategory = categories.find((category) => category.slug === selectedCategory) || null;

  return (
    <div className="space-y-8">
      <header className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Layout 02</p>
        <h1 className="font-display text-4xl text-slate-900">Trang danh muc tour</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Bo loc tren trang nay dang goi truc tiep API `GET /api/tours` va `GET /api/categories`
          cua backend BETOURIST.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[300px,1fr]">
        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Tim kiem nhanh</h2>
            <form action="/danh-muc" className="space-y-3">
              <input
                type="text"
                name="search"
                defaultValue={searchValue}
                placeholder="Nhap diem den hoac ten tour"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
              />
              <select
                name="category"
                defaultValue={selectedCategory}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
              >
                <option value="">Tat ca danh muc</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                Ap dung tim kiem
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Danh muc tour</h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildCategoryHref(searchValue, "")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  !selectedCategory
                    ? "border-sky-300 bg-sky-100 text-sky-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-800"
                }`}
              >
                Tat ca
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={buildCategoryHref(searchValue, category.slug)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === category.slug
                      ? "border-sky-300 bg-sky-100 text-sky-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-800"
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          {errors.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Mot phan du lieu khong tai duoc tu backend. Kiem tra lai server BETOURIST.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Tim thay <strong>{tours.length}</strong> tour
              {activeCategory ? ` cho danh muc "${activeCategory.name}"` : ""}.
            </p>
            <Link
              href="/"
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
            >
              Ve trang chu
            </Link>
          </div>

          {tours.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Khong tim thay tour phu hop. Thu doi keyword hoac bo loc de tiep tuc.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

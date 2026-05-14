import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import CategoryTourResults from "@/components/tour/CategoryTourResults";
import FilterSidebar from "@/components/tour/FilterSidebar";

export const dynamic = "force-dynamic";

function pickSearchParam(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function buildCategoryTourFilter({ activeCategory, selectedCategory, hasChildCategories }) {
  if (selectedCategory) {
    return hasChildCategories
      ? { parentCategory: selectedCategory.slug }
      : { category: selectedCategory.slug };
  }

  return activeCategory ? { category: activeCategory } : {};
}

function buildPageTitle({ keyword, destination, activeCategory, activeCategoryName }) {
  if (keyword) {
    return `Kết quả tìm kiếm: "${keyword}"`;
  }

  if (destination) {
    return `Kết quả cho điểm đến: "${destination}"`;
  }

  return activeCategory ? activeCategoryName : "Tất cả chương trình tour";
}

export default async function DanhMucPage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = pickSearchParam(params?.category);

  const keywordFilter =
    pickSearchParam(params?.q) || pickSearchParam(params?.search);

  const destinationFilter = pickSearchParam(params?.destination);

  const departureLocationFilter =
    pickSearchParam(params?.departureLocation) ||
    pickSearchParam(params?.departure);

  const baseTourFilters = {
    q: keywordFilter,
    destination: destinationFilter,
    departureLocation: departureLocationFilter,
    startDate: pickSearchParam(params?.startDate),
    durationDays: pickSearchParam(params?.durationDays),
    minPrice: pickSearchParam(params?.minPrice),
    maxPrice: pickSearchParam(params?.maxPrice),
    limit: 6,
  };

  const categoryResult = await getCategories({ limit: 50 });
  const categories = categoryResult?.categories || [];
  const selectedCategory = categories.find(
    (category) => category.slug === activeCategory
  );
  const hasChildCategories = categories.some(
    (category) => category.parentCategory?.slug === activeCategory
  );

  const tourFilters = {
    ...baseTourFilters,
    ...buildCategoryTourFilter({
      activeCategory,
      selectedCategory,
      hasChildCategories,
    }),
  };

  const tourResult = await getTours(tourFilters);
  const tours = tourResult?.tours || [];
  const totalTours = Number(tourResult?.pagination?.totalItems ?? tours.length);
  const tourPagination = tourResult?.pagination ?? null;
  const activeCategoryName =
    categories.find((category) => category.slug === activeCategory)?.name ||
    activeCategory;
  const keyword = tourFilters.q;
  const destination = tourFilters.destination;
  const departureLocation = tourFilters.departureLocation;

  return (
    <div className="travel-page-shell min-h-screen">
      <div className="travel-content pb-16 pt-8 lg:pb-20 lg:pt-10">
        <div className="flex flex-col items-start gap-7 lg:flex-row">
          <aside className="w-full shrink-0 lg:sticky lg:top-[92px] lg:w-[310px]">
            <FilterSidebar categories={categories} />
          </aside>

          <main className="w-full flex-1">
            <div className="travel-soft-panel mb-6 rounded-2xl p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-[2.35rem]">
                    {buildPageTitle({
                      keyword,
                      destination,
                      activeCategory,
                      activeCategoryName,
                    })}
                  </h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Tìm thấy{" "}
                    <span className="font-black text-sky-600">{totalTours}</span>{" "}
                    tour phù hợp với yêu cầu của bạn
                  </p>
                </div>

                {departureLocation ? (
                  <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700">
                    Khởi hành từ: {departureLocation}
                  </div>
                ) : null}
              </div>
            </div>

            <CategoryTourResults
              initialTours={tours}
              totalTours={totalTours}
              tourFilters={tourFilters}
              initialPagination={tourPagination}
              pageSize={Number(baseTourFilters.limit) || 6}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import CategoryTourResults from "@/components/tour/CategoryTourResults";
import FilterSidebar from "@/components/tour/FilterSidebar";

export const dynamic = "force-dynamic";

function pickSearchParam(value) {
  // Next searchParams co the la string hoac array; page chi dung gia tri dau tien.
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function buildCategoryTourFilter({ activeCategory, selectedCategory, hasChildCategories }) {
  // Category cha lay toan bo cay con; category la la thi loc dung category do.
  if (selectedCategory) {
    return hasChildCategories
      ? { parentCategory: selectedCategory.slug }
      : { category: selectedCategory.slug };
  }

  return activeCategory ? { category: activeCategory } : {};
}

function buildPageTitle({ destination, activeCategory, activeCategoryName }) {
  if (destination) {
    return `Kết quả cho điểm đến: "${destination}"`;
  }

  return activeCategory ? activeCategoryName : "Tất cả chương trình tour";
}

export default async function DanhMucPage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = pickSearchParam(params?.category);
  const destinationFilter =
    pickSearchParam(params?.destination) || pickSearchParam(params?.search);
  const departureLocationFilter =
    pickSearchParam(params?.departureLocation) ||
    pickSearchParam(params?.departure);

  const baseTourFilters = {
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
  const destination = tourFilters.destination;
  const departureLocation = tourFilters.departureLocation;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[300px]">
            <FilterSidebar categories={categories} />
          </aside>

          <main className="w-full flex-1">
            <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-800">
                    {buildPageTitle({
                      destination,
                      activeCategory,
                      activeCategoryName,
                    })}
                  </h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                    Tìm thấy{" "}
                    <span className="font-bold text-sky-600">{totalTours}</span>{" "}
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

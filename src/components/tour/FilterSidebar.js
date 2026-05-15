"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTourFilterOptions } from "@/apiService/tours";
import DatePickerField from "@/components/ui/DatePickerField";
import SearchableSelect from "@/components/ui/SearchableSelect";

const FALLBACK_DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const PRICE_RANGE_OPTIONS = [
  { label: "Tất cả mức giá", value: "", minPrice: "", maxPrice: "" },
  { label: "Dưới 3 triệu", value: "0-3000000", minPrice: "0", maxPrice: "3000000" },
  { label: "3 - 5 triệu", value: "3000000-5000000", minPrice: "3000000", maxPrice: "5000000" },
  { label: "5 - 10 triệu", value: "5000000-10000000", minPrice: "5000000", maxPrice: "10000000" },
  { label: "Trên 10 triệu", value: "10000000+", minPrice: "10000000", maxPrice: "" },
];

function getDurationDaysValue(searchParams) {
  const durationDays = searchParams.get("durationDays");
  if (durationDays) {
    return durationDays;
  }

  const legacyDuration = searchParams.get("duration") || "";
  const legacyMatch = legacyDuration.match(/^(\d+)-(\d+)$/);

  if (legacyMatch && legacyMatch[1] === legacyMatch[2]) {
    return legacyMatch[1];
  }

  return "";
}

function getPriceRangeValue(searchParams) {
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const matchedOption = PRICE_RANGE_OPTIONS.find(
    (option) => option.minPrice === minPrice && option.maxPrice === maxPrice
  );

  if (matchedOption) {
    return matchedOption.value;
  }

  const legacyPriceRange = searchParams.get("priceRange") || "";
  return PRICE_RANGE_OPTIONS.some((option) => option.value === legacyPriceRange)
    ? legacyPriceRange
    : "";
}

function createFiltersFromSearchParams(searchParams) {
  return {
    destination:
      searchParams.get("q") ||
      searchParams.get("search") ||
      searchParams.get("destination") ||
      "",
    startDate: searchParams.get("startDate") || "",
    departureLocation:
      searchParams.get("departureLocation") || searchParams.get("departure") || "",
    category: searchParams.get("category") || "",
    durationDays: getDurationDaysValue(searchParams),
    priceRange: getPriceRangeValue(searchParams),
  };
}

function normalizeDurationInput(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? String(Number.parseInt(digits, 10) || "") : "";
}

function DepartureIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
      />
    </svg>
  );
}

function DurationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
      />
    </svg>
  );
}

export default function FilterSidebar({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() =>
    createFiltersFromSearchParams(searchParams)
  );
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [departureLocations, setDepartureLocations] = useState([]);
  const [durationOptions, setDurationOptions] = useState(FALLBACK_DURATION_OPTIONS);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const filterOptions = await getTourFilterOptions();

        if (Array.isArray(filterOptions.destinations)) {
          setDestinationOptions(filterOptions.destinations);
        }
        if (Array.isArray(filterOptions.departureLocations)) {
          setDepartureLocations(filterOptions.departureLocations);
        }
        if (
          Array.isArray(filterOptions.durationDays) &&
          filterOptions.durationDays.length > 0
        ) {
          setDurationOptions(filterOptions.durationDays);
        }
      } catch (error) {
        console.error("Không thể tải bộ lọc tour:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    setFilters(createFiltersFromSearchParams(searchParams));
  }, [searchParams]);

  const handleChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = (event) => {
    if (event) {
      event.preventDefault();
    }

    const params = new URLSearchParams();
    const trimmedDestination = filters.destination.trim();
    const trimmedDepartureLocation = filters.departureLocation.trim();
    const normalizedDurationDays = Number.parseInt(filters.durationDays, 10);
    const selectedPriceRange = PRICE_RANGE_OPTIONS.find(
      (option) => option.value === filters.priceRange
    );

    if (trimmedDestination) {
      params.set("q", trimmedDestination);
    }
    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }
    if (trimmedDepartureLocation) {
      params.set("departureLocation", trimmedDepartureLocation);
    }
    if (filters.category) {
      params.set("category", filters.category);
    }
    if (Number.isInteger(normalizedDurationDays) && normalizedDurationDays > 0) {
      params.set("durationDays", String(normalizedDurationDays));
    }
    if (selectedPriceRange?.minPrice) {
      params.set("minPrice", selectedPriceRange.minPrice);
    }
    if (selectedPriceRange?.maxPrice) {
      params.set("maxPrice", selectedPriceRange.maxPrice);
    }

    const query = params.toString();
    router.push(query ? `/danh-muc?${query}` : "/danh-muc");
  };

  const handleReset = () => {
    router.push("/danh-muc");
  };

  const durationSelectOptions = durationOptions.map((duration) => ({
    value: String(duration),
    label: duration === 1 ? "1 ngày" : `${duration} ngày`,
    searchText: `${duration} ngày`,
  }));

  return (
    <div className="travel-soft-panel space-y-6 rounded-[1.5rem] p-7">
      <div className="flex items-center gap-2 pb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-100">
          <DepartureIcon />
        </div>
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
          Tìm Kiếm Nhanh
        </h2>
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">
          Bạn muốn đi đâu?
        </label>
        <SearchableSelect
          value={filters.destination}
          onChange={(value) => handleChange("destination", value)}
          options={destinationOptions}
          placeholder="Nhập điểm đến..."
          emptyLabel="Tất cả điểm đến"
          containerClassName="rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100"
          inputClassName="text-sm text-slate-700"
          dropdownClassName="max-h-72"
        />
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">
          Ngày khởi hành
        </label>
        <DatePickerField
          value={filters.startDate}
          onChange={(value) => handleChange("startDate", value)}
          containerClassName="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus-within:bg-white"
          inputClassName="text-sm text-slate-700 placeholder:text-slate-400"
          ariaLabel="Chọn ngày khởi hành"
        />
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-[10px] font-bold uppercase text-slate-400">
          Khởi hành từ
        </label>
        <SearchableSelect
          value={filters.departureLocation}
          onChange={(value) => handleChange("departureLocation", value)}
          options={departureLocations}
          placeholder="Tất cả địa điểm"
          emptyLabel="Tất cả địa điểm"
          containerClassName="rounded-xl border border-slate-200 bg-white px-3 py-3 transition-all focus-within:bg-white"
          inputClassName="text-xs font-semibold text-slate-700"
          dropdownClassName="max-h-72"
          leadingContent={<DepartureIcon />}
        />
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">
          Phân Loại
        </label>
        <select
          value={filters.category}
          onChange={(event) => handleChange("category", event.target.value)}
          className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition-all focus:bg-white"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">
          Số ngày tour
        </label>
        <SearchableSelect
          value={filters.durationDays}
          onChange={(value) =>
            handleChange("durationDays", normalizeDurationInput(value))
          }
          options={durationSelectOptions}
          placeholder="Tất cả thời gian"
          emptyLabel="Tất cả thời gian"
          inputMode="numeric"
          containerClassName="rounded-xl border border-slate-200 bg-white px-3 py-3 transition-all focus-within:bg-white"
          inputClassName="text-xs font-semibold text-slate-700"
          dropdownClassName="max-h-72"
          leadingContent={<DurationIcon />}
        />
        <p className="pl-1 text-[11px] text-slate-400">
          Để trống nếu muốn xem tất cả thời lượng tour.
        </p>
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">
          Mức giá tour
        </label>
        <select
          value={filters.priceRange}
          onChange={(event) => handleChange("priceRange", event.target.value)}
          className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition-all focus:bg-white"
        >
          {PRICE_RANGE_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 pt-4">
        <button
          onClick={handleApplyFilter}
          className="w-full rounded-xl bg-[#ff6a00] py-3.5 text-base font-black text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-600 hover:shadow-orange-200 active:scale-95"
        >
          Áp dụng bộ lọc
        </button>
        <button
          onClick={handleReset}
          className="w-full py-2 text-center text-sm font-semibold text-slate-400 transition-colors hover:text-rose-500"
        >
          Xóa tất cả bộ lọc
        </button>
      </div>
    </div>
  );
}

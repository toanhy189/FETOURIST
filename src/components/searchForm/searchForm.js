"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getTourFilterOptions } from "@/apiService/tours";
import DatePickerField from "@/components/ui/DatePickerField";
import SearchableSelect from "@/components/ui/SearchableSelect";

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
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

// function createFormData(searchParams) {
//   return {
//     destination:
//       searchParams.get("destination") || searchParams.get("search") || "",
//     startDate: searchParams.get("startDate") || "",
//     departureLocation:
//       searchParams.get("departureLocation") || searchParams.get("departure") || "",
//   };
// }

function createFormData(searchParams) {
  return {
    destination:
      searchParams.get("q") ||
      searchParams.get("search") ||
      searchParams.get("destination") ||
      "",
    startDate: searchParams.get("startDate") || "",
    departureLocation:
      searchParams.get("departureLocation") || searchParams.get("departure") || "",
  };
}

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const [destinationOptions, setDestinationOptions] = useState([]);
  const [departureLocations, setDepartureLocations] = useState([]);
  const [formData, setFormData] = useState(() => createFormData(searchParams));

  useEffect(() => {
    setFormData(createFormData(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const filterOptions = await getTourFilterOptions();

        setDestinationOptions(
          Array.isArray(filterOptions.destinations)
            ? filterOptions.destinations
            : []
        );
        setDepartureLocations(
          Array.isArray(filterOptions.departureLocations)
            ? filterOptions.departureLocations
            : []
        );
      } catch (error) {
        console.error("Khong the tai danh sach diem loc tour:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedDestination = formData.destination.trim();
    const trimmedDepartureLocation = formData.departureLocation.trim();

    if (trimmedDestination) {
      params.set("q", trimmedDestination);
    }
    if (formData.startDate) {
      params.set("startDate", formData.startDate);
    }
    if (trimmedDepartureLocation) {
      params.set("departureLocation", trimmedDepartureLocation);
    }

    const query = params.toString();
    router.push(query ? `/danh-muc?${query}` : "/danh-muc");
  };

  return (
    <section
      className={`w-full ${
        isHomePage
          ? "relative z-10"
          : ""
      }`}
    >
      <div className={isHomePage ? "max-w-[690px]" : "w-full"}>
        {isHomePage ? (
          <div className="mb-3 px-1 text-slate-900 [text-shadow:0_2px_10px_rgba(255,255,255,0.95)]">
            <h1 className="mb-2 text-[1.45rem] font-black leading-tight tracking-tight md:text-[1.7rem]">
              Hơn 1000+ Tour, Khám Phá Ngay
            </h1>
            <p className="text-xs font-semibold text-slate-700 md:text-sm">
              - Giá tốt - hỗ trợ 24/7 - khắp nơi.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-[1.35rem] border border-white/80 bg-white/95 p-2 shadow-[0_20px_48px_-26px_rgba(236,72,153,0.55)]">
          <SearchableSelect
            value={formData.destination}
            onChange={(value) => handleChange("destination", value)}
            options={destinationOptions}
            placeholder="Bạn muốn đi đâu?"
            emptyLabel="Tất cả điểm đến"
            showChevron={false}
            leadingContent={<SearchIcon />}
            containerClassName="rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm"
            inputClassName="text-sm text-slate-700 placeholder:text-slate-400"
            dropdownClassName="max-h-72"
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="flex min-w-0 items-center rounded-2xl border border-slate-100 bg-white px-4 py-2 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="mr-2 h-4 w-4 shrink-0 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
              <div className="flex w-full min-w-0 flex-col">
                <span className="mb-0.5 text-[10px] font-bold uppercase leading-none text-slate-400">
                  Ngày đi
                </span>
                <DatePickerField
                  value={formData.startDate}
                  name="startDate"
                  onChange={(value) => handleChange("startDate", value)}
                  containerClassName="w-full"
                  inputClassName="text-xs font-semibold text-slate-700"
                  buttonClassName="text-slate-400"
                  ariaLabel="Chọn ngày đi"
                />
              </div>
            </div>

            <SearchableSelect
              value={formData.departureLocation}
              onChange={(value) => handleChange("departureLocation", value)}
              options={departureLocations}
              placeholder="Tất cả"
              emptyLabel="Tất cả địa điểm"
              leadingContent={<DepartureIcon />}
              containerClassName="rounded-2xl border border-slate-100 bg-white px-4 py-2 shadow-sm"
              inputClassName="text-xs font-semibold text-slate-700"
              dropdownClassName="max-h-72"
            />

            <button
              type="submit"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-8 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-200 transition-all hover:bg-[#e96d00] active:scale-95"
            >
              <SearchIcon />
              Tìm
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

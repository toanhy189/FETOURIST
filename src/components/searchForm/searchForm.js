"use client";

import { useEffect, useState } from "react";
import { getTourFilterOptions } from "@/apiService/tours";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { getTours } from "@/apiService/tours";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function formatDateDisplay(dateString) {
  if (!dateString) return "Linh hoạt";

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Linh hoạt";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [destinationOptions, setDestinationOptions] = useState([]);
  const [departureLocations, setDepartureLocations] = useState([]);
  const isHomePage = pathname === "/";

  const [departureLocations, setDepartureLocations] = useState([]);
  const [formData, setFormData] = useState({
    destination: searchParams.get("destination") || searchParams.get("search") || "",
    startDate: searchParams.get("startDate") || "",
    departureLocation:
      searchParams.get("departureLocation") || searchParams.get("departure") || "",
  });

  useEffect(() => {
    const fetchLocations = async () => {
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
    departure: searchParams.get("departure") || "",
  });

  useEffect(() => {
    setFormData({
      search: searchParams.get("search") || "",
      startDate: searchParams.get("startDate") || "",
      departure: searchParams.get("departure") || "",
    });
  }, [searchParams]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await getTours();
        if (response?.tours) {
          const locations = [
            ...new Set(
              response.tours.map((tour) => tour.departureLocation).filter(Boolean)
            ),
          ];
          setDepartureLocations(locations);
        }
      } catch (error) {
        console.error("Khong the tai danh sach diem loc tour:", error);
      }
    };

    fetchLocations();
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
      params.set("destination", trimmedDestination);
    }
    if (formData.startDate) {
      params.set("startDate", formData.startDate);
    }
    if (trimmedDepartureLocation) {
      params.set("departureLocation", trimmedDepartureLocation);
    }

    const query = params.toString();
    router.push(query ? `/danh-muc?${query}` : "/danh-muc");
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (formData.search?.trim()) params.set("search", formData.search.trim());
    if (formData.startDate) params.set("startDate", formData.startDate);
    if (formData.departure) params.set("departure", formData.departure);

    router.push(`/danh-muc?${params.toString()}`);
  };

  return (
    <section
      className={`w-full ${
        isHomePage
          ? "container mx-auto relative z-10 -mt-[100px] px-4 md:-mt-[130px] lg:-mt-[150px]"
          : ""
      }`}
    >
      <div className={isHomePage ? "max-w-2xl" : "w-full"}>
        {isHomePage && (
          <div className="mb-4 px-1 text-black drop-shadow-md">
            <h1 className="mb-1 text-2xl font-bold leading-tight tracking-wide md:text-3xl lg:text-4xl">
              Hơn 1000+ Tour, Khám Phá Ngay
            </h1>
            <p className="text-sm font-light opacity-90 md:text-base">
              - Giá tốt - hỗ trợ 24/7 - khắp nơi.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <SearchableSelect
            value={formData.destination}
            onChange={(value) => handleChange("destination", value)}
            options={destinationOptions}
            placeholder="Bạn muốn đi đâu?"
            emptyLabel="Tất cả điểm đến"
            showChevron={false}
            leadingContent={<SearchIcon />}
            containerClassName="rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-md"
            inputClassName="text-sm text-slate-700 placeholder:text-slate-400"
            dropdownClassName="max-h-72"
          />

          <div className={`flex ${isHomePage ? "flex-row" : "flex-col"} gap-2.5`}>
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-slate-100 bg-white px-4 py-2.5 shadow-md">
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
                  ariaLabel="Chon ngay di"
                />
      className={`w-full ${isHomePage ? "px-0" : "container mx-auto mt-6 px-4"
        }`}
    >
      <div className={`mx-auto w-full ${isHomePage ? "max-w-[920px]" : "max-w-[1180px]"}`}>
        <form
          onSubmit={handleSubmit}
          className={`rounded-[22px] p-3 md:p-4 ${isHomePage
              ? "bg-[rgba(15,23,42,0.32)] shadow-[0_18px_50px_rgba(15,23,42,0.22)] backdrop-blur-[10px]"
              : "border border-slate-200 bg-white shadow-lg"
            }`}
        >
          <div className="flex flex-col gap-4">
            <div className="flex h-[62px] items-center rounded-[18px] bg-white px-4 shadow-sm md:h-[66px] md:px-5">
              <div className="mr-4 shrink-0 text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.9}
                  stroke="currentColor"
                  className="h-7 w-7 md:h-8 md:w-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m1.1-5.15a6.25 6.25 0 1 1-12.5 0 6.25 6.25 0 0 1 12.5 0Z"
                  />
                </svg>
              </div>

              <input
                type="text"
                name="search"
                value={formData.search}
                onChange={handleInputChange}
                placeholder="Bạn muốn đi đâu?"
                className="w-full bg-transparent text-[16px] font-medium text-slate-700 outline-none placeholder:text-slate-400 md:text-[17px]"
              />
            </div>

            <SearchableSelect
              value={formData.departureLocation}
              onChange={(value) => handleChange("departureLocation", value)}
              options={departureLocations}
              placeholder="Tất cả"
              emptyLabel="Tất cả địa điểm"
              leadingContent={<DepartureIcon />}
              containerClassName="flex-1 rounded-lg border border-slate-100 bg-white px-4 py-2.5 shadow-md"
              inputClassName="text-xs font-semibold text-slate-700"
              dropdownClassName="max-h-72"
            />

            <button
              type="submit"
              className={`${
                isHomePage ? "px-8" : "w-full"
              } shrink-0 rounded-lg bg-[#ff8900] py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#e67b00] active:scale-95`}
            >
              Tìm
            </button>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_120px]">
              <div className="relative flex h-[58px] items-center rounded-[16px] bg-white px-4 shadow-sm md:h-[60px] md:px-5">
                <div className="mr-4 shrink-0 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2Z"
                    />
                  </svg>
                </div>

                <div className="relative min-w-0 flex-1">
                  <p className="mb-1 text-[13px] leading-none text-slate-500 md:text-[14px]">
                    Ngày khởi hành
                  </p>
                  <p className="text-[16px] font-semibold leading-none text-slate-800 md:text-[17px]">
                    {formatDateDisplay(formData.startDate)}
                  </p>

                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              </div>

              <div className="relative flex h-[58px] items-center rounded-[16px] bg-white px-4 shadow-sm md:h-[60px] md:px-5">
                <div className="mr-4 shrink-0 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                    />
                  </svg>
                </div>

                <div className="relative min-w-0 flex-1">
                  <p className="mb-1 text-[13px] leading-none text-slate-500 md:text-[14px]">
                    Khởi hành từ
                  </p>

                  <select
                    name="departure"
                    value={formData.departure}
                    onChange={handleInputChange}
                    className="w-full appearance-none bg-transparent pr-7 text-[16px] font-semibold text-slate-800 outline-none md:text-[17px]"
                  >
                    <option value="">Tất cả</option>
                    {departureLocations.map((location, index) => (
                      <option key={index} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.2}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19 9-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="h-[58px] rounded-[16px] bg-[#ff9800] text-[17px] font-bold text-white shadow-sm transition-all hover:bg-[#f28c00] active:scale-[0.99] md:h-[60px] md:text-[18px]"
              >
                Tìm
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

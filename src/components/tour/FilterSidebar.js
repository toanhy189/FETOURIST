"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

// Thêm prop categories được truyền từ server component (page.js)
export default function FilterSidebar({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State lưu trữ giá trị
  const [startDate, setStartDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(""); // Thêm state cho Category
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");

  // Đồng bộ state với URL khi load trang
  useEffect(() => {
    setStartDate(searchParams.get("startDate") || "");
    setSelectedCategory(searchParams.get("category") || ""); // Lấy category từ URL
    setSelectedDuration(searchParams.get("duration") || "");
    setSelectedPrice(searchParams.get("priceRange") || "");
  }, [searchParams]);

  const handleApplyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());

    // 1. Xử lý Ngày khởi hành
    if (startDate) params.set("startDate", startDate);
    else params.delete("startDate");

    // 2. Xử lý Danh mục (Category)
    if (selectedCategory) params.set("category", selectedCategory);
    else params.delete("category");

    // 3. Xử lý Số ngày
    if (selectedDuration) params.set("duration", selectedDuration);
    else params.delete("duration");

    // 4. Xử lý Giá
    if (selectedPrice) params.set("priceRange", selectedPrice);
    else params.delete("priceRange");

    params.delete("page"); // Reset về trang 1
    router.push(`/danh-muc?${params.toString()}`);
  };

  const handleReset = () => {
    setStartDate("");
    setSelectedCategory("");
    setSelectedDuration("");
    setSelectedPrice("");
    router.push("/danh-muc");
  };

  return (
    <div className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      
      {/* 1. Bộ lọc Ngày khởi hành */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2">
          Ngày khởi hành
        </h3>
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {/* 2. MỚI: Bộ lọc Danh mục (Categories) */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2">
          Vùng miền / Danh mục
        </h3>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="category"
              checked={selectedCategory === ""}
              onChange={() => setSelectedCategory("")}
              className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className={`text-sm transition-colors ${selectedCategory === "" ? "text-sky-600 font-bold" : "text-slate-600 group-hover:text-sky-600"}`}>
              Tất cả danh mục
            </span>
          </label>

          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat.slug}
                onChange={() => setSelectedCategory(cat.slug)}
                className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className={`text-sm transition-colors ${selectedCategory === cat.slug ? "text-sky-600 font-bold" : "text-slate-600 group-hover:text-sky-600"}`}>
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Bộ lọc Số ngày tour */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Số ngày tour</h3>
        <div className="space-y-3">
          {[
            { label: "1-2 ngày", value: "1-2" },
            { label: "3-4 ngày", value: "3-4" },
            { label: "5 ngày", value: "5-5" },
            { label: "6 ngày trở lên", value: "6-20" },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="duration"
                checked={selectedDuration === item.value}
                onChange={() => setSelectedDuration(item.value)}
                className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className={`text-sm transition-colors ${selectedDuration === item.value ? "text-sky-600 font-bold" : "text-slate-600 group-hover:text-sky-600"}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Bộ lọc Giá tour */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2">Giá tour/Khách</h3>
        <div className="space-y-3">
          {[
            { label: "< 3 triệu", value: "0-3000000" },
            { label: "3 - 4 triệu", value: "3000000-4000000" },
            { label: "4 - 7 triệu", value: "4000000-7000000" },
            { label: "> 7 triệu", value: "7000000-50000000" },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="price"
                checked={selectedPrice === item.value}
                onChange={() => setSelectedPrice(item.value)}
                className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className={`text-sm transition-colors ${selectedPrice === item.value ? "text-sky-600 font-bold" : "text-slate-600 group-hover:text-sky-600"}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Nút hành động */}
      <div className="space-y-3 pt-4">
        <button
          onClick={handleApplyFilter}
          className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-sky-700 active:scale-95"
        >
          Áp dụng bộ lọc
        </button>
        
        <button
          onClick={handleReset}
          className="w-full py-2 text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors"
        >
          Xóa tất cả lựa chọn
        </button>
      </div>
    </div>
  );
}
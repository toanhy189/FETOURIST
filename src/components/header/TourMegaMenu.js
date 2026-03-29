"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCategories } from "../../apiService/categories.js"; 

export default function TourMegaMenu() {
  const [categories, setCategories] = useState([]);
  const [activeParent, setActiveParent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await getCategories({ limit: 500 });
        const fetchedCategories = catRes.categories || [];

        if (fetchedCategories.length > 0) {
          setCategories(fetchedCategories);
          const parents = fetchedCategories.filter((cat) => !cat.parentCategory);
          if (parents.length > 0) {
            setActiveParent(parents[0]);
          }
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu từ API service:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const parentCategories = categories.filter((cat) => !cat.parentCategory);

  const childCategories = categories.filter(
    (cat) => cat.parentCategory && cat.parentCategory.id === activeParent?.id
  );

  return (
    <div className="group relative">
      {/* Nút Nav chính */}
      <Link
        href="/danh-muc"
        className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-200/50 hover:text-sky-800"
      >
        Tours ▾
      </Link>

      {/* Khung Mega Menu */}
      <div className="absolute left-1/2 top-full z-50 mt-2 w-max min-w-[750px] -translate-x-1/2 invisible opacity-0 shadow-xl transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0">
        <div className="flex min-h-[300px] overflow-hidden rounded-xl border border-sky-100 bg-white">
          
          {/* Cột trái: Danh mục cha */}
          <div className="w-1/3 border-r border-slate-100 bg-slate-50 py-4">
            {isLoading ? (
              <div className="p-4 text-sm text-slate-500">Đang tải...</div>
            ) : (
              <ul className="flex flex-col">
                {parentCategories.map((parent) => (
                  <li key={parent.id}>
                    <div
                      onMouseEnter={() => setActiveParent(parent)}
                      className={`flex cursor-pointer items-center justify-between px-6 py-3 text-sm transition-colors ${
                        activeParent?.id === parent.id
                          ? "bg-white font-bold text-sky-700 shadow-[inset_4px_0_0_0_#0ea5e9]"
                          : "font-medium text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {parent.name}
                      <span className={`text-lg transition-transform ${activeParent?.id === parent.id ? "translate-x-1 text-sky-500" : "text-slate-300"}`}>
                        ›
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cột phải: Danh sách Category con */}
          <div className="w-2/3 flex flex-col p-6">
            <h3 className="mb-4 border-b border-slate-100 pb-3 font-display text-lg font-bold text-sky-900">
              {activeParent?.name || "Đang tải..."}
            </h3>

            <div className="flex-1">
              {childCategories.length > 0 ? (
                <ul className="columns-2 gap-x-8 space-y-1">
                  {childCategories.map((child) => (
                    <li key={child.id} className="break-inside-avoid">
                      <Link
                        href={`/danh-muc?category=${child.slug || child.id}`}
                        className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-sky-600 hover:underline"
                      >
                        <span className="text-sky-400">›</span>
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-slate-400">
                  {isLoading ? "" : "Chưa có danh mục con nào."}
                </p>
              )}
            </div>

            {/* Nút xem tất cả */}
            {activeParent && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href={`/danh-muc?category=${activeParent.slug || activeParent.id}`}
                  className="inline-flex items-center text-sm font-semibold text-sky-600 transition-colors hover:text-sky-800"
                >
                  Xem tất cả {activeParent.name.toLowerCase()}
                  <span className="ml-1">→</span>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// Nhớ thay đổi đường dẫn import này cho đúng với cấu trúc thư mục của bạn
import { getCategories } from "../../apiService/categories.js"; 
import { getTours } from "../../apiService/tours.js"; 

export default function TourMegaMenu() {
  const [categories, setCategories] = useState([]);
  const [tours, setTours] = useState([]);
  const [activeParent, setActiveParent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi song song 2 hàm từ file API service của bạn
        const [catRes, tourRes] = await Promise.all([
          getCategories({ limit: 500 }),
          getTours({ limit: 500 })
        ]);

        // Dữ liệu đã được map sẵn qua mapCategory và mapTour trong service
        const fetchedCategories = catRes.categories || [];
        const fetchedTours = tourRes.tours || [];

        if (fetchedCategories.length > 0) {
          setCategories(fetchedCategories);
          setTours(fetchedTours);
          
          // Lọc ra các danh mục cha (parentCategory là null)
          const parents = fetchedCategories.filter((cat) => !cat.parentCategory);
          if (parents.length > 0) {
            setActiveParent(parents[0]); // Mặc định hover vào cha đầu tiên
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

  // Tách riêng danh sách danh mục cha cho cột trái
  const parentCategories = categories.filter((cat) => !cat.parentCategory);

  // Lọc danh sách Tour hiển thị bên cột phải
  const displayTours = tours.filter((tour) => {
    if (!activeParent || !tour.category) return false;
    
    // Sử dụng .id thay vì ._id vì dữ liệu đã đi qua hàm mapTour/mapCategory
    const tourCategoryId = tour.category.id;
    const activeParentId = activeParent.id;

    // Lấy danh sách ID của các category con thuộc category cha này
    const childCategoryIds = categories
      .filter(cat => cat.parentCategory && cat.parentCategory.id === activeParentId)
      .map(cat => cat.id);

    // Trả về tour nếu nó thuộc category cha HOẶC thuộc một trong các category con
    return tourCategoryId === activeParentId || childCategoryIds.includes(tourCategoryId);
  });

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

          {/* Cột phải: Danh sách Tours thuộc danh mục đang hover */}
          <div className="w-2/3 flex flex-col p-6">
            <h3 className="mb-4 border-b border-slate-100 pb-3 font-display text-lg font-bold text-sky-900">
              Các Tour {activeParent?.name || "Đang tải..."}
            </h3>
            
            {/* Vùng hiển thị Tours: chia làm 2 cột */}
            <div className="flex-1">
              {displayTours.length > 0 ? (
                <ul className="columns-2 gap-x-8 space-y-3">
                  {displayTours.slice(0, 10).map((tour) => ( 
                    <li key={tour.id} className="break-inside-avoid">
                      <Link
                        href={`/tours/${tour.slug || tour.id}`} 
                        className="block text-sm text-slate-600 transition-colors hover:text-sky-600 hover:underline line-clamp-2"
                        title={tour.title}
                      >
                        {tour.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-slate-400">
                  {isLoading ? "" : "Chưa có tour nào trong danh mục này."}
                </p>
              )}
            </div>
            
            {/* Nút xem tất cả */}
            {activeParent && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link 
                  href={`/danh-muc/${activeParent.slug || activeParent.id}`}
                  className="inline-flex items-center text-sm font-semibold text-sky-600 transition-colors hover:text-sky-800"
                >
                  Xem tất cả tour {activeParent.name.toLowerCase()} 
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
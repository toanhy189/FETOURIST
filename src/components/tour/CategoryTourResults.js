"use client";

import { useEffect, useState } from "react";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";

export default function CategoryTourResults({
  initialTours = [],
  totalTours = 0,
  tourFilters = {},
  initialPagination = null,
  pageSize = 6,
}) {
  const [tours, setTours] = useState(initialTours);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [currentPage, setCurrentPage] = useState(
    Number(initialPagination?.page || 1)
  );
  const [hasNextPage, setHasNextPage] = useState(
    Boolean(initialPagination?.hasNextPage)
  );

  useEffect(() => {
    // Khi filter tren URL doi, server page tra props moi va client list phai reset lai.
    setTours(initialTours);
    setCurrentPage(Number(initialPagination?.page || 1));
    setHasNextPage(Boolean(initialPagination?.hasNextPage));
    setIsLoadingMore(false);
    setLoadMoreError("");
  }, [initialPagination?.hasNextPage, initialPagination?.page, initialTours]);

  const hasTours = tours.length > 0;
  const canLoadMore = hasNextPage && totalTours > tours.length;

  async function handleLoadMore() {
    // Load-more giu nguyen filter hien tai va loai tour trung id khi API tra overlap.
    if (!canLoadMore || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError("");

    try {
      const nextPage = currentPage + 1;
      const result = await getTours({
        ...tourFilters,
        page: nextPage,
        limit: pageSize,
      });
      const nextTours = Array.isArray(result?.tours) ? result.tours : [];

      setTours((currentTours) => {
        const seenTourIds = new Set(currentTours.map((tour) => tour.id));
        const appendedTours = nextTours.filter((tour) => !seenTourIds.has(tour.id));
        return [...currentTours, ...appendedTours];
      });
      setCurrentPage(Number(result?.pagination?.page || nextPage));
      setHasNextPage(Boolean(result?.pagination?.hasNextPage));
    } catch (error) {
      setLoadMoreError(
        error.message || "Không tải thêm được danh sách tour."
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (!hasTours) {
    return (
      <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-24 text-center shadow-inner">
        <h3 className="text-xl font-bold text-slate-800">
          Không tìm thấy tour phù hợp
        </h3>
        <p className="mt-2 text-slate-500">
          Hãy thử đổi tiêu chí lọc hoặc từ khóa điểm đến khác.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>

      {loadMoreError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadMoreError}
        </div>
      ) : null}

      {canLoadMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="rounded-2xl border border-orange-200 bg-white px-6 py-3 text-sm font-bold text-orange-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore
              ? "Đang tải thêm..."
              : `Xem thêm ${Math.min(pageSize, totalTours - tours.length)} tour`}
          </button>
        </div>
      ) : null}
    </div>
  );
}

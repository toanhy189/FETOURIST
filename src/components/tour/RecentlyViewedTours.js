"use client";

import { useEffect, useSyncExternalStore } from "react";
import TourCardGridSection from "@/components/tour/TourCardGridSection";
import {
  getEmptyRecentToursSnapshot,
  getRecentToursSnapshot,
  saveRecentTour,
  subscribeRecentTours,
} from "@/utils/recentTours";

export default function RecentlyViewedTours({ tour, limit = 3 }) {
  const recentTours = useSyncExternalStore(
    subscribeRecentTours,
    () => getRecentToursSnapshot({ excludeSlug: tour.slug, limit }),
    getEmptyRecentToursSnapshot
  );

  useEffect(() => {
    // Khi người dùng mở trang chi tiết, tour hiện tại sẽ được ghi vào localStorage của trình duyệt.
    // Danh sách hiển thị bên dưới tự cập nhật lại qua subscription mà không cần gọi API.
    saveRecentTour(tour);
  }, [tour]);

  return (
    <TourCardGridSection
      title="Tours du lịch bạn đã xem gần đây"
      description="Dữ liệu này được lưu ngay trên trình duyệt hiện tại để người dùng mở lại nhanh."
      tours={recentTours}
      emptyMessage="Chưa có tour nào trong lịch sử xem gần đây trên trình duyệt này."
    />
  );
}

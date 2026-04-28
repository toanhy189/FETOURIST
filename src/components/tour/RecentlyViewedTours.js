"use client";

import { useEffect, useSyncExternalStore } from "react";
import { syncRecentTourToServer } from "@/apiService/recentTours";
import TourCardGridSection from "@/components/tour/TourCardGridSection";
import {
  getEmptyRecentToursSnapshot,
  getRecentToursSnapshot,
  refreshRecentToursFromServer,
  saveRecentTourLocal,
  subscribeRecentTours,
} from "@/utils/recentTours";
// Trang xem lịch tour gần đây
export default function RecentlyViewedTours({ tour, limit = 3 }) {
  const recentTours = useSyncExternalStore(
    subscribeRecentTours,
    () => getRecentToursSnapshot({ excludeSlug: tour.slug, limit }),
    getEmptyRecentToursSnapshot
  );

  useEffect(() => {
    let isMounted = true;

    saveRecentTourLocal(tour);

    async function syncRecentTour() {
      try {
        await syncRecentTourToServer({
          tourId: tour?.id,
        });

        if (isMounted) {
          await refreshRecentToursFromServer();
        }
      } catch {
        // Local cache already contains the optimistic UI state.
      }
    }

    void syncRecentTour();

    return () => {
      isMounted = false;
    };
  }, [tour]);

  return (
    <TourCardGridSection
      title="Tour du lịch bạn đã xem gần đây"

      tours={recentTours}
      emptyMessage="Chưa có tour nào trong lịch sử xem gần đây trong tài khoản này"
    />
  );
}

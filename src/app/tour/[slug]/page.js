import { notFound } from "next/navigation";
import { getRelatedTours, getTourDetail } from "@/apiService/tours";
import RecentlyViewedTours from "@/components/tour/RecentlyViewedTours";
import TourCardGridSection from "@/components/tour/TourCardGridSection";
import TourDetailExperience from "@/components/tour/TourDetailExperience";
import TourSocialHub from "@/components/tour/TourSocialHub";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const tour = await getTourDetail(slug);

    return {
      title: `${tour.title} | TRAVELPTIT`,
      description: tour.summary,
    };
  } catch {
    return {
      title: "Tour Không Tồn Tại | TRAVELPTIT",
      description: "Không tìm thấy tour bạn đang tìm.",
    };
  }
}

export default async function TourDetailPage({ params }) {
  const { slug } = await params;
  let tour;

  try {
    tour = await getTourDetail(slug);
  } catch (error) {
    if (error?.status === 404) {
      notFound();
    }

    throw error;
  }

  if (!tour) {
    notFound();
  }

  const relatedResult = await getRelatedTours(tour.slug, { limit: 3 }).catch(() => ({
    tours: [],
  }));
  const relatedTours = relatedResult.tours;

  return (
    <div className="space-y-8 pb-16 lg:pb-20">
      <TourDetailExperience tour={tour} />
      <TourSocialHub tour={tour} />
      <TourCardGridSection
        title={`Tours du lịch ${tour.destination} liên quan`}
        tours={relatedTours}
        emptyMessage="Chưa tìm thấy tour liên quan phù hợp để gợi ý."
      />
      <RecentlyViewedTours tour={tour} />
    </div>
  );
}

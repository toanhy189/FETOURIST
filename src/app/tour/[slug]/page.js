import Link from "next/link";
import { notFound } from "next/navigation";
import { getTourDetail, getTours } from "@/apiService/tours";
import TourBookingSidebar from "@/components/tour/TourBookingSidebar";
import TourSocialHub from "@/components/tour/TourSocialHub";
import { formatDateVi, formatDuration, formatVnd } from "@/utils/format";

export const dynamic = "force-dynamic";

const fallbackCover =
  "linear-gradient(135deg, rgba(8, 47, 73, 0.9), rgba(14, 116, 144, 0.78), rgba(245, 158, 11, 0.75))";

function getHeroStyle(imageUrl) {
  if (!imageUrl) {
    return { background: fallbackCover };
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.62)), url("${imageUrl}")`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  };
}

async function loadRelatedTours(tour) {
  if (!tour.category?.slug) {
    return [];
  }

  try {
    // Goi them 1 lan nua de lay tour cung category; FE loc bo current tour o client la du.
    const response = await getTours({ category: tour.category.slug, limit: 3 });
    return response.tours.filter((item) => item.slug !== tour.slug).slice(0, 2);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const tour = await getTourDetail(slug);

    return {
      title: `${tour.title} | BETOURIST`,
      description: tour.summary,
    };
  } catch {
    return {
      title: "Tour Khong Ton Tai | BETOURIST",
      description: "Khong tim thay tour ban dang tim.",
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

  const relatedTours = await loadRelatedTours(tour);

  return (
    <div className="space-y-8">
      <header
        className="relative overflow-hidden rounded-[2rem] border border-white/70 p-6 text-white shadow-xl md:p-9"
        style={getHeroStyle(tour.imageUrl)}
      >
        <div className="absolute inset-0 bg-black/15" />
        <div className="relative z-10 space-y-3">
          <p className="inline-flex rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            Layout 03 . Trang chi tiet tour
          </p>
          <h1 className="font-display text-4xl md:text-5xl">{tour.title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-white/90">{tour.summary}</p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold">
            <span className="rounded-full bg-white/25 px-3 py-1">{tour.destination}</span>
            <span className="rounded-full bg-white/25 px-3 py-1">
              {formatDuration(tour.durationDays, tour.durationNights)}
            </span>
            <span className="rounded-full bg-white/25 px-3 py-1">
              Danh gia {tour.ratingAverage.toFixed(1)}/5
            </span>
            <span className="rounded-full bg-white/25 px-3 py-1">
              Khoi hanh tu {tour.departureLocation}
            </span>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.35fr,0.65fr]">
        <div className="space-y-5">
          <article className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Danh muc</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {tour.category?.name || "Dang cap nhat"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Phuong tien</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{tour.transportLabel}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">So cho du kien</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {tour.availableSeats}/{tour.maxGroupSize}
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-3xl text-slate-900">Lich trinh theo ngay</h2>
            {tour.itinerary.length > 0 ? (
              <div className="mt-5 space-y-4">
                {tour.itinerary.map((step) => (
                  <div
                    key={`${tour.slug}-${step.day}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                      Ngay {step.day}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {step.description || "Noi dung se duoc cap nhat them."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Chua co lich trinh chi tiet cho tour nay.
              </div>
            )}
          </article>

          <article className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl text-slate-900">Bao gom</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {tour.includedServices.length > 0 ? (
                  tour.includedServices.map((item) => (
                    <li key={`${tour.slug}-${item}`} className="rounded-lg bg-emerald-50 px-3 py-2">
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg bg-emerald-50 px-3 py-2">Dang cap nhat dich vu bao gom.</li>
                )}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl text-slate-900">Khong bao gom</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {tour.excludedServices.length > 0 ? (
                  tour.excludedServices.map((item) => (
                    <li key={`${tour.slug}-${item}`} className="rounded-lg bg-rose-50 px-3 py-2">
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg bg-rose-50 px-3 py-2">Dang cap nhat dich vu khong bao gom.</li>
                )}
              </ul>
            </div>
          </article>

          <article className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Lich khoi hanh sap toi</h2>
            {tour.upcomingDepartures.length > 0 ? (
              <div className="mt-4 space-y-3">
                {tour.upcomingDepartures.map((departure) => (
                  <div
                    key={departure.id}
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">
                        {formatDateVi(departure.departureDate)} - {formatDateVi(departure.returnDate)}
                      </p>
                      <p className="text-sky-800">{formatVnd(departure.displayPrice)}</p>
                    </div>
                    <p className="mt-1">Diem hen: {departure.meetingPoint || "Se thong bao sau"}</p>
                    <p className="mt-1">So cho con lai: {departure.remainingSeats}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Tour nay chua co departure cong khai. Ban van co the de lai thong tin de duoc tu van.
              </p>
            )}
          </article>

          {tour.images.length > 1 ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-display text-2xl text-slate-900">Goc hinh anh</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Gallery nay render truc tiep tu mang `images` trong tour detail.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {tour.images.map((imageUrl, index) => (
                  <div
                    key={`${tour.slug}-gallery-${index + 1}`}
                    className="h-40 rounded-3xl border border-slate-200 bg-slate-100"
                    style={getHeroStyle(imageUrl)}
                  />
                ))}
              </div>
            </article>
          ) : null}

          {relatedTours.length > 0 ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-display text-2xl text-slate-900">Tour cung danh muc</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {relatedTours.map((item) => (
                  <Link
                    key={item.id}
                    href={`/tour/${item.slug}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-white"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                      {item.destination}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDuration(item.durationDays, item.durationNights)}
                    </p>
                  </Link>
                ))}
              </div>
            </article>
          ) : null}
        </div>

        <aside className="self-start">
          <TourBookingSidebar tour={tour} />
        </aside>
      </section>

      <TourSocialHub tour={tour} />
    </div>
  );
}

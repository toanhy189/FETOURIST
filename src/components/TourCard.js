import Link from "next/link";
import { formatDateVi, formatDuration, formatVnd } from "@/utils/format";

const fallbackCover =
  "linear-gradient(135deg, rgba(3, 105, 161, 0.92), rgba(14, 165, 233, 0.72), rgba(245, 158, 11, 0.78))";

function getCoverStyle(imageUrl) {
  if (!imageUrl) {
    return { background: fallbackCover };
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.52)), url("${imageUrl}")`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  };
}

export default function TourCard({ tour }) {
  const visibleHighlights = tour.highlights?.slice(0, 3) || [];

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-52 p-4 text-sm font-semibold text-white" style={getCoverStyle(tour.imageUrl)}>
        <div className="flex flex-wrap gap-2">
          <p className="inline-flex rounded-full bg-black/25 px-3 py-1 backdrop-blur-sm">
            {tour.destination}
          </p>
          {tour.category?.name ? (
            <p className="inline-flex rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
              {tour.category.name}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <h3 className="font-display text-xl text-slate-900">{tour.title}</h3>
          <p className="text-sm text-slate-500">
            {formatDuration(tour.durationDays, tour.durationNights)} . {tour.transportLabel}
          </p>
        </div>

        <p className="text-sm leading-6 text-slate-600">{tour.summary}</p>

        <div className="flex flex-wrap gap-2">
          {visibleHighlights.length > 0 ? visibleHighlights.map((tag) => (
            <span
              key={`${tour.slug}-${tag}`}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          )) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Khoi hanh tu {tour.departureLocation}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-sm text-slate-500">
            <p>Khoi hanh gan nhat: {formatDateVi(tour.firstStartDate)}</p>
            <p>Danh gia: {tour.ratingAverage.toFixed(1)}/5</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Gia tu</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-sky-800">{formatVnd(tour.displayPrice)}</p>
              {tour.discountPrice ? (
                <span className="text-sm text-slate-400 line-through">{formatVnd(tour.price)}</span>
              ) : null}
            </div>
          </div>

          <Link
            href={`/tour/${tour.slug}`}
            className="rounded-full border border-sky-300 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
          >
            Xem chi tiet
          </Link>
        </div>
      </div>
    </article>
  );
}

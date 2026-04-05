import TourCard from "@/components/TourCard";

export default function TourCardGridSection({
  title,
  description = "",
  tours = [],
  emptyMessage = "Chưa có dữ liệu để hiển thị.",
}) {
  return (
    <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-slate-900">{title}</h2>
        {description ? <p className="text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>

      {tours.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.id || tour.slug} tour={tour} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

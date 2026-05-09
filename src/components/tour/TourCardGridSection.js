import TourCard from "@/components/TourCard";

export default function TourCardGridSection({
  title,
  tours = [],
  emptyMessage = "Chưa có dữ liệu để hiển thị.",
}) {
  return (
    <section className="mx-auto max-w-[1100px] space-y-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-900">{title}</h2>
      </div>

      {tours.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.id || tour.slug} tour={tour} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

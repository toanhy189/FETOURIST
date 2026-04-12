"use client";

import Link from "next/link";

function FavoriteCard({ favorite, onRemove, loading }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-[0_12px_30px_rgba(2,132,199,0.08)]">
      <p className="text-xs uppercase tracking-wide text-sky-700">
        {favorite.tour?.category?.name || "Tour"}
      </p>

      <h3 className="mt-2 text-xl font-semibold text-slate-900">
        {favorite.tour?.title}
      </h3>

      <p className="mt-2 text-sm text-slate-500">{favorite.tour?.destination}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/tour/${favorite.tour?.slug}`}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Xem tour
        </Link>

        <button
          type="button"
          onClick={() => onRemove(favorite.tour?.slug)}
          disabled={loading}
          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:bg-slate-100"
        >
          Bỏ yêu thích
        </button>
      </div>
    </div>
  );
}

export default function FavoriteTab({ favorites, loading, handleRemoveFavorite }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-2xl font-bold text-slate-900">Danh sách yêu thích</h3>
        <p className="mt-1 text-sm text-slate-500">
          Những tour bạn lưu lại để xem sau sẽ hiển thị ở đây.
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.map((favorite) => (
            <FavoriteCard
              key={favorite.id}
              favorite={favorite}
              onRemove={handleRemoveFavorite}
              loading={loading[`favorite-${favorite.tour?.slug}`]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-base font-medium text-slate-700">Chưa có tour yêu thích nào</p>
          <p className="mt-2 text-sm text-slate-500">
            Khi bạn lưu tour, chúng sẽ xuất hiện tại đây.
          </p>
        </div>
      )}
    </div>
  );
}
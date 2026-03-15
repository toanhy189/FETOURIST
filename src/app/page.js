import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";

export const dynamic = "force-dynamic";

const serviceSteps = [
  {
    title: "Chon diem den",
    detail: "Tim nhanh tour theo noi ban muon di hoac theo danh muc san co.",
  },
  {
    title: "Xem lich khoi hanh",
    detail: "Doc nhanh gia, lich trinh, phuong tien va ngay khoi hanh gan nhat.",
  },
  {
    title: "Gui yeu cau dat tour",
    detail: "Chuyen sang trang chi tiet tour de xem lich va de lai thong tin lien he.",
  },
];

async function loadHomePageData() {
  // Promise.allSettled giup homepage van render duoc khi 1 API tam loi.
  const [categoryResult, tourResult] = await Promise.allSettled([
    getCategories({ limit: 6 }),
    getTours({ limit: 6, sortBy: "createdAt", sortOrder: "desc" }),
  ]);

  return {
    categories: categoryResult.status === "fulfilled" ? categoryResult.value.categories : [],
    featuredTours: tourResult.status === "fulfilled" ? tourResult.value.tours : [],
    errors: [categoryResult, tourResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message || "Khong the tai du lieu tu server."),
  };
}

export default async function Home() {
  const { categories, featuredTours, errors } = await loadHomePageData();
  const destinationCount = new Set(featuredTours.map((tour) => tour.destination)).size;

  return (
    <div className="space-y-14 pb-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-white/90 p-6 shadow-lg md:p-10">
        <div className="absolute -left-14 -top-16 h-52 w-52 rounded-full bg-sky-200/60 blur-2xl" />
        <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-amber-200/70 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
              Website du lich ket noi API BETOURIST
            </p>

            <div className="space-y-4">
              <h1 className="font-display text-4xl leading-tight text-slate-900 md:text-5xl">
                Kham pha tour that,
                <br />
                giao dien gon va de dung.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Trang nay khong dung mock data nua. Toan bo danh muc va tour dang duoc
                tai tu backend BETOURIST thong qua folder <strong>apiService</strong>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-slate-400">Tour noi bat</p>
                <p className="text-2xl font-bold text-sky-800">{featuredTours.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-slate-400">Danh muc active</p>
                <p className="text-2xl font-bold text-sky-800">{categories.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-slate-400">Diem den dang co</p>
                <p className="text-2xl font-bold text-sky-800">{destinationCount}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/danh-muc"
                className="rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                Xem danh muc tour
              </Link>
              <Link
                href="/tai-khoan"
                className="rounded-full border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
              >
                Mo khu vuc tai khoan
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Tim tour nhanh</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Form nay gui query len trang danh muc, sau do trang danh muc se map query sang
              API `GET /api/tours`.
            </p>

            <form action="/danh-muc" className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-600">
                Tu khoa
                <input
                  type="text"
                  name="search"
                  placeholder="Vi du: Da Nang, Nha Trang..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
                />
              </label>

              <label className="block text-sm font-medium text-slate-600">
                Danh muc
                <select
                  name="category"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
                  defaultValue=""
                >
                  <option value="">Tat ca danh muc</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="mt-2 inline-flex w-full justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
              >
                Bat dau tim tour
              </button>
            </form>
          </div>
        </div>
      </section>

      {errors.length > 0 ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          Khong tai duoc mot phan du lieu tu backend. Kiem tra lai server BETOURIST va bien moi
          truong `NEXT_PUBLIC_API_BASE_URL`.
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl text-slate-900">Danh muc tour</h2>
          <Link href="/danh-muc" className="text-sm font-semibold text-sky-800">
            Xem tat ca tour
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/danh-muc?category=${category.slug}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-sky-300"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Danh muc</p>
              <h3 className="mt-2 font-display text-2xl text-slate-900">{category.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Tour duoc lay tu API
            </p>
            <h2 className="font-display text-3xl text-slate-900">Tour noi bat tren he thong</h2>
          </div>
          <Link href="/danh-muc" className="text-sm font-semibold text-sky-800">
            Mo trang danh muc
          </Link>
        </div>

        {featuredTours.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Chua co tour published de hien thi.
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-3xl text-slate-900">Luong su dung co ban</h2>
          <div className="mt-5 space-y-4">
            {serviceSteps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Buoc {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
          <h2 className="font-display text-2xl text-slate-900">Moc ky thuat</h2>
          <p className="text-sm leading-6 text-slate-700">
            `apiService` dang lam 3 viec: gom base URL, goi API co xu ly loi, va map field
            backend thanh du lieu de component frontend render de hon.
          </p>
          <Link
            href="/danh-muc"
            className="inline-flex w-full items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-amber-100"
          >
            Thu nghiem du lieu that
          </Link>
        </div>
      </section>
    </div>
  );
}

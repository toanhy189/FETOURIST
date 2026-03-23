"use client";

import { useEffect, useMemo, useState } from "react";
import { getUsers } from "@/apiService/auth";
import { getBookingsForAdmin } from "@/apiService/bookings";
import { getToursForAdmin } from "@/apiService/tours";
import { formatDateVi, formatVnd } from "@/utils/format";

function getGuestCount(booking) {
  const guests = booking?.guests || {};
  return Number(guests.adults || 0) + Number(guests.children || 0) + Number(guests.infants || 0);
}

function getStatusClasses(status) {
  switch (status) {
    case "confirmed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "completed":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function buildDestinationStats(tours) {
  const groups = tours.reduce((accumulator, tour) => {
    const key = tour.destination || "Khac";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const totalTours = tours.length || 1;

  return Object.entries(groups)
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / totalTours) * 100),
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

function buildTopTours(bookings) {
  const grouped = bookings.reduce((accumulator, booking) => {
    const key = booking.tour?._id || booking.tour?.id || booking.tour?.slug || booking.orderCode;
    const current = accumulator.get(key) || {
      key,
      title: booking.tour?.title || "Tour chua ro ten",
      bookingCount: 0,
      guestCount: 0,
      paidCount: 0,
      lastDepartureDate: null,
    };

    current.bookingCount += 1;
    current.guestCount += getGuestCount(booking);
    if (booking.paymentStatus === "paid") {
      current.paidCount += 1;
    }

    const departureDate = booking.departureDate || booking.departure?.departureDate;
    if (departureDate) {
      const nextDate = new Date(departureDate);
      if (!current.lastDepartureDate || nextDate > current.lastDepartureDate) {
        current.lastDepartureDate = nextDate;
      }
    }

    accumulator.set(key, current);
    return accumulator;
  }, new Map());

  return Array.from(grouped.values())
    .sort((left, right) => {
      if (right.bookingCount !== left.bookingCount) {
        return right.bookingCount - left.bookingCount;
      }
      return right.guestCount - left.guestCount;
    })
    .slice(0, 6);
}

function buildStatusCards(summary) {
  return [
    { label: "Pending", value: summary?.pendingBookings || 0 },
    { label: "Confirmed", value: summary?.confirmedBookings || 0 },
    { label: "Completed", value: summary?.completedBookings || 0 },
    { label: "Cancelled", value: summary?.cancelledBookings || 0 },
    { label: "Da thanh toan", value: summary?.paidBookings || 0 },
    { label: "Sap khoi hanh", value: summary?.upcomingBookings || 0 },
  ];
}

function MetricCard({ label, value, description, tone = "sky" }) {
  const toneClassName =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-sky-700";

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className={`mt-3 text-4xl font-semibold tracking-tight ${toneClassName}`}>{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [userList, tourList, bookingList] = await Promise.all([
          getUsers(),
          getToursForAdmin({ limit: 50 }),
          getBookingsForAdmin({ limit: 50 }),
        ]);

        if (!isMounted) {
          return;
        }

        setUsers(userList);
        setTours(tourList.tours || []);
        setBookings(bookingList.bookings || []);
        setSummary(bookingList.summary || null);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Khong tai duoc dashboard admin.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeToursCount = useMemo(
    () => tours.filter((tour) => tour.status === "published").length,
    [tours]
  );
  const registeredUsersCount = useMemo(
    () => users.filter((user) => user.role === "user").length,
    [users]
  );
  const destinationStats = useMemo(() => buildDestinationStats(tours), [tours]);
  const topTours = useMemo(() => buildTopTours(bookings), [bookings]);
  const recentBookings = useMemo(() => bookings.slice(0, 6), [bookings]);
  const statusCards = useMemo(() => buildStatusCards(summary), [summary]);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          label="Tours dang hoat dong"
          value={loading ? "--" : activeToursCount}
          description="Tinh tren danh sach admin tours, uu tien cac tour dang published."
        />
        <MetricCard
          label="Tong luot booking"
          value={loading ? "--" : summary?.totalBookings || 0}
          description="Tong hop tu booking summary cua backend quan tri."
          tone="emerald"
        />
        <MetricCard
          label="Nguoi dung dang ky"
          value={loading ? "--" : registeredUsersCount}
          description="Dem tren toan bo user co role user trong he thong."
        />
        <MetricCard
          label="Tong gia tri booking"
          value={loading ? "--" : formatVnd(summary?.totalAmount || 0)}
          description="Dung de theo doi quy mo don hang hien co truoc khi tach doanh thu thuc thu."
          tone="amber"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Diem den noi bat</h3>
              <p className="mt-1 text-sm text-slate-500">
                Phan bo tour theo destination trong kho quan tri hien tai.
              </p>
            </div>
            {loading ? <p className="text-sm text-slate-400">Dang tai...</p> : null}
          </div>

          <div className="mt-6 space-y-4">
            {destinationStats.length > 0 ? (
              destinationStats.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-slate-500">{item.count} tour</p>
                    </div>
                    <p className="text-slate-500">{item.percent}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${Math.max(item.percent, 8)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Chua co du lieu diem den de tong hop.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Tinh trang booking</h3>
              <p className="mt-1 text-sm text-slate-500">
                Thay the khung payment chart bang summary trang thai van hanh.
              </p>
            </div>
            {loading ? <p className="text-sm text-slate-400">Dang tai...</p> : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {statusCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {loading ? "--" : card.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Tours duoc dat nhieu nhat</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tong hop tu danh sach booking admin de tim tour dang thu hut nhat.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4 font-semibold">Tour</th>
                  <th className="pb-3 pr-4 font-semibold">Luot dat</th>
                  <th className="pb-3 pr-4 font-semibold">Tong khach</th>
                  <th className="pb-3 font-semibold">Da thanh toan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topTours.length > 0 ? (
                  topTours.map((tour) => (
                    <tr key={tour.key} className="align-top">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-900">{tour.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {tour.lastDepartureDate
                            ? `Ky gan nhat ${formatDateVi(tour.lastDepartureDate)}`
                            : "Dang cap nhat lich"}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{tour.bookingCount}</td>
                      <td className="py-3 pr-4 text-slate-600">{tour.guestCount}</td>
                      <td className="py-3 text-slate-600">{tour.paidCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                      Chua co booking de tong hop top tours.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Don dat moi</h3>
              <p className="mt-1 text-sm text-slate-500">
                Hien nhanh cac booking moi de admin xu ly va lien he lai.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4 font-semibold">Ma don</th>
                  <th className="pb-3 pr-4 font-semibold">Khach</th>
                  <th className="pb-3 pr-4 font-semibold">Tour</th>
                  <th className="pb-3 pr-4 font-semibold">Tong tien</th>
                  <th className="pb-3 font-semibold">Trang thai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <tr key={booking._id || booking.orderCode} className="align-top">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-900">{booking.orderCode}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {booking.createdAt ? formatDateVi(booking.createdAt) : "Moi tao"}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {booking.contactInfo?.fullName || booking.user?.fullName || "Khach le"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {booking.tour?.title || "Tour chua ro"}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {formatVnd(booking.totalAmount)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            booking.bookingStatus
                          )}`}
                        >
                          {booking.bookingStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                      Chua co booking moi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

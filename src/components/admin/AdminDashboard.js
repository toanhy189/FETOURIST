"use client";

import { useEffect, useMemo, useState } from "react";
import { getUsers } from "@/apiService/auth";
import { getBookingsForAdmin } from "@/apiService/bookings";
import { getToursForAdmin } from "@/apiService/tours";
import { formatVnd } from "@/utils/format";

const MONTH_LABELS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

// Đếm tổng số khách trong một booking từ người lớn, trẻ em và em bé.
function getGuestCount(booking) {
  const guests = booking?.guests || {};
  return Number(guests.adults || 0) + Number(guests.children || 0) + Number(guests.infants || 0);
}

// Trả về bộ class màu cho badge trạng thái booking.
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

// Xác định booking nào được tính vào doanh thu: chỉ loại các booking đã huỷ.
function isRevenueBooking(booking) {
  return booking?.bookingStatus !== "cancelled";
}

// Lấy số tiền doanh thu của một booking, booking không hợp lệ sẽ trả về 0.
function getRevenueAmount(booking) {
  if (!isRevenueBooking(booking)) {
    return 0;
  }

  return Number(booking?.totalAmount || 0);
}

// Gom doanh thu theo từng tháng trong năm hiện tại để vẽ biểu đồ.
function buildMonthlyRevenueSeries(bookings, today = new Date()) {
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();
  const monthlyTotals = Array.from({ length: currentMonthIndex + 1 }, (_, monthIndex) => ({
    label: MONTH_LABELS[monthIndex],
    amount: 0,
  }));

  bookings.forEach((booking) => {
    const bookingDate = booking?.createdAt ? new Date(booking.createdAt) : null;
    if (!bookingDate || Number.isNaN(bookingDate.getTime())) {
      return;
    }

    if (bookingDate.getFullYear() !== currentYear) {
      return;
    }

    const monthIndex = bookingDate.getMonth();
    if (!monthlyTotals[monthIndex]) {
      return;
    }

    monthlyTotals[monthIndex].amount += getRevenueAmount(booking);
  });

  return monthlyTotals;
}

// Tổng hợp danh sách tour được đặt nhiều nhất từ các booking hiện có.
function buildTopTours(bookings, tours) {
  const tourLookup = tours.reduce((lookup, tour) => {
    [tour?.id, tour?._id, tour?.slug].filter(Boolean).forEach((tourKey) => {
      lookup.set(tourKey, tour);
    });

    return lookup;
  }, new Map());

  const grouped = bookings.reduce((accumulator, booking) => {
    const key = booking.tour?._id || booking.tour?.id || booking.tour?.slug || booking.orderCode;
    const matchedTour = tourLookup.get(key) || booking.tour;
    const current = accumulator.get(key) || {
      key,
      id: matchedTour?.id || matchedTour?._id || matchedTour?.slug || "--",
      title: matchedTour?.title || "Tour chua ro ten",
      bookedSeats: 0,
      remainingSeats: null,
    };

    current.bookedSeats += getGuestCount(booking);

    const nextRemainingSeats =
      booking?.departure?.remainingSeats ?? matchedTour?.upcomingDepartures?.[0]?.remainingSeats;
    if (Number.isFinite(Number(nextRemainingSeats))) {
      const parsedRemainingSeats = Number(nextRemainingSeats);
      current.remainingSeats =
        current.remainingSeats === null
          ? parsedRemainingSeats
          : Math.min(current.remainingSeats, parsedRemainingSeats);
    }

    accumulator.set(key, current);
    return accumulator;
  }, new Map());

  return Array.from(grouped.values())
    .sort((left, right) => {
      if (right.bookedSeats !== left.bookedSeats) {
        return right.bookedSeats - left.bookedSeats;
      }

      return (left.remainingSeats ?? Number.MAX_SAFE_INTEGER) - (right.remainingSeats ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 6);
}

function getBookingTimestamp(booking) {
  const parsedDate = booking?.createdAt ? new Date(booking.createdAt) : null;

  return parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : 0;
}

function sortBookingsNewestFirst(bookings) {
  return [...bookings].sort((left, right) => getBookingTimestamp(right) - getBookingTimestamp(left));
}

async function getAllBookingsForDashboard() {
  const pageSize = 100;
  const maxPages = 50;
  let page = 1;
  let summary = null;
  let pagination = null;
  const bookings = [];
  const seenBookingKeys = new Set();

  do {
    const result = await getBookingsForAdmin({
      page,
      limit: pageSize,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    summary = result.summary || summary;
    pagination = result.pagination || null;

    (result.bookings || []).forEach((booking) => {
      const key = booking?._id || booking?.orderCode;

      if (!key || seenBookingKeys.has(key)) {
        return;
      }

      seenBookingKeys.add(key);
      bookings.push(booking);
    });

    page += 1;
  } while (pagination?.hasNextPage && page <= maxPages);

  return {
    bookings: sortBookingsNewestFirst(bookings),
    summary,
  };
}

// Tính doanh thu tổng, theo tháng, quý và năm từ danh sách booking.
function buildRevenueStats(bookings, today = new Date()) {
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();
  const currentQuarterIndex = Math.floor(currentMonthIndex / 3);
  const totalRevenue = bookings.reduce((total, booking) => total + getRevenueAmount(booking), 0);

  return bookings.reduce(
    (totals, booking) => {
      const revenueAmount = getRevenueAmount(booking);
      const bookingDate = booking?.createdAt ? new Date(booking.createdAt) : null;

      if (!bookingDate || Number.isNaN(bookingDate.getTime()) || revenueAmount <= 0) {
        return totals;
      }

      if (bookingDate.getFullYear() !== currentYear) {
        return totals;
      }

      totals.yearRevenue += revenueAmount;

      if (bookingDate.getMonth() === currentMonthIndex) {
        totals.monthRevenue += revenueAmount;
      }

      if (Math.floor(bookingDate.getMonth() / 3) === currentQuarterIndex) {
        totals.quarterRevenue += revenueAmount;
      }

      return totals;
    },
    {
      totalRevenue,
      monthRevenue: 0,
      quarterRevenue: 0,
      yearRevenue: 0,
    }
  );
}

// Rút gọn số tiền trên trục biểu đồ thành triệu hoặc tỷ cho dễ nhìn.
function formatRevenueAxisLabel(value) {
  if (value >= 1000000000) {
    const billions = value / 1000000000;
    const roundedBillions = billions >= 10 ? Math.round(billions) : Math.round(billions * 10) / 10;
    return `${roundedBillions} tỷ`;
  }

  if (value >= 1000000) {
    const millions = value / 1000000;
    const roundedMillions = millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10;
    return `${roundedMillions} triệu`;
  }

  return `${Math.round(value)} đ`;
}

// Tìm mốc lớn nhất của biểu đồ để chia vạch trục Y hợp lý.
function getChartMaxValue(series) {
  const maxValue = Math.max(...series.map((item) => item.amount), 0);
  if (maxValue <= 0) {
    return 4000000000;
  }

  const roughStep = maxValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const niceStep =
    normalizedStep <= 1
      ? 1
      : normalizedStep <= 2
        ? 2
        : normalizedStep <= 5
          ? 5
          : 10;

  return niceStep * magnitude * 4;
}

// Component biểu đồ doanh thu theo tháng bằng SVG.
function RevenueChart({ series, loading }) {
  const chartWidth = 760;
  const chartHeight = 320;
  const chartPadding = { top: 24, right: 22, bottom: 44, left: 58 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const maxValue = getChartMaxValue(series);
  const tickValues = Array.from({ length: 5 }, (_, index) => (maxValue / 4) * (4 - index));
  const safeStepX = series.length > 1 ? plotWidth / (series.length - 1) : plotWidth / 2;
  const points = series.map((item, index) => {
    const x = series.length > 1
      ? chartPadding.left + safeStepX * index
      : chartPadding.left + plotWidth / 2;
    const y = chartPadding.top + plotHeight - ((item.amount || 0) / maxValue) * plotHeight;
    return { ...item, x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${chartPadding.top + plotHeight} L ${points[0].x} ${chartPadding.top + plotHeight} Z`
    : "";

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="min-w-[680px]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[320px] w-full" role="img" aria-label="Biểu đồ doanh thu theo tháng">
          {tickValues.map((tickValue, index) => {
            const y = chartPadding.top + (plotHeight / 4) * index;
            return (
              <g key={tickValue}>
                <line
                  x1={chartPadding.left}
                  y1={y}
                  x2={chartWidth - chartPadding.right}
                  y2={y}
                  stroke="#dbe4f0"
                  strokeDasharray="4 6"
                />
                <text x={12} y={y + 4} fill="#64748b" fontSize="11">
                  {formatRevenueAxisLabel(tickValue)}
                </text>
              </g>
            );
          })}

          <line
            x1={chartPadding.left}
            y1={chartPadding.top + plotHeight}
            x2={chartWidth - chartPadding.right}
            y2={chartPadding.top + plotHeight}
            stroke="#d1d9e6"
          />

          {!loading && points.length > 0 ? (
            <>
              <path d={areaPath} fill="url(#revenue-area-gradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="5" fill="#2563eb" />
                  <circle cx={point.x} cy={point.y} r="2.5" fill="#ffffff" />
                </g>
              ))}
            </>
          ) : null}

          {points.map((point) => (
            <text
              key={`${point.label}-label`}
              x={point.x}
              y={chartHeight - 12}
              textAnchor="middle"
              fill="#475569"
              fontSize="12"
              fontWeight="600"
            >
              {point.label}
            </text>
          ))}

          <defs>
            <linearGradient id="revenue-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.04" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// Card nhỏ dùng để hiển thị từng chỉ số doanh thu bên phải dashboard.
function RevenueSummaryCard({ label, value, loading }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-blue-600">
        {loading ? "--" : formatVnd(value)}
      </p>
    </div>
  );
}

// Icon mũi tên dùng cho section có thể mở/đóng.
function ChevronIcon({ isOpen }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

// Chuyển trạng thái booking từ key kỹ thuật sang tiếng Việt hiển thị.
function translateBookingStatus(status) {
  switch (status) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Đã xác nhận";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return "Đang xử lý";
  }
}

// Khung section có thể thu gọn/mở rộng để bọc các bảng bên dưới.
function CollapsibleTableSection({ title, description, isOpen, onToggle, children }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
          <ChevronIcon isOpen={isOpen} />
        </span>
      </button>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div
          className={`grid overflow-hidden transition-all duration-300 ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">{children}</div>
        </div>
      </div>
    </section>
  );
}

// Card thống kê lớn ở đầu dashboard.
function MetricCard({ label, value, description, tone = "sky" }) {
  const toneClassName =
    tone === "amber"
      ? "text-[#f26a3d]"
      : "text-[#16b8ad]";

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
      <p className="text-sm font-medium normal-case text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight sm:text-4xl ${toneClassName}`}>{value}</p>
      {description ? <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p> : null}
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
  const [isTopToursOpen, setIsTopToursOpen] = useState(true);
  const [isRecentBookingsOpen, setIsRecentBookingsOpen] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [userList, tourList, bookingList] = await Promise.all([
          getUsers(),
          getToursForAdmin({ limit: 50 }),
          getAllBookingsForDashboard(),
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
  const topTours = useMemo(() => buildTopTours(bookings, tours), [bookings, tours]);
  const recentBookings = useMemo(() => sortBookingsNewestFirst(bookings), [bookings]);
  const monthlyRevenueSeries = useMemo(() => buildMonthlyRevenueSeries(bookings), [bookings]);
  const revenueStats = useMemo(() => buildRevenueStats(bookings), [bookings]);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          label="Tổng số tours đang hoạt động"
          value={loading ? "--" : activeToursCount}
        />
        <MetricCard
          label="Tổng số lượt booking"
          value={loading ? "--" : summary?.totalBookings || 0}
          tone="emerald"
        />
        <MetricCard
          label="Số người dùng đăng ký"
          value={loading ? "--" : registeredUsersCount}
        />
        <MetricCard
          label="Tổng doanh thu"
          value={loading ? "--" : formatVnd(revenueStats.totalRevenue)}
          tone="amber"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Doanh thu theo tháng</h3>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi doanh thu của các booking không bị huỷ từ đầu năm đến hiện tại.
              </p>
            </div>
            {loading ? <p className="text-sm text-slate-400">Dang tai...</p> : null}
          </div>

          <RevenueChart series={monthlyRevenueSeries} loading={loading} />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Thống kê doanh thu</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tổng hợp doanh thu theo mốc thời gian để admin theo dõi nhanh.
              </p>
            </div>
            {loading ? <p className="text-sm text-slate-400">Dang tai...</p> : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <RevenueSummaryCard
              label="Tổng doanh thu"
              value={revenueStats.totalRevenue}
              loading={loading}
            />
            <RevenueSummaryCard
              label="Doanh thu tháng này"
              value={revenueStats.monthRevenue}
              loading={loading}
            />
            <RevenueSummaryCard
              label="Doanh thu quý này"
              value={revenueStats.quarterRevenue}
              loading={loading}
            />
            <RevenueSummaryCard
              label="Doanh thu năm nay"
              value={revenueStats.yearRevenue}
              loading={loading}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CollapsibleTableSection
          title="Tour được đặt nhiều nhất"
          description="Hiển thị các tour có tổng số chỗ đã đặt cao nhất từ danh sách booking admin."
          isOpen={isTopToursOpen}
          onToggle={() => setIsTopToursOpen((currentValue) => !currentValue)}
        >
          <div className="max-h-[420px] overflow-auto rounded-3xl border border-slate-200">
            <table className="min-w-[520px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3">Tên</th>
                  <th className="border-b border-slate-200 px-4 py-3">Số chỗ đã đặt</th>
                  <th className="border-b border-slate-200 px-4 py-3">Số chỗ còn trống</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {topTours.length > 0 ? (
                  topTours.map((tour) => (
                    <tr key={tour.key} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3 text-slate-700">{tour.title}</td>
                      <td className="px-4 py-3 text-slate-700">{tour.bookedSeats}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {tour.remainingSeats ?? "--"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                      Chưa có dữ liệu tour để tổng hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CollapsibleTableSection>

        <CollapsibleTableSection
          title="Đơn đặt mới"
          description="Hiển thị nhanh các booking mới để admin theo dõi và xử lý."
          isOpen={isRecentBookingsOpen}
          onToggle={() => setIsRecentBookingsOpen((currentValue) => !currentValue)}
        >
          <div className="max-h-[520px] overflow-auto rounded-3xl border border-slate-200">
            <table className="min-w-[640px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3">Họ và tên</th>
                  <th className="border-b border-slate-200 px-4 py-3">Tên tour</th>
                  <th className="border-b border-slate-200 px-4 py-3">Tổng tiền</th>
                  <th className="border-b border-slate-200 px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <tr key={booking._id || booking.orderCode} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3 text-slate-700">
                        {booking.contactInfo?.fullName || booking.user?.fullName || "Khách lẻ"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {booking.tour?.title || "Tour chưa rõ"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatVnd(booking.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            booking.bookingStatus
                          )}`}
                        >
                          {translateBookingStatus(booking.bookingStatus)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      Chưa có đơn đặt mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CollapsibleTableSection>
      </div>
    </section>
  );
}

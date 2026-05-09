"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBookingForAdmin,
  deleteBookingForAdmin,
  getBookingDetailForAdmin,
  getBookingsForAdmin,
  updateBookingForAdmin,
  updateBookingStatusForAdmin,
} from "@/apiService/bookings";
import { getUsers } from "@/apiService/auth";
import { getTourDeparturesForAdmin, getToursForAdmin } from "@/apiService/tours";
import { updatePaymentTransactionStatus } from "@/apiService/payments";
import BookingStatsRow from "./BookingStatsRow";
import BookingListCard from "./BookingListCard";
import CreateBookingModal from "./CreateBookingModal";
import UpdateBookingModal from "./UpdateBookingModal";
import BookingDetailModal from "./BookingDetailModal";

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
      <circle cx="11" cy="11" r="6.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SparkleBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-sky-100 backdrop-blur">
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
      Bảng điều khiển booking
    </div>
  );
}

export default function BookingsPanel() {
  const [users, setUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const loadBootstrap = useCallback(async () => {
    const [userList, tourList, bookingList] = await Promise.all([
      getUsers(),
      getToursForAdmin({ limit: 30 }),
      getBookingsForAdmin({ limit: 100 }),
    ]);

    setUsers(userList || []);
    setTours(tourList?.tours || []);
    setBookings(bookingList?.bookings || []);
    setSummary(bookingList?.summary || null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setLoadingBootstrap(true);

      try {
        const [userList, tourList, bookingList] = await Promise.all([
          getUsers(),
          getToursForAdmin({ limit: 30 }),
          getBookingsForAdmin({ limit: 100 }),
        ]);

        if (!isMounted) return;

        setUsers(userList || []);
        setTours(tourList?.tours || []);
        setBookings(bookingList?.bookings || []);
        setSummary(bookingList?.summary || null);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Không tải được dữ liệu booking.");
        }
      } finally {
        if (isMounted) {
          setLoadingBootstrap(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadDeparturesForTour = useCallback(async (tourId) => {
    if (!tourId) {
      setDepartures([]);
      return;
    }

    const result = await getTourDeparturesForAdmin(tourId, { limit: 50 });
    setDepartures(result?.departures || []);
  }, []);

  async function loadBookingDetail(orderCode) {
    setLoadingDetail(true);

    try {
      const detail = await getBookingDetailForAdmin(orderCode);
      setSelectedBooking(detail);
      return detail;
    } catch (actionError) {
      setError(actionError.message || "Không tải được chi tiết booking.");
      return null;
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleOpenView(booking) {
    clearFeedback();
    const detail = await loadBookingDetail(booking.orderCode);
    if (detail) setIsDetailOpen(true);
  }

  async function handleOpenEdit(booking) {
    clearFeedback();
    const detail = await loadBookingDetail(booking.orderCode);
    if (detail) setIsUpdateOpen(true);
  }

  async function handleCreateBooking(form) {
    clearFeedback();

    try {
      await createBookingForAdmin({
        userId: form.userId,
        tourId: form.tourId,
        departureId: form.departureId,
        guests: {
          adults: Number(form.adults),
          children: Number(form.children),
          infants: Number(form.infants),
        },
        contactInfo: {
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
        },
        paymentMethod: form.paymentMethod,
        bookingStatus: form.bookingStatus,
      });

      setMessage("Đã tạo booking thành công.");
      await loadBootstrap();
      setIsCreateOpen(false);
    } catch (actionError) {
      setError(actionError.message || "Không tạo được booking.");
      throw actionError;
    }
  }
  async function handleUpdateTransaction(transactionId, status) {
    if (!selectedBooking?.orderCode) return;

    clearFeedback();

    try {
      await updatePaymentTransactionStatus(transactionId, { status });
      setMessage("Đã cập nhật trạng thái giao dịch.");
      await Promise.all([
        loadBootstrap(),
        loadBookingDetail(selectedBooking.orderCode),
      ]);
    } catch (actionError) {
      setError(actionError.message || "Không cập nhật được giao dịch.");
    }
  }
  async function handleSaveBookingInfo(orderCode, payload) {
    clearFeedback();

    try {
      await updateBookingForAdmin(orderCode, payload);
      setMessage("Đã cập nhật booking.");
      await Promise.all([loadBootstrap(), loadBookingDetail(orderCode)]);
    } catch (actionError) {
      setError(actionError.message || "Không cập nhật được booking.");
      throw actionError;
    }
  }

  async function handleSaveBookingStatus(orderCode, payload) {
    clearFeedback();

    try {
      await updateBookingStatusForAdmin(orderCode, payload);
      setMessage("Đã cập nhật trạng thái booking.");
      await Promise.all([loadBootstrap(), loadBookingDetail(orderCode)]);
    } catch (actionError) {
      setError(actionError.message || "Không cập nhật được trạng thái booking.");
      throw actionError;
    }
  }

  async function handleDeleteBooking(orderCode) {
    clearFeedback();

    try {
      await deleteBookingForAdmin(orderCode);
      setMessage("Đã xóa booking.");
      setSelectedBooking(null);
      setIsUpdateOpen(false);
      setIsDetailOpen(false);
      await loadBootstrap();
    } catch (actionError) {
      setError(actionError.message || "Không xóa được booking.");
    }
  }


  const filteredBookings = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return bookings;

    return bookings.filter((booking) => {
      const orderCode = booking.orderCode?.toLowerCase() || "";
      const tourTitle = booking.tour?.title?.toLowerCase() || "";
      const userName = booking.user?.fullName?.toLowerCase() || "";
      const bookingStatus = booking.bookingStatus?.toLowerCase() || "";
      const paymentStatus = booking.paymentStatus?.toLowerCase() || "";

      return (
        orderCode.includes(normalized) ||
        tourTitle.includes(normalized) ||
        userName.includes(normalized) ||
        bookingStatus.includes(normalized) ||
        paymentStatus.includes(normalized)
      );
    });
  }, [bookings, keyword]);

  return (
    <section className="relative space-y-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px] overflow-hidden rounded-[40px]">
        <div className="absolute -left-24 top-6 h-56 w-56 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white shadow-[0_20px_80px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.18),transparent_28%),radial-gradient(circle_at_left,rgba(59,130,246,0.12),transparent_24%)]" />

        <div className="relative px-6 py-7 md:px-8 md:py-8">
          <div className="space-y-4">
            <SparkleBadge />
          </div>

          <div className="mt-8">
            <BookingStatsRow bookings={bookings} summary={summary} />
          </div>
        </div>
      </div>

      {(message || error) && (
        <div className="space-y-3">
          {message ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
              <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <div className="text-sm font-medium text-emerald-700">{message}</div>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 shadow-sm">
              <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
              <div className="text-sm font-medium text-rose-700">{error}</div>
            </div>
          ) : null}
        </div>
      )}

      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur md:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-800">
              Tìm kiếm booking
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>

              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Nhập mã booking, tên tour, khách hàng, trạng thái..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              clearFeedback();
              setIsCreateOpen(true);
            }}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <PlusIcon />
            Tạo booking
          </button>
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur md:p-4">
        {loadingBootstrap ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            <p className="text-sm font-medium text-slate-600">
              Đang tải dữ liệu booking...
            </p>
          </div>
        ) : (
          <BookingListCard
            bookings={filteredBookings}
            selectedOrderCode={selectedBooking?.orderCode}
            keyword={keyword}
            onKeywordChange={setKeyword}
            onView={handleOpenView}
            onEdit={handleOpenEdit}
          />
        )}
      </div>

      <CreateBookingModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        users={users}
        tours={tours}
        departures={departures}
        onLoadDepartures={loadDeparturesForTour}
        onSubmit={handleCreateBooking}
      />

      <UpdateBookingModal
        open={isUpdateOpen}
        booking={selectedBooking}
        tours={tours}
        departures={departures}
        onLoadDepartures={loadDeparturesForTour}
        onClose={() => setIsUpdateOpen(false)}
        onSaveInfo={handleSaveBookingInfo}
        onSaveStatus={handleSaveBookingStatus}
        onDelete={handleDeleteBooking}
        onUpdateTransaction={handleUpdateTransaction}
      />

      <BookingDetailModal
        open={isDetailOpen}
        booking={loadingDetail ? null : selectedBooking}
        onClose={() => setIsDetailOpen(false)}
      />
    </section>
  );
}

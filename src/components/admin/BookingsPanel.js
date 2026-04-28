"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createBookingForAdmin,
  deleteBookingForAdmin,
  getBookingDetailForAdmin,
  getBookingsForAdmin,
  updateBookingForAdmin,
  updateBookingStatusForAdmin,
} from "@/apiService/bookings";
import { getUsers } from "@/apiService/auth";
import { updatePaymentTransactionStatus } from "@/apiService/payments";
import { getTourDeparturesForAdmin, getToursForAdmin } from "@/apiService/tours";
import { formatDateVi, formatVnd } from "@/utils/format";

const PAYMENT_METHOD_LABELS = {
  cash: "Tiền mặt",
  vnpay: "VNPay",
};

const BOOKING_STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

const PAYMENT_STATUS_LABELS = {
  pending: "Chờ thanh toán",
  processing: "Đang xử lý",
  success: "Thành công",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  paid: "Đã thanh toán",
  partially_paid: "Đã thanh toán một phần",
  refunded: "Đã hoàn tiền",
};

function getPaymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || method || "--";
}

function getBookingStatusLabel(status) {
  return BOOKING_STATUS_LABELS[status] || status || "--";
}

function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status || "--";
}

const initialCreateForm = {
  userId: "",
  tourId: "",
  departureId: "",
  adults: 2,
  children: 0,
  infants: 0,
  fullName: "",
  email: "",
  phoneNumber: "",
  paymentMethod: "cash",
  bookingStatus: "pending",
};

const initialUpdateForm = {
  paymentMethod: "cash",
  depositAmount: "",
  note: "",
  specialRequest: "",
  bookingStatus: "pending",
  cancellationReason: "",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getBookingStatusClass(status) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "completed":
      return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
    case "cancelled":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }
}

function getPaymentStatusClass(status) {
  switch (status) {
    case "paid":
    case "success":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "partially_paid":
    case "processing":
      return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
    case "failed":
    case "cancelled":
    case "refunded":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

function SectionCard({ title, description, children, right }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {right}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function InputLabel({ label, required = false }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {label} {required ? <span className="text-rose-500">*</span> : null}
    </label>
  );
}

function FormInput(props) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition",
        "placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100",
        props.className
      )}
    />
  );
}

function FormSelect(props) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition",
        "focus:border-sky-500 focus:ring-4 focus:ring-sky-100",
        props.className
      )}
    />
  );
}

function FormTextarea(props) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition",
        "placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100",
        props.className
      )}
    />
  );
}

export default function BookingsPanel() {
  const [users, setUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [updateForm, setUpdateForm] = useState(initialUpdateForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [keyword, setKeyword] = useState("");

  async function loadBootstrap() {
    const [userList, tourList, bookingList] = await Promise.all([
      getUsers(),
      getToursForAdmin({ limit: 30 }),
      getBookingsForAdmin({ limit: 100 }),
    ]);

    setUsers(userList || []);
    setTours(tourList?.tours || []);
    setBookings(bookingList?.bookings || []);
    setSummary(bookingList?.summary || null);
  }

  async function loadDeparturesForTour(tourId) {
    if (!tourId) {
      setDepartures([]);
      return;
    }

    const result = await getTourDeparturesForAdmin(tourId, { limit: 50 });
    setDepartures(result?.departures || []);
  }

  async function openBooking(bookingIdOrCode) {
    setError("");
    setMessage("");
    setLoadingDetail(true);

    try {
      const detail = await getBookingDetailForAdmin(bookingIdOrCode);
      setSelectedBooking(detail);
      setUpdateForm({
        paymentMethod: detail.paymentMethod || "cash",
        depositAmount: detail.depositAmount || "",
        note: detail.note || "",
        specialRequest: detail.specialRequest || "",
        bookingStatus: detail.bookingStatus || "pending",
        cancellationReason: detail.cancellationReason || "",
      });
    } catch (actionError) {
      setError(actionError.message || "Không tải được chi tiết booking admin.");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCreateBooking(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await createBookingForAdmin({
        userId: createForm.userId,
        tourId: createForm.tourId,
        departureId: createForm.departureId,
        guests: {
          adults: Number(createForm.adults),
          children: Number(createForm.children),
          infants: Number(createForm.infants),
        },
        contactInfo: {
          fullName: createForm.fullName,
          email: createForm.email,
          phoneNumber: createForm.phoneNumber,
        },
        paymentMethod: createForm.paymentMethod,
        bookingStatus: createForm.bookingStatus,
      });

      setMessage("Đã tạo booking cho admin.");
      setCreateForm(initialCreateForm);
      setDepartures([]);
      await loadBootstrap();
    } catch (actionError) {
      setError(actionError.message || "Không tạo được booking.");
    }
  }

  async function handleUpdateBooking() {
    if (!selectedBooking?.orderCode) return;

    setError("");
    setMessage("");

    try {
      await updateBookingForAdmin(selectedBooking.orderCode, {
        paymentMethod: updateForm.paymentMethod,
        depositAmount: updateForm.depositAmount === "" ? undefined : Number(updateForm.depositAmount),
        note: updateForm.note,
        specialRequest: updateForm.specialRequest,
      });

      setMessage("Đã cập nhật booking.");
      await Promise.all([loadBootstrap(), openBooking(selectedBooking.orderCode)]);
    } catch (actionError) {
      setError(actionError.message || "Không cập nhật được booking.");
    }
  }

  async function handleUpdateStatus() {
    if (!selectedBooking?.orderCode) return;

    setError("");
    setMessage("");

    try {
      await updateBookingStatusForAdmin(selectedBooking.orderCode, {
        bookingStatus: updateForm.bookingStatus,
        cancellationReason:
          updateForm.bookingStatus === "cancelled" ? updateForm.cancellationReason : undefined,
      });

      setMessage("Đã cập nhật trạng thái booking.");
      await Promise.all([loadBootstrap(), openBooking(selectedBooking.orderCode)]);
    } catch (actionError) {
      setError(actionError.message || "Không đổi được trạng thái booking.");
    }
  }

  async function handleDeleteBooking(orderCode) {
    setError("");
    setMessage("");

    try {
      await deleteBookingForAdmin(orderCode);
      setMessage("Đã xóa booking.");
      setSelectedBooking(null);
      await loadBootstrap();
    } catch (actionError) {
      setError(actionError.message || "Không xóa được booking.");
    }
  }

  async function handleUpdateTransaction(transactionId, status) {
    setError("");
    setMessage("");

    try {
      await updatePaymentTransactionStatus(transactionId, { status });
      setMessage("Đã cập nhật trạng thái giao dịch.");
      if (selectedBooking?.orderCode) {
        await Promise.all([loadBootstrap(), openBooking(selectedBooking.orderCode)]);
      }
    } catch (actionError) {
      setError(actionError.message || "Không cập nhật được giao dịch.");
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrapBookings() {
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
          setError(loadError.message || "Không tải được dữ liệu bookings.");
        }
      } finally {
        if (isMounted) {
          setLoadingBootstrap(false);
        }
      }
    }

    void bootstrapBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return bookings;

    return bookings.filter((booking) => {
      const orderCode = booking.orderCode?.toLowerCase() || "";
      const tourTitle = booking.tour?.title?.toLowerCase() || "";
      const userName = booking.user?.fullName?.toLowerCase() || "";
      const bookingStatus = booking.bookingStatus?.toLowerCase() || "";
      const paymentStatus = booking.paymentStatus?.toLowerCase() || "";

      return (
        orderCode.includes(normalizedKeyword) ||
        tourTitle.includes(normalizedKeyword) ||
        userName.includes(normalizedKeyword) ||
        bookingStatus.includes(normalizedKeyword) ||
        paymentStatus.includes(normalizedKeyword)
      );
    });
  }, [bookings, keyword]);

  const totalPaidRevenue = useMemo(() => {
    return bookings.reduce((sum, booking) => {
      if (booking.paymentStatus === "paid") {
        return sum + Number(booking.totalAmount || 0);
      }
      return sum;
    }, 0);
  }, [bookings]);

  const totalPartiallyPaidRevenue = useMemo(() => {
    return bookings.reduce((sum, booking) => {
      if (booking.paymentStatus === "partially_paid") {
        return sum + Number(booking.depositAmount || 0);
      }
      return sum;
    }, 0);
  }, [bookings]);

  const actualRevenue = totalPaidRevenue + totalPartiallyPaidRevenue;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 px-6 py-7 text-white shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
            Booking Administration
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Quản lý booking</h2>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            Giao diện quản trị booking với danh sách, tạo mới, cập nhật trạng thái và theo dõi thanh toán.
          </p>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng booking" value={summary?.totalBookings || bookings.length || 0} hint="Tổng số đơn đặt tour" />
        <StatCard label="Đang chờ" value={summary?.pendingBookings || 0} hint="Booking cần xác nhận" />
        <StatCard label="Đã xác nhận" value={summary?.confirmedBookings || 0} hint="Booking đã được duyệt" />
        <StatCard label="Doanh thu thực tế" value={formatVnd(actualRevenue)} hint="Paid + tiền cọc của partially_paid" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px,minmax(0,1fr)]">
        <SectionCard
          title="Tạo booking mới"
          description="Tạo booking hộ khách hàng từ khu vực quản trị"
        >
          <form onSubmit={handleCreateBooking} className="space-y-5">
            <div>
              <InputLabel label="Người dùng" required />
              <FormSelect
                value={createForm.userId}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, userId: event.target.value }))
                }
                required
              >
                <option value="">Chọn user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} - {user.email}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <InputLabel label="Tour" required />
              <FormSelect
                value={createForm.tourId}
                onChange={async (event) => {
                  const nextTourId = event.target.value;
                  setCreateForm((current) => ({
                    ...current,
                    tourId: nextTourId,
                    departureId: "",
                  }));
                  await loadDeparturesForTour(nextTourId);
                }}
                required
              >
                <option value="">Chọn tour</option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.title}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <InputLabel label="Lịch khởi hành" required />
              <FormSelect
                value={createForm.departureId}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, departureId: event.target.value }))
                }
                required
              >
                <option value="">Chọn departure</option>
                {departures.map((departure) => (
                  <option key={departure.id} value={departure.id}>
                    {formatDateVi(departure.departureDate)} - {departure.status}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <InputLabel label="Người lớn" />
                <FormInput
                  type="number"
                  min="0"
                  value={createForm.adults}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, adults: event.target.value }))
                  }
                  placeholder="Adults"
                />
              </div>
              <div>
                <InputLabel label="Trẻ em" />
                <FormInput
                  type="number"
                  min="0"
                  value={createForm.children}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, children: event.target.value }))
                  }
                  placeholder="Children"
                />
              </div>
              <div>
                <InputLabel label="Em bé" />
                <FormInput
                  type="number"
                  min="0"
                  value={createForm.infants}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, infants: event.target.value }))
                  }
                  placeholder="Infants"
                />
              </div>
            </div>

            <div>
              <InputLabel label="Họ tên liên hệ" />
              <FormInput
                value={createForm.fullName}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, fullName: event.target.value }))
                }
                placeholder="Họ tên liên hệ"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel label="Email liên hệ" />
                <FormInput
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="Email liên hệ"
                />
              </div>
              <div>
                <InputLabel label="Số điện thoại" />
                <FormInput
                  value={createForm.phoneNumber}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, phoneNumber: event.target.value }))
                  }
                  placeholder="Số điện thoại"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel label="Phương thức thanh toán" />
                <FormSelect
                  value={createForm.paymentMethod}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, paymentMethod: event.target.value }))
                  }
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {getPaymentMethodLabel(method)}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <InputLabel label="Trạng thái booking" />
                <FormSelect
                  value={createForm.bookingStatus}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, bookingStatus: event.target.value }))
                  }
                >
                  {BOOKING_STATUSES.filter((status) => status !== "completed" && status !== "cancelled").map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Tạo booking
            </button>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title={`Danh sách booking (${filteredBookings.length})`}
            description="Hiển thị đầy đủ booking, có ô tìm kiếm và cuộn trong khung"
            right={
              <div className="w-full max-w-xs">
                <FormInput
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm theo mã, tour, khách hàng..."
                />
              </div>
            }
          >
            {loadingBootstrap ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Đang tải dữ liệu booking...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Không có booking phù hợp.
              </div>
            ) : (
              <div className="max-h-[720px] space-y-4 overflow-y-auto pr-2">
                {filteredBookings.map((booking) => {
                  const isActive = selectedBooking?.orderCode === booking.orderCode;

                  return (
                    <article
                      key={booking._id || booking.orderCode}
                      className={cn(
                        "rounded-[26px] border bg-white p-5 shadow-sm transition-all",
                        isActive
                          ? "border-sky-300 ring-4 ring-sky-100"
                          : "border-slate-200 hover:-translate-y-0.5 hover:shadow-md"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                              {booking.orderCode}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                                getBookingStatusClass(booking.bookingStatus)
                              )}
                            >
                              {booking.bookingStatus}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                                getPaymentStatusClass(booking.paymentStatus)
                              )}
                            >
                              {booking.paymentStatus}
                            </span>
                          </div>

                          <h4 className="mt-3 line-clamp-1 text-lg font-semibold text-slate-900">
                            {booking.tour?.title || "Chưa có tên tour"}
                          </h4>

                          <div className="mt-3 grid gap-3 text-sm text-slate-500 md:grid-cols-3">
                            <p>
                              <span className="font-medium text-slate-700">Khách:</span>{" "}
                              {booking.user?.fullName || "--"}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">Thanh toán:</span>{" "}
                              {booking.paymentMethod || "--"}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">Tổng tiền:</span>{" "}
                              <span className="font-semibold text-slate-900">
                                {formatVnd(booking.totalAmount || 0)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openBooking(booking.orderCode)}
                          className={cn(
                            "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                            isActive
                              ? "bg-sky-700 text-white"
                              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          {isActive ? "Đang xem" : "Chi tiết"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.05fr]">
            <SectionCard
              title="Cập nhật booking"
              description={
                selectedBooking
                  ? `Chỉnh sửa booking ${selectedBooking.orderCode}`
                  : "Chọn một booking ở danh sách để chỉnh sửa"
              }
            >
              {!selectedBooking ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Chưa chọn booking nào.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <InputLabel label="Tiền cọc" />
                      <FormInput
                        type="number"
                        min="0"
                        value={updateForm.depositAmount}
                        onChange={(event) =>
                          setUpdateForm((current) => ({
                            ...current,
                            depositAmount: event.target.value,
                          }))
                        }
                        placeholder="Deposit amount"
                      />
                    </div>
                    <div>
                      <InputLabel label="Phương thức thanh toán" />
                      <FormSelect
                        value={updateForm.paymentMethod}
                        onChange={(event) =>
                          setUpdateForm((current) => ({
                            ...current,
                            paymentMethod: event.target.value,
                          }))
                        }
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {getPaymentMethodLabel(method)}
                          </option>
                        ))}
                      </FormSelect>
                    </div>
                  </div>

                  <div>
                    <InputLabel label="Yêu cầu đặc biệt" />
                    <FormInput
                      value={updateForm.specialRequest}
                      onChange={(event) =>
                        setUpdateForm((current) => ({
                          ...current,
                          specialRequest: event.target.value,
                        }))
                      }
                      placeholder="Special request"
                    />
                  </div>

                  <div>
                    <InputLabel label="Ghi chú" />
                    <FormTextarea
                      value={updateForm.note}
                      onChange={(event) =>
                        setUpdateForm((current) => ({
                          ...current,
                          note: event.target.value,
                        }))
                      }
                      placeholder="Note"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleUpdateBooking}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Lưu booking
                  </button>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <h4 className="text-base font-semibold text-slate-900">Trạng thái booking</h4>

                    <div className="mt-4 space-y-4">
                      <div>
                        <InputLabel label="Booking status" />
                        <FormSelect
                          value={updateForm.bookingStatus}
                          onChange={(event) =>
                            setUpdateForm((current) => ({
                              ...current,
                              bookingStatus: event.target.value,
                            }))
                          }
                        >
                          {BOOKING_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {getBookingStatusLabel(status)}
                            </option>
                          ))}
                        </FormSelect>
                      </div>

                      {updateForm.bookingStatus === "cancelled" ? (
                        <div>
                          <InputLabel label="Lý do hủy" />
                          <FormInput
                            value={updateForm.cancellationReason}
                            onChange={(event) =>
                              setUpdateForm((current) => ({
                                ...current,
                                cancellationReason: event.target.value,
                              }))
                            }
                            placeholder="Lý do hủy"
                          />
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleUpdateStatus}
                          className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                        >
                          Cập nhật status
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(selectedBooking.orderCode)}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Xóa booking
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title={selectedBooking ? `Chi tiết ${selectedBooking.orderCode}` : "Chi tiết booking"}
              description="Thông tin khách hàng, tour, thanh toán và giao dịch"
            >
              {!selectedBooking ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Chọn một booking để xem chi tiết.
                </div>
              ) : loadingDetail ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Đang tải chi tiết booking...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-[24px] bg-slate-900 p-5 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                          {selectedBooking.orderCode}
                        </p>
                        <h4 className="mt-2 text-xl font-bold">
                          {selectedBooking.tour?.title || "--"}
                        </h4>
                        <p className="mt-2 text-sm text-slate-300">
                          {selectedBooking.user?.fullName || "--"} •{" "}
                          {selectedBooking.user?.email || "Không có email"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                        <p className="text-xs text-slate-300">Tổng tiền booking</p>
                        <p className="mt-2 text-2xl font-bold">
                          {formatVnd(selectedBooking.totalAmount || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Khởi hành
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatDateVi(selectedBooking.departureDate)}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Trạng thái hiện tại
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                            getBookingStatusClass(selectedBooking.bookingStatus)
                          )}
                        >
                          {selectedBooking.bookingStatus}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                            getPaymentStatusClass(selectedBooking.paymentStatus)
                          )}
                        >
                          {selectedBooking.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Giao dịch thanh toán</h4>

                    <div className="mt-4 space-y-3">
                      {(selectedBooking.paymentTransactions || []).length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                          Chưa có giao dịch thanh toán.
                        </div>
                      ) : (
                        (selectedBooking.paymentTransactions || []).map((transaction) => (
                          <div
                            key={transaction._id}
                            className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {transaction.transactionCode}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {transaction.method} • {transaction.status}
                                </p>
                              </div>

                              <span
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                                  getPaymentStatusClass(transaction.status)
                                )}
                              >
                                {transaction.status}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {TRANSACTION_STATUSES.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleUpdateTransaction(transaction._id, status)}
                                  className={cn(
                                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                                    status === transaction.status
                                      ? "bg-slate-900 text-white"
                                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                  )}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import { useEffect, useState } from "react";
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

  async function loadBootstrap() {
    const [userList, tourList, bookingList] = await Promise.all([
      getUsers(),
      getToursForAdmin({ limit: 30 }),
      getBookingsForAdmin({ limit: 12 }),
    ]);

    setUsers(userList);
    setTours(tourList.tours);
    setBookings(bookingList.bookings);
    setSummary(bookingList.summary);
  }

  async function loadDeparturesForTour(tourId) {
    if (!tourId) {
      setDepartures([]);
      return;
    }

    const result = await getTourDeparturesForAdmin(tourId, { limit: 50 });
    setDepartures(result.departures);
  }

  async function openBooking(bookingIdOrCode) {
    setError("");
    setMessage("");

    try {
      const detail = await getBookingDetailForAdmin(bookingIdOrCode);
      setSelectedBooking(detail);
      setUpdateForm({
        paymentMethod: detail.paymentMethod,
        depositAmount: detail.depositAmount || "",
        note: detail.note || "",
        specialRequest: detail.specialRequest || "",
        bookingStatus: detail.bookingStatus,
        cancellationReason: detail.cancellationReason || "",
      });
    } catch (actionError) {
      setError(actionError.message || "Khong tai duoc chi tiet booking admin.");
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

      setMessage("Da tao booking cho admin.");
      setCreateForm(initialCreateForm);
      setDepartures([]);
      await loadBootstrap();
    } catch (actionError) {
      setError(actionError.message || "Khong tao duoc booking.");
    }
  }

  async function handleUpdateBooking() {
    if (!selectedBooking?.orderCode) {
      return;
    }

    try {
      await updateBookingForAdmin(selectedBooking.orderCode, {
        paymentMethod: updateForm.paymentMethod,
        depositAmount: updateForm.depositAmount === "" ? undefined : Number(updateForm.depositAmount),
        note: updateForm.note,
        specialRequest: updateForm.specialRequest,
      });

      setMessage("Da cap nhat booking.");
      await Promise.all([loadBootstrap(), openBooking(selectedBooking.orderCode)]);
    } catch (actionError) {
      setError(actionError.message || "Khong cap nhat duoc booking.");
    }
  }

  async function handleUpdateStatus() {
    if (!selectedBooking?.orderCode) {
      return;
    }

    try {
      await updateBookingStatusForAdmin(selectedBooking.orderCode, {
        bookingStatus: updateForm.bookingStatus,
        cancellationReason:
          updateForm.bookingStatus === "cancelled" ? updateForm.cancellationReason : undefined,
      });

      setMessage("Da cap nhat trang thai booking.");
      await Promise.all([loadBootstrap(), openBooking(selectedBooking.orderCode)]);
    } catch (actionError) {
      setError(actionError.message || "Khong doi duoc trang thai booking.");
    }
  }

  async function handleDeleteBooking(orderCode) {
    try {
      await deleteBookingForAdmin(orderCode);
      setMessage("Da xoa booking.");
      setSelectedBooking(null);
      await loadBootstrap();
    } catch (actionError) {
      setError(actionError.message || "Khong xoa duoc booking.");
    }
  }

  async function handleUpdateTransaction(transactionId, status) {
    try {
      await updatePaymentTransactionStatus(transactionId, { status });
      setMessage("Da cap nhat trang thai giao dich.");
      if (selectedBooking?.orderCode) {
        await Promise.all([loadBootstrap(), openBooking(selectedBooking.orderCode)]);
      }
    } catch (actionError) {
      setError(actionError.message || "Khong cap nhat duoc giao dich.");
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrapBookings() {
      try {
        const [userList, tourList, bookingList] = await Promise.all([
          getUsers(),
          getToursForAdmin({ limit: 30 }),
          getBookingsForAdmin({ limit: 12 }),
        ]);

        if (!isMounted) {
          return;
        }

        setUsers(userList);
        setTours(tourList.tours);
        setBookings(bookingList.bookings);
        setSummary(bookingList.summary);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Khong tai duoc du lieu bookings.");
        }
      }
    }

    void bootstrapBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-display text-3xl text-slate-900">Booking manager</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Panel nay dung admin create/list/detail/update/status/delete booking va doi status giao dich thanh toan.
        </p>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <form onSubmit={handleCreateBooking} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Tao booking ho user</h3>
          <select value={createForm.userId} onChange={(event) => setCreateForm((current) => ({ ...current, userId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" required>
            <option value="">Chon user</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.fullName} - {user.email}</option>)}
          </select>
          <select value={createForm.tourId} onChange={async (event) => { const nextTourId = event.target.value; setCreateForm((current) => ({ ...current, tourId: nextTourId, departureId: "" })); await loadDeparturesForTour(nextTourId); }} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" required>
            <option value="">Chon tour</option>
            {tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.title}</option>)}
          </select>
          <select value={createForm.departureId} onChange={(event) => setCreateForm((current) => ({ ...current, departureId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" required>
            <option value="">Chon departure</option>
            {departures.map((departure) => <option key={departure.id} value={departure.id}>{formatDateVi(departure.departureDate)} - {departure.status}</option>)}
          </select>
          <div className="grid gap-3 sm:grid-cols-3">
            <input value={createForm.adults} onChange={(event) => setCreateForm((current) => ({ ...current, adults: event.target.value }))} placeholder="Adults" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={createForm.children} onChange={(event) => setCreateForm((current) => ({ ...current, children: event.target.value }))} placeholder="Children" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={createForm.infants} onChange={(event) => setCreateForm((current) => ({ ...current, infants: event.target.value }))} placeholder="Infants" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          </div>
          <input value={createForm.fullName} onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Ho ten lien he" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email lien he" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={createForm.phoneNumber} onChange={(event) => setCreateForm((current) => ({ ...current, phoneNumber: event.target.value }))} placeholder="So dien thoai" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={createForm.paymentMethod} onChange={(event) => setCreateForm((current) => ({ ...current, paymentMethod: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="cash">cash</option><option value="bank_transfer">bank_transfer</option><option value="credit_card">credit_card</option><option value="e_wallet">e_wallet</option>
            </select>
            <select value={createForm.bookingStatus} onChange={(event) => setCreateForm((current) => ({ ...current, bookingStatus: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="pending">pending</option><option value="confirmed">confirmed</option>
            </select>
          </div>
          <button type="submit" className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white">Tao booking</button>
        </form>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Tong booking</p><p className="mt-2 text-3xl font-bold text-slate-900">{summary?.totalBookings || 0}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Pending</p><p className="mt-2 text-3xl font-bold text-slate-900">{summary?.pendingBookings || 0}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Confirmed</p><p className="mt-2 text-3xl font-bold text-slate-900">{summary?.confirmedBookings || 0}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Total amount</p><p className="mt-2 text-3xl font-bold text-slate-900">{formatVnd(summary?.totalAmount)}</p></div>
          </div>

          {bookings.map((booking) => (
            <article key={booking._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-sky-700">{booking.orderCode}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{booking.tour?.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{booking.user?.fullName} • {booking.bookingStatus} • {booking.paymentStatus}</p>
                </div>
                <button type="button" onClick={() => openBooking(booking.orderCode)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">Chi tiet</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedBooking ? (
        <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Cap nhat booking</h3>
            <input value={updateForm.depositAmount} onChange={(event) => setUpdateForm((current) => ({ ...current, depositAmount: event.target.value }))} placeholder="Deposit amount" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <select value={updateForm.paymentMethod} onChange={(event) => setUpdateForm((current) => ({ ...current, paymentMethod: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="cash">cash</option><option value="bank_transfer">bank_transfer</option><option value="credit_card">credit_card</option><option value="e_wallet">e_wallet</option>
            </select>
            <input value={updateForm.specialRequest} onChange={(event) => setUpdateForm((current) => ({ ...current, specialRequest: event.target.value }))} placeholder="Special request" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={updateForm.note} onChange={(event) => setUpdateForm((current) => ({ ...current, note: event.target.value }))} placeholder="Note" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <button type="button" onClick={handleUpdateBooking} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Luu booking</button>

            <div className="pt-4">
              <h4 className="text-base font-semibold text-slate-900">Trang thai booking</h4>
              <div className="mt-3 grid gap-3">
                <select value={updateForm.bookingStatus} onChange={(event) => setUpdateForm((current) => ({ ...current, bookingStatus: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="pending">pending</option><option value="confirmed">confirmed</option><option value="cancelled">cancelled</option><option value="completed">completed</option>
                </select>
                {updateForm.bookingStatus === "cancelled" ? <input value={updateForm.cancellationReason} onChange={(event) => setUpdateForm((current) => ({ ...current, cancellationReason: event.target.value }))} placeholder="Ly do huy" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" /> : null}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleUpdateStatus} className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white">Cap nhat status</button>
                  <button type="button" onClick={() => handleDeleteBooking(selectedBooking.orderCode)} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">Xoa booking</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Chi tiet {selectedBooking.orderCode}</h3>
            <p className="text-sm text-slate-600">{selectedBooking.user?.fullName} • {selectedBooking.tour?.title}</p>
            <p className="text-sm text-slate-500">Khoi hanh {formatDateVi(selectedBooking.departureDate)}</p>
            <p className="text-sm font-semibold text-sky-800">{formatVnd(selectedBooking.totalAmount)}</p>

            <div className="space-y-2 pt-2">
              {(selectedBooking.paymentTransactions || []).map((transaction) => (
                <div key={transaction._id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.transactionCode}</p>
                      <p className="text-sm text-slate-500">{transaction.method} • {transaction.status}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["pending", "processing", "success", "failed", "cancelled"].map((status) => (
                        <button key={status} type="button" onClick={() => handleUpdateTransaction(transaction._id, status)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

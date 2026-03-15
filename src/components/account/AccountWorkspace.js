"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getMyBookingDetail, getMyBookingHistory } from "@/apiService/bookings";
import { getMyFavorites, removeFavorite } from "@/apiService/favorites";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/apiService/notifications";
import {
  createPaymentSession,
  getMyBookingPaymentDetail,
  getMyPaymentHistory,
  simulateGatewayCallback,
} from "@/apiService/payments";
import { useAppContext } from "@/components/providers/AppProvider";
import { getAnonymousId } from "@/utils/anonymousUtils";
import { cn } from "@/utils/cn";
import { formatDateTimeVi, formatDateVi, formatVnd } from "@/utils/format";

const tabs = [
  { key: "tong-quan", label: "Tong quan" },
  { key: "booking", label: "Booking" },
  { key: "payment", label: "Thanh toan" },
  { key: "favorite", label: "Yeu thich" },
  { key: "notification", label: "Thong bao" },
];

function Card({ title, description, children, action }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-slate-900">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function AccountWorkspace() {
  const { currentUser, isAdmin, isAuthenticated, notificationCount, refreshNotifications } =
    useAppContext();
  const [activeTab, setActiveTab] = useState("tong-quan");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState({});
  const [history, setHistory] = useState({ bookings: [], summary: null });
  const [payments, setPayments] = useState({ transactions: [], summary: null });
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [recentTours, setRecentTours] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    method: "bank_transfer",
    transactionType: "full_payment",
    amount: "",
    transactionCode: "",
    result: "success",
  });

  function patchLoading(key, value) {
    setLoading((current) => ({ ...current, [key]: value }));
  }

  function pushFeedback(nextMessage = "", nextError = "") {
    setMessage(nextMessage);
    setError(nextError);
  }

  const loadDashboard = useCallback(async () => {
    const [historyResult, favoriteResult, paymentResult, notificationResult] =
      await Promise.allSettled([
        getMyBookingHistory({ limit: 8 }),
        getMyFavorites({ limit: 8 }),
        getMyPaymentHistory({ limit: 8 }),
        getMyNotifications({ limit: 8 }),
      ]);

    if (historyResult.status === "fulfilled") {
      setHistory(historyResult.value);
    }
    if (favoriteResult.status === "fulfilled") {
      setFavorites(favoriteResult.value.favorites);
    }
    if (paymentResult.status === "fulfilled") {
      setPayments(paymentResult.value);
    }
    if (notificationResult.status === "fulfilled") {
      setNotifications(notificationResult.value.notifications);
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  async function openBooking(orderCode) {
    patchLoading("bookingDetail", true);
    pushFeedback();

    try {
      const [bookingDetail, paymentDetail] = await Promise.all([
        getMyBookingDetail(orderCode),
        getMyBookingPaymentDetail(orderCode),
      ]);

      setSelectedBooking(bookingDetail);
      setSelectedPaymentDetail(paymentDetail);
      setPaymentForm((current) => ({
        ...current,
        transactionCode: paymentDetail.transactions?.[0]?.transactionCode || "",
      }));
    } catch (loadError) {
      setError(loadError.message || "Khong tai duoc chi tiet booking.");
    } finally {
      patchLoading("bookingDetail", false);
    }
  }

  async function handleCreatePayment(event) {
    event.preventDefault();
    if (!selectedBooking?.orderCode) {
      return;
    }

    patchLoading("createPayment", true);
    pushFeedback();

    try {
      const result = await createPaymentSession({
        bookingIdOrCode: selectedBooking.orderCode,
        method: paymentForm.method,
        transactionType: paymentForm.transactionType,
        amount: paymentForm.amount ? Number(paymentForm.amount) : undefined,
      });

      setPaymentForm((current) => ({
        ...current,
        transactionCode: result.transaction?.transactionCode || "",
      }));
      setMessage(`Da tao phien ${result.transaction?.transactionCode}.`);
      await Promise.all([loadDashboard(), openBooking(selectedBooking.orderCode)]);
    } catch (actionError) {
      setError(actionError.message || "Khong tao duoc phien thanh toan.");
    } finally {
      patchLoading("createPayment", false);
    }
  }

  async function handleMockPayment(event) {
    event.preventDefault();
    patchLoading("mockPayment", true);
    pushFeedback();

    try {
      await simulateGatewayCallback({
        transactionCode: paymentForm.transactionCode,
        result: paymentForm.result,
        gatewayTransactionId: `GW-${Date.now()}`,
      });

      setMessage("Da cap nhat callback thanh toan mo phong.");
      if (selectedBooking?.orderCode) {
        await Promise.all([loadDashboard(), openBooking(selectedBooking.orderCode)]);
      }
    } catch (actionError) {
      setError(actionError.message || "Khong xu ly duoc callback thanh toan.");
    } finally {
      patchLoading("mockPayment", false);
    }
  }

  async function handleRemoveFavorite(slug) {
    patchLoading(`favorite-${slug}`, true);
    pushFeedback();

    try {
      await removeFavorite(slug);
      setMessage("Da bo tour khoi danh sach yeu thich.");
      await loadDashboard();
    } catch (actionError) {
      setError(actionError.message || "Khong xoa duoc tour yeu thich.");
    } finally {
      patchLoading(`favorite-${slug}`, false);
    }
  }

  async function handleMarkNotification(notificationId) {
    patchLoading(`notification-${notificationId}`, true);
    pushFeedback();

    try {
      await markNotificationAsRead(notificationId);
      await loadDashboard();
    } catch (actionError) {
      setError(actionError.message || "Khong cap nhat duoc thong bao.");
    } finally {
      patchLoading(`notification-${notificationId}`, false);
    }
  }

  async function handleMarkAllNotifications() {
    patchLoading("notificationAll", true);
    pushFeedback();

    try {
      await markAllNotificationsAsRead();
      setMessage("Da danh dau tat ca thong bao.");
      await loadDashboard();
    } catch (actionError) {
      setError(actionError.message || "Khong cap nhat duoc tat ca thong bao.");
    } finally {
      patchLoading("notificationAll", false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void loadDashboard();
  }, [isAuthenticated, loadDashboard]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const key = `${"betourist.recentTours."}${getAnonymousId()}`;
    setRecentTours(JSON.parse(localStorage.getItem(key) || "[]"));
  }, []);

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-4xl text-slate-900">Dang nhap de mo dashboard</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sau khi dang nhap, ban co the xem booking, thanh toan, yeu thich va thong bao.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dang-nhap" className="rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white">
            Dang nhap
          </Link>
          <Link href="/dang-ky" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">
            Tao tai khoan
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Trang tai khoan</p>
            <h1 className="mt-2 font-display text-4xl text-slate-900">{currentUser?.fullName}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {currentUser?.email} {currentUser?.phoneNumber ? `• ${currentUser.phoneNumber}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  activeTab === tab.key
                    ? "border-sky-300 bg-sky-100 text-sky-800"
                    : "border-slate-200 bg-white text-slate-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </section>

      {activeTab === "tong-quan" ? (
        <Card
          title="Tong quan tai khoan"
          description="So lieu nay dang duoc tong hop tu booking, payment, favorite va notification."
          action={isAdmin ? <Link href="/quan-tri" className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800">Mo quan tri</Link> : null}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Tong booking</p><p className="mt-2 text-3xl font-bold text-slate-900">{history.summary?.totalBookings || 0}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Booking sap toi</p><p className="mt-2 text-3xl font-bold text-slate-900">{history.summary?.upcomingBookings || 0}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Yeu thich</p><p className="mt-2 text-3xl font-bold text-slate-900">{favorites.length}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Thong bao chua doc</p><p className="mt-2 text-3xl font-bold text-slate-900">{notificationCount}</p></div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-display text-2xl text-slate-900">Booking gan day</h3>
              <div className="mt-4 space-y-3">
                {history.bookings.slice(0, 3).map((booking) => (
                  <button key={booking._id} type="button" onClick={() => { setActiveTab("booking"); openBooking(booking.orderCode); }} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
                    <div><p className="font-semibold text-slate-900">{booking.orderCode}</p><p className="text-sm text-slate-500">{booking.tour?.title}</p></div>
                    <p className="text-sm font-semibold text-sky-800">{formatVnd(booking.totalAmount)}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-display text-2xl text-slate-900">Tour da xem gan day</h3>
              <div className="mt-4 space-y-3">
                {recentTours.length > 0 ? recentTours.slice(0, 4).map((tour) => (
                  <Link key={tour.slug} href={`/tour/${tour.slug}`} className="block rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="font-semibold text-slate-900">{tour.title}</p>
                    <p className="text-sm text-slate-500">{tour.destination}</p>
                  </Link>
                )) : <p className="text-sm text-slate-500">Chua co tour nao duoc luu trong local recent views.</p>}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {activeTab === "booking" ? (
        <Card title="Quan ly booking" description="Mo chi tiet tung booking, tao phien thanh toan va mock callback ngay tai day.">
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-4">
              {history.bookings.map((booking) => (
                <button key={booking._id} type="button" onClick={() => openBooking(booking.orderCode)} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="text-xs uppercase tracking-wide text-sky-700">{booking.orderCode}</p><h3 className="mt-1 text-lg font-semibold text-slate-900">{booking.tour?.title}</h3><p className="mt-1 text-sm text-slate-500">Khoi hanh {formatDateVi(booking.departureDate)}</p></div>
                    <div className="text-right text-sm text-slate-500"><p>{booking.bookingStatus}</p><p>{booking.paymentStatus}</p><p className="font-semibold text-sky-800">{formatVnd(booking.totalAmount)}</p></div>
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              {loading.bookingDetail ? <p className="text-sm text-slate-500">Dang tai chi tiet booking...</p> : selectedBooking ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{selectedBooking.orderCode}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{selectedBooking.tour?.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">Khoi hanh {formatDateVi(selectedBooking.departureDate)}</p>
                    <p className="mt-2 text-sm text-slate-600">Tong tien: {formatVnd(selectedBooking.totalAmount)}</p>
                  </div>
                  <form onSubmit={handleCreatePayment} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900">Tao phien thanh toan</p>
                    <div className="mt-3 grid gap-3">
                      <select value={paymentForm.method} onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <option value="bank_transfer">Chuyen khoan</option>
                        <option value="cash">Tien mat</option>
                        <option value="credit_card">The tin dung</option>
                        <option value="e_wallet">Vi dien tu</option>
                        <option value="momo">MoMo</option>
                        <option value="zalopay">ZaloPay</option>
                        <option value="vnpay">VNPay</option>
                      </select>
                      <select value={paymentForm.transactionType} onChange={(event) => setPaymentForm((current) => ({ ...current, transactionType: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <option value="full_payment">Thanh toan toan bo</option>
                        <option value="deposit">Thanh toan coc</option>
                      </select>
                      <input value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} placeholder="So tien tuy chon" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                      <button type="submit" disabled={loading.createPayment} className="rounded-2xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300">{loading.createPayment ? "Dang tao..." : "Tao phien"}</button>
                    </div>
                  </form>
                  <form onSubmit={handleMockPayment} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900">Mock callback</p>
                    <div className="mt-3 grid gap-3">
                      <input value={paymentForm.transactionCode} onChange={(event) => setPaymentForm((current) => ({ ...current, transactionCode: event.target.value }))} placeholder="Transaction code" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                      <select value={paymentForm.result} onChange={(event) => setPaymentForm((current) => ({ ...current, result: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <option value="success">success</option>
                        <option value="failed">failed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <button type="submit" disabled={loading.mockPayment} className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 disabled:bg-slate-100">{loading.mockPayment ? "Dang xu ly..." : "Gui callback"}</button>
                    </div>
                  </form>
                  {selectedPaymentDetail ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="font-semibold text-slate-900">Tong quan thanh toan</p>
                      <p className="mt-2 text-sm text-slate-600">Da tra: {formatVnd(selectedPaymentDetail.paymentOverview?.paidAmount)}</p>
                      <p className="mt-1 text-sm text-slate-600">Con lai: {formatVnd(selectedPaymentDetail.paymentOverview?.remainingAmount)}</p>
                    </div>
                  ) : null}
                </>
              ) : <p className="text-sm text-slate-500">Chon 1 booking de xem chi tiet.</p>}
            </div>
          </div>
        </Card>
      ) : null}

      {activeTab === "payment" ? (
        <Card title="Lich su thanh toan" description="Tong hop giao dich thanh toan tu /api/payments/me.">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Tong giao dich</p><p className="mt-2 text-3xl font-bold text-slate-900">{payments.summary?.totalTransactions || 0}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Thanh cong</p><p className="mt-2 text-3xl font-bold text-slate-900">{payments.summary?.successfulTransactions || 0}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Dang xu ly</p><p className="mt-2 text-3xl font-bold text-slate-900">{payments.summary?.pendingTransactions || 0}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Net paid</p><p className="mt-2 text-3xl font-bold text-slate-900">{formatVnd(payments.summary?.netPaidAmount)}</p></div>
          </div>
          <div className="mt-6 space-y-3">
            {payments.transactions.map((transaction) => (
              <div key={transaction._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-xs uppercase tracking-wide text-sky-700">{transaction.transactionCode}</p><h3 className="mt-1 text-lg font-semibold text-slate-900">Booking {transaction.booking?.orderCode}</h3></div>
                  <div className="text-right text-sm text-slate-500"><p>{transaction.method}</p><p>{transaction.status}</p><p className="font-semibold text-sky-800">{formatVnd(transaction.amount)}</p></div>
                </div>
                <p className="mt-2 text-sm text-slate-500">{formatDateTimeVi(transaction.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeTab === "favorite" ? (
        <Card title="Danh sach yeu thich" description="Tour da luu cua ban.">
          <div className="grid gap-4 md:grid-cols-2">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-sky-700">{favorite.tour?.category?.name || "Tour"}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{favorite.tour?.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{favorite.tour?.destination}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/tour/${favorite.tour?.slug}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Xem tour</Link>
                  <button type="button" onClick={() => handleRemoveFavorite(favorite.tour?.slug)} disabled={loading[`favorite-${favorite.tour?.slug}`]} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:bg-slate-100">Bo yeu thich</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeTab === "notification" ? (
        <Card title="Thong bao" description="Thong bao booking va thanh toan cua ban." action={<button type="button" onClick={handleMarkAllNotifications} disabled={loading.notificationAll} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100">Doc tat ca</button>}>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification._id} className={cn("rounded-3xl border p-5 shadow-sm", notification.isRead ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50/70")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-xs uppercase tracking-wide text-sky-700">{notification.type}</p><h3 className="mt-1 text-lg font-semibold text-slate-900">{notification.title}</h3></div>
                  {!notification.isRead ? <button type="button" onClick={() => handleMarkNotification(notification._id)} disabled={loading[`notification-${notification._id}`]} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Da doc</button> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                <p className="mt-3 text-xs text-slate-400">{formatDateTimeVi(notification.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

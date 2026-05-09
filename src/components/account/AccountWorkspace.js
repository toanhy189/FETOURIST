"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
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
} from "@/apiService/payments";
import { useAppContext } from "@/components/providers/AppProvider";
import { cn } from "@/utils/cn";
import {
  getEmptyRecentToursSnapshot,
  getRecentToursSnapshot,
  refreshRecentToursFromServer,
  subscribeRecentTours,
} from "@/utils/recentTours";
import AccountCard from "./AccountCard";
import BookingTab from "./BookingTab";
import OverviewTab from "./OverviewTab";
import FavoriteTab from "./FavoriteTab";
import NotificationTab from "./NotificationTab";
import AccountProfileTab from "./AccountProfileTab";
import AccountPasswordTab from "./AccountPasswordTab";


export default function AccountWorkspace() {
  const {
    currentUser,
    isAdmin,
    isAuthenticated,
    notificationCount,
    refreshNotifications,
  } = useAppContext();
  const tabs = [
    { key: "tong-quan", label: "Tổng quan" },
    { key: "account", label: "Tài khoản" },
    { key: "booking", label: "Booking" },
    { key: "favorite", label: "Yêu thích" },
    { key: "notification", label: "Thông báo" },
    ...(currentUser?.isGoogleAccount ? [] : [{ key: "password", label: "Đổi mật khẩu" }]),
  ];
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
  const [paymentForm, setPaymentForm] = useState({
    method: "cash",
    transactionType: "full_payment",
    amount: "",
    transactionCode: "",
  });
  const recentTours = useSyncExternalStore(
    subscribeRecentTours,
    () => getRecentToursSnapshot({ limit: 8 }),
    getEmptyRecentToursSnapshot
  );

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
        getMyBookingHistory({ page: 1, limit: 50 }),
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
      setPaymentForm({
        method: ["cash", "vnpay"].includes(bookingDetail.paymentMethod)
          ? bookingDetail.paymentMethod
          : "cash",
        transactionType: "full_payment",
        amount: "",
        transactionCode: paymentDetail.transactions?.[0]?.transactionCode || "",
      });
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

      if (
        paymentForm.method === "vnpay" &&
        result?.nextAction === "redirect_to_payment_gateway" &&
        result?.paymentUrl
      ) {
        window.location.href = result.paymentUrl;
        return;
      }

      setPaymentForm((current) => ({
        ...current,
        transactionCode: result.transaction?.transactionCode || "",
      }));

      setMessage(
        result?.nextAction === "wait_manual_confirmation"
          ? "Đã tạo phiên thanh toán. Vui lòng hoàn tất thanh toán theo hướng dẫn."
          : `Đã tạo phiên ${result.transaction?.transactionCode}.`
      );

      await Promise.all([loadDashboard(), openBooking(selectedBooking.orderCode)]);
    } catch (actionError) {
      setError(actionError.message || "Không tạo được phiên thanh toán.");
    } finally {
      patchLoading("createPayment", false);
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
    if (!isAuthenticated) {
      return;
    }

    /**
     * Dashboard still renders local recent tours immediately through
     * useSyncExternalStore, then quietly refreshes from the server. If Redis or
     * the API is down, we intentionally keep the local snapshot instead of
     * clearing the panel.
     */
    refreshRecentToursFromServer().catch(() => {});
  }, [isAuthenticated]);

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
    <div className="grid w-full max-w-none gap-5 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
      <aside className="self-start rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
        <div className="mt-6 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex w-full items-center justify-start rounded-xl border-l-4 px-4 py-3 text-left text-sm font-semibold transition",
                activeTab === tab.key
                  ? "border-sky-300 bg-sky-100 text-sky-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}

          {isAdmin ? (
            <Link
              href="/admin"
              className="mt-2 flex w-full items-center justify-start rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
            >
              Quản trị
            </Link>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 w-full space-y-6">
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

        {activeTab === "tong-quan" ? (
          <AccountCard
            title="Tổng quan tài khoản"
          >
            <OverviewTab
              history={history}
              favorites={favorites}
              notificationCount={notificationCount}
              recentTours={recentTours}
              isAdmin={isAdmin}
              openBooking={openBooking}
              setActiveTab={setActiveTab}
            />
          </AccountCard>
        ) : null}
        {activeTab === "account" ? (
          <AccountCard
            title="Tài khoản"
            description="Thông tin cá nhân và cập nhật hồ sơ của bạn."
          >
            <AccountProfileTab currentUser={currentUser} />
          </AccountCard>
        ) : null}

        {activeTab === "booking" ? (
          <AccountCard
            title="Đặt tour & thanh toán"
          >
            <BookingTab
              bookings={history.bookings}
              payments={payments}
              loading={loading}
              selectedBooking={selectedBooking}
              selectedPaymentDetail={selectedPaymentDetail}
              paymentForm={paymentForm}
              setPaymentForm={setPaymentForm}
              openBooking={openBooking}
              handleCreatePayment={handleCreatePayment}
            />
          </AccountCard>
        ) : null}

        {activeTab === "favorite" ? (
          <AccountCard
          >
            <FavoriteTab
              favorites={favorites}
              loading={loading}
              handleRemoveFavorite={handleRemoveFavorite}
            />
          </AccountCard>
        ) : null}

        {activeTab === "notification" ? (
          <AccountCard
          >
            <NotificationTab
              notifications={notifications}
              loading={loading}
              handleMarkNotification={handleMarkNotification}
              handleMarkAllNotifications={handleMarkAllNotifications}
            />
          </AccountCard>
        ) : null}

        {activeTab === "password" && !currentUser?.isGoogleAccount ? (
          <AccountCard
            title="Đổi mật khẩu"
            description="Cập nhật mật khẩu đăng nhập của bạn."
          >
            <AccountPasswordTab />
          </AccountCard>
        ) : null}
      </div>
    </div>
  );
}

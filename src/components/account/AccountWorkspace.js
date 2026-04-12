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
import AccountCard from "./AccountCard";
import BookingTab from "./BookingTab";
import PaymentTab from "./PaymentTab";
import OverviewTab from "./OverviewTab";
import FavoriteTab from "./FavoriteTab";
import NotificationTab from "./NotificationTab";

const tabs = [
  { key: "tong-quan", label: "Tong quan" },
  { key: "booking", label: "Booking" },
  { key: "payment", label: "Thanh toan" },
  { key: "favorite", label: "Yeu thich" },
  { key: "notification", label: "Thong bao" },
];

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
        <AccountCard
          title="Tổng quan tài khoản"
          description="Tóm tắt nhanh booking, yêu thích và thông báo mới nhất của bạn."
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

      {activeTab === "booking" ? (
        <AccountCard
          title="Quan ly booking"
          description="Mo chi tiet tung booking, tao phien thanh toan va mock callback ngay tai day."
        >
          <BookingTab
            bookings={history.bookings}
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

      {activeTab === "payment" ? (
        <AccountCard
          title="Lịch sử thanh toán"
          description="Theo dõi trạng thái giao dịch và số tiền bạn đã thanh toán cho các booking."
        >
          <PaymentTab payments={payments} />
        </AccountCard>
      ) : null}

      {activeTab === "favorite" ? (
        <AccountCard
          title="Danh sách yêu thích"
          description="Lưu lại những tour bạn muốn xem lại hoặc đặt sau."
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
          title="Thông báo"
          description="Cập nhật booking và thanh toán của bạn sẽ hiển thị tại đây."
        >
          <NotificationTab
            notifications={notifications}
            loading={loading}
            handleMarkNotification={handleMarkNotification}
            handleMarkAllNotifications={handleMarkAllNotifications}
          />
        </AccountCard>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateBookingPreview,
  createBooking,
} from "@/apiService/bookings";
import { addFavorite, getMyFavorites, removeFavorite } from "@/apiService/favorites";
import { getTourDepartures } from "@/apiService/tours";
import { useAppContext } from "@/components/providers/AppProvider";
import { getAnonymousId } from "@/utils/anonymousUtils";
import { cn } from "@/utils/cn";
import { formatDateVi, formatVnd } from "@/utils/format";
import { createPaymentSession } from "@/apiService/payments";
const paymentMethods = [
  { value: "cash", label: "Tien mat" },
  { value: "bank_transfer", label: "Chuyen khoan" },
  { value: "credit_card", label: "The tin dung" },
  { value: "e_wallet", label: "Vi dien tu" },
  { value: "vnpay", label: "VNPay" },
];

const initialGuestForm = {
  adults: 2,
  children: 0,
  infants: 0,
};

function toNumber(value, fallback = 0) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function readRecentTours() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storageKey = `betourist.recentTours.${getAnonymousId()}`;
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function saveRecentTour(tour) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = `betourist.recentTours.${getAnonymousId()}`;
  const currentTours = readRecentTours().filter((item) => item.slug !== tour.slug);
  const nextTours = [
    {
      slug: tour.slug,
      title: tour.title,
      destination: tour.destination,
      viewedAt: new Date().toISOString(),
    },
    ...currentTours,
  ].slice(0, 8);

  localStorage.setItem(storageKey, JSON.stringify(nextTours));
}

function FeedbackBox({ message, tone = "info" }) {
  if (!message) {
    return null;
  }

  const toneClassName = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[tone];

  return <div className={cn("rounded-2xl border px-4 py-3 text-sm", toneClassName)}>{message}</div>;
}

export default function TourBookingSidebar({ tour }) {
  const { currentUser, isAuthenticated, refreshNotifications } = useAppContext();
  const [departures, setDepartures] = useState(tour.upcomingDepartures || []);
  const [selectedDepartureId, setSelectedDepartureId] = useState(tour.upcomingDepartures?.[0]?.id || "");
  const [guests, setGuests] = useState(initialGuestForm);
  const [favoriteNote, setFavoriteNote] = useState("");
  const [bookingPreview, setBookingPreview] = useState(null);
  const [latestBooking, setLatestBooking] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingKey, setLoadingKey] = useState("");
  const [bookingForm, setBookingForm] = useState({
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
    phoneNumber: currentUser?.phoneNumber || "",
    paymentMethod: "cash",
    depositAmount: "",
    specialRequest: "",
    note: "",
  });

  const selectedDeparture = useMemo(
    () => departures.find((departure) => departure.id === selectedDepartureId) || null,
    [departures, selectedDepartureId]
  );

  function patchBookingField(field, value) {
    setBookingForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function patchGuests(field, value) {
    setGuests((currentGuests) => ({
      ...currentGuests,
      [field]: Math.max(0, toNumber(value, 0)),
    }));
  }

  function pushFeedback(nextMessage = "", nextError = "") {
    setMessage(nextMessage);
    setError(nextError);
  }

  const loadDepartures = useCallback(async () => {
    try {
      const result = await getTourDepartures(tour.id, { limit: 10 });
      setDepartures(result.departures);
      setSelectedDepartureId((currentId) => {
        const matchedDeparture = result.departures.find((departure) => departure.id === currentId);
        return matchedDeparture?.id || result.departures[0]?.id || "";
      });
    } catch (loadError) {
      setError(loadError.message || "Khong tai duoc lich khoi hanh.");
    }
  }, [tour.id]);

  const loadFavoriteState = useCallback(async () => {
    if (!isAuthenticated) {
      setIsFavorite(false);
      setFavoriteNote("");
      return;
    }

    try {
      const result = await getMyFavorites({ limit: 50 });
      const activeFavorite = result.favorites.find((favorite) => favorite.tour?.slug === tour.slug);
      setIsFavorite(Boolean(activeFavorite));
      setFavoriteNote(activeFavorite?.note || "");
    } catch {
      setIsFavorite(false);
    }
  }, [isAuthenticated, tour.slug]);

  async function handlePreviewBooking() {
    if (!selectedDepartureId) {
      pushFeedback("", "Hay chon mot lich khoi hanh truoc.");
      return;
    }

    if (!isAuthenticated) {
      pushFeedback("", "Ban can dang nhap de tinh preview booking.");
      return;
    }

    setLoadingKey("preview");
    pushFeedback();

    try {
      const preview = await calculateBookingPreview({
        departureId: selectedDepartureId,
        guests: {
          adults: guests.adults,
          children: guests.children,
          infants: guests.infants,
        },
      });

      setBookingPreview(preview);
      setLatestBooking(null);
      pushFeedback("Da tinh xong chi phi tam tinh.");
    } catch (actionError) {
      setBookingPreview(null);
      pushFeedback("", actionError.message || "Khong tinh duoc preview booking.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleCreateBooking(event) {
    event.preventDefault();

    if (!selectedDepartureId) {
      pushFeedback("", "Hay chon mot lich khoi hanh truoc.");
      return;
    }

    if (!isAuthenticated) {
      pushFeedback("", "Ban can dang nhap de dat tour.");
      return;
    }

    setLoadingKey("booking");
    pushFeedback();

    try {
      const booking = await createBooking({
        tourId: tour.id,
        departureId: selectedDepartureId,
        guests: {
          adults: guests.adults,
          children: guests.children,
          infants: guests.infants,
        },
        contactInfo: {
          fullName: bookingForm.fullName,
          email: bookingForm.email,
          phoneNumber: bookingForm.phoneNumber,
        },
        paymentMethod: bookingForm.paymentMethod,
        depositAmount:
          bookingForm.depositAmount === "" ? undefined : Number(bookingForm.depositAmount),
        specialRequest: bookingForm.specialRequest,
        note: bookingForm.note,
      });

      setLatestBooking(booking);
      setBookingPreview(null);
      await Promise.allSettled([loadDepartures(), refreshNotifications()]);
      if (bookingForm.paymentMethod === "vnpay") {
        pushFeedback("Đang chuyển hướng sang cổng thanh toán VNPay...");

        const paymentSession = await createPaymentSession({
          bookingIdOrCode: booking.orderCode,
          method: "vnpay",
          transactionType: bookingForm.depositAmount ? "deposit" : "full_payment"
        });

        // Chuyển hướng trình duyệt sang URL thanh toán của VNPay
        if (paymentSession.paymentUrl) {
          window.location.href = paymentSession.paymentUrl;
          return; // Dừng luồng tại đây để trình duyệt chuyển hướng
        }
      }
      pushFeedback(`Da tao booking ${booking.orderCode}. Ban co the theo doi trong trang tai khoan.`);
    } catch (actionError) {
      pushFeedback("", actionError.message || "Khong tao duoc booking.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleToggleFavorite() {
    if (!isAuthenticated) {
      pushFeedback("", "Ban can dang nhap de luu tour yeu thich.");
      return;
    }

    setLoadingKey("favorite");
    pushFeedback();

    try {
      if (isFavorite) {
        await removeFavorite(tour.slug);
        setIsFavorite(false);
        pushFeedback("Da bo tour khoi danh sach yeu thich.");
      } else {
        await addFavorite({
          tourIdOrSlug: tour.slug,
          note: favoriteNote,
        });
        setIsFavorite(true);
        pushFeedback("Da them tour vao danh sach yeu thich.");
      }
    } catch (actionError) {
      pushFeedback("", actionError.message || "Khong cap nhat duoc yeu thich.");
    } finally {
      setLoadingKey("");
    }
  }

  useEffect(() => {
    // Recent views dung anonymous id de guest va user deu co lich su xem tour.
    saveRecentTour(tour);
    void loadDepartures();
  }, [loadDepartures, tour]);

  useEffect(() => {
    setBookingForm((currentForm) => ({
      ...currentForm,
      fullName: currentUser?.fullName || "",
      email: currentUser?.email || "",
      phoneNumber: currentUser?.phoneNumber || "",
    }));
  }, [currentUser?.email, currentUser?.fullName, currentUser?.phoneNumber]);

  useEffect(() => {
    void loadFavoriteState();
  }, [loadFavoriteState]);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-slate-900">Dat tour that</h2>
            <p className="mt-2 text-sm text-slate-600">
              Sidebar nay dang goi API departures, favorite, booking preview va create booking.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={loadingKey === "favorite"}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-semibold transition",
              isFavorite
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-900"
            )}
          >
            {loadingKey === "favorite"
              ? "Dang luu..."
              : isFavorite
                ? "Da yeu thich"
                : "Luu yeu thich"}
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Gia tham khao</p>
          <p className="mt-1 text-3xl font-bold text-sky-800">{formatVnd(tour.displayPrice)}</p>
          <p className="mt-1 text-xs text-slate-500">/ khach, gia cu the duoc tinh theo departure da chon</p>
        </div>

        <div className="mt-4 space-y-3">
          <FeedbackBox message={message} tone="success" />
          <FeedbackBox message={error} tone="error" />
        </div>

        <form onSubmit={handleCreateBooking} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Lich khoi hanh
            <select
              value={selectedDepartureId}
              onChange={(event) => setSelectedDepartureId(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            >
              <option value="">Chon departure</option>
              {departures.map((departure) => (
                <option key={departure.id} value={departure.id}>
                  {formatDateVi(departure.departureDate)} | Con {departure.remainingSeats} cho
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Nguoi lon
              <input
                type="number"
                min={1}
                value={guests.adults}
                onChange={(event) => patchGuests("adults", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Tre em
              <input
                type="number"
                min={0}
                value={guests.children}
                onChange={(event) => patchGuests("children", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Em be
              <input
                type="number"
                min={0}
                value={guests.infants}
                onChange={(event) => patchGuests("infants", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-700">
              Ho ten lien he
              <input
                value={bookingForm.fullName}
                onChange={(event) => patchBookingField("fullName", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                placeholder="Nguyen Van A"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={bookingForm.email}
                  onChange={(event) => patchBookingField("email", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                  placeholder="you@example.com"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                So dien thoai
                <input
                  value={bookingForm.phoneNumber}
                  onChange={(event) => patchBookingField("phoneNumber", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                  placeholder="09xx xxx xxx"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Cach thanh toan
              <select
                value={bookingForm.paymentMethod}
                onChange={(event) => patchBookingField("paymentMethod", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              So tien coc
              <input
                type="number"
                min={0}
                value={bookingForm.depositAmount}
                onChange={(event) => patchBookingField("depositAmount", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                placeholder="Bo trong neu chua coc"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Ghi chu yeu thich
            <input
              value={favoriteNote}
              onChange={(event) => setFavoriteNote(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              placeholder="Vi du: uu tien khach san gan bien"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Yeu cau dac biet
            <textarea
              value={bookingForm.specialRequest}
              onChange={(event) => patchBookingField("specialRequest", event.target.value)}
              className="mt-1 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              placeholder="An chay, ghe ngoi gan nhau, phong don..."
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Ghi chu cho booking
            <textarea
              value={bookingForm.note}
              onChange={(event) => patchBookingField("note", event.target.value)}
              className="mt-1 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              placeholder="Thong tin them cho dieu hanh"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handlePreviewBooking}
              disabled={loadingKey === "preview"}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800 disabled:bg-slate-100"
            >
              {loadingKey === "preview" ? "Dang tinh..." : "Tinh preview"}
            </button>
            <button
              type="submit"
              disabled={loadingKey === "booking"}
              className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:bg-slate-200"
            >
              {loadingKey === "booking" ? "Dang dat..." : "Dat tour ngay"}
            </button>
          </div>
        </form>

        {!isAuthenticated ? (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-900">
            Ban can dang nhap truoc khi luu yeu thich hoac dat tour.
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/dang-nhap" className="rounded-full bg-sky-700 px-4 py-2 text-xs font-semibold text-white">
                Dang nhap
              </Link>
              <Link href="/dang-ky" className="rounded-full border border-sky-300 bg-white px-4 py-2 text-xs font-semibold text-sky-800">
                Tao tai khoan
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {selectedDeparture ? (
        <section className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Departure dang chon</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {formatDateVi(selectedDeparture.departureDate)} - {formatDateVi(selectedDeparture.returnDate)}
          </h3>
          <p className="mt-2 text-sm text-slate-600">Diem hen: {selectedDeparture.meetingPoint || "Se thong bao sau"}</p>
          <p className="mt-1 text-sm text-slate-600">Cho con lai: {selectedDeparture.remainingSeats}</p>
          <p className="mt-2 text-xl font-bold text-sky-800">{formatVnd(selectedDeparture.displayPrice)}</p>
        </section>
      ) : null}

      {bookingPreview ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Preview booking</p>
          <p className="mt-2 text-sm text-slate-700">
            {bookingPreview.guests?.totalGuests || 0} khach | Don gia {formatVnd(bookingPreview.pricing?.unitPrice)}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Giam moi khach {formatVnd(bookingPreview.pricing?.discountPerGuest || 0)}
          </p>
          <p className="mt-3 text-2xl font-bold text-emerald-800">{formatVnd(bookingPreview.totalAmount)}</p>
        </section>
      ) : null}

      {latestBooking ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Booking vua tao</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{latestBooking.orderCode}</h3>
          <p className="mt-2 text-sm text-slate-700">Trang thai: {latestBooking.bookingStatus} | Thanh toan: {latestBooking.paymentStatus}</p>
          <p className="mt-1 text-sm text-slate-700">Tong tien: {formatVnd(latestBooking.totalAmount)}</p>
          <Link
            href="/tai-khoan"
            className="mt-4 inline-flex rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
          >
            Mo trang tai khoan
          </Link>
        </section>
      ) : null}

      <section className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
        <p className="font-semibold text-slate-900">Thong tin nhanh</p>
        <p className="mt-3 text-sm text-slate-600">Khoi hanh tu: {tour.departureLocation}</p>
        <p className="mt-1 text-sm text-slate-600">Diem den: {tour.destination}</p>
        <p className="mt-1 text-sm text-slate-600">Ngay gan nhat: {formatDateVi(tour.firstStartDate)}</p>
        <Link
          href="/danh-muc"
          className="mt-4 inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Quay lai danh muc
        </Link>
      </section>
    </div>
  );
}

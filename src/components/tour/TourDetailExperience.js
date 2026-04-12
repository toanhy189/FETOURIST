"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { calculateBookingPreview, createBooking } from "@/apiService/bookings";
import { addFavorite, getMyFavorites, removeFavorite } from "@/apiService/favorites";
import { getTourDepartures } from "@/apiService/tours";
import { useAppContext } from "@/components/providers/AppProvider";
import { cn } from "@/utils/cn";
import {
  formatDateRangeVi,
  formatDateVi,
  formatVnd,
  formatWeekdayDateVi,
} from "@/utils/format";
import { summarizeItineraryStep } from "@/utils/tourItinerary";

const paymentMethodOptions = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank_transfer", label: "Chuyển khoản" },
  { value: "credit_card", label: "Thẻ tín dụng" },
  { value: "e_wallet", label: "Ví điện tử" },
  { value: "vnpay", label: "VNPAY" },
];

const guestFieldConfigs = [
  { key: "adults", label: "Người lớn", hint: "> 9 tuổi", min: 1 },
  { key: "children", label: "Trẻ em", hint: "5 - 9 tuổi", min: 0 },
  { key: "infants", label: "Trẻ nhỏ", hint: "< 5 tuổi", min: 0 },
];

const initialGuests = {
  adults: 2,
  children: 0,
  infants: 0,
};

const CALENDAR_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: `Th${String(index + 1).padStart(2, "0")}`,
}));

const CALENDAR_WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function CalendarIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M8 2v4M16 2v4M3.5 9.5h17" />
      <rect x="3" y="5" width="18" height="16" rx="3" />
    </svg>
  );
}

function PinIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function TicketIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 8.5A2.5 2.5 0 0 0 6.5 6H17.5A2.5 2.5 0 0 0 20 8.5V10a2 2 0 1 0 0 4v1.5A2.5 2.5 0 0 0 17.5 18H6.5A2.5 2.5 0 0 0 4 15.5V14a2 2 0 1 0 0-4Z" />
      <path d="M12 7v10" strokeDasharray="2.5 2.5" />
    </svg>
  );
}

function HeartIcon({ filled = false, className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 20.5 4.8 13.6a4.8 4.8 0 0 1 6.8-6.8L12 7.2l.4-.4a4.8 4.8 0 1 1 6.8 6.8L12 20.5Z" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckCircleIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.8 12 2.2 2.3 4.3-4.6" />
    </svg>
  );
}

function InfoIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.2v5.2M12 7.9h.01" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

function getGalleryImages(tour) {
  return [...new Set([tour.imageUrl, ...(Array.isArray(tour.images) ? tour.images : [])].filter(Boolean))];
}

function getReferenceCode(tour) {
  const seed = String(tour.id || tour.slug || "BETOURIST").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `BT-${seed.slice(-6).padStart(6, "0")}`;
}

function getGuestsCount(guests) {
  return Number(guests.adults || 0) + Number(guests.children || 0) + Number(guests.infants || 0);
}

function getDeparturePrice(departure, fallbackPrice) {
  return typeof departure?.displayPrice === "number" ? departure.displayPrice : fallbackPrice;
}

function getBaseAmount(departure, guests, fallbackPrice) {
  return getDeparturePrice(departure, fallbackPrice) * getGuestsCount(guests);
}

function getSingleRoomSupplementAmount(singleRoomSupplement, guests) {
  return getGuestsCount(guests) === 1 ? Number(singleRoomSupplement || 0) : 0;
}

function getEstimatedTotal(departure, guests, fallbackPrice, singleRoomSupplement = 0) {
  return getBaseAmount(departure, guests, fallbackPrice) + getSingleRoomSupplementAmount(singleRoomSupplement, guests);
}

function getDurationLabel(tour) {
  if (!Number.isFinite(tour.durationDays) || !Number.isFinite(tour.durationNights)) {
    return "Lịch trình linh hoạt";
  }

  return `${tour.durationDays} ngày ${tour.durationNights} đêm`;
}

function getRatingMeta(tour) {
  if (Number.isFinite(tour.ratingAverage) && tour.ratingAverage > 0 && Number(tour.ratingCount || 0) > 0) {
    return {
      score: tour.ratingAverage.toFixed(1),
      label: `Rất tốt ${tour.ratingCount} đánh giá`,
    };
  }

  return null;
}

function getItineraryImage(step, galleryImages, index) {
  const stepImage = (Array.isArray(step?.blocks) ? step.blocks : []).find((block) => block?.type === "image" && block.url);
  if (stepImage?.url) {
    return stepImage.url;
  }

  return galleryImages[index + 1] || galleryImages[0] || "";
}

function createCalendarCursor(value) {
  const parsedDate = value ? new Date(value) : new Date();

  if (Number.isNaN(parsedDate.getTime())) {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }

  return { year: parsedDate.getFullYear(), month: parsedDate.getMonth() };
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function getDateKey(value) {
  const parsedDate = value ? new Date(value) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return `${parsedDate.getFullYear()}-${parsedDate.getMonth() + 1}-${parsedDate.getDate()}`;
}

function buildCalendarDays(year, month) {
  const firstDateOfMonth = new Date(year, month, 1);
  const startOffset = (firstDateOfMonth.getDay() + 6) % 7;
  const calendarStartDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => addDays(calendarStartDate, index));
}

function buildDeparturesByDate(departures) {
  return departures.reduce((departureMap, departure) => {
    const dateKey = getDateKey(departure?.departureDate);

    if (!dateKey) {
      return departureMap;
    }

    const currentDeparture = departureMap.get(dateKey);

    if (!currentDeparture || Number(departure.displayPrice || 0) < Number(currentDeparture.displayPrice || 0)) {
      departureMap.set(dateKey, departure);
    }

    return departureMap;
  }, new Map());
}

function getCalendarYears(departures, fallbackValue, activeYear) {
  const yearSet = new Set();

  departures.forEach((departure) => {
    const parsedDate = departure?.departureDate ? new Date(departure.departureDate) : null;

    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      yearSet.add(parsedDate.getFullYear());
    }
  });

  if (yearSet.size === 0) {
    yearSet.add(createCalendarCursor(fallbackValue).year);
  }

  if (Number.isInteger(activeYear)) {
    yearSet.add(activeYear);
  }

  const sortedYears = [...yearSet].sort((left, right) => left - right);
  const firstYear = sortedYears[0];
  const lastYear = sortedYears[sortedYears.length - 1];

  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
}

function getDeparturePriceRange(departures) {
  const prices = departures
    .map((departure) => Number(departure?.displayPrice))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

function formatCompactPrice(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  if (value >= 1000000) {
    const millionValue = value / 1000000;
    const fractionDigits = millionValue >= 10 || Number.isInteger(millionValue) ? 0 : 2;
    return `${millionValue.toFixed(fractionDigits).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}tr`;
  }

  return `${Math.round(value / 1000)}k`;
}

function createTourNotes(tour, selectedDeparture) {
  return [
    tour.transportLabel ? `Phương tiện dự kiến: ${tour.transportLabel}.` : null,
    selectedDeparture?.meetingPoint
      ? `Điểm hẹn hiện tại: ${selectedDeparture.meetingPoint}.`
      : "Điểm hẹn chi tiết sẽ được thông báo trước ngày khởi hành.",
    Number.isFinite(tour.maxGroupSize) ? `Quy mô đoàn tối đa khoảng ${tour.maxGroupSize} khách.` : null,
    selectedDeparture?.note || null,
    "Giá và số chỗ sẽ được chốt theo đợt khởi hành bạn chọn.",
    "Yêu cầu đặt tour chỉ được giữ chỗ khi hệ thống tạo booking thành công.",
  ].filter(Boolean);
}

function buildHighlightList(tour) {
  if (Array.isArray(tour.highlights) && tour.highlights.length > 0) {
    return tour.highlights;
  }

  return ["Lịch trình sẽ được cập nhật chi tiết khi có dữ liệu đầy đủ từ hệ thống."];
}

function normalizeLooseText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isGenericItineraryTitle(title, day) {
  return normalizeLooseText(title) === `ngay ${day}`;
}

function FeedbackBox({ message, tone = "info", className = "" }) {
  if (!message) {
    return null;
  }

  const toneClassName = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-800",
  }[tone];

  return <div className={cn("rounded-2xl border px-4 py-3 text-sm", toneClassName, className)}>{message}</div>;
}

function SectionCard({ title, action, children, className = "" }) {
  return (
    <section className={cn("rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]", className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function GuestCounter({ label, hint, value, onChange, min = 0, priceLabel = "" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>

      <div className="flex items-center gap-3">
        {priceLabel ? (
          <span className="whitespace-nowrap text-[13px] font-medium text-amber-600">
            {priceLabel}
          </span>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MinusIcon />
          </button>

          <span className="min-w-5 text-center text-sm font-bold text-slate-900">{value}</span>

          <button
            type="button"
            onClick={() => onChange(value + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function DisclosureCard({ title, open, onToggle, children }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left"
      >
        <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-900">{title}</h2>
        <ChevronDownIcon className={cn("h-5 w-5 text-slate-400 transition", open ? "rotate-180" : "")} />
      </button>
      {open ? <div className="border-t border-slate-100 px-6 pb-6 pt-5">{children}</div> : null}
    </section>
  );
}

export default function TourDetailExperience({ tour }) {
  const { currentUser, isAuthenticated, refreshNotifications } = useAppContext();
  const galleryImages = getGalleryImages(tour);
  const highlightList = buildHighlightList(tour);
  const ratingMeta = getRatingMeta(tour);
  const bookingSectionRef = useRef(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [departures, setDepartures] = useState(Array.isArray(tour.upcomingDepartures) ? tour.upcomingDepartures : []);
  const [selectedDepartureId, setSelectedDepartureId] = useState(tour.upcomingDepartures?.[0]?.id || "");
  const [guests, setGuests] = useState(initialGuests);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAllDepartures, setShowAllDepartures] = useState(false);
  const [expandedDays, setExpandedDays] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() =>
    createCalendarCursor(tour.upcomingDepartures?.[0]?.departureDate || tour.firstStartDate)
  );
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [openSections, setOpenSections] = useState({
    included: true,
    excluded: true,
    notes: false,
  });
  const [bookingForm, setBookingForm] = useState({
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
    phoneNumber: currentUser?.phoneNumber || "",
    paymentMethod: "cash",
    depositAmount: "",
    specialRequest: "",
    note: "",
  });
  const [bookingPreview, setBookingPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [latestBooking, setLatestBooking] = useState(null);
  const [favoriteNotice, setFavoriteNotice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoadingDepartures, setIsLoadingDepartures] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const selectedDeparture = departures.find((departure) => departure.id === selectedDepartureId) || null;
  const visibleDepartures = showAllDepartures ? departures : departures.slice(0, 6);
  const currentUnitPrice = bookingPreview?.pricing?.unitPrice ?? getDeparturePrice(selectedDeparture, tour.displayPrice);
  const totalGuests = getGuestsCount(guests);
  const calendarYears = getCalendarYears(
    departures,
    selectedDeparture?.departureDate || tour.firstStartDate,
    calendarCursor.year
  );
  const departuresByDate = buildDeparturesByDate(departures);
  const departurePriceRange = getDeparturePriceRange(departures);
  const calendarDays = buildCalendarDays(calendarCursor.year, calendarCursor.month);
  const baseAmount =
    typeof bookingPreview?.pricing?.baseAmount === "number"
      ? bookingPreview.pricing.baseAmount
      : getBaseAmount(selectedDeparture, guests, tour.displayPrice);
  const singleRoomSupplementAmount =
    typeof bookingPreview?.pricing?.singleRoomSupplement === "number"
      ? bookingPreview.pricing.singleRoomSupplement
      : getSingleRoomSupplementAmount(tour.singleRoomSupplement, guests);
  const isSingleRoomApplied =
    typeof bookingPreview?.pricing?.singleRoomApplied === "boolean"
      ? bookingPreview.pricing.singleRoomApplied
      : singleRoomSupplementAmount > 0;
  const totalAmount =
    typeof bookingPreview?.totalAmount === "number"
      ? bookingPreview.totalAmount
      : getEstimatedTotal(selectedDeparture, guests, tour.displayPrice, tour.singleRoomSupplement);
  const hasMultipleItineraryDays = tour.itinerary.length > 1;
  const itineraryAllExpanded = tour.itinerary.length > 0 && expandedDays.length === tour.itinerary.length;
  const noteItems = createTourNotes(tour, selectedDeparture);
  const isLightboxOpen = lightboxIndex >= 0;
  const isFavoritePopupOpen = Boolean(favoriteNotice);

  function patchBookingField(field, value) {
    setBookingForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function patchGuest(field, value) {
    const fieldConfig = guestFieldConfigs.find((item) => item.key === field);
    const nextValue = Math.max(fieldConfig?.min ?? 0, Number(value) || 0);

    setGuests((currentGuests) => ({
      ...currentGuests,
      [field]: nextValue,
    }));
  }

  function goToBookingStep(step) {
    setCurrentStep(step);
    bookingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openCalendarModal() {
    setCalendarCursor(createCalendarCursor(selectedDeparture?.departureDate || departures[0]?.departureDate || tour.firstStartDate));
    setIsCalendarOpen(true);
  }

  function closeCalendarModal() {
    setIsCalendarOpen(false);
  }

  function shiftCalendarMonth(offset) {
    setCalendarCursor((currentCursor) => {
      const nextDate = new Date(currentCursor.year, currentCursor.month + offset, 1);

      return {
        year: nextDate.getFullYear(),
        month: nextDate.getMonth(),
      };
    });
  }

  function handleCalendarMonthChange(event) {
    setCalendarCursor((currentCursor) => ({
      ...currentCursor,
      month: Number(event.target.value),
    }));
  }

  function handleCalendarYearChange(event) {
    setCalendarCursor((currentCursor) => ({
      ...currentCursor,
      year: Number(event.target.value),
    }));
  }

  function handleCalendarDateSelect(departure) {
    setSelectedDepartureId(departure.id);
    setCurrentStep(1);
    setIsCalendarOpen(false);
  }

  function toggleItineraryDay(day) {
    setExpandedDays((currentDays) =>
      currentDays.includes(day) ? currentDays.filter((item) => item !== day) : [...currentDays, day]
    );
  }

  function toggleAllItineraryDays() {
    setExpandedDays(itineraryAllExpanded ? [] : tour.itinerary.map((step) => step.day));
  }

  function openLightbox(index = activeImageIndex) {
    if (!galleryImages.length) {
      return;
    }

    setLightboxIndex(index);
  }

  const closeLightbox = useCallback(() => {
    setLightboxIndex(-1);
  }, []);

  const showPreviousLightboxImage = useCallback(() => {
    if (!galleryImages.length) {
      return;
    }

    setLightboxIndex((currentIndex) => (currentIndex <= 0 ? galleryImages.length - 1 : currentIndex - 1));
  }, [galleryImages.length]);

  const showNextLightboxImage = useCallback(() => {
    if (!galleryImages.length) {
      return;
    }

    setLightboxIndex((currentIndex) => (currentIndex + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const loadDepartures = useCallback(async () => {
    setIsLoadingDepartures(true);

    try {
      const result = await getTourDepartures(tour.id, { limit: 12 });
      setDepartures(result.departures);
      setSelectedDepartureId((currentId) => {
        const matchedDeparture = result.departures.find((departure) => departure.id === currentId);
        return matchedDeparture?.id || result.departures[0]?.id || "";
      });
    } catch (loadError) {
      setError(loadError.message || "Không tải được lịch khởi hành.");
    } finally {
      setIsLoadingDepartures(false);
    }
  }, [tour.id]);

  async function handleToggleFavorite() {
    if (!isAuthenticated) {
      setFavoriteNotice("Bạn cần đăng nhập để lưu tour yêu thích.");
      setMessage("");
      setError("");
      return;
    }

    setBusyAction("favorite");
    setFavoriteNotice("");
    setMessage("");
    setError("");

    try {
      if (isFavorite) {
        await removeFavorite(tour.slug);
        setIsFavorite(false);
        setMessage("Đã bỏ tour khỏi danh sách yêu thích.");
      } else {
        await addFavorite({ tourIdOrSlug: tour.slug, note: "" });
        setIsFavorite(true);
        setMessage("Đã lưu tour vào danh sách yêu thích.");
      }
    } catch (actionError) {
      setError(actionError.message || "Không cập nhật được trạng thái yêu thích.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleCreateBooking(event) {
    event.preventDefault();

    if (!selectedDepartureId) {
      setError("Vui lòng chọn ngày khởi hành trước khi gửi yêu cầu.");
      setMessage("");
      setCurrentStep(1);
      return;
    }

    if (!isAuthenticated) {
      setError("Bạn cần đăng nhập để tạo booking.");
      setMessage("");
      setCurrentStep(3);
      return;
    }

    setBusyAction("booking");
    setMessage("");
    setError("");

    try {
      const booking = await createBooking({
        tourId: tour.id,
        departureId: selectedDepartureId,
        guests,
        contactInfo: {
          fullName: bookingForm.fullName,
          email: bookingForm.email,
          phoneNumber: bookingForm.phoneNumber,
        },
        paymentMethod: bookingForm.paymentMethod,
        depositAmount: bookingForm.depositAmount === "" ? undefined : Number(bookingForm.depositAmount),
        specialRequest: bookingForm.specialRequest,
        note: bookingForm.note,
      });

      setLatestBooking(booking);
      setMessage(`Đã tạo booking ${booking.orderCode}. Bạn có thể theo dõi thêm trong trang tài khoản.`);
      setBookingPreview(null);
      await Promise.allSettled([loadDepartures(), refreshNotifications()]);
    } catch (actionError) {
      setError(actionError.message || "Không tạo được booking.");
    } finally {
      setBusyAction("");
    }
  }

  useEffect(() => {
    setBookingForm((currentForm) => ({
      ...currentForm,
      fullName: currentUser?.fullName || "",
      email: currentUser?.email || "",
      phoneNumber: currentUser?.phoneNumber || "",
    }));
  }, [currentUser?.email, currentUser?.fullName, currentUser?.phoneNumber]);

  useEffect(() => {
    setSelectedDepartureId(tour.upcomingDepartures?.[0]?.id || "");
    setDepartures(Array.isArray(tour.upcomingDepartures) ? tour.upcomingDepartures : []);
    setExpandedDays([]);
    setIsCalendarOpen(false);
    setCalendarCursor(createCalendarCursor(tour.upcomingDepartures?.[0]?.departureDate || tour.firstStartDate));
    void loadDepartures();
  }, [loadDepartures, tour]);

  useEffect(() => {
    if (activeImageIndex >= galleryImages.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, galleryImages.length]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setLightboxIndex(-1);
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((currentIndex) => (currentIndex <= 0 ? galleryImages.length - 1 : currentIndex - 1));
      }

      if (event.key === "ArrowRight") {
        setLightboxIndex((currentIndex) => (currentIndex + 1) % galleryImages.length);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, galleryImages.length]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsFavorite(false);
      return;
    }

    let ignore = false;

    async function loadFavoriteState() {
      try {
        const result = await getMyFavorites({ limit: 50 });
        if (!ignore) {
          setIsFavorite(result.favorites.some((favorite) => favorite.tour?.slug === tour.slug));
        }
      } catch {
        if (!ignore) {
          setIsFavorite(false);
        }
      }
    }

    void loadFavoriteState();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, tour.slug]);

  useEffect(() => {
    if (isAuthenticated) {
      setFavoriteNotice("");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isCalendarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCalendarOpen]);

  useEffect(() => {
    if (!selectedDepartureId || guests.adults < 1 || !isAuthenticated) {
      setBookingPreview(null);
      setPreviewError("");
      return undefined;
    }

    let ignore = false;
    const timerId = window.setTimeout(async () => {
      setIsPreviewLoading(true);

      try {
        const preview = await calculateBookingPreview({
          departureId: selectedDepartureId,
          guests: {
            adults: guests.adults,
            children: guests.children,
            infants: guests.infants,
          },
        });

        if (!ignore) {
          setBookingPreview(preview);
          setPreviewError("");
        }
      } catch (previewLoadError) {
        if (!ignore) {
          setBookingPreview(null);
          setPreviewError(previewLoadError.message || "Không tính được giá tạm tính.");
        }
      } finally {
        if (!ignore) {
          setIsPreviewLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timerId);
    };
  }, [guests.adults, guests.children, guests.infants, isAuthenticated, selectedDepartureId]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <section className="px-1">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="transition hover:text-sky-700">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href={`/tour?destination=${encodeURIComponent(tour.destination || "")}`} className="transition hover:text-sky-700">
            {tour.destination || "Điểm đến"}
          </Link>
          <span>/</span>
          <span className="line-clamp-1 text-slate-600">{tour.title}</span>
        </div>

        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="max-w-5xl text-[1.55rem] font-bold leading-tight tracking-[-0.03em] text-slate-900 md:text-[1.95rem]">
              {tour.title}
            </h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-600">
              {ratingMeta ? (
                <div className="inline-flex items-center gap-2">
                  <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-white">
                    {ratingMeta.score}
                  </span>
                  <span className="text-[13px] font-medium text-emerald-700">{ratingMeta.label}</span>
                </div>
              ) : null}
              <div className="inline-flex items-center gap-2">
                <PinIcon className="h-4 w-4 text-sky-600" />
                <span>Khởi hành từ: {tour.departureLocation || "Đang cập nhật"}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <TicketIcon className="h-4 w-4 text-sky-600" />
                <span>Mã tour: {getReferenceCode(tour)}</span>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[13px] font-medium text-sky-800">
                {getDurationLabel(tour)}
              </span>
              <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-800">
                {tour.transportLabel}
              </span>
              {tour.category?.name ? (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700">
                  {tour.category.name}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={busyAction === "favorite"}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
              isFavorite
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:text-rose-700"
            )}
          >
            <HeartIcon filled={isFavorite} />
            {busyAction === "favorite" ? "Đang lưu..." : isFavorite ? "Đã lưu tour" : "Lưu tour"}
          </button>
        </div>
      </section>

      <div className="grid gap-4">
        <div className="space-y-6">
          <section className="grid items-start gap-3 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <div className="relative">
                <div className="absolute left-0 top-3 z-10 rounded-r-full bg-orange-500 px-4 py-1.5 text-sm font-bold text-white shadow-sm">
                  {tour.transportLabel}
                </div>
                {galleryImages[activeImageIndex] || tour.imageUrl ? (
                  <button type="button" onClick={() => openLightbox(activeImageIndex)} className="block w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={galleryImages[activeImageIndex] || tour.imageUrl}
                      alt={tour.title}
                      className="h-[190px] w-full object-cover sm:h-[220px] lg:h-[248px]"
                    />
                  </button>
                ) : (
                  <div className="flex h-[190px] w-full items-end bg-[linear-gradient(135deg,#0f766e_0%,#0f4c81_55%,#f59e0b_100%)] p-5 text-white sm:h-[220px] lg:h-[248px]">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">BETOURIST</p>
                      <h3 className="mt-2.5 max-w-xl text-[1.4rem] font-bold leading-tight">{tour.title}</h3>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => openLightbox(activeImageIndex)}
                  className="absolute bottom-3 right-3 rounded-full bg-slate-950/72 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-slate-950/85"
                >
                  {galleryImages.length} ảnh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {galleryImages.length > 1
                ? galleryImages.slice(1, 5).map((imageUrl, index) => {
                  const realIndex = index + 1;

                  return (
                    <button
                      key={`${tour.slug}-thumb-${realIndex}`}
                      type="button"
                      onClick={() => setActiveImageIndex(realIndex)}
                      className={cn(
                        "overflow-hidden rounded-[16px] border bg-white shadow-[0_10px_22px_rgba(15,23,42,0.05)] transition",
                        activeImageIndex === realIndex ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt={`${tour.title} ${realIndex + 1}`} className="h-[92px] w-full object-cover md:h-[104px] lg:h-[118px]" />
                    </button>
                  );
                })
                : [
                  { label: "Điểm đến", value: tour.destination || "Đang cập nhật" },
                  { label: "Thời lượng", value: getDurationLabel(tour) },
                  { label: "Giá từ", value: formatVnd(tour.displayPrice) },
                  {
                    label: "Khởi hành",
                    value: formatDateVi(selectedDeparture?.departureDate || tour.firstStartDate),
                  },
                ].map((item) => (
                  <div
                    key={`${tour.slug}-${item.label}`}
                    className="flex min-h-[96px] flex-col justify-end rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)] md:min-h-[118px] lg:min-h-[140px]"
                  >
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 text-base font-bold leading-6 text-slate-900">{item.value}</p>
                  </div>
                ))}
            </div>
          </section>

          <section className="grid items-start gap-4 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="space-y-5">
              <SectionCard title="Điểm Nổi Bật Tour">
                <ul className="space-y-2.5">
                  {highlightList.map((item, index) => (
                    <li key={`${tour.slug}-highlight-${index}`} className="flex items-start gap-2.5 text-[14px] leading-6 text-slate-700">
                      <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-sky-400 text-[10px] font-bold leading-none text-sky-500">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard
                title="Chương trình tour"
                action={
                  hasMultipleItineraryDays ? (
                    <button type="button" onClick={toggleAllItineraryDays} className="text-sm font-bold text-slate-700 transition hover:text-sky-700">
                      {itineraryAllExpanded ? "Thu gọn" : "Xem tất cả"}
                    </button>
                  ) : null
                }
              >
                {tour.itinerary.length > 0 ? (
                  <div className="space-y-1">
                    {tour.itinerary.map((step, index) => {
                      const isExpanded = hasMultipleItineraryDays ? expandedDays.includes(step.day) : true;
                      const imageUrl = getItineraryImage(step, galleryImages, index);
                      const rawStepTitle = typeof step.title === "string" ? step.title.trim() : "";
                      const normalizedStepTitle =
                        !hasMultipleItineraryDays && isGenericItineraryTitle(rawStepTitle, step.day) ? "" : rawStepTitle;
                      const stepTitle = normalizedStepTitle || (hasMultipleItineraryDays ? `Ngày ${step.day}` : "Lịch trình chi tiết");
                      const itineraryContentClassName = hasMultipleItineraryDays
                        ? "space-y-4 pb-5 pl-28 pr-2 sm:pl-[7.5rem]"
                        : "space-y-4 px-1 pb-5 pt-1";

                      return (
                        <div key={`${tour.slug}-day-${step.day}`} className="border-b border-slate-100 last:border-b-0">
                          {hasMultipleItineraryDays ? (
                            <button
                              type="button"
                              onClick={() => toggleItineraryDay(step.day)}
                              className="flex w-full items-start gap-3.5 px-1 py-4 text-left"
                            >
                              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                                {imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={imageUrl} alt={stepTitle} className="h-full w-full object-cover" />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-sky-600">{`Ngày ${step.day}`}</p>
                                <h3 className="mt-1 text-[17px] font-semibold leading-6 text-slate-900">{stepTitle}</h3>
                              </div>
                              <ChevronDownIcon className={cn("mt-4 h-5 w-5 shrink-0 text-slate-400 transition", isExpanded ? "rotate-180" : "")} />
                            </button>
                          ) : null}

                          {isExpanded ? (
                            <div className={itineraryContentClassName}>
                              {(Array.isArray(step.blocks) ? step.blocks : []).length > 0 ? (
                                step.blocks.map((block, blockIndex) => {
                                  if (block?.type === "image" && block.url) {
                                    return (
                                      <div key={`${step.day}-image-${blockIndex}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={block.url} alt={block.alt || stepTitle} className="max-h-[26rem] w-full object-cover" />
                                      </div>
                                    );
                                  }

                                  if (block?.type === "caption" && block.text) {
                                    return (
                                      <p key={`${step.day}-caption-${blockIndex}`} className="mt-2 text-center text-sm italic leading-6 text-slate-500">
                                        {block.text}
                                      </p>
                                    );
                                  }

                                  if (block?.text) {
                                    return (
                                      <p key={`${step.day}-text-${blockIndex}`} className="whitespace-pre-line text-base leading-7 text-slate-700">
                                        {block.text}
                                      </p>
                                    );
                                  }

                                  return null;
                                })
                              ) : (
                                <p className="text-base leading-7 text-slate-500">Chưa có mô tả chi tiết cho ngày này.</p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-base text-slate-500">
                    Tour này chưa có lịch trình chi tiết.
                  </p>
                )}
              </SectionCard>

              <div className="space-y-5">
                <DisclosureCard
                  title="Giá Tour Bao Gồm"
                  open={openSections.included}
                  onToggle={() => setOpenSections((currentSections) => ({ ...currentSections, included: !currentSections.included }))}
                >
                  {tour.includedServices.length > 0 ? (
                    <ul className="space-y-3 text-base leading-7 text-slate-700">
                      {tour.includedServices.map((item, index) => (
                        <li key={`${tour.slug}-included-${index}`}> {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-base leading-7 text-slate-500">Thông tin dịch vụ bao gồm đang được cập nhật.</p>
                  )}
                </DisclosureCard>

                <DisclosureCard
                  title="Giá Tour Không Bao Gồm"
                  open={openSections.excluded}
                  onToggle={() => setOpenSections((currentSections) => ({ ...currentSections, excluded: !currentSections.excluded }))}
                >
                  {tour.excludedServices.length > 0 ? (
                    <ul className="space-y-3 text-base leading-7 text-slate-700">
                      {tour.excludedServices.map((item, index) => (
                        <li key={`${tour.slug}-excluded-${index}`}> {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-base leading-7 text-slate-500">Thông tin dịch vụ không bao gồm đang được cập nhật.</p>
                  )}
                </DisclosureCard>

                <DisclosureCard
                  title="Điều khoản và lưu ý"
                  open={openSections.notes}
                  onToggle={() => setOpenSections((currentSections) => ({ ...currentSections, notes: !currentSections.notes }))}
                >
                  <ul className="space-y-3 text-base leading-7 text-slate-700">
                    {noteItems.map((item, index) => (
                      <li key={`${tour.slug}-note-${index}`}>- {item}</li>
                    ))}
                  </ul>
                </DisclosureCard>
              </div>
              <section
                ref={bookingSectionRef}
                className="overflow-hidden rounded-[28px] border border-cyan-300 bg-white shadow-[0_16px_40px_rgba(14,165,233,0.12)]"
              >
                <div className="bg-[linear-gradient(135deg,#2ec5e4_0%,#1aa7cf_100%)] px-6 py-5 text-white">
                  <h2 className="text-[2rem] font-bold tracking-[-0.02em]">Đặt Tour Ngay</h2>
                  <p className="mt-1 text-sm text-white/90">Chỉ cần 3 bước đơn giản để hoàn tất yêu cầu đặt tour.</p>
                </div>

                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { step: 1, label: "Chọn ngày" },
                      { step: 2, label: "Số lượng khách" },
                      { step: 3, label: "Thông tin liên hệ" },
                    ].map((item) => (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => setCurrentStep(item.step)}
                        className="flex items-center gap-3 text-left"
                      >
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                            currentStep >= item.step ? "bg-cyan-500 text-white" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {item.step}
                        </span>
                        <span className={cn("text-sm font-semibold", currentStep >= item.step ? "text-slate-900" : "text-slate-500")}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 px-5 py-6 sm:px-6">
                  <FeedbackBox message={message} tone="success" />
                  <FeedbackBox message={error} tone="error" />
                  <FeedbackBox message={previewError} tone="info" className={isAuthenticated ? "" : "hidden"} />

                  {currentStep === 1 ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-base font-bold text-white">
                            1
                          </span>
                          <h3 className="text-[1.9rem] font-bold tracking-[-0.02em] text-slate-900">Chọn ngày khởi hành</h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowAllDepartures((currentValue) => !currentValue)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-400"
                        >
                          <CalendarIcon />
                          {showAllDepartures ? "Thu gọn lịch" : "Xem thêm lịch"}
                        </button>
                      </div>

                      {departures.length > 0 ? (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            {visibleDepartures.map((departure) => {
                              const isActive = selectedDepartureId === departure.id;

                              return (
                                <button
                                  key={departure.id}
                                  type="button"
                                  onClick={() => setSelectedDepartureId(departure.id)}
                                  className={cn(
                                    "rounded-2xl border px-4 py-4 text-left transition",
                                    isActive
                                      ? "border-cyan-400 bg-cyan-50 shadow-[0_12px_24px_rgba(34,211,238,0.12)]"
                                      : "border-slate-200 bg-white hover:border-cyan-200"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>{formatDateRangeVi(departure.departureDate, departure.returnDate)}</span>
                                      </div>
                                      <p className="mt-2 text-xl font-bold text-slate-900">{formatVnd(departure.displayPrice)}/khách</p>
                                      <p className="mt-1 text-sm text-slate-500">
                                        {departure.meetingPoint || "Điểm hẹn sẽ được xác nhận sau"}
                                      </p>
                                    </div>
                                    {isActive ? (
                                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300 bg-white text-cyan-500">
                                        <CheckCircleIcon className="h-4 w-4" />
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                                    <span className="text-amber-600">Còn {departure.remainingSeats} chỗ</span>
                                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">Liên hệ</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {departures.length > 6 ? (
                            <button
                              type="button"
                              onClick={() => setShowAllDepartures((currentValue) => !currentValue)}
                              className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-600"
                            >
                              {showAllDepartures
                                ? "Thu gọn danh sách ngày khởi hành"
                                : `Xem thêm ${departures.length - visibleDepartures.length} ngày khởi hành`}
                            </button>
                          ) : null}

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
                            >
                              Tiếp theo
                              <ArrowRightIcon />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-base text-slate-500">
                          {isLoadingDepartures ? "Đang tải lịch khởi hành..." : "Tour này hiện chưa có đợt khởi hành công khai."}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {currentStep === 2 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-base font-bold text-white">
                          2
                        </span>
                        <h3 className="text-[1.9rem] font-bold tracking-[-0.02em] text-slate-900">Chọn số lượng khách</h3>
                      </div>

                      <div className="space-y-3">
                        {guestFieldConfigs.map((fieldConfig, index) => (
                          <GuestCounter
                            key={fieldConfig.key}
                            label={fieldConfig.label}
                            hint={fieldConfig.hint}
                            value={guests[fieldConfig.key]}
                            min={fieldConfig.min}
                            onChange={(nextValue) => patchGuest(fieldConfig.key, nextValue)}
                            priceLabel={index === 0 ? `x ${formatVnd(currentUnitPrice)}` : ""}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-sky-700">
                        <InfoIcon />
                        <span>Liên hệ để xác nhận chỗ trước khi thanh toán.</span>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">Tổng cộng</p>
                            <p className="text-sm text-slate-500">{totalGuests} khách</p>
                          </div>
                          <p className="text-[2rem] font-bold tracking-[-0.02em] text-orange-500">{formatVnd(totalAmount)}</p>
                        </div>
                        {isSingleRoomApplied ? (
                          <p className="mt-2 text-sm text-amber-700">Phụ phí phòng đơn: + {formatVnd(singleRoomSupplementAmount)}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                        >
                          Quay lại
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
                        >
                          Tiếp theo
                          <ArrowRightIcon />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 3 ? (
                    <form onSubmit={handleCreateBooking} className="space-y-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-base font-bold text-white">
                          3
                        </span>
                        <h3 className="text-[1.9rem] font-bold tracking-[-0.02em] text-slate-900">Thông tin liên hệ</h3>
                      </div>

                      {selectedDeparture ? (
                        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-slate-700">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="font-semibold text-slate-900">
                              {formatDateRangeVi(selectedDeparture.departureDate, selectedDeparture.returnDate)}
                            </p>
                            <span className="font-semibold text-sky-700">{formatVnd(selectedDeparture.displayPrice)}/khách</span>
                          </div>
                          <p className="mt-2">Điểm hẹn: {selectedDeparture.meetingPoint || "Sẽ được cập nhật sau"}</p>
                        </div>
                      ) : null}

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Họ và tên
                          <input
                            value={bookingForm.fullName}
                            onChange={(event) => patchBookingField("fullName", event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400"
                            placeholder="Nguyễn Văn A"
                          />
                        </label>

                        <label className="text-sm font-semibold text-slate-700">
                          Số điện thoại
                          <input
                            value={bookingForm.phoneNumber}
                            onChange={(event) => patchBookingField("phoneNumber", event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400"
                            placeholder="09xx xxx xxx"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Email
                          <input
                            type="email"
                            value={bookingForm.email}
                            onChange={(event) => patchBookingField("email", event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400"
                            placeholder="email@betourist.vn"
                          />
                        </label>

                        <label className="text-sm font-semibold text-slate-700">
                          Hình thức thanh toán
                          <select
                            value={bookingForm.paymentMethod}
                            onChange={(event) => patchBookingField("paymentMethod", event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400"
                          >
                            {paymentMethodOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Tiền cọc
                          <input
                            type="number"
                            min={0}
                            value={bookingForm.depositAmount}
                            onChange={(event) => patchBookingField("depositAmount", event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400"
                            placeholder="Để trống nếu chưa cọc"
                          />
                        </label>

                        <label className="text-sm font-semibold text-slate-700">
                          Ghi chú điều hành
                          <input
                            value={bookingForm.note}
                            onChange={(event) => patchBookingField("note", event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400"
                            placeholder="Thông tin bổ sung cho điều hành"
                          />
                        </label>
                      </div>

                      <label className="block text-sm font-semibold text-slate-700">
                        Yêu cầu đặc biệt
                        <textarea
                          value={bookingForm.specialRequest}
                          onChange={(event) => patchBookingField("specialRequest", event.target.value)}
                          className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400"
                          placeholder="Ví dụ: ăn chay, phòng đơn, ghế ngồi gần nhau..."
                        />
                      </label>

                      {!isAuthenticated ? (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900">
                          Bạn cần đăng nhập trước khi tạo booking.
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/dang-nhap" className="rounded-full bg-sky-700 px-4 py-2 text-xs font-semibold text-white">
                              Đăng nhập
                            </Link>
                            <Link href="/dang-ky" className="rounded-full border border-sky-300 bg-white px-4 py-2 text-xs font-semibold text-sky-800">
                              Tạo tài khoản
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {latestBooking ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                          <p className="font-semibold">Booking vừa tạo: {latestBooking.orderCode}</p>
                          <p className="mt-1">Trạng thái: {latestBooking.bookingStatus}</p>
                          <p className="mt-1">Tổng tiền: {formatVnd(latestBooking.totalAmount)}</p>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                        >
                          Quay lại
                        </button>
                        <button
                          type="submit"
                          disabled={busyAction === "booking" || !selectedDeparture}
                          className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {busyAction === "booking" ? "Đang xử lý..." : "Hoàn tất yêu cầu đặt tour"}
                          <ArrowRightIcon />
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              </section>
            </div>

            <aside className="self-start rounded-[18px] border border-amber-200 bg-[linear-gradient(180deg,#fff6e8_0%,#fff2d9_100%)] p-3.5 shadow-[0_12px_28px_rgba(245,158,11,0.12)] md:sticky md:top-2">
              <h2 className="text-[1.22rem] font-bold tracking-[-0.02em] text-slate-900">Lịch Trình và Giá Tour</h2>
              <p className="mt-1 text-[13px] text-slate-600">Chọn lịch trình và xem giá:</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {departures.slice(0, 3).map((departure) => (
                  <button
                    key={departure.id}
                    type="button"
                    onClick={() => {
                      setSelectedDepartureId(departure.id);
                      goToBookingStep(1);
                    }}
                    className={cn(
                      "rounded-2xl border px-2.5 py-2 text-[11px] font-semibold transition",
                      selectedDepartureId === departure.id
                        ? "border-sky-400 bg-white text-sky-700 shadow-sm"
                        : "border-white bg-white/80 text-slate-700 hover:border-sky-200"
                    )}
                  >
                    {formatWeekdayDateVi(departure.departureDate)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={openCalendarModal}
                  className="inline-flex rounded-2xl border border-white bg-white/90 px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-sky-200"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Tất cả
                </button>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {guestFieldConfigs.map((fieldConfig, index) => (
                  <GuestCounter
                    key={fieldConfig.key}
                    label={fieldConfig.label}
                    hint={fieldConfig.hint}
                    value={guests[fieldConfig.key]}
                    min={fieldConfig.min}
                    onChange={(nextValue) => patchGuest(fieldConfig.key, nextValue)}
                    priceLabel={index === 0 ? `x ${formatVnd(currentUnitPrice)}` : ""}
                  />
                ))}
              </div>

              <div className="mt-3.5 flex items-center gap-2 text-sm text-sky-700">
                <InfoIcon />
                <span>Liên hệ để xác nhận chỗ </span>
              </div>

              {isSingleRoomApplied ? (
                <div className="mt-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-semibold text-slate-900">Phụ phí phòng đơn</p>
                    <span className="font-semibold text-amber-700">+ {formatVnd(singleRoomSupplementAmount)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Áp dụng khi đoàn chỉ có 1 khách tham gia.</p>
                </div>
              ) : null}

              <div className="mt-4 border-t border-amber-200/80 pt-3.5">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-sm text-slate-600">Tổng Giá Tour</p>
                  <p className="text-sm font-bold tracking-[-0.02em] text-amber-600">
                    {formatVnd(totalAmount)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">Giá cơ bản: {formatVnd(baseAmount)}</p>


              </div>

              <button
                type="button"
                onClick={() => goToBookingStep(1)}
                disabled={departures.length === 0}
                className="mt-3.5 inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Yêu cầu đặt
              </button>

              {!isAuthenticated ? (
                <p className="mt-3 text-sm text-slate-600">
                  Cần đăng nhập để tạo booking. Bạn vẫn có thể xem giá và lịch khởi hành trước.
                </p>
              ) : null}
            </aside>
          </section>

        </div>

        <aside className="space-y-4 xl:hidden">
          <FeedbackBox message={message} tone="success" />
          <FeedbackBox message={error} tone="error" />
        </aside>
      </div>

      {isCalendarOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/42 px-4 py-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Chọn lịch khởi hành"
          onClick={closeCalendarModal}
        >
          <div
            className="w-full max-w-[340px] rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Lịch khởi hành</p>
                <h3 className="mt-2 text-[1.25rem] font-bold tracking-[-0.02em] text-slate-900">Chọn ngày phù hợp</h3>
              </div>
              <button
                type="button"
                onClick={closeCalendarModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                aria-label="Đóng lịch"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <select
                value={calendarCursor.month}
                onChange={handleCalendarMonthChange}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-300"
              >
                {CALENDAR_MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={calendarCursor.year}
                onChange={handleCalendarYearChange}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-300"
              >
                {calendarYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => shiftCalendarMonth(-1)}
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                aria-label="Tháng trước"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => shiftCalendarMonth(1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                aria-label="Tháng sau"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {CALENDAR_WEEKDAY_LABELS.map((weekdayLabel) => (
                <div key={weekdayLabel} className={weekdayLabel === "CN" ? "text-rose-500" : ""}>
                  {weekdayLabel}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {calendarDays.map((calendarDate) => {
                const dateKey = getDateKey(calendarDate);
                const departure = departuresByDate.get(dateKey);
                const isOutsideMonth = calendarDate.getMonth() !== calendarCursor.month;
                const isSelected = selectedDepartureId === departure?.id;
                const isLowestPrice =
                  departure && departurePriceRange.min !== null && Number(departure.displayPrice) === departurePriceRange.min;
                const isHighestPrice =
                  departure &&
                  departurePriceRange.max !== null &&
                  departurePriceRange.min !== departurePriceRange.max &&
                  Number(departure.displayPrice) === departurePriceRange.max;

                const cellClassName = cn(
                  "flex min-h-[54px] flex-col items-center justify-start rounded-xl border px-1 py-1.5 text-center transition",
                  isOutsideMonth ? "border-transparent text-slate-300" : "border-slate-100 text-slate-700",
                  departure ? "cursor-pointer" : "cursor-default bg-slate-50/40",
                  departure && !isSelected && isLowestPrice ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "",
                  departure && !isSelected && isHighestPrice ? "border-rose-200 bg-rose-50 text-rose-700" : "",
                  departure && !isSelected && !isLowestPrice && !isHighestPrice ? "border-amber-200 bg-amber-50 text-amber-700" : "",
                  isSelected ? "border-sky-400 bg-sky-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.18)]" : ""
                );

                return (
                  <button
                    key={`${calendarCursor.year}-${calendarCursor.month}-${dateKey || calendarDate.toISOString()}`}
                    type="button"
                    disabled={!departure}
                    onClick={() => departure && handleCalendarDateSelect(departure)}
                    className={cellClassName}
                  >
                    <span className="text-sm font-semibold leading-none">{calendarDate.getDate()}</span>
                    <span className="mt-1 text-[10px] font-semibold leading-none">
                      {departure ? formatCompactPrice(Number(departure.displayPrice || 0)) : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-1 text-[11px] leading-5 text-slate-500">
              <p>
                <span className="font-semibold text-emerald-600">*</span> Màu xanh lá: ngày khởi hành giá tốt nhất
              </p>
              <p>
                <span className="font-semibold text-rose-500">*</span> Màu đỏ: ngày khởi hành giá cao hơn
              </p>
              <p>* Giá hiển thị trên 1 khách</p>
            </div>
          </div>
        </div>
      ) : null}

      {isFavoritePopupOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Yêu cầu đăng nhập để lưu tour"
          onClick={() => setFavoriteNotice("")}
        >
          <div
            className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Lưu tour yêu thích</p>
                <h3 className="mt-2 text-[1.65rem] font-bold tracking-[-0.02em] text-slate-900">Bạn cần đăng nhập</h3>
              </div>
              <button
                type="button"
                onClick={() => setFavoriteNotice("")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                aria-label="Đóng thông báo"
              >
                <CloseIcon />
              </button>
            </div>

            <p className="mt-4 text-base leading-7 text-slate-600">{favoriteNotice}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/dang-nhap"
                onClick={() => setFavoriteNotice("")}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                Đăng nhập
              </Link>
              <Link
                href="/dang-ky"
                onClick={() => setFavoriteNotice("")}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
              >
                Tạo tài khoản
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh tour"
          onClick={closeLightbox}
        >
          <div className="relative flex w-full max-w-5xl flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-0 top-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65"
              aria-label="Đóng thư viện ảnh"
            >
              <CloseIcon />
            </button>

            <div className="relative flex w-full items-center justify-center overflow-hidden rounded-[28px] bg-black/25 pt-10">
              <button
                type="button"
                onClick={showPreviousLightboxImage}
                className="absolute left-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur transition hover:bg-white/28"
                aria-label="Ảnh trước"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryImages[lightboxIndex]}
                alt={`${tour.title} ${lightboxIndex + 1}`}
                className="max-h-[72vh] w-auto max-w-full rounded-[24px] object-contain"
              />

              <button
                type="button"
                onClick={showNextLightboxImage}
                className="absolute right-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur transition hover:bg-white/28"
                aria-label="Ảnh kế tiếp"
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex w-full items-center justify-between gap-3 text-sm text-white/90">
              <p className="line-clamp-1 font-medium">{tour.title}</p>
              <p>
                {lightboxIndex + 1}/{galleryImages.length}
              </p>
            </div>

            {galleryImages.length > 1 ? (
              <div className="flex w-full gap-2 overflow-x-auto pb-1">
                {galleryImages.map((imageUrl, index) => (
                  <button
                    key={`${tour.slug}-lightbox-${index}`}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className={cn(
                      "h-16 w-24 shrink-0 overflow-hidden rounded-2xl border transition",
                      lightboxIndex === index ? "border-white ring-2 ring-white/30" : "border-white/10 opacity-75 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt={`${tour.title} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}


    </div>
  );
}

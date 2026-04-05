import { getAnonymousId } from "@/utils/anonymousUtils";

const RECENT_TOURS_STORAGE_PREFIX = "betourist.recentTours.";
const MAX_RECENT_TOURS = 8;
const RECENT_TOURS_EVENT = "betourist:recentToursChanged";
const EMPTY_RECENT_TOURS = [];
const recentToursSnapshotCache = new Map();

function toNumberOrNull(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function resolveAvailableSeats(tour) {
  const firstUpcomingDeparture = Array.isArray(tour?.upcomingDepartures)
    ? tour.upcomingDepartures[0]
    : null;
  const departureRemainingSeats = toNumberOrNull(firstUpcomingDeparture?.remainingSeats);

  if (departureRemainingSeats !== null) {
    return departureRemainingSeats;
  }

  return toNumberOrNull(tour?.availableSeats);
}

function getRecentToursStorageKey() {
  return `${RECENT_TOURS_STORAGE_PREFIX}${getAnonymousId()}`;
}

function parseStoredRecentTours(rawValue) {
  try {
    const storedTours = JSON.parse(rawValue || "[]");

    if (!Array.isArray(storedTours)) {
      return EMPTY_RECENT_TOURS;
    }

    const normalizedTours = storedTours.map(normalizeRecentTour).filter(Boolean);
    return normalizedTours.length > 0 ? normalizedTours : EMPTY_RECENT_TOURS;
  } catch {
    return null;
  }
}

export function createRecentTourSnapshot(tour) {
  if (!tour?.slug) {
    return null;
  }

  // Chỉ giữ phần dữ liệu cần để render lại card, tránh lưu toàn bộ payload detail khá lớn.
  const displayPrice = toNumberOrNull(tour.displayPrice);
  const regularPrice = toNumberOrNull(tour.price) ?? displayPrice;
  const availableSeats = resolveAvailableSeats(tour);

  return {
    id: tour.id || tour.slug,
    slug: tour.slug,
    title: tour.title || "Tour dang cap nhat",
    destination: tour.destination || "Dang cap nhat",
    departureLocation: tour.departureLocation || "Dang cap nhat",
    category: tour.category
      ? {
          name: tour.category.name || "",
          slug: tour.category.slug || "",
        }
      : null,
    durationDays: toNumberOrNull(tour.durationDays),
    durationNights: toNumberOrNull(tour.durationNights) ?? 0,
    transportLabel: tour.transportLabel || "Lich trinh linh hoat",
    availableSeats,
    price: regularPrice,
    discountPrice: toNumberOrNull(tour.discountPrice),
    displayPrice,
    firstStartDate: tour.firstStartDate || null,
    highlights: Array.isArray(tour.highlights) ? tour.highlights.filter(Boolean).slice(0, 3) : [],
    summary:
      tour.summary ||
      `Khoi hanh tu ${tour.departureLocation || "dang cap nhat"} den ${tour.destination || "dang cap nhat"}.`,
    ratingAverage: toNumberOrNull(tour.ratingAverage) ?? 0,
    ratingCount: toNumberOrNull(tour.ratingCount) ?? 0,
    imageUrl: tour.imageUrl || null,
  };
}

function normalizeRecentTour(item) {
  const snapshot = createRecentTourSnapshot(item);

  if (!snapshot) {
    return null;
  }

  return {
    ...snapshot,
    viewedAt: typeof item?.viewedAt === "string" ? item.viewedAt : null,
  };
}

export function readRecentTours() {
  if (typeof window === "undefined") {
    return EMPTY_RECENT_TOURS;
  }

  const storageKey = getRecentToursStorageKey();
  const parsedTours = parseStoredRecentTours(localStorage.getItem(storageKey) || "[]");

  if (parsedTours === null) {
    localStorage.removeItem(storageKey);
    return EMPTY_RECENT_TOURS;
  }

  return parsedTours;
}

export function saveRecentTour(tour) {
  if (typeof window === "undefined") {
    return EMPTY_RECENT_TOURS;
  }

  const snapshot = createRecentTourSnapshot(tour);

  if (!snapshot) {
    return readRecentTours();
  }

  // Đưa tour mới xem lên đầu danh sách, loại bỏ bản ghi trùng slug và giữ tối đa N phần tử gần nhất.
  // Lưu đúng shape dữ liệu mà TourCard đang cần để các màn hình khác chỉ việc render lại.
  const nextTours = [
    {
      ...snapshot,
      viewedAt: new Date().toISOString(),
    },
    ...readRecentTours().filter((item) => item.slug !== snapshot.slug),
  ].slice(0, MAX_RECENT_TOURS);

  localStorage.setItem(getRecentToursStorageKey(), JSON.stringify(nextTours));
  window.dispatchEvent(new Event(RECENT_TOURS_EVENT));
  return nextTours;
}

export function getRecentToursSnapshot({ excludeSlug = "", limit = MAX_RECENT_TOURS } = {}) {
  if (typeof window === "undefined") {
    return EMPTY_RECENT_TOURS;
  }

  const storageKey = getRecentToursStorageKey();
  const rawValue = localStorage.getItem(storageKey) || "[]";
  const cacheKey = `${storageKey}:${excludeSlug}:${limit}`;
  const cachedSnapshot = recentToursSnapshotCache.get(cacheKey);

  if (cachedSnapshot?.rawValue === rawValue) {
    return cachedSnapshot.value;
  }

  const parsedTours = parseStoredRecentTours(rawValue);

  if (parsedTours === null) {
    localStorage.removeItem(storageKey);
    recentToursSnapshotCache.delete(cacheKey);
    return EMPTY_RECENT_TOURS;
  }

  // Snapshot được cache theo raw localStorage để useSyncExternalStore không nhận mảng mới ở mọi lần render.
  const snapshot = parsedTours.filter((item) => item.slug !== excludeSlug).slice(0, limit);
  recentToursSnapshotCache.set(cacheKey, {
    rawValue,
    value: snapshot,
  });

  return snapshot;
}

export function getEmptyRecentToursSnapshot() {
  return EMPTY_RECENT_TOURS;
}

export function subscribeRecentTours(onStoreChange) {
  if (typeof window === "undefined") {
    return () => {};
  }

  // Lắng nghe cả event nội bộ lẫn sự kiện storage để dữ liệu đồng bộ khi localStorage thay đổi.
  window.addEventListener(RECENT_TOURS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(RECENT_TOURS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

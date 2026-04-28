import {
  getRecentToursFromServer,
  syncRecentTourListToServer,
} from "@/apiService/recentTours";
import { getAnonymousId } from "@/utils/anonymousUtils";

export const RECENT_TOURS_STORAGE_PREFIX = "betourist.recentTours.";
export const RECENT_TOURS_MERGE_PREFIX = "betourist.recentTours.merged.";
export const MAX_RECENT_TOURS = 8;
const RECENT_TOURS_EVENT = "betourist:recentToursChanged";
const EMPTY_RECENT_TOURS = [];
const recentToursSnapshotCache = new Map();

/**
 * Chuẩn hóa dữ liệu số ở phía frontend.
 *
 * Đầu vào:
 * - `value`: giá trị bất kỳ từ payload tour.
 *
 * Đầu ra:
 * - Number hợp lệ hoặc `null`.
 *
 * Hành vi nghiệp vụ:
 * - Giúp local snapshot luôn có dữ liệu sạch trước khi ghi localStorage.
 */
function toNumberOrNull(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

/**
 * Suy ra số ghế còn lại phù hợp nhất để hiển thị trên card.
 *
 * Đầu vào:
 * - `tour`: object tour hiện tại.
 *
 * Đầu ra:
 * - Số ghế còn lại hoặc `null`.
 *
 * Hành vi nghiệp vụ:
 * - Ưu tiên chuyến khởi hành sắp tới nhất nếu có.
 * - Nếu không có chuyến sắp tới thì dùng `availableSeats` làm phương án dự phòng.
 */
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

/**
 * Tạo key localStorage cho recent tours của trình duyệt hiện tại.
 *
 * Đầu vào:
 * - Không có tham số; hàm tự lấy `anonymousId`.
 *
 * Đầu ra:
 * - Key dạng `betourist.recentTours.<anonymousId>`.
 *
 * Hành vi nghiệp vụ:
 * - Giữ local cache tách riêng theo từng định danh trình duyệt để khách cũng có
 *   recent tours độc lập trước khi đăng nhập.
 */
export function getRecentToursStorageKey() {
  return `${RECENT_TOURS_STORAGE_PREFIX}${getAnonymousId()}`;
}

/**
 * Tạo key đánh dấu việc đã merge recent của khách sang recent của user.
 *
 * Đầu vào:
 * - `userId`: id người dùng đã đăng nhập.
 * - `anonymousId`: id khách vãng lai của trình duyệt.
 *
 * Đầu ra:
 * - Key localStorage dùng để lưu chữ ký merge.
 *
 * Hành vi nghiệp vụ:
 * - Tránh replay cùng một danh sách khách lên server nhiều lần không cần thiết.
 */
function getRecentToursMergeKey(userId, anonymousId) {
  return `${RECENT_TOURS_MERGE_PREFIX}${userId}.${anonymousId}`;
}

/**
 * Phát event nội bộ để các widget recent tours trên cùng trình duyệt tự cập nhật.
 *
 * Đầu vào:
 * - Không có tham số.
 *
 * Đầu ra:
 * - Không trả giá trị.
 *
 * Hành vi nghiệp vụ:
 * - Dùng chung với `useSyncExternalStore` để UI refresh ngay sau khi local cache đổi.
 */
function emitRecentToursChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(RECENT_TOURS_EVENT));
}

/**
 * Parse raw JSON từ localStorage thành danh sách recent tours hợp lệ.
 *
 * Đầu vào:
 * - `rawValue`: chuỗi JSON đọc từ localStorage.
 *
 * Đầu ra:
 * - Mảng recent tours đã normalize.
 * - `EMPTY_RECENT_TOURS` nếu dữ liệu không đúng shape.
 * - `null` nếu JSON hỏng và cần phía gọi xóa key.
 *
 * Hành vi nghiệp vụ:
 * - Đây là lớp bảo vệ để local cache lỗi không làm vỡ widget recent tours.
 */
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

/**
 * Tạo snapshot rút gọn của tour để lưu ở localStorage.
 *
 * Đầu vào:
 * - `tour`: object tour hiện tại từ UI hoặc API.
 *
 * Đầu ra:
 * - Object snapshot đủ field để render card.
 * - `null` nếu tour không có `slug`.
 *
 * Hành vi nghiệp vụ:
 * - Kiến trúc hybrid vẫn giữ localStorage vì đây là fast path cho UI.
 * - Chỉ lưu snapshot nhỏ để local cache gọn nhẹ, đọc nhanh và ít rủi ro stale hơn
 *   so với việc lưu cả payload detail lớn.
 */
export function createRecentTourSnapshot(tour) {
  if (!tour?.slug) {
    return null;
  }

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

/**
 * Chuẩn hóa một item recent tour bất kỳ về shape snapshot chuẩn.
 *
 * Đầu vào:
 * - `item`: dữ liệu raw đọc từ localStorage hoặc từ server.
 *
 * Đầu ra:
 * - Recent tour hợp lệ có thêm `viewedAt`.
 * - `null` nếu item không hợp lệ.
 */
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

/**
 * Làm sạch danh sách tours trước khi ghi localStorage.
 *
 * Đầu vào:
 * - `tours`: danh sách đầu vào cần chuẩn hóa.
 * - `existingTours`: local cache hiện tại, dùng để giữ lại `viewedAt` nếu cần.
 *
 * Đầu ra:
 * - Mảng dedupe theo slug và cắt về tối đa 8 phần tử.
 *
 * Hành vi nghiệp vụ:
 * - Loại bỏ item lỗi.
 * - Không cho duplicate tour.
 * - Bảo toàn `viewedAt` cũ nếu dữ liệu server không trả field này.
 */
function sanitizeRecentToursForStorage(tours, existingTours = EMPTY_RECENT_TOURS) {
  const existingTourMap = new Map(existingTours.map((item) => [item.slug, item]));
  const dedupedTours = [];
  const seenSlugs = new Set();

  for (const item of tours || []) {
    const snapshot = normalizeRecentTour(item);

    if (!snapshot || seenSlugs.has(snapshot.slug)) {
      continue;
    }

    seenSlugs.add(snapshot.slug);
    dedupedTours.push({
      ...snapshot,
      viewedAt:
        snapshot.viewedAt ||
        existingTourMap.get(snapshot.slug)?.viewedAt ||
        null,
    });
  }

  return dedupedTours.slice(0, MAX_RECENT_TOURS);
}

/**
 * Đọc local recent tours từ localStorage.
 *
 * Đầu vào:
 * - Không có tham số.
 *
 * Đầu ra:
 * - Mảng recent tours hiện có trong trình duyệt.
 *
 * Hành vi nghiệp vụ:
 * - Nếu dữ liệu JSON hỏng, hàm sẽ xóa key lỗi và trả mảng rỗng an toàn.
 * - Đây là lớp dự phòng quan trọng khi API hoặc Redis tạm thời không khả dụng.
 */
export function readRecentToursLocal() {
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

/**
 * Ghi một tour vừa xem vào localStorage để UI phản hồi tức thì.
 *
 * Đầu vào:
 * - `tour`: tour hiện tại trên trang detail.
 *
 * Đầu ra:
 * - Danh sách recent tours mới sau khi đã cập nhật.
 *
 * Hành vi nghiệp vụ:
 * - Tour mới xem đứng đầu danh sách.
 * - Xóa trùng theo `slug`.
 * - Chỉ giữ tối đa 8 phần tử theo đúng business rule.
 * - Phát event để các widget khác cùng trình duyệt cập nhật ngay.
 *
 * Trường hợp biên:
 * - SSR hoặc tour không hợp lệ => không ghi gì thêm, trả state hiện có.
 */
export function saveRecentTourLocal(tour) {
  if (typeof window === "undefined") {
    return EMPTY_RECENT_TOURS;
  }

  const snapshot = createRecentTourSnapshot(tour);

  if (!snapshot) {
    return readRecentToursLocal();
  }

  const nextTours = [
    {
      ...snapshot,
      viewedAt: new Date().toISOString(),
    },
    ...readRecentToursLocal().filter((item) => item.slug !== snapshot.slug),
  ].slice(0, MAX_RECENT_TOURS);

  localStorage.setItem(getRecentToursStorageKey(), JSON.stringify(nextTours));
  emitRecentToursChanged();
  return nextTours;
}

/**
 * Ghi đè local cache bằng danh sách mới nhất lấy từ server.
 *
 * Đầu vào:
 * - `tours`: danh sách card recent tours do server trả về.
 *
 * Đầu ra:
 * - Danh sách local mới sau khi normalize.
 *
 * Hành vi nghiệp vụ:
 * - Dù Redis là source phía server, localStorage vẫn được cập nhật lại để mọi
 *   component hiện tại tiếp tục dùng cùng một cơ chế subscription cũ.
 */
export function replaceRecentToursLocal(tours) {
  if (typeof window === "undefined") {
    return EMPTY_RECENT_TOURS;
  }

  const currentTours = readRecentToursLocal();
  const nextTours = sanitizeRecentToursForStorage(tours, currentTours);

  localStorage.setItem(getRecentToursStorageKey(), JSON.stringify(nextTours));
  emitRecentToursChanged();
  return nextTours;
}

/**
 * Lấy recent tours chuẩn từ server rồi ghi ngược về localStorage.
 *
 * Đầu vào:
 * - `limit`: số lượng tối đa cần lấy.
 * - `excludeSlug`: slug cần loại khỏi danh sách nếu có.
 *
 * Đầu ra:
 * - Danh sách recent tours mới nhất sau khi sync.
 *
 * Hành vi nghiệp vụ:
 * - Phía gọi nên render local cache trước rồi mới gọi hàm này ở background.
 * - Nếu server trả dữ liệu mới hơn, local cache sẽ được cập nhật lại.
 * - Nếu server trả rỗng nhưng local vẫn có dữ liệu hữu ích, giữ nguyên local để
 *   tránh làm widget trống trong lúc merge hoặc lúc server chưa có state.
 *
 * Trường hợp biên:
 * - Nếu API lỗi, hàm throw để phía gọi quyết định giữ local dự phòng.
 */
export async function refreshRecentToursFromServer({
  limit = MAX_RECENT_TOURS,
  excludeSlug = "",
} = {}) {
  const currentLocalTours = readRecentToursLocal();
  const serverTours = await getRecentToursFromServer({
    limit,
    excludeSlug,
    anonymousId: getAnonymousId(),
  });

  // Server trả rỗng không nên xóa local cache còn hữu ích.
  // Điều này giúp UI không bị trắng trong lúc recent của khách đang được merge sang user
  // hoặc khi server chưa có dữ liệu dùng chung nhưng trình duyệt đã có lịch sử local.
  if (serverTours.length === 0 && currentLocalTours.length > 0) {
    return currentLocalTours;
  }

  return replaceRecentToursLocal(serverTours);
}

/**
 * Tạo chữ ký ngắn của danh sách local recent tours để đánh dấu đã merge.
 *
 * Đầu vào:
 * - `tours`: danh sách recent tours local.
 *
 * Đầu ra:
 * - Chuỗi signature đơn giản dựa trên `id` và `slug`.
 *
 * Hành vi nghiệp vụ:
 * - Không dùng làm bảo mật; chỉ dùng để nhận biết local list đã được replay lên
 *   server cho cặp `userId + anonymousId` này hay chưa.
 */
function buildRecentToursMergeSignature(tours) {
  return tours
    .map((tour) => `${tour.id || ""}:${tour.slug || ""}`)
    .join("|");
}

/**
 * Merge recent tours của khách vào recent tours của user sau khi đăng nhập.
 *
 * Đầu vào:
 * - `userId`: id của user vừa đăng nhập.
 *
 * Đầu ra:
 * - `true` nếu có phát sinh sync.
 * - `false` nếu không cần sync gì thêm.
 *
 * Hành vi nghiệp vụ:
 * - Chỉ replay local recent của trình duyệt hiện tại.
 * - Redis vẫn chịu trách nhiệm dedupe và trim sau mỗi lần ghi.
 * - Dùng merge signature để tránh replay lặp lại cùng một danh sách khách.
 *
 * TODO:
 * - Nếu sau này backend có endpoint merge riêng, có thể thay cách replay ở phía client
 *   bằng một request phía server gọn hơn.
 */
export async function syncAnonymousRecentToursToUser(userId) {
  if (typeof window === "undefined" || !userId) {
    return false;
  }

  const anonymousId = getAnonymousId();
  const localRecentTours = readRecentToursLocal();

  if (!anonymousId || localRecentTours.length === 0) {
    return false;
  }

  const mergeSignature = buildRecentToursMergeSignature(localRecentTours);
  const mergeKey = getRecentToursMergeKey(userId, anonymousId);

  if (localStorage.getItem(mergeKey) === mergeSignature) {
    return false;
  }

  await syncRecentTourListToServer({
    tours: localRecentTours,
    anonymousId,
  });

  localStorage.setItem(mergeKey, mergeSignature);
  return true;
}

/**
 * Lấy snapshot recent tours hiện tại để feed cho `useSyncExternalStore`.
 *
 * Đầu vào:
 * - `excludeSlug`: slug cần loại khỏi danh sách.
 * - `limit`: số item tối đa cần trả về.
 *
 * Đầu ra:
 * - Mảng recent tours đã được lọc và cache.
 *
 * Hành vi nghiệp vụ:
 * - Cache theo raw localStorage để tránh tạo mảng mới ở mọi lần render.
 * - Giữ đúng trải nghiệm UI hiện tại ngay cả khi chưa kịp gọi server.
 */
export function getRecentToursSnapshot({
  excludeSlug = "",
  limit = MAX_RECENT_TOURS,
} = {}) {
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

  const snapshot = parsedTours
    .filter((item) => item.slug !== excludeSlug)
    .slice(0, limit);

  recentToursSnapshotCache.set(cacheKey, {
    rawValue,
    value: snapshot,
  });

  return snapshot;
}

/**
 * Snapshot rỗng ổn định cho pha SSR hoặc lúc store chưa sẵn sàng.
 *
 * Đầu vào:
 * - Không có tham số.
 *
 * Đầu ra:
 * - Mảng rỗng dùng làm snapshot dự phòng.
 */
export function getEmptyRecentToursSnapshot() {
  return EMPTY_RECENT_TOURS;
}

/**
 * Đăng ký listener cho recent tours store ở phía trình duyệt.
 *
 * Đầu vào:
 * - `onStoreChange`: callback của `useSyncExternalStore`.
 *
 * Đầu ra:
 * - Hàm unsubscribe để cleanup listener.
 *
 * Hành vi nghiệp vụ:
 * - Lắng nghe cả event nội bộ lẫn `storage` để các widget recent tours tự đồng bộ
 *   khi localStorage thay đổi trong cùng tab hoặc tab khác.
 */
export function subscribeRecentTours(onStoreChange) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(RECENT_TOURS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(RECENT_TOURS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

// Backward-compatible aliases for older imports while the hybrid refactor lands.
export const readRecentTours = readRecentToursLocal;
export const saveRecentTour = saveRecentTourLocal;

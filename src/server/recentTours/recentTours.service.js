import { fetchApi, toAssetUrl } from "@/apiService/base";
import {
  RECENT_TOURS_ANON_KEY_PREFIX,
  RECENT_TOURS_LIMIT,
  RECENT_TOURS_TTL_SECONDS,
  RECENT_TOURS_USER_KEY_PREFIX,
} from "@/server/recentTours/constants";
import { getRedisClient } from "@/server/recentTours/redisRecentTours";

const transportLabels = {
  bus: "Xe du lịch",
  plane: "May bay",
  train: "Tau hoa",
  ship: "Tau thuyen",
  car: "Xe riêng",
  mixed: "Lịch trình linh hoạt",
};

/**
 * Chuẩn hóa một giá trị bất kỳ về số hoặc `null`.
 *
 * Đầu vào:
 * - `value`: dữ liệu thô từ API hoặc DB, có thể là string/number/null.
 *
 * Đầu ra:
 * - Trả về number hợp lệ nếu parse được.
 * - Trả về `null` nếu giá trị không phải số hữu hạn.
 *
 * Hành vi nghiệp vụ:
 * - Dùng để map dữ liệu card recent tours an toàn, tránh để UI phải tự xử lý
 *   các giá trị rác như `undefined`, `NaN`, chuỗi rỗng...
 */
function toNumberOrNull(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

/**
 * Xác định key Redis tương ứng với ngữ cảnh hiện tại.
 *
 * Đầu vào:
 * - `userId`: id người dùng đã xác thực.
 * - `anonymousId`: id khách vãng lai lưu ở trình duyệt.
 *
 * Đầu ra:
 * - Trả về key Redis hoàn chỉnh.
 * - Trả về chuỗi rỗng nếu không đủ dữ liệu để xác định chủ sở hữu.
 *
 * Hành vi nghiệp vụ:
 * - Ưu tiên user key nếu người dùng đã đăng nhập.
 * - Chỉ dùng anonymous key cho khách chưa xác thực.
 */
function resolveRecentToursRedisKey({ userId, anonymousId }) {
  if (userId) {
    return `${RECENT_TOURS_USER_KEY_PREFIX}${userId}`;
  }

  if (anonymousId) {
    return `${RECENT_TOURS_ANON_KEY_PREFIX}${anonymousId}`;
  }

  return "";
}


/**
 * Tạo summary ngắn cho card recent tours khi dữ liệu tour chưa có summary sẵn.
 *
 * Đầu vào:
 * - `tour`: dữ liệu tour thô trả về từ API upstream.
 *
 * Đầu ra:
 * - Chuỗi mô tả ngắn đủ để UI hiển thị khi thiếu dữ liệu mô tả sẵn.
 *
 * Hành vi nghiệp vụ:
 * - Ưu tiên highlights nếu có.
 * - Nếu không có highlights thì tự dựng câu mô tả từ điểm khởi hành/điểm đến.
 */
function buildTourSummary(tour) {
  if (Array.isArray(tour?.highlights) && tour.highlights.length > 0) {
    return tour.highlights.slice(0, 2).join(" - ");
  }

  return `Khởi hành từ ${tour?.departureLocation || "đang cập nhật"} đến ${tour?.destination || "đang cập nhật"}.`;
}

/**
 * Map dữ liệu tour chi tiết sang shape card mà frontend recent tours cần.
 *
 * Đầu vào:
 * - `tour`: payload thô từ API `/api/tours/:id`.
 *
 * Đầu ra:
 * - Object card tối giản để FE render.
 * - `null` nếu tour không đủ dữ liệu cốt lõi như `slug`.
 *
 * Hành vi nghiệp vụ:
 * - Chỉ map các field UI đang dùng, không trả payload chi tiết quá lớn.
 * - Recent tours trên Redis chỉ lưu id; vì vậy khi đọc ra, service này phải map
 *   lại card mới nhất để giá/ảnh/rating luôn phản ánh dữ liệu hiện hành.
 */
function mapRecentTourCard(tour) {
  if (!tour?.slug) {
    return null;
  }

  const normalizedDiscountPrice =
    typeof tour.discountPrice === "number" && tour.discountPrice > 0
      ? tour.discountPrice
      : null;
  const displayPrice =
    normalizedDiscountPrice !== null
      ? normalizedDiscountPrice
      : toNumberOrNull(tour.price);
  const departureRemainingSeats = Array.isArray(tour.upcomingDepartures)
    ? tour.upcomingDepartures.reduce((total, departure) => {
      const remainingSeats = toNumberOrNull(departure?.remainingSeats);
      return remainingSeats === null
        ? total
        : total + Math.max(remainingSeats, 0);
    }, 0)
    : null;
  const availableSeats =
    toNumberOrNull(tour.totalRemainingSeats) ??
    departureRemainingSeats ??
    toNumberOrNull(tour.availableSeats);
  const imageSource = Array.isArray(tour.images) ? tour.images[0] : tour.imageUrl;

  return {
    id: tour._id || tour.id || tour.slug,
    slug: tour.slug,
    title: tour.title || "Tour đang cập nhật",
    destination: tour.destination || "Đang cập nhật",
    departureLocation: tour.departureLocation || "Đang cập nhật",
    category: tour.category
      ? {
        name: tour.category.name || "",
        slug: tour.category.slug || "",
      }
      : null,
    durationDays: toNumberOrNull(tour.durationDays),
    durationNights: toNumberOrNull(tour.durationNights) ?? 0,
    transportLabel:
      transportLabels[tour.transport] || tour.transportLabel || "Lịch trình linh hoạt",
    availableSeats,
    price: toNumberOrNull(tour.price) ?? displayPrice,
    discountPrice: normalizedDiscountPrice,
    displayPrice,
    firstStartDate: Array.isArray(tour.startDates)
      ? tour.startDates[0] || null
      : tour.firstStartDate || null,
    highlights: Array.isArray(tour.highlights)
      ? tour.highlights.filter(Boolean).slice(0, 3)
      : [],
    summary: tour.summary || buildTourSummary(tour),
    ratingAverage: toNumberOrNull(tour.ratingAverage) ?? 0,
    ratingCount: toNumberOrNull(tour.ratingCount) ?? 0,
    imageUrl: toAssetUrl(imageSource) || null,
    status: tour.status || "",
  };
}

/**
 * Xác thực bearer token với API auth hiện có để lấy user thật từ server.
 *
 * Đầu vào:
 * - `authorizationHeader`: chuỗi `Bearer ...` do trình duyệt gửi lên.
 *
 * Đầu ra:
 * - Trả về user object từ upstream nếu token hợp lệ.
 * - Trả về `null` nếu phía gọi không gửi token.
 *
 * Hành vi nghiệp vụ:
 * - Không tin `userId` do client tự gửi lên.
 * - Server phải tự kiểm tra token rồi mới quyết định ghi vào key user nào.
 *
 * Trường hợp biên:
 * - Không có token => coi như khách vãng lai.
 * - Token hỏng/hết hạn => lỗi sẽ được tầng trên bắt để dùng phương án dự phòng hợp lý.
 */
async function getAuthenticatedUserFromUpstream(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const response = await fetchApi("/api/auth/me", {
    headers: {
      Authorization: authorizationHeader,
    },
    next: { revalidate: 0 },
  });

  return response?.data?.user || null;
}

/**
 * Lấy một tour theo id và chỉ giữ lại nếu tour đó còn hợp lệ để hiển thị công khai.
 *
 * Đầu vào:
 * - `tourId`: id tour đã lưu trong Redis.
 *
 * Đầu ra:
 * - Card recent tour đã được map.
 * - `null` nếu tour không tồn tại, API lỗi, hoặc tour không còn published.
 *
 * Hành vi nghiệp vụ:
 * - Redis chỉ giữ `tourId` để tránh stale data.
 * - Khi hydrate từ Redis, service luôn gọi API tour mới nhất để FE nhận đúng
 *   dữ liệu hiện tại thay vì snapshot cũ.
 *
 * Trường hợp biên:
 * - Tour bị xóa hoặc chuyển draft sau này => bỏ qua, không trả cho FE.
 */
async function getPublishedTourCardById(tourId) {
  try {
    const response = await fetchApi(`/api/tours/${tourId}`, {
      next: { revalidate: 0 },
    });
    const card = mapRecentTourCard(response?.data);

    // Chỉ hiển thị tour còn hợp lệ/published.
    // Một số public API có thể đã tự ẩn tour draft nên không trả `status`;
    // vì vậy chỉ loại khi backend trả về một status tường minh khác published.
    if (!card || (card.status && card.status !== "published")) {
      return null;
    }

    return card;
  } catch {
    return null;
  }
}

/**
 * Xác định ngữ cảnh lưu recent tours cho request hiện tại.
 *
 * Đầu vào:
 * - `authorizationHeader`: bearer token từ trình duyệt, có thể rỗng.
 * - `anonymousId`: anonymous id của trình duyệt dùng cho khách vãng lai.
 *
 * Đầu ra:
 * - Object `{ userId, anonymousId, redisKey }`.
 *
 * Hành vi nghiệp vụ:
 * - Nếu token hợp lệ, dùng `userId` để ghi vào key người dùng.
 * - Nếu chưa đăng nhập, dùng `anonymousId` để ghi vào key khách.
 * - Chỉ dùng anonymous key như phương án dự phòng khi không xác thực được user.
 *
 * Trường hợp biên:
 * - Thiếu cả auth lẫn anonymousId => không thể tạo key Redis.
 * - Upstream auth lỗi => phía gọi có thể dùng localStorage-only ở frontend như phương án dự phòng.
 */
export async function resolveRecentToursContext({
  authorizationHeader = "",
  anonymousId = "",
} = {}) {
  let user = null;

  try {
    user = await getAuthenticatedUserFromUpstream(authorizationHeader);
  } catch {
    user = null;
  }

  const userId = user?.id || user?._id || "";
  const redisKey = resolveRecentToursRedisKey({ userId, anonymousId });

  return {
    userId,
    anonymousId: userId ? "" : anonymousId,
    redisKey,
  };
}

/**
 * Ghi nhận một tour vừa được xem vào Redis.
 *
 * Đầu vào:
 * - `tourId`: id tour hiện tại.
 * - `userId` hoặc `anonymousId`: ngữ cảnh chủ sở hữu của danh sách recent.
 *
 * Đầu ra:
 * - Object `{ stored, redisKey }` cho biết có ghi thành công hay không.
 *
 * Hành vi nghiệp vụ:
 * - Redis chỉ lưu `tourId`, không lưu full snapshot card.
 *   Lý do: key nhẹ hơn, ít stale data hơn, và luôn có thể hydrate lại dữ liệu
 *   tour mới nhất khi đọc.
 * - Xóa tour cũ khỏi list trước khi `LPUSH` để tour mới xem luôn đứng đầu.
 * - `LTRIM` về tối đa 8 phần tử để bám đúng rule UI và tối ưu bộ nhớ.
 * - `EXPIRE` lại TTL sau mỗi lần ghi để lịch sử recent tự hết hạn nếu lâu không dùng.
 *
 * Trường hợp biên:
 * - Thiếu storage key => bỏ qua, không ghi.
 * - Tour không còn public/published => bỏ qua, không đưa vào recent.
 */
export async function recordRecentTourView({
  tourId,
  userId = "",
  anonymousId = "",
} = {}) {
  const redisKey = resolveRecentToursRedisKey({ userId, anonymousId });

  if (!tourId || !redisKey) {
    return {
      stored: false,
      redisKey,
    };
  }

  const tourCard = await getPublishedTourCardById(tourId);
  if (!tourCard) {
    return {
      stored: false,
      redisKey,
    };
  }

  const redis = await getRedisClient();

  await redis.lRem(redisKey, 0, String(tourCard.id));
  await redis.lPush(redisKey, String(tourCard.id));
  await redis.lTrim(redisKey, 0, RECENT_TOURS_LIMIT - 1);
  await redis.expire(redisKey, RECENT_TOURS_TTL_SECONDS);

  return {
    stored: true,
    redisKey,
  };
}

/**
 * Đọc danh sách recent tours từ Redis và hydrate lại thành card cho frontend.
 *
 * Đầu vào:
 * - `userId` hoặc `anonymousId`: ngữ cảnh chủ sở hữu của danh sách recent.
 * - `limit`: số card tối đa cần trả về.
 * - `excludeSlug`: slug của tour hiện tại cần loại khỏi widget nếu có.
 *
 * Đầu ra:
 * - Object `{ tours, redisKey }`.
 *
 * Hành vi nghiệp vụ:
 * - Redis là nguồn thứ tự recent ở phía server.
 * - Mỗi id trong Redis sẽ được hydrate lại qua API tour public để FE luôn nhận
 *   dữ liệu mới nhất, đúng với trạng thái hiện tại của tour.
 * - `excludeSlug` được áp dụng sau bước hydrate để vẫn giữ đúng thứ tự recent
 *   nhưng ẩn tour đang xem khỏi danh sách gợi ý.
 *
 * Trường hợp biên:
 * - Thiếu storage key => trả về rỗng an toàn.
 * - Tour đã xóa hoặc không còn published => tự bỏ qua.
 * - Redis hoặc upstream API lỗi => phía gọi sẽ bắt lỗi và giữ local dự phòng.
 */
export async function getRecentTours({
  userId = "",
  anonymousId = "",
  limit = RECENT_TOURS_LIMIT,
  excludeSlug = "",
} = {}) {
  const redisKey = resolveRecentToursRedisKey({ userId, anonymousId });

  if (!redisKey) {
    return {
      tours: [],
      redisKey,
    };
  }

  const redis = await getRedisClient();
  const redisRecentTourIds = await redis.lRange(redisKey, 0, RECENT_TOURS_LIMIT - 1);

  if (!Array.isArray(redisRecentTourIds) || redisRecentTourIds.length === 0) {
    return {
      tours: [],
      redisKey,
    };
  }

  /**
   * `Promise.all` vẫn giữ nguyên thứ tự mảng đầu vào, nên danh sách sau hydrate
   * sẽ bám đúng thứ tự recent của Redis.
   *
   * Nếu sau này tối ưu sang một query DB kiểu `$in`, bắt buộc phải reorder lại
   * theo thứ tự id từ Redis vì `$in` không đảm bảo giữ nguyên thứ tự đầu vào.
   */
  const hydratedTours = await Promise.all(
    redisRecentTourIds.map((tourId) => getPublishedTourCardById(tourId))
  );

  const tours = hydratedTours
    .filter(Boolean)
    .filter((tour) => (excludeSlug ? tour.slug !== excludeSlug : true))
    .slice(0, Math.max(1, Math.min(Number(limit) || RECENT_TOURS_LIMIT, RECENT_TOURS_LIMIT)));

  return {
    tours,
    redisKey,
  };
}

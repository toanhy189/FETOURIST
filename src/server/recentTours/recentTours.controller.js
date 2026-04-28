import { NextResponse } from "next/server";
import { RECENT_TOURS_LIMIT } from "@/server/recentTours/constants";
import {
  getRecentTours,
  recordRecentTourView,
  resolveRecentToursContext,
} from "@/server/recentTours/recentTours.service";

/**
 * Helper trả response JSON success theo format thống nhất của app.
 *
 * Đầu vào:
 * - `data`: payload thực tế.
 * - `message`: thông điệp mô tả ngắn cho client/log.
 * - `status`: HTTP status, mặc định là 200.
 *
 * Đầu ra:
 * - `NextResponse` với shape `{ success, message, data }`.
 */
function jsonSuccess(data, message, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Helper trả response JSON error theo format thống nhất của app.
 *
 * Đầu vào:
 * - `message`: thông điệp lỗi cho client.
 * - `status`: HTTP status, mặc định là 500.
 *
 * Đầu ra:
 * - `NextResponse` với shape `{ success: false, message }`.
 */
function jsonError(message, status = 500) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

/**
 * Controller cho `GET /api/recent-tours`.
 *
 * Đầu vào:
 * - `request`: Next.js request, lấy `limit`, `excludeSlug`, `anonymousId`,
 *   và `authorization` từ query/header.
 *
 * Đầu ra:
 * - Danh sách recent tours đã hydrate từ Redis.
 *
 * Hành vi nghiệp vụ:
 * - Chuẩn hóa `limit` về đúng range 1..8.
 * - Tự xác định đang đọc recent theo user hay theo khách.
 * - Trả `source: "redis"` để FE biết dữ liệu này đến từ phía server.
 *
 * Trường hợp biên:
 * - Thiếu identity => trả 400.
 * - Redis/upstream API lỗi => trả 503 để FE dùng local cache dự phòng.
 */
export async function getRecentToursController(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      Math.min(Number(searchParams.get("limit")) || RECENT_TOURS_LIMIT, RECENT_TOURS_LIMIT)
    );
    const excludeSlug = searchParams.get("excludeSlug") || "";
    const anonymousId = searchParams.get("anonymousId") || "";
    const authorizationHeader = request.headers.get("authorization") || "";
    const context = await resolveRecentToursContext({
      authorizationHeader,
      anonymousId,
    });

    if (!context.redisKey) {
      return jsonError("Missing recent tours identity.", 400);
    }

    const result = await getRecentTours({
      userId: context.userId,
      anonymousId: context.anonymousId,
      limit,
      excludeSlug,
    });

    return jsonSuccess(
      {
        tours: result.tours,
        source: "redis",
      },
      "Recent tours loaded."
    );
  } catch (error) {
    console.error("[recent-tours] GET failed:", error);
    return jsonError(
      "Dịch vụ recent tours tạm thời không khả dụng. Frontend nên tiếp tục dùng local cache.",
      503
    );
  }
}

/**
 * Controller cho `POST /api/recent-tours/view`.
 *
 * Đầu vào:
 * - `request`: Next.js request, body gồm `tourId`, `anonymousId`,
 *   và có thể có `authorization` header.
 *
 * Đầu ra:
 * - Kết quả ghi recent tour vào Redis.
 *
 * Hành vi nghiệp vụ:
 * - Xác thực ngữ cảnh user/khách bằng service chung.
 * - Chỉ ghi recent nếu có `tourId` và xác định được storage key.
 * - Dù phía gọi thường chạy nền ở background, API vẫn trả response rõ ràng để dễ debug.
 *
 * Trường hợp biên:
 * - Thiếu `tourId` => trả 400.
 * - Thiếu identity => trả 400.
 * - Redis lỗi => trả 503 để FE giữ local-only mà không vỡ trang.
 */
export async function recordRecentTourViewController(request) {
  try {
    const payload = await request.json().catch(() => null);
    const tourId = payload?.tourId || "";
    const anonymousId = payload?.anonymousId || "";
    const authorizationHeader = request.headers.get("authorization") || "";
    const context = await resolveRecentToursContext({
      authorizationHeader,
      anonymousId,
    });

    if (!tourId) {
      return jsonError("tourId is required.", 400);
    }

    if (!context.redisKey) {
      return jsonError("Missing recent tours identity.", 400);
    }

    const result = await recordRecentTourView({
      tourId,
      userId: context.userId,
      anonymousId: context.anonymousId,
    });

    return jsonSuccess(result, "Recent tour view recorded.");
  } catch (error) {
    console.error("[recent-tours] POST /view failed:", error);
    return jsonError(
      "Dịch vụ recent tours tạm thời không khả dụng. Frontend nên giữ local cache hiện tại.",
      503
    );
  }
}

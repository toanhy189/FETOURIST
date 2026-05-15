"use client";

import { readStoredSession } from "@/apiService/AxiosInstance/AxiosInstance";
import { getAnonymousId } from "@/utils/anonymousUtils";

/**
 * Tạo URL nội bộ cho API recent tours trong chính Next app.
 *
 * Đầu vào:
 * - `path`: hậu tố route, ví dụ `"/view"`.
 * - `searchParams`: object query string cần gắn vào URL.
 *
 * Đầu ra:
 * - URL đầy đủ dạng `http://host/api/recent-tours...`.
 *
 * Hành vi nghiệp vụ:
 * - FE gọi same-origin route này để vừa giữ được auth hiện có, vừa có một lớp
 *   phía server dùng Redis mà không phải đổi flow UI cũ quá nhiều.
 */
function buildRecentToursApiUrl(path = "", searchParams = {}) {
  const url = new URL(`/api/recent-tours${path}`, window.location.origin);

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

/**
 * Parse response JSON của API recent tours và chuẩn hóa lỗi.
 *
 * Đầu vào:
 * - `response`: đối tượng `fetch Response`.
 *
 * Đầu ra:
 * - Payload JSON đã parse nếu request thành công.
 * - Throw `Error` có gắn thêm `status` và `payload` nếu API báo lỗi.
 *
 * Hành vi nghiệp vụ:
 * - FE cần một nơi parse lỗi tập trung để phía gọi chỉ việc `try/catch` và quyết
 *   định có giữ local dự phòng hay không.
 */
async function parseRecentToursResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.message || "Không thể đồng bộ recent tours.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

/**
 * Gắn `Authorization` header nếu trình duyệt đang có access token.
 *
 * Đầu vào:
 * - `headers`: object header gốc cần bổ sung.
 *
 * Đầu ra:
 * - Header object hoàn chỉnh, có hoặc không có `Authorization`.
 *
 * Hành vi nghiệp vụ:
 * - Với user đã đăng nhập, server sẽ ưu tiên key Redis theo `userId`.
 * - Với khách vãng lai, request vẫn hoạt động bình thường chỉ với `anonymousId`.
 */
function buildOptionalAuthHeaders(headers = {}) {
  const accessToken = readStoredSession().accessToken;

  return accessToken
    ? {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
      }
    : headers;
}

/**
 * Gửi tín hiệu "vừa xem tour" lên server để đồng bộ Redis.
 *
 * Đầu vào:
 * - `tourId`: id tour hiện tại.
 * - `anonymousId`: anonymous id của trình duyệt; với user đã đăng nhập thì server
 *   sẽ ưu tiên key user đã xác thực.
 *
 * Đầu ra:
 * - Payload chuẩn `{ success, message, data }` từ API recent tours.
 *
 * Hành vi nghiệp vụ:
 * - Hàm này luôn chạy sau bước save local để UI phản hồi ngay.
 * - Nếu request lỗi, phía gọi chỉ cần bắt lỗi và giữ local cache hiện tại.
 *
 * Trường hợp biên:
 * - Không có `tourId` hoặc đang SSR => trả `null`, không gọi API.
 */
export async function syncRecentTourToServer({
  tourId,
  anonymousId = "",
} = {}) {
  if (typeof window === "undefined" || !tourId) {
    return null;
  }

  const resolvedAnonymousId = anonymousId || getAnonymousId();
  const response = await fetch(buildRecentToursApiUrl("/view"), {
    method: "POST",
    headers: buildOptionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    cache: "no-store",
    body: JSON.stringify({
      tourId,
      anonymousId: resolvedAnonymousId,
    }),
  });

  return parseRecentToursResponse(response);
}

/**
 * Lấy danh sách recent tours chuẩn từ server.
 *
 * Đầu vào:
 * - `limit`: số lượng tour tối đa.
 * - `excludeSlug`: slug cần loại khỏi danh sách.
 * - `anonymousId`: anonymous id của trình duyệt.
 *
 * Đầu ra:
 * - Mảng tour card đã hydrate từ Redis qua API phía server.
 *
 * Hành vi nghiệp vụ:
 * - Phía gọi thường render localStorage trước, sau đó mới gọi hàm này để sync.
 * - Nếu lỗi, phía gọi nên giữ nguyên local cache thay vì xóa UI.
 *
 * Trường hợp biên:
 * - SSR => trả mảng rỗng.
 */
export async function getRecentToursFromServer({
  limit,
  excludeSlug = "",
  anonymousId = "",
} = {}) {
  if (typeof window === "undefined") {
    return [];
  }

  const resolvedAnonymousId = anonymousId || getAnonymousId();
  const response = await fetch(
    buildRecentToursApiUrl("", {
      limit,
      excludeSlug,
      anonymousId: resolvedAnonymousId,
    }),
    {
      method: "GET",
      headers: buildOptionalAuthHeaders({
        Accept: "application/json",
      }),
      cache: "no-store",
    }
  );

  const payload = await parseRecentToursResponse(response);
  return Array.isArray(payload?.data?.tours) ? payload.data.tours : [];
}

/**
 * Đồng bộ cả danh sách recent local hiện có lên server theo đúng thứ tự.
 *
 * Đầu vào:
 * - `tours`: danh sách local recent đã sắp từ mới nhất -> cũ nhất.
 * - `anonymousId`: anonymous id của trình duyệt.
 *
 * Đầu ra:
 * - Số lượng item đã sync thành công theo lượt gọi API.
 *
 * Hành vi nghiệp vụ:
 * - Redis dùng `LPUSH`, nên để giữ đúng thứ tự cuối cùng ta phải replay ngược
 *   từ cũ nhất -> mới nhất.
 * - Hàm này được dùng cho luồng merge recent của khách sang recent của user sau login.
 *
 * Trường hợp biên:
 * - Không có tours hoặc đang SSR => trả `0`.
 */
export async function syncRecentTourListToServer({
  tours = [],
  anonymousId = "",
} = {}) {
  if (typeof window === "undefined" || !Array.isArray(tours) || tours.length === 0) {
    return 0;
  }

  let syncedCount = 0;

  for (const tour of [...tours].reverse()) {
    if (!tour?.id) {
      continue;
    }

    await syncRecentTourToServer({
      tourId: tour.id,
      anonymousId,
    });
    syncedCount += 1;
  }

  return syncedCount;
}

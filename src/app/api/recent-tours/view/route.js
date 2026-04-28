import { recordRecentTourViewController } from "@/server/recentTours/recentTours.controller";

export const dynamic = "force-dynamic";

/**
 * Route handler cho `POST /api/recent-tours/view`.
 *
 * Đầu vào:
 * - `request`: Next request chứa `tourId`, `anonymousId`, và có thể có bearer token.
 *
 * Đầu ra:
 * - `NextResponse` do controller recent tours trả về.
 *
 * Hành vi nghiệp vụ:
 * - Tách riêng route và controller để logic xử lý business/Redis không nằm trực
 *   tiếp trong file route mỏng này.
 */
export async function POST(request) {
  return recordRecentTourViewController(request);
}

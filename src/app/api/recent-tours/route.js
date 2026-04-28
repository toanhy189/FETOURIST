import { getRecentToursController } from "@/server/recentTours/recentTours.controller";

export const dynamic = "force-dynamic";

/**
 * Route handler cho `GET /api/recent-tours`.
 *
 * Đầu vào:
 * - `request`: Next request hiện tại.
 *
 * Đầu ra:
 * - `NextResponse` do controller recent tours trả về.
 *
 * Hành vi nghiệp vụ:
 * - Route này chỉ làm nhiệm vụ chuyển tiếp sang controller để giữ tách lớp
 *   route -> controller -> service cho phần recent tours hybrid.
 */
export async function GET(request) {
  return getRecentToursController(request);
}

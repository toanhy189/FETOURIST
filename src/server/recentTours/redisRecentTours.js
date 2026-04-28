import { createClient } from "redis";

/**
 * Dùng `globalThis` để giữ lại promise kết nối Redis giữa các lần reload module
 * trong môi trường dev/serverless-like, tránh tạo quá nhiều connection giống nhau.
 */
const globalRedisState = globalThis;

/**
 * Tạo kết nối Redis vật lý cho tính năng recent tours.
 *
 * Đầu vào:
 * - Không có tham số. Hàm đọc `REDIS_URL` từ biến môi trường.
 *
 * Đầu ra:
 * - Trả về Redis client đã `connect()`.
 *
 * Hành vi nghiệp vụ:
 * - Redis là lớp lưu recent tours phía server.
 * - Nếu thiếu cấu hình Redis, hàm chủ động throw lỗi rõ ràng để tầng trên quyết
 *   định trả lỗi API hay cho frontend dùng local-only làm phương án dự phòng.
 *
 * Trường hợp biên:
 * - Thiếu `REDIS_URL` => throw ngay.
 * - Redis phát sinh lỗi runtime => log ra để dễ quan sát khi debug vận hành.
 */
async function createRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not configured.");
  }

  const client = createClient({
    url: redisUrl,
  });

  client.on("error", (error) => {
    console.error("[recent-tours] Redis client error:", error);
  });

  await client.connect();
  return client;
}

/**
 * Lấy Redis client dùng chung cho toàn bộ request của feature recent tours.
 *
 * Đầu vào:
 * - Không có tham số.
 *
 * Đầu ra:
 * - Promise resolve ra Redis client đang hoạt động.
 *
 * Hành vi nghiệp vụ:
 * - Chỉ khởi tạo một lần rồi cache lại promise kết nối.
 * - Giúp các service recent tours dùng Redis ổn định mà không cần tự quản lý
 *   lifecycle connection ở từng nơi.
 *
 * Trường hợp biên:
 * - Nếu lần khởi tạo đầu tiên thất bại, phía gọi sẽ nhận lỗi để xử lý dự phòng.
 */
export async function getRedisClient() {
  if (!globalRedisState.__travelptitRecentToursRedisPromise) {
    globalRedisState.__travelptitRecentToursRedisPromise = createRedisConnection();
  }

  return globalRedisState.__travelptitRecentToursRedisPromise;
}

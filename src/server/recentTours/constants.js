//   Số lượng recent tours tối đa cho cả localStorage lẫn Redis.
export const RECENT_TOURS_LIMIT = 8;

/**
 * TTL tính theo ngày cho danh sách recent tours trên Redis.
 * Mỗi lần người dùng xem tour mới, TTL sẽ được refresh lại để lịch sử còn hoạt động.
 */
export const RECENT_TOURS_TTL_DAYS = Number(process.env.RECENT_TOURS_TTL_DAYS || 30);


//   TTL quy đổi sang giây để truyền trực tiếp cho lệnh `EXPIRE` của Redis.
export const RECENT_TOURS_TTL_SECONDS = RECENT_TOURS_TTL_DAYS * 24 * 60 * 60;

/**
 * Prefix cho key Redis của người dùng đã đăng nhập.
 * Ví dụ: `recent_tours:user:65f123...`
 */
export const RECENT_TOURS_USER_KEY_PREFIX = "recent_tours:user:";

/**
 * Prefix cho key Redis của khách vãng lai.
 * Ví dụ: `recent_tours:anon:anon-171234...`
 */
export const RECENT_TOURS_ANON_KEY_PREFIX = "recent_tours:anon:";

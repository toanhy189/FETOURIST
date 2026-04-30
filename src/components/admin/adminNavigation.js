export const ADMIN_ROUTE_MAP = {
  dashboard: {
    key: "dashboard",
    href: "/admin",
    label: "Dashboard",
    description:
      "Theo dõi KPI vận hành, tour nổi bật và các booking mới nhất trên cùng một màn hình.",
  },
  admins: {
    key: "admins",
    href: "/admin/admins",
    label: "Quản lý admin",
    description:
      "Cập nhật hồ sơ quản trị viên và theo dõi quyền truy cập của tài khoản vận hành.",
  },
  users: {
    key: "users",
    href: "/admin/users",
    label: "Quản lý người dùng",
    description:
      "Theo dõi tài khoản user, cập nhật quyền và khóa hoặc khôi phục tài khoản khi cần.",
  },
  categories: {
    key: "categories",
    href: "/admin/categories",
    label: "Quản lý danh mục",
    description:
      "Quản trị cây danh mục tour, bao gồm danh mục cha, trạng thái hiển thị và thứ tự sắp xếp.",
  },
  "tour-list": {
    key: "tour-list",
    href: "/admin/tours",
    label: "Danh sách tour",
    description: "Xem, lọc và chỉnh sửa toàn bộ tour hiện có trong hệ thống.",
  },
  "tour-create": {
    key: "tour-create",
    href: "/admin/tours/create",
    label: "Thêm tour",
    description:
      "Tạo tour mới theo từng bước và điền đủ thông tin bắt buộc trước khi sang bước tiếp theo.",
  },
  bookings: {
    key: "bookings",
    href: "/admin/bookings",
    label: "Quản lý booking",
    description:
      "Cập nhật đơn đặt, giao dịch và đối soát thông tin thanh toán của khách hàng.",
  },
  contacts: {
    key: "contacts",
    href: "/admin/contacts",
    label: "Liên hệ",
    description:
      "Hộp thư liên hệ để CSKH xem yêu cầu, gửi phản hồi qua email và theo dõi lịch sử xử lý.",
  },
  "support-chat": {
    key: "support-chat",
    href: "/admin/chat",
    label: "Chat tư vấn",
    description:
      "Quản lý hội thoại realtime giữa khách hàng và quản trị viên, hỗ trợ tư vấn tour trực tiếp.",
  },
};

export const adminNavItems = [
  ADMIN_ROUTE_MAP.dashboard,
  ADMIN_ROUTE_MAP.admins,
  ADMIN_ROUTE_MAP.users,
  ADMIN_ROUTE_MAP.categories,
  {
    key: "tours",
    href: ADMIN_ROUTE_MAP["tour-list"].href,
    label: "Quản lý tour du lịch",
    description:
      "Điều phối thêm tour mới, cập nhật danh sách tour và giữ nguyên luồng CRUD tour hiện tại.",
    children: [ADMIN_ROUTE_MAP["tour-list"], ADMIN_ROUTE_MAP["tour-create"]],
  },
  ADMIN_ROUTE_MAP.bookings,
  ADMIN_ROUTE_MAP.contacts,
  ADMIN_ROUTE_MAP["support-chat"],
];

function normalizeSegments(segments) {
  return Array.isArray(segments) ? segments.filter(Boolean) : [];
}

export function resolveAdminRouteFromSegments(segments) {
  const normalizedSegments = normalizeSegments(segments);

  if (normalizedSegments.length === 0) {
    return ADMIN_ROUTE_MAP.dashboard;
  }

  if (normalizedSegments.length === 1) {
    const [section] = normalizedSegments;

    switch (section) {
      case "admins":
        return ADMIN_ROUTE_MAP.admins;
      case "users":
        return ADMIN_ROUTE_MAP.users;
      case "categories":
        return ADMIN_ROUTE_MAP.categories;
      case "tours":
        return ADMIN_ROUTE_MAP["tour-list"];
      case "bookings":
        return ADMIN_ROUTE_MAP.bookings;
      case "contacts":
        return ADMIN_ROUTE_MAP.contacts;
      case "chat":
        return ADMIN_ROUTE_MAP["support-chat"];
      default:
        return null;
    }
  }

  if (normalizedSegments.length === 2) {
    const [section, child] = normalizedSegments;

    if (section === "tours" && child === "create") {
      return ADMIN_ROUTE_MAP["tour-create"];
    }
  }

  return null;
}

export function resolveAdminRouteFromPathname(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/admin")) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean).slice(1);
  return resolveAdminRouteFromSegments(segments);
}

export function findActiveAdminItem(items, activeKey) {
  for (const item of items) {
    if (item.key === activeKey) {
      return item;
    }

    if (item.children?.length) {
      const matchedChild = item.children.find((child) => child.key === activeKey);

      if (matchedChild) {
        return matchedChild;
      }
    }
  }

  return ADMIN_ROUTE_MAP.dashboard;
}

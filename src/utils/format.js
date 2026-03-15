const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatVnd(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Lien he";
  }

  return vndFormatter.format(value);
}

export function formatDateVi(value) {
  if (!value) {
    return "Dang cap nhat";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Dang cap nhat";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeVi(value) {
  if (!value) {
    return "Dang cap nhat";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Dang cap nhat";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDuration(days, nights) {
  if (!Number.isFinite(days) || !Number.isFinite(nights)) {
    return "Lich trinh linh hoat";
  }

  return `${days} ngay ${nights} dem`;
}

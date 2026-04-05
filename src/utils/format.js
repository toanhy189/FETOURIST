const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const shortDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
});
const shortDateWithYearFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function toDateSafely(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatVnd(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Lien he";
  }

  return vndFormatter.format(value);
}

export function formatDateVi(value) {
  const date = toDateSafely(value);
  if (!date) {
    return "Dang cap nhat";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeVi(value) {
  const date = toDateSafely(value);
  if (!date) {
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

export function formatShortDateVi(value, { includeYear = false } = {}) {
  const date = toDateSafely(value);
  if (!date) {
    return "Dang cap nhat";
  }

  return includeYear ? shortDateWithYearFormatter.format(date) : shortDateFormatter.format(date);
}

export function formatWeekdayDateVi(value, { includeYear = false } = {}) {
  const date = toDateSafely(value);
  if (!date) {
    return "Dang cap nhat";
  }

  const weekdayLabel = WEEKDAY_LABELS[date.getDay()] || "CN";
  return `${weekdayLabel}, ${formatShortDateVi(date, { includeYear })}`;
}

export function formatDateRangeVi(startValue, endValue, { includeYear = true } = {}) {
  const startDate = toDateSafely(startValue);
  const endDate = toDateSafely(endValue);

  if (!startDate && !endDate) {
    return "Dang cap nhat";
  }

  if (!startDate) {
    return formatShortDateVi(endDate, { includeYear });
  }

  if (!endDate) {
    return formatShortDateVi(startDate, { includeYear });
  }

  return `${formatShortDateVi(startDate, { includeYear })} - ${formatShortDateVi(endDate, { includeYear })}`;
}

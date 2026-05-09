const DEFAULT_API_BASE_URL = "http://localhost:4000";
const LOCAL_API_ORIGINS = new Set([
  "http://localhost:4000",
  "http://127.0.0.1:4000",
]);

// Gom base URL vao 1 cho de sau nay doi server local/staging chi can sua env.
export function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    DEFAULT_API_BASE_URL
  );
}

export function buildApiUrl(path, searchParams) {
  // Helper nay nhan path + object query, sau do build thanh URL day du.
  const url = new URL(path, getApiBaseUrl());

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export async function fetchApi(path, options = {}) {
  // fetchApi duoc dung cho public/server requests, con private auth request
  // se di qua AxiosInstance de tu dong gan token va refresh token.
  const { searchParams, next = { revalidate: 60 }, headers, ...fetchOptions } = options;
  const response = await fetch(buildApiUrl(path, searchParams), {
    ...fetchOptions,
    headers: {
      Accept: "application/json",
      ...headers,
    },
    next,
  });

  // Backend TRAVELPTIT tra ve JSON co success/message/data,
  // nen service chung parse va nem loi o day de page tren gon hon.
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.message || "Khong the tai du lieu tu API.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function toAssetUrl(assetPath) {
  // Chuan hoa duong dan anh/file tu backend thanh URL FE co the render duoc ngay.
  if (!assetPath) {
    return null;
  }

  if (/^https?:\/\//i.test(assetPath)) {
    try {
      const url = new URL(assetPath);

      if (LOCAL_API_ORIGINS.has(url.origin)) {
        return new URL(`${url.pathname}${url.search}${url.hash}`, getApiBaseUrl()).toString();
      }
    } catch {
      return assetPath;
    }

    return assetPath;
  }

  return new URL(assetPath, getApiBaseUrl()).toString();
}

"use client";

import { buildApiUrl } from "@/apiService/base";
import { isTokenExpired } from "@/utils/authenticate";

const STORAGE_KEYS = {
  accessToken: "travelptit.accessToken",
  refreshToken: "travelptit.refreshToken",
  user: "travelptit.user",
};

let refreshPromise = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function parsePayloadSafely(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractApiErrorDetail(details) {
  if (!details) {
    return "";
  }

  if (typeof details === "string") {
    return details.trim();
  }

  if (Array.isArray(details)) {
    return details.map(extractApiErrorDetail).find(Boolean) || "";
  }

  if (typeof details === "object") {
    if (typeof details.message === "string" && details.message.trim()) {
      return details.message.trim();
    }

    if (typeof details.msg === "string" && details.msg.trim()) {
      return details.msg.trim();
    }

    return (
      Object.values(details)
        .map((item) => {
          if (!item || typeof item !== "object") {
            return extractApiErrorDetail(item);
          }

          if (typeof item.properties?.message === "string" && item.properties.message.trim()) {
            return item.properties.message.trim();
          }

          return extractApiErrorDetail(item.message || item.reason || item);
        })
        .find(Boolean) || ""
    );
  }

  return "";
}

function buildApiErrorMessage(payload) {
  const baseMessage = payload?.message || "Khong the xu ly yeu cau.";
  const detailMessage = extractApiErrorDetail(payload?.errorDetails);

  if (!detailMessage || detailMessage === baseMessage) {
    return baseMessage;
  }

  if (baseMessage === "Du lieu tour khong hop le.") {
    return detailMessage;
  }

  return `${baseMessage} ${detailMessage}`;
}

export function readStoredSession() {
  if (!isBrowser()) {
    return {
      accessToken: "",
      refreshToken: "",
      user: null,
    };
  }

  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken) || "",
    refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken) || "",
    user: parsePayloadSafely(localStorage.getItem(STORAGE_KEYS.user) || "null"),
  };
}

export function saveStoredSession({ accessToken, refreshToken, user }) {
  if (!isBrowser()) {
    return;
  }

  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  }

  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }
}

export function patchStoredUser(user) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user || null));
}

export function clearStoredSession() {
  if (!isBrowser()) {
    return;
  }

  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    const error = new Error(buildApiErrorMessage(payload));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function refreshAccessToken() {
  const session = readStoredSession();
  if (!session.refreshToken || isTokenExpired(session.refreshToken)) {
    clearStoredSession();
    throw new Error("Phien dang nhap da het han.");
  }

  if (!refreshPromise) {
    refreshPromise = fetch(buildApiUrl("/api/auth/refresh"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: session.refreshToken,
      }),
    })
      .then(parseApiResponse)
      .then((payload) => {
        const nextSession = {
          accessToken: payload.data.accessToken,
          refreshToken: payload.data.refreshToken,
          user: payload.data.user,
        };

        saveStoredSession(nextSession);
        return nextSession.accessToken;
      })
      .catch((error) => {
        clearStoredSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request(path, options = {}) {
  const {
    method = "GET",
    data,
    headers,
    auth = false,
    retry = true,
    searchParams,
  } = options;

  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const session = readStoredSession();
  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (!isFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth && session.accessToken) {
    requestHeaders.Authorization = `Bearer ${session.accessToken}`;
  }

  try {
    const response = await fetch(buildApiUrl(path, searchParams), {
      method,
      headers: requestHeaders,
      body:
        method === "GET" || method === "HEAD" || data === undefined
          ? undefined
          : isFormData
            ? data
            : JSON.stringify(data),
    });

    return await parseApiResponse(response);
  } catch (error) {
    // 401 tu private API thi thu refresh access token 1 lan roi goi lai request.
    if (auth && retry && error?.status === 401) {
      const nextAccessToken = await refreshAccessToken();
      return request(path, {
        ...options,
        retry: false,
        headers: {
          ...headers,
          Authorization: `Bearer ${nextAccessToken}`,
        },
      });
    }

    throw error;
  }
}

export function publicRequest(path, options = {}) {
  return request(path, options);
}

export function privateRequest(path, options = {}) {
  return request(path, {
    ...options,
    auth: true,
  });
}

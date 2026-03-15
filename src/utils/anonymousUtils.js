const ANONYMOUS_ID_KEY = "betourist.anonymousId";

function generateAnonymousId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function setAnonymousId() {
  if (typeof window === "undefined" || !window.localStorage) {
    return generateAnonymousId();
  }

  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!anonymousId || anonymousId === "undefined") {
    anonymousId = generateAnonymousId();
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  }

  return anonymousId;
}

export function getAnonymousId() {
  if (typeof window === "undefined" || !window.localStorage) {
    return generateAnonymousId();
  }

  const anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);
  return anonymousId && anonymousId !== "undefined" ? anonymousId : setAnonymousId();
}

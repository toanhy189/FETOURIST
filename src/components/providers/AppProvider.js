"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from "react";
import { readStoredSession } from "@/apiService/AxiosInstance/AxiosInstance";
import { fetchMe, login, logout, register } from "@/apiService/auth";
import { getUnreadNotificationCount } from "@/apiService/notifications";
import { getAnonymousId } from "@/utils/anonymousUtils";

const AppContext = createContext(null);
const emptySession = {
  accessToken: "",
  refreshToken: "",
  user: null,
};

export function AppProvider({ children }) {
  const [session, setSession] = useState(emptySession);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  async function refreshProfile() {
    const nextUser = await fetchMe();

    startTransition(() => {
      setSession((currentSession) => ({
        ...currentSession,
        user: nextUser,
      }));
    });

    return nextUser;
  }

  async function refreshNotifications(accessTokenOverride) {
    const activeAccessToken =
      accessTokenOverride || readStoredSession().accessToken || session.accessToken;

    if (!activeAccessToken) {
      setNotificationCount(0);
      return 0;
    }

    try {
      const unreadCount = await getUnreadNotificationCount();
      setNotificationCount(unreadCount);
      return unreadCount;
    } catch {
      setNotificationCount(0);
      return 0;
    }
  }

  async function loginWithCredentials(payload) {
    const nextSession = await login(payload);
    setSession(nextSession);
    await refreshNotifications(nextSession.accessToken);
    return nextSession.user;
  }

  async function registerWithCredentials(payload) {
    const nextSession = await register(payload);
    setSession(nextSession);
    await refreshNotifications(nextSession.accessToken);
    return nextSession.user;
  }

  async function logoutCurrentUser() {
    await logout();
    setSession(emptySession);
    setNotificationCount(0);
  }

  useEffect(() => {
    let isMounted = true;

    // Anonymous ID duoc tao som de FE co the luu recent views/draft cho guest.
    getAnonymousId();

    async function bootstrap() {
      const storedSession = readStoredSession();
      // Cho mount hoan tat roi moi dong bo state tu localStorage de tranh warning lint.
      await Promise.resolve();

      if (!isMounted) {
        return;
      }

      setSession(storedSession);

      if (!storedSession.accessToken) {
        setIsBootstrapping(false);
        return;
      }

      const [profileResult, notificationResult] = await Promise.allSettled([
        fetchMe(),
        getUnreadNotificationCount(),
      ]);

      if (!isMounted) {
        return;
      }

      if (profileResult.status === "fulfilled") {
        setSession((currentSession) => ({
          ...currentSession,
          user: profileResult.value,
        }));
      } else {
        setSession(readStoredSession());
      }

      setNotificationCount(
        notificationResult.status === "fulfilled" ? notificationResult.value : 0
      );
      setIsBootstrapping(false);
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        session,
        currentUser: session.user,
        isAuthenticated: Boolean(session.accessToken && session.user),
        isAdmin: session.user?.role === "admin",
        isBootstrapping,
        notificationCount,
        login: loginWithCredentials,
        register: registerWithCredentials,
        logout: logoutCurrentUser,
        refreshProfile,
        refreshNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext phai duoc goi ben trong AppProvider.");
  }

  return context;
}

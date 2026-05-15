"use client";

import {
  useCallback,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { readStoredSession } from "@/apiService/AxiosInstance/AxiosInstance";
import { fetchMe, login, logout, register } from "@/apiService/auth";
import { getUnreadNotificationCount } from "@/apiService/notifications";
import { getAnonymousId } from "@/utils/anonymousUtils";
import {
  refreshRecentToursFromServer,
  syncAnonymousRecentToursToUser,
} from "@/utils/recentTours";

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
  const [chatPageContext, setChatPageContext] = useState(null);

  const refreshProfile = useCallback(async () => {
    const nextUser = await fetchMe();

    startTransition(() => {
      setSession((currentSession) => ({
        ...currentSession,
        user: nextUser,
      }));
    });

    return nextUser;
  }, []);

  const refreshNotifications = useCallback(async (accessTokenOverride) => {
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
  }, [session.accessToken]);

  const loginWithCredentials = useCallback(async (payload) => {
    const nextSession = await login(payload);
    setSession(nextSession);
    await refreshNotifications(nextSession.accessToken);
    return nextSession.user;
  }, [refreshNotifications]);

  const registerWithCredentials = useCallback(async (payload) => {
    const nextSession = await register(payload);
    setSession(nextSession);
    await refreshNotifications(nextSession.accessToken);
    return nextSession.user;
  }, [refreshNotifications]);

  const logoutCurrentUser = useCallback(async () => {
    await logout();
    setSession(emptySession);
    setNotificationCount(0);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Anonymous ID được tạo som de FE co the luu recent views/draft cho guest.
    getAnonymousId();

    async function bootstrap() {
      const storedSession = readStoredSession();
      // Cho mount hoàn tất roi moi đồng bộ state tu localStorage de tranh warning lint.
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

  useEffect(() => {
    if (!session.accessToken || !session.user?.id) {
      return;
    }

    /**
     * When a guest later authenticates, we replay the browser-local recent list
     * into the user-scoped Redis key and then refresh the shared cache back into
     * localStorage. This keeps the "guest to user" experience without blocking
     * login and without removing the current local fallback path.
     */
    async function hydrateHybridRecentTours() {
      try {
        await syncAnonymousRecentToursToUser(session.user.id);
        await refreshRecentToursFromServer();
      } catch {
        // The UI can safely continue on local cache if server sync is unavailable.
      }
    }

    void hydrateHybridRecentTours();
  }, [session.accessToken, session.user?.id]);

  const contextValue = useMemo(
    () => ({
      session,
      currentUser: session.user,
      isAuthenticated: Boolean(session.accessToken && session.user),
      isAdmin: session.user?.role === "admin",
      isBootstrapping,
      notificationCount,
      chatPageContext,
      login: loginWithCredentials,
      register: registerWithCredentials,
      logout: logoutCurrentUser,
      refreshProfile,
      refreshNotifications,
      setChatPageContext,
    }),
    [
      chatPageContext,
      isBootstrapping,
      loginWithCredentials,
      logoutCurrentUser,
      notificationCount,
      refreshNotifications,
      refreshProfile,
      registerWithCredentials,
      setChatPageContext,
      session,
    ]
  );

  return (
    <AppContext.Provider
      value={contextValue}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext phai được gọi ben trong AppProvider.");
  }

  return context;
}

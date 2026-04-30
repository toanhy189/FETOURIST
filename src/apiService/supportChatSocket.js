import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let supportChatSocket = null;
let activeAccessToken = "";

export const connectSupportChatSocket = (accessToken) => {
  if (!accessToken) {
    return null;
  }

  const nextToken = String(accessToken);

  if (supportChatSocket && activeAccessToken !== nextToken) {
    supportChatSocket.disconnect();
    supportChatSocket = null;
    activeAccessToken = "";
  }

  if (supportChatSocket?.connected) {
    return supportChatSocket;
  }

  activeAccessToken = nextToken;

  supportChatSocket = io(`${API_URL}/support-chat`, {
    auth: {
      token: nextToken,
    },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  supportChatSocket.on("connect", () => {
    console.log("Support chat socket connected:", supportChatSocket.id);
  });

  supportChatSocket.on("connect_error", (error) => {
    console.error("Support chat socket connect error:", error.message);
  });

  supportChatSocket.on("disconnect", (reason) => {
    console.warn("Support chat socket disconnected:", reason);
  });

  return supportChatSocket;
};

export const getSupportChatSocket = () => supportChatSocket;

export const disconnectSupportChatSocket = () => {
  if (supportChatSocket) {
    supportChatSocket.disconnect();
    supportChatSocket = null;
    activeAccessToken = "";
  }
};
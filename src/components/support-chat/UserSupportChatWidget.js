"use client";

import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../providers/AppProvider.js";
import {
  getMySupportConversation,
  getSupportMessages,
  markSupportConversationRead,
} from "@/apiService/supportChat";
import { connectSupportChatSocket } from "@/apiService/supportChatSocket";

function formatMessageTime(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getInitials(name) {
  const safeName = String(name || "").trim();

  if (!safeName) return "?";

  const parts = safeName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function Avatar({
  name,
  avatarUrl,
  className = "h-7 w-7 text-[11px]",
  tooltipPosition = "top",
}) {
  const tooltipClassName =
    tooltipPosition === "left"
      ? "right-full top-1/2 mr-2 -translate-y-1/2"
      : tooltipPosition === "right"
        ? "left-full top-1/2 ml-2 -translate-y-1/2"
        : "bottom-full left-1/2 mb-2 -translate-x-1/2";

  return (
    <div className="group relative shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || "Avatar"}
          className={`${className} rounded-full object-cover ring-1 ring-slate-200`}
        />
      ) : (
        <div
          className={`${className} flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 ring-1 ring-slate-200`}
        >
          {getInitials(name)}
        </div>
      )}

      {name ? (
        <div
          className={`pointer-events-none absolute z-[9999] hidden whitespace-nowrap rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-lg group-hover:block ${tooltipClassName}`}
        >
          {name}
        </div>
      ) : null}
    </div>
  );
}


function SupportIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-8 w-8">
      <circle cx="32" cy="32" r="30" fill="#ffffff" />
      <path
        d="M20 34v-5c0-6.6 5.4-12 12-12s12 5.4 12 12v5"
        fill="none"
        stroke="#2563eb"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <rect x="16" y="31" width="8" height="13" rx="4" fill="#2563eb" />
      <rect x="40" y="31" width="8" height="13" rx="4" fill="#2563eb" />
      <path
        d="M25 29h14a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H29l-5 4v-10a4 4 0 0 1 4-4Z"
        fill="#93c5fd"
      />
      <path
        d="M39 43c0 3-2.4 5.5-5.5 5.5H28"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="27" cy="48.5" r="2.3" fill="#2563eb" />
    </svg>
  );
}

function MessageBubble({ message, currentUser }) {
  const isUser = message.senderRole === "user";
  const senderName = isUser
    ? currentUser?.fullName || currentUser?.email || "Bạn"
    : message.sender?.fullName || "Tư vấn viên";
  const senderAvatar = isUser ? currentUser?.avatarUrl : message.sender?.avatarUrl;

  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar
          name={senderName}
          avatarUrl={senderAvatar}
          tooltipPosition="right"
        />
      )}

      <div className={`flex max-w-[78%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`break-words rounded-[18px] px-3.5 py-2 text-sm leading-5 ${isUser
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
            }`}
        >
          {message.content}
        </div>

        <p className="mt-0.5 px-1 text-[10px] text-slate-400">
          {formatMessageTime(message.createdAt)}
        </p>
      </div>

      {isUser && (
        <Avatar
          name={senderName}
          avatarUrl={senderAvatar}
          tooltipPosition="left"
        />
      )}
    </div>
  );
}

export default function UserSupportChatWidget() {
  const { session, isAuthenticated, isAdmin, currentUser } = useAppContext();

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(false);

  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  useEffect(() => {
    if (!isAuthenticated || isAdmin || !session.accessToken) {
      return;
    }

    const initChat = async () => {
      try {
        setIsLoading(true);

        const nextConversation = await getMySupportConversation();
        setConversation(nextConversation);
        setUnreadCount(Number(nextConversation.unreadByUser || 0));

        const nextMessages = await getSupportMessages(nextConversation._id);
        setMessages(nextMessages);

        const socket = connectSupportChatSocket(session.accessToken);
        socketRef.current = socket;

        socket.emit("support:join_conversation", {
          conversationId: nextConversation._id,
        });

        socket.off("support:receive_message");
        socket.on("support:receive_message", (payload) => {
          if (
            String(payload.message.conversation) === String(nextConversation._id)
          ) {
            setMessages((current) => {
              const exists = current.some(
                (item) => String(item._id) === String(payload.message._id)
              );

              if (exists) return current;

              return [...current, payload.message];
            });

            if (payload.message.senderRole === "admin") {
              if (isOpenRef.current) {
                markSupportConversationRead(nextConversation._id).catch(() => { });
                setUnreadCount(0);
              } else {
                setUnreadCount((current) => current + 1);
              }
            }

            scrollToBottom();
          }
        });
        socket.off("support:error");
        socket.on("support:error", (payload) => {
          setErrorMessage(payload.message || "Có lỗi xảy ra với chat.");
        });
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    void initChat();

    return () => {
      socketRef.current?.off("support:receive_message");
      socketRef.current?.off("support:error");
    };
  }, [isAuthenticated, isAdmin, session.accessToken]);

  useEffect(() => {
    if (!isOpen || !conversation?._id) return;

    markSupportConversationRead(conversation._id).catch(() => { });
    scrollToBottom();
  }, [isOpen, conversation?._id]);

  const handleSend = () => {
    const cleanInput = input.trim();

    if (!cleanInput || !conversation?._id || !socketRef.current) {
      return;
    }

    socketRef.current.emit("support:send_message", {
      conversationId: conversation._id,
      content: cleanInput,
    });

    setInput("");
  };

  if (!isAuthenticated || isAdmin) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);

            if (conversation?._id) {
              markSupportConversationRead(conversation._id).catch(() => { });
            }
          }}
          className="fixed bottom-24 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_10px_24px_rgba(37,99,235,0.34)] transition hover:scale-105"
          aria-label="Mở chat tư vấn viên"
        >
          <SupportIcon />
          <span className="absolute bottom-0.5 left-0.5 h-4 w-4 rounded-full border-[3px] border-white bg-lime-500" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-lg">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed left-4 top-8 bottom-6 z-50 flex w-[360px] max-w-[calc(100vw-20px)] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-[#f3f6fb] shadow-[0_14px_42px_rgba(15,23,42,0.2)]">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 px-3.5 py-3 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%)]" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <SupportIcon />
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-blue-600 bg-lime-400" />
                </div>

                <div>
                  <p className="text-sm font-bold">Tư vấn viên BETOURIST</p>
                  <p className="text-xs text-blue-100">Đang trực tuyến</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xl leading-none transition hover:bg-white/25"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#eef2f7] px-3 py-4">
            {isLoading && (
              <p className="py-4 text-center text-sm text-slate-500">
                Đang tải cuộc trò chuyện...
              </p>
            )}

            {errorMessage && (
              <div className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3">
              {!messages.length && !isLoading && (
                <div className="flex items-end gap-2">
                  <Avatar name="Tư vấn viên" tooltipPosition="right" />
                  <div>
                    <p className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                      Tư vấn viên
                    </p>
                    <div className="rounded-[22px] rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-slate-800 shadow-sm">
                      Xin chào, bạn cần tư vấn tour nào ạ?
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  currentUser={currentUser}
                />
              ))}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-full border border-slate-300 bg-slate-50 px-3.5 py-2 shadow-inner">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSend();
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={handleSend}
                className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
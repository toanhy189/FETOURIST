"use client";

import { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/components/providers/AppProvider";
import {
  closeSupportConversation,
  getSupportConversations,
  getSupportMessages,
  markSupportConversationRead,
} from "@/apiService/supportChat";
import { connectSupportChatSocket } from "@/apiService/supportChatSocket";
import { toAssetUrl } from "@/apiService/base";
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

function resolveAssetUrl(url) {
  return toAssetUrl(url) || "";
}

function Avatar({
  name,
  avatarUrl,
  className = "h-9 w-9 text-xs",
  tooltipPosition = "top",
}) {
  const [imageError, setImageError] = useState(false);
  const resolvedAvatarUrl = resolveAssetUrl(avatarUrl);

  const tooltipClassName =
    tooltipPosition === "left"
      ? "right-full top-1/2 mr-2 -translate-y-1/2"
      : tooltipPosition === "right"
        ? "left-full top-1/2 ml-2 -translate-y-1/2"
        : "bottom-full left-1/2 mb-2 -translate-x-1/2";

  return (
    <div className="group relative shrink-0">
      {resolvedAvatarUrl && !imageError ? (
        <img
          src={resolvedAvatarUrl}
          alt={name || "Avatar"}
          onError={() => setImageError(true)}
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

function MessageBubble({ message, currentUser }) {
  const isAdminMessage = message.senderRole === "admin";

  const senderName = isAdminMessage
    ? currentUser?.fullName || currentUser?.email || "Admin"
    : message.sender?.fullName || message.sender?.email || "Khách hàng";

  const senderAvatar = isAdminMessage
    ? currentUser?.avatarUrl
    : message.sender?.avatarUrl;

  return (
    <div
      className={`flex items-end gap-2 ${isAdminMessage ? "justify-end" : "justify-start"
        }`}
    >
      {!isAdminMessage && (
        <Avatar
          name={senderName}
          avatarUrl={senderAvatar}
          tooltipPosition="right"
        />
      )}

      <div
        className={`flex max-w-[72%] flex-col ${isAdminMessage ? "items-end" : "items-start"
          }`}
      >
        <div
          className={`break-words rounded-[22px] px-4 py-2.5 text-[15px] leading-6 ${isAdminMessage
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
            }`}
        >
          {message.content}
        </div>

        <p className="mt-1 px-1 text-[11px] text-slate-400">
          {formatMessageTime(message.createdAt)}
        </p>
      </div>

      {isAdminMessage && (
        <Avatar
          name={senderName}
          avatarUrl={senderAvatar}
          tooltipPosition="left"
        />
      )}
    </div>
  );
}

export default function AdminSupportChatPage() {
  const { session, isAdmin, isBootstrapping, currentUser } = useAppContext();

  const socketRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    if (!session.accessToken || !isAdmin) {
      return;
    }

    const init = async () => {
      try {
        const data = await getSupportConversations();
        setConversations(data);

        const socket = connectSupportChatSocket(session.accessToken);
        socketRef.current = socket;

        socket.off("support:receive_message");
        socket.on("support:receive_message", (payload) => {
          const activeConversation = selectedConversationRef.current;

          if (
            activeConversation &&
            String(payload.message.conversation) === String(activeConversation._id)
          ) {
            setMessages((current) => {
              const exists = current.some(
                (item) => String(item._id) === String(payload.message._id)
              );

              if (exists) return current;

              return [...current, payload.message];
            });

            scrollToBottom();
          }
        });

        socket.off("support:conversation_updated");
        socket.on("support:conversation_updated", (payload) => {
          setConversations((current) => {
            const exists = current.some(
              (item) => String(item._id) === String(payload.conversation._id)
            );

            if (!exists) {
              return [payload.conversation, ...current];
            }

            return current
              .map((item) =>
                String(item._id) === String(payload.conversation._id)
                  ? payload.conversation
                  : item
              )
              .sort(
                (a, b) =>
                  new Date(b.lastMessageAt).getTime() -
                  new Date(a.lastMessageAt).getTime()
              );
          });
        });

        socket.off("support:error");
        socket.on("support:error", (payload) => {
          setErrorMessage(payload.message || "Có lỗi xảy ra với chat.");
        });
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    void init();

    return () => {
      socketRef.current?.off("support:receive_message");
      socketRef.current?.off("support:conversation_updated");
      socketRef.current?.off("support:error");
    };
  }, [session.accessToken, isAdmin]);

  const openConversation = async (conversation) => {
    try {
      setSelectedConversation(conversation);

      socketRef.current?.emit("support:join_conversation", {
        conversationId: conversation._id,
      });

      const data = await getSupportMessages(conversation._id);
      setMessages(data);

      await markSupportConversationRead(conversation._id);

      setConversations((current) =>
        current.map((item) =>
          String(item._id) === String(conversation._id)
            ? {
              ...item,
              unreadByAdmin: 0,
            }
            : item
        )
      );

      scrollToBottom();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSend = () => {
    const cleanInput = input.trim();

    if (!cleanInput || !selectedConversation?._id || !socketRef.current) {
      return;
    }

    socketRef.current.emit("support:send_message", {
      conversationId: selectedConversation._id,
      content: cleanInput,
    });

    setInput("");
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation?._id) return;

    try {
      const updatedConversation = await closeSupportConversation(
        selectedConversation._id
      );

      setSelectedConversation(updatedConversation);

      setConversations((current) =>
        current.map((item) =>
          String(item._id) === String(updatedConversation._id)
            ? updatedConversation
            : item
        )
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  if (isBootstrapping) {
    return <div className="p-6 text-slate-500">Đang tải...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-red-600">
        Bạn không có quyền truy cập trang chat admin.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">
          Chat tư vấn khách hàng
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="grid h-[calc(100vh-220px)] min-h-[560px] grid-cols-[340px_1fr] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 p-4">
            <p className="font-semibold text-slate-900">Cuộc trò chuyện</p>
            <p className="text-xs text-slate-500">
              {conversations.length} hội thoại
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.map((conversation) => {
              const user = conversation.user;
              const active =
                selectedConversation &&
                String(selectedConversation._id) === String(conversation._id);

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => openConversation(conversation)}
                  className={`w-full border-b border-slate-200 p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${active ? "bg-blue-50" : "hover:bg-white"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar
                        name={user?.fullName || user?.email || "Khách hàng"}
                        avatarUrl={user?.avatarUrl}
                        tooltipPosition="right"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-lime-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-slate-900">
                          {user?.fullName || user?.email || "Khách hàng"}
                        </p>

                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatMessageTime(conversation.lastMessageAt)}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                        {conversation.lastMessage || "Chưa có tin nhắn"}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {conversation.status === "open" ? "Đang mở" : "Đã đóng"}
                        </span>

                        {conversation.unreadByAdmin > 0 && (
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                            {conversation.unreadByAdmin}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {!conversations.length && (
              <div className="p-4 text-sm text-slate-500">
                Chưa có cuộc trò chuyện nào.
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col">
          {!selectedConversation ? (
            <div className="flex flex-1 items-center justify-center text-slate-500">
              Chọn một khách hàng để bắt đầu tư vấn.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      name={
                        selectedConversation.user?.fullName ||
                        selectedConversation.user?.email ||
                        "Khách hàng"
                      }
                      avatarUrl={selectedConversation.user?.avatarUrl}
                      className="h-11 w-11 text-sm"
                      tooltipPosition="right"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-lime-500" />
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      {selectedConversation.user?.fullName ||
                        selectedConversation.user?.email ||
                        "Khách hàng"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedConversation.user?.email || "Khách hàng đang trực tuyến"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseConversation}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng hội thoại
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden bg-[#eef2f7] p-5">
                {messages.map((message) => (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    currentUser={currentUser}
                  />
                ))}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 items-center rounded-full border border-slate-300 bg-slate-50 px-4 py-2.5 shadow-inner">
                    <input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSend();
                        }
                      }}
                      placeholder="Nhập phản hồi cho khách..."
                      className="w-full bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSend}
                    className="rounded-full bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

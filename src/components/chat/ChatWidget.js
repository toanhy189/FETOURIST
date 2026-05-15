"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChatConversation,
  getCustomerConversation,
  sendCustomerChatMessage,
} from "@/apiService/chat";
import { useAppContext } from "@/components/providers/AppProvider";
import { cn } from "@/utils/cn";

const CHAT_SESSION_STORAGE_KEY = "travelptit.chat.sessionId";
const CHAT_CONVERSATION_STORAGE_KEY = "travelptit.chat.conversationId";

function buildScopedStorageKey(baseKey, scopeKey) {
  return `${baseKey}.${scopeKey || "guest"}`;
}

function createBrowserSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function ensureChatSessionId(scopeKey) {
  // Moi user/guest co session rieng de BE phan quyen lịch sử chat theo trinh duyet.
  if (typeof window === "undefined") {
    return "";
  }

  const storageKey = buildScopedStorageKey(CHAT_SESSION_STORAGE_KEY, scopeKey);
  const storedSessionId = window.localStorage.getItem(storageKey);
  if (storedSessionId) {
    return storedSessionId;
  }

  const nextSessionId = createBrowserSessionId();
  window.localStorage.setItem(storageKey, nextSessionId);
  return nextSessionId;
}

function persistConversationId(conversationId, scopeKey) {
  // Luu conversation đang mở de lan sau mo widget se tai lai dung lịch sử.
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = buildScopedStorageKey(CHAT_CONVERSATION_STORAGE_KEY, scopeKey);

  if (!conversationId) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, conversationId);
}

function getStoredConversationId(scopeKey) {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem(
      buildScopedStorageKey(CHAT_CONVERSATION_STORAGE_KEY, scopeKey)
    ) || ""
  );
}

function getConversationStatusMeta(conversation) {
  // Badge trạng thái cho biet AI dang trả lời binh thuong hay can admin xac minh.
  if (!conversation) {
    return {
      label: "AI sẵn sàng hỗ trợ",
      tone: "border-sky-200 bg-sky-50 text-sky-800",
    };
  }

  if (conversation.status === "closed") {
    return {
      label: "Hội thoại đã đóng",
      tone: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  if (conversation.aiState?.requiresHumanSupport) {
    return {
      label: "Cần xác minh thêm",
      tone: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  return {
    label: "Trợ lý AI đang hoạt động",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
}

function getMessageMeta(message) {
  if (message.senderType === "customer") {
    return {
      alignment: "items-end",
      bubble: "bg-sky-700 text-white",
      label: "Bạn",
    };
  }

  if (message.deliveryStatus === "fallback") {
    return {
      alignment: "items-start",
      bubble: "border border-amber-200 bg-amber-50 text-slate-800",
      label: "Hỗ trợ AI",
    };
  }

  return {
    alignment: "items-start",
    bubble: "border border-orange-200 bg-white text-slate-800",
    label: "Trợ lý AI",
  };
}

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SupportIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 4a8 8 0 0 0-8 8c0 2.3.97 4.37 2.53 5.83V21l3.72-1.69A7.96 7.96 0 0 0 12 20a8 8 0 1 0 0-16Z" />
      <path d="M8.8 11.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4ZM12 11.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4ZM15.2 11.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

function createLocalMessage(content) {
  // Message tạm thời giup UI phản hồi ngay trong luc doi BE luu va AI trả lời.
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderType: "customer",
    content,
    deliveryStatus: "sent",
    createdAt: new Date().toISOString(),
    isLocalOnly: true,
  };
}

export default function ChatWidget() {
  const { currentUser, chatPageContext, isBootstrapping } = useAppContext();
  const isAdminUser = currentUser?.role === "admin";
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const endOfMessagesRef = useRef(null);

  const chatScopeKey = useMemo(() => {
    if (currentUser?.id) {
      return `customer:${currentUser.id}`;
    }

    return "guest";
  }, [currentUser?.id]);

  const statusMeta = useMemo(
    () => getConversationStatusMeta(conversation),
    [conversation]
  );

  const resetConversationState = useCallback(() => {
    setConversation(null);
    setMessages([]);
    setDraftMessage("");
    setErrorMessage("");
    setInfoMessage("");
  }, []);

  const loadConversation = useCallback(
    async (activeConversationId, activeSessionId, { scopeKey } = {}) => {
      if (!activeConversationId || !activeSessionId) {
        return;
      }

      try {
        const result = await getCustomerConversation(activeConversationId, activeSessionId, {
          limit: 50,
        });

        setConversation(result.conversation);
        setMessages(Array.isArray(result.messages) ? result.messages : []);
        if (result.customerSessionId) {
          setSessionId(result.customerSessionId);
        }
        setInfoMessage(
          result.conversation?.aiState?.requiresHumanSupport
            ? result.conversation.aiState.humanSupportReason ||
                "Thông tin hiện tại cần được xác minh thêm bởi bộ phận hỗ trợ."
            : ""
        );
        setErrorMessage("");
      } catch (error) {
        if (error?.status === 404 && scopeKey) {
          // BE khong tìm thấy conversation trong session nay thi xóa cache local de tạo luồng moi.
          persistConversationId("", scopeKey);
          setConversationId("");
          resetConversationState();
        }

        setErrorMessage(error.message || "Không thể tải lịch sử hội thoại.");
      }
    },
    [resetConversationState]
  );

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    if (isAdminUser) {
      setIsOpen(false);
      setSessionId("");
      setConversationId("");
      resetConversationState();
      return;
    }

    const nextSessionId = ensureChatSessionId(chatScopeKey);
    const nextConversationId = getStoredConversationId(chatScopeKey);

    resetConversationState();
    setSessionId(nextSessionId);
    setConversationId(nextConversationId);
  }, [chatScopeKey, isAdminUser, isBootstrapping, resetConversationState]);

  useEffect(() => {
    if (
      isBootstrapping ||
      !isOpen ||
      !conversationId ||
      !sessionId ||
      isAdminUser ||
      isSending
    ) {
      return;
    }

    void loadConversation(conversationId, sessionId, {
      scopeKey: chatScopeKey,
    });
  }, [chatScopeKey, conversationId, isAdminUser, isBootstrapping, isOpen, isSending, loadConversation, sessionId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isOpen, isSending]);

  const handleSubmitMessage = useCallback(async () => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || !sessionId || isSending) {
      return;
    }

    if (conversation?.status === "closed") {
      setErrorMessage("Hội thoại này đã đóng. Vui lòng mở hội thoại mới.");
      return;
    }

    const localMessage = createLocalMessage(trimmedMessage);

    setIsOpen(true);
    setIsSending(true);
    setErrorMessage("");
    setInfoMessage("");
    setDraftMessage("");
    setMessages((currentMessages) => [...currentMessages, localMessage]);

    try {
      let activeConversationId = conversationId;

      if (!activeConversationId) {
        const created = await createChatConversation(
          {
            customerProfile: {
              fullName: currentUser?.fullName || "",
              email: currentUser?.email || "",
              phoneNumber: currentUser?.phoneNumber || "",
            },
            tourContext: chatPageContext || undefined,
          },
          sessionId
        );

        activeConversationId = created.conversation?.id || "";
        if (!activeConversationId) {
          throw new Error("Không tạo được hội thoại chat.");
        }

        setConversationId(activeConversationId);
        setConversation(created.conversation || null);
        persistConversationId(activeConversationId, chatScopeKey);
      }

      const result = await sendCustomerChatMessage(
        activeConversationId,
        {
          content: trimmedMessage,
          tourContext: chatPageContext || undefined,
        },
        sessionId
      );

      setConversation(result.conversation || null);
      setMessages((currentMessages) => {
        const nextMessages = currentMessages.filter(
          (message) => message.id !== localMessage.id
        );

        if (result.customerMessage) {
          nextMessages.push(result.customerMessage);
        }

        if (result.assistantMessage) {
          nextMessages.push(result.assistantMessage);
        }

        return nextMessages;
      });
      setInfoMessage(
        result.conversation?.aiState?.requiresHumanSupport
          ? result.conversation.aiState.humanSupportReason ||
              "Thông tin hiện tại cần được xác minh thêm bởi bộ phận hỗ trợ."
          : ""
      );
    } catch (error) {
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== localMessage.id)
      );
      setErrorMessage(error.message || "Không gửi được tin nhắn. Vui lòng thử lại.");
      setDraftMessage(trimmedMessage);
    } finally {
      setIsSending(false);
    }
  }, [
    chatPageContext,
    chatScopeKey,
    conversation?.status,
    conversationId,
    currentUser?.email,
    currentUser?.fullName,
    currentUser?.phoneNumber,
    draftMessage,
    isSending,
    sessionId,
  ]);

  if (isAdminUser) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <section className="pointer-events-auto flex h-[72vh] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#fffefb_0%,#f8fbff_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
                  TRAVELPTIT AI
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-slate-900">
                  Tư vấn tour nhanh
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Đóng chat widget"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusMeta.tone)}>
                {statusMeta.label}
              </span>
              {chatPageContext?.tourTitle ? (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  Tour: {chatPageContext.tourTitle}
                </span>
              ) : null}
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {!messages.length ? (
              <div className="rounded-[22px] border border-dashed border-sky-200 bg-sky-50/80 px-4 py-4 text-sm leading-6 text-slate-700">
                {chatPageContext?.tourTitle
                  ? `Bạn đang xem ${chatPageContext.tourTitle}. Hãy hỏi về giá, lịch khởi hành, số chỗ, lịch trình hoặc chính sách hoàn hủy.`
                  : "Hãy đặt câu hỏi về tour, giá, lịch khởi hành, số chỗ còn lại, booking hoặc chính sách để mình hỗ trợ."}
              </div>
            ) : null}

            {messages.map((message) => {
              const messageMeta = getMessageMeta(message);

              return (
                <div key={message.id} className={cn("flex flex-col gap-1", messageMeta.alignment)}>
                  <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {messageMeta.label}
                  </span>
                  <div className={cn("max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm", messageMeta.bubble)}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-400">
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}

            {isSending ? (
              <div className="flex flex-col items-start gap-1">
                <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Trợ lý AI
                </span>
                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  Đang trả lời...
                </div>
              </div>
            ) : null}

            <div ref={endOfMessagesRef} />
          </div>

          <div className="border-t border-slate-200 bg-white/90 px-4 py-4">
            {errorMessage ? (
              <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            {infoMessage ? (
              <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                {infoMessage}
              </div>
            ) : null}

            <textarea
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              rows={3}
              disabled={conversation?.status === "closed"}
              placeholder={
                conversation?.status === "closed"
                  ? "Hội thoại đã đóng."
                  : "Nhắn điều bạn cần hỗ trợ..."
              }
              className="w-full resize-none rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-300 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] leading-5 text-slate-500">
                Ưu tiên trả lời từ dữ liệu tour thật. Nếu chưa đủ chắc chắn, hệ thống sẽ nói rõ và hướng dẫn liên hệ bộ phận hỗ trợ.
              </p>

              <button
                type="button"
                onClick={() => void handleSubmitMessage()}
                disabled={
                  isSending ||
                  !draftMessage.trim() ||
                  conversation?.status === "closed"
                }
                className="shrink-0 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSending ? "Đang gửi..." : "Gửi"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto inline-flex items-center gap-3 rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#0ea5e9_45%,#f97316_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(14,165,233,0.3)] transition hover:translate-y-[-1px]"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/18">
          <SupportIcon />
        </span>
        <span className="text-left">
          <span className="block text-xs font-medium uppercase tracking-[0.2em] text-white/80">
            Chat AI
          </span>
          <span className="block text-sm font-bold">Tư vấn tour ngay</span>
        </span>
      </button>
    </div>
  );
}

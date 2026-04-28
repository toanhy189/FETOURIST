"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getContactDetailForAdmin,
  getContactsForAdmin,
  replyToContactForAdmin,
  updateContactStatusForAdmin,
} from "@/apiService/contacts";
import { formatDateTimeVi } from "@/utils/format";

const STATUS_META = {
  new: {
    label: "Mới",
    dotClassName: "bg-emerald-600",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  in_progress: {
    label: "Đang xử lý",
    dotClassName: "bg-amber-500",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  replied: {
    label: "Đã phản hồi",
    dotClassName: "bg-sky-500",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  },
  closed: {
    label: "Đã đóng",
    dotClassName: "bg-slate-400",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

function getStatusMeta(status) {
  // Map status BE sang mau/label de inbox admin hien thong nhat.
  return STATUS_META[status] || STATUS_META.new;
}

function getInitials(fullName) {
  return String(fullName || "KH")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function truncateMessage(message, maxLength = 125) {
  const normalizedMessage = String(message || "").trim();
  if (normalizedMessage.length <= maxLength) {
    return normalizedMessage;
  }

  return `${normalizedMessage.slice(0, maxLength).trimEnd()}...`;
}

function formatRelativeContactTime(value) {
  if (!value) {
    return "Mới gửi";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Mới gửi";
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfValueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday - startOfValueDate) / 86400000);
  const timeLabel = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (dayDiff === 0) {
    return `Hôm nay, ${timeLabel}`;
  }

  if (dayDiff === 1) {
    return "Hôm qua";
  }

  if (dayDiff > 1 && dayDiff < 7) {
    return `${dayDiff} ngày trước`;
  }

  return formatDateTimeVi(value);
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v5h-5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.5 4.5h3l1.5 4-2 1.8a15.8 15.8 0 0 0 5.7 5.7l1.8-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5c-7.5-.5-13.4-6.4-13.9-13.9A1.5 1.5 0 0 1 5.5 4.5Z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-9Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 8 7 5 7-5" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 4.5v4.2h4.2" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M3.4 11.2 19.8 4.3a1 1 0 0 1 1.3 1.3l-6.9 16.4a1 1 0 0 1-1.8.1l-2.2-5.5-5.5-2.2a1 1 0 0 1 .1-1.8Z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.5h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5h.01" />
    </svg>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[1.9rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function ReplyHistoryModal({ contact, onClose }) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_80px_-35px_rgba(15,23,42,0.65)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Lịch sử
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Lịch sử phản hồi</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label="Đóng lịch sử phản hồi"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-6">
          {contact?.replies?.length ? (
            contact.replies
              .slice()
              .reverse()
              .map((reply) => (
                <article
                  key={reply._id}
                  className="rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {reply.adminName || reply.admin?.fullName || "Admin TRAVELPTIT"}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {reply.emailStatus === "sent" ? "Đã gửi email" : "Lỗi gửi email"}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">{formatDateTimeVi(reply.sentAt)}</p>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {reply.message}
                  </p>
                </article>
              ))
          ) : (
            <EmptyState
              title="Chưa có phản hồi nào"
              description="Khi admin gửi email phản hồi, lịch sử sẽ được lưu tại đây để đối chiếu."
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminContactsPanel() {
  const [contacts, setContacts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeFilterParams = useMemo(() => {
    if (activeStatusFilter === "all") {
      return {};
    }

    return { status: activeStatusFilter };
  }, [activeStatusFilter]);

  const loadContactDetail = useCallback(async (contactId) => {
    // Lay ticket dang chon de hien noi dung goc, reply history va nguoi xu ly.
    if (!contactId) {
      setSelectedContact(null);
      setReplyDraft("");
      return;
    }

    setIsDetailLoading(true);
    setDetailError("");

    try {
      const contact = await getContactDetailForAdmin(contactId);
      setSelectedContact(contact);
      setReplyDraft("");
    } catch (loadError) {
      setSelectedContact(null);
      setDetailError(loadError.message || "Không tải được chi tiết liên hệ.");
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const loadContacts = useCallback(
    async (preferredContactId) => {
      // Tai danh sach inbox theo filter; giu selection hien tai neu ticket van con trong list.
      setIsLoading(true);
      setError("");

      try {
        const result = await getContactsForAdmin({
          limit: 50,
          ...activeFilterParams,
        });

        setContacts(result.contacts || []);
        setSummary(result.summary || null);
        setPagination(result.pagination || null);

        setSelectedContactId((currentValue) => {
          const nextSelectedId = preferredContactId || currentValue;
          if (result.contacts.some((contact) => contact._id === nextSelectedId)) {
            return nextSelectedId;
          }

          return result.contacts[0]?._id || "";
        });
      } catch (loadError) {
        setContacts([]);
        setSummary(null);
        setPagination(null);
        setSelectedContactId("");
        setSelectedContact(null);
        setError(loadError.message || "Không tải được danh sách liên hệ.");
      } finally {
        setIsLoading(false);
      }
    },
    [activeFilterParams]
  );

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    void loadContactDetail(selectedContactId);
  }, [loadContactDetail, selectedContactId]);

  async function handleRefresh() {
    await loadContacts(selectedContactId);
    if (selectedContactId) {
      await loadContactDetail(selectedContactId);
    }
  }

  async function handleSendReply() {
    // Gui email cho khach, sau do BE cap nhat status/reply history cua contact.
    if (!selectedContactId || !replyDraft.trim()) {
      return;
    }

    setIsReplySubmitting(true);
    setReplyError("");

    try {
      const updatedContact = await replyToContactForAdmin(selectedContactId, {
        message: replyDraft,
      });
      setSelectedContact(updatedContact);
      setReplyDraft("");
      await loadContacts(updatedContact._id);
    } catch (submitError) {
      setReplyError(submitError.message || "Không gửi được phản hồi.");
    } finally {
      setIsReplySubmitting(false);
    }
  }

  async function handleStatusChange(event) {
    // Cho admin doi nhanh trang thai ma khong can gui email.
    const nextStatus = event.target.value;
    if (!selectedContactId || !nextStatus || nextStatus === selectedContact?.status) {
      return;
    }

    setIsStatusUpdating(true);
    setReplyError("");

    try {
      const updatedContact = await updateContactStatusForAdmin(selectedContactId, {
        status: nextStatus,
      });
      setSelectedContact(updatedContact);
      await loadContacts(updatedContact._id);
    } catch (statusError) {
      setReplyError(statusError.message || "Không cập nhật được trạng thái.");
    } finally {
      setIsStatusUpdating(false);
    }
  }

  function handleReplyKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isReplySubmitting) {
        void handleSendReply();
      }
    }
  }

  const selectedStatusMeta = getStatusMeta(selectedContact?.status);
  const totalContacts = pagination?.totalItems ?? contacts.length;
  const showingFrom = contacts.length > 0 ? 1 : 0;
  const showingTo = contacts.length;

  return (
    <>
      <section className="space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.02em] text-emerald-950">
              Liên hệ khách hàng
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              Tại đây, bạn có thể xem và quản lý các thông tin liên lạc từ khách hàng, trả lời
              câu hỏi và theo dõi các trao đổi để cải thiện dịch vụ.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <RefreshIcon />
            Làm mới
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_44px_-38px_rgba(15,23,42,0.4)]">
          <div className="grid min-h-[665px] md:grid-cols-[minmax(300px,0.34fr)_minmax(0,0.66fr)] xl:grid-cols-[minmax(420px,0.31fr)_minmax(0,0.69fr)]">
            <section className="flex min-h-0 flex-col border-b border-slate-200 md:border-b-0 md:border-r">
              <div className="px-5 py-5">
                <button
                  type="button"
                  onClick={() =>
                    setActiveStatusFilter((currentValue) =>
                      currentValue === "new" ? "all" : "new"
                    )
                  }
                  className={`inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg px-5 text-sm font-semibold transition ${
                    activeStatusFilter === "new"
                      ? "bg-emerald-800 text-white shadow-[0_18px_34px_-26px_rgba(6,95,70,0.9)]"
                      : "bg-emerald-700 text-white shadow-[0_18px_34px_-26px_rgba(6,95,70,0.9)] hover:bg-emerald-800"
                  }`}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-sm leading-none">
                    +
                  </span>
                  Liên hệ khách hàng mới
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                    {summary?.newCount ?? 0}
                  </span>
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="rounded-[1.6rem] border border-slate-200 bg-slate-50 px-4 py-5"
                      >
                        <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                        <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-slate-200" />
                        <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full bg-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : contacts.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {contacts.map((contact) => {
                      const statusMeta = getStatusMeta(contact.status);
                      const isActive = contact._id === selectedContactId;

                      return (
                        <button
                          key={contact._id}
                          type="button"
                          onClick={() => setSelectedContactId(contact._id)}
                          className={`w-full px-3 py-4 text-left transition ${
                            isActive
                              ? "rounded-lg bg-emerald-50/70 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.04)]"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${statusMeta.dotClassName}`}
                                />
                                <p className="truncate text-[0.98rem] font-bold text-slate-900">
                                  {contact.fullName}
                                </p>
                              </div>

                              <p className="ml-[22px] mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                                {truncateMessage(contact.message)}
                              </p>
                            </div>

                            <p className="shrink-0 text-xs text-slate-400">
                              {formatRelativeContactTime(contact.lastReplyAt || contact.createdAt)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="Chưa có liên hệ nào"
                    description="Khi user gửi biểu mẫu liên hệ từ trang public, yêu cầu sẽ hiện tại đây để admin xử lý."
                  />
                )}
              </div>

              <div className="border-t border-slate-200 px-6 py-5 text-sm text-slate-500">
                Hiển thị {showingFrom} - {showingTo} của {totalContacts} liên hệ
              </div>
            </section>

            <section className="px-6 py-6 lg:px-14 lg:py-9">
              {isDetailLoading ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-18 w-18 animate-pulse rounded-full bg-slate-200" />
                    <div className="space-y-3">
                      <div className="h-5 w-44 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-4 w-64 animate-pulse rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-40 animate-pulse rounded-[1.8rem] bg-slate-100" />
                  <div className="h-56 animate-pulse rounded-[1.8rem] bg-slate-100" />
                </div>
              ) : detailError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {detailError}
                </div>
              ) : selectedContact ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 pb-8">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#198f3f,#0f6d28)] text-xl font-semibold text-white shadow-[0_16px_28px_-20px_rgba(21,128,61,0.9)]">
                        {getInitials(selectedContact.fullName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xl font-semibold tracking-tight text-slate-950">
                          {selectedContact.fullName}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <PhoneIcon />
                            {selectedContact.phoneNumber}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MailIcon />
                            {selectedContact.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label
                        className={`inline-flex rounded-lg border px-3 py-1.5 text-sm font-semibold ${selectedStatusMeta.badgeClassName}`}
                      >
                        <span className="sr-only">Trang thai</span>
                        <select
                          value={selectedContact.status}
                          onChange={handleStatusChange}
                          disabled={isStatusUpdating}
                          className="bg-transparent text-center font-semibold outline-none"
                        >
                          {Object.entries(STATUS_META).map(([value, meta]) => (
                            <option key={value} value={value}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-sm text-slate-400">
                        {formatRelativeContactTime(
                          selectedContact.lastReplyAt || selectedContact.createdAt
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => setHistoryOpen(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-950 transition hover:bg-slate-100"
                        aria-label="Tùy chọn liên hệ"
                      >
                        <MoreIcon />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="text-base font-semibold text-emerald-700">Nội dung liên hệ</p>
                    <article className="mt-3 rounded-lg border border-slate-200 bg-white px-5 py-5">
                      <p className="min-h-[4.2rem] whitespace-pre-line text-base leading-8 text-slate-700">
                        {selectedContact.message}
                      </p>

                      <p className="mt-3 text-right text-sm text-slate-400">
                        {formatRelativeContactTime(selectedContact.createdAt)}
                      </p>
                    </article>
                  </div>

                  {replyError ? (
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {replyError}
                    </div>
                  ) : null}

                  <div className="mt-24 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_42px_-38px_rgba(15,23,42,0.5)]">
                    <p className="text-base font-semibold text-emerald-700">Trả lời khách hàng</p>

                    <div className="relative mt-4 rounded-lg border border-slate-200 bg-white">
                      <textarea
                        value={replyDraft}
                        onChange={(event) => setReplyDraft(event.target.value)}
                        onKeyDown={handleReplyKeyDown}
                        rows={4}
                        placeholder="Nhập nội dung trả lời..."
                        className="min-h-[128px] w-full resize-none rounded-lg border-0 bg-transparent px-5 py-4 pr-40 text-base leading-7 text-slate-800 outline-none placeholder:text-slate-400"
                      />

                      <span className="absolute bottom-5 left-5 text-slate-500">
                        <HistoryIcon />
                      </span>

                      <button
                        type="button"
                        onClick={() => void handleSendReply()}
                        disabled={isReplySubmitting || !replyDraft.trim()}
                        className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-20px_rgba(6,95,70,0.95)] transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        {isReplySubmitting ? "Đang gửi..." : "Gửi trả lời"}
                        <SendIcon />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-400">
                        Nhấn Enter để gửi hoặc Shift + Enter để xuống dòng
                      </p>

                      {selectedContact.handledBy?.fullName ? (
                        <p className="text-sm text-slate-400">
                          Đang xử lý bởi{" "}
                          <span className="font-medium text-slate-600">
                            {selectedContact.handledBy.fullName}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Chọn một liên hệ để bắt đầu xử lý"
                  description="Danh sách liên hệ sẽ hiển thị ở cột bên trái. Chọn một yêu cầu để xem chi tiết và gửi phản hồi qua email."
                />
              )}
            </section>
          </div>
        </div>
      </section>

      {historyOpen && selectedContact ? (
        <ReplyHistoryModal contact={selectedContact} onClose={() => setHistoryOpen(false)} />
      ) : null}
    </>
  );
}

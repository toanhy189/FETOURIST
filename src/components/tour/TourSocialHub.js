"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createComment,
  deleteComment,
  getTourComments,
  updateComment,
} from "@/apiService/comments";
import { deleteMyReview, getTourReviews, upsertMyReview } from "@/apiService/reviews";
import { useAppContext } from "@/components/providers/AppProvider";
import { cn } from "@/utils/cn";
import { formatDateTimeVi } from "@/utils/format";

function StarIcon({ filled = false, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m12 3.8 2.5 5.2 5.8.8-4.2 4.1 1 5.9L12 17l-5.1 2.8 1-5.9-4.2-4.1 5.8-.8L12 3.8Z" />
    </svg>
  );
}

function CommunityCard({ title, badge, children, className = "" }) {
  return (
    <section
      className={cn(
        "rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] sm:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[1.6rem] font-bold tracking-[-0.03em] text-slate-900">{title}</h2>
        {badge}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FeedbackBox({ message, tone = "info" }) {
  if (!message) {
    return null;
  }

  const toneClassName = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[tone];

  return <div className={cn("rounded-2xl border px-4 py-3 text-sm", toneClassName)}>{message}</div>;
}

function getInitials(fullName = "") {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "BT";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function Avatar({ user, className = "", textClassName = "" }) {
  const fullName = user?.fullName || "Thanh vien TRAVELPTIT";

  if (user?.avatarUrl) {
    return (
      <div className={cn("h-11 w-11 overflow-hidden rounded-full border border-sky-100 bg-sky-50", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e0f2fe_0%,#fef3c7_100%)] text-sm font-bold text-sky-700",
        className,
        textClassName
      )}
    >
      {getInitials(fullName)}
    </div>
  );
}

function RatingStars({ value, onChange, interactive = false, className = "" }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {[1, 2, 3, 4, 5].map((ratingValue) => {
        const icon = (
          <StarIcon
            filled={ratingValue <= value}
            className={cn(
              "h-6 w-6 transition",
              ratingValue <= value ? "text-amber-400" : "text-slate-300"
            )}
          />
        );

        if (!interactive) {
          return <span key={ratingValue}>{icon}</span>;
        }

        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onChange?.(ratingValue)}
            className="rounded-md p-0.5 outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-sky-300"
            aria-label={`${ratingValue} sao`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  submitLabel,
  placeholder,
  onCancel,
  isSubmitting,
  currentUser,
  compact = false,
}) {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-3", compact ? "" : "")}>
      <div className="flex items-start gap-3">
        <Avatar user={currentUser} className={compact ? "h-10 w-10" : ""} textClassName={compact ? "text-xs" : ""} />
        <div className="min-w-0 flex-1">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
              "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100",
              compact ? "min-h-24" : "min-h-28"
            )}
            placeholder={placeholder}
          />
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Hủy
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Đang gửi..." : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ReviewItem({ review }) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar user={review.user} className="h-10 w-10" textClassName="text-xs" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{review.user?.fullName || "Thanh vien TRAVELPTIT"}</p>
            <p className="mt-1 text-xs text-slate-400">{formatDateTimeVi(review.updatedAt || review.createdAt)}</p>
          </div>
        </div>
        <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {review.rating}/5
        </div>
      </div>

      <RatingStars value={Number(review.rating || 0)} className="mt-3" />
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {review.comment || "Người dùng chưa để lại nội dung chi tiết."}
      </p>
    </article>
  );
}

function CommentItem({
  comment,
  currentUser,
  currentUserId,
  isAdmin,
  draftMap,
  setDraftMap,
  onReply,
  onUpdate,
  onDelete,
  loadingKey,
}) {
  const isOwner = currentUserId && String(comment.user?._id) === String(currentUserId);
  const canManage = isOwner || isAdmin;
  const replyKey = `reply-${comment._id}`;
  const editKey = `edit-${comment._id}`;
  const hasReplyDraft = Object.prototype.hasOwnProperty.call(draftMap, replyKey);
  const hasEditDraft = Object.prototype.hasOwnProperty.call(draftMap, editKey);
  const replyValue = draftMap[replyKey] ?? "";
  const editValue = draftMap[editKey] ?? comment.content ?? "";

  function patchDraft(key, value) {
    setDraftMap((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      if (value === undefined) {
        delete nextDrafts[key];
        return nextDrafts;
      }

      nextDrafts[key] = value;
      return nextDrafts;
    });
  }

  return (
    <div className="space-y-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar user={comment.user} className="h-10 w-10" textClassName="text-xs" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{comment.user?.fullName || "Thanh vien TRAVELPTIT"}</p>
            <p className="mt-1 text-xs text-slate-400">
              {formatDateTimeVi(comment.createdAt)}
              {comment.editedAt ? " • Đã chỉnh sửa" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => patchDraft(replyKey, hasReplyDraft ? undefined : "")}
            className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:border-sky-200"
          >
            Trả lời
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={() => patchDraft(editKey, hasEditDraft ? undefined : comment.content)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Sửa
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              onClick={() => onDelete(comment._id)}
              disabled={loadingKey === `delete-${comment._id}`}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Xóa
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-sm leading-6 text-slate-600">{comment.content}</p>

      {hasEditDraft && canManage ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <CommentComposer
            value={editValue}
            onChange={(value) => patchDraft(editKey, value)}
            onSubmit={(event) => onUpdate(event, comment._id, editKey, editValue)}
            submitLabel="Lưu"
            placeholder="Cập nhật bình luận của bạn"
            onCancel={() => patchDraft(editKey, undefined)}
            isSubmitting={loadingKey === `update-${comment._id}`}
            currentUser={currentUser}
            compact
          />
        </div>
      ) : null}

      {hasReplyDraft ? (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
          <CommentComposer
            value={replyValue}
            onChange={(value) => patchDraft(replyKey, value)}
            onSubmit={(event) => onReply(event, comment._id, replyKey, replyValue)}
            submitLabel="Gửi trả lời"
            placeholder="Viết câu trả lời của bạn..."
            onCancel={() => patchDraft(replyKey, undefined)}
            isSubmitting={loadingKey === `reply-${comment._id}`}
            currentUser={currentUser}
            compact
          />
        </div>
      ) : null}

      {comment.replies?.length ? (
        <div className="space-y-3 border-l border-sky-100 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUser={currentUser}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              draftMap={draftMap}
              setDraftMap={setDraftMap}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              loadingKey={loadingKey}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function TourSocialHub({ tour }) {
  const { currentUser, isAdmin, isAuthenticated } = useAppContext();
  const [reviewState, setReviewState] = useState({ tour: null, reviews: [], pagination: null });
  const [commentState, setCommentState] = useState({ comments: [], summary: null });
  const [draftMap, setDraftMap] = useState({});
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingKey, setLoadingKey] = useState("");

  const myReview = useMemo(
    () => reviewState.reviews.find((review) => String(review.user?._id) === String(currentUser?.id)) || null,
    [currentUser?.id, reviewState.reviews]
  );

  const ratingAverage = Number(reviewState.tour?.ratingAverage ?? tour.ratingAverage ?? 0);
  const ratingCount = Number(reviewState.tour?.ratingCount ?? tour.ratingCount ?? 0);

  function pushFeedback(nextMessage = "", nextError = "") {
    setMessage(nextMessage);
    setError(nextError);
  }

  const loadCommunity = useCallback(async () => {
    setError("");

    const [reviewResult, commentResult] = await Promise.allSettled([
      getTourReviews(tour.slug, { limit: 10 }),
      getTourComments(tour.slug, { limit: 20 }),
    ]);

    if (reviewResult.status === "fulfilled") {
      setReviewState({
        tour: reviewResult.value.tour,
        reviews: reviewResult.value.reviews,
        pagination: reviewResult.value.pagination,
      });
    }

    if (commentResult.status === "fulfilled") {
      setCommentState({
        comments: commentResult.value.comments,
        summary: commentResult.value.summary,
      });
    }

    if (reviewResult.status === "rejected" && commentResult.status === "rejected") {
      setError("Không tải được bình luận và đánh giá của tour.");
    }
  }, [tour.slug]);

  async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      pushFeedback("", "Bạn cần đăng nhập để gửi đánh giá.");
      return;
    }

    if (!String(reviewForm.comment || "").trim()) {
      pushFeedback("", "Vui lòng nhập nội dung đánh giá.");
      return;
    }

    setLoadingKey("review");
    pushFeedback();

    try {
      await upsertMyReview(tour.slug, {
        rating: Number(reviewForm.rating),
        title: "",
        comment: reviewForm.comment,
        images: [],
      });

      pushFeedback(myReview ? "Đã cập nhật đánh giá của bạn." : "Đã gửi đánh giá thành công.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Không lưu được đánh giá.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleDeleteReview() {
    if (!isAuthenticated) {
      return;
    }

    setLoadingKey("review-delete");
    pushFeedback();

    try {
      await deleteMyReview(tour.slug);
      setReviewForm({
        rating: 5,
        comment: "",
      });
      pushFeedback("Đã xóa đánh giá của bạn.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Không xóa được đánh giá.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleCreateComment(
    event,
    parentCommentId = null,
    draftKey = "new-comment",
    content = draftMap["new-comment"] || ""
  ) {
    event.preventDefault();

    if (!isAuthenticated) {
      pushFeedback("", "Bạn cần đăng nhập để bình luận.");
      return;
    }

    if (!String(content || "").trim()) {
      pushFeedback("", "Vui lòng nhập nội dung bình luận.");
      return;
    }

    setLoadingKey(parentCommentId ? `reply-${parentCommentId}` : "comment");
    pushFeedback();

    try {
      await createComment(tour.slug, {
        content: String(content).trim(),
        parentComment: parentCommentId || undefined,
      });

      setDraftMap((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[draftKey];
        return nextDrafts;
      });
      pushFeedback("Đã gửi bình luận.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Không tạo được bình luận.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleUpdateComment(event, commentId, draftKey, content) {
    event.preventDefault();

    if (!String(content || "").trim()) {
      pushFeedback("", "Vui lòng nhập nội dung bình luận.");
      return;
    }

    setLoadingKey(`update-${commentId}`);
    pushFeedback();

    try {
      await updateComment(commentId, { content: String(content).trim() });
      setDraftMap((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[draftKey];
        return nextDrafts;
      });
      pushFeedback("Đã cập nhật bình luận.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Không cập nhật được bình luận.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleDeleteComment(commentId) {
    setLoadingKey(`delete-${commentId}`);
    pushFeedback();

    try {
      await deleteComment(commentId);
      pushFeedback("Đã xóa bình luận.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Không xóa được bình luận.");
    } finally {
      setLoadingKey("");
    }
  }

  useEffect(() => {
    void loadCommunity();
  }, [loadCommunity]);

  useEffect(() => {
    if (!myReview) {
      return;
    }

    setReviewForm({
      rating: myReview.rating || 5,
      comment: myReview.comment || "",
    });
  }, [myReview]);

  return (
    <div className="space-y-6">
      <FeedbackBox message={message} tone="success" />
      <FeedbackBox message={error} tone="error" />

      <CommunityCard
        title="Bình luận"
      >
        {commentState.comments.length > 0 ? (
          <div className="space-y-4">
            {commentState.comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUser={currentUser}
                currentUserId={currentUser?.id}
                isAdmin={isAdmin}
                draftMap={draftMap}
                setDraftMap={setDraftMap}
                onReply={handleCreateComment}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
                loadingKey={loadingKey}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center text-sm text-slate-500">
            Không có bình luận nào.
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h3 className="text-xl font-bold tracking-[-0.02em] text-slate-900">Để lại bình luận</h3>
          <p className="mt-2 text-sm text-slate-500">Bạn có thể đặt câu hỏi hoặc chia sẻ thêm trải nghiệm của mình về tour này.</p>
          <div className="mt-4 rounded-[20px] border border-sky-100 bg-[linear-gradient(180deg,#f8fdff_0%,#ffffff_100%)] p-4">
            <CommentComposer
              value={draftMap["new-comment"] || ""}
              onChange={(value) =>
                setDraftMap((currentDrafts) => ({
                  ...currentDrafts,
                  "new-comment": value,
                }))
              }
              onSubmit={(event) => handleCreateComment(event)}
              submitLabel="Gửi"
              placeholder="Bạn có thắc mắc gì không, hãy để lại câu hỏi ở đây nhé!"
              isSubmitting={loadingKey === "comment"}
              currentUser={currentUser}
            />
          </div>
        </div>
      </CommunityCard>

      <CommunityCard
        title="Đánh giá khách hàng"
        badge={
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-2 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Tổng quan</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{ratingAverage.toFixed(1)}/5</p>
            <p className="text-xs text-slate-500">{ratingCount} đánh giá</p>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-[20px] border border-amber-100 bg-[linear-gradient(180deg,#fff8ec_0%,#ffffff_100%)] p-5">
            <form onSubmit={handleReviewSubmit} className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Đánh giá sao *</p>
                <RatingStars
                  value={Number(reviewForm.rating)}
                  onChange={(nextValue) =>
                    setReviewForm((currentForm) => ({
                      ...currentForm,
                      rating: nextValue,
                    }))
                  }
                  interactive
                  className="mt-3"
                />
              </div>

              <label className="block text-sm font-semibold text-slate-900">
                Nội dung đánh giá *
                <textarea
                  value={reviewForm.comment}
                  onChange={(event) =>
                    setReviewForm((currentForm) => ({
                      ...currentForm,
                      comment: event.target.value,
                    }))
                  }
                  className="mt-3 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                  placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
                  maxLength={500}
                />
              </label>

              <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                <span>{isAuthenticated ? "Đánh giá sẽ hiển thị công khai sau khi gửi." : "Bạn cần đăng nhập để gửi đánh giá."}</span>
                <span>{String(reviewForm.comment || "").length}/500 ký tự</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={loadingKey === "review"}
                  className="inline-flex min-w-[12rem] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_100%)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loadingKey === "review" ? "Đang gửi..." : myReview ? "Lưu đánh giá" : "Gửi đánh giá"}
                </button>
                {myReview ? (
                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    disabled={loadingKey === "review-delete"}
                    className="rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Xóa đánh giá
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {reviewState.reviews.length > 0 ? (
              reviewState.reviews.map((review) => <ReviewItem key={review._id} review={review} />)
            ) : (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center text-sm text-slate-500">
                Chưa có đánh giá nào cho tour này.
              </div>
            )}
          </div>
        </div>
      </CommunityCard>
    </div>
  );
}

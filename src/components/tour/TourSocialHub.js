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

function SectionCard({ title, description, children, action }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-slate-900">{title}</h2>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {action}
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
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[tone];

  return <div className={cn("rounded-2xl border px-4 py-3 text-sm", toneClassName)}>{message}</div>;
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  submitLabel,
  placeholder,
  onCancel,
  isSubmitting,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
        placeholder={placeholder}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          {isSubmitting ? "Dang gui..." : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Huy
          </button>
        ) : null}
      </div>
    </form>
  );
}

function CommentItem({
  comment,
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
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{comment.user?.fullName || "Thanh vien BETOURIST"}</p>
          <p className="mt-1 text-xs text-slate-400">{formatDateTimeVi(comment.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => patchDraft(replyKey, hasReplyDraft ? undefined : "")}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Tra loi
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={() => patchDraft(editKey, hasEditDraft ? undefined : comment.content)}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Chinh sua
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              onClick={() => onDelete(comment._id)}
              disabled={loadingKey === `delete-${comment._id}`}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
            >
              Xoa
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-sm leading-6 text-slate-700">{comment.content}</p>

      {hasEditDraft && canManage ? (
        <CommentComposer
          value={editValue}
          onChange={(value) => patchDraft(editKey, value)}
          onSubmit={(event) => onUpdate(event, comment._id, editKey, editValue)}
          submitLabel="Luu binh luan"
          placeholder="Cap nhat noi dung binh luan"
          onCancel={() => patchDraft(editKey, undefined)}
          isSubmitting={loadingKey === `update-${comment._id}`}
        />
      ) : null}

      {hasReplyDraft ? (
        <CommentComposer
          value={replyValue}
          onChange={(value) => patchDraft(replyKey, value)}
          onSubmit={(event) => onReply(event, comment._id, replyKey, replyValue)}
          submitLabel="Gui tra loi"
          placeholder="Viet cau tra loi..."
          onCancel={() => patchDraft(replyKey, undefined)}
          isSubmitting={loadingKey === `reply-${comment._id}`}
        />
      ) : null}

      {comment.replies?.length ? (
        <div className="space-y-3 border-l border-slate-200 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
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
  const [reviewState, setReviewState] = useState({ reviews: [], pagination: null });
  const [commentState, setCommentState] = useState({ comments: [], summary: null });
  const [draftMap, setDraftMap] = useState({});
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
    images: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingKey, setLoadingKey] = useState("");

  const myReview = useMemo(
    () => reviewState.reviews.find((review) => String(review.user?._id) === String(currentUser?.id)) || null,
    [currentUser?.id, reviewState.reviews]
  );

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
      setError("Khong tai duoc review va comment cua tour.");
    }
  }, [tour.slug]);

  async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      pushFeedback("", "Ban can dang nhap de gui danh gia.");
      return;
    }

    setLoadingKey("review");
    pushFeedback();

    try {
      await upsertMyReview(tour.slug, {
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        comment: reviewForm.comment,
        // Backend ho tro images la mang chuoi, FE cho nhap nhanh bang textarea.
        images: reviewForm.images
          .split(/\n|,/)
          .map((item) => item.trim())
          .filter(Boolean),
      });

      pushFeedback(myReview ? "Da cap nhat review cua ban." : "Da gui review thanh cong.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Khong luu duoc review.");
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
        title: "",
        comment: "",
        images: "",
      });
      pushFeedback("Da xoa review cua ban.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Khong xoa duoc review.");
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
      pushFeedback("", "Ban can dang nhap de binh luan.");
      return;
    }

    setLoadingKey(parentCommentId ? `reply-${parentCommentId}` : "comment");
    pushFeedback();

    try {
      await createComment(tour.slug, {
        content,
        parentComment: parentCommentId || undefined,
      });

      setDraftMap((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[draftKey];
        return nextDrafts;
      });
      pushFeedback("Da gui binh luan.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Khong tao duoc binh luan.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleUpdateComment(event, commentId, draftKey, content) {
    event.preventDefault();

    setLoadingKey(`update-${commentId}`);
    pushFeedback();

    try {
      await updateComment(commentId, { content });
      setDraftMap((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[draftKey];
        return nextDrafts;
      });
      pushFeedback("Da cap nhat binh luan.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Khong cap nhat duoc binh luan.");
    } finally {
      setLoadingKey("");
    }
  }

  async function handleDeleteComment(commentId) {
    setLoadingKey(`delete-${commentId}`);
    pushFeedback();

    try {
      await deleteComment(commentId);
      pushFeedback("Da xoa binh luan.");
      await loadCommunity();
    } catch (actionError) {
      pushFeedback("", actionError.message || "Khong xoa duoc binh luan.");
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
      title: myReview.title || "",
      comment: myReview.comment || "",
      images: Array.isArray(myReview.images) ? myReview.images.join("\n") : "",
    });
  }, [myReview]);

  return (
    <div className="space-y-6">
      <FeedbackBox message={message} tone="success" />
      <FeedbackBox message={error} tone="error" />

      <SectionCard
        title="Danh gia tu khach hang"
        description="Khu vuc nay ket noi `GET /api/reviews/tour/:tourIdOrSlug`, cho phep user dang nhap tao/sua/xoa review cua chinh minh."
        action={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Tong quan</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{tour.ratingAverage.toFixed(1)}/5</p>
            <p className="text-xs text-slate-500">{tour.ratingCount} danh gia</p>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <form onSubmit={handleReviewSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-lg font-semibold text-slate-900">
              {myReview ? "Cap nhat review cua ban" : "Gui review moi"}
            </h3>
            <label className="block text-sm font-medium text-slate-700">
              So sao
              <select
                value={reviewForm.rating}
                onChange={(event) =>
                  setReviewForm((currentForm) => ({
                    ...currentForm,
                    rating: Number(event.target.value),
                  }))
                }
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} sao
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tieu de
              <input
                value={reviewForm.title}
                onChange={(event) =>
                  setReviewForm((currentForm) => ({
                    ...currentForm,
                    title: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                placeholder="Cam nhan ngan gon"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Noi dung
              <textarea
                value={reviewForm.comment}
                onChange={(event) =>
                  setReviewForm((currentForm) => ({
                    ...currentForm,
                    comment: event.target.value,
                  }))
                }
                className="mt-1 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                placeholder="Chia se trai nghiem cua ban"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Anh minh hoa URL
              <textarea
                value={reviewForm.images}
                onChange={(event) =>
                  setReviewForm((currentForm) => ({
                    ...currentForm,
                    images: event.target.value,
                  }))
                }
                className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                placeholder="Moi dong 1 URL neu ban muon gui kem anh"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loadingKey === "review"}
                className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
              >
                {loadingKey === "review" ? "Dang luu..." : myReview ? "Luu review" : "Gui review"}
              </button>
              {myReview ? (
                <button
                  type="button"
                  onClick={handleDeleteReview}
                  disabled={loadingKey === "review-delete"}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                >
                  Xoa review
                </button>
              ) : null}
            </div>
          </form>

          <div className="space-y-3">
            {reviewState.reviews.length > 0 ? (
              reviewState.reviews.map((review) => (
                <article key={review._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{review.user?.fullName || "Thanh vien BETOURIST"}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTimeVi(review.updatedAt || review.createdAt)}</p>
                    </div>
                    <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">
                      {review.rating}/5
                    </div>
                  </div>
                  {review.title ? <h3 className="mt-3 text-lg font-semibold text-slate-900">{review.title}</h3> : null}
                  <p className="mt-2 text-sm leading-6 text-slate-600">{review.comment || "Nguoi dung chua de lai mo ta chi tiet."}</p>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Chua co review nao cho tour nay.
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Hoi dap va binh luan"
        description="Comment tree dang su dung `GET /api/comments/tour/:tourIdOrSlug` de load cay binh luan va cho phep reply/edit/delete theo dung quyen."
        action={
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Tong comment</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{commentState.summary?.totalComments || 0}</p>
            <p className="text-xs text-slate-500">{commentState.summary?.totalTopLevelComments || 0} chu de</p>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Bat dau cuoc tro chuyen</h3>
            <p className="mt-2 text-sm text-slate-600">
              Ban co the hoi thong tin tour, chia se kinh nghiem hoac tra loi binh luan cua nguoi khac.
            </p>
            <div className="mt-4">
              <CommentComposer
                value={draftMap["new-comment"] || ""}
                onChange={(value) =>
                  setDraftMap((currentDrafts) => ({
                    ...currentDrafts,
                    "new-comment": value,
                  }))
                }
                onSubmit={(event) => handleCreateComment(event)}
                submitLabel="Gui binh luan"
                placeholder="Viet binh luan cua ban..."
                isSubmitting={loadingKey === "comment"}
              />
            </div>
          </div>

          {commentState.comments.length > 0 ? (
            <div className="space-y-4">
              {commentState.comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
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
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Chua co binh luan nao. Ban co the mo dau chu de dau tien.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

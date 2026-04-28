"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getCategoriesForAdmin,
  getCategoryDetailForAdmin,
  uploadCategoryImage,
  updateCategory,
} from "@/apiService/categories";
import { getToursForAdmin } from "@/apiService/tours";

const FETCH_LIMIT = 50;
const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];
const MAX_CATEGORY_IMAGE_SIZE = 2 * 1024 * 1024;
const INITIAL_FORM = {
  id: "",
  name: "",
  description: "",
  imageUrl: "",
  imageUrlInput: "",
  imageFileName: "",
  parentCategory: "",
  isActive: true,
  sortOrder: "0",
};

function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function EditIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L8 20H4v-4z" />
    </svg>
  );
}

function DeleteIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronsLeftIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}

function ChevronsRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m13 17 5-5-5-5" />
      <path d="m6 17 5-5-5-5" />
    </svg>
  );
}

function revokeObjectUrl(url) {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function createDraft(category) {
  if (!category) {
    return INITIAL_FORM;
  }

  return {
    id: category.id,
    name: category.name || "",
    description: category.description || "",
    imageUrl: category.imageUrl || "",
    imageUrlInput: category.imageUrl || "",
    imageFileName: "",
    parentCategory: category.parentCategory?.id || "",
    isActive: category.isActive ?? true,
    sortOrder: String(category.sortOrder ?? 0),
  };
}

function sortCategories(items) {
  return [...items].sort((left, right) => {
    const sortDelta = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);

    if (sortDelta !== 0) {
      return sortDelta;
    }

    return String(left.name || "").localeCompare(String(right.name || ""), "vi");
  });
}

function buildCategorySearchIndex(category) {
  return [
    category.name,
    category.slug,
    category.description,
    category.parentCategory?.name,
    category.parentCategory?.slug,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getFilteredCategories(categories, searchQuery) {
  const normalizedQuery = String(searchQuery || "").trim().toLowerCase();

  if (!normalizedQuery) {
    return sortCategories(categories);
  }

  return sortCategories(
    categories.filter((category) => buildCategorySearchIndex(category).includes(normalizedQuery))
  );
}

function getVisiblePageNumbers(totalPages, currentPage) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 2) {
    return [1, 2, 3];
  }

  if (currentPage >= totalPages - 1) {
    return [totalPages - 2, totalPages - 1, totalPages];
  }

  return [currentPage - 1, currentPage, currentPage + 1];
}

async function fetchAllCategories() {
  const collectedCategories = [];
  let page = 1;

  for (let guard = 0; guard < 40; guard += 1) {
    const result = await getCategoriesForAdmin({ page, limit: FETCH_LIMIT });
    collectedCategories.push(...(result.categories || []));

    if (!result.pagination?.hasNextPage) {
      break;
    }

    page += 1;
  }

  return sortCategories(collectedCategories);
}

function buildCategoryTourCounts(categories, directTourCounts) {
  const parentByCategoryId = new Map(
    categories.map((category) => [category.id, category.parentCategory?.id || null])
  );
  const categoryTourCounts = {};

  Object.entries(directTourCounts).forEach(([categoryId, directCount]) => {
    let currentCategoryId = categoryId;
    const visitedCategoryIds = new Set();

    while (currentCategoryId && !visitedCategoryIds.has(currentCategoryId)) {
      visitedCategoryIds.add(currentCategoryId);
      categoryTourCounts[currentCategoryId] =
        (categoryTourCounts[currentCategoryId] || 0) + directCount;
      currentCategoryId = parentByCategoryId.get(currentCategoryId);
    }
  });

  return categoryTourCounts;
}

async function fetchTourCounts(categories = []) {
  // API category hiện không trả sẵn số tour, nên panel tự đếm từ danh sách tour admin.
  const directTourCounts = {};
  let page = 1;

  for (let guard = 0; guard < 80; guard += 1) {
    const result = await getToursForAdmin({ page, limit: FETCH_LIMIT });

    (result.tours || []).forEach((tour) => {
      const categoryId = tour.category?.id;

      if (!categoryId) {
        return;
      }

      directTourCounts[categoryId] = (directTourCounts[categoryId] || 0) + 1;
    });

    if (!result.pagination?.hasNextPage) {
      break;
    }

    page += 1;
  }

  return buildCategoryTourCounts(categories, directTourCounts);
}

function renderCategoryPlaceholder(categoryName, compact = false) {
  const initials = String(categoryName || "DM")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-cyan-100 to-amber-100 text-center font-semibold text-slate-700 ${compact ? "h-14 w-14 text-sm" : "h-16 w-16 text-sm"
        }`}
    >
      {compact ? initials || "DM" : initials || "DM"}
    </div>
  );
}

function CategoryFormField({ label, children, hint = "" }) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [tourCounts, setTourCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [localImagePreview, setLocalImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextCategories = await fetchAllCategories();
      setCategories(nextCategories);
      try {
        setTourCounts(await fetchTourCounts(nextCategories));
      } catch {
        setTourCounts({});
      }
    } catch (loadError) {
      setError(loadError.message || "Không tải được danh sách danh mục.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(
    () => getFilteredCategories(categories, searchQuery),
    [categories, searchQuery]
  );
  const selectableParents = useMemo(
    () => categories.filter((category) => category.id !== form.id),
    [categories, form.id]
  );
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCategories = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredCategories.slice(startIndex, startIndex + pageSize);
  }, [filteredCategories, safeCurrentPage, pageSize]);
  const visiblePages = useMemo(
    () => getVisiblePageNumbers(totalPages, safeCurrentPage),
    [safeCurrentPage, totalPages]
  );
  const startItem = paginatedCategories.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = paginatedCategories.length === 0 ? 0 : startItem + paginatedCategories.length - 1;
  // Trong lúc upload ảnh từ máy, ưu tiên preview blob cục bộ trước khi backend trả về URL thật.
  const displayedImagePreview = localImagePreview || form.imageUrl;

  function closeDialog() {
    revokeObjectUrl(localImagePreview);
    setIsDialogOpen(false);
    setForm(INITIAL_FORM);
    setFormLoading(false);
    setImageLoading(false);
    setLocalImagePreview("");
  }

  function openCreateDialog() {
    revokeObjectUrl(localImagePreview);
    setError("");
    setMessage("");
    setForm(INITIAL_FORM);
    setFormLoading(false);
    setImageLoading(false);
    setLocalImagePreview("");
    setIsDialogOpen(true);
  }

  async function openEditDialog(categoryId) {
    revokeObjectUrl(localImagePreview);
    setForm(INITIAL_FORM);
    setFormLoading(true);
    setImageLoading(false);
    setLocalImagePreview("");
    setIsDialogOpen(true);
    setError("");
    setMessage("");

    try {
      const category = await getCategoryDetailForAdmin(categoryId);
      setForm(createDraft(category));
    } catch (actionError) {
      setError(actionError.message || "Không tải được chi tiết danh mục.");
      setIsDialogOpen(false);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleImageFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Chỉ được chọn file ảnh cho danh mục.");
      return;
    }

    if (file.size > MAX_CATEGORY_IMAGE_SIZE) {
      setError("Ảnh danh mục không được vượt quá 2MB.");
      return;
    }

    setError("");
    setImageLoading(true);
    const previewUrl = URL.createObjectURL(file);
    revokeObjectUrl(localImagePreview);
    setLocalImagePreview(previewUrl);
    setForm((current) => ({
      ...current,
      imageFileName: file.name,
      imageUrlInput: "",
    }));

    try {
      // Upload ảnh trước, sau đó chỉ lưu URL trả về vào category để tránh nhét base64 vào payload JSON.
      const uploadedImage = await uploadCategoryImage(file);

      setForm((current) => ({
        ...current,
        imageUrl: uploadedImage.url,
        imageUrlInput: uploadedImage.url,
        imageFileName: file.name,
      }));
      revokeObjectUrl(previewUrl);
      setLocalImagePreview("");
    } catch (imageError) {
      revokeObjectUrl(previewUrl);
      setLocalImagePreview("");
      setForm((current) => ({
        ...current,
        imageUrl: "",
        imageUrlInput: "",
        imageFileName: "",
      }));
      setError(imageError.message || "Không tải lên được ảnh danh mục.");
    } finally {
      setImageLoading(false);
    }
  }

  function handleImageUrlChange(event) {
    const nextValue = event.target.value;
    revokeObjectUrl(localImagePreview);
    setLocalImagePreview("");

    setForm((current) => ({
      ...current,
      imageUrl: nextValue,
      imageUrlInput: nextValue,
      imageFileName: "",
    }));
  }

  function clearSelectedImage() {
    revokeObjectUrl(localImagePreview);
    setLocalImagePreview("");
    setForm((current) => ({
      ...current,
      imageUrl: "",
      imageUrlInput: "",
      imageFileName: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: displayedImagePreview.trim(),
      parentCategory: form.parentCategory || null,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder || 0),
    };

    try {
      if (form.id) {
        await updateCategory(form.id, payload);
        setMessage("Đã cập nhật danh mục.");
      } else {
        await createCategory(payload);
        setMessage("Đã tạo danh mục mới.");
      }

      closeDialog();
      await loadCategories();
    } catch (actionError) {
      setError(actionError.message || "Không lưu được danh mục.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(categoryId) {
    setError("");
    setMessage("");

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Xóa danh mục này? Backend sẽ chặn nếu danh mục đang có danh mục con hoặc tour."
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setDeletingId(categoryId);
      await deleteCategory(categoryId);
      setMessage("Đã xóa danh mục.");
      await loadCategories();
    } catch (actionError) {
      setError(actionError.message || "Không xóa được danh mục.");
    } finally {
      setDeletingId("");
    }
  }

  function handleSearchChange(event) {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  }

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  }

  return (
    <>
      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              <SearchIcon className="h-5 w-5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Tìm danh mục"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label className="rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700">
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="bg-transparent pr-7 outline-none"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} mục
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={openCreateDialog}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Thêm danh mục
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pt-4">
          {message ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full border-collapse">
                <thead className="bg-slate-50 text-left text-sm uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-5 text-center font-medium">STT</th>
                    <th className="px-6 py-5 font-medium">Danh mục</th>
                    <th className="px-6 py-5 text-center font-medium">Tổng tour</th>
                    <th className="px-6 py-5 text-center font-medium">Hành động</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                        Đang tải danh sách danh mục...
                      </td>
                    </tr>
                  ) : paginatedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                        Không có danh mục nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    paginatedCategories.map((category, index) => {
                      const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;
                      const totalTours = tourCounts[category.id] || 0;

                      return (
                        <tr key={category.id} className="align-middle transition hover:bg-slate-50/80">
                          <td className="px-6 py-5 text-center text-base font-medium text-slate-900">
                            {rowNumber}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              {category.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={category.imageUrl}
                                  alt={category.name}
                                  className="h-14 w-14 rounded-2xl border border-slate-200 object-cover"
                                />
                              ) : (
                                renderCategoryPlaceholder(category.name, true)
                              )}

                              <div className="min-w-0">
                                <p className="truncate text-base font-medium text-slate-900">
                                  {category.name}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">Slug: {category.slug}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${category.isActive
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-500"
                                      }`}
                                  >
                                    {category.isActive ? "Đang hiển thị" : "Tạm ẩn"}
                                  </span>

                                  {category.parentCategory ? (
                                    <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                                      Mục cha: {category.parentCategory.name}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center text-base font-medium text-slate-900">
                            {totalTours}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                type="button"
                                title="Chỉnh sửa danh mục"
                                aria-label="Chỉnh sửa danh mục"
                                onClick={() => void openEditDialog(category.id)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                              >
                                <EditIcon className="h-5 w-5" />
                              </button>

                              <button
                                type="button"
                                title="Xóa danh mục"
                                aria-label="Xóa danh mục"
                                onClick={() => void handleDelete(category.id)}
                                disabled={deletingId === category.id}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <DeleteIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm lg:flex-row lg:items-center lg:justify-between">
            <p className="text-slate-500">
              Hiển thị <span className="font-semibold text-slate-800">{startItem}</span> đến{" "}
              <span className="font-semibold text-slate-800">{endItem}</span> của{" "}
              <span className="font-semibold text-slate-800">{filteredCategories.length}</span> mục
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronsLeftIcon />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage === 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeftIcon />
              </button>

              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${pageNumber === safeCurrentPage
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRightIcon />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronsRightIcon />
              </button>
            </div>
          </div>
        </div>
      </section>

      {isDialogOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-dialog-title"
            className="w-full max-w-4xl rounded-[1.75rem] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="category-dialog-title" className="text-[2rem] font-semibold text-slate-900">
                  {form.id ? "Cập nhật danh mục" : "Thêm danh mục mới"}
                </h3>

              </div>

              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng hộp thoại"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {formLoading ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                Đang tải chi tiết danh mục...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <CategoryFormField label="Tên danh mục *">
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="VD: Tour biển, Tour quốc tế"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      minLength={2}
                      maxLength={120}
                      required
                    />
                  </CategoryFormField>

                  <CategoryFormField label="Danh mục cha">
                    <select
                      value={form.parentCategory}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, parentCategory: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                    >
                      <option value="">Không có danh mục cha</option>
                      {selectableParents.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </CategoryFormField>

                  <div className="md:col-span-2">
                    <CategoryFormField label="Mô tả" hint={`${form.description.length}/500 ký tự`}>
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, description: event.target.value }))
                        }
                        placeholder="Mô tả ngắn về chủ đề tour, đối tượng khách và mục đích phân loại."
                        className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                        maxLength={500}
                      />
                    </CategoryFormField>
                  </div>

                  <div className="md:col-span-2">
                    <CategoryFormField
                      label="Ảnh danh mục"
                      hint="Bạn có thể chọn ảnh từ máy hoặc dán imageUrl. Ảnh từ máy nên nhỏ hơn 2MB."
                    >
                      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start">
                          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {displayedImagePreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={displayedImagePreview}
                                alt={form.name || "Ảnh danh mục"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              renderCategoryPlaceholder(form.name || "Danh mục")
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap gap-3">
                              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageFileChange}
                                  className="sr-only"
                                  disabled={imageLoading}
                                />
                                {imageLoading ? "Đang xử lý ảnh..." : "Chọn ảnh từ máy"}
                              </label>

                              <button
                                type="button"
                                onClick={clearSelectedImage}
                                disabled={!displayedImagePreview}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Xóa ảnh
                              </button>
                            </div>

                            <p className="text-sm text-slate-500">
                              {form.imageFileName
                                ? `Đã chọn: ${form.imageFileName}`
                                : displayedImagePreview
                                  ? "Đang dùng ảnh hiện có của danh mục."
                                  : "Chưa có ảnh cho danh mục."}
                            </p>

                            <input
                              value={form.imageUrlInput}
                              onChange={handleImageUrlChange}
                              placeholder="Hoặc dán imageUrl tại đây"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                            />
                          </div>
                        </div>
                      </div>
                    </CategoryFormField>
                  </div>
                </div>

                <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isActive: event.target.checked }))
                      }
                      className="mt-1"
                    />
                    <span className="space-y-1">
                      <span className="block font-medium text-slate-800">
                        Kích hoạt và hiển thị danh mục trên hệ thống
                      </span>
                      <span className="block text-slate-500">
                        Bật mục này nếu bạn muốn danh mục xuất hiện ở giao diện người dùng. Bỏ
                        chọn nếu chỉ muốn ẩn tạm khỏi hệ thống nhưng vẫn giữ dữ liệu trong trang
                        quản trị.
                      </span>
                    </span>
                  </span>
                </label>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-2xl border border-slate-300 px-6 py-3 text-lg font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || imageLoading}
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {submitting ? "Đang lưu..." : form.id ? "Lưu cập nhật" : "Thêm danh mục"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

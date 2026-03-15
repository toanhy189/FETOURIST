"use client";

import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getCategoriesForAdmin,
  getCategoryDetailForAdmin,
  updateCategory,
} from "@/apiService/categories";

const initialForm = {
  id: "",
  name: "",
  description: "",
  imageUrl: "",
  parentCategory: "",
  isActive: true,
  sortOrder: 0,
};

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const result = await getCategoriesForAdmin({ limit: 30 });
      setCategories(result.categories);
    } catch (loadError) {
      setError(loadError.message || "Khong tai duoc danh sach category.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
  }

  async function handleEdit(categoryId) {
    setError("");
    setMessage("");

    try {
      const category = await getCategoryDetailForAdmin(categoryId);
      setForm({
        id: category.id,
        name: category.name,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        parentCategory: category.parentCategory?.id || "",
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      });
    } catch (actionError) {
      setError(actionError.message || "Khong tai duoc chi tiet category.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl,
      parentCategory: form.parentCategory || null,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder || 0),
    };

    try {
      if (form.id) {
        await updateCategory(form.id, payload);
        setMessage("Da cap nhat category.");
      } else {
        await createCategory(payload);
        setMessage("Da tao category moi.");
      }

      resetForm();
      await loadCategories();
    } catch (actionError) {
      setError(actionError.message || "Khong luu duoc category.");
    }
  }

  async function handleDelete(categoryId) {
    setError("");
    setMessage("");

    try {
      await deleteCategory(categoryId);
      setMessage("Da xoa category.");
      if (form.id === categoryId) {
        resetForm();
      }
      await loadCategories();
    } catch (actionError) {
      setError(actionError.message || "Khong xoa duoc category.");
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-display text-3xl text-slate-900">Category manager</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Panel nay dung du ca admin list, admin detail, create, update va delete category.
      </p>

      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">
            {form.id ? "Cap nhat category" : "Tao category moi"}
          </h3>
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ten category" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" required />
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Mo ta" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <input value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Image URL" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <select value={form.parentCategory} onChange={(event) => setForm((current) => ({ ...current, parentCategory: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">Khong co category cha</option>
            {categories.filter((category) => category.id !== form.id).map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} placeholder="Sort order" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Dang active
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white">
              {form.id ? "Luu cap nhat" : "Tao category"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Reset
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Dang tai categories...</p>
          ) : (
            categories.map((category) => (
              <article key={category.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-sky-700">
                      {category.isActive ? "active" : "inactive"}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{category.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{category.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(category.id)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">
                      Sua
                    </button>
                    <button type="button" onClick={() => handleDelete(category.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">
                      Xoa
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

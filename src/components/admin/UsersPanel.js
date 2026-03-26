"use client";

import { useEffect, useState } from "react";
import { getUsers } from "@/apiService/auth";
import { formatDateTimeVi } from "@/utils/format";

function getDefaultTitle(roleFilter) {
  if (roleFilter === "admin") {
    return "Danh sach admin";
  }

  if (roleFilter === "user") {
    return "Nguoi dung he thong";
  }

  return "Tai khoan he thong";
}

function getDefaultDescription(roleFilter) {
  if (roleFilter === "admin") {
    return "Tong hop cac tai khoan role admin dang duoc cap quyen trong BETOURIST.";
  }

  if (roleFilter === "user") {
    return "Danh sach nguoi dung cuoi va thong tin lien lac co the phuc vu booking.";
  }

  return "Panel nay dang goi `/api/auth/users` de liet ke toan bo user.";
}

export default function UsersPanel({
  roleFilter = null,
  title = null,
  description = null,
}) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      setUsers(await getUsers());
    } catch (loadError) {
      setError(loadError.message || "Khong tai duoc danh sach users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const visibleUsers = roleFilter ? users.filter((user) => user.role === roleFilter) : users;
  const resolvedTitle = title || getDefaultTitle(roleFilter);
  const resolvedDescription = description || getDefaultDescription(roleFilter);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-slate-900">{resolvedTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {resolvedDescription}
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Tai lai
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {loading ? (
          <p className="text-sm text-slate-500">Dang tai users...</p>
        ) : visibleUsers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            Chua co tai khoan nao phu hop voi bo loc hien tai.
          </div>
        ) : (
          visibleUsers.map((user) => (
            <article
              key={user.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xs uppercase tracking-wide text-sky-700">{user.role}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{user.fullName}</h3>
              <p className="mt-2 text-sm text-slate-600">{user.email}</p>
              <p className="mt-1 text-sm text-slate-500">
                {user.phoneNumber || "Chua cap nhat so dien thoai"}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Tao luc {formatDateTimeVi(user.createdAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { getUsers } from "@/apiService/auth";
import { formatDateTimeVi } from "@/utils/format";

const PAGE_SIZE_OPTIONS = [7, 10, 20];
const ROLE_OPTIONS = [
  { value: "user", label: "Nguoi dung" },
  { value: "admin", label: "Quan tri vien" },
];

function getDefaultTitle(roleFilter) {
  if (roleFilter === "admin") {
    return "Danh sach admin";
  }

  if (roleFilter === "user") {
    return "Nguoi dung he thong";
  }

  return "Tai khoan he thong";
}

function normalizeKeyword(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getRolePresentation(role) {
  if (role === "admin") {
    return {
      label: "Quan tri vien",
      className: "border border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  if (role === "user") {
    return {
      label: "Nguoi dung",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: role || "Chua phan vai tro",
    className: "border border-slate-200 bg-slate-100 text-slate-600",
  };
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16 21 21" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path d="M4 6h16l-6.5 7.4V19l-3 1v-6.6L4 6Z" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true" {...props}>
      <path d="m4 15.5 9.9-9.9a2.1 2.1 0 0 1 3 0l1.5 1.5a2.1 2.1 0 0 1 0 3L8.5 20H4v-4.5Z" strokeLinejoin="round" />
      <path d="m13.5 6 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path d="M4 7h16M9 7V5.8c0-.66.54-1.2 1.2-1.2h3.6c.66 0 1.2.54 1.2 1.2V7" strokeLinecap="round" />
      <path d="M7.5 7.5v10.2c0 .94.76 1.7 1.7 1.7h5.6c.94 0 1.7-.76 1.7-1.7V7.5" strokeLinecap="round" />
      <path d="M10 11v5M14 11v5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getRoleLabel(role) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || "Chua phan vai tro";
}

export default function UsersPanel({
  roleFilter = null,
  title = null,
}) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRole, setSelectedRole] = useState(roleFilter || "all");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [editingUser, setEditingUser] = useState(null);
  const [roleDraft, setRoleDraft] = useState("");
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setUsers(await getUsers());
    } catch (loadError) {
      setError(loadError.message || "Khong tai duoc danh sach users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setSelectedRole(roleFilter || "all");
  }, [roleFilter]);

  const normalizedKeyword = normalizeKeyword(searchKeyword);
  const visibleUsers = users.filter((user) => {
    const matchesRole = selectedRole === "all" ? true : user.role === selectedRole;
    const searchableContent = normalizeKeyword(
      `${user.fullName} ${user.email} ${user.phoneNumber} ${user.role}`
    );

    if (!matchesRole) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    return searchableContent.includes(normalizedKeyword);
  });
  const paginatedUsers = visibleUsers.slice(0, pageSize);
  const resolvedTitle = title || getDefaultTitle(roleFilter);

  function openRoleDialog(user) {
    setEditingUser(user);
    setRoleDraft(user?.role || "");
    setError("");
    setMessage("");
  }

  function closeRoleDialog() {
    setEditingUser(null);
    setRoleDraft("");
    setIsSubmittingRole(false);
  }

  async function handleSaveRole() {
    if (!editingUser?.id || !roleDraft) {
      return;
    }

    setIsSubmittingRole(true);

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === editingUser.id
          ? {
            ...user,
            role: roleDraft,
            updatedAt: new Date().toISOString(),
          }
          : user
      )
    );

    setMessage(
      `Da cap nhat quyen cho ${editingUser.fullName || editingUser.email} tren giao dien frontend.`
    );
    setError("");
    closeRoleDialog();
  }

  function handleDeletePlaceholder(user) {
    setMessage(
      `Nut xoa cua ${user.fullName || user.email} hien moi dung o giao dien vi backend chua co API xoa nguoi dung.`
    );
    setError("");
  }

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-display text-3xl text-slate-900">{resolvedTitle}</h2>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <SearchIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm tài khoản"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <FilterIcon className="h-5 w-5 text-slate-400" />
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  className="bg-transparent pr-8 text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="user">Nguoi dung</option>
                  <option value="admin">Quan tri vien</option>
                </select>
              </label>

              <label className="rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700">
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
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
                onClick={() => {
                  setMessage("Nut them tai khoan da duoc dat san giao dien. Neu can, minh se noi tiep form tao user cho admin.");
                  setError("");
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Thêm tài khoản
              </button>

            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-slate-500">
              Hiển thị <span className="font-semibold text-slate-800">{paginatedUsers.length}</span> /{" "}
              <span className="font-semibold text-slate-800">{visibleUsers.length}</span> tài khoản phù hợp
            </p>
            <p className="text-slate-400">
              Tổng số tài khoản: <span className="font-semibold text-slate-600">{users.length}</span>
            </p>
          </div>

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

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
                <thead className="bg-slate-50 text-left text-sm uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-5 font-medium">STT</th>
                    <th className="px-6 py-5 font-medium">Tên người dùng</th>
                    <th className="px-6 py-5 font-medium">Email</th>
                    <th className="px-6 py-5 font-medium">Số điện thoại</th>
                    <th className="px-6 py-5 font-medium">Vai trò</th>
                    <th className="px-6 py-5 font-medium">Ngày tạo và sửa đổi</th>
                    <th className="px-6 py-5 text-center font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                        Dang tai danh sach nguoi dung...
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                        Chua co tai khoan nao phu hop voi bo loc hien tai.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => {
                      const rolePresentation = getRolePresentation(user.role);

                      return (
                        <tr key={user.id} className="align-middle transition hover:bg-slate-50/80">
                          <td className="px-6 py-6 text-center text-base font-medium text-slate-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-6">
                            <p className="font-medium text-slate-900">
                              {user.fullName || "Chua cap nhat"}
                            </p>
                          </td>
                          <td className="px-6 py-6 text-slate-700">{user.email || "Dang cap nhat"}</td>
                          <td className="px-6 py-6">
                            {user.phoneNumber || "Chua cap nhat"}
                          </td>
                          <td className="px-6 py-6">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${rolePresentation.className}`}>
                              {rolePresentation.label}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-sm text-slate-500">
                            <p>
                              <span className="font-medium text-slate-600">Tạo:</span>{" "}
                              {formatDateTimeVi(user.createdAt)}
                            </p>
                            <p className="mt-2">
                              <span className="font-medium text-slate-600">Sửa:</span>{" "}
                              {formatDateTimeVi(user.updatedAt)}
                            </p>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                type="button"
                                title="Cap nhat quyen tai khoan"
                                aria-label="Cap nhat quyen tai khoan"
                                onClick={() => openRoleDialog(user)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                              >
                                <EditIcon className="h-5 w-5" />
                              </button>

                              <button
                                type="button"
                                title="Xoa nguoi dung"
                                aria-label="Xoa nguoi dung"
                                onClick={() => handleDeletePlaceholder(user)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                              >
                                <TrashIcon className="h-5 w-5" />
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
        </div>
      </section>

      {editingUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-role-title"
            className="w-full max-w-[520px] rounded-[1.75rem] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="update-role-title" className="text-[2rem] font-semibold text-slate-900">
                  Cập nhật quyền tài khoản
                </h3>
              </div>
              <button
                type="button"
                onClick={closeRoleDialog}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Dong hop thoai"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8">
              <label className="text-sm font-medium text-slate-700">Vai trò</label>
              <div className="relative mt-3 rounded-xl border border-blue-500 bg-white px-4 py-3 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]">
                <select
                  value={roleDraft}
                  onChange={(event) => setRoleDraft(event.target.value)}
                  className="w-full appearance-none bg-transparent pr-16 text-[1.15rem] text-slate-800 outline-none"
                >
                  <option value="">Chọn vai trò</option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center gap-3 text-slate-400">
                  <div className="h-5 w-px bg-slate-200" />
                  <ChevronDownIcon className="h-4 w-4" />
                </div>

                {roleDraft ? (
                  <button
                    type="button"
                    onClick={() => setRoleDraft("")}
                    className="absolute right-11 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Xoa lua chon vai tro"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRoleDialog}
                className="rounded-2xl border border-slate-300 px-6 py-3 text-lg font-medium text-slate-800 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSaveRole()}
                disabled={!roleDraft || isSubmittingRole}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

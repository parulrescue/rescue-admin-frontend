import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus } from "../api/user";
import { useAuthStore } from "../store/authStore";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { UserPlus, Search, Edit2, Trash2, User as UserIcon, Phone, Eye, EyeOff, KeyRound, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";

const createUserSchema = Yup.object({
  full_name: Yup.string().required("Full name is required").max(150),
  username: Yup.string().required("Username is required").matches(/^[a-z_]+$/, "Only lowercase letters & underscore allowed").min(4, "Minimum 4 characters").max(20, "Maximum 20 characters"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  mobile_number: Yup.string()
    .matches(/^\d*$/, "Only digits allowed")
    .min(10, "Minimum 10 digits")
    .max(13, "Maximum 13 digits"),
  password: Yup.string().required("Password is required").min(6, "Minimum 6 characters"),
});

const updateUserSchema = Yup.object({
  full_name: Yup.string().required("Full name is required").max(150),
  username: Yup.string().required("Username is required").matches(/^[a-z_]+$/, "Only lowercase letters & underscore allowed").min(4, "Minimum 4 characters").max(20, "Maximum 20 characters"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  mobile_number: Yup.string()
    .matches(/^\d*$/, "Only digits allowed")
    .test("min-digits", "Minimum 10 digits", (v) => !v || v.length >= 10)
    .max(13, "Maximum 13 digits"),
  password: Yup.string().test("min-len", "Minimum 6 characters", (v) => !v || v.length >= 6),
});

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm";
const USER_BACKEND_URL = import.meta.env.VITE_USER_BACKEND_URL || "http://localhost:5555";

export default function Users() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission("user_create");
  const canUpdate = hasPermission("user_update");
  const canDelete = hasPermission("user_delete");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", user: null });
  const [form, setForm] = useState({ full_name: "", email: "", username: "", mobile_number: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, user: null });
  const [deleteError, setDeleteError] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => getUsers({ page, limit: 10, search: search || undefined }),
  });

  const users = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const createMutation = useMutation({
    mutationFn: (d) => createUser(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => updateUser(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); setDeleteConfirm({ open: false, user: null }); setDeleteError(""); },
    onError: (err) => setDeleteError(err.response?.data?.error?.message || "Failed to delete user"),
  });

  const getProfilePicUrl = (pic) => {
    if (!pic) return null;
    if (pic.startsWith("http")) return pic;
    return `${USER_BACKEND_URL}${pic}`;
  };

  const digitsOnly = (v) => v.replace(/\D/g, "");
  const usernameOnly = (v) => v.replace(/[^a-z_]/g, "");

  const openCreate = () => {
    setForm({ full_name: "", email: "", username: "", mobile_number: "", password: "" });
    setShowPassword(false);
    setError("");
    setFieldErrors({});
    setModal({ open: true, mode: "create", user: null });
  };

  const openEdit = (user) => {
    setForm({ full_name: user.full_name, email: user.email, username: user.username, mobile_number: user.mobile_number || "", password: "" });
    setShowPassword(false);
    setError("");
    setFieldErrors({});
    setModal({ open: true, mode: "edit", user });
  };

  const closeModal = () => setModal({ open: false, mode: "create", user: null });

  const toggleRowPassword = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const schema = modal.mode === "create" ? createUserSchema : updateUserSchema;
    try {
      await schema.validate(form, { abortEarly: false });
    } catch (err) {
      if (err.inner) {
        const errs = {};
        err.inner.forEach((e) => { errs[e.path] = e.message; });
        setFieldErrors(errs);
      }
      return;
    }
    if (modal.mode === "create") {
      createMutation.mutate(form);
    } else {
      const { email, ...payload } = form;
      if (!payload.password) delete payload.password;
      updateMutation.mutate({ id: modal.user.id, ...payload });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Users</h2>
          <p className="text-slate-500">Manage your application users and their permissions.</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-amber-200 font-medium">
            <UserPlus size={20} />
            Add New User
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search users by name, email or mobile..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Password</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    {(canUpdate || canDelete) && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const picUrl = getProfilePicUrl(u.profile_pic);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center text-slate-400">
                              {picUrl ? (
                                <img src={picUrl} alt={u.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-slate-500">{u.full_name?.[0]?.toUpperCase() || <UserIcon size={20} />}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{u.full_name}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                            @{u.username}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.plain_password ? (
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg font-mono text-slate-700 select-all">
                                {visiblePasswords[u.id] ? u.plain_password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                              </code>
                              <button onClick={() => toggleRowPassword(u.id)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title={visiblePasswords[u.id] ? "Hide" : "Show"}>
                                {visiblePasswords[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not available</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Phone size={14} className="text-slate-400" />
                            {u.mobile_number || "\u2014"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${u.is_active ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-amber-500" : "bg-red-500"}`} />
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {(canUpdate || canDelete) && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canUpdate && (
                                <button onClick={() => toggleMutation.mutate(u.id)} className={`p-2 rounded-lg transition-all ${u.is_active ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"}`} title={u.is_active ? "Deactivate" : "Activate"}>
                                  {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                </button>
                              )}
                              {canUpdate && (
                                <button onClick={() => openEdit(u)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                                  <Edit2 size={18} />
                                </button>
                              )}
                              {canDelete && (
                                <button onClick={() => { setDeleteError(""); setDeleteConfirm({ open: true, user: u }); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete permanently">
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr><td colSpan={(canUpdate || canDelete) ? 6 : 5} className="px-6 py-12 text-center text-slate-500">No users found matching your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={pagination.total_pages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal.open} onClose={closeModal} title={modal.mode === "create" ? "Add New User" : "Edit User"}>
        {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} placeholder="e.g. John Doe" />
              {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: usernameOnly(e.target.value) })} maxLength={20} className={inputClass} placeholder="e.g. john_doe" />
              {fieldErrors.username && <p className="text-xs text-red-500 mt-1">{fieldErrors.username}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Email Address</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={modal.mode === "edit"} className={inputClass + (modal.mode === "edit" ? " bg-slate-50 text-slate-500 cursor-not-allowed" : "")} placeholder="john@example.com" />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mobile Number</label>
            <input type="text" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: digitsOnly(e.target.value) })} maxLength={13} className={inputClass} placeholder="9876543210" />
            {fieldErrors.mobile_number && <p className="text-xs text-red-500 mt-1">{fieldErrors.mobile_number}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <KeyRound size={14} />
                Password {modal.mode === "edit" && <span className="text-slate-400 font-normal">— leave blank to keep</span>}
              </span>
            </label>
            {modal.mode === "edit" && modal.user?.plain_password && (
              <div className="flex items-center gap-2 mb-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs text-amber-700 font-medium">Current:</span>
                <code className="text-xs font-mono text-amber-800 select-all">{modal.user.plain_password}</code>
              </div>
            )}
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass + " pr-10"} placeholder={modal.mode === "edit" ? "Enter new password to change" : "Min. 6 characters"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 disabled:opacity-50">
              {modal.mode === "create" ? "Create User" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirm.open} onClose={() => { setDeleteConfirm({ open: false, user: null }); setDeleteError(""); }} title="Delete User">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-4">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Are you sure?</h3>
          <p className="text-sm text-slate-500 mb-1">
            This will permanently delete <span className="font-semibold text-slate-700">{deleteConfirm.user?.full_name}</span>.
          </p>
          <ul className="text-xs text-slate-500 mb-4 space-y-1">
            <li>Sessions and password reset tokens will be removed</li>
            <li>Rescue data will be preserved (user references set to null)</li>
          </ul>
          <p className="text-xs text-red-600 font-semibold mb-5">This action cannot be undone.</p>

          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{deleteError}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setDeleteConfirm({ open: false, user: null }); setDeleteError(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteConfirm.user?.id)}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

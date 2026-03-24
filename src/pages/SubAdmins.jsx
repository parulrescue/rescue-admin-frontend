import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import { getSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin, toggleSubAdminStatus, getPermissions } from "../api/subAdmin";
import { useAuthStore } from "../store/authStore";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { ShieldCheck, Search, Edit2, Trash2, User as UserIcon, CheckCircle2, Circle, Eye, EyeOff, KeyRound, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";

const createSubAdminSchema = Yup.object({
  full_name: Yup.string().required("Full name is required").max(150),
  username: Yup.string().required("Username is required").matches(/^[a-z_]+$/, "Only lowercase letters & underscore allowed").min(4, "Minimum 4 characters").max(20, "Maximum 20 characters"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  mobile_number: Yup.string()
    .matches(/^\d*$/, "Only digits allowed")
    .min(10, "Minimum 10 digits")
    .max(13, "Maximum 13 digits"),
  password: Yup.string().required("Password is required").min(6, "Minimum 6 characters"),
});

const updateSubAdminSchema = Yup.object({
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

export default function SubAdmins() {
  const queryClient = useQueryClient();
  const { admin, hasPermission } = useAuthStore();
  const isAdmin = admin?.role === "admin";
  const canCreate = hasPermission("sub_admin_create");
  const canUpdate = hasPermission("sub_admin_update");
  const canDelete = hasPermission("sub_admin_delete");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [form, setForm] = useState({ full_name: "", email: "", username: "", mobile_number: "", password: "" });
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, subAdmin: null });
  const [deleteError, setDeleteError] = useState("");

  const toggleRowPassword = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const { data, isLoading } = useQuery({ queryKey: ["sub-admins", page, search], queryFn: () => getSubAdmins({ page, limit: 10, search: search || undefined }) });
  const { data: permsData } = useQuery({ queryKey: ["permissions"], queryFn: getPermissions });

  const subAdmins = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};
  const allPermissions = permsData?.data?.data || [];

  // Group permissions by module
  const permsByModule = allPermissions.reduce((acc, p) => {
    const mod = p.module || "General";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const createMut = useMutation({
    mutationFn: createSubAdmin,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-admins"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updateSubAdmin(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-admins"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });
  const toggleMut = useMutation({
    mutationFn: toggleSubAdminStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-admins"] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteSubAdmin,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-admins"] }); setDeleteConfirm({ open: false, subAdmin: null }); setDeleteError(""); },
    onError: (err) => setDeleteError(err.response?.data?.error?.message || "Failed to delete sub-admin"),
  });

  const digitsOnly = (v) => v.replace(/\D/g, "");
  const usernameOnly = (v) => v.replace(/[^a-z_]/g, "");

  const openCreate = () => {
    setForm({ full_name: "", email: "", username: "", mobile_number: "", password: "" });
    setSelectedPerms([]);
    setError("");
    setFieldErrors({});
    setModal({ open: true, mode: "create", item: null });
  };

  const openEdit = (item) => {
    setForm({ full_name: item.full_name, email: item.email, username: item.username, mobile_number: item.mobile_number || "", password: "" });
    setSelectedPerms((item.permissions || []).map((p) => p.id));
    setError("");
    setFieldErrors({});
    setModal({ open: true, mode: "edit", item });
  };

  const closeModal = () => setModal({ open: false, mode: "create", item: null });

  const togglePerm = (id) => {
    setSelectedPerms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const toggleModule = (modulePerms) => {
    const ids = modulePerms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPerms.includes(id));
    if (allSelected) {
      setSelectedPerms((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPerms((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const schema = modal.mode === "create" ? createSubAdminSchema : updateSubAdminSchema;
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
      const payload = { ...form };
      if (isAdmin) payload.permission_ids = selectedPerms;
      createMut.mutate(payload);
    } else {
      const { email, ...payload } = form;
      if (!payload.password) delete payload.password;
      if (isAdmin) payload.permission_ids = selectedPerms;
      updateMut.mutate({ id: modal.item.id, ...payload });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sub Admins</h2>
          <p className="text-slate-500">Manage sub-admins and their access permissions.</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-amber-200 font-medium">
            <ShieldCheck size={20} />
            Add Sub Admin
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search sub-admins..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm"
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
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Password</th>
                    <th className="px-6 py-4">Permissions</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    {(canUpdate || canDelete) && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subAdmins.map((sa) => (
                    <tr key={sa.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-50 overflow-hidden flex-shrink-0 border border-amber-100 flex items-center justify-center text-amber-600">
                            {sa.profile_pic ? (
                              <img src={sa.profile_pic} alt={sa.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold">{sa.full_name?.[0]?.toUpperCase() || <UserIcon size={20} />}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{sa.full_name}</div>
                            <div className="text-xs text-slate-500">@{sa.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {sa.plain_password ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg font-mono text-slate-700 select-all">
                              {visiblePasswords[sa.id] ? sa.plain_password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                            </code>
                            <button onClick={() => toggleRowPassword(sa.id)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title={visiblePasswords[sa.id] ? "Hide" : "Show"}>
                              {visiblePasswords[sa.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not available</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {(sa.permissions || []).slice(0, 3).map((p) => (
                            <span key={p.id} className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                              {p.key.replace(/_/g, " ")}
                            </span>
                          ))}
                          {(sa.permissions || []).length > 3 && (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                              +{sa.permissions.length - 3} more
                            </span>
                          )}
                          {(!sa.permissions || sa.permissions.length === 0) && (
                            <span className="text-xs text-slate-400">No permissions</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{sa.mobile_number || "—"}</div>
                        <div className="text-xs text-slate-400">{sa.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sa.is_active ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sa.is_active ? "bg-amber-500" : "bg-red-500"}`} />
                          {sa.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {(canUpdate || canDelete) && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canUpdate && (
                              <button onClick={() => toggleMut.mutate(sa.id)} className={`p-2 rounded-lg transition-all ${sa.is_active ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"}`} title={sa.is_active ? "Deactivate" : "Activate"}>
                                {sa.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                              </button>
                            )}
                            {canUpdate && (
                              <button onClick={() => openEdit(sa)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                                <Edit2 size={18} />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => { setDeleteError(""); setDeleteConfirm({ open: true, subAdmin: sa }); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete permanently">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {subAdmins.length === 0 && <tr><td colSpan={(canUpdate || canDelete) ? 6 : 5} className="px-6 py-12 text-center text-slate-500">No sub-admins found</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={pagination.total_pages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modal.open} onClose={closeModal} title={modal.mode === "create" ? "Add Sub Admin" : "Edit Sub Admin"} maxWidth="max-w-3xl">
        {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column — Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Basic Info</h4>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} placeholder="e.g. Umang Dhami" />
                {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: usernameOnly(e.target.value) })} maxLength={20} className={inputClass} placeholder="e.g. umang_admin" />
                {fieldErrors.username && <p className="text-xs text-red-500 mt-1">{fieldErrors.username}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={modal.mode === "edit"} className={inputClass + (modal.mode === "edit" ? " bg-slate-50 text-slate-500 cursor-not-allowed" : "")} placeholder="admin@example.com" />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Mobile</label>
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
                {modal.mode === "edit" && modal.item?.plain_password && (
                  <div className="flex items-center gap-2 mb-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-xs text-amber-700 font-medium">Current:</span>
                    <code className="text-xs font-mono text-amber-800 select-all">{modal.item.plain_password}</code>
                  </div>
                )}
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass + " pr-10"} placeholder={modal.mode === "edit" ? "Leave blank to keep current" : "••••••••"} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              </div>
            </div>

            {/* Right column — Permissions (only admin can edit) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Permissions</h4>
                <span className="text-xs text-slate-400">{selectedPerms.length} selected</span>
              </div>
              {!isAdmin ? (
                <div className="border border-slate-200 rounded-xl p-6 text-center">
                  <ShieldCheck size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Only Admin can manage permissions.</p>
                  {selectedPerms.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                      {allPermissions.filter((p) => selectedPerms.includes(p.id)).map((p) => (
                        <span key={p.id} className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          {p.key.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
                  {Object.entries(permsByModule).map(([mod, perms]) => {
                    const allSelected = perms.every((p) => selectedPerms.includes(p.id));
                    return (
                      <div key={mod} className="border-b border-slate-100 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => toggleModule(perms)}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-bold transition-colors ${allSelected ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                        >
                          {allSelected ? <CheckCircle2 size={16} className="text-amber-500" /> : <Circle size={16} className="text-slate-300" />}
                          <span className="capitalize">{mod.replace(/_/g, " ")}</span>
                        </button>
                        <div className="divide-y divide-slate-50">
                          {perms.map((p) => {
                            const checked = selectedPerms.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => togglePerm(p.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 pl-8 text-left text-sm transition-colors ${checked ? "bg-amber-50/50 text-amber-700" : "text-slate-600 hover:bg-slate-50"}`}
                              >
                                {checked ? <CheckCircle2 size={16} className="text-amber-500 flex-shrink-0" /> : <Circle size={16} className="text-slate-300 flex-shrink-0" />}
                                <div>
                                  <span className="font-medium">{p.key.replace(/_/g, " ")}</span>
                                  {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {allPermissions.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">No permissions available</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 disabled:opacity-50">
              {modal.mode === "create" ? "Create Sub Admin" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirm.open} onClose={() => { setDeleteConfirm({ open: false, subAdmin: null }); setDeleteError(""); }} title="" maxWidth="max-w-md">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Sub Admin</h3>
          <p className="text-sm text-slate-500 mb-1">
            Are you sure you want to permanently delete <span className="font-semibold text-slate-700">"{deleteConfirm.subAdmin?.full_name}"</span>?
          </p>
          <p className="text-xs text-slate-400 mb-1">This will also remove:</p>
          <ul className="text-xs text-slate-500 mb-5 space-y-0.5">
            <li>All assigned permissions</li>
            <li>Active sessions</li>
          </ul>
          <p className="text-xs text-red-500 font-medium mb-5">This action cannot be undone.</p>
          {deleteError && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{deleteError}</div>}
          <div className="flex gap-3">
            <button onClick={() => { setDeleteConfirm({ open: false, subAdmin: null }); setDeleteError(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button onClick={() => deleteMut.mutate(deleteConfirm.subAdmin?.id)} disabled={deleteMut.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50">
              {deleteMut.isPending ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

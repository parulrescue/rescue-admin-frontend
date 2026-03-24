import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoles, createRole, updateRole, deleteRole, getPermissions } from "../api/role";
import Modal from "../components/Modal";
import { Plus, Edit2, Trash2, CheckCircle2, Circle } from "lucide-react";

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm";

export default function Roles() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState({ open: false, mode: "create", role: null });
  const [form, setForm] = useState({ name: "", description: "", permission_ids: [] });
  const [error, setError] = useState("");

  const { data: rolesData, isLoading } = useQuery({ queryKey: ["roles"], queryFn: getRoles });
  const { data: permsData } = useQuery({ queryKey: ["permissions"], queryFn: getPermissions });

  const roles = rolesData?.data?.data || [];
  const permissions = permsData?.data?.data || [];

  const permsByModule = permissions.reduce((acc, p) => {
    const mod = p.module || "other";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const createMut = useMutation({ mutationFn: createRole, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); closeModal(); }, onError: (err) => setError(err.response?.data?.error?.message || "Failed") });
  const updateMut = useMutation({ mutationFn: ({ id, ...d }) => updateRole(id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); closeModal(); }, onError: (err) => setError(err.response?.data?.error?.message || "Failed") });
  const deleteMut = useMutation({ mutationFn: deleteRole, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }) });

  const openCreate = () => { setForm({ name: "", description: "", permission_ids: [] }); setError(""); setModal({ open: true, mode: "create", role: null }); };
  const openEdit = (role) => { setForm({ name: role.name, description: role.description || "", permission_ids: (role.Permissions || role.permissions || []).map((p) => p.id) }); setError(""); setModal({ open: true, mode: "edit", role }); };
  const closeModal = () => setModal({ open: false, mode: "create", role: null });

  const togglePermission = (id) => setForm((prev) => ({ ...prev, permission_ids: prev.permission_ids.includes(id) ? prev.permission_ids.filter((x) => x !== id) : [...prev.permission_ids, id] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (modal.mode === "create") createMut.mutate(form);
    else updateMut.mutate({ id: modal.role.id, ...form });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Roles & Permissions</h2>
          <p className="text-slate-500">Configure access control for sub-admins.</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-amber-200 font-medium">
          <Plus size={20} />
          Add Role
        </button>
      </div>

      {isLoading ? <div className="p-12 text-center text-slate-400">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {roles.length === 0 ? <div className="col-span-full p-12 text-center text-slate-400">No roles found</div> :
            roles.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{r.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{r.description || "No description"}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${r.name}"?`)) deleteMut.mutate(r.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(r.Permissions || r.permissions || []).slice(0, 4).map((p) => (
                    <span key={p.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                      {p.key}
                    </span>
                  ))}
                  {(r.Permissions || r.permissions || []).length > 4 && (
                    <span className="text-[11px] text-slate-400 px-2 py-0.5">+{(r.Permissions || r.permissions || []).length - 4} more</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">{r.sub_admin_count ?? 0} sub-admin(s) assigned</div>
              </div>
            ))
          }
        </div>
      )}

      <Modal open={modal.open} onClose={closeModal} title={modal.mode === "create" ? "Create Role" : "Edit Role"}>
        {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Role Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-900 block mb-3">Access Permissions</label>
            <div className="border border-slate-200 rounded-xl max-h-60 overflow-auto p-4 space-y-4 bg-slate-50/50">
              {Object.entries(permsByModule).map(([mod, perms]) => (
                <div key={mod}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{mod}</p>
                  <div className="space-y-1">
                    {perms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePermission(p.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                          form.permission_ids.includes(p.id)
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "border-slate-100 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm font-medium">{p.key}</span>
                        {form.permission_ids.includes(p.id) ? (
                          <CheckCircle2 size={18} className="text-amber-600" />
                        ) : (
                          <Circle size={18} className="text-slate-200" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 disabled:opacity-50">
              {modal.mode === "create" ? "Create Role" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

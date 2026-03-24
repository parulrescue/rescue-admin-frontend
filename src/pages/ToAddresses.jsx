import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import { getToAddresses, createToAddress, updateToAddress, toggleToAddressStatus, deleteToAddress } from "../api/toAddress";
import { useAuthStore } from "../store/authStore";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { MapPin, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Plus, AlertTriangle } from "lucide-react";

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm";

const toAddressSchema = Yup.object({
  title: Yup.string().required("Title is required").max(200),
  address: Yup.string().required("Address is required"),
  pincode: Yup.string().matches(/^\d*$/, "Only digits allowed").max(6, "Maximum 6 digits"),
  area: Yup.string().max(200),
});

export default function ToAddresses() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission("rescue_create");
  const canUpdate = hasPermission("rescue_update");
  const canDelete = hasPermission("rescue_delete");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [form, setForm] = useState({ title: "", address: "", pincode: "", area: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [deleteError, setDeleteError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["to-addresses", page, search],
    queryFn: () => getToAddresses({ page, limit: 10, search: search || undefined }),
  });

  const addresses = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const createMut = useMutation({
    mutationFn: createToAddress,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["to-addresses"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updateToAddress(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["to-addresses"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });

  const toggleMut = useMutation({
    mutationFn: toggleToAddressStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["to-addresses"] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteToAddress,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["to-addresses"] }); setDeleteConfirm({ open: false, item: null }); setDeleteError(""); },
    onError: (err) => setDeleteError(err.response?.data?.error?.message || "Failed to delete"),
  });

  const digitsOnly = (v) => v.replace(/\D/g, "");

  const openCreate = () => {
    setForm({ title: "", address: "", pincode: "", area: "" });
    setError("");
    setFieldErrors({});
    setModal({ open: true, mode: "create", item: null });
  };

  const openEdit = (item) => {
    setForm({ title: item.title, address: item.address, pincode: item.pincode || "", area: item.area || "" });
    setError("");
    setFieldErrors({});
    setModal({ open: true, mode: "edit", item });
  };

  const closeModal = () => setModal({ open: false, mode: "create", item: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    try {
      await toAddressSchema.validate(form, { abortEarly: false });
    } catch (err) {
      if (err.inner) {
        const errs = {};
        err.inner.forEach((e) => { errs[e.path] = e.message; });
        setFieldErrors(errs);
      }
      return;
    }
    if (modal.mode === "create") {
      createMut.mutate(form);
    } else {
      updateMut.mutate({ id: modal.item.id, ...form });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">To Addresses</h2>
          <p className="text-slate-500">Manage destination addresses for rescues.</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-amber-200 font-medium">
            <Plus size={20} />
            Add Address
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search addresses..."
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
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Pincode</th>
                    <th className="px-6 py-4">Area</th>
                    <th className="px-6 py-4">Status</th>
                    {(canUpdate || canDelete) && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {addresses.map((addr) => (
                    <tr key={addr.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-amber-500 flex-shrink-0" />
                          <span className="font-semibold text-slate-900">{addr.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-[250px] truncate">{addr.address}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{addr.pincode || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{addr.area || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${addr.is_active ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${addr.is_active ? "bg-amber-500" : "bg-red-500"}`} />
                          {addr.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {(canUpdate || canDelete) && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canUpdate && (
                              <button onClick={() => toggleMut.mutate(addr.id)} className={`p-2 rounded-lg transition-all ${addr.is_active ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"}`} title={addr.is_active ? "Deactivate" : "Activate"}>
                                {addr.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                              </button>
                            )}
                            {canUpdate && (
                              <button onClick={() => openEdit(addr)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                                <Edit2 size={18} />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => { setDeleteError(""); setDeleteConfirm({ open: true, item: addr }); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {addresses.length === 0 && <tr><td colSpan={(canUpdate || canDelete) ? 6 : 5} className="px-6 py-12 text-center text-slate-500">No addresses found</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={pagination.total_pages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal.open} onClose={closeModal} title={modal.mode === "create" ? "Add To Address" : "Edit To Address"}>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="e.g. City Animal Hospital" />
            {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Full Address *</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} className={inputClass} placeholder="Full address..." />
            {fieldErrors.address && <p className="text-xs text-red-500 mt-1">{fieldErrors.address}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Pincode</label>
              <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: digitsOnly(e.target.value) })} maxLength={6} className={inputClass} placeholder="e.g. 380001" />
              {fieldErrors.pincode && <p className="text-xs text-red-500 mt-1">{fieldErrors.pincode}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Area</label>
              <input type="text" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputClass} placeholder="e.g. Navrangpura" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 disabled:opacity-50">
              {modal.mode === "create" ? "Create" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirm.open} onClose={() => { setDeleteConfirm({ open: false, item: null }); setDeleteError(""); }} title="" maxWidth="max-w-md">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Address</h3>
          <p className="text-sm text-slate-500 mb-5">
            Are you sure you want to delete <span className="font-semibold text-slate-700">"{deleteConfirm.item?.title}"</span>?
          </p>
          {deleteError && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{deleteError}</div>}
          <div className="flex gap-3">
            <button onClick={() => { setDeleteConfirm({ open: false, item: null }); setDeleteError(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={() => deleteMut.mutate(deleteConfirm.item?.id)} disabled={deleteMut.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50">
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

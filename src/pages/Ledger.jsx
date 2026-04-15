import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLedgerEntries, getLedgerSummary, createLedgerEntry, updateLedgerEntry, deleteLedgerEntry } from "../api/ledger";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Plus, Search, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, Edit2, ImagePlus, X, Image as ImageIcon } from "lucide-react";

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all text-sm";
const selectClass = "w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm bg-white appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_12px_center] bg-no-repeat";

export default function Ledger() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", entry: null });
  const [form, setForm] = useState({ type: "credit", amount: "", category: "", description: "", reference_id: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [viewPhoto, setViewPhoto] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ledger", page, typeFilter, search],
    queryFn: () => getLedgerEntries({ page, limit: 10, type: typeFilter || undefined, search: search || undefined }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ["ledger-summary"],
    queryFn: getLedgerSummary,
  });

  const entries = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};
  const summary = summaryData?.data?.data || {};

  const createMut = useMutation({
    mutationFn: createLedgerEntry,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ledger"] }); queryClient.invalidateQueries({ queryKey: ["ledger-summary"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updateLedgerEntry(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ledger"] }); queryClient.invalidateQueries({ queryKey: ["ledger-summary"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteLedgerEntry,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ledger"] }); queryClient.invalidateQueries({ queryKey: ["ledger-summary"] }); },
  });

  const resetPhoto = () => { setPhotoFile(null); setPhotoPreview(""); setRemovePhoto(false); };

  const openCreate = () => {
    setForm({ type: "credit", amount: "", category: "", description: "", reference_id: "" });
    resetPhoto();
    setError("");
    setModal({ open: true, mode: "create", entry: null });
  };
  const openEdit = (entry) => {
    setForm({ type: entry.type, amount: String(entry.amount), category: entry.category || "", description: entry.description || "", reference_id: entry.reference_id || "" });
    setPhotoFile(null);
    setPhotoPreview(entry.photo_url || "");
    setRemovePhoto(false);
    setError("");
    setModal({ open: true, mode: "edit", entry });
  };
  const closeModal = () => { setModal({ open: false, mode: "create", entry: null }); resetPhoto(); };

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const onPhotoRemove = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    if (modal.mode === "edit" && modal.entry?.photo_url) setRemovePhoto(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const payload = { ...form };
    if (!payload.reference_id) delete payload.reference_id;
    if (photoFile) payload.photo = photoFile;
    if (modal.mode === "edit" && removePhoto && !photoFile) payload.remove_photo = "true";
    if (modal.mode === "create") createMut.mutate(payload);
    else updateMut.mutate({ id: modal.entry.id, ...payload });
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Ledger</h2>
          <p className="text-slate-500">Track and manage administrative financial records.</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm font-medium">
          <Plus size={20} />
          Add Entry
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-amber-500 text-white">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Credit</span>
          </div>
          <div className="text-slate-500 text-sm font-medium">Total Credit</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">₹{Number(summary.total_credit || 0).toLocaleString()}</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-rose-500 text-white">
              <TrendingDown size={24} />
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Debit</span>
          </div>
          <div className="text-slate-500 text-sm font-medium">Total Debit</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">₹{Number(summary.total_debit || 0).toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-lg shadow-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-white/10 text-white">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="text-slate-400 text-sm font-medium">Net Balance</div>
          <div className="text-3xl font-bold text-white mt-1">₹{Number(summary.net_balance || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search entries..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-sm" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className={selectClass + " flex-1 sm:flex-none sm:w-40"}>
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
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
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Photo</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(e.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-medium">{e.description || "—"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                          {e.category || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-tight ${e.type === "credit" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {e.photo_url ? (
                          <button onClick={() => setViewPhoto(e.photo_url)} className="group/photo relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 hover:border-amber-500 transition-all" title="View photo">
                            <img src={e.photo_url} alt="receipt" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/40 flex items-center justify-center transition-all">
                              <ImageIcon size={16} className="text-white opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-bold ${e.type === "credit" ? "text-amber-600" : "text-red-600"}`}>
                          {e.type === "credit" ? "+" : "-"}₹{Number(e.amount).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(e)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => { if (confirm("Delete this entry?")) deleteMut.mutate(e.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No entries found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={pagination.total_pages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modal.open} onClose={closeModal} title={modal.mode === "create" ? "Add Ledger Entry" : "Edit Ledger Entry"}>
        {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={selectClass}>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Amount (₹)</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className={inputClass} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="e.g. Monthly Donation" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Category</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} placeholder="e.g. Donation" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Reference ID</label>
              <input type="text" value={form.reference_id} onChange={(e) => setForm({ ...form, reference_id: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Photo <span className="text-slate-400 font-normal">(optional)</span></label>
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
                <button type="button" onClick={onPhotoRemove} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-all">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full px-4 py-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 cursor-pointer transition-all text-sm text-slate-500">
                <ImagePlus size={20} />
                <span>Click to upload (JPG, PNG, WEBP — max 5MB)</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhotoChange} className="hidden" />
              </label>
            )}
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50">
              {modal.mode === "create" ? "Add Entry" : "Update"}
            </button>
          </div>
        </form>
      </Modal>

      {viewPhoto && (
        <div onClick={() => setViewPhoto("")} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out">
          <button onClick={() => setViewPhoto("")} className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all">
            <X size={20} />
          </button>
          <img src={viewPhoto} alt="Receipt" onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full rounded-xl shadow-2xl cursor-default" />
        </div>
      )}
    </div>
  );
}

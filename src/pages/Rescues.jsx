import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import { getRescues, getRescue, updateRescueStatus, updateRescueFull, deleteRescue } from "../api/rescue";
import { getAnimals } from "../api/animal";
import { getUsers } from "../api/user";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Search, Eye, Edit2, Trash2, Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock, Loader2, CheckCircle2, XCircle, Upload, X, AlertTriangle, Play, Video } from "lucide-react";


function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return url;
}

const statusConfig = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", icon: Clock },
  in_progress: { label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", icon: Loader2 },
  completed: { label: "Completed", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", icon: XCircle },
};

const statuses = ["pending", "in_progress", "completed", "cancelled"];
const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm";
const selectClass = "w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm bg-white appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_12px_center] bg-no-repeat";

const rescueEditSchema = Yup.object({
  info_provider_number: Yup.string()
    .matches(/^\d*$/, "Only digits allowed")
    .test("min-digits", "Minimum 10 digits", (v) => !v || v.length >= 10)
    .max(13, "Maximum 13 digits"),
  from_pincode: Yup.string().matches(/^\d*$/, "Only digits allowed").max(6, "Maximum 6 digits"),
  to_pincode: Yup.string().matches(/^\d*$/, "Only digits allowed").max(6, "Maximum 6 digits"),
});

function StatusFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const dropRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) && dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [open]);

  const current = value ? statusConfig[value] : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium cursor-pointer transition-all hover:shadow-sm w-full sm:w-48 justify-between ${current ? `${current.bg} ${current.text} ${current.border}` : "bg-white border-slate-200 text-slate-600"}`}
      >
        <span className="flex items-center gap-2">
          {current && <span className={`w-2 h-2 rounded-full ${current.dot}`} />}
          {current ? current.label : "All Statuses"}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          className="fixed z-[9999] w-48 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden py-1"
          style={{ top: pos.top, left: pos.left }}
        >
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${!value ? "bg-slate-50 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
          >
            All Statuses
            {!value && <CheckCircle2 size={13} className="ml-auto text-amber-500" />}
          </button>
          {statuses.map((s) => {
            const cfg = statusConfig[s];
            const Icon = cfg.icon;
            const isActive = s === value;
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${isActive ? `${cfg.bg} ${cfg.text} font-semibold` : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon size={15} className={isActive ? cfg.text : "text-slate-400"} />
                {cfg.label}
                {isActive && <CheckCircle2 size={13} className="ml-auto" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

function StatusDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const dropRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const current = statusConfig[value] || statusConfig.pending;

  useEffect(() => {
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) && dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [open]);

  if (disabled) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border ${current.bg} ${current.text} ${current.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        {current.label}
      </span>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border cursor-pointer transition-all hover:shadow-sm ${current.bg} ${current.text} ${current.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        {current.label}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          className="fixed z-[9999] w-44 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden"
          style={{ top: pos.top, left: pos.left }}
        >
          {statuses.map((s) => {
            const cfg = statusConfig[s];
            const Icon = cfg.icon;
            const isActive = s === value;
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${isActive ? `${cfg.bg} ${cfg.text} font-semibold` : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon size={15} className={isActive ? cfg.text : "text-slate-400"} />
                {cfg.label}
                {isActive && <CheckCircle2 size={13} className="ml-auto" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

/* ── Person Search for edit modal ─────────────────────── */
function PersonSearch({ selectedPersons, setSelectedPersons }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length < 1) { setResults([]); setOpen(false); return; }
    try {
      const res = await getUsers({ page: 1, limit: 10, search: q });
      const data = (res.data?.data || []).filter((u) => !selectedPersons.find((s) => s.id === u.id));
      setResults(data);
      setOpen(data.length > 0);
    } catch { setResults([]); setOpen(false); }
  };

  return (
    <div>
      <div ref={ref} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)} placeholder="Search users..." className={inputClass + " pl-9"} />
        {open && results.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-auto">
            {results.map((u) => (
              <li key={u.id} onClick={() => { setSelectedPersons((prev) => [...prev, { id: u.id, full_name: u.full_name }]); setQuery(""); setResults([]); setOpen(false); }} className="px-3.5 py-2.5 hover:bg-amber-50 cursor-pointer text-sm flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs text-amber-700 font-medium">{u.full_name?.[0]}</div>
                <span className="font-medium">{u.full_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedPersons.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedPersons.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {p.full_name || `User #${p.id}`}
              <button type="button" onClick={() => setSelectedPersons((prev) => prev.filter((x) => x.id !== p.id))} className="text-amber-400 hover:text-red-500 ml-0.5">&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Rescues() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission("rescue_update");
  const canDelete = hasPermission("rescue_delete");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Edit modal state
  const [editModal, setEditModal] = useState({ open: false, rescue: null });
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");
  const [existingMedia, setExistingMedia] = useState([]);
  const [deleteMediaIds, setDeleteMediaIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [editPersons, setEditPersons] = useState([]);

  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [mediaPreview, setMediaPreview] = useState({ open: false, items: [], index: 0 });

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, rescue: null });
  const [deleteError, setDeleteError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["rescues", page, statusFilter, search],
    queryFn: () => getRescues({ page, limit: 10, status: statusFilter || undefined, search: search || undefined }),
  });

  const { data: animalsData } = useQuery({ queryKey: ["animals"], queryFn: () => getAnimals({ page: 1, limit: 100 }) });
  const animals = (animalsData?.data?.data || []).filter((a) => a.is_active !== false);

  const rescues = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => updateRescueStatus(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rescues"] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteRescue,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rescues"] }); setDeleteConfirm({ open: false, rescue: null }); setDeleteError(""); },
    onError: (err) => setDeleteError(err.response?.data?.error?.message || "Failed to delete"),
  });

  const editMut = useMutation({
    mutationFn: ({ id, formData }) => updateRescueFull(id, formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rescues"] }); setEditModal({ open: false, rescue: null }); },
    onError: (err) => setEditError(err.response?.data?.error?.message || "Failed to update rescue"),
  });

  const digitsOnly = (v) => v.replace(/\D/g, "");

  const openEdit = async (r) => {
    setEditError("");
    setEditFieldErrors({});
    setDeleteMediaIds([]);
    setNewFiles([]);
    try {
      const res = await getRescue(r.id);
      const rescue = res.data?.data;
      if (!rescue) return;
      setEditForm({
        animal_type: rescue.animal_type || "",
        animal_description: rescue.animal_description || "",
        info_provider_name: rescue.info_provider_name || "",
        info_provider_number: rescue.info_provider_number || "",
        from_address: rescue.from_address || "",
        from_pincode: rescue.from_pincode || "",
        from_area: rescue.from_area || "",
        to_address: rescue.to_address || "",
        to_pincode: rescue.to_pincode || "",
        to_area: rescue.to_area || "",
        status: rescue.status || "pending",
      });
      const imgs = Array.isArray(rescue.images) ? rescue.images : rescue.images?.id ? [rescue.images] : [];
      setExistingMedia(imgs);
      const persons = Array.isArray(rescue.rescue_persons) ? rescue.rescue_persons : rescue.rescue_persons?.id ? [rescue.rescue_persons] : [];
      setEditPersons(persons.map((p) => ({ id: p.user_id, full_name: p.user?.full_name || p.full_name || `User #${p.user_id}` })));
      setEditModal({ open: true, rescue });
    } catch { }
  };

  const handleNewFiles = (fileList) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
    const files = Array.from(fileList).filter((f) => {
      if (!allowed.includes(f.type)) return false;
      if (f.type.startsWith("video/") && f.size > 100 * 1024 * 1024) return false;
      if (f.type.startsWith("image/") && f.size > 5 * 1024 * 1024) return false;
      return true;
    });
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditFieldErrors({});
    try {
      await rescueEditSchema.validate(editForm, { abortEarly: false });
    } catch (err) {
      if (err.inner) {
        const errs = {};
        err.inner.forEach((e) => { errs[e.path] = e.message; });
        setEditFieldErrors(errs);
      }
      return;
    }
    const fd = new FormData();
    Object.entries(editForm).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
    if (deleteMediaIds.length > 0) fd.append("delete_media_ids", JSON.stringify(deleteMediaIds));
    fd.append("rescue_person_ids", JSON.stringify(editPersons.map((p) => p.id)));
    newFiles.forEach((f) => fd.append("files", f));
    editMut.mutate({ id: editModal.rescue.id, formData: fd });
  };

  const toggleDeleteMedia = (id) => {
    setDeleteMediaIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Rescues</h2>
        <p className="text-slate-500">Monitor and manage rescue operations.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search rescues..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white text-sm"
            />
          </div>
          <StatusFilter value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Animal</th>
                    <th className="px-6 py-4">From</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rescues.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">#{r.id}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{r.animal_type}</td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[200px] text-sm">{r.from_address}</td>
                      <td className="px-6 py-4">
                        <StatusDropdown
                          value={r.status}
                          onChange={(status) => statusMut.mutate({ id: r.id, status })}
                          disabled={!canUpdate}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/rescues/${r.id}`} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="View">
                            <Eye size={18} />
                          </Link>
                          {canUpdate && (
                            <button onClick={() => openEdit(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                              <Edit2 size={18} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => { setDeleteError(""); setDeleteConfirm({ open: true, rescue: r }); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rescues.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No rescues found</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={pagination.total_pages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, rescue: null })} title={`Edit Rescue #${editModal.rescue?.id || ""}`} maxWidth="max-w-4xl">
        {editError && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{editError}</div>}
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Animal Type</label>
              <select value={editForm.animal_type || ""} onChange={(e) => setEditForm({ ...editForm, animal_type: e.target.value })} className={selectClass}>
                <option value="">Select...</option>
                {animals.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                {editForm.animal_type && !animals.find((a) => a.name === editForm.animal_type) && (
                  <option value={editForm.animal_type}>{editForm.animal_type}</option>
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select value={editForm.status || "pending"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={selectClass}>
                {statuses.map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea value={editForm.animal_description || ""} onChange={(e) => setEditForm({ ...editForm, animal_description: e.target.value })} rows={2} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Info Provider Name</label>
              <input value={editForm.info_provider_name || ""} onChange={(e) => setEditForm({ ...editForm, info_provider_name: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Info Provider Number</label>
              <input value={editForm.info_provider_number || ""} onChange={(e) => setEditForm({ ...editForm, info_provider_number: digitsOnly(e.target.value) })} maxLength={13} className={inputClass} />
              {editFieldErrors.info_provider_number && <p className="text-xs text-red-500 mt-1">{editFieldErrors.info_provider_number}</p>}
            </div>
          </div>

          <fieldset className="border border-slate-200 rounded-2xl p-4">
            <legend className="text-sm font-semibold text-slate-700 px-2">From Address</legend>
            <div className="space-y-3">
              <textarea value={editForm.from_address || ""} onChange={(e) => setEditForm({ ...editForm, from_address: e.target.value })} rows={2} placeholder="Full address" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input value={editForm.from_pincode || ""} onChange={(e) => setEditForm({ ...editForm, from_pincode: digitsOnly(e.target.value) })} placeholder="Pincode" maxLength={6} className={inputClass} />
                  {editFieldErrors.from_pincode && <p className="text-xs text-red-500 mt-1">{editFieldErrors.from_pincode}</p>}
                </div>
                <input value={editForm.from_area || ""} onChange={(e) => setEditForm({ ...editForm, from_area: e.target.value })} placeholder="Area" className={inputClass} />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-slate-200 rounded-2xl p-4">
            <legend className="text-sm font-semibold text-slate-700 px-2">To Address</legend>
            <div className="space-y-3">
              <textarea value={editForm.to_address || ""} onChange={(e) => setEditForm({ ...editForm, to_address: e.target.value })} rows={2} placeholder="Full address" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input value={editForm.to_pincode || ""} onChange={(e) => setEditForm({ ...editForm, to_pincode: digitsOnly(e.target.value) })} placeholder="Pincode" maxLength={6} className={inputClass} />
                  {editFieldErrors.to_pincode && <p className="text-xs text-red-500 mt-1">{editFieldErrors.to_pincode}</p>}
                </div>
                <input value={editForm.to_area || ""} onChange={(e) => setEditForm({ ...editForm, to_area: e.target.value })} placeholder="Area" className={inputClass} />
              </div>
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Rescue Persons</label>
            <PersonSearch selectedPersons={editPersons} setSelectedPersons={setEditPersons} />
          </div>

          {existingMedia.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Current Media <span className="text-slate-400 font-normal text-xs">— click image to preview, use X to mark for removal</span></label>
              <div className="flex flex-wrap gap-3">
                {existingMedia.map((m, idx) => {
                  const isMarked = deleteMediaIds.includes(m.id);
                  const url = resolveMediaUrl(m.image_url);
                  const isVideo = m.media_type === "video";
                  return (
                    <div key={m.id} className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${isMarked ? "border-red-400 opacity-40" : "border-slate-200 hover:border-slate-300"}`}>
                      <div className="w-full h-full cursor-pointer" onClick={() => setMediaPreview({ open: true, items: existingMedia, index: idx })}>
                        {isVideo ? (
                          <div className="w-full h-full bg-black flex items-center justify-center">
                            <Play size={24} className="text-white/70" />
                          </div>
                        ) : (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleDeleteMedia(m.id); }}
                        className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isMarked ? "bg-red-500 text-white" : "bg-black/50 text-white/80 hover:bg-red-500 hover:text-white"}`}
                      >
                        <X size={10} />
                      </button>
                      {isMarked && (
                        <div className="absolute inset-0 bg-red-500/20 pointer-events-none flex items-center justify-center">
                          <X size={20} className="text-red-600" />
                        </div>
                      )}
                      {isVideo && <div className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 rounded pointer-events-none flex items-center gap-0.5"><Video size={8} /> Video</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Upload New Images/Videos</label>
            <div
              onDrop={(e) => { e.preventDefault(); handleNewFiles(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-amber-400 transition-colors"
              onClick={() => document.getElementById("edit-file-input").click()}
            >
              <Upload size={20} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Drag & drop or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">Images (5MB) & Videos (100MB)</p>
              <input id="edit-file-input" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" onChange={(e) => handleNewFiles(e.target.files)} className="hidden" />
            </div>
            {newFiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {newFiles.map((f, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                    {f.type.startsWith("video/") ? (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <Play size={16} className="text-white/70" />
                        <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 rounded">Video</span>
                      </div>
                    ) : (
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    )}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setNewFiles((prev) => prev.filter((_, j) => j !== i)); }} className="absolute top-0.5 right-0.5 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditModal({ open: false, rescue: null })} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={editMut.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 disabled:opacity-50">
              {editMut.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirm.open} onClose={() => { setDeleteConfirm({ open: false, rescue: null }); setDeleteError(""); }} title="" maxWidth="max-w-md">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Rescue</h3>
          <p className="text-sm text-slate-500 mb-1">
            Are you sure you want to permanently delete <span className="font-semibold text-slate-700">Rescue #{deleteConfirm.rescue?.id}</span>?
          </p>
          <p className="text-xs text-slate-400 mb-1">This will also remove:</p>
          <ul className="text-xs text-slate-500 mb-5 space-y-0.5">
            <li>All uploaded images & videos</li>
            <li>Rescue person assignments</li>
          </ul>
          <p className="text-xs text-red-500 font-medium mb-5">This action cannot be undone.</p>
          {deleteError && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{deleteError}</div>}
          <div className="flex gap-3">
            <button onClick={() => { setDeleteConfirm({ open: false, rescue: null }); setDeleteError(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={() => deleteMut.mutate(deleteConfirm.rescue?.id)} disabled={deleteMut.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50">
              {deleteMut.isPending ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Media Preview Viewer — portaled to body to escape Modal stacking context */}
      {mediaPreview.open && (() => {
        const item = mediaPreview.items[mediaPreview.index];
        if (!item) return null;
        const previewUrl = resolveMediaUrl(item.image_url);
        const isVid = item.media_type === "video";
        return createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center" style={{ marginTop: "0px" }} onClick={() => setMediaPreview({ open: false, items: [], index: 0 })}>
            <div className="relative max-w-5xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setMediaPreview({ open: false, items: [], index: 0 })} className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors z-10">
                <X size={24} />
              </button>

              <div className="flex items-center justify-center min-h-[300px]">
                {mediaPreview.index > 0 && (
                  <button onClick={() => setMediaPreview((p) => ({ ...p, index: p.index - 1 }))} className="absolute left-2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all">
                    <ChevronLeft size={24} />
                  </button>
                )}

                {isVid ? (
                  <video key={previewUrl} src={previewUrl} controls autoPlay className="max-w-full max-h-[80vh] rounded-xl" />
                ) : (
                  <img src={previewUrl} alt="" className="max-w-full max-h-[80vh] rounded-xl object-contain" />
                )}

                {mediaPreview.index < mediaPreview.items.length - 1 && (
                  <button onClick={() => setMediaPreview((p) => ({ ...p, index: p.index + 1 }))} className="absolute right-2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all">
                    <ChevronRight size={24} />
                  </button>
                )}
              </div>

              <div className="text-center mt-3 text-white/60 text-sm">
                {mediaPreview.index + 1} / {mediaPreview.items.length} {isVid ? "Video" : "Image"}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}

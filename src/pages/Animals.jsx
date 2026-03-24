import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAnimals, createAnimal, updateAnimal, deleteAnimal } from "../api/animal";
import { useAuthStore } from "../store/authStore";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Plus, Search, Edit2, Trash2, PawPrint, ToggleLeft, ToggleRight } from "lucide-react";

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm";

export default function Animals() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission("animal_create");
  const canUpdate = hasPermission("animal_update");
  const canDelete = hasPermission("animal_delete");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", animal: null });
  const [form, setForm] = useState({ name: "" });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["animals", page, search],
    queryFn: () => getAnimals({ page, limit: 10, search: search || undefined }),
  });

  const animals = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const createMut = useMutation({
    mutationFn: createAnimal,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["animals"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateAnimal(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["animals"] }); closeModal(); },
    onError: (err) => setError(err.response?.data?.error?.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAnimal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["animals"] }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => updateAnimal(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["animals"] }),
  });

  const openCreate = () => {
    setForm({ name: "" });
    setError("");
    setModal({ open: true, mode: "create", animal: null });
  };

  const openEdit = (animal) => {
    setForm({ name: animal.name });
    setError("");
    setModal({ open: true, mode: "edit", animal });
  };

  const closeModal = () => setModal({ open: false, mode: "create", animal: null });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (modal.mode === "create") {
      createMut.mutate({ name: form.name });
    } else {
      updateMut.mutate({ id: modal.animal.id, data: { name: form.name } });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Animals</h2>
        {canCreate && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200"
          >
            <Plus size={18} /> Add Animal
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search animals..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : animals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <PawPrint size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No animals found</p>
          </div>
        ) : (
          <>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                {(canUpdate || canDelete) && (
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {animals.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                        <PawPrint size={16} />
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {canUpdate ? (
                      <button
                        onClick={() => toggleMut.mutate({ id: a.id, is_active: !a.is_active })}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          a.is_active
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {a.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {a.is_active ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${a.is_active ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  {(canUpdate || canDelete) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => openEdit(a)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { if (confirm("Delete this animal?")) deleteMut.mutate(a.id); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={pagination.total_pages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Modal */}
      <Modal open={modal.open} onClose={closeModal} title={modal.mode === "create" ? "Add Animal" : "Edit Animal"}>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Animal Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              required
              className={inputClass}
              placeholder="e.g. Dog, Cat, Cow..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-all shadow-lg shadow-amber-200"
            >
              {isPending ? "Saving..." : modal.mode === "create" ? "Create" : "Update"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

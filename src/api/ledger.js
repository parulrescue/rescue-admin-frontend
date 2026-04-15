import api from "./axios";

export const getLedgerEntries = (params) => api.get("/ledger", { params });
export const getLedgerSummary = () => api.get("/ledger/summary");

const toFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    fd.append(k, v);
  });
  return fd;
};

export const createLedgerEntry = (data) => api.post("/ledger", toFormData(data), { headers: { "Content-Type": "multipart/form-data" } });
export const updateLedgerEntry = (id, data) => api.put(`/ledger/${id}`, toFormData(data), { headers: { "Content-Type": "multipart/form-data" } });
export const deleteLedgerEntry = (id) => api.delete(`/ledger/${id}`);

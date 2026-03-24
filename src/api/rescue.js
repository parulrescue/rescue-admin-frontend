import api from "./axios";

export const getRescues = (params) => api.get("/rescues", { params });
export const getRescue = (id) => api.get(`/rescues/${id}`);
export const updateRescueStatus = (id, data) => api.put(`/rescues/${id}/status`, data);
export const updateRescueFull = (id, formData) =>
  api.post(`/rescues/${id}/edit`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteRescue = (id) => api.delete(`/rescues/${id}`);

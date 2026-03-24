import api from "./axios";

export const getSubAdmins = (params) => api.get("/sub-admins", { params });
export const getSubAdmin = (id) => api.get(`/sub-admins/${id}`);
export const createSubAdmin = (data) => api.post("/sub-admins", data);
export const updateSubAdmin = (id, data) => api.put(`/sub-admins/${id}`, data);
export const toggleSubAdminStatus = (id) => api.patch(`/sub-admins/${id}/status`);
export const deleteSubAdmin = (id) => api.delete(`/sub-admins/${id}`);
export const getPermissions = () => api.get("/sub-admins/permissions");

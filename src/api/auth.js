import api from "./axios";

export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const getSessions = () => api.get("/auth/sessions");
export const revokeSession = (id) => api.delete(`/auth/sessions/${id}`);
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);
export const changePassword = (data) => api.post("/auth/change-password", data);

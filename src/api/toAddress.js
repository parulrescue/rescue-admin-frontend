import api from "./axios";

export const getToAddresses = (params) => api.get("/to-addresses", { params });
export const getToAddress = (id) => api.get(`/to-addresses/${id}`);
export const createToAddress = (data) => api.post("/to-addresses", data);
export const updateToAddress = (id, data) => api.put(`/to-addresses/${id}`, data);
export const toggleToAddressStatus = (id) => api.patch(`/to-addresses/${id}/status`);
export const deleteToAddress = (id) => api.delete(`/to-addresses/${id}`);

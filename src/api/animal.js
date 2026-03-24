import api from "./axios";

export const getAnimals = (params) => api.get("/animals", { params });
export const createAnimal = (data) => api.post("/animals", data);
export const updateAnimal = (id, data) => api.put(`/animals/${id}`, data);
export const deleteAnimal = (id) => api.delete(`/animals/${id}`);

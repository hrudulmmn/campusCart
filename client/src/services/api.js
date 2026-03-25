import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("campusCartToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If token expires, clear auth and reload
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("campusCartToken");
      localStorage.removeItem("campusCartUser");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;
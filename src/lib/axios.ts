import axios from "axios";
import config from "../config/config";

const axiosInstance = axios.create({
  baseURL: config.baseURL,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every outgoing request
axiosInstance.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auto-logout on 401 & 403 response status codes
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.replace("/login"); // Change "/login" if your login route is different
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
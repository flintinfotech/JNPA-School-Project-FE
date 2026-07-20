import axios from "axios";
import config from "../config/config";

const axiosInstance = axios.create({
  baseURL: config.baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
axiosInstance.interceptors.request.use(
  (request) => {
    const token = localStorage.getItem("token");

    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }

    return request;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");

      window.location.replace("/login");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

export const API_BASE_URL = "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// NOTE: hook di sini hanya untuk referensi; tidak dipakai langsung di file ini.
export function useAuthedApi() {
  const { token } = useAuth();
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return instance;
}


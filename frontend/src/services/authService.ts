import { api } from "./apiClient";
import type { User } from "../contexts/AuthContext";

type LoginResponse = {
  token: string;
  user: User;
};

export async function login(username: string, password: string) {
  const res = await api.post<LoginResponse>("/login", { username, password });
  return res.data;
}


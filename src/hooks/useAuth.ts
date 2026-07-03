import { useState } from "react";
import { loginUser } from "../services/authService";

interface AuthUser {
  username: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    return {
      isAuthenticated: !!token,
      user: token && username ? { username } : null,
    };
  });

  // Returns null on success, or an error message on failure
  const login = async (
    username: string,
    password: string
  ): Promise<string | null> => {
    try {
      const response = await loginUser({ username, password });

      if (response.success && response.data) {
        localStorage.setItem("token", response.data);
        localStorage.setItem("username", username);
        setAuth({ isAuthenticated: true, user: { username } });
        return null;
      }

      return response.message || "Login failed.";
    } catch (error: any) {
      return (
        error?.response?.data?.message || "Invalid username or password."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setAuth({ isAuthenticated: false, user: null });
  };

  return { ...auth, login, logout };
}
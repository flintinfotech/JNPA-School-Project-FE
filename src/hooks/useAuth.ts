import { useState } from "react";
import { loginUser } from "../services/authService";

interface AuthUser {
  username: string;
  role?: string;
  userId?: number;
  section?: string | null;
  medium?: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    return {
      isAuthenticated: !!token,
      user: token && storedUser ? JSON.parse(storedUser) : null,
    };
  });

  // Returns null on success, or an error message on failure
  const login = async (
    username: string,
    password: string
  ): Promise<string | null> => {
    try {
      const response = await loginUser({ username, password });

      if (response.success && response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "username",
          response.data.userDTO?.userName || username
        );

        localStorage.setItem(
          "user",
          JSON.stringify(response.data.userDTO)
        );

        setAuth({
          isAuthenticated: true,
          user: {
            username: response.data.userDTO?.userName || username,
            role: response.data.userDTO?.role,
            userId: response.data.userDTO?.userId,
            section: response.data.userDTO?.section,
            medium: response.data.userDTO?.medium,
          },
        });

        return null;
      }

      return response.message || "Login failed.";
    } catch (error: any) {
      return (
        error?.response?.data?.message ||
        "Invalid username or password."
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
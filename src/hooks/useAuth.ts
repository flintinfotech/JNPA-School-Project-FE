import { useState } from "react";
import { loginUser } from "../services/authService";

interface AuthUser {
  username: string;
  role?: string;
  userId?: number;
  studentId?: number;
  section?: string | null;
  medium?: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

interface AcademicYear {
  startDate: string;
  endDate: string;
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

  // Login
  const login = async (
    username: string,
    password: string,
    academicYear: AcademicYear,
    isParent: boolean = false
  ): Promise<string | null> => {
    try {
      const response = await loginUser({
        username: username,
        password,
        academicWorkYearDTO: academicYear,
      });

      if (response.success && response.data?.token) {
        // Save Token
        localStorage.setItem("token", response.data.token);

        // Save Username
        localStorage.setItem(
          "username",
          response.data.userDTO?.userName || username
        );

        // Save User Details
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.userDTO)
        ); if (isParent) {
          localStorage.setItem("isParent", "true");
          localStorage.setItem(
            "screens",
            JSON.stringify([{ screenName: "Student Profile" }])
          );
        } else {
          localStorage.setItem("isParent", "false");
          localStorage.setItem(
            "screens",
            JSON.stringify(response.data.userDTO.screens || [])
          );
        }

        // Optional: Save Academic Year
        localStorage.setItem(
          "academicYear",
          JSON.stringify(academicYear)
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

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
    localStorage.removeItem("academicYear");
    localStorage.removeItem("screens");
    localStorage.removeItem("isParent");   // 👈 add this

    setAuth({
      isAuthenticated: false,
      user: null,
    });
  };

  return {
    ...auth,
    login,
    logout,
  };
}
import { useState } from "react";
import { loginUser } from "../services/authService";

interface AuthUser {
  userId?: number;
  userName: string;
  role?: string;
  studentId?: number;
  standard?: string | null;
  section?: string | null;
  medium?: string | null;
  division?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  academicYear: AcademicYear | null;
}

interface AcademicYear {
  startDate: string;
  endDate: string;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedAcademicYear = localStorage.getItem("academicYear");

    return {
      isAuthenticated: !!token,
      user: token && storedUser ? JSON.parse(storedUser) : null,
      academicYear: storedAcademicYear ? JSON.parse(storedAcademicYear) : null,
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
        );

        if (isParent) {
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
          user: response.data.userDTO,
          academicYear,
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
    // NOTE: intentionally NOT removing "isParent" here. It's not sensitive
    // data, and keeping it lets route guards (see AdminLayout) know to send
    // a logged-out parent back to /parent-login instead of /login. login()
    // always overwrites it correctly on the next sign-in regardless of role.

    setAuth({
      isAuthenticated: false,
      user: null,
      academicYear: null,
    });
  };

  return {
    ...auth,
    login,
    logout,
  };
}
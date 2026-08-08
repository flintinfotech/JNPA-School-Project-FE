import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";
import { HiEye, HiEyeOff, HiUser } from "react-icons/hi";

interface LoginPageProps {
  onLogin: (
    username: string,
    password: string,
    academicYear: {
      startDate: string;
      endDate: string;
    }
  ) => Promise<string | null>;
}

interface AcademicYear {
  startDate: string;
  endDate: string;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<AcademicYear | null>(null);

  const loadAcademicYears = async () => {
    try {
      const response = await axiosInstance.get(
        apiEndpoints.getLastFiveAcademicYears()
      );

      setAcademicYears(response.data);

      const loadAcademicYears = async () => {
        try {
          const response = await axiosInstance.get(
            "/jnpa-school-project/auth/getLastFiveAcademicYears"
          );

          setAcademicYears(response.data);
        } catch (error) {
          console.error("Failed to load Academic Years", error);
        }
      };
    } catch (error) {
      console.error("Failed to load Academic Years", error);
    }
  };

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    if (!selectedAcademicYear) {
      setError("Please select Academic Year.");
      setLoading(false);
      return;
    }

    const errorMessage = await onLogin(
      username,
      password,
      selectedAcademicYear
    );

    if (errorMessage) {
      setError(errorMessage);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-slate-800">
            Welcome back
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Username
              </label>

              <div className="relative">
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />

                <HiUser
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <HiEyeOff size={18} />
                  ) : (
                    <HiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Academic Year */}
            <div>
              <label
                htmlFor="academicYear"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Academic Year
              </label>

              <select
                id="academicYear"
                required
                value={
                  selectedAcademicYear
                    ? `${selectedAcademicYear.startDate}-${selectedAcademicYear.endDate}`
                    : ""
                }
                onChange={(e) => {
                  const year = academicYears.find(
                    (item) =>
                      `${item.startDate}-${item.endDate}` === e.target.value
                  );

                  setSelectedAcademicYear(year || null);
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              >
                <option value="">Select Academic Year</option>

                {academicYears.map((year, index) => (
                  <option
                    key={index}
                    value={`${year.startDate}-${year.endDate}`}
                  >
                    {year.startDate} - {year.endDate}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          {/* Footer */}
          {/* 
          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?
          </p>
          */}

        </div>

      </div>
    </div>
  );
}
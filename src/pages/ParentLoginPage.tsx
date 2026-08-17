import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";
import { HiUser } from "react-icons/hi";

interface ParentLoginPageProps {
  onLogin: (
    mobileNo: string,
    aadhaarCard: string,
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

// Fixed academic year (dropdown removed, not editable)
const FIXED_ACADEMIC_YEAR: AcademicYear = {
  startDate: "2026",
  endDate: "2027",
};

// Formats raw digits as 9999-9999-9999 for display
const formatAadhaar = (digits: string) => {
  return digits.replace(/(\d{4})(?=\d)/g, "$1-");
};

export default function ParentLoginPage({
  onLogin,
}: ParentLoginPageProps) {
  const [mobileNo, setMobileNo] = useState("");
  const [aadhaarNo, setAadhaarNo] = useState(""); // stores raw 12 digits only

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedAcademicYear] = useState<AcademicYear>(FIXED_ACADEMIC_YEAR);

  // Login
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");

    // Mobile validation
    if (mobileNo.length !== 10) {
      setError("Mobile number must be 10 digits.");
      return;
    }

    // Aadhaar validation
    if (aadhaarNo.length !== 12) {
      setError("Aadhaar number must be 12 digits.");
      return;
    }

    setLoading(true);

    const errorMessage = await onLogin(
      mobileNo,
      aadhaarNo,
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
            Parent Login
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Sign in to your parent account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Mobile Number */}
            <div>
              <label
                htmlFor="mobileNo"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Mobile No
              </label>

              <div className="relative">
                <input
                  id="mobileNo"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  maxLength={10}
                  value={mobileNo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setMobileNo(value);
                  }}
                  placeholder="Enter 10 digit mobile number"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />

                <HiUser
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
            {/* Aadhaar Number */}
            <div>
              <label
                htmlFor="aadhaarNo"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Aadhaar No (9999-9999-9999)
              </label>

              <input
                id="aadhaarNo"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                required
                maxLength={14} // 12 digits + 2 dashes
                value={formatAadhaar(aadhaarNo)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                  setAadhaarNo(digits);
                }}
                placeholder="Enter 12 digit Aadhaar number"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            {/* Academic Year (fixed, not editable) */}
            <div>
              <label
                htmlFor="academicYear"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Academic Year
              </label>

              <input
                id="academicYear"
                type="text"
                readOnly
                disabled
                value={`${selectedAcademicYear.startDate} - ${selectedAcademicYear.endDate}`}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm outline-none bg-slate-100 cursor-not-allowed"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

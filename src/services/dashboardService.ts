import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface StandardGenderCount {
  boys: number;
  girls: number;
}

export interface StudentDashboardData {
  Total: StandardGenderCount;
  [standard: string]: StandardGenderCount;
}

// Only TEACHER is guaranteed now; PARENT/ACCOUNTANT may or may not
// be present depending on backend rollout, so keep them optional.
export interface UsersDashboardData {
  TEACHER: number;
  PARENT?: number;
  ACCOUNTANT?: number;
}
// New: inquiry status breakdown
export interface InquiryDashboardData {
  Total: number;
  NEW: number;
  APPROVED: number;
  REJECTED: number;
}

export const getAllStudentsCount = () => {
  return axiosInstance.get<ApiResponse<StudentDashboardData>>(
    apiEndpoints.getAllStudentsCount()
  );
};

export const getAllUsersCount = () => {
  return axiosInstance.get<ApiResponse<UsersDashboardData>>(
    apiEndpoints.getAllUsersCount()
  );
};

export const getAllAdmissionInquiryCount = () => {
  return axiosInstance.get<ApiResponse<InquiryDashboardData>>(
    apiEndpoints.getAllAdmissionInquiryCount()
  );
};

// ── Expenses ────────────────────────────────────────────────────────────
export interface ExpensesCountData {
  "Total Count": number;
}

export interface PaidExpensesTotalData {
  "Total Paid Expenses": number;
}

export interface ExpensesTotalData {
  "Total Expenses": number;
}

export interface ExpensesCountBreakdownData {
  totalExpensesCount: number;
  totalPaidExpensesCount: number;
}

// GET /jnpa-school-project/dashboard/getAllExpensesCount
// -> { "Total Count": number } — used for the "Total Count Expenses" stat
// card (shows the NUMBER of expense records, not a rupee amount).
export const getAllExpensesCount = () => {
  return axiosInstance.get<ApiResponse<ExpensesCountData>>(
    apiEndpoints.getAllExpensesCount()
  );
};

// GET /jnpa-school-project/dashboard/getAllPaidExpensesTotal
// -> { "Total Paid Expenses": number } — the "paid" side of the
// Paid/Total expense amount card.
export const getAllPaidExpensesTotal = () => {
  return axiosInstance.get<ApiResponse<PaidExpensesTotalData>>(
    apiEndpoints.getAllPaidExpensesTotal()
  );
};

// GET /jnpa-school-project/dashboard/getAllExpensesTotal
// -> { "Total Expenses": number } — the "total" side of the Paid/Total
// expense amount card.
export const getAllExpensesTotal = () => {
  return axiosInstance.get<ApiResponse<ExpensesTotalData>>(
    apiEndpoints.getAllExpensesTotal()
  );
};

// GET /jnpa-school-project/dashboard/getAllTotalPaidExpensesCountAndTotalExpensesCount
// -> { totalExpensesCount, totalPaidExpensesCount } — combined counts
// endpoint, kept available in case the count card should later show a
// "paid vs total" breakdown instead of a single number.
export const getAllTotalPaidExpensesCountAndTotalExpensesCount = () => {
  return axiosInstance.get<ApiResponse<ExpensesCountBreakdownData>>(
    apiEndpoints.getAllTotalPaidExpensesCountAndTotalExpensesCount()
  );
};
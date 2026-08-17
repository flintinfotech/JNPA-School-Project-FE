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
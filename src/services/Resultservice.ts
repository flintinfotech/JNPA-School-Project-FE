import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface ResultStudentDTO {
  studentId: number;
  studentCode?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  DOB?: string;
  address?: string;
  bloodGroup?: string;
  category?: string;
  status?: string;
  medium?: string;
  academicInformation?: {
    standard?: string;
    section?: string;
    rollNo?: string;
    academicYear?: string;
    medium?: string;
  }[];
  [key: string]: any;
}

export interface ResultFilters {
  rollNo?: string;
  firstName?: string;
  lastName?: string;
  standard?: string;
  division?: string;
  medium?: string;
}

export interface GetAllStudentsResponse {
  success: boolean;
  message?: string;
  data: {
    Data: ResultStudentDTO[];
    Total: number;
  };
}

/**
 * Fetch students filtered by roll no / first name / last name, optionally
 * scoped to a class (standard / section / medium) — used to restrict a
 * teacher's Results screen to only their assigned class.
 * The filter object is sent as the POST body, page & size as query params
 * (matching how getAllStudentsByFilter is called elsewhere in the app).
 */
export const getStudentsByClassFilter = async (
  page: number,
  size: number,
  filters: ResultFilters
): Promise<GetAllStudentsResponse> => {
  const payload = {
    rollNo: filters.rollNo || undefined,
    firstName: filters.firstName || undefined,
    lastName: filters.lastName || undefined,
    standard: filters.standard || undefined,
    division: filters.division || undefined,
    medium: filters.medium || undefined,
  };

  const response = await axiosInstance.post(
    apiEndpoints.getAllStudents(page, size),
    payload
  );

  return response.data;
};
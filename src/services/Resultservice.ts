import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface AcademicInformationDTO {
  academicInformationId: number;
  academicYear: string;
  admissionDate: string;
  admissionNo: number;
  division: string;
  medium: string;
  rollNo: string;
  standard: string;
  studentId: number;
}

export interface ResultStudentDTO {
  studentId: number;
  studentCode: string;
  firstName: string;
  lastName: string;
  gender: string;
  status: string;
  academicInformation?: AcademicInformationDTO[];
}

// Payload the API expects — only these 3 fields
export interface ResultFilters {
  standard?: string;
  division?: string;
  medium?: string;
}

export interface CurrentYearStudentsResponse {
  success: boolean;
  message: string;
  data: {
    data: ResultStudentDTO[];
    totalPages: number;
    pageSize: number;
    currentPage: number;
    totalElements: number;
  };
  timestamp: string;
}

export const getAllCurrentYearStudentsData = async (
  page: number,
  size: number,
  filters: ResultFilters
): Promise<CurrentYearStudentsResponse> => {
  const response = await axiosInstance.post<CurrentYearStudentsResponse>(
    apiEndpoints.getAllCurrentYearStudentsData(page, size),
    filters
  );
  return response.data;
};
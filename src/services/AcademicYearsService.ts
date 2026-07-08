import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints"; // adjust path to match your project structure

// ---- Types matching the backend DTO exactly ----

export interface AuditDetails {
  createTime: string;
  createUser: string;
  modifyTime: string;
  modifyUser: string;
}

// One "Add Data" entry inside a sub-screen: a subject/label plus an
// optional file (stored as raw base64, same convention as ClassRoomDTO.brochure).
export interface SubScreenDataEntityDTO {
  subScreenDataId?: number; // present only for existing entries (update)
  subScreenId?: number; // present only for existing entries (update)
  subjectName: string;
  subjectData?: string | null; // raw base64 payload, no data: prefix
}

// One "Achievements" sub-screen (e.g. "Intra group"), containing multiple
// subScreenDataEntities.
export interface SubScreenDTO {
  subScreenId?: number; // present only for existing sub-screens (update)
  academicYearId?: number; // present only for existing sub-screens (update)
  subScreenName: string;
  subScreenDataEntities: SubScreenDataEntityDTO[];
}

export interface AcademicYearDTO {
  academicYearId?: number;
  academicYearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  cbseAffiliated: string;
  avgPassingPercentage: string;
  subjectOffered: string;
  studentTeacherRatio: string;
  subScreenDTOS?: SubScreenDTO[];
  auditDetails?: AuditDetails;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ---- Service functions ----

export const saveAcademicYear = (
  payload: Omit<AcademicYearDTO, "academicYearId" | "auditDetails">
) => {
  return axiosInstance.post<ApiResponse<AcademicYearDTO>>(apiEndpoints.saveAcademicYear(), payload);
};

export const updateAcademicYear = (payload: AcademicYearDTO) => {
  return axiosInstance.put<ApiResponse<AcademicYearDTO>>(apiEndpoints.updateAcademicYear(), payload);
};

export const getAcademicYearById = (academicYearId: number | string) => {
  return axiosInstance.get<ApiResponse<AcademicYearDTO>>(
    apiEndpoints.getAcademicYearById(academicYearId)
  );
};
export const getAllAcademicYears = (page: number, size: number) => {
  return axiosInstance.post<ApiResponse<AcademicYearDTO[]>>(
    apiEndpoints.getAllAcademicYears(page, size),
    {}
  );
};
// // adjust path to match your project structure
// import axiosInstance from "../lib/axios";
// import { apiEndpoints } from "./apiEndpoints"; // adjust path to match your project structure
// import type { AcademicYearDTO } from "./AcademicYearsService"; // adjust path to match your project structure

// // ---- Types matching the backend DTOs exactly ----

// export interface SubjectDTO {
//   subjectId?: number;
//   classRoomId?: number;
//   subjectName: string;
//   subjectDescription: string;
// }

// export interface AuditDetails {
//   createTime: string;
//   createUser: string;
//   modifyTime: string;
//   modifyUser: string;
// }

// // An AcademicYearDTO nested inside a classroom also carries the owning
// // classRoomId once it's a persisted record (see getById/getAll responses).
// // New academic-year entries added client-side won't have this yet.
// export type ClassRoomAcademicYearDTO = AcademicYearDTO & { classRoomId?: number };

// export interface ClassRoomDTO {
//   classRoomId?: number;
//   classRoomName: string;
//   academicYearName: string;
//   description: string;
//   medium: "English" | "Marathi";
//   subjectDTOList: SubjectDTO[];
//   brochure: string | null; // raw base64 string, or null — nothing else
//   academicYearDTOS?: ClassRoomAcademicYearDTO[];
//   auditDetails?: AuditDetails;
// }

// export interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
//   timestamp: string;
// }

// export interface PaginatedClassRooms {
//   content: ClassRoomDTO[];
//   totalElements: number;
//   totalPages: number;
//   page: number;
//   size: number;
// }

// // Body sent to getAllClassRoomsByFilter. Empty object = no filters, return all.
// export interface ClassRoomFilter {
//   classRoomName?: string;
//   academicYearName?: string;
//   medium?: "English" | "Marathi";
// }

// // ---- Service functions ----

// export const saveClassRoom = (payload: Omit<ClassRoomDTO, "classRoomId" | "auditDetails">) => {
//   return axiosInstance.post<ApiResponse<ClassRoomDTO>>(apiEndpoints.saveClassRoom(), payload);
// };

// export const updateClassRoom = (payload: ClassRoomDTO) => {
//   return axiosInstance.put<ApiResponse<ClassRoomDTO>>(apiEndpoints.updateClassRoom(), payload);
// };

// export const getClassRoomById = (classRoomId: number | string) => {
//   return axiosInstance.get<ApiResponse<ClassRoomDTO>>(apiEndpoints.getClassRoomById(classRoomId));
// };

// export const deleteClassRoom = (classRoomId: number | string) => {
//   return axiosInstance.delete<ApiResponse<null>>(apiEndpoints.deleteClassRoom(classRoomId));
// };

// // Backend expects POST with a filter body (even if empty {}), not GET.
// export const getAllClassRooms = (page: number, size: number, filter: ClassRoomFilter = {}) => {
//   return axiosInstance.post<ApiResponse<PaginatedClassRooms>>(
//     apiEndpoints.getAllClassRooms(page, size),
//     filter
//   );
// };

import axiosInstance from "../lib/axios"; // adjust path to match your project structure
import { apiEndpoints } from "./apiEndpoints"; // adjust path to match your project structure

// ---- Types matching the backend DTOs exactly ----

export interface SubjectDTO {
  subjectId?: number;
  classRoomId?: number;
  subjectName: string;
  subjectDescription: string;
}

export interface AuditDetails {
  createTime: string;
  createUser: string;
  modifyTime: string;
  modifyUser: string;
}

export interface SubScreenDataEntity {
  subScreenDataId: number;
  subScreenId: number;
  subjectData: string; // base64
  subjectName: string;
}

export interface SubScreenDTO {
  academicYearId: number;
  subScreenId: number;
  subScreenName: string;
  subScreenDataEntities: SubScreenDataEntity[];
}

export interface AcademicYearDTO {
  academicYearId: number;
  academicYearName: string;
  classRoomId?: number;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  cbseAffiliated?: string;
  avgPassingPercentage?: string;
  subjectOffered?: string;
  studentTeacherRatio?: string;
  subScreenDTOS?: SubScreenDTO[];
  auditDetails?: AuditDetails;
}

export interface ClassRoomDTO {
  classRoomId?: number;
  classRoomName: string;
  academicYearName: string;
  description: string;
  medium: "English" | "Marathi";
  subjectDTOList: SubjectDTO[];
  brochure: string | null; // raw base64 string, or null
  academicYearDTOS?: AcademicYearDTO[];
  auditDetails?: AuditDetails;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedClassRooms {
  Total?: number;
  Data?: ClassRoomDTO[];
  content?: ClassRoomDTO[];
  totalElements?: number;
  totalPages?: number;
  page?: number;
  size?: number;
}

export interface ClassRoomFilter {
  classRoomName?: string;
  academicYearName?: string;
  medium?: "English" | "Marathi";
}

// ---- Service functions ----

export const saveClassRoom = (payload: Omit<ClassRoomDTO, "classRoomId" | "auditDetails">) => {
  return axiosInstance.post<ApiResponse<ClassRoomDTO>>(apiEndpoints.saveClassRoom(), payload);
};

export const updateClassRoom = (payload: ClassRoomDTO) => {
  return axiosInstance.put<ApiResponse<ClassRoomDTO>>(apiEndpoints.updateClassRoom(), payload);
};

export const getClassRoomById = (classRoomId: number | string) => {
  return axiosInstance.get<ApiResponse<ClassRoomDTO>>(apiEndpoints.getClassRoomById(classRoomId));
};

export const deleteClassRoom = (classRoomId: number | string) => {
  return axiosInstance.delete<ApiResponse<null>>(apiEndpoints.deleteClassRoom(classRoomId));
};

export const getAllClassRooms = (
  page: number,
  size: number,
  filter: ClassRoomFilter = {}
) => {
  return axiosInstance.post<ApiResponse<PaginatedClassRooms>>(
    apiEndpoints.getAllClassRooms(page, size),
    filter
  );
};
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

// ================================
// Teacher DTO
// ================================
export interface TeacherDTO {
  userInformationId: number;
  userId: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  designation: string;
  experience: number;
  qualification: string;
  specialization: string;
  gender: string;
  joiningDate: string;
}

// ================================
// Get All Teachers
// User Information API
// ================================
export const getAllTeachers = async (page: number, size: number) => {
  return await axiosInstance.post(apiEndpoints.getAllUserInformation(page, size), {
    role: "Teacher",
  });
};

// ================================
// Search Class API
// ================================
export interface ClassSearchDTO {
  classMasterId: number;
  displayName: string;
}

export const searchClass = async (keyword: string) => {
  return await axiosInstance.get(apiEndpoints.searchClass(keyword));
};

// ================================
// Subject DTO
// ================================
export interface SubjectDTO {
  subjectMasterId: number;
  subjectCode: string;
  subjectName: string;
}

// ================================
// Assign Subject Payload
// ================================
export interface AssignTeacherSubjectDTO {
  userInformationId: number;
  classMasterId: number;
  subjectIds: number[];
}

// ================================
// Assign Teacher Subject API
// ================================
export const assignTeacherSubjects = async (payload: AssignTeacherSubjectDTO) => {
  return await axiosInstance.post(apiEndpoints.assignTeacherSubjects(), payload);
};
export const getSubjectsByUserInformationId = async (
  userInformationId: number
) => {
  return await axiosInstance.get(
    apiEndpoints.getSubjectsByUserInformationId(userInformationId)
  );
};
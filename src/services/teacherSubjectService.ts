import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

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

export interface TeacherSearchFilters {
  firstName?: string;
  lastName?: string;
  section?: string;
  medium?: string;
}

export const getAllTeachers = async (
  page: number,
  size: number,
  filters?: TeacherSearchFilters
) => {
  return await axiosInstance.post(apiEndpoints.getAllUserInformation(page, size), {
    role: "Teacher",
    firstName: filters?.firstName || undefined,
    lastName: filters?.lastName || undefined,
    section: filters?.section || undefined,
    medium: filters?.medium || undefined,
  });
};

export interface ClassSearchDTO {
  classMasterId: number;
  displayName: string;
}

export const searchClass = async (keyword: string) => {
  return await axiosInstance.get(apiEndpoints.searchClass(keyword));
};

export interface SubjectDTO {
  subjectMasterId: number;
  subjectCode: string;
  subjectName: string;
}

export interface AssignTeacherSubjectDTO {
  userInformationId: number;
  classMasterId: number;
  subjectIds: number[];
}

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
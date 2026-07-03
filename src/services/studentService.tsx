// ⚠️ adjust to match the import used in userService.ts
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints"; // ⚠️ adjust path if different

export interface ParentDTO {
  parentId?: number;
  studentId?: number;
  name: string;
  relation: string;
  occupation?: string;
  phone: string;
  email?: string;
  address?: string;
  annualIncome?: number;
}

export interface StudentDocumentDTO {
  studentDocumentId?: number;
  studentId?: number;
  documentName: string;
  uploadDate: string;
  document: string | null; // base64
}

export interface AcademicInformationDTO {
  academicInformationId?: number;
  studentId?: number;
  admissionNo: number;
  admissionDate: string;
  standard: string;
  section: string;
  rollNo: string;
  academicYear: string;
  bloodGroup: string;
  caste: string;
  category: string;
  dob: string;
}

export interface StudentDTO {
  studentId?: number;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  address: string;
  bloodGroup?: string;
  category?: string;
  religion?: string;
  caste?: string;
  nationality?: string;
  status: string;
  parentEntities: ParentDTO[];
  studentDocuments: StudentDocumentDTO[];
  academicInformation: AcademicInformationDTO[];
}

export interface StudentFilter {
  standard?: string;
  section?: string;
  admissionNo?: number;
  relation?: string;
  occupation?: string;
}

export const saveStudent = async (payload: StudentDTO) => {
  const { data } = await axiosInstance.post(apiEndpoints.saveStudent(), payload);
  return data;
};

export const updateStudent = async (payload: StudentDTO) => {
  const { data } = await axiosInstance.put(apiEndpoints.updateStudent(), payload);
  return data;
};

export const getStudentById = async (studentId: number | string) => {
  const { data } = await axiosInstance.get(apiEndpoints.getStudentById(studentId));
  return data;
};

export const deleteStudent = async (studentId: number | string) => {
  const { data } = await axiosInstance.delete(apiEndpoints.deleteStudent(studentId));
  return data;
};

export const getAllStudents = async (
  page: number,
  size: number,
  filters: StudentFilter = {}
) => {
  const { data } = await axiosInstance.post(
    apiEndpoints.getAllStudents(page, size),
    filters
  );
  return data;
};
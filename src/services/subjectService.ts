import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";


export interface SubjectDTO {
  subjectMasterId: number;
  subjectCode: string;
  subjectName: string;
}


export interface SaveSubjectRequestDTO {
  subjectCode: string;
  subjectName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface GetAllSubjectData {
  subjectMasterDTOS: SubjectDTO[];
  "total element": number;
}

export const saveSubject = async (
  payload: SaveSubjectRequestDTO
): Promise<ApiResponse<SubjectDTO>> => {
  const response = await axiosInstance.post<ApiResponse<SubjectDTO>>(
    apiEndpoints.saveSubject(),
    payload
  );

  return response.data;
};

export const getAllSubjects = async (
  page: number,
  size: number
): Promise<ApiResponse<GetAllSubjectData>> => {
  const response = await axiosInstance.post<ApiResponse<GetAllSubjectData>>(
    apiEndpoints.getAllSubjects(page, size),
    {}
  );

  return response.data;
};
export interface UpdateSubjectRequestDTO {
  subjectMasterId: number;
  subjectCode: string;
  subjectName: string;
}
export const updateSubject = async (
  payload: UpdateSubjectRequestDTO
): Promise<ApiResponse<SubjectDTO>> => {
  const response = await axiosInstance.put<ApiResponse<SubjectDTO>>(
    apiEndpoints.updateSubject(),
    payload
  );

  return response.data;
};
export const getSubjectById = async (
  id: number
): Promise<ApiResponse<SubjectDTO>> => {
  const response = await axiosInstance.get<ApiResponse<SubjectDTO>>(
    apiEndpoints.getSubjectById(id)
  );

  return response.data;

};

export const deleteSubject = async (
  subjectMasterId: number
): Promise<ApiResponse<null>> => {

  const response = await axiosInstance.delete<ApiResponse<null>>(
    apiEndpoints.deleteSubject(subjectMasterId)
  );

  return response.data;
};
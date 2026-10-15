import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";
import { fetchAllPages, readTotal } from "../utils/fetchAllPages";

export interface SubjectDTO {
  subjectMasterId: number;
  subjectCode: string;
  subjectName: string;
  section?: string;
  medium?: string;
}


export interface SaveSubjectRequestDTO {
  subjectCode: string;
  subjectName: string;
  section?: string;
  medium?: string;
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

// export const getAllSubjects = async (
//   page: number,
//   size: number,
//   filters:{section?: string;medium?:string}={}
// ): Promise<ApiResponse<GetAllSubjectData>> => {
//   const response = await axiosInstance.post<ApiResponse<GetAllSubjectData>>(
//     apiEndpoints.getAllSubjects(page, size),
//     filters
//   );

//   return response.data;
// };

export const getAllSubjectsAllPages = async (
  filters: { section?: string; medium?: string } = {}
): Promise<ApiResponse<GetAllSubjectData>> => {
  const holder: { first?: ApiResponse<GetAllSubjectData> } = {};
  const all = await fetchAllPages<SubjectDTO>(async (page, size) => {
    const res = await getAllSubjects(page, size, filters);
    if (page === 0) holder.first = res;
    if (!res?.success) return { list: [], total: 0 };
    return { list: res.data?.subjectMasterDTOS || [], total: readTotal(res.data) };
  });
  const first = holder.first as ApiResponse<GetAllSubjectData>;
  if (!first?.success) return first;
  return { ...first, data: { ...first.data, subjectMasterDTOS: all, "total element": all.length } };
};

export interface UpdateSubjectRequestDTO {
  subjectMasterId: number;
  subjectCode: string;
  subjectName: string;
  section?: string;
  medium?: string;
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
// NEW
export interface SubjectSearchFilters {
  medium?: string | null;
  section?: string | null;
}

export const getAllSubjects = async (
  page: number,
  size: number,
  filters: SubjectSearchFilters = {} // NEW
): Promise<ApiResponse<GetAllSubjectData>> => {
  const response = await axiosInstance.post<ApiResponse<GetAllSubjectData>>(
    apiEndpoints.getAllSubjects(page, size),
    {
      medium: filters.medium || undefined,   // NEW
      section: filters.section || undefined, // NEW
    }
  );

  return response.data;
};
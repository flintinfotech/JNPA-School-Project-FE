import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";


export interface SubjectDTO {
    subjectMasterId:number;
    subjectCode:string;
    subjectName:string;
}


export interface ApiResponse<T>{
    success:boolean;
    message:string;
    data:T;
    timestamp:string;
}

export const getSubjectsByClassId = async(
    id:number
):Promise<ApiResponse<SubjectDTO[]>>=>{

    const response =
    await axiosInstance.get<ApiResponse<SubjectDTO[]>>(
        apiEndpoints.getSubjectsByClassId(id)
    );
    return response.data;

}

export interface AssignSubjectRequest {
  classMasterId: number;
  subjectMasterIds: number[];
}

export const assignOrUnassignSubjects = async (
  payload: AssignSubjectRequest
): Promise<ApiResponse<string>> => {
  const response = await axiosInstance.post<ApiResponse<string>>(
    apiEndpoints.assignOrUnassignSubjects(),
    payload
  );

  return response.data;
};
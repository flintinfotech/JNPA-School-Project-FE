import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";


export interface AcademicYearDTO {
  startDate: string;
  endDate: string;
}


export interface LoginRequestDTO {
  userName: string;
  password: string;
  academicYearDTO: AcademicYearDTO;
}


export interface UserDTO {
  email: string;
  firstName: string;
  lastName: string;
  medium: string | null;
  mobileNo: string;
  role: string;
  section: string | null;
  userId: number;
  userName: string;
}


export interface LoginDataDTO {
  userDTO: UserDTO;
  token: string;
}


export interface LoginResponseDTO {
  success: boolean;
  message: string;
  data: LoginDataDTO;
  timestamp: string;
}


// Login API
export const loginUser = async (
  payload: LoginRequestDTO
): Promise<LoginResponseDTO> => {

  const response = await axiosInstance.post<LoginResponseDTO>(
    apiEndpoints.login(),
    payload
  );

  return response.data;
};



// Academic Year Response
export const getLastFiveAcademicYears = async (): Promise<
  AcademicYearDTO[]
> => {

  const response = await axiosInstance.get<AcademicYearDTO[]>(
    "/jnpa-school-project/auth/getLastFiveAcademicYears"
  );

  return response.data;
};
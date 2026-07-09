import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface LoginRequestDTO {
  username: string;
  password: string;
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

export const loginUser = async (
  payload: LoginRequestDTO
): Promise<LoginResponseDTO> => {
  const response = await axiosInstance.post<LoginResponseDTO>(
    apiEndpoints.login(),
    payload
  );

  return response.data;
};
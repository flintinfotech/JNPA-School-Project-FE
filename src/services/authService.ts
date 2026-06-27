
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface LoginResponseDTO {
  success: boolean;
  message: string;
  data: string; // this is the token
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
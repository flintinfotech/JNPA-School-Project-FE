
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface UserDTO {
  userId: number;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  role: string;
  section?: string;
  medium?: string;
}

export interface SaveUserRequestDTO {
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  role: string;
  userName: string;
  section?: string;
  medium?: string;
}

export interface UpdateUserRequestDTO {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  role: string;
  userName: string;
  section?: string;
  medium?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface GetAllUsersData {
  total: number;
  Data: UserDTO[]; // backend capitalizes "Data" here — different from "data" elsewhere
}

export const saveUser = async (
  payload: SaveUserRequestDTO
): Promise<ApiResponse<UserDTO>> => {
  const response = await axiosInstance.post<ApiResponse<UserDTO>>(
    apiEndpoints.saveUser(),
    payload
  );
  return response.data;
};

export const updateUser = async (
  payload: UpdateUserRequestDTO
): Promise<ApiResponse<UserDTO>> => {
  const response = await axiosInstance.put<ApiResponse<UserDTO>>(
    apiEndpoints.updateUser(),
    payload
  );
  return response.data;
};

export const getUserById = async (
  userId: number
): Promise<ApiResponse<UserDTO>> => {
  const response = await axiosInstance.get<ApiResponse<UserDTO>>(
    apiEndpoints.getUserById(userId)
  );
  return response.data;
};

export const deleteUser = async (
  userId: number
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete<ApiResponse<null>>(
    apiEndpoints.deleteUser(userId)
  );
  return response.data;
};

export const getAllUsers = async (
  page: number,
  size: number
): Promise<ApiResponse<GetAllUsersData>> => {
  const response = await axiosInstance.post<ApiResponse<GetAllUsersData>>(
    apiEndpoints.getAllUsers(page, size),
    {}
  );
  return response.data;
};
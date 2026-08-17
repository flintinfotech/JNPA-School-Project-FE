
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";


export interface ScreenDTO {
  screenId: number;
  screenName: string;
}

export interface UserDTO {
  userId: number;
  employeeDetailsId?: number; 
  employeeCode?: string; 
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  role: string;
  section?: string;
  medium?: string;

  screens?: ScreenDTO[];
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
export const saveEmployeeDetails = async (payload: any) => {
  const response = await axiosInstance.post(
    apiEndpoints.saveEmployeeDetails(),
    payload
  );

  return response.data;
};



export interface UserSearchFilters {
  firstName?: string;
  lastName?: string;
  role?: string;
}

export const getAllUsers = async (
  page: number,
  size: number,
  filters?: UserSearchFilters
): Promise<ApiResponse<GetAllUsersData>> => {
  const payload = {
    firstName: filters?.firstName || undefined,
    lastName: filters?.lastName || undefined,
    role: filters?.role || undefined,
  };

  const response = await axiosInstance.post<ApiResponse<GetAllUsersData>>(
    apiEndpoints.getAllUsers(page, size),
    payload
  );
  return response.data;
};
export const getEmployeeDetailsById = async (id: number) => {
  const response = await axiosInstance.get(
    apiEndpoints.getEmployeeDetailsById(id)
  );

  return response.data;
};
export const getAllEmployeeDetailsByFilter = async (
  page: number,
  size: number,
  filters?: UserSearchFilters
): Promise<ApiResponse<GetAllUsersData>> => {
  const payload = {
    firstName: filters?.firstName || undefined,
    lastName: filters?.lastName || undefined,
    role: filters?.role || undefined,
  };

  const response = await axiosInstance.post<ApiResponse<GetAllUsersData>>(
    apiEndpoints.getAllemployeeDetails(page, size),
    payload
  );
  return response.data;
};
export const updateEmployeeDetails = async (payload: any) => {
  const response = await axiosInstance.put(
    apiEndpoints.updateEmployeeDetails(),
    payload
  );

  return response.data;
};

export const deleteEmployeeDetails = async (employeeDetailsId: number) => {
  const response = await axiosInstance.delete(
    apiEndpoints.deleteEmployeeDetails(employeeDetailsId)
  );

  return response.data;
};

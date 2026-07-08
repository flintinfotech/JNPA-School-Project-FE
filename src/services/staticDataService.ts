import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface StaticDataResponse {
  role: string[];
  "blood group": string[];
  "student status": string[];
}

export const getAllStaticData = async () => {
  const response = await axiosInstance.get(apiEndpoints.getAllStaticData());

  return response.data as {
    success: boolean;
    message: string;
    data: StaticDataResponse;
  };
};
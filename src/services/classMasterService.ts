import axiosInstance from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

export interface SaveClassMasterRequest {
  standard: string;
  division: string;
  medium: string;
}

export interface ClassMasterSearchFilters {
  standard?: string;
  division?: string;
  medium?: string;
}

export const saveClassMaster = (data: SaveClassMasterRequest) => {
  return axiosInstance.post(apiEndpoints.saveClassMaster(), data);
};

export const updateClassMaster = (data: any) => {
  return axiosInstance.put(apiEndpoints.updateClassMaster(), data);
};

export const getClassMasterById = (id: number | string) => {
  return axiosInstance.get(apiEndpoints.getClassMasterById(id));
};

export const deleteClassMaster = (id: number | string) => {
  return axiosInstance.delete(apiEndpoints.deleteClassMaster(id));
};

export const getAllClassMaster = (
  page: number,
  size: number,
  filters?: ClassMasterSearchFilters
) => {
  const payload = {
    standard: filters?.standard || undefined,
    division: filters?.division || undefined,
    medium: filters?.medium || undefined,
  };

  return axiosInstance.post(
    apiEndpoints.getAllClassMaster(page, size),
    payload
  );
};

export const getAllStaticData = () => {
  return axiosInstance.get(apiEndpoints.getAllStaticData());
};
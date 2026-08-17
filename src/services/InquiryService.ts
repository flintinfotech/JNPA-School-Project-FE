import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type AdmissionInquiryDTO = {
  firstName: string;
  lastName: string;
  contactNumber: string;
  standard: string;
  medium: string;
  status: string;
};

export type AdmissionInquiryResponseData = {
  admissionInquiryId: number;
  contactNumber: string;
  firstName: string;
  lastName: string;
  medium: string;
  standard: string;
  status: string;
  stream: string | null;
};

export type AdmissionInquiryResponse = {
  success: boolean;
  message: string;
  data: AdmissionInquiryResponseData;
  timestamp: string;
};

export type AdmissionInquiryFilter = Record<string, unknown>;

export type AdmissionInquiryListResponse = {
  success: boolean;
  message: string;
  data: {
    Total: number;
    Data: AdmissionInquiryResponseData[];
  };
  timestamp: string;
};

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------
export const saveAdmissionInquiry = (payload: AdmissionInquiryDTO) =>
  axiosInstance.post<AdmissionInquiryResponse>(
    apiEndpoints.saveAdmissionInquiry(),
    payload
  );

export const getAllAdmissionInquiryByFilter = (
  page: number,
  size: number,
  filters: AdmissionInquiryFilter = {}
) =>
  axiosInstance.post<AdmissionInquiryListResponse>(
    apiEndpoints.getAllAdmissionInquiryByFilter(page, size),
    filters
  );

export const getAllStaticData = () =>
  axiosInstance.get(
    apiEndpoints.getAllStaticData()
  );
 export const updateAdmissionInquiryById = (
  id: number,
  payload: AdmissionInquiryDTO
) =>
  axiosInstance.put(
    apiEndpoints.updateAdmissionInquiryById(id),
    payload
  );
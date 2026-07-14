
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type AdmissionProcessDTO = {
  admissionProcessId?: number;
  admissionId?: number;
  stepNo: string;
  heading: string;
  description: string;
};

export type EligibilityCriteriaDTO = {
  eligibilityCriteriaId?: number;
  admissionId?: number;
  title: string;
  description: string;
};

export type ImportantDateDTO = {
  importantDateId?: number;
  admissionId?: number;
  eventName: string;
  eventDate: string;
};

export type RequiredDocumentDTO = {
  requiredDocumentId?: number;
  admissionId?: number;
  documentName: string;
};

export type AdmissionDTO = {
  admissionId?: number;
  classRoomName: string;
  academicYearName: string;
  medium: "English" | "Marathi";
  brochure?: string | null;
  eligibilityCriteriaDTOS: EligibilityCriteriaDTO[];
  importantDateDTOS: ImportantDateDTO[];
  requiredDocumentDTOS: RequiredDocumentDTO[];
  admissionProcessDTOS: AdmissionProcessDTO[];
};
export interface AdmissionFilter {
  classRoomName?: string;
  academicYearName?: string;
  medium?: "English" | "Marathi";
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------
export const saveAdmission = (payload: AdmissionDTO) =>
  axiosInstance.post(apiEndpoints.saveAdmission(), payload);

export const updateAdmission = (payload: AdmissionDTO & { admissionId: number }) =>
  axiosInstance.put(apiEndpoints.updateAdmisson(), payload);

export const getAllAdmissionsByFilter = (page: number, size: number, filter: AdmissionFilter = {}, signal?: AbortSignal) =>
  axiosInstance.post(apiEndpoints.getAllAdmissionsByFilter(page, size), filter, { signal });

import axiosInstance from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

// ---------------- Types ----------------
export type AcademicCalendarEventType =
  | "EXAMINATION"
  | "HOLIDAY"
  | "EVENT"
  | "MEETING"
  | "VACATION"
  | "OTHER";

export interface AcademicCalendarEventDTO {
  academicCalendarId: number;
  eventTitle: string;
  eventType: AcademicCalendarEventType | string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  description?: string;
  section?: string; // 🆕
  medium?: string; // 🆕
}

export interface SaveAcademicCalendarEventPayload {
  eventTitle: string;
  eventType: AcademicCalendarEventType | string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  description?: string;
  section?: string; // 🆕
  medium?: string; // 🆕
}

// 🆕 Filter payload for the getAll (list) API
export interface AcademicCalendarFilterPayload {
  section?: string | null;
  medium?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ---------------- API calls ----------------

export const saveAcademicCalendarEvent = async (
  payload: SaveAcademicCalendarEventPayload
): Promise<ApiResponse<AcademicCalendarEventDTO>> => {
  const response = await axiosInstance.post(
    apiEndpoints.saveAcademicCalendarEvent(),
    payload // includes section + medium
  );
  return response.data;
};

export interface AcademicCalendarEventListResponse {
  "Academic calendar events": AcademicCalendarEventDTO[];
  "total events": number;
}

export const getAllAcademicCalendarEvents = async (
  page: number,
  size: number,
  filter: AcademicCalendarFilterPayload = {} // 🆕 section + medium
): Promise<ApiResponse<AcademicCalendarEventListResponse>> => {
  const response = await axiosInstance.post(
    apiEndpoints.getAllAcademicCalendarEventsByFilter(page, size),
    filter // 🆕 pahile {} hota
  );
  return response.data;
};

export const updateAcademicCalendarEvent = async (
  payload: AcademicCalendarEventDTO
): Promise<ApiResponse<AcademicCalendarEventDTO>> => {
  const response = await axiosInstance.put(
    apiEndpoints.updateAcademicCalendarEvent(),
    payload // includes section + medium
  );
  return response.data;
};

export const deleteAcademicCalendarEvent = async (
  academicCalendarId: number
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(
    apiEndpoints.deleteAcademicCalendarEvent(academicCalendarId)
  );
  return response.data;
};
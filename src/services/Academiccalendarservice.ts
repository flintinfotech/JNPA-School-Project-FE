import axiosInstance from "../lib/axios"; // 👈 adjust path to match your project's configured axios/http client
import { apiEndpoints } from "../services/apiEndpoints"; // 👈 adjust path to match where apiEndpoints.ts lives in your project

// ---------------- Types ----------------

// 👇 TODO: confirm the full list of event types your backend enum supports.
// EXAMINATION is confirmed from your sample payload; the rest are guesses
// based on typical school calendars — adjust to match the real enum.
export type AcademicCalendarEventType =
  | "EXAMINATION"
  | "HOLIDAY"
  | "EVENT"
  | "MEETING"
  | "OTHER";

export interface AcademicCalendarEventDTO {
  academicCalendarId: number;
  eventTitle: string;
  eventType: AcademicCalendarEventType | string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  description?: string;
}

export interface SaveAcademicCalendarEventPayload {
  eventTitle: string;
  eventType: AcademicCalendarEventType | string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  description?: string;
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
    payload
  );
  return response.data;
};

// 👇 TODO: wire these up once the corresponding endpoints exist on the backend.
// The screen currently keeps saved events in local state for the session
// since there's no "get all" endpoint yet — swap that out for a real fetch
// as soon as this is available.
//
// export const getAllAcademicCalendarEvents = async (
//   page: number,
//   size: number
// ): Promise<ApiResponse<{ data: AcademicCalendarEventDTO[]; totalElements: number }>> => {
//   const response = await axiosInstance.get(
//     apiEndpoints.getAllAcademicCalendarEventsByFilter(page, size)
//   );
//   return response.data;
// };
//
// export const updateAcademicCalendarEvent = async (
//   payload: AcademicCalendarEventDTO
// ): Promise<ApiResponse<AcademicCalendarEventDTO>> => {
//   const response = await axiosInstance.put(
//     apiEndpoints.updateAcademicCalendarEvent(),
//     payload
//   );
//   return response.data;
// };
//
// export const deleteAcademicCalendarEvent = async (
//   academicCalendarId: number
// ): Promise<ApiResponse<null>> => {
//   const response = await axiosInstance.delete(
//     apiEndpoints.deleteAcademicCalendarEvent(academicCalendarId)
//   );
//   return response.data;
// };
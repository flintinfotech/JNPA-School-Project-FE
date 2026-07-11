// ---------- Types ----------

import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface NewsDTO {
  newsId?: number | null;
  news: string;
  newsData?: string | null;
  newsDescription?: string | null; // NEW
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface GetAllNewsData {
  "total element": number;
  newsDTOS: NewsDTO[];
}

export interface SaveOrUpdateResult extends ApiResponse<NewsDTO> {
  /**
   * The raw base64 this client just sent (or null if no file was involved this call).
   * Used as a fallback so the UI can preview immediately, since the backend doesn't
   * reliably echo a usable value back in its own response.
   */
  sentNewsData: string | null;
}

// ---------- Helpers ----------

/** Converts a File to a full data URL (e.g. "data:application/pdf;base64,JVBERi0...") */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

/**
 * The backend only wants the raw base64 payload, not the "data:<mime>;base64," prefix
 * that FileReader adds. This strips it before anything goes over the wire.
 */
const stripBase64Prefix = (dataUrl: string): string => {
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
};

/**
 * Guards against garbage coming back from the backend. We've seen it return the raw
 * Java `byte[].toString()` (e.g. "[B@2b7f6c9c") instead of actual base64 for newsData —
 * that's an object reference printed as text, not file data, and will never open as a
 * file. Real base64 only ever contains A-Z, a-z, 0-9, +, /, and trailing = padding.
 */
export const isLikelyValidBase64 = (value: string | null | undefined): value is string => {
  if (!value) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value.trim()) && value.trim().length > 20;
};

/** Returns the value only if it looks like real base64, otherwise null. */
export const sanitizeNewsData = (value: string | null | undefined): string | null =>
  isLikelyValidBase64(value) ? (value as string).trim() : null;

/**
 * The backend stores raw base64 with no mime type alongside it, so to preview a saved
 * attachment we guess the mime type from the base64 signature bytes. Covers the common
 * cases (pdf/jpg/png/gif); falls back to a generic binary type otherwise.
 */
export const guessMimeTypeFromBase64 = (base64: string): string => {
  if (base64.startsWith("JVBERi0")) return "application/pdf";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("R0lGOD")) return "image/gif";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "application/octet-stream";
};

/** Converts raw base64 into an openable blob: URL — data: URLs get blocked by browsers on direct navigation. */
export const base64ToBlobUrl = (rawBase64: string): string => {
  const mime = guessMimeTypeFromBase64(rawBase64);
  const byteChars = atob(rawBase64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mime });
  return URL.createObjectURL(blob);
};
// ---------- Service ----------

const saveNews = async (news: string, file: File | null, newsDescription: string): Promise<SaveOrUpdateResult> => {
  const newsData = file ? stripBase64Prefix(await fileToBase64(file)) : null;
  const payload = { news, newsData, newsDescription };
  const response = await axiosInstance.post(apiEndpoints.saveNews(), payload);
  return { ...response.data, sentNewsData: newsData };
};

const updateNews = async (
  newsId: number,
  news: string,
  file: File | null,
  existingNewsData: string | null,
  newsDescription: string,
): Promise<SaveOrUpdateResult> => {
  // Now that the backend returns valid base64, we can safely resend the current value
  // when no new file was picked — this keeps the existing attachment instead of wiping
  // it, which is what happened while newsData was being omitted from the payload.
  const newsData = file ? stripBase64Prefix(await fileToBase64(file)) : existingNewsData;
  const payload: { news: string; newsId: number; newsData: string | null; newsDescription: string } = {
    news,
    newsId,
    newsData,
    newsDescription,
  };
  const response = await axiosInstance.put(apiEndpoints.updateNews(), payload);
  return { ...response.data, sentNewsData: newsData };
};

const deleteNews = async (newsId: number): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(apiEndpoints.deleteNews(newsId));
  return response.data;
};

const getAllNews = async (page = 0, size = 10, signal?: AbortSignal): Promise<ApiResponse<GetAllNewsData>> => {
  const response = await axiosInstance.post(apiEndpoints.getAllNewsByFilter(page, size), {}, { signal });
  return response.data;
};

export const newsService = {
  saveNews,
  updateNews,
  deleteNews,
  getAllNews,
};

export default newsService;
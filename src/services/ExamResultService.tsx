// ---------------------------------------------------------------------------
// DTOs

import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

// ---------------------------------------------------------------------------
export interface ExamResultDTO {
  examResultId?: number;
  examId?: number;
  resultName: string;
  resultData: string; // raw base64, no data: prefix
}

export interface ExamNoticeDTO {
  examNoticeId?: number;
  examId?: number;
  noticeName: string;
  noticeData: string; // raw base64, no data: prefix
}

export interface TopperDTO {
  topperId?: number;
  examId?: number;
  section: string;
  medium: string;
  userName: string;
  std: string;
  description: string;
  studentImage?: string; // raw base64, no data: prefix
}

export interface ExamDTO {
  examId?: number;
  classRoomName: string;
  academicYearName: string;
  medium: string;
  result10th?: string;
  result12th?: string;
  studentScoring90?: string;
  universityRank?: string;
  examResultDTOS: ExamResultDTO[];
  examNoticeDTOS: ExamNoticeDTO[];
  toppersDTOS: TopperDTO[];
}


// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------
export const saveExam = (payload: ExamDTO) =>
  axiosInstance.post(apiEndpoints.saveExam(), payload);

export const updateExam = (payload: ExamDTO & { examId: number }) =>
  axiosInstance.put(apiEndpoints.updateExam(), payload);

export const getAllExamsByFilter = (
  page: number,
  size: number,
  filter: { classRoomName?: string; medium?: "English" | "Marathi" } = {}
) => axiosInstance.post(apiEndpoints.getAllExamsByFilter(page, size), filter);

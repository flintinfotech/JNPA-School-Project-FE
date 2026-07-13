// ---------------------------------------------------------------------------
// DTOs

import axiosInstance from "../lib/axios";

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
// Endpoints
// ---------------------------------------------------------------------------
const ExamEndpoints = {
  saveExam: () => `/jnpa-school-project/exam/saveExam`,
  updateExam: () => `/jnpa-school-project/exam/updateExam`,
  getAllExamsByFilter: (page: number, size: number) =>
    `/jnpa-school-project/exam/getAllExamsByFilter?page=${page}&size=${size}&paginate=true`,
};

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------
export const saveExam = (payload: ExamDTO) =>
  axiosInstance.post(ExamEndpoints.saveExam(), payload);

export const updateExam = (payload: ExamDTO & { examId: number }) =>
  axiosInstance.put(ExamEndpoints.updateExam(), payload);

export const getAllExamsByFilter = (
  page: number,
  size: number,
  filter: { classRoomName?: string; medium?: "English" | "Marathi" } = {}
) => axiosInstance.post(ExamEndpoints.getAllExamsByFilter(page, size), filter);
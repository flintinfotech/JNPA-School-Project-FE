import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface AcademicInformationDTO {
  academicInformationId: number;
  academicYear: string;
  admissionDate: string;
  admissionNo: number;
  division: string;
  medium: string;
  rollNo: string;
  standard: string;
  studentId: number;
}

export interface ResultStudentDTO {
  studentId: number;
  studentCode: string;
  firstName: string;
  lastName: string;
  gender: string;
  status: string;
  academicInformation?: AcademicInformationDTO[];
}

// Payload sent to the API.
// standard/division/medium = class-scope filters (locked for teachers).
// firstName/lastName/rollNo = free-text search filters.
// ⚠️ FIXED — this interface used to only declare standard/division/medium,
// even though Results.tsx's search bar was reading/writing
// filters.firstName / filters.lastName / filters.rollNo. Those fields
// were silently missing a type, which is exactly the kind of mismatch
// that makes a "working-looking" search box do nothing.
// ⚠️ CONFIRM WITH BACKEND: if getAllCurrentYearStudentsData does NOT
// actually filter on firstName/lastName/rollNo (only on
// standard/division/medium), Results.tsx now also applies a
// client-side fallback filter on top of whatever the API returns, so
// search still works either way. Once the backend supports these
// fields server-side, the fallback becomes a harmless no-op.
export interface ResultFilters {
  standard?: string;
  division?: string;
  medium?: string;
  firstName?: string;
  lastName?: string;
  rollNo?: string;
}

export interface CurrentYearStudentsResponse {
  success: boolean;
  message: string;
  data: {
    data: ResultStudentDTO[];
    totalPages: number;
    pageSize: number;
    currentPage: number;
    totalElements: number;
  };
  timestamp: string;
}

export const getAllCurrentYearStudentsData = async (
  page: number,
  size: number,
  filters: ResultFilters
): Promise<CurrentYearStudentsResponse> => {
  const response = await axiosInstance.post<CurrentYearStudentsResponse>(
    apiEndpoints.getAllCurrentYearStudentsData(page, size),
    filters
  );
  return response.data;
};

export interface SubjectMasterDTO {
  subjectMasterId?: number;
  subjectCode?: string;
  subjectName: string;
}

// 👇 FIXED: the real API returns subjects under `data.subjectMasterDTOS`,
// not `data.data`. This was the reason the subject dropdowns in
// ResultDrawer.tsx were always empty — extractSubjectNames() was reading
// a key that didn't exist in the response, so it silently returned [].
export interface GetAllSubjectsResponse {
  success: boolean;
  message: string;
  data: {
    subjectMasterDTOS: SubjectMasterDTO[];
    "total element"?: number;
  };
  timestamp?: string;
}

// POST /subjectMaster/getAllSubjectMasterByFilter?page=&size=&paginate=true (empty body)
export const getAllSubjects = async (
  page: number,
  size: number
): Promise<GetAllSubjectsResponse> => {
  const response = await axiosInstance.post<GetAllSubjectsResponse>(
    apiEndpoints.getAllSubjects(page, size),
    {}
  );
  return response.data;
};

// This endpoint returns all subjects in one response under `subjectMasterDTOS`
// (no real pagination — "total element" is just the count of items returned).
// This normalizes those rows down to plain subject-name strings for the
// dropdowns in ResultDrawer.tsx.
export const extractSubjectNames = (res: GetAllSubjectsResponse): string[] =>
  (res.data?.subjectMasterDTOS || [])
    .map((s) => s.subjectName)
    .filter((v): v is string => Boolean(v));

// ==================================================================
// Result Drawer (View / Edit) — added
// ==================================================================

export interface ExamSubjectDTO {
  ExamSubjectsId?: number; // present only once returned by the backend
  resultId?: number; // present only once returned by the backend
  subjectName: string;
  maximumMarks: number;
  obtainedMarks: number;
  status: string;
}

// One saved/fetched exam record for a student
export interface StudentResultDTO {
  resultId?: number; // undefined for a brand-new (not-yet-saved) record
  studentId: number;
  standard: string;
  division: string;
  academicYear: string;
  examType: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  grade: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  resultStatus: string;
  examSubjectsDTOS?: ExamSubjectDTO[];
}

export interface GetStudentByIdData {
  studentId: number;
  studentCode?: string;
  firstName?: string;
  lastName?: string;
  // 👇 the student's current class placement, straight from GET /student/getStudentById/{id}
  // used to prefill + lock the Standard / Division / Academic Year fields
  standard?: string;
  division?: string;
  academicYear?: string;
  academicInformation?: AcademicInformationDTO[];
  studentResultDTOS: StudentResultDTO[];
}

export interface GetStudentByIdResponse {
  success: boolean;
  message: string;
  data: GetStudentByIdData;
  timestamp?: string;
}

export const getStudentById = async (
  studentId: number
): Promise<GetStudentByIdResponse> => {
  const response = await axiosInstance.get<GetStudentByIdResponse>(
    apiEndpoints.getStudentById(studentId)
  );
  return response.data;
};

// ---------------- Academic Years ----------------

export interface GetLastFiveAcademicYearsResponse {
  success: boolean;
  message: string;
  // backend may return plain strings, or objects with an academicYear field —
  // getLastFiveAcademicYears() below normalizes either shape to string[]
  data: (string | { academicYear: string })[];
  timestamp?: string;
}

export const getLastFiveAcademicYears = async (): Promise<string[]> => {
  const response = await axiosInstance.get<GetLastFiveAcademicYearsResponse>(
    apiEndpoints.getLastFiveAcademicYears()
  );
  const data = response.data?.data || [];
  return data
    .map((item) => (typeof item === "string" ? item : item?.academicYear))
    .filter((y): y is string => Boolean(y));
};

// ---------------- Save a single result record ----------------

// Body for POST /jnpa-school-project/studentResult/saveStudentResult
// Include resultId (and each subject's ExamSubjectsId/resultId) when updating
// an existing record; omit them when creating a brand-new one.
export interface SaveStudentResultPayload {
  resultId?: number;
  studentId: number;
  standard: string;
  division: string;
  examType: string;
  academicYear: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  examSubjectsDTOS: {
    ExamSubjectsId?: number;
    resultId?: number;
    subjectName: string;
    maximumMarks: number;
    obtainedMarks: number;
    status: string;
  }[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  resultStatus: string;
}

export interface SaveStudentResultResponse {
  success: boolean;
  message: string;
  data: StudentResultDTO; // the saved record, now with resultId + subject ids filled in
  timestamp?: string;
}

export const saveStudentResult = async (
  payload: SaveStudentResultPayload
): Promise<SaveStudentResultResponse> => {
  const response = await axiosInstance.post<SaveStudentResultResponse>(
    apiEndpoints.saveStudentResult(),
    payload
  );
  return response.data;
};

// ---------------- Update an existing result record (PUT) ----------------

export const updateStudentResult = async (
  payload: SaveStudentResultPayload
): Promise<SaveStudentResultResponse> => {
  const response = await axiosInstance.put<SaveStudentResultResponse>(
    apiEndpoints.updateStudentResult(),
    payload
  );
  return response.data;
};

// ---------------- Delete a result record ----------------

export interface DeleteStudentResultResponse {
  success: boolean;
  message: string;
  timestamp?: string;
}

export const deleteStudentResult = async (
  resultId: number
): Promise<DeleteStudentResultResponse> => {
  const response = await axiosInstance.delete<DeleteStudentResultResponse>(
    apiEndpoints.deleteStudentResult(resultId)
  );
  return response.data;
};

// ---------------- Static data (Exam Type, etc.) ----------------

export interface StaticDataResponse {
  success: boolean;
  message: string;
  // 👇 TODO: once you see a real response from getAllStaticData, replace
  // this with the actual shape. For now it's kept generic and
  // extractExamTypeOptions() below does its best to find the exam-type
  // list inside it under any reasonably-named key.
  data: Record<string, any>;
  timestamp?: string;
}

export const getAllStaticData = async (): Promise<Record<string, any>> => {
  const response = await axiosInstance.get<StaticDataResponse>(
    apiEndpoints.getAllStaticData()
  );
  return response.data?.data || {};
};

// 👇 TODO: confirm the exact key your backend uses for exam types inside
// getAllStaticData's response (e.g. "examType", "EXAM_TYPE", "examTypeList").
// This helper checks for any key whose name contains "examtype" (case- and
// underscore-insensitive) so you likely won't need to touch ResultDrawer.tsx
// once you confirm the key — just adjust the matching here if it's named
// something else entirely (e.g. just "exam").
export const extractExamTypeOptions = (staticData: Record<string, any>): string[] => {
  const key = Object.keys(staticData || {}).find((k) =>
    k.toLowerCase().replace(/[_\s]/g, "").includes("examtype")
  );
  if (!key) return [];
  const raw = staticData[key];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) =>
      typeof item === "string" ? item : item?.name || item?.value || item?.examType
    )
    .filter((v): v is string => Boolean(v));
};
// ⚠️ adjust to match the import used in userService.ts
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints"; // ⚠️ adjust path if different

export interface ParentDTO {
  parentId?: number;
  studentId?: number;
  name: string;
  relation: string;
  occupation?: string;
  phone: string;
  email?: string;
  address?: string;
  annualIncome?: number;
}

export interface StudentDocumentDTO {
  studentDocumentId?: number;
  studentId?: number;
  documentName: string;
  uploadDate: string;
  document: string | null; // base64
}

export interface StudentAchievementDTO {
  academicYear?: string;
  achievementDescription?: string;
  achievementName?: string;
  studentAchievementId?: number;
  studentId?: number;
}

export interface AcademicInformationDTO {
  academicInformationId?: number;
  studentId?: number;
  admissionNo: number;
  admissionDate: string;
  standard: string;
  section: string;
  rollNo: string;
  academicYear: string;
  bloodGroup: string;
  caste: string;
  category: string;
  dob: string;
}

export interface ExamSubjectDTO {
  ExamSubjectsId?: number;
  resultId?: number;
  subjectName: string;
  maximumMarks: number;
  obtainedMarks: number;
  status: string; // "PASS" | "FAIL"
}

export interface StudentResultDTO {
  resultId?: number;
  studentId?: number;
  academicYear: string;
  standard: string;
  division: string;
  examType: string; // e.g. "UNIT_TEST"
  startDate?: string;
  endDate?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  resultStatus: string; // "PASS" | "FAIL"
  examSubjectsDTOS: ExamSubjectDTO[];
}

export interface FeePaymentDTO {
  feePaymentId?: number;
  studentFeeId?: number;
  amount?: number;
  paymentMode?: string; // "CASH" | "UPI" | "CARD" | "NET_BANKING" | "CHEQUE"
  paymentDate?: string;
  transactionId?: string;
  receiptNo?: string; // e.g. "RCT00006" — comes straight from the backend
  remarks?: string;
}

export interface StudentFeeDTO {
  studentFeeId?: number;
  studentId?: number;
  academicYear?: string;
  feeName?: string;
  totalFeeAmount?: number;
  dueDate?: string | null;
  paidAmount?: number;
  pendingAmount?: number;
  dueAmount?: number;
  status?: string; // e.g. "PENDING" | "PAID" | "COMPLETED" | "OVERDUE" — comes from the backend
  feePaymentDTOS?: FeePaymentDTO[];
}

export interface StudentDTO {
  studentId?: number;
  firstName: string;
  lastName: string;
  gender: string;
  DOB: string; // 👈 renamed from dob to match backend field name
  address: string;
  bloodGroup?: string;
  category?: string;
  religion?: string;
  caste?: string;
  nationality?: string;
  aadhaarCard?: string;
  status: string;
  profileImg?: string | null;
  parentDTO: ParentDTO;
  studentDocuments: StudentDocumentDTO[];
  academicInformation: AcademicInformationDTO[];
  studentResultDTOS?: StudentResultDTO[];
  studentAchievementsDTOS?: StudentAchievementDTO[];
  // Fee data shape isn't fully settled on the backend yet — the same
  // getStudentById response is read defensively via extractFeesFromStudent()
  // below, which checks every key seen in the wild (see StudentFees.tsx).
  studentFeeDTOS?: StudentFeeDTO[];
  studentFeeDTOList?: StudentFeeDTO[];
  studentFeeList?: StudentFeeDTO[];
  feeDTOS?: StudentFeeDTO[];
  feeList?: StudentFeeDTO[];
  fees?: StudentFeeDTO[];
  studentFee?: StudentFeeDTO;
  studentFeeDTO?: StudentFeeDTO;
}

// ===========================
// Fee extraction helper
// ===========================
// A student can have MULTIPLE fee blocks (Tuition, Transport, etc). The
// backend key for "all fees" isn't fixed/confirmed, so this checks every
// shape that's been observed — exact keys first, then a case-insensitive
// "anything with fee in the name" sweep, then flattened-onto-student as a
// last resort — and always returns an array.
export const extractFeesFromStudent = (
  studentData: StudentDTO | null | undefined
): StudentFeeDTO[] => {
  if (!studentData) return [];

  const raw = studentData as unknown as Record<string, unknown>;

  // 1) Known/expected array keys.
  const arrayKeys = [
    "studentFeeDTOS",
    "studentFeeDTOList",
    "studentFeeList",
    "feeDTOS",
    "feeList",
    "fees",
  ] as const;

  for (const key of arrayKeys) {
    const value = raw[key];
    if (Array.isArray(value) && value.length) {
      return value as StudentFeeDTO[];
    }
  }

  // 2) Known single-object keys.
  if (studentData.studentFee) return [studentData.studentFee];
  if (studentData.studentFeeDTO) return [studentData.studentFeeDTO];

  // 3) Fee fields might already be flattened directly onto the student
  // object (e.g. studentData.totalFeeAmount / studentData.feeName exist
  // right alongside firstName, lastName, etc).
  if (
    raw["totalFeeAmount"] !== undefined ||
    (raw["feeName"] !== undefined && raw["paidAmount"] !== undefined)
  ) {
    return [studentData as unknown as StudentFeeDTO];
  }

  // 4) Case-insensitive sweep for any other key that looks fee-related,
  // in case the backend uses a casing/spelling we haven't hardcoded above
  // (e.g. "studentFeeDtos", "StudentFees", "feeDetails"...).
  for (const key of Object.keys(raw)) {
    if (!/fee/i.test(key)) continue;

    const value = raw[key];

    if (Array.isArray(value) && value.length) {
      return value as StudentFeeDTO[];
    }

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("totalFeeAmount" in (value as object) ||
        "feeName" in (value as object))
    ) {
      return [value as StudentFeeDTO];
    }
  }

  // Nothing matched a known shape — log the actual object so the real
  // backend field name (or nesting) is easy to spot and add above.
  // Heavy/base64 fields (profile photo, uploaded documents) are stripped
  // out first so the console shows the useful key names instead of a wall
  // of image data.
  const { profileImg, studentDocuments, ...safeForLogging } = raw as Record<
    string,
    unknown
  >;
  // eslint-disable-next-line no-console
  console.warn(
    "extractFeesFromStudent: no fee data found. Top-level keys:",
    Object.keys(raw),
    "Student object (image/documents omitted):",
    safeForLogging
  );

  return [];
};

export interface StudentFilter {
  standard?: string;
  section?: string;
  admissionNo?: number;
  relation?: string;
  occupation?: string;
}

export const saveStudent = async (payload: StudentDTO) => {
  const { data } = await axiosInstance.post(apiEndpoints.saveStudent(), payload);
  return data;
};

export const updateStudent = async (payload: StudentDTO) => {
  const { data } = await axiosInstance.put(apiEndpoints.updateStudent(), payload);
  return data;
};

export const getStudentById = async (studentId: number | string) => {
  const { data } = await axiosInstance.get(apiEndpoints.getStudentById(studentId));
  return data;
};

export const getStudentByUserId = async (userId: number | string) => {
  const { data } = await axiosInstance.get(apiEndpoints.getStudentByUserId(userId));
  return data;
};

export const deleteStudent = async (studentId: number | string) => {
  const { data } = await axiosInstance.delete(apiEndpoints.deleteStudent(studentId));
  return data;
};

export const getAllStudents = async (
  page: number,
  size: number,
  filters: StudentFilter = {}
) => {
  const { data } = await axiosInstance.post(
    apiEndpoints.getAllStudents(page, size),
    filters
  );
  return data;
};

// ===========================
// Student Fee (detail view)
// ===========================
// GET /jnpa-school-project/studentFee/getStudentFeeById/{studentFeeId}
// Response shape: { success, message, data: StudentFeeDTO, timestamp }
// This is the authoritative source for a single fee's full details
// (including every feePaymentDTOS entry) — used to fetch/enrich each fee
// record found on the student object before showing it in the read-only
// Fee Details popup on the Student Profile screen.
export const getStudentFeeById = async (studentFeeId: number | string) => {
  const { data } = await axiosInstance.get(
    apiEndpoints.getStudentFeeById(studentFeeId)
  );
  return data as {
    success: boolean;
    message?: string;
    data: StudentFeeDTO;
    timestamp?: string;
  };
};
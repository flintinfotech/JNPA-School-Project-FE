import dayjs from "dayjs";

import axiosInstance from "../lib/axios"; 
import { apiEndpoints } from "../services/apiEndpoints"; 

export type AttendanceStatus = "PRESENT" | "ABSENT";

export interface AttendanceRecord {
  studentId: number;
  status: AttendanceStatus;
  attendanceId?: number;
}

export interface SaveAttendancePayload {
  attendanceDate: string; // "YYYY-MM-DD"
  standard: string;
  division: string;
  medium?: string;
  academicYear?: string;
  attendanceList: AttendanceRecord[];
}

export interface AttendanceDaySummary {
  present: number;
  absent: number;
  total: number;
}

export interface ExistingAttendanceEntry {
  status: AttendanceStatus;
  attendanceId: number;
}

// Shape of one record as returned by getAllStudentAttendanceByFilter.
// ⚠️ Adjust field names here if the backend's actual DTO differs.
interface RawAttendanceRecord {
  studentAttendanceId: number;
  studentId: number;
  attendanceDate: string; // "YYYY-MM-DD"
  attendanceStatus: AttendanceStatus;
  academicYear?: string;
  standard?: string;
  division?: string;
}

const FILTER_PAGE_SIZE = 200;

// Pages through getAllStudentAttendanceByFilter and collects every record
// matching the given filter body (needed because a month can hold more
// records than fit on one page).
async function fetchAllAttendanceRecords(
  filter: Record<string, unknown>
): Promise<RawAttendanceRecord[]> {
  const all: RawAttendanceRecord[] = [];
  let page = 0;

  while (true) {
    const { data: envelope }: any = await axiosInstance.post(
      apiEndpoints.getAllStudentAttendanceByFilter(page, FILTER_PAGE_SIZE),
      filter
    );

    const batch: RawAttendanceRecord[] =
      envelope?.data?.Data || envelope?.data?.data || envelope?.data || [];

    all.push(...batch);

    if (batch.length < FILTER_PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

// ===========================
// Save/update attendance for one class + one date
// One save/update call per marked student, run in parallel.
// ===========================
export const saveAttendance = async (
  payload: SaveAttendancePayload
): Promise<{ success: boolean }> => {
  if (payload.attendanceList.length === 0) {
    return { success: true };
  }

  try {
    const results = await Promise.all(
      payload.attendanceList.map(async (record) => {
        if (record.attendanceId) {
          // Already has a record for this date -> update it
          const { data } = await axiosInstance.put(apiEndpoints.updateStudentAttendance(), {
            studentAttendanceId: record.attendanceId,
            studentId: record.studentId,
            attendanceDate: payload.attendanceDate,
            attendanceStatus: record.status,
            academicYear: payload.academicYear,
          });
          return data;
        }

        // No record yet for this student on this date -> create one
        const { data } = await axiosInstance.post(apiEndpoints.saveStudentAttendance(), {
          studentId: record.studentId,
          attendanceDate: payload.attendanceDate,
          attendanceStatus: record.status,
        });
        return data;
      })
    );

    const allOk = results.every((envelope: any) => envelope?.success !== false);
    return { success: allOk };
  } catch (error) {
    console.error("Failed to save attendance:", error);
    return { success: false };
  }
};

// ===========================
// Get attendance already marked for one class + one date, keyed by
// studentId, including the studentAttendanceId so a re-save updates
// instead of duplicating.
// ===========================
export const getAttendanceByDate = async (
  standard: string,
  division: string,
  date: string
): Promise<Record<number, ExistingAttendanceEntry>> => {
  try {
    const records = await fetchAllAttendanceRecords({
      standard,
      division,
      attendanceDate: date,
    });

    const map: Record<number, ExistingAttendanceEntry> = {};
    records.forEach((rec) => {
      map[rec.studentId] = {
        status: rec.attendanceStatus,
        attendanceId: rec.studentAttendanceId,
      };
    });
    return map;
  } catch (error) {
    console.error("Failed to load attendance for date:", error);
    return {};
  }
};

// ===========================
// Present/Absent counts for every marked date in a month — drives the
// calendar dot for each day.
// ===========================
export const getAttendanceSummaryForMonth = async (
  standard: string,
  division: string,
  year: number,
  month: number // 1–12
): Promise<Record<string, AttendanceDaySummary>> => {
  const fromDate = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const toDate = fromDate.endOf("month");

  try {
    const records = await fetchAllAttendanceRecords({
      standard,
      division,
      fromDate: fromDate.format("YYYY-MM-DD"),
      toDate: toDate.format("YYYY-MM-DD"),
    });

    const summary: Record<string, AttendanceDaySummary> = {};
    records.forEach((rec) => {
      const day = summary[rec.attendanceDate] || { present: 0, absent: 0, total: 0 };
      if (rec.attendanceStatus === "PRESENT") day.present += 1;
      else if (rec.attendanceStatus === "ABSENT") day.absent += 1;
      day.total += 1;
      summary[rec.attendanceDate] = day;
    });
    return summary;
  } catch (error) {
    console.error("Failed to load attendance summary for month:", error);
    return {};
  }
};

// ===========================
// Fetch a single attendance record by its id (not currently used by the
// screen, but wired up since the backend exposes it).
// ===========================
export const getAttendanceById = async (
  studentAttendanceId: number
): Promise<RawAttendanceRecord | null> => {
  try {
    const { data: envelope }: any = await axiosInstance.get(
      apiEndpoints.getStudentAttendanceById(studentAttendanceId)
    );
    return envelope?.data || null;
  } catch (error) {
    console.error("Failed to fetch attendance record:", error);
    return null;
  }
};

// ===========================
// Delete a single attendance record (not currently wired into the screen's
// UI — there's no "clear mark" action yet — but exposed for when it's
// needed).
// ===========================
export const deleteAttendance = async (
  studentAttendanceId: number
): Promise<{ success: boolean }> => {
  try {
    const { data: envelope }: any = await axiosInstance.delete(
      apiEndpoints.deleteStudentAttendance(studentAttendanceId)
    );
    return { success: envelope?.success !== false };
  } catch (error) {
    console.error("Failed to delete attendance record:", error);
    return { success: false };
  }
};
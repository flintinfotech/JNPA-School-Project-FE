import { useEffect, useMemo, useState } from "react";
import { Calendar, Button, Spin, Empty, message, Input, Dropdown, Pagination, Select } from "antd";
import type { MenuProps } from "antd";
import {
  CalendarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  TeamOutlined,
  MoreOutlined,
  SaveOutlined,
  TeamOutlined as UsersOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import { useAuth } from "../hooks/useAuth";
import { getAllStudents, type StudentDTO } from "../services/studentService";
import {
  saveAttendance,
  getAttendanceByDate,
  getAttendanceSummaryForMonth,
  type AttendanceStatus,
  type AttendanceDaySummary,
} from "../services/attendanceService";

interface AttendanceRow {
  studentId: number;
  rollNo: string;
  firstName: string;
  lastName: string;
  // undefined = not marked yet by the teacher — shown as "-" in the table,
  // not defaulted to Present/Absent.
  status?: AttendanceStatus;
  // Set when this student already has an attendance record for the
  // selected date. Carried through to handleSave so we PUT an update
  // instead of POSTing a duplicate record.
  attendanceId?: number;
}

// The class this teacher's account is assigned to — read straight off the
// logged-in user (same fields shown on the "Account Details" tab of the
// teacher's own Profile screen: Standard / Division / Medium). This is
// deliberately NOT the Teacher-Subject Assignment data (that can list
// several classes a teacher merely teaches a subject in) — Student
// Attendance only ever concerns the one class the teacher's account
// belongs to.
interface AssignedClass {
  standard: string;
  division: string;
  medium: string;
}

const stdShort = (s: string) => s.replace(" Standard", "");

// Small set of avatar background colors, cycled by row index — purely
// decorative, mirrors the reference design's colored initials circles.
const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-sky-100 text-sky-700",
  "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700",
];

export default function StudentAttendance() {
  const { user, academicYear } = useAuth();

  // ===========================
  // Step 1: which class is this teacher's account assigned to?
  // (from Account Details — user.standard / user.division / user.medium)
  // ===========================
  const anyUser = (user || {}) as Record<string, any>;
  const standard: string | undefined = anyUser.standard;
  const division: string | undefined = anyUser.division || anyUser.section;
  const medium: string | undefined = anyUser.medium;

  const loadingAssignment = false;
  const selectedClass: AssignedClass | null = useMemo(
    () => (standard && division ? { standard, division, medium: medium || "-" } : null),
    [standard, division, medium]
  );

  // ===========================
  // Step 2: roster for the assigned class (fetched once)
  // ===========================
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }

    setStudentsLoading(true);

    getAllStudents(0, 500, {
      standard: selectedClass.standard,
      division: selectedClass.division,
    } as any)
      .then((res: any) => {
        if (res?.success) {
          const list: StudentDTO[] = res.data?.Data || res.data?.data || res.data || [];
          setStudents(Array.isArray(list) ? list : []);
        } else {
          message.error(res?.message || "Failed to load students");
          setStudents([]);
        }
      })
      .catch((err: any) => {
        message.error(err?.response?.data?.message || "Failed to load students");
        setStudents([]);
      })
      .finally(() => setStudentsLoading(false));
  }, [selectedClass]);

  // ===========================
  // Calendar + attendance table state
  // ===========================
  // Both panels are visible together (calendar always on the left,
  // roster+table always on the right) — defaults to today instead of
  // requiring a click before anything shows.
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(dayjs());
  const [monthSummary, setMonthSummary] = useState<Record<string, AttendanceDaySummary>>({});
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Table search + pagination
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!selectedClass) {
      setMonthSummary({});
      return;
    }

    getAttendanceSummaryForMonth(
      selectedClass.standard,
      selectedClass.division,
      calendarMonth.year(),
      calendarMonth.month() + 1
    ).then(setMonthSummary);
  }, [selectedClass, calendarMonth]);

  // Load attendance for the selected date whenever the date, class, or
  // roster changes.
  useEffect(() => {
    if (!selectedClass || students.length === 0) {
      setRows([]);
      return;
    }

    let cancelled = false;
    setRowsLoading(true);

    getAttendanceByDate(selectedClass.standard, selectedClass.division, selectedDate.format("YYYY-MM-DD"))
      .then((existing) => {
        if (cancelled) return;
        const nextRows: AttendanceRow[] = students.map((s) => {
          const rec = existing[s.studentId as number];
          return {
            studentId: s.studentId as number,
            rollNo: s.academicInformation?.[0]?.rollNo || "-",
            firstName: s.firstName,
            lastName: s.lastName,
            status: rec?.status,
            attendanceId: rec?.attendanceId,
          };
        });
        setRows(nextRows);
      })
      .finally(() => {
        if (!cancelled) setRowsLoading(false);
      });

    setCurrentPage(1);
    setSearchText("");

    return () => {
      cancelled = true;
    };
  }, [selectedClass, students, selectedDate]);

  const setRowStatus = (studentId: number, status: AttendanceStatus) => {
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
  };

  const markAll = (status: AttendanceStatus) => {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
  };

  const presentCount = rows.filter((r) => r.status === "PRESENT").length;
  const absentCount = rows.filter((r) => r.status === "ABSENT").length;
  const totalStudents = students.length;
  const presentPct = totalStudents ? ((presentCount / totalStudents) * 100).toFixed(1) : "0.0";
  const absentPct = totalStudents ? ((absentCount / totalStudents) * 100).toFixed(1) : "0.0";
  const isToday = selectedDate.isSame(dayjs(), "day");

  const unmarkedCount = rows.filter((r) => !r.status).length;

  const handleSave = async () => {
    if (!selectedClass) return;

    const markedRows = rows.filter((r): r is AttendanceRow & { status: AttendanceStatus } => !!r.status);

    if (markedRows.length === 0) {
      message.warning("Please mark at least one student's attendance first");
      return;
    }

    setSaving(true);
    try {
      const result = await saveAttendance({
        attendanceDate: selectedDate.format("YYYY-MM-DD"),
        standard: selectedClass.standard,
        division: selectedClass.division,
        medium: selectedClass.medium,
        academicYear: academicYear
          ? `${dayjs(academicYear.startDate).year()}-${dayjs(academicYear.endDate).year()}`
          : undefined,
        attendanceList: markedRows.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          attendanceId: r.attendanceId,
        })),
      });

      if (result.success) {
        message.success("Attendance saved successfully");
        setMonthSummary((prev) => ({
          ...prev,
          [selectedDate.format("YYYY-MM-DD")]: {
            present: presentCount,
            absent: absentCount,
            total: rows.length,
          },
        }));

        // Newly-created records only get a studentAttendanceId once the
        // backend has saved them — re-fetch so editing this same date
        // again sends an UPDATE instead of creating duplicates.
        const refreshed = await getAttendanceByDate(
          selectedClass.standard,
          selectedClass.division,
          selectedDate.format("YYYY-MM-DD")
        );
        setRows((prev) =>
          prev.map((r) => ({
            ...r,
            attendanceId: refreshed[r.studentId]?.attendanceId ?? r.attendanceId,
          }))
        );
      } else {
        message.error("Failed to save attendance");
      }
    } finally {
      setSaving(false);
    }
  };

  // Single dot per day — green if every marked student was present,
  // red if at least one was absent. Keeps the calendar reading clean
  // instead of stacking multiple badges per cell.
  const cellRender = (value: Dayjs) => {
    const summary = monthSummary[value.format("YYYY-MM-DD")];
    if (!summary) return null;
    const dotColor = summary.absent > 0 ? "bg-red-500" : "bg-green-500";
    return (
      <div className="flex justify-center mt-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      </div>
    );
  };

  const rowMenu = (row: AttendanceRow): MenuProps => ({
    items: [
      {
        key: "present",
        label: "Mark Present",
        icon: <CheckCircleOutlined />,
        disabled: row.status === "PRESENT",
      },
      {
        key: "absent",
        label: "Mark Absent",
        icon: <CloseCircleOutlined />,
        disabled: row.status === "ABSENT",
      },
    ],
    onClick: ({ key }) => setRowStatus(row.studentId, key === "present" ? "PRESENT" : "ABSENT"),
  });

  const filteredRows = rows.filter((r) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
      r.rollNo.toLowerCase().includes(q)
    );
  });

  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ===========================
  // UI
  // ===========================
  if (loadingAssignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spin tip="Loading your class..." />
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 py-12 text-center">
          <Empty description="No class assigned to your account yet. Please contact the admin." />
        </div>
      </div>
    );
  }

  return (
    <div className="jnpa-attendance min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6">
      <style>{`
        .jnpa-attendance .ant-picker-cell-inner { border-radius: 9999px !important; }
        .jnpa-attendance .ant-picker-cell-selected .ant-picker-cell-inner,
        .jnpa-attendance .ant-picker-cell-selected:hover .ant-picker-cell-inner {
          background: #4f46e5 !important;
          color: #fff !important;
        }
        .jnpa-attendance .ant-picker-calendar-full .ant-picker-panel { border-top: none; }
        .jnpa-attendance .ant-picker-content th { color: #94a3b8; font-weight: 500; font-size: 12px; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shrink-0">
            <CalendarOutlined />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Student Attendance</h1>
            
          </div>
        </div>

        {/* Stat cards — On Leave card removed; academic year shown in the navbar already, so not repeated here */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total Students</p>
              <p className="text-2xl font-semibold text-slate-800 mt-1">{totalStudents}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
              <UsersOutlined />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-green-200 bg-green-50/40 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700">{isToday ? "Present Today" : "Present"}</p>
              <p className="text-2xl font-semibold text-slate-800 mt-1">{presentCount}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg">
                <CheckCircleFilled />
              </div>
              <span className="text-xs text-green-600">{presentPct}%</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-red-200 bg-red-50/40 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-700">{isToday ? "Absent Today" : "Absent"}</p>
              <p className="text-2xl font-semibold text-slate-800 mt-1">{absentCount}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-lg">
                <CloseCircleFilled />
              </div>
              <span className="text-xs text-red-600">{absentPct}%</span>
            </div>
          </div>
        </div>

        {/* Two-column layout: calendar (left) + roster/table (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-start">
          {/* CALENDAR CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">
                {calendarMonth.format("MMMM YYYY")}
              </span>
              <div className="flex gap-1">
                <Button size="small" onClick={() => setCalendarMonth((m) => m.subtract(1, "month"))}>
                  ‹
                </Button>
                <Button size="small" onClick={() => setCalendarMonth((m) => m.add(1, "month"))}>
                  ›
                </Button>
              </div>
            </div>

            {studentsLoading ? (
              <div className="py-10 flex items-center justify-center">
                <Spin tip="Loading..." />
              </div>
            ) : (
              <Calendar
                fullscreen={false}
                value={selectedDate}
                headerRender={() => null}
                cellRender={cellRender}
                disabledDate={(d) => d.isAfter(dayjs(), "day")}
                onSelect={(date) => setSelectedDate(date)}
                onPanelChange={(date) => setCalendarMonth(date)}
              />
            )}

            <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Present {presentCount}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Absent {absentCount}
              </span>
            </div>
          </div>

          {/* ROSTER + TABLE CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <TeamOutlined /> {selectedDate.format("dddd, DD MMM YYYY")}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Total Students: {totalStudents} &nbsp;|&nbsp; Present: {presentCount} &nbsp;|&nbsp; Absent:{" "}
                  {absentCount} &nbsp;|&nbsp; Not Marked: {unmarkedCount}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="small"
                  className="!text-green-700 !border-green-300 !bg-green-50"
                  icon={<CheckCircleOutlined />}
                  onClick={() => markAll("PRESENT")}
                >
                  Mark All Present
                </Button>
                <Button
                  size="small"
                  className="!text-red-700 !border-red-300 !bg-red-50"
                  icon={<CloseCircleOutlined />}
                  onClick={() => markAll("ABSENT")}
                >
                  Mark All Absent
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>
            </div>

            <Input
              allowClear
              placeholder="Search by name or roll number..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              className="mb-4"
            />

            {rowsLoading ? (
              <div className="py-10 flex items-center justify-center">
                <Spin tip="Loading attendance..." />
              </div>
            ) : rows.length === 0 ? (
              <Empty description="No students found for this class" />
            ) : (
              <>
                {/* MOBILE: card list (below sm) — the table below is hidden here since a
                    7-column table only readable by scrolling sideways is a poor mobile UX. */}
                <div className="sm:hidden space-y-2">
                  {pagedRows.map((row, idx) => {
                    const initials = `${row.firstName?.[0] || ""}${row.lastName?.[0] || ""}`.toUpperCase();
                    const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                    return (
                      <div
                        key={row.studentId}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${color}`}
                          >
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-700 text-sm truncate">
                              {row.firstName} {row.lastName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              Roll {row.rollNo} &middot; {stdShort(selectedClass.standard)}-{selectedClass.division}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {row.status === "PRESENT" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                              <CheckCircleFilled /> Present
                            </span>
                          ) : row.status === "ABSENT" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                              <CloseCircleFilled /> Absent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                              -
                            </span>
                          )}
                          <Dropdown menu={rowMenu(row)} trigger={["click"]}>
                            <Button type="text" size="small" icon={<MoreOutlined />} />
                          </Dropdown>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DESKTOP/TABLET: full table (sm and up) */}
                <div className="hidden sm:block overflow-x-auto -mx-1">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                        <th className="py-2 px-2 w-10">#</th>
                        <th className="py-2 px-2">Roll No</th>
                        <th className="py-2 px-2">Student Name</th>
                        <th className="py-2 px-2">Class</th>
                        <th className="py-2 px-2">Division</th>
                        <th className="py-2 px-2">Status</th>
                        <th className="py-2 px-2 text-center w-14">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.map((row, idx) => {
                        const initials = `${row.firstName?.[0] || ""}${row.lastName?.[0] || ""}`.toUpperCase();
                        const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        return (
                          <tr key={row.studentId} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 px-2 text-slate-400">
                              {(currentPage - 1) * pageSize + idx + 1}
                            </td>
                            <td className="py-2 px-2 text-slate-600">{row.rollNo}</td>
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${color}`}
                                >
                                  {initials}
                                </span>
                                <span className="font-medium text-slate-700">
                                  {row.firstName} {row.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-slate-600">{stdShort(selectedClass.standard)}</td>
                            <td className="py-2 px-2 text-slate-600">{selectedClass.division}</td>
                            <td className="py-2 px-2">
                              {row.status === "PRESENT" ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                                  <CheckCircleFilled /> Present
                                </span>
                              ) : row.status === "ABSENT" ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                                  <CloseCircleFilled /> Absent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <Dropdown menu={rowMenu(row)} trigger={["click"]}>
                                <Button type="text" size="small" icon={<MoreOutlined />} />
                              </Dropdown>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    Show{" "}
                    <Select
                      size="small"
                      value={pageSize}
                      onChange={(v) => {
                        setPageSize(v);
                        setCurrentPage(1);
                      }}
                      options={[10, 20, 50].map((n) => ({ value: n, label: n }))}
                      style={{ width: 70 }}
                    />{" "}
                    of {filteredRows.length}
                  </div>
                  <Pagination
                    size="small"
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredRows.length}
                    onChange={(p) => setCurrentPage(p)}
                    showSizeChanger={false}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
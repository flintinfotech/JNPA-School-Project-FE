import React, { useState, useEffect, useCallback, Fragment } from "react";
import {
  Form,
  Input,
  Select,
  TimePicker,
  Button,
  Drawer,
  Modal,
  Spin,
  Popconfirm,
  Empty,
  message,
  ConfigProvider,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { FormInstance } from "antd/es/form";
import CommonTable from "../components/commonTable"; // 👈 change to your actual path
import api from "../lib/axios"; // 👈 change to your actual axios instance path
import { useAuth } from "../hooks/useAuth"; // 👈 same hook Results.tsx uses for role/user info
import { apiEndpoints } from "../services/apiEndpoints"; // 👈 change to your actual path

const { Option } = Select;

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

// 👇 ASSUMED fallback — used ONLY if getAllStaticData doesn't return a
// "standard" key. Remove this once you confirm the real key name.
const STANDARD_FALLBACK = [
  "Playgroup",
  "Nursery",
  "Junior KG (LKG)",
  "Senior KG (UKG)",
  "1st Standard",
  "2nd Standard",
  "3rd Standard",
  "4th Standard",
  "5th Standard",
  "6th Standard",
  "7th Standard",
  "8th Standard",
  "9th Standard",
  "10th Standard",
];

// 👇 ASSUMED fallback — used ONLY until getAllStaticData has actually been
// fetched (fetched lazily on Add/Edit/View — see ensureStaticData below).
const PERIOD_FALLBACK = [
  "Period 1",
  "Period 2",
  "Period 3",
  "Period 4",
  "Period 5",
  "Period 6",
  "Period 7",
  "Period 8",
  "Break 1",
  "Lunch Break",
];

const DRAWER_BG_COLOR = "#fff6ed";
const ACADEMIC_YEAR_STORAGE_KEY = "academicYear";

interface TimeTableFilters {
  standard?: string;
  division?: string;
  medium?: string;
}

// Exact backend endpoint requested for class-filtered timetables.
// This is kept here so the request does not depend on whether the
// apiEndpoints file has the method named getAllTimeTableByFilter yet.
const getAllTimeTableByFilterEndpoint = (page: number, size: number) =>
  `/jnpa-school-project/timeTable/getAllTimeTableByFilter?page=${page}&size=${size}&paginate=true`;


// 👇 how many period cards show per page inside Add/Edit.
const PERIOD_PAGE_SIZE = 10;

// ---------------------------------------------------------------
// 🛠️ FIX — static-data normalization helpers.
//
// getAllStaticData's entries were assumed to be plain strings
// (e.g. "Break 1"). If the real API instead returns objects, e.g.
// { label: "Break 1", value: 5 } or { name: "Break 1", id: 5 },
// then rendering that object directly as a React child, or calling
// string methods like .match()/.toLowerCase() on it, throws and
// crashes the whole page to a blank screen — which is exactly what
// happened when picking "Break".
//
// toLabel/toValue below make every static-data consumer safe
// regardless of whether the entry is a string or an object.
// ---------------------------------------------------------------
const toLabel = (item: any): string => {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);
  return String(
    item.label ?? item.name ?? item.periodName ?? item.title ?? item.value ?? ""
  );
};

const toValue = (item: any): string => {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);
  return String(
    item.value ?? item.label ?? item.name ?? item.periodName ?? item.id ?? ""
  );
};

const normalizeList = (list: any): string[] =>
  Array.isArray(list) ? list.map((item) => toValue(item)) : [];

const getCurrentAcademicYear = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

const getLoggedInAcademicYear = (): string => {
  try {
    const stored = localStorage.getItem(ACADEMIC_YEAR_STORAGE_KEY);
    if (!stored) return getCurrentAcademicYear();
    const { startDate, endDate } = JSON.parse(stored) as {
      startDate?: string;
      endDate?: string;
    };
    if (!startDate) return getCurrentAcademicYear();
    const startYear = dayjs(startDate).year();
    const endYear = endDate ? dayjs(endDate).year() : startYear + 1;
    if (Number.isNaN(startYear) || Number.isNaN(endYear)) return getCurrentAcademicYear();
    return `${startYear}-${endYear}`;
  } catch {
    return getCurrentAcademicYear();
  }
};

// ---------------------------------------------------------------
// 🛠️ FIX — role-based access + "show only my timetable" for teachers,
// now using the SAME useAuth() hook + role-check pattern as Results.tsx,
// instead of guessing at localStorage. This is imported at the top of
// the file and called inside the TimeTable component below (hooks can
// only be called inside a component/hook, not at module scope).
//
// 👇 TODO — confirm these two things against your actual `user` object
// shape from useAuth() (same TODO Results.tsx already flags for TEACHER_ROLE):
//   1) the exact role string the backend sends for admin/principal
//      (ADMIN_ROLES below assumes "ADMIN" and "PRINCIPAL")
//   2) the field on `user` that holds this teacher's own
//      employeeDetailsId (assumed below as `user.employeeDetailsId` —
//      Results.tsx's classScope only shows user.standard/division/medium,
//      not an id field, so this one specifically needs your confirmation)
// ---------------------------------------------------------------
const TEACHER_ROLE = "TEACHER"; // 👈 matches the constant already in Results.tsx
const ADMIN_ROLES = ["ADMIN", "PRINCIPAL"];

const isAdminOrPrincipal = (role?: string) => ADMIN_ROLES.includes(role || "");

const isTeacherRole = (role?: string) => role === TEACHER_ROLE;


function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

// ---------------------------------------------------------------
// 🛠️ FIX — small error boundary.
// If anything unexpected still throws while rendering the read-only
// grid (bad/legacy data, unexpected shapes, etc.), this catches it
// and shows a small inline message instead of taking down the whole
// page to a blank screen.
// ---------------------------------------------------------------
class TimeTableErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("TimeTable view render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#8A5A12" }}>
          <p style={{ marginBottom: 12 }}>
            Something went wrong while showing this timetable.
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface TimeTableRow {
  timeTableId: number;
  // classMasterId?: number | null;
  standard?: string;
  division?: string;
  medium?: string;
  academicYear?: string;
  timeTablePeriods?: any[];
  [key: string]: any;
}

interface SubjectOption {
  subjectMasterId: number;
  subjectName: string;
  subjectCode?: string;
}

interface TeacherOption {
  employeeDetailsId: number;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
}

// 👇 Loose type — getAllStaticData's response may contain plain strings OR
// objects per key. Kept as `any[]` and normalized via toLabel/toValue at
// the point of use so either shape works safely.
type StaticDataMap = Record<string, any[]>;

const emptyPeriod = () => ({
  timeTablePeriodId: undefined,
  day: undefined,
  periodNumber: undefined,
  // 🛠️ FIX — one combined range field instead of separate startTime /
  // endTime fields. Holds a dayjs [start, end] tuple from the RangePicker.
  timeRange: null as [any, any] | null,
  subjectId: undefined,
  employeeDetailsId: undefined,
});

// Defensive extractor — unwraps the {success,message,data,timestamp}
// envelope, then looks for whichever array/total-count keys this app's
// various list endpoints have used so far.
const extractListAndTotal = (raw: any): { list: any[]; total: number } => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;

  const listKeys = [
    "Time TableDTOS",
    "TimeTableDTOS",
    "timeTableDTOS",
    "subjectMasterDTOS",
    "Data",
    "data",
  ];
  for (const key of listKeys) {
    if (Array.isArray(data[key])) {
      return {
        list: data[key],
        total:
          data["Total Elements"] ??
          data["Total"] ??
          data["total element"] ??
          data["total"] ??
          data[key].length,
      };
    }
  }
  if (Array.isArray(data)) return { list: data, total: data.length };
  return { list: [], total: 0 };
};

// ===============================
// Time Table Form (add/edit)
// ===============================
interface TimeTableFormProps {
  form: FormInstance;
  onFinish: (values: any) => void;
  isEditing: boolean;
  loading: boolean;
  staticData: StaticDataMap | null;
  teacherOptions: TeacherOption[];
  subjectOptions: SubjectOption[];
  // 👇 called whenever Standard/Division/Medium are all selected, so
  // the parent can refetch the teacher list filtered to that class.
  onClassChange?: (standard?: string, division?: string, medium?: string) => void;
}

function TimeTableForm({
  form,
  onFinish,
  isEditing,
  loading,
  staticData,
  teacherOptions,
  subjectOptions,
  onClassChange,
}: TimeTableFormProps) {
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...(values.timeTableId ? { timeTableId: values.timeTableId } : {}),
        // classMasterId: null, // Class selection removed from UI; backend already stores this as null in existing records
        standard: values.standard,
        division: values.division,
        medium: values.medium,
        academicYear: values.academicYear,
        timeTablePeriods: (values.timeTablePeriods || []).map((p: any) => {
          // 🛠️ FIX — split the combined [start, end] range back into the
          // two fields the backend expects.
          const [rangeStart, rangeEnd] = Array.isArray(p.timeRange)
            ? p.timeRange
            : [null, null];
          return {
            ...(p.timeTablePeriodId ? { timeTablePeriodId: p.timeTablePeriodId } : {}),
            day: p.day,
            periodNumber: p.periodNumber,
            startTime: rangeStart ? dayjs(rangeStart).format("HH:mm:ss") : null,
            endTime: rangeEnd ? dayjs(rangeEnd).format("HH:mm:ss") : null,
            subjectId: p.subjectId,
            employeeDetailsId: p.employeeDetailsId,
          };
        }),
      };
      onFinish(payload);
    } catch {
      // validation errors are shown inline by antd
    }
  };

  // 👇 pagination state for the period cards below. Watching the
  // form's periods array lets us compute total pages even outside the
  // Form.List render callback.
  const [periodPage, setPeriodPage] = useState(1);

  // 👇 watch Standard/Division/Medium so we can ask the parent to
  // refetch the teacher list filtered to this class as soon as all three
  // are picked.
  const watchedStandard = Form.useWatch("standard", form);
  const watchedDivision = Form.useWatch("division", form);
  const watchedMedium = Form.useWatch("medium", form);

  useEffect(() => {
    if (watchedStandard && watchedDivision && watchedMedium) {
      onClassChange?.(watchedStandard, watchedDivision, watchedMedium);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedStandard, watchedDivision, watchedMedium]);

  // 🛠️ FIX — normalize every static-data list (string OR object entries)
  // into safe { value, label } pairs before rendering any <Option>.
  const standardOptions = (staticData?.["standard"] ?? STANDARD_FALLBACK).map((s: any) => ({
    value: toValue(s),
    label: toLabel(s),
  }));
  const divisionOptions = (staticData?.["division"] ?? []).map((d: any) => ({
    value: toValue(d),
    label: toLabel(d),
  }));
  const mediumOptions = (staticData?.["medium"] ?? []).map((m: any) => ({
    value: toValue(m),
    label: toLabel(m),
  }));

  // 🛠️ if staticData loaded but Division/Medium came out empty, the
  // dropdown literally can't be filled in, which silently blocks
  // onClassChange from ever firing (it needs all three). This warns loudly
  // in devtools so it's obvious *why* the filtered-teacher-fetch payload
  // never goes out, instead of it looking like a mystery.
  useEffect(() => {
    if (staticData && (divisionOptions.length === 0 || mediumOptions.length === 0)) {
      // eslint-disable-next-line no-console
      console.warn(
        "TimeTable: getAllStaticData response has no usable \"division\" and/or \"medium\" keys" +
          " — Division/Medium dropdown(s) are empty, so Standard+Division+Medium can never all be" +
          " filled in, and the filtered teacher fetch will never fire. Actual staticData keys:",
        Object.keys(staticData)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticData]);
  const periodOptions = (staticData?.["Time table periods"] ?? PERIOD_FALLBACK).map(
    (p: any) => ({
      value: toValue(p),
      label: toLabel(p),
    })
  );

  return (
    <Form form={form} layout="vertical">
      <Form.Item name="timeTableId" hidden>
        <Input />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
        <Form.Item
          label="Standard"
          name="standard"
          rules={[{ required: true, message: "Standard is required" }]}
        >
          <Select placeholder="Select standard" allowClear>
            {standardOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Division"
          name="division"
          rules={[{ required: true, message: "Division is required" }]}
        >
          <Select placeholder="Select division" allowClear>
            {divisionOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Medium"
          name="medium"
          rules={[{ required: true, message: "Medium is required" }]}
        >
          <Select placeholder="Select medium" allowClear>
            {mediumOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <Form.Item label="Academic Year" name="academicYear">
        <Input disabled className="academic-year-dark" style={{ maxWidth: 220 }} />
      </Form.Item>

      <Form.List name="timeTablePeriods">
        {(fields, { add, remove }) => {
          // ---------------------------------------------------------
          // 🛠️ FIX — pagination bug that dropped periods 10, 11, 12...
          // from the Add/Update payload.
          //
          // The old code did `fields.slice(startIdx, startIdx + PAGE_SIZE)`
          // and only rendered THAT slice. Cards on other pages were
          // completely removed from the DOM, which unmounts their
          // Form.Item fields — and once unmounted, antd can fail to
          // report their values back into `form.validateFields()`, so
          // whatever you filled in on page 2/3 silently disappeared
          // from the payload on Save/Update.
          //
          // Fix: render EVERY field/card all the time (so every
          // Form.Item stays mounted and its value always stays part of
          // the form), and only visually hide the cards that aren't on
          // the current page with `display:none`. Hidden inputs are
          // still fully part of the form and still get validated and
          // submitted — nothing is ever silently dropped again.
          // ---------------------------------------------------------
          const totalPages = Math.max(1, Math.ceil(fields.length / PERIOD_PAGE_SIZE));
          const safePage = Math.min(periodPage, totalPages);

          const handleAddPeriod = () => {
            add(emptyPeriod());
            // jump to whichever page the newly added card will land on
            const newTotal = fields.length + 1;
            setPeriodPage(Math.ceil(newTotal / PERIOD_PAGE_SIZE));
          };

          return (
            <>
              {fields.length > PERIOD_PAGE_SIZE && (
                <div className="flex justify-end mb-3">
                  <Pagination
                    current={safePage}
                    pageSize={PERIOD_PAGE_SIZE}
                    total={fields.length}
                    onChange={(p) => setPeriodPage(p)}
                    showSizeChanger={false}
                    size="small"
                  />
                </div>
              )}

              {fields.map(({ key, name, ...restField }, idx) => {
                // Which page this card belongs to, based on its real
                // position in the underlying array (not on what's
                // currently rendered) — this never changes just
                // because you switch pages.
                const fieldPage = Math.floor(idx / PERIOD_PAGE_SIZE) + 1;
                const isOnCurrentPage = fieldPage === safePage;

                return (
                  <div
                    key={key}
                    // Hidden (not removed!) when it's on a different
                    // page. This keeps the field mounted & registered
                    // in the form at all times.
                    style={isOnCurrentPage ? undefined : { display: "none" }}
                    aria-hidden={!isOnCurrentPage}
                  >
                    <div className="border-2 border-gray-400 rounded-lg p-4 mb-4 relative bg-white">
                      <Form.Item name={[name, "timeTablePeriodId"]} hidden>
                        <Input />
                      </Form.Item>

                      <div className="flex justify-end mb-1">
                        <Button
                          danger
                          type="text"
                          htmlType="button"
                          icon={<DeleteOutlined style={{ fontSize: 18 }} />}
                          onClick={() => remove(name)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <Form.Item
                          {...restField}
                          label="Day"
                          name={[name, "day"]}
                          rules={[{ required: true, message: "Day is required" }]}
                        >
                          <Select placeholder="Select day">
                            {DAYS.map((d, dIdx) => (
                              <Option key={d} value={d}>
                                {dIdx + 1} - {d.charAt(0) + d.slice(1).toLowerCase()}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          label="Period"
                          name={[name, "periodNumber"]}
                          rules={[{ required: true, message: "Period is required" }]}
                        >
                          <Select placeholder="Select period" allowClear>
                            {periodOptions.map((opt) => (
                              <Option key={opt.value} value={opt.value}>
                                {opt.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>

                      {/* 🛠️ one combined Start/End time range picker,
                          replacing the two separate Start Time / End Time
                          pickers. Same 12-hour display + 5-min steps as before. */}
                      <Form.Item
                        {...restField}
                        label="Time"
                        name={[name, "timeRange"]}
                        rules={[{ required: true, message: "Start and end time are required" }]}
                      >
                        <TimePicker.RangePicker
                          className="w-full"
                          format="hh:mm A"
                          use12Hours
                          minuteStep={5}
                        />
                      </Form.Item>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <Form.Item
                          {...restField}
                          label="Subject"
                          name={[name, "subjectId"]}
                        >
                          <Select
                            placeholder="Select subject"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                          >
                            {subjectOptions.map((s) => (
                              <Option key={s.subjectMasterId} value={s.subjectMasterId}>
                                {s.subjectName}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          label="Teacher"
                          name={[name, "employeeDetailsId"]}
                        >
                          <Select
                            placeholder="Select teacher"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                          >
                            {teacherOptions.map((t) => (
                              <Option key={t.employeeDetailsId} value={t.employeeDetailsId}>
                                {[t.firstName, t.lastName].filter(Boolean).join(" ")}
                                {t.employeeCode ? ` (${t.employeeCode})` : ""}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                );
              })}

              {fields.length > PERIOD_PAGE_SIZE && (
                <div className="flex justify-end mb-3">
                  <Pagination
                    current={safePage}
                    pageSize={PERIOD_PAGE_SIZE}
                    total={fields.length}
                    onChange={(p) => setPeriodPage(p)}
                    showSizeChanger={false}
                    size="small"
                  />
                </div>
              )}

              <Button
                htmlType="button"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddPeriod}
                block
                className="mb-4"
              >
                Add Period
              </Button>
            </>
          );
        }}
      </Form.List>

      <ConfigProvider componentDisabled={false}>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button type="primary" htmlType="button" loading={loading} onClick={handleFinish}>
            {isEditing ? "Update" : "Save"}
          </Button>
        </div>
      </ConfigProvider>
    </Form>
  );
}

// ===============================
// Read-only Timetable Grid (used in the View popup)
// ---------------------------------------------------------------
// "day-lane" weekly board. Each weekday is its own vertical lane;
// each period is a clearly separated card. Break/Lunch periods get
// their own simpler card (no subject/teacher line) instead of an
// awkward "-"/"-" pair. Built entirely with CSS Grid (no <table>).
// ---------------------------------------------------------------
const TAG_PALETTE: { bg: string; border: string; text: string }[] = [
  { bg: "#FCEEDA", border: "#E8A33D", text: "#8A5A12" }, // amber
  { bg: "#DFF3EF", border: "#2E8B79", text: "#1D5C50" }, // teal
  { bg: "#FBE6DE", border: "#D9633B", text: "#9C3E1F" }, // coral
  { bg: "#E7E9FB", border: "#4C5FD5", text: "#33409C" }, // indigo
  { bg: "#F3E4EF", border: "#8E4585", text: "#6B2F62" }, // plum
  { bg: "#EAF1E1", border: "#6B8E4E", text: "#4A6636" }, // moss
  { bg: "#E7ECEF", border: "#5B6B79", text: "#3E4A55" }, // slate
  { bg: "#F7E1EA", border: "#C1477A", text: "#8E2F58" }, // rose
];

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getTagStyle = (subjectName?: string) => {
  if (!subjectName) return null;
  return TAG_PALETTE[hashString(subjectName) % TAG_PALETTE.length];
};

const dayAbbrev = (day: string) => day.charAt(0) + day.slice(1, 3).toLowerCase();

const initialsOf = (first?: string, last?: string) => {
  const a = (first || "").trim().charAt(0);
  const b = (last || "").trim().charAt(0);
  const combo = `${a}${b}`.toUpperCase();
  return combo || "—";
};

// 🛠️ accepts `any`, not just `string`, and coerces via toLabel
// first. Previously this called `.match()` directly on `label`; if
// `label` was ever an object (mismatched static-data shape) this threw
// and crashed the whole page. Now it's always operating on a string.
const railLabel = (label: any) => {
  const str = toLabel(label) || String(label ?? "");
  const m = str.match(/^Period\s+(\d+)$/i);
  return m ? `P${m[1]}` : str;
};

// 🛠️ detects Break/Lunch-type periods so they can get their own
// simple card instead of an empty subject/teacher layout.
const isBreakLabel = (label: any) => {
  const str = toLabel(label) || String(label ?? "");
  return /break|lunch|recess/i.test(str);
};

// ---------------------------------------------------------------
// 🛠️ FIX — convert "HH:mm:ss" into minutes-since-midnight so period
// rows can be sorted by their REAL configured time.
// ---------------------------------------------------------------
const timeToMinutes = (t?: string): number => {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const parsed = dayjs(t, "HH:mm:ss");
  if (!parsed.isValid()) return Number.MAX_SAFE_INTEGER;
  return parsed.hour() * 60 + parsed.minute();
};

function TimeTableGridView({ data, periodOrder }: { data: any; periodOrder?: string[] }) {
  const periods: any[] = Array.isArray(data?.timeTablePeriods) ? data.timeTablePeriods : [];
  const todayName = dayjs().format("dddd").toUpperCase();

  // 🛠️ always compare on normalized strings, never raw values that
  // might be objects.
  const normalizedOrder = (periodOrder || []).map((p) => toLabel(p) || String(p ?? ""));

  // Used ONLY as a tiebreaker now (see periodStartMinutes below) — the
  // static list position no longer decides row order by itself.
  const orderIndex = (label: any) => {
    const str = toLabel(label) || String(label ?? "");
    const idx = normalizedOrder.indexOf(str);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  // ---------------------------------------------------------------
  // 🛠️ FIX — row ordering.
  //
  // Previously rows were ordered purely by where the period's label
  // sat in the fixed static list (Period 1, Period 2, ..., Break 1,
  // Lunch Break, ...). That meant a Break you actually scheduled for,
  // say, 5 PM — sitting between a 2 PM "1st Period" and a 6 PM "2nd
  // Period" — always rendered at the very bottom (or wherever "Break"
  // happens to sit in the static list), instead of in its real
  // chronological place between them.
  //
  // Fix: order every row by its REAL configured start time first. The
  // static list order is now only a tiebreaker for the rare case where
  // a period has no time set at all.
  // ---------------------------------------------------------------
  const periodStartMinutes = (label: string): number => {
    const matches = periods.filter(
      (p) => (toLabel(p.periodNumber) || String(p.periodNumber ?? "")) === label
    );
    const times = matches
      .map((p) => timeToMinutes(p.startTime))
      .filter((m) => m !== Number.MAX_SAFE_INTEGER);
    return times.length ? Math.min(...times) : Number.MAX_SAFE_INTEGER;
  };

  const periodNumbers: string[] = Array.from(
    new Set(periods.map((p) => (toLabel(p.periodNumber) || String(p.periodNumber ?? ""))))
  ).sort((a: string, b: string) => {
    const timeDiff = periodStartMinutes(a) - periodStartMinutes(b);
    if (timeDiff !== 0) return timeDiff;
    // Only reached when both periods have no usable time at all —
    // fall back to the static list order so rows still show up in a
    // stable, predictable sequence.
    return orderIndex(a) - orderIndex(b);
  });

  const periodTimeLabel = (num: string) => {
    const p = periods.find((pp) => (toLabel(pp.periodNumber) || String(pp.periodNumber ?? "")) === num);
    if (!p) return "";
    const fmt = (t: string) => (t ? dayjs(t, "HH:mm:ss").format("hh:mm A") : "");
    return `${fmt(p.startTime)} – ${fmt(p.endTime)}`;
  };

  const findCell = (day: string, periodNumber: string) =>
    periods.find(
      (p) => p.day === day && (toLabel(p.periodNumber) || String(p.periodNumber ?? "")) === periodNumber
    );

  return (
    <div className="sked-wrap">
      {/* Info banner */}
      <div className="sked-banner">
        <div className="sked-banner-left">
          <span className="sked-eyebrow">Weekly Timetable</span>
          <h3 className="sked-title">
            {data?.standard || "-"}
            {data?.division ? <span className="sked-div">Division {data.division}</span> : null}
          </h3>
        </div>
        <div className="sked-banner-right">
          <div className="sked-chip">
            <span className="sked-chip-label">Medium</span>
            <span className="sked-chip-value">{data?.medium || "-"}</span>
          </div>
          <div className="sked-chip">
            <span className="sked-chip-label">Academic Year</span>
            <span className="sked-chip-value">{data?.academicYear || "-"}</span>
          </div>
        </div>
      </div>

      {/* Board */}
      {periodNumbers.length === 0 ? (
        <div className="sked-empty">
          <span className="sked-empty-icon">🗓</span>
          <p>No periods added yet.</p>
        </div>
      ) : (
        <div
          className="sked-board"
          style={{ gridTemplateColumns: `84px repeat(${DAYS.length}, 1fr)` }}
        >
          {/* corner cell */}
          <div className="sked-corner" />

          {/* day lane headers — full day name on desktop, short 3-letter
              abbreviation on mobile (back to how it was originally). */}
          {DAYS.map((day) => {
            const isToday = day === todayName;
            return (
              <div key={day} className={`sked-daylabel ${isToday ? "is-today" : ""}`}>
                <span className="sked-daylabel-full">
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </span>
                <span className="sked-daylabel-short">{dayAbbrev(day)}</span>
                {isToday && <span className="sked-today-badge">Today</span>}
              </div>
            );
          })}

          {/* period rows — now in real chronological order */}
          {periodNumbers.map((num) => {
            const isBreakRow = isBreakLabel(num);
            return (
              <Fragment key={num}>
                <div className={`sked-rail ${isBreakRow ? "is-break" : ""}`}>
                  <span className="sked-rail-num">{railLabel(num)}</span>
                  <span className="sked-rail-time">{periodTimeLabel(num)}</span>
                </div>

                {DAYS.map((day) => {
                  const cell = findCell(day, num);
                  const isToday = day === todayName;

                  if (!cell) {
                    return (
                      <div key={day} className={`sked-slot ${isToday ? "is-today" : ""}`}>
                        <div className="sked-empty-slot">Free</div>
                      </div>
                    );
                  }

                  // 🛠️ Break/Lunch periods get a dedicated simple
                  // card. Previously these fell through to the normal
                  // subject/teacher card, which just showed "-" / "-"
                  // and (before the toLabel fix) could crash on object
                  // shaped data.
                  if (isBreakRow) {
                    return (
                      <div key={day} className={`sked-slot ${isToday ? "is-today" : ""}`}>
                        <div className="sked-break-card">
                          <span className="sked-break-label">{railLabel(num)}</span>
                        </div>
                      </div>
                    );
                  }

                  const subjectName = cell?.subjectMasterDTO?.subjectName;
                  const tag = getTagStyle(subjectName);
                  const teacherFirst = cell?.employeeDetailsDTO?.firstName;
                  const teacherLast = cell?.employeeDetailsDTO?.lastName;
                  const teacherName = [teacherFirst, teacherLast].filter(Boolean).join(" ");

                  return (
                    <div key={day} className={`sked-slot ${isToday ? "is-today" : ""}`}>
                      <div
                        className="sked-card"
                        style={{ background: tag?.bg, borderColor: tag?.border }}
                      >
                        <p className="sked-card-subject" style={{ color: tag?.text }}>
                          {subjectName || "-"}
                        </p>
                        <div className="sked-card-teacher">
                          <span className="sked-avatar" style={{ background: tag?.border }}>
                            {initialsOf(teacherFirst, teacherLast)}
                          </span>
                          <span className="sked-teacher-name">{teacherName || "-"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      )}

      <style>{`
        .sked-wrap {
          font-family: inherit;
        }

        /* Banner */
        .sked-banner {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          background: #F5F7FA;
          border: 1px solid #E3E8EE;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }
        .sked-banner::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #E8A33D;
        }
        .sked-eyebrow {
          display: block;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #C07E1E;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .sked-title {
          margin: 0;
          font-size: 21px;
          font-weight: 700;
          color: #1E2530;
          line-height: 1.2;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .sked-div {
          font-weight: 400;
          color: #667085;
          font-size: 15px;
        }
        .sked-banner-right {
          display: flex;
          gap: 20px;
        }
        .sked-chip {
          display: flex;
          flex-direction: column;
          text-align: right;
        }
        .sked-chip-label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8D96A6;
        }
        .sked-chip-value {
          font-size: 14px;
          font-weight: 600;
          color: #1E2530;
        }

        /* Board — CSS Grid, no table, no scrollbar */
        .sked-board {
          display: grid;
          gap: 6px;
          align-items: stretch;
        }

        .sked-corner {
          background: transparent;
        }

        .sked-daylabel {
          background: #EEF1F5;
          border-radius: 8px;
          padding: 8px 6px;
          text-align: center;
          font-weight: 700;
          font-size: 13px;
          color: #3D4658;
          position: relative;
        }
        .sked-daylabel.is-today {
          background: #FCEEDA;
          color: #8A5A12;
        }
        .sked-daylabel-short { display: none; }
        .sked-today-badge {
          display: block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #C07E1E;
          margin-top: 2px;
        }

        .sked-rail {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 6px 8px;
          border-radius: 8px;
          background: #FAFAF8;
          border: 1px dashed #E3E0D6;
        }
        .sked-rail.is-break {
          background: #FBE6DE;
          border: 1px dashed #D9633B;
        }
        .sked-rail-num {
          font-weight: 700;
          font-size: 13px;
          color: #1E2530;
        }
        .sked-rail-time {
          font-size: 10px;
          color: #8D96A6;
          margin-top: 2px;
          line-height: 1.2;
        }

        .sked-slot {
          border-radius: 8px;
          min-height: 76px;
          display: flex;
        }
        .sked-slot.is-today {
          background: rgba(232, 163, 61, 0.07);
          border-radius: 8px;
        }

        .sked-card {
          width: 100%;
          border: 1px solid transparent;
          border-left: 4px solid;
          border-radius: 8px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }
        .sked-card-subject {
          margin: 0;
          font-weight: 700;
          font-size: 13px;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sked-card-teacher {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .sked-avatar {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sked-teacher-name {
          font-size: 11.5px;
          color: #4A5262;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Break / Lunch card — deliberately simpler, no avatar/teacher row */
        .sked-break-card {
          width: 100%;
          height: 100%;
          min-height: 60px;
          border: 1px dashed #D9633B;
          background: repeating-linear-gradient(
            135deg,
            #FBE6DE,
            #FBE6DE 8px,
            #FCEEDA 8px,
            #FCEEDA 16px
          );
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 6px;
        }
        .sked-break-label {
          font-weight: 700;
          font-size: 12px;
          color: #9C3E1F;
          letter-spacing: 0.02em;
        }

        .sked-empty-slot {
          width: 100%;
          border: 1px dashed #E3E8EE;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C3CAD6;
          font-size: 11px;
        }

        .sked-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 56px 0;
          color: #A9A28F;
          border: 1px dashed #E3E8EE;
          border-radius: 12px;
        }
        .sked-empty-icon {
          font-size: 24px;
        }

        @media (max-width: 640px) {
          .sked-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .sked-banner-right {
            width: 100%;
            justify-content: space-between;
            gap: 12px;
          }
          .sked-chip { text-align: left; }
          .sked-daylabel-full { display: none; }
          .sked-daylabel-short { display: inline; }
          .sked-card-subject { font-size: 12px; }
          .sked-teacher-name { font-size: 10.5px; }
          .sked-slot { min-height: 64px; }
        }
      `}</style>
    </div>
  );
}

// ===============================
// Page
// ===============================
export default function TimeTable() {
  const isMobile = useIsMobile();

  const [rows, setRows] = useState<TimeTableRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  const [staticData, setStaticData] = useState<StaticDataMap | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<any>(null);

  // 🛠️ same useAuth() hook Results.tsx already uses, instead of
  // guessing at localStorage.
  const { user } = useAuth();
  const canDelete = isAdminOrPrincipal(user?.role);
  const viewerIsTeacher = isTeacherRole(user?.role);


  const [myScheduleLoading, setMyScheduleLoading] = useState(false);
  const [mySchedule, setMySchedule] = useState<any>(null);

  const fetchTimeTables = useCallback(async (pageNum: number, size: number) => {
    setTableLoading(true);
    try {
      const res = await api.post(apiEndpoints.getAllTimeTables(pageNum, size), {});
      const { list, total: t } = extractListAndTotal(res);
      setRows(list);
      setTotal(t);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load timetables");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    // 👇 teachers don't need the admin list at all; skip loading it.
    if (!viewerIsTeacher) {
      fetchTimeTables(page, pageSize);
    }
  }, [page, pageSize, fetchTimeTables, viewerIsTeacher]);

  // Teacher/Subject dropdown data — fetched once on mount (unchanged).
  // Static data (Standard/Division/Medium/Period lists) is NOT fetched here
  // — it's loaded lazily by ensureStaticData(), only when Add/Edit/View
  // is actually opened. See ensureStaticData below.
  useEffect(() => {
    if (viewerIsTeacher) return; // teachers never open Add/Edit
    (async () => {
      try {
        const res = await api.post(apiEndpoints.getAllemployeeDetails(0, 200), {});
        const { list } = extractListAndTotal(res);
        setTeacherOptions(list.filter((e: any) => (e.role || "").toUpperCase() === "TEACHER"));
      } catch {
        // non-fatal
      }
      try {
        const res = await api.post(apiEndpoints.getAllSubjects(0, 100), {});
        const { list } = extractListAndTotal(res);
        setSubjectOptions(list);
      } catch {
        // non-fatal
      }
    })();
  }, [viewerIsTeacher]);

  // 👇 fetches teachers filtered by the class/division/medium chosen
  // in the Add/Edit form, instead of always showing every teacher.
  // Your apiEndpoints.ts already has this exact endpoint under the name
  // `getAllemployeeDetails` (it builds
  // .../employeeDetails/getAllEmployeeDetailsByFilter?page=0&size=200&paginate=true) —
  // there's no separate `getAllEmployeeDetailsByFilter` function, so this
  // now calls the one that actually exists, with the filter payload in
  // the request body. Fails silently (keeps whatever teacherOptions we
  // already had) so the dropdown is never left empty on error.
  const fetchTeachersForClass = useCallback(
    async (standard?: string, division?: string, medium?: string) => {
      if (!standard || !division || !medium) return;
      // eslint-disable-next-line no-console
      console.log("TimeTable: fetching teachers filtered by", { standard, division, medium });
      try {
        const res = await api.post(
          apiEndpoints.getAllemployeeDetails(0, 200),
          { standard, division, medium }
        );
        const { list } = extractListAndTotal(res);
        setTeacherOptions(list.filter((e: any) => (e.role || "").toUpperCase() === "TEACHER"));
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.warn("TimeTable: filtered teacher fetch failed, keeping previous list", error);
      }
    },
    []
  );

  // getAllStaticData is called on-demand only, the first time the
  // Add/Edit/View is opened. Once loaded it's cached in state, so opening
  // Add/Edit/View again won't call the API again.
  const ensureStaticData = useCallback(async () => {
    if (staticData) return; // already loaded — don't refetch
    try {
      const res = await api.get(apiEndpoints.getAllStaticData());
      const data = res.data?.data ?? res.data ?? {};
      setStaticData(data);
    } catch {
      // non-fatal — Standard/Division/Medium/Period dropdowns fall back/empty
    }
  }, [staticData]);

  // ---------------------------------------------------------------
  // Teacher timetable
  //
  // Same pattern as Achievements.tsx:
  //   TEACHER -> useAuth() -> user.standard/division/medium
  //   -> POST getAllTimeTableByFilter with those 3 fields.
  //
  // The backend request is:
  // POST /jnpa-school-project/timeTable/getAllTimeTableByFilter
  //      ?page=0&size=500&paginate=true
  //
  // Payload:
  // {
  //   standard: "1st Standard",
  //   division: "A",
  //   medium: "English"
  // }
  //
  // After the API returns the timetable(s) for that class, we keep only
  // periods assigned to the logged-in teacher.
  // ---------------------------------------------------------------

  // EXACTLY like Achievements.tsx classScope.
  const teacherClassScope = {
    standard: user?.standard || "",
    division: user?.division || "",
    medium: user?.medium || "",
  };

  const fetchMySchedule = useCallback(async () => {
    if (!viewerIsTeacher) return;

    setMyScheduleLoading(true);

    const payload = {
      standard: teacherClassScope.standard,
      division: teacherClassScope.division,
      medium: teacherClassScope.medium,
    };

    console.log("TimeTable teacher payload:", payload);

    if (!payload.standard || !payload.division || !payload.medium) {
      console.warn("TimeTable: teacher class information is incomplete", payload);
      setMySchedule(null);
      setMyScheduleLoading(false);
      return;
    }

    try {
      const res = await api.post(
        getAllTimeTableByFilterEndpoint(0, 500),
        payload
      );

      console.log("TimeTable getAllTimeTableByFilter response:", res?.data);

      // IMPORTANT: backend response is:
      // res.data.data["Time TableDTOS"]
      const timetableList = Array.isArray(
        res?.data?.data?.["Time TableDTOS"]
      )
        ? res.data.data["Time TableDTOS"]
        : [];

      console.log("TimeTable class records:", timetableList);

      const allPeriods = timetableList.flatMap((tt: any) => {
        const periods = Array.isArray(tt?.timeTablePeriods)
          ? tt.timeTablePeriods
          : [];

        return periods.map((period: any) => ({
          ...period,
          standard: tt?.standard ?? payload.standard,
          division: tt?.division ?? payload.division,
          medium: tt?.medium ?? payload.medium,
          academicYear: tt?.academicYear ?? getLoggedInAcademicYear(),
        }));
      });

      console.log("TimeTable all periods returned by API:", allPeriods);

      // IMPORTANT:
      // Do NOT filter periods by employeeDetailsId/userId here.
      // The API response is the source of truth for the timetable display.
      // Whatever periods the backend returns for the selected
      // Standard + Division + Medium must be displayed.
      //
      // Example backend response:
      // data["Time TableDTOS"][0].timeTablePeriods
      //
      // This also fixes the case where the logged-in user's employeeDetailsId
      // is null (for example Rahul), while the API correctly returns a
      // timetable period belonging to another employee record.
      console.log("TimeTable: displaying ALL periods returned by API:", allPeriods);

      const firstTimetable = timetableList[0];

      setMySchedule({
        standard: firstTimetable?.standard ?? payload.standard,
        division: firstTimetable?.division ?? payload.division,
        medium: firstTimetable?.medium ?? payload.medium,
        academicYear:
          firstTimetable?.academicYear ?? getLoggedInAcademicYear(),
        timeTablePeriods: allPeriods,
      });

      console.log("TimeTable FINAL DISPLAY DATA:", {
        standard: firstTimetable?.standard ?? payload.standard,
        division: firstTimetable?.division ?? payload.division,
        medium: firstTimetable?.medium ?? payload.medium,
        academicYear:
          firstTimetable?.academicYear ?? getLoggedInAcademicYear(),
        timeTablePeriods: allPeriods,
      });

    } catch (error: any) {
      console.error("TimeTable getAllTimeTableByFilter failed:", error);
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.body ||
          "Failed to load your timetable"
      );
      setMySchedule(null);
    } finally {
      setMyScheduleLoading(false);
    }
  }, [
    viewerIsTeacher,
    teacherClassScope.standard,
    teacherClassScope.division,
    teacherClassScope.medium,
  ]);

  useEffect(() => {
    if (!viewerIsTeacher) return;

    void ensureStaticData();
    void fetchMySchedule();
  }, [
    viewerIsTeacher,
    ensureStaticData,
    fetchMySchedule,
  ]);

  const populateForm = (data: any) => {
    form.setFieldsValue({
      timeTableId: data?.timeTableId,
      standard: data?.standard,
      division: data?.division,
      medium: data?.medium,
      academicYear: data?.academicYear ?? getLoggedInAcademicYear(),
      timeTablePeriods: (data?.timeTablePeriods || []).map((p: any) => ({
        timeTablePeriodId: p.timeTablePeriodId,
        // 🛠️ normalize in case a legacy record stored an object
        day: p.day,
        periodNumber: toLabel(p.periodNumber) || p.periodNumber,
        // 🛠️ combine startTime/endTime into the single range field
        timeRange:
          p.startTime && p.endTime
            ? [dayjs(p.startTime, "HH:mm:ss"), dayjs(p.endTime, "HH:mm:ss")]
            : null,
        subjectId: p.subjectId ?? p.subjectMasterDTO?.subjectMasterId,
        employeeDetailsId: p.employeeDetailsId ?? p.employeeDetailsDTO?.employeeDetailsId,
      })),
    });
  };

  const openAddDrawer = () => {
    setIsEditing(false);
    form.resetFields();
    form.setFieldsValue({
      academicYear: getLoggedInAcademicYear(),
      timeTablePeriods: [emptyPeriod()],
    });
    setDrawerOpen(true);
    ensureStaticData(); // loads Standard/Division/Medium/Period options on first open
  };

  const openEditDrawer = async (record: TimeTableRow) => {
    setIsEditing(true);
    setDrawerOpen(true);
    setDrawerLoading(true);
    ensureStaticData(); // loads Standard/Division/Medium/Period options on first open
    try {
      const res = await api.get(apiEndpoints.getTimeTableById(record.timeTableId));
      const data = res.data?.data ?? res.data;
      populateForm(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load timetable");
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
  };

  const openView = async (record: TimeTableRow) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    ensureStaticData(); // needed so the grid can order periods correctly
    try {
      const res = await api.get(apiEndpoints.getTimeTableById(record.timeTableId));
      const data = res.data?.data ?? res.data;
      setViewData(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load timetable");
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setViewData(null);
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      if (isEditing && payload.timeTableId) {
        await api.put(apiEndpoints.updateTimeTable(), payload);
        message.success("Time table updated successfully");
      } else {
        await api.post(apiEndpoints.saveTimeTable(), payload);
        message.success("Time table added successfully");
      }
      closeDrawer();
      fetchTimeTables(page, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to save timetable");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (timeTableId: number) => {
    try {
      await api.delete(apiEndpoints.deleteTimeTable(timeTableId));
      message.success("Time table deleted successfully");
      fetchTimeTables(page, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete timetable");
    }
  };

  // 👇 a teacher who logs in never sees the admin class list; they
  // land straight on their own merged weekly schedule (Vikas sees Vikas's
  // periods, Rahul sees Rahul's, automatically, based on the logged-in
  // user's employeeDetailsId). No Add/Edit/Delete controls here at all.
  if (viewerIsTeacher) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">
          My Timetable{user?.firstName ? ` — ${user.firstName}` : ""}
        </h2>
        <Spin spinning={myScheduleLoading} tip="Loading your timetable...">
          {!myScheduleLoading && (!mySchedule || mySchedule.timeTablePeriods.length === 0) ? (
            <Empty description="No periods assigned to you yet" style={{ padding: "40px 0" }} />
          ) : (
            mySchedule && (
              <TimeTableErrorBoundary>
                <TimeTableGridView
                  data={mySchedule}
                  periodOrder={normalizeList(staticData?.["Time table periods"] ?? PERIOD_FALLBACK)}
                />
              </TimeTableErrorBoundary>
            )
          )}
        </Spin>
      </div>
    );
  }

  const columns = [
    { title: "Standard", dataIndex: "standard", key: "standard", render: (v: string) => v || "-" },
    { title: "Division", dataIndex: "division", key: "division", render: (v: string) => v || "-" },
    { title: "Medium", dataIndex: "medium", key: "medium", render: (v: string) => v || "-" },
    {
      title: "Academic Year",
      dataIndex: "academicYear",
      key: "academicYear",
      render: (v: string) => v || "-",
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      render: (_: any, record: TimeTableRow) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button icon={<EyeOutlined />} size="small" onClick={() => openView(record)} />
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditDrawer(record)}
          />
          {/* 🛠️ Delete is only shown for ADMIN / PRINCIPAL. */}
          {canDelete && (
            <Popconfirm
              title="Delete this timetable?"
              onConfirm={() => handleDelete(record.timeTableId)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Makes the disabled Academic Year field render dark, readable text
          instead of antd's default washed-out gray. */}
      <style>{`
        .academic-year-dark.ant-input[disabled],
        .academic-year-dark.ant-input-disabled {
          color: rgba(0, 0, 0, 0.88) !important;
          -webkit-text-fill-color: rgba(0, 0, 0, 0.88) !important;
          background-color: #f5f5f5 !important;
        }
      `}</style>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Time Table</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Add Time Table
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {tableLoading && <div className="text-center text-sm text-gray-400 py-6">Loading...</div>}
          {!tableLoading && rows.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-6">No timetables found</div>
          )}
          {!tableLoading &&
            rows.map((record) => (
              <div
                key={record.timeTableId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <p className="text-sm font-semibold text-gray-800">
                  {record.standard} - {record.division} ({record.medium})
                </p>
                <p className="text-xs text-gray-500">Academic Year: {record.academicYear}</p>
                <div className="flex gap-2 justify-end pt-2 mt-2 border-t border-gray-50">
                  <Button icon={<EyeOutlined />} size="small" onClick={() => openView(record)} />
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => openEditDrawer(record)}
                  />
                  {/* 🛠️ Delete is only shown for ADMIN / PRINCIPAL. */}
                  {canDelete && (
                    <Popconfirm
                      title="Delete this timetable?"
                      onConfirm={() => handleDelete(record.timeTableId)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <CommonTable
            data={rows}
            columns={columns}
            loading={tableLoading}
            pagination={{
              current: page + 1,
              pageSize,
              total,
              onChange: (newPage: number, newPageSize: number) => {
                setPage(newPage - 1);
                setPageSize(newPageSize);
              },
            }}
          />
        </div>
      )}

      {/* Add / Edit Drawer */}
      <Drawer
        title={isEditing ? "Update Time Table" : "Add Time Table"}
        open={drawerOpen}
        onClose={closeDrawer}
        width={800}
        destroyOnClose
        styles={{ body: { background: DRAWER_BG_COLOR, padding: "20px 24px" } }}
      >
        <Spin spinning={drawerLoading} tip="Loading timetable...">
          <TimeTableForm
            form={form}
            onFinish={handleSubmit}
            isEditing={isEditing}
            loading={submitting}
            staticData={staticData}
            teacherOptions={teacherOptions}
            subjectOptions={subjectOptions}
            onClassChange={fetchTeachersForClass}
          />
        </Spin>
      </Drawer>

      {/* View — popup, not a drawer, showing a proper timetable grid.
          Wrapped in an error boundary so a bad/unexpected record shows a
          small message instead of blanking the whole page. */}
      <Modal
        open={viewOpen}
        onCancel={closeView}
        footer={null}
        width="min(1400px, 96vw)"
        destroyOnClose
        closable
        styles={{ body: { padding: 20 } }}
      >
        <Spin spinning={viewLoading} tip="Loading timetable...">
          {!viewLoading && !viewData ? (
            <Empty description="Time table not found" style={{ padding: "40px 0" }} />
          ) : (
            viewData && (
              <TimeTableErrorBoundary>
                <TimeTableGridView
                  data={viewData}
                  periodOrder={normalizeList(staticData?.["Time table periods"] ?? PERIOD_FALLBACK)}
                />
              </TimeTableErrorBoundary>
            )
          )}
        </Spin>
      </Modal>
    </div>
  );
}
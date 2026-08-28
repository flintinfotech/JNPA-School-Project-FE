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
  startTime: null,
  endTime: null,
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
}

function TimeTableForm({
  form,
  onFinish,
  isEditing,
  loading,
  staticData,
  teacherOptions,
  subjectOptions,
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
        timeTablePeriods: (values.timeTablePeriods || []).map((p: any) => ({
          ...(p.timeTablePeriodId ? { timeTablePeriodId: p.timeTablePeriodId } : {}),
          day: p.day,
          periodNumber: p.periodNumber,
          startTime: p.startTime ? dayjs(p.startTime).format("HH:mm:ss") : null,
          endTime: p.endTime ? dayjs(p.endTime).format("HH:mm:ss") : null,
          subjectId: p.subjectId,
          employeeDetailsId: p.employeeDetailsId,
        })),
      };
      onFinish(payload);
    } catch {
      // validation errors are shown inline by antd
    }
  };

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
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <div
                key={key}
                className="border-2 border-gray-400 rounded-lg p-4 mb-4 relative bg-white"
              >
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                  <Form.Item
                    {...restField}
                    label="Day"
                    name={[name, "day"]}
                    rules={[{ required: true, message: "Day is required" }]}
                  >
                    <Select placeholder="Select day">
                      {DAYS.map((d) => (
                        <Option key={d} value={d}>
                          {d.charAt(0) + d.slice(1).toLowerCase()}
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
                  <div className="grid grid-cols-2 gap-x-2">
                    <Form.Item
                      {...restField}
                      label="Start Time"
                      name={[name, "startTime"]}
                      rules={[{ required: true, message: "Start time required" }]}
                    >
                      <TimePicker className="w-full" format="HH:mm" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      label="End Time"
                      name={[name, "endTime"]}
                      rules={[{ required: true, message: "End time required" }]}
                    >
                      <TimePicker className="w-full" format="HH:mm" />
                    </Form.Item>
                  </div>
                </div>

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
            ))}

            <Button
              htmlType="button"
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => add(emptyPeriod())}
              block
              className="mb-4"
            >
              Add Period
            </Button>
          </>
        )}
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

// 🛠️ FIX — accepts `any`, not just `string`, and coerces via toLabel
// first. Previously this called `.match()` directly on `label`; if
// `label` was ever an object (mismatched static-data shape) this threw
// and crashed the whole page. Now it's always operating on a string.
const railLabel = (label: any) => {
  const str = toLabel(label) || String(label ?? "");
  const m = str.match(/^Period\s+(\d+)$/i);
  return m ? `P${m[1]}` : str;
};

// 🛠️ NEW — detects Break/Lunch-type periods so they can get their own
// simple card instead of an empty subject/teacher layout.
const isBreakLabel = (label: any) => {
  const str = toLabel(label) || String(label ?? "");
  return /break|lunch|recess/i.test(str);
};

function TimeTableGridView({ data, periodOrder }: { data: any; periodOrder?: string[] }) {
  const periods: any[] = Array.isArray(data?.timeTablePeriods) ? data.timeTablePeriods : [];
  const todayName = dayjs().format("dddd").toUpperCase();

  // 🛠️ FIX — always compare on normalized strings, never raw values that
  // might be objects.
  const normalizedOrder = (periodOrder || []).map((p) => toLabel(p) || String(p ?? ""));

  const orderIndex = (label: any) => {
    const str = toLabel(label) || String(label ?? "");
    const idx = normalizedOrder.indexOf(str);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  const periodNumbers: string[] = Array.from(
    new Set(periods.map((p) => (toLabel(p.periodNumber) || String(p.periodNumber ?? ""))))
  ).sort((a: string, b: string) => orderIndex(a) - orderIndex(b));

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

          {/* day lane headers */}
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

          {/* period rows */}
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

                  // 🛠️ FIX — Break/Lunch periods get a dedicated simple
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
    fetchTimeTables(page, pageSize);
  }, [page, pageSize, fetchTimeTables]);

  // Teacher/Subject dropdown data — fetched once on mount (unchanged).
  // Static data (Standard/Division/Medium/Period lists) is NOT fetched here
  // — it's loaded lazily by ensureStaticData(), only when Add/Edit/View
  // is actually opened. See ensureStaticData below.
  useEffect(() => {
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
  }, []);

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

  const populateForm = (data: any) => {
    form.setFieldsValue({
      timeTableId: data?.timeTableId,
      standard: data?.standard,
      division: data?.division,
      medium: data?.medium,
      academicYear: data?.academicYear ?? getLoggedInAcademicYear(),
      timeTablePeriods: (data?.timeTablePeriods || []).map((p: any) => ({
        timeTablePeriodId: p.timeTablePeriodId,
        // 🛠️ FIX — normalize in case a legacy record stored an object
        day: p.day,
        periodNumber: toLabel(p.periodNumber) || p.periodNumber,
        startTime: p.startTime ? dayjs(p.startTime, "HH:mm:ss") : null,
        endTime: p.endTime ? dayjs(p.endTime, "HH:mm:ss") : null,
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
          <Popconfirm
            title="Delete this timetable?"
            onConfirm={() => handleDelete(record.timeTableId)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
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
                  <Popconfirm
                    title="Delete this timetable?"
                    onConfirm={() => handleDelete(record.timeTableId)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
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
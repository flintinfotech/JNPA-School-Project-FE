import React, { useState, useEffect, useCallback, useRef, Fragment } from "react";
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
const getAllTimeTableByFilterEndpoint = (page: number, size: number) =>
  `/jnpa-school-project/timeTable/getAllTimeTableByFilter?page=${page}&size=${size}&paginate=true`;

// how many period cards show per page inside Add/Edit (within one day tab).
const PERIOD_PAGE_SIZE = 12;

// ---------------------------------------------------------------
// 🆕 API RESPONSE / VALIDATION HELPERS
//
// The backend response format changed. Instead of showing our own
// hard-coded messages, the screen now shows WHATEVER the API says and
// sets it on the matching form field where possible.
//
// These helpers read the validation text defensively from every
// shape a Spring-style backend normally uses:
//   { success:false, message:"...", data:null }
//   { message:"...", body:"..." }
//   { errors:[ "...", { field:"standard", message:"..." } ] }
//   { data:{ standard:"Standard is required",
//            "timeTablePeriods[0].day":"Day is required" } }
//   { data:"Teacher already assigned in this slot" }
//
// 👇 If your new response uses a key that is not covered here, add it
//    to LIST_KEYS (array/object of errors) or MESSAGE_KEYS (plain text).
// ---------------------------------------------------------------
const LIST_KEYS = ["errors", "fieldErrors", "validationErrors", "violations"];
const MESSAGE_KEYS = ["message", "body", "error", "msg", "detail"];

// fields in this form that an API validation key can be attached to
const FORM_TOP_FIELDS = [
  "standard",
  "division",
  "medium",
  "academicYear",
  "timeTablePeriods",
];

interface ApiIssue {
  field?: string;
  text: string;
}

// "timeTablePeriods[0].day" / "timeTablePeriods.0.day" -> ["timeTablePeriods", 0, "day"]
const normalizeApiPath = (key: string): (string | number)[] =>
  key
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
    .map((s) => (/^\d+$/.test(s) ? Number(s) : s));

// The backend's own message — this is what the user must see.
// e.g. { success:false, message:"Time conflict found on MONDAY ...",
//        errorCode:"409 CONFLICT", details:"CustomException(...)" }
// `details` / `errorCode` / `timestamp` are technical and are NOT shown.
const pickApiMessage = (body: any): string => {
  if (!body) return "";
  if (typeof body === "string") return body.trim();
  for (const k of MESSAGE_KEYS) {
    const v = body[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  if (typeof body.data === "string" && body.data.trim()) return body.data.trim();
  return "";
};

// Optional field-level validation (errors[] / { field: "msg" } map) so it
// can also be set under the matching form field.
const extractFieldIssues = (body: any): ApiIssue[] => {
  const issues: ApiIssue[] = [];
  if (!body || typeof body !== "object") return issues;

  const addFrom = (value: any, field?: string) => {
    if (value === null || value === undefined) return;
    if (typeof value === "string") {
      if (value.trim()) issues.push({ field, text: value });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") {
          addFrom(item, field);
        } else if (item && typeof item === "object") {
          const f = item.field ?? item.fieldName ?? item.name ?? item.property;
          const t = item.message ?? item.defaultMessage ?? item.error;
          if (t) issues.push({ field: f ?? field, text: String(t) });
        }
      });
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([k, v]) => addFrom(v, k));
    }
  };

  LIST_KEYS.forEach((k) => addFrom(body[k]));
  if (body.data && typeof body.data === "object") addFrom(body.data);
  return issues;
};

// Some backends send HTTP 200 with { success:false, message:"..." }.
// Treat that as a failure so the real message is shown, not "success".
const assertApiSuccess = (res: any) => {
  if (res?.data?.success === false) {
    throw { response: { data: res.data } };
  }
};

// Plain text of the API's message (for success toasts etc.)
const getApiMessage = (res: any, fallback: string): string =>
  pickApiMessage(res?.data) || fallback;

// Works whether axios gives error.response.data (normal) or your axios
// interceptor already rejects with the body / a custom object.
const getErrorBody = (error: any): any =>
  error?.response?.data ??
  error?.data ??
  (error && typeof error === "object" && error.success === false ? error : undefined);

// Shows the backend message exactly as sent (create / update / delete /
// load — every case), and sets any field-specific validation on the form.
const showApiError = (error: any, fallback: string, form?: FormInstance) => {
  const body = getErrorBody(error);
  const apiMessage = pickApiMessage(body);
  const fieldIssues = extractFieldIssues(body);

  if (form) {
    const fieldErrors = fieldIssues
      .filter((i) => i.field)
      .map((i) => ({ name: normalizeApiPath(i.field as string), text: i.text }))
      .filter((i) => FORM_TOP_FIELDS.includes(String(i.name[0])))
      .map((i) => ({ name: i.name, errors: [i.text] }));
    if (fieldErrors.length > 0) {
      form.setFields(fieldErrors);
    }
  }

  const lines = Array.from(
    new Set(
      [apiMessage, ...fieldIssues.map((i) => i.text)].filter(
        (t): t is string => !!t,
      ),
    ),
  );
  if (lines.length === 0) {
    // no backend message at all (e.g. network down) — last-resort text
    lines.push(error?.message || fallback);
  }

  message.error({
    content: (
      <div style={{ textAlign: "left" }}>
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    ),
    duration: 6,
  });
};

// ---------------------------------------------------------------
// static-data normalization helpers (string OR object entries)
// ---------------------------------------------------------------
const toLabel = (item: any): string => {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);
  return String(
    item.label ?? item.name ?? item.periodName ?? item.title ?? item.value ?? "",
  );
};

const toValue = (item: any): string => {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);
  return String(
    item.value ?? item.label ?? item.name ?? item.periodName ?? item.id ?? "",
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
// role-based access (same useAuth() pattern as Results.tsx)
//
// 👇 TODO — confirm against your actual `user` object from useAuth():
//   1) the exact role strings for admin/principal
//   2) the field holding the teacher's own employeeDetailsId
// ---------------------------------------------------------------
const TEACHER_ROLE = "TEACHER";
const ADMIN_ROLES = ["ADMIN", "PRINCIPAL"];

const isAdminOrPrincipal = (role?: string) => ADMIN_ROLES.includes(role || "");

const isTeacherRole = (role?: string) => role === TEACHER_ROLE;

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

// ---------------------------------------------------------------
// small error boundary so bad data can't blank the whole page
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

type StaticDataMap = Record<string, any[]>;

const emptyPeriod = (day?: string) => ({
  timeTablePeriodId: undefined,
  day,
  periodNumber: undefined,
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
    if (Array.isArray(data?.[key])) {
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
  onTeacherDropdownOpen?: () => void;
}

function TimeTableForm({
  form,
  onFinish,
  isEditing,
  loading,
  staticData,
  teacherOptions,
  subjectOptions,
  onTeacherDropdownOpen,
}: TimeTableFormProps) {
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...(values.timeTableId ? { timeTableId: values.timeTableId } : {}),
        standard: values.standard,
        division: values.division,
        medium: values.medium,
        academicYear: values.academicYear,
        timeTablePeriods: (values.timeTablePeriods || []).map((p: any) => {
          // split the combined [start, end] range back into the two
          // fields the backend expects.
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

  // Day tabs (Mon..Sat) + a secondary within-a-day page (only if a
  // single day has more than PERIOD_PAGE_SIZE periods).
  const [activeDayTab, setActiveDayTab] = useState<string>(DAYS[0]);
  const [periodPage, setPeriodPage] = useState(1);

  useEffect(() => {
    setPeriodPage(1);
  }, [activeDayTab]);

  // watch every period's value so tab membership + badge counts are live
  const watchedPeriods = (Form.useWatch("timeTablePeriods", form) as any[]) || [];

  const standardOptions = (staticData?.["standard"] ?? STANDARD_FALLBACK).map(
    (s: any) => ({
      value: toValue(s),
      label: toLabel(s),
    }),
  );
  const divisionOptions = (staticData?.["division"] ?? []).map((d: any) => ({
    value: toValue(d),
    label: toLabel(d),
  }));
  const mediumOptions = (staticData?.["medium"] ?? []).map((m: any) => ({
    value: toValue(m),
    label: toLabel(m),
  }));

  useEffect(() => {
    if (staticData && (divisionOptions.length === 0 || mediumOptions.length === 0)) {
      // eslint-disable-next-line no-console
      console.warn(
        'TimeTable: getAllStaticData response has no usable "division" and/or "medium" keys' +
          " — Division/Medium dropdown(s) are empty. Actual staticData keys:",
        Object.keys(staticData),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticData]);
  const periodOptions = (staticData?.["Time table periods"] ?? PERIOD_FALLBACK).map(
    (p: any) => ({
      value: toValue(p),
      label: toLabel(p),
    }),
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
          // Every card stays mounted (hidden with display:none when it
          // isn't on the active day/page) so every Form.Item remains
          // registered and nothing gets dropped from the payload.
          const dayOf = (name: number): string =>
            (watchedPeriods?.[name]?.day as string) || DAYS[0];

          const countForDay = (day: string): number =>
            fields.reduce((count, f) => count + (dayOf(f.name) === day ? 1 : 0), 0);

          const matchingForActiveDay = fields.filter(
            (f) => dayOf(f.name) === activeDayTab,
          );
          const matchingCount = matchingForActiveDay.length;
          const totalPages = Math.max(1, Math.ceil(matchingCount / PERIOD_PAGE_SIZE));
          const safePage = Math.min(periodPage, totalPages);

          const handleAddPeriod = () => {
            add(emptyPeriod(activeDayTab));
            const newCountForActiveDay = matchingCount + 1;
            setPeriodPage(Math.ceil(newCountForActiveDay / PERIOD_PAGE_SIZE));
          };

          return (
            <>
              <div className="tt-daytabs">
                {DAYS.map((day) => {
                  const count = countForDay(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`tt-daytab ${day === activeDayTab ? "is-active" : ""}`}
                      onClick={() => setActiveDayTab(day)}
                    >
                      {day.charAt(0) + day.slice(1, 3).toLowerCase()}
                      {count > 0 && <span className="tt-daytab-count">{count}</span>}
                    </button>
                  );
                })}
              </div>

              {matchingCount > PERIOD_PAGE_SIZE && (
                <div className="flex justify-end mb-3">
                  <Pagination
                    current={safePage}
                    pageSize={PERIOD_PAGE_SIZE}
                    total={matchingCount}
                    onChange={(p) => setPeriodPage(p)}
                    showSizeChanger={false}
                    size="small"
                  />
                </div>
              )}

              {matchingCount === 0 && (
                <div className="tt-daytab-empty">
                  No periods added for{" "}
                  {activeDayTab.charAt(0) + activeDayTab.slice(1).toLowerCase()} yet.
                </div>
              )}

              {fields.map(({ key, name, ...restField }) => {
                const fieldDay = dayOf(name);
                const isActiveDay = fieldDay === activeDayTab;

                let isOnCurrentPage = false;
                if (isActiveDay) {
                  const posInDay = matchingForActiveDay.findIndex((f) => f.name === name);
                  const fieldSubPage = Math.floor(posInDay / PERIOD_PAGE_SIZE) + 1;
                  isOnCurrentPage = fieldSubPage === safePage;
                }
                const isVisible = isActiveDay && isOnCurrentPage;

                return (
                  <div
                    key={key}
                    style={isVisible ? undefined : { display: "none" }}
                    aria-hidden={!isVisible}
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

                      <Form.Item
                        {...restField}
                        label="Time"
                        name={[name, "timeRange"]}
                        rules={[
                          { required: true, message: "Start and end time are required" },
                        ]}
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
                            onDropdownVisibleChange={(open) => {
                              if (open) onTeacherDropdownOpen?.();
                            }}
                          >
                            {teacherOptions.map((t) => (
                              <Option
                                key={t.employeeDetailsId}
                                value={t.employeeDetailsId}
                              >
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

              {matchingCount > PERIOD_PAGE_SIZE && (
                <div className="flex justify-end mb-3">
                  <Pagination
                    current={safePage}
                    pageSize={PERIOD_PAGE_SIZE}
                    total={matchingCount}
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
                Add Period {activeDayTab.charAt(0) + activeDayTab.slice(1).toLowerCase()}
              </Button>

              <style>{`
                .tt-daytabs {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 8px;
                  margin-bottom: 14px;
                }
                .tt-daytab {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  border: 1px solid #E3E8EE;
                  background: #fff;
                  color: #4A5262;
                  font-weight: 600;
                  font-size: 12.5px;
                  border-radius: 999px;
                  padding: 7px 14px;
                  cursor: pointer;
                  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
                }
                .tt-daytab.is-active {
                  background: #1E2530;
                  border-color: #1E2530;
                  color: #fff;
                }
                .tt-daytab-count {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  min-width: 18px;
                  height: 18px;
                  padding: 0 5px;
                  border-radius: 999px;
                  font-size: 10.5px;
                  font-weight: 700;
                  background: rgba(0, 0, 0, 0.08);
                  color: inherit;
                }
                .tt-daytab.is-active .tt-daytab-count {
                  background: rgba(255, 255, 255, 0.18);
                }
                .tt-daytab-empty {
                  border: 1px dashed #E3E8EE;
                  border-radius: 10px;
                  padding: 20px;
                  text-align: center;
                  color: #A9A28F;
                  font-size: 13px;
                  margin-bottom: 16px;
                }
              `}</style>
            </>
          );
        }}
      </Form.List>

      <ConfigProvider componentDisabled={false}>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button
            type="primary"
            htmlType="button"
            loading={loading}
            onClick={handleFinish}
          >
            {isEditing ? "Update" : "Save"}
          </Button>
        </div>
      </ConfigProvider>
    </Form>
  );
}

// ===============================
// Read-only Timetable Grid (used in the View popup)
// ===============================
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

const railLabel = (label: any) => {
  const str = toLabel(label) || String(label ?? "");
  const m = str.match(/^Period\s+(\d+)$/i);
  return m ? `P${m[1]}` : str;
};

const isBreakLabel = (label: any) => {
  const str = toLabel(label) || String(label ?? "");
  return /break|lunch|recess/i.test(str);
};

// resolve a period's start time from whichever field name the backend returns
const extractStartTimeRaw = (p: any): any => {
  if (!p) return undefined;
  return (
    p.startTime ??
    p.fromTime ??
    p.start ??
    p.timeFrom ??
    p.periodStartTime ??
    p.startTimeStr ??
    p?.timeTablePeriodDTO?.startTime ??
    p?.periodDTO?.startTime ??
    undefined
  );
};

// convert a start-time value into minutes-since-midnight for sorting
const timeToMinutes = (raw?: any): number => {
  if (raw === null || raw === undefined || raw === "") return Number.MAX_SAFE_INTEGER;
  const str = String(raw).trim();

  const match = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(AM|PM|am|pm)?$/.exec(str);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[4] ? match[4].toUpperCase() : undefined;
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  }

  const isoParsed = dayjs(str);
  if (isoParsed.isValid()) {
    return isoParsed.hour() * 60 + isoParsed.minute();
  }

  return Number.MAX_SAFE_INTEGER;
};

function TimeTableGridView({ data, periodOrder }: { data: any; periodOrder?: string[] }) {
  const periods: any[] = Array.isArray(data?.timeTablePeriods)
    ? data.timeTablePeriods
    : [];
  const todayName = dayjs().format("dddd").toUpperCase();

  // on phones: day tabs + vertical agenda; tablet/desktop: weekly grid
  const isMobile = useIsMobile(641);
  const [selectedDay, setSelectedDay] = useState<string>(
    DAYS.includes(todayName) ? todayName : DAYS[0],
  );

  useEffect(() => {
    if (!periods.length) return;
    const unresolved = periods.filter(
      (p) => timeToMinutes(extractStartTimeRaw(p)) === Number.MAX_SAFE_INTEGER,
    );
    if (unresolved.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "TimeTable: could not resolve a usable start time for these periods, so they'll fall back" +
          " to the static period-list order instead of sorting chronologically. Inspect the raw" +
          " object below to find the actual field name/format your API returns for start time:",
        unresolved,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods]);

  const normalizedOrder = (periodOrder || []).map((p) => toLabel(p) || String(p ?? ""));

  const orderIndex = (label: any) => {
    const str = toLabel(label) || String(label ?? "");
    const idx = normalizedOrder.indexOf(str);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  // Sort key and displayed rail time both resolve through the same
  // lookup so they can never contradict each other.
  const findFirstMatchingPeriod = (label: string) =>
    periods.find(
      (p) => (toLabel(p.periodNumber) || String(p.periodNumber ?? "")) === label,
    );

  const periodStartMinutes = (label: string): number => {
    const p = findFirstMatchingPeriod(label);
    return p ? timeToMinutes(extractStartTimeRaw(p)) : Number.MAX_SAFE_INTEGER;
  };

  const periodNumbers: string[] = Array.from(
    new Set(periods.map((p) => toLabel(p.periodNumber) || String(p.periodNumber ?? ""))),
  ).sort((a: string, b: string) => {
    const timeDiff = periodStartMinutes(a) - periodStartMinutes(b);
    if (timeDiff !== 0) return timeDiff;
    return orderIndex(a) - orderIndex(b);
  });

  const periodTimeLabel = (num: string) => {
    const p = findFirstMatchingPeriod(num);
    if (!p) return "";
    const fmt = (t: string) => (t ? dayjs(t, "HH:mm:ss").format("hh:mm A") : "");
    return `${fmt(p.startTime)} – ${fmt(p.endTime)}`;
  };

  const findCell = (day: string, periodNumber: string) =>
    periods.find(
      (p) =>
        p.day === day &&
        (toLabel(p.periodNumber) || String(p.periodNumber ?? "")) === periodNumber,
    );

  return (
    <div className="sked-wrap">
      {/* Info banner */}
      <div className="sked-banner">
        <div className="sked-banner-left">
          <span className="sked-eyebrow">Weekly Timetable</span>
          <h3 className="sked-title">
            {data?.standard || "-"}
            {data?.division ? (
              <span className="sked-div">Division {data.division}</span>
            ) : null}
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
      ) : isMobile ? (
        <div className="sked-agenda">
          <div className="sked-daytabs">
            {DAYS.map((day) => {
              const isToday = day === todayName;
              const isActive = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  className={`sked-daytab ${isActive ? "is-active" : ""} ${isToday ? "is-today" : ""}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {dayAbbrev(day)}
                  {isToday && <span className="sked-daytab-dot" />}
                </button>
              );
            })}
          </div>

          <div className="sked-agenda-list">
            {periodNumbers.map((num) => {
              const isBreakRow = isBreakLabel(num);
              const cell = findCell(selectedDay, num);

              if (!cell) {
                return (
                  <div key={num} className="sked-agenda-row is-free">
                    <div className="sked-agenda-time">
                      <span className="sked-agenda-num">{railLabel(num)}</span>
                      <span className="sked-agenda-clock">{periodTimeLabel(num)}</span>
                    </div>
                    <div className="sked-agenda-free">Free period</div>
                  </div>
                );
              }

              if (isBreakRow) {
                return (
                  <div key={num} className="sked-agenda-row">
                    <div className="sked-agenda-time">
                      <span className="sked-agenda-num">{railLabel(num)}</span>
                      <span className="sked-agenda-clock">{periodTimeLabel(num)}</span>
                    </div>
                    <div className="sked-agenda-card sked-agenda-break">
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
                <div key={num} className="sked-agenda-row">
                  <div className="sked-agenda-time">
                    <span className="sked-agenda-num">{railLabel(num)}</span>
                    <span className="sked-agenda-clock">{periodTimeLabel(num)}</span>
                  </div>
                  <div
                    className="sked-agenda-card"
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
          </div>
        </div>
      ) : (
        <div className="sked-board-scroll">
          <div
            className="sked-board"
            style={{ gridTemplateColumns: `84px repeat(${DAYS.length}, 1fr)` }}
          >
            <div className="sked-corner" />

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
                        <div
                          key={day}
                          className={`sked-slot ${isToday ? "is-today" : ""}`}
                        >
                          <div className="sked-empty-slot">Free</div>
                        </div>
                      );
                    }

                    if (isBreakRow) {
                      return (
                        <div
                          key={day}
                          className={`sked-slot ${isToday ? "is-today" : ""}`}
                        >
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
                    const teacherName = [teacherFirst, teacherLast]
                      .filter(Boolean)
                      .join(" ");

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
                            <span
                              className="sked-avatar"
                              style={{ background: tag?.border }}
                            >
                              {initialsOf(teacherFirst, teacherLast)}
                            </span>
                            <span className="sked-teacher-name">
                              {teacherName || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
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

        .sked-board-scroll {
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 6px;
          scrollbar-width: thin;
        }

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

        @media (max-width: 1024px) {
          .sked-board {
            min-width: 760px;
          }
          .sked-corner {
            position: sticky;
            left: 0;
            z-index: 3;
            background: #fff;
          }
          .sked-rail {
            position: sticky;
            left: 0;
            z-index: 2;
          }
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
        }

        /* Day tabs */
        .sked-daytabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 4px;
          margin-bottom: 14px;
          scrollbar-width: none;
        }
        .sked-daytabs::-webkit-scrollbar { display: none; }
        .sked-daytab {
          flex: 1 0 auto;
          min-width: 44px;
          border: 1px solid #E3E8EE;
          background: #fff;
          color: #4A5262;
          font-weight: 600;
          font-size: 12.5px;
          border-radius: 999px;
          padding: 8px 0;
          text-align: center;
          position: relative;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .sked-daytab.is-today {
          border-color: #E8A33D;
        }
        .sked-daytab.is-active {
          background: #1E2530;
          border-color: #1E2530;
          color: #fff;
        }
        .sked-daytab-dot {
          position: absolute;
          top: 5px;
          right: 10px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #E8A33D;
        }
        .sked-daytab.is-active .sked-daytab-dot {
          background: #fff;
        }

        /* Agenda list */
        .sked-agenda-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sked-agenda-row {
          display: grid;
          grid-template-columns: 64px 1fr;
          gap: 12px;
          align-items: stretch;
        }
        .sked-agenda-time {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-end;
          text-align: right;
          padding-right: 4px;
        }
        .sked-agenda-num {
          font-weight: 700;
          font-size: 12.5px;
          color: #1E2530;
        }
        .sked-agenda-clock {
          font-size: 10px;
          color: #8D96A6;
          margin-top: 2px;
          line-height: 1.25;
        }
        .sked-agenda-card {
          border: 1px solid transparent;
          border-left: 4px solid;
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          min-height: 56px;
        }
        .sked-agenda-card .sked-card-subject {
          white-space: normal;
          font-size: 14px;
        }
        .sked-agenda-card .sked-teacher-name {
          font-size: 12px;
        }
        .sked-agenda-break {
          background: repeating-linear-gradient(
            135deg,
            #FBE6DE,
            #FBE6DE 8px,
            #FCEEDA 8px,
            #FCEEDA 16px
          );
          border: 1px dashed #D9633B;
          border-left: 1px dashed #D9633B;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .sked-agenda-row.is-free {
          opacity: 0.65;
        }
        .sked-agenda-free {
          border: 1px dashed #E3E8EE;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C3CAD6;
          font-size: 12.5px;
          min-height: 56px;
        }

        @media (max-width: 380px) {
          .sked-agenda-row { grid-template-columns: 52px 1fr; }
          .sked-agenda-num { font-size: 11.5px; }
          .sked-agenda-clock { font-size: 9px; }
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

  const teacherOptionsLoadedRef = useRef(false);
  const teacherOptionsLoadingRef = useRef(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<any>(null);

  const { user } = useAuth();
  const canDelete = isAdminOrPrincipal(user?.role);
  const viewerIsTeacher = isTeacherRole(user?.role);

  // Search filter bar (Standard / Division / Medium) — admin/principal list only.
  const [filters, setFilters] = useState<TimeTableFilters>({});

  const standardOptions = (staticData?.["standard"] ?? STANDARD_FALLBACK).map(
    (s: any) => ({
      value: toValue(s),
      label: toLabel(s),
    }),
  );
  const divisionOptions = (staticData?.["division"] ?? []).map((d: any) => ({
    value: toValue(d),
    label: toLabel(d),
  }));
  const mediumOptions = (staticData?.["medium"] ?? []).map((m: any) => ({
    value: toValue(m),
    label: toLabel(m),
  }));

  const handleFilterChange = (key: keyof TimeTableFilters, value?: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const [myScheduleLoading, setMyScheduleLoading] = useState(false);
  const [mySchedule, setMySchedule] = useState<any>(null);

  // 🆕 API MSG — errors now come from the API response itself.
  const fetchTimeTables = useCallback(
    async (pageNum: number, size: number, activeFilters: TimeTableFilters = {}) => {
      setTableLoading(true);
      try {
        const hasFilters = !!(
          activeFilters.standard ||
          activeFilters.division ||
          activeFilters.medium
        );
        const res = hasFilters
          ? await api.post(getAllTimeTableByFilterEndpoint(pageNum, size), {
              standard: activeFilters.standard,
              division: activeFilters.division,
              medium: activeFilters.medium,
            })
          : await api.post(apiEndpoints.getAllTimeTables(pageNum, size), {});
        assertApiSuccess(res);
        const { list, total: t } = extractListAndTotal(res);
        setRows(list);
        setTotal(t);
      } catch (error: any) {
        setRows([]);
        setTotal(0);
        showApiError(error, "Failed to load timetables");
      } finally {
        setTableLoading(false);
      }
    },
    [],
  );

  const ensureStaticData = useCallback(async () => {
    if (staticData) return;
    try {
      const res = await api.get(apiEndpoints.getAllStaticData());
      const data = res.data?.data ?? res.data ?? {};
      setStaticData(data);
    } catch (error: any) {
      showApiError(error, "Failed to load dropdown data");
    }
  }, [staticData]);

  useEffect(() => {
    if (!viewerIsTeacher) {
      fetchTimeTables(page, pageSize, filters);
      ensureStaticData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, fetchTimeTables, viewerIsTeacher]);

  const handleSearch = () => {
    setPage(0);
    fetchTimeTables(0, pageSize, filters);
  };

  const handleResetFilters = () => {
    setFilters({});
    setPage(0);
    fetchTimeTables(0, pageSize, {});
  };

  // Subject dropdown data — fetched once on mount.
  useEffect(() => {
    if (viewerIsTeacher) return;
    (async () => {
      try {
        const res = await api.post(apiEndpoints.getAllSubjects(0, 100), {});
        const { list } = extractListAndTotal(res);
        setSubjectOptions(list);
      } catch (error: any) {
        showApiError(error, "Failed to load subjects");
      }
    })();
  }, [viewerIsTeacher]);

  // Teacher list fetched lazily, once per page load.
  const fetchTeachersByRole = useCallback(async () => {
    if (teacherOptionsLoadedRef.current || teacherOptionsLoadingRef.current) return;
    teacherOptionsLoadingRef.current = true;
    try {
      const res = await api.post(apiEndpoints.getAllemployeeDetails(0, 200), {
        role: "Teacher",
      });
      const { list } = extractListAndTotal(res);
      setTeacherOptions(list);
      teacherOptionsLoadedRef.current = true;
    } catch (error: any) {
      showApiError(error, "Failed to load teachers");
    } finally {
      teacherOptionsLoadingRef.current = false;
    }
  }, []);

  // ---------------------------------------------------------------
  // Teacher timetable
  //   TEACHER -> useAuth() -> user.standard/division/medium
  //   -> POST getAllTimeTableByFilter with those 3 fields.
  // Whatever periods the API returns for that class are displayed.
  // ---------------------------------------------------------------
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

    if (!payload.standard || !payload.division || !payload.medium) {
      console.warn("TimeTable: teacher class information is incomplete", payload);
      setMySchedule(null);
      setMyScheduleLoading(false);
      return;
    }

    try {
      const res = await api.post(getAllTimeTableByFilterEndpoint(0, 500), payload);
      assertApiSuccess(res);

      // response: res.data.data["Time TableDTOS"] (also tolerates the
      // other list keys via extractListAndTotal)
      const { list: timetableList } = extractListAndTotal(res);

      const allPeriods = timetableList.flatMap((tt: any) => {
        const periods = Array.isArray(tt?.timeTablePeriods) ? tt.timeTablePeriods : [];

        return periods.map((period: any) => ({
          ...period,
          standard: tt?.standard ?? payload.standard,
          division: tt?.division ?? payload.division,
          medium: tt?.medium ?? payload.medium,
          academicYear: tt?.academicYear ?? getLoggedInAcademicYear(),
        }));
      });

      const firstTimetable = timetableList[0];

      setMySchedule({
        standard: firstTimetable?.standard ?? payload.standard,
        division: firstTimetable?.division ?? payload.division,
        medium: firstTimetable?.medium ?? payload.medium,
        academicYear: firstTimetable?.academicYear ?? getLoggedInAcademicYear(),
        timeTablePeriods: allPeriods,
      });
    } catch (error: any) {
      console.error("TimeTable getAllTimeTableByFilter failed:", error);
      showApiError(error, "Failed to load your timetable");
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
  }, [viewerIsTeacher, ensureStaticData, fetchMySchedule]);

  const populateForm = (data: any) => {
    form.setFieldsValue({
      timeTableId: data?.timeTableId,
      standard: data?.standard,
      division: data?.division,
      medium: data?.medium,
      academicYear: data?.academicYear ?? getLoggedInAcademicYear(),
      timeTablePeriods: (data?.timeTablePeriods || []).map((p: any) => ({
        timeTablePeriodId: p.timeTablePeriodId,
        day: p.day,
        periodNumber: toLabel(p.periodNumber) || p.periodNumber,
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
    ensureStaticData();
  };

  const openEditDrawer = async (record: TimeTableRow) => {
    setIsEditing(true);
    setDrawerOpen(true);
    setDrawerLoading(true);
    ensureStaticData();
    fetchTeachersByRole();
    try {
      const res = await api.get(apiEndpoints.getTimeTableById(record.timeTableId));
      assertApiSuccess(res);
      const data = res.data?.data ?? res.data;
      populateForm(data);
    } catch (error: any) {
      showApiError(error, "Failed to load timetable");
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
    ensureStaticData();
    try {
      const res = await api.get(apiEndpoints.getTimeTableById(record.timeTableId));
      assertApiSuccess(res);
      const data = res.data?.data ?? res.data;
      setViewData(data);
    } catch (error: any) {
      showApiError(error, "Failed to load timetable");
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setViewData(null);
  };

  // 🆕 API MSG — on failure the drawer stays open, the API's validation
  // text is shown in a toast AND set under the matching form field(s).
  // On success the API's own success message is shown.
  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      let res: any;
      if (isEditing && payload.timeTableId) {
        res = await api.put(apiEndpoints.updateTimeTable(), payload);
        assertApiSuccess(res);
        message.success(getApiMessage(res, "Time table updated successfully"));
      } else {
        res = await api.post(apiEndpoints.saveTimeTable(), payload);
        assertApiSuccess(res);
        message.success(getApiMessage(res, "Time table added successfully"));
      }
      closeDrawer();
      fetchTimeTables(page, pageSize, filters);
    } catch (error: any) {
      showApiError(error, "Failed to save timetable", form);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (timeTableId: number) => {
    try {
      const res = await api.delete(apiEndpoints.deleteTimeTable(timeTableId));
      assertApiSuccess(res);
      message.success(getApiMessage(res, "Time table deleted successfully"));
      fetchTimeTables(page, pageSize, filters);
    } catch (error: any) {
      showApiError(error, "Failed to delete timetable");
    }
  };

  // Teachers land straight on their own schedule — no Add/Edit/Delete.
  if (viewerIsTeacher) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">
          My Timetable{user?.firstName ? ` — ${user.firstName}` : ""}
        </h2>
        <Spin spinning={myScheduleLoading} tip="Loading your timetable...">
          {!myScheduleLoading &&
          (!mySchedule || mySchedule.timeTablePeriods.length === 0) ? (
            <Empty
              description="No periods assigned to you yet"
              style={{ padding: "40px 0" }}
            />
          ) : (
            mySchedule && (
              <TimeTableErrorBoundary>
                <TimeTableGridView
                  data={mySchedule}
                  periodOrder={normalizeList(
                    staticData?.["Time table periods"] ?? PERIOD_FALLBACK,
                  )}
                />
              </TimeTableErrorBoundary>
            )
          )}
        </Spin>
      </div>
    );
  }

  const columns = [
    {
      title: "Standard",
      dataIndex: "standard",
      key: "standard",
      render: (v: string) => v || "-",
    },
    {
      title: "Division",
      dataIndex: "division",
      key: "division",
      render: (v: string) => v || "-",
    },
    {
      title: "Medium",
      dataIndex: "medium",
      key: "medium",
      render: (v: string) => v || "-",
    },
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
      <style>{`
        .academic-year-dark.ant-input[disabled],
        .academic-year-dark.ant-input-disabled {
          color: rgba(0, 0, 0, 0.88) !important;
          -webkit-text-fill-color: rgba(0, 0, 0, 0.88) !important;
          background-color: #f5f5f5 !important;
        }
      `}</style>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            placeholder="Standard"
            allowClear
            style={{ width: 150 }}
            value={filters.standard}
            onChange={(v) => handleFilterChange("standard", v)}
          >
            {standardOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Division"
            allowClear
            style={{ width: 130 }}
            value={filters.division}
            onChange={(v) => handleFilterChange("division", v)}
          >
            {divisionOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Medium"
            allowClear
            style={{ width: 130 }}
            value={filters.medium}
            onChange={(v) => handleFilterChange("medium", v)}
          >
            {mediumOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button type="primary" onClick={handleSearch}>
            Search
          </Button>
          <Button onClick={handleResetFilters}>Reset</Button>

          <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
            Add Time Table
          </Button>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {tableLoading && (
            <div className="text-center text-sm text-gray-400 py-6">Loading...</div>
          )}
          {!tableLoading && rows.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-6">
              No timetables found
            </div>
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
                <p className="text-xs text-gray-500">
                  Academic Year: {record.academicYear}
                </p>
                <div className="flex gap-2 justify-end pt-2 mt-2 border-t border-gray-50">
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => openView(record)}
                  />
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => openEditDrawer(record)}
                  />
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
            onTeacherDropdownOpen={fetchTeachersByRole}
          />
        </Spin>
      </Drawer>

      {/* View popup */}
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
                  periodOrder={normalizeList(
                    staticData?.["Time table periods"] ?? PERIOD_FALLBACK,
                  )}
                />
              </TimeTableErrorBoundary>
            )
          )}
        </Spin>
      </Modal>
    </div>
  );
}
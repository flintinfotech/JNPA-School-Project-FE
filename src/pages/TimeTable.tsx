import { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  TimePicker,
  InputNumber,
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

const DRAWER_BG_COLOR = "#fff6ed";
const ACADEMIC_YEAR_STORAGE_KEY = "academicYear";

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

// 👇 Loose type — shape of getAllStaticData's response is assumed to match
// the { "blood group": [...], "division": [...], "medium": [...] } pattern
// already used in StudentForm.tsx.
type StaticDataMap = Record<string, string[]>;

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
            {(staticData?.["standard"] ?? STANDARD_FALLBACK).map((s) => (
              <Option key={s} value={s}>
                {s}
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
            {staticData?.["division"]?.map((d) => (
              <Option key={d} value={d}>
                {d}
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
            {staticData?.["medium"]?.map((m) => (
              <Option key={m} value={m}>
                {m}
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
                    label="Period Number"
                    name={[name, "periodNumber"]}
                    rules={[{ required: true, message: "Period number is required" }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={1} placeholder="1" />
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
                    rules={[{ required: true, message: "Subject is required" }]}
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
                    rules={[{ required: true, message: "Teacher is required" }]}
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
// Days across the top, periods down the side — built straight from the
// nested subjectMasterDTO / employeeDetailsDTO your API already returns,
// so no dropdown data is needed to render it.
// ===============================
function TimeTableGridView({ data }: { data: any }) {
  const periods: any[] = data?.timeTablePeriods || [];

  const periodNumbers: number[] = Array.from(
    new Set(periods.map((p) => p.periodNumber))
  ).sort((a: number, b: number) => a - b);

  const periodTimeLabel = (num: number) => {
    const p = periods.find((pp) => pp.periodNumber === num);
    if (!p) return "";
    const fmt = (t: string) => (t ? dayjs(t, "HH:mm:ss").format("hh:mm A") : "");
    return `${fmt(p.startTime)} - ${fmt(p.endTime)}`;
  };

  const findCell = (day: string, periodNumber: number) =>
    periods.find((p) => p.day === day && p.periodNumber === periodNumber);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
        <span>
          <strong>Standard:</strong> {data?.standard || "-"}
        </span>
        <span>
          <strong>Division:</strong> {data?.division || "-"}
        </span>
        <span>
          <strong>Medium:</strong> {data?.medium || "-"}
        </span>
        <span>
          <strong>Academic Year:</strong> {data?.academicYear || "-"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200 whitespace-nowrap">
                Period
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="px-3 py-2 text-center font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap"
                >
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodNumbers.length === 0 ? (
              <tr>
                <td colSpan={DAYS.length + 1} className="text-center text-gray-400 py-8">
                  No periods added yet.
                </td>
              </tr>
            ) : (
              periodNumbers.map((num) => (
                <tr key={num} className="even:bg-gray-50/50">
                  <td className="px-3 py-2 border-r border-b border-gray-100 font-medium text-gray-700 whitespace-nowrap align-top">
                    Period {num}
                    <div className="text-xs text-gray-400 font-normal">
                      {periodTimeLabel(num)}
                    </div>
                  </td>
                  {DAYS.map((day) => {
                    const cell = findCell(day, num);
                    return (
                      <td
                        key={day}
                        className="px-3 py-2 border-b border-gray-100 text-center align-top"
                      >
                        {cell ? (
                          <div>
                            <p className="font-medium text-gray-800">
                              {cell.subjectMasterDTO?.subjectName || "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {[
                                cell.employeeDetailsDTO?.firstName,
                                cell.employeeDetailsDTO?.lastName,
                              ]
                                .filter(Boolean)
                                .join(" ") || "-"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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

  // Dropdown data — fetched once on mount.
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(apiEndpoints.getAllStaticData());
        const data = res.data?.data ?? res.data ?? {};
        setStaticData(data);
      } catch {
        // non-fatal — Standard/Division/Medium dropdowns fall back/empty
      }
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
        periodNumber: p.periodNumber,
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
  };

  const openEditDrawer = async (record: TimeTableRow) => {
    setIsEditing(true);
    setDrawerOpen(true);
    setDrawerLoading(true);
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

      {/* View — popup, not a drawer, showing a proper timetable grid */}
      <Modal
        title="Time Table"
        open={viewOpen}
        onCancel={closeView}
        footer={null}
        width={950}
        destroyOnClose
      >
        <Spin spinning={viewLoading} tip="Loading timetable...">
          {!viewLoading && !viewData ? (
            <Empty description="Time table not found" style={{ padding: "40px 0" }} />
          ) : (
            viewData && <TimeTableGridView data={viewData} />
          )}
        </Spin>
      </Modal>
    </div>
  );
}
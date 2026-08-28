import { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  ConfigProvider,
  Drawer,
  Tag,
  Spin,
  Popconfirm,
  Empty,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { FormInstance } from "antd/es/form";
import CommonTable from "../components/commonTable"; // 👈 change to your actual path
import api from "../lib/axios"; // 👈 change to your actual axios instance path
import { apiEndpoints } from "../services/apiEndpoints"; // 👈 change to your actual path
import FeeReceiptModal from "../components/FeeReceipt";

const { Option } = Select;

const PAYMENT_MODES = ["CASH", "UPI", "CARD", "NET_BANKING", "CHEQUE"];

// Drawer theming — matches the Results page drawer's background color exactly.
const DRAWER_BG_COLOR = "#fff6ed";

// The academic year picked on the login screen is saved here by useAuth's
// login() as { startDate, endDate } — same key/shape used across the whole
// app (Header's "Academic Year" badge, the Student form's Academic Info tab).
const ACADEMIC_YEAR_STORAGE_KEY = "academicYear";

// Fallback only — used if there's no stored academic year at all (shouldn't
// normally happen since login always sets one).
const getCurrentAcademicYear = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // Jan = 1

  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Reads the academic year the user actually logged in under, from
// localStorage (set at login time by useAuth). This "pins" every fee block
// to the year the user is currently logged in under — e.g. always
// "2026-2027" for a session started under { startDate: "2026-06-15",
// endDate: "2027-04-30" } — and never silently drifts to today's real-world
// academic year while that session is active.
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
    if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
      return getCurrentAcademicYear();
    }
    return `${startYear}-${endYear}`;
  } catch {
    return getCurrentAcademicYear();
  }
};

interface StudentRow {
  studentId: number;
  studentCode?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  category?: string;
  status?: string;
  caste?: string;
  religion?: string;
  // 👇 assumed nested on the student record from getAllStudentsByFilter —
  // swap this out once a dedicated get-fee-by-studentId endpoint exists
  studentFee?: any;
  [key: string]: any;
}

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

const statusColor = (status?: string) =>
  (status || "").toUpperCase() === "ACTIVE" ? "green" : "red";

// Color coding for a fee's own Status (e.g. "PENDING", "PAID"/"COMPLETED",
// "FAILED"/"CANCELLED", "OVERDUE") as returned by the backend on save/update.
const feeStatusColor = (status?: string) => {
  const s = (status || "").toUpperCase();
  if (s === "PAID" || s === "COMPLETED" || s === "SUCCESS") return "green";
  if (s === "PENDING") return "orange";
  if (s === "FAILED" || s === "CANCELLED" || s === "OVERDUE") return "red";
  return "default";
};

// A student can now have MULTIPLE fees (Tuition, Transport, etc). This
// returns all of them as an array, whichever key the backend actually uses.
// Tighten this once you confirm the real key.
const extractFees = (studentData: any): any[] => {
  if (!studentData) return [];
  // Try every array-shaped key the backend might be using for "all fees".
  const arrayKeys = [
    "studentFeeDTOS",
    "studentFeeDTOList",
    "studentFeeList",
    "feeDTOS",
    "feeList",
    "fees",
  ];
  for (const key of arrayKeys) {
    if (Array.isArray(studentData[key]) && studentData[key].length) {
      return studentData[key];
    }
  }
  if (studentData.studentFee) return [studentData.studentFee];
  if (studentData.studentFeeDTO) return [studentData.studentFeeDTO];
  // fee fields might already be flattened directly onto the student object
  if (studentData.totalFeeAmount !== undefined) return [studentData];
  // Nothing matched a known shape — log so it's easy to see the real
  // response shape and add the correct key above.
  // eslint-disable-next-line no-console
  console.warn("extractFees: no known fee array found on student data", studentData);
  return [];
};

const emptyFeeBlock = () => ({
  studentFeeId: undefined,
  academicYear: getLoggedInAcademicYear(),
  feeName: undefined,
  totalFeeAmount: undefined,
  dueDate: null,
  paidAmount: 0,
  pendingAmount: 0,
  dueAmount: undefined,
  status: undefined,
  feePaymentDTOS: [],
});

// ===============================
// Per fee-block Paid/Pending calculator
// Due Amount is NOT auto-calculated — it stays a plain editable field.
// ===============================
function FeeAmountCalculator({
  form,
  name,
  viewOnly,
}: {
  form: FormInstance;
  name: number;
  viewOnly?: boolean;
}) {
  const paymentsWatch = Form.useWatch(
    ["studentFeeDTOS", name, "feePaymentDTOS"],
    form
  ) as any[] | undefined;
  const totalWatch = Form.useWatch(["studentFeeDTOS", name, "totalFeeAmount"], form) as
    | number
    | undefined;
  // In view mode paidAmount/pendingAmount aren't recomputed (see below),
  // so watch the already-fetched paidAmount instead — needed to derive
  // Status in that mode.
  const paidAmountWatch = Form.useWatch(
    ["studentFeeDTOS", name, "paidAmount"],
    form
  ) as number | undefined;

  useEffect(() => {
    const total = Number(totalWatch) || 0;

    // In view mode we display Paid/Pending exactly as saved/fetched —
    // never recompute or overwrite them. In edit mode they're derived
    // live from the payments list.
    const paid = viewOnly
      ? Number(paidAmountWatch) || 0
      : (paymentsWatch || []).reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
    const pending = Math.max(total - paid, 0);

    // 👇 Status is derived on the frontend (the backend field is often
    // empty/stale): fully paid -> "PAID", anything else -> "PENDING".
    const status = total > 0 && paid >= total ? "PAID" : "PENDING";

    const current = form.getFieldValue(["studentFeeDTOS", name]) || {};
    const nextValue: any = { ...current, status };
    if (!viewOnly) {
      nextValue.paidAmount = paid;
      nextValue.pendingAmount = pending;
    }
    form.setFields([
      {
        name: ["studentFeeDTOS", name],
        value: nextValue,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewOnly, totalWatch, paidAmountWatch, JSON.stringify(paymentsWatch)]);

  return null;
}

// ===============================
// Fee Form — one or more fee blocks, each with its own payments
// ===============================
interface StudentFeeFormProps {
  form: FormInstance;
  onFinish: (values: any) => void;
  isEditing: boolean;
  loading: boolean;
  viewOnly?: boolean;
  onDelete?: (studentFeeId: number) => void;
  // Only used when viewOnly — shows "Print Receipt" buttons on each fee
  // block and each payment, and hands back the current form values for
  // that block/payment so FeeReceiptModal can render them.
  onPrintReceipt?: (fee: any, payment: any | null) => void;
}

function StudentFeeForm({
  form,
  onFinish,
  isEditing,
  loading,
  viewOnly = false,
  onDelete,
  onPrintReceipt,
}: StudentFeeFormProps) {
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        studentId: values.studentId,
        studentFeeDTOS: (values.studentFeeDTOS || []).map((fee: any) => ({
          ...fee,
          dueDate: fee.dueDate ? dayjs(fee.dueDate).format("YYYY-MM-DD") : null,
          feePaymentDTOS: (fee.feePaymentDTOS || []).map((p: any) => ({
            ...p,
            paymentDate: p.paymentDate ? dayjs(p.paymentDate).format("YYYY-MM-DD") : null,
          })),
        })),
      };
      onFinish(payload);
    } catch {
      // validation errors are shown inline by antd
    }
  };

  return (
    <Form form={form} layout="vertical" disabled={viewOnly}>
      <Form.Item name="studentId" hidden>
        <Input />
      </Form.Item>

      <Form.List name="studentFeeDTOS">
        {(feeFields, { add: addFee, remove: removeFee }) => (
          <>
            {feeFields.map(({ key: feeKey, name: feeName }) => (
              <div
                key={feeKey}
                className="border-2 border-gray-400 rounded-lg p-4 mb-4 relative bg-white"
              >
                <FeeAmountCalculator form={form} name={feeName} viewOnly={viewOnly} />

                <Form.Item name={[feeName, "studentFeeId"]} hidden>
                  <Input />
                </Form.Item>

                {/* 👇 always shown (not just when there are 2+ fee cards) —
                    only view-only mode hides it now. */}
                {!viewOnly && (
                  <div className="flex justify-end mb-1">
                    <Button
                      danger
                      type="text"
                      htmlType="button"
                      icon={<DeleteOutlined style={{ fontSize: 18 }} />}
                      onClick={() => {
                        const feeId = form.getFieldValue([
                          "studentFeeDTOS",
                          feeName,
                          "studentFeeId",
                        ]);
                        if (feeId && onDelete) {
                          onDelete(feeId);
                        } else {
                          removeFee(feeName);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Print Receipt — whole-card receipt, view mode only.
                    Uses the same fee name shown in the form above
                    ("Fee Name" field) as the receipt title.
                    Wrapped in ConfigProvider componentDisabled={false}
                    because the parent <Form disabled={viewOnly}> would
                    otherwise disable this Button too — same trick used
                    for the Save/Update button below. */}
                {viewOnly && onPrintReceipt && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {form.getFieldValue(["studentFeeDTOS", feeName, "feeName"]) ||
                        `Fee ${feeName + 1}`}
                    </span>
                    <ConfigProvider componentDisabled={false}>
                      <Button
                        size="small"
                        htmlType="button"
                        icon={<PrinterOutlined />}
                        onClick={() =>
                          onPrintReceipt(
                            form.getFieldValue(["studentFeeDTOS", feeName]),
                            null
                          )
                        }
                      >
                        Print Receipt
                      </Button>
                    </ConfigProvider>
                  </div>
                )}

                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">
                  <Form.Item
                    label="Academic Year"
                    name={[feeName, "academicYear"]}
                    initialValue={getLoggedInAcademicYear()}
                  >
                    <Input disabled className="bg-gray-100" />
                  </Form.Item>
                  <Form.Item
                    label="Fee Name"
                    name={[feeName, "feeName"]}
                    rules={[{ required: true, message: "Fee name is required" }]}
                  >
                    <Input placeholder="e.g. Tuition Fee" />
                  </Form.Item>
                  <Form.Item
                    label="Total Fee Amount"
                    name={[feeName, "totalFeeAmount"]}
                    rules={[{ required: true, message: "Total fee amount is required" }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
                  </Form.Item>
                  <Form.Item label="Due Date" name={[feeName, "dueDate"]}>
                    <DatePicker className="w-full" format="DD-MM-YYYY" />
                  </Form.Item>
                </div>

                {/* Row 2 — Paid & Pending stay auto-calculated/disabled.
                    Due Amount is a plain editable field, starts empty.
                    Status sits right after Due Amount — read-only, set by
                    the backend (same pattern as Receipt No below). */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">
                  <Form.Item label="Paid Amount" name={[feeName, "paidAmount"]}>
                    <InputNumber style={{ width: "100%" }} disabled />
                  </Form.Item>
                  <Form.Item label="Pending Amount" name={[feeName, "pendingAmount"]}>
                    <InputNumber style={{ width: "100%" }} disabled />
                  </Form.Item>
                  <Form.Item label="Due Amount" name={[feeName, "dueAmount"]}>
                    <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
                  </Form.Item>
                  {/* The actual value lives here, hidden — nothing visual
                      reads/writes status directly off this field. */}
                  <Form.Item name={[feeName, "status"]} hidden>
                    <Input />
                  </Form.Item>
                  {/* Display-only: just the Tag, so the value only ever
                      renders once (previously the disabled Input's own
                      text AND the addonAfter Tag both showed it). */}
                  <Form.Item
                    label="Status"
                    shouldUpdate={(prev, cur) =>
                      prev?.studentFeeDTOS?.[feeName]?.status !==
                      cur?.studentFeeDTOS?.[feeName]?.status
                    }
                  >
                    {() => {
                      const currentStatus = form.getFieldValue([
                        "studentFeeDTOS",
                        feeName,
                        "status",
                      ]);
                      return (
                        <div
                          style={{
                            border: "1px solid #d9d9d9",
                            borderRadius: 6,
                            padding: "4px 11px",
                            minHeight: 32,
                            display: "flex",
                            alignItems: "center",
                            background: "#f5f5f5",
                          }}
                        >
                          {currentStatus ? (
                            <Tag color={feeStatusColor(currentStatus)} style={{ margin: 0 }}>
                              {currentStatus}
                            </Tag>
                          ) : (
                            <span style={{ color: "#999" }}>-</span>
                          )}
                        </div>
                      );
                    }}
                  </Form.Item>
                </div>

                <Form.List name={[feeName, "feePaymentDTOS"]}>
                  {(paymentFields, { add: addPayment, remove: removePayment }) => (
                    <>
                      {paymentFields.map(({ key: payKey, name: payName, ...restField }, payIndex) => (
                        <div
                          key={payKey}
                          className="border-2 border-gray-400 rounded-lg p-4 mb-4 mt-4 relative bg-white"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">
                              Payment {payIndex + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {viewOnly && onPrintReceipt && (
                                <ConfigProvider componentDisabled={false}>
                                  <Button
                                    size="small"
                                    htmlType="button"
                                    icon={<PrinterOutlined />}
                                    onClick={() =>
                                      onPrintReceipt(
                                        form.getFieldValue(["studentFeeDTOS", feeName]),
                                        form.getFieldValue([
                                          "studentFeeDTOS",
                                          feeName,
                                          "feePaymentDTOS",
                                          payName,
                                        ])
                                      )
                                    }
                                  >
                                    Print
                                  </Button>
                                </ConfigProvider>
                              )}
                              {!viewOnly && (
                                <Button
                                  danger
                                  type="text"
                                  htmlType="button"
                                  icon={<DeleteOutlined style={{ fontSize: 18 }} />}
                                  onClick={() => removePayment(payName)}
                                />
                              )}
                            </div>
                          </div>

                          <Form.Item
                            {...restField}
                            name={[payName, "feePaymentId"]}
                            hidden
                          >
                            <Input />
                          </Form.Item>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                            {/* 👇 NEW — Receipt No, auto-generated by the
                                backend. Disabled just like Student Code /
                                Admission Id elsewhere in the app; it simply
                                displays whatever value came back from the
                                API and is never typed in manually. On a
                                brand-new payment it stays blank until saved. */}
                            <Form.Item
                              {...restField}
                              label="Receipt No"
                              name={[payName, "receiptNo"]}
                              className="md:col-span-2"
                            >
                              <Input placeholder="" disabled />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              label="Amount"
                              name={[payName, "amount"]}
                              rules={[{ required: true, message: "Amount is required" }]}
                            >
                              <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              label="Payment Mode"
                              name={[payName, "paymentMode"]}
                              rules={[{ required: true, message: "Payment mode is required" }]}
                            >
                              <Select placeholder="Select payment mode" allowClear>
                                {PAYMENT_MODES.map((mode) => (
                                  <Option key={mode} value={mode}>
                                    {mode}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              label="Payment Date"
                              name={[payName, "paymentDate"]}
                              rules={[{ required: true, message: "Payment date is required" }]}
                            >
                              <DatePicker className="w-full" format="DD-MM-YYYY" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              label="Transaction ID"
                              name={[payName, "transactionId"]}
                            >
                              <Input placeholder="Transaction ID" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              label="Remarks"
                              name={[payName, "remarks"]}
                              className="md:col-span-2"
                            >
                              <Input.TextArea rows={2} placeholder="Remarks" />
                            </Form.Item>
                          </div>
                        </div>
                      ))}
                      {!viewOnly && (
                        <Button
                          htmlType="button"
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() =>
                            addPayment({
                              receiptNo: undefined,
                              amount: undefined,
                              paymentMode: undefined,
                              paymentDate: null,
                            })
                          }
                          block
                        >
                          Add Payment
                        </Button>
                      )}
                    </>
                  )}
                </Form.List>
              </div>
            ))}

            {/* Add Fee — adds another whole fee block (same fields as above),
                e.g. Tuition Fee, then Transport Fee, etc, each with its own payments. */}
            {!viewOnly && (
              <Button
                htmlType="button"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => addFee(emptyFeeBlock())}
                block
                className="mb-4"
              >
                Add Fee
              </Button>
            )}
          </>
        )}
      </Form.List>

      {!viewOnly && (
        <ConfigProvider componentDisabled={false}>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button type="primary" htmlType="button" loading={loading} onClick={handleFinish}>
              {isEditing ? "Update" : "Save"}
            </Button>
          </div>
        </ConfigProvider>
      )}
    </Form>
  );
}

// ===============================
// Fee Table (list + view drawer)
// ===============================
interface StudentFeesTableProps {
  data: StudentRow[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onEdit: (record: StudentRow) => void;
}

function StudentFeesTable({ data, loading, pagination, onEdit }: StudentFeesTableProps) {
  const isMobile = useIsMobile();

  const [viewForm] = Form.useForm();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewStudentName, setViewStudentName] = useState("");
  const [viewHasFees, setViewHasFees] = useState(true);

  // Full student payload from getStudentById (name, academicInformation,
  // etc.) — kept around so the printable receipt has the same header
  // details (Adm No, Class, Roll No) as the Student Profile's Fee tab.
  const [viewStudent, setViewStudent] = useState<any>(null);

  // Which fee block / payment's receipt is currently open — null when
  // the receipt modal is closed. payment is null for a whole-card receipt.
  const [receiptTarget, setReceiptTarget] = useState<{
    fee: any;
    payment: any | null;
  } | null>(null);

  const populateViewForm = (fees: any[], studentId: number) => {
    setViewHasFees(fees.length > 0);
    viewForm.setFieldsValue({
      studentId,
      studentFeeDTOS: fees.map((fee) => ({
        studentFeeId: fee?.studentFeeId,
        academicYear: fee?.academicYear,
        feeName: fee?.feeName,
        totalFeeAmount: fee?.totalFeeAmount,
        paidAmount: fee?.paidAmount,
        pendingAmount: fee?.pendingAmount,
        dueAmount: fee?.dueAmount,
        dueDate: fee?.dueDate ? dayjs(fee.dueDate) : null,
        status: fee?.status, // 👈 NEW — fee-level status, pulled straight from the API response
        feePaymentDTOS: (fee?.feePaymentDTOS || []).map((p: any) => ({
          ...p,
          feePaymentId: p.feePaymentId,
                receiptNo: p.receiptNo, // 👈 NEW — pulled straight from the API response
          paymentDate: p.paymentDate ? dayjs(p.paymentDate) : null,
        })),
      })),
    });
  };

  const onView = async (record: StudentRow) => {
    setViewStudentName(`${record.firstName ?? ""} ${record.lastName ?? ""}`.trim());
    setIsViewOpen(true);
    setViewLoading(true);
    setViewHasFees(true); // avoid a flash of the empty state while loading
    try {
      // GET http://flintinfotech-dev.in:8443/jnpa-school-project/student/getStudentById/{id}
      const res = await api.get(apiEndpoints.getStudentById(record.studentId));
      const studentData = res.data?.data ?? res.data;
      setViewStudent(studentData);
      populateViewForm(extractFees(studentData), record.studentId);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load fee details");
      setViewHasFees(false);
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setIsViewOpen(false);
    viewForm.resetFields();
    setViewStudent(null);
  };

  const columns = [
    {
      title: "Student Code",
      dataIndex: "studentCode",
      key: "studentCode",
      render: (value: string) => value || "-",
    },
    { title: "First Name", dataIndex: "firstName", key: "firstName" },
    { title: "Last Name", dataIndex: "lastName", key: "lastName" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) =>
        status ? <Tag color={statusColor(status)}>{status}</Tag> : "-",
    },
    { title: "Caste", dataIndex: "caste", key: "caste" },
    { title: "Religion", dataIndex: "religion", key: "religion" },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      render: (_: any, record: StudentRow) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button icon={<EyeOutlined />} size="small" onClick={() => onView(record)} />
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} />
        </div>
      ),
    },
  ];

  return (
    <>
      {isMobile ? (
        <div className="space-y-3">
          {loading && (
            <div className="text-center text-sm text-gray-400 py-6">Loading...</div>
          )}
          {!loading && data.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-6">No students found</div>
          )}
          {!loading &&
            data.map((record) => (
              <div
                key={record.studentId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {record.firstName} {record.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Code: {record.studentCode ?? "-"}
                    </p>
                    <p className="text-xs text-gray-500">{record.gender}</p>
                  </div>
                  <Tag color={statusColor(record.status)}>{record.status}</Tag>
                </div>

                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <p>
                    Category: {record.category ?? "-"} | Caste: {record.caste ?? "-"}
                  </p>
                  <p>Religion: {record.religion ?? "-"}</p>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-gray-50">
                  <Button icon={<EyeOutlined />} size="small" onClick={() => onView(record)} />
                  <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} />
                </div>
              </div>
            ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">Total: {pagination.total}</span>
            <div className="flex gap-2">
              <Button
                size="small"
                disabled={pagination.current <= 1}
                onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
              >
                Prev
              </Button>
              <Button
                size="small"
                disabled={pagination.current * pagination.pageSize >= pagination.total}
                onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <CommonTable data={data} columns={columns} loading={loading} pagination={pagination} />
        </div>
      )}

      {/* View is a Drawer (same width/placement style as the Edit drawer)
          instead of a Modal popup. Swap "student-drawer" for your actual
          class if your student page drawer styling uses a different one. */}
      <Drawer
        title={`Fee Details${viewStudentName ? " - " + viewStudentName : ""}`}
        open={isViewOpen}
        onClose={closeView}
        width={720}
        destroyOnClose
        className="fee-drawer"
        styles={{
          body: { background: DRAWER_BG_COLOR, padding: "20px 24px" },
        }}
      >
        <Spin spinning={viewLoading} tip="Loading fee details...">
          {!viewLoading && !viewHasFees ? (
            <Empty description="Fee details not found" style={{ padding: "40px 0" }} />
          ) : (
            <StudentFeeForm
              form={viewForm}
              onFinish={() => {}}
              isEditing={false}
              loading={false}
              viewOnly
              onPrintReceipt={(fee, payment) => setReceiptTarget({ fee, payment })}
            />
          )}
        </Spin>
      </Drawer>

      <FeeReceiptModal
        open={!!receiptTarget}
        onClose={() => setReceiptTarget(null)}
        student={viewStudent}
        academic={viewStudent?.academicInformation?.[0]}
        fee={receiptTarget?.fee ?? null}
        payment={receiptTarget?.payment ?? null}
      />
    </>
  );
}

// ===============================
// Page (list + edit drawer)
// ===============================
export default function StudentFeesManagement() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [hasExistingFees, setHasExistingFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchStudents = useCallback(async (pageNum: number, size: number) => {
    setTableLoading(true);
    try {
      // POST http://flintinfotech-dev.in:8443/jnpa-school-project/student/getAllStudentsByFilter?page=..&size=..&paginate=true
      const res = await api.post(apiEndpoints.getAllStudents(pageNum, size), {});
      const data = res.data?.data ?? {};
      setStudents(data.Data ?? []);
      setTotal(data.Total ?? 0);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load students");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(page, pageSize);
  }, [page, pageSize, fetchStudents]);

  const openEditDrawer = async (record: StudentRow) => {
    setSelectedStudent(record);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      // GET http://flintinfotech-dev.in:8443/jnpa-school-project/student/getStudentById/{id}
      const res = await api.get(apiEndpoints.getStudentById(record.studentId));
      const studentData = res.data?.data ?? res.data;
      const fees = extractFees(studentData);
      setHasExistingFees(fees.length > 0);

      form.setFieldsValue({
        studentId: record.studentId,
        studentFeeDTOS: fees.length
          ? fees.map((fee: any) => ({
              studentFeeId: fee?.studentFeeId,
              academicYear: fee?.academicYear ?? getLoggedInAcademicYear(),
              feeName: fee?.feeName,
              totalFeeAmount: fee?.totalFeeAmount,
              paidAmount: fee?.paidAmount ?? 0,
              pendingAmount: fee?.pendingAmount ?? 0,
              // Due Amount is no longer auto-calculated — left exactly as saved,
              // or empty if there's nothing saved yet.
              dueAmount: fee?.dueAmount ?? undefined,
              dueDate: fee?.dueDate ? dayjs(fee.dueDate) : null,
              status: fee?.status, // 👈 NEW — fee-level status, pulled straight from the API response
              feePaymentDTOS: (fee?.feePaymentDTOS || []).map((p: any) => ({
                ...p,
                feePaymentId: p.feePaymentId,
                receiptNo: p.receiptNo, // 👈 NEW — pulled straight from the API response
                paymentDate: p.paymentDate ? dayjs(p.paymentDate) : null,
              })),
            }))
          : [emptyFeeBlock()],
      });
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load fee details");
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setSelectedStudent(null);
    setHasExistingFees(false);
  };

  const handleFormSubmit = async (values: any) => {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      const fees = values.studentFeeDTOS || [];

      // Each fee is sent as its own flat request — studentId lives INSIDE
      // the object (matching the backend's actual payload shape), not as a
      // separate wrapper. New fees (no studentFeeId yet) go to the save/create
      // endpoint; existing ones go to update.
      await Promise.all(
        fees.map((fee: any) => {
          const payload = {
            ...(fee.studentFeeId ? { studentFeeId: fee.studentFeeId } : {}),
            studentId: selectedStudent.studentId,
            academicYear: fee.academicYear,
            feeName: fee.feeName,
            totalFeeAmount: fee.totalFeeAmount,
            dueDate: fee.dueDate,
            paidAmount: fee.paidAmount,
            pendingAmount: fee.pendingAmount,
            dueAmount: fee.dueAmount,
            // 👇 NEW — pass status through on update so it isn't wiped out;
            // on a new fee this is undefined and the backend presumably
            // assigns it (e.g. "PENDING").
            ...(fee.status ? { status: fee.status } : {}),
            feePaymentDTOS: (fee.feePaymentDTOS || []).map((p: any) => ({
              ...(p.feePaymentId != null ? { feePaymentId: Number(p.feePaymentId) } : {}),
              // 👇 NEW — required by the backend: FEE_PAYMENT_ENTITY.STUDENT_FEE_ID
              // is NOT NULL, so every payment row (new or existing) needs it set
              // explicitly. Without this, adding a new payment while updating an
              // existing fee fails with a NULL constraint violation on insert.
              ...(fee.studentFeeId ? { studentFeeId: fee.studentFeeId } : {}),
              // 👇 NEW — pass receiptNo through on update so it isn't wiped
              // out; on a new payment this is undefined and the backend
              // presumably assigns it.
              ...(p.receiptNo ? { receiptNo: p.receiptNo } : {}),
              amount: p.amount,
              paymentMode: p.paymentMode,
              paymentDate: p.paymentDate,
              transactionId: p.transactionId,
              remarks: p.remarks,
            })),
          };

          return fee.studentFeeId
            ? api.put(apiEndpoints.updateStudentFee(), payload)
            : api.post(apiEndpoints.saveStudentFee(), payload);
        })
      );

      message.success(hasExistingFees ? "Fee records updated successfully" : "Fee records saved successfully");
      closeDrawer();
      fetchStudents(page, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to save fee record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFee = async (studentFeeId: number) => {
    try {
      await api.delete(apiEndpoints.deleteStudentFee(studentFeeId));
      message.success("Fee record deleted successfully");
      if (selectedStudent) {
        openEditDrawer(selectedStudent);
      }
      fetchStudents(page, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete fee record");
    }
  };

  return (
    <div>
      {/* Overrides antd's default faded/gray text on disabled Input / Select /
          DatePicker / InputNumber fields inside the fee drawers, so locked
          fields (Paid Amount, Pending Amount, Receipt No, etc.) stay dark and
          readable instead of looking washed out. Scoped to .fee-drawer only. */}
      <style>{`
        .fee-drawer .ant-input[disabled],
        .fee-drawer .ant-input-disabled,
        .fee-drawer textarea.ant-input-disabled {
          color: rgba(0, 0, 0, 0.88) !important;
          -webkit-text-fill-color: rgba(0, 0, 0, 0.88) !important;
        }

        .fee-drawer .ant-select-disabled .ant-select-selector,
        .fee-drawer .ant-select-disabled .ant-select-selection-item {
          color: rgba(0, 0, 0, 0.88) !important;
        }

        .fee-drawer .ant-picker-disabled .ant-picker-input > input {
          color: rgba(0, 0, 0, 0.88) !important;
        }

        .fee-drawer .ant-input-number-disabled .ant-input-number-input {
          color: rgba(0, 0, 0, 0.88) !important;
        }
      `}</style>

      <StudentFeesTable
        data={students}
        loading={tableLoading}
        pagination={{
          current: page + 1,
          pageSize,
          total,
          onChange: (newPage, newPageSize) => {
            setPage(newPage - 1);
            setPageSize(newPageSize);
          },
        }}
        onEdit={openEditDrawer}
      />

      <Drawer
        title={`${hasExistingFees ? "Update" : "Add"} Fee - ${
          selectedStudent?.firstName ?? ""
        } ${selectedStudent?.lastName ?? ""}`}
        open={drawerOpen}
        onClose={closeDrawer}
        width={720}
        destroyOnClose
        className="fee-drawer"
        styles={{
          body: { background: DRAWER_BG_COLOR, padding: "20px 24px" },
        }}
      >
        <Spin spinning={drawerLoading} tip="Loading fee details...">
          <StudentFeeForm
            form={form}
            onFinish={handleFormSubmit}
            isEditing={hasExistingFees}
            loading={submitting}
            onDelete={handleDeleteFee}
          />
        </Spin>
      </Drawer>
    </div>
  );
}
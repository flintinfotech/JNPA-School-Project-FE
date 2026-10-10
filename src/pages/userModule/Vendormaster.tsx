import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Form,
  Grid,
  Input,
  Pagination,
  Popconfirm,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

import CommonTable from "../../components/commonTable"; 
import api from "../../lib/axios";
import { apiEndpoints } from "../../services/apiEndpoints";

// ============================================================
// TYPES
// ============================================================
interface VendorRow {
  vendorMasterId?: number;
  vendorName?: string;
  mobileNumber?: string;
  address?: string;
  pinCode?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  paymentType?: string;
  vendorType?: string;
  remark?: string;
  academicYear?: string;
  [key: string]: any;
}

interface VendorFormValues {
  vendorName: string;
  vendorType: string;
  mobileNumber: string;
  address: string;
  pinCode: string;
  panNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  paymentType: string;
  remark?: string;
  academicYear: string;
}

interface SelectOption {
  label: string;
  value: string;
}

// ============================================================
// DROPDOWN OPTIONS (label = shown on screen, value = sent to backend)
// Add or remove items here as your backend supports them.
// ============================================================
const VENDOR_TYPE_OPTIONS: SelectOption[] = [
  { label: "Sports Supplier", value: "SPORTS_SUPPLIER" },
  { label: "IT Equipment Supplier", value: "IT_EQUIPMENT_SUPPLIER" },
  { label: "Uniform Supplier", value: "UNIFORM_SUPPLIER" },
  { label: "Stationery Supplier", value: "STATIONERY_SUPPLIER" },
  { label: "Lab Equipment Supplier", value: "LAB_EQUIPMENT_SUPPLIER" },
  { label: "Furniture Supplier", value: "FURNITURE_SUPPLIER" },
  { label: "Transport Provider", value: "TRANSPORT_PROVIDER" },
  { label: "Other", value: "OTHER" },
];

const PAYMENT_TYPE_OPTIONS: SelectOption[] = [
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Cash", value: "CASH" },
  { label: "Cheque", value: "CHEQUE" },
  { label: "UPI", value: "UPI" },
];

// "SPORTS_SUPPLIER" -> "Sports Supplier"
const prettify = (v?: string) =>
  v
    ? v
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "-";

// ============================================================
// ACADEMIC YEAR = the year selected on the login screen
// (useAuth saves it in localStorage as { startDate, endDate }) -> "2026-2027"
// ============================================================
const getLoginAcademicYear = (): string => {
  try {
    const raw = localStorage.getItem("academicYear");
    if (!raw) return "";
    const ay = JSON.parse(raw) as { startDate?: string; endDate?: string };
    if (!ay?.startDate || !ay?.endDate) return "";
    const s = new Date(ay.startDate).getFullYear();
    const e = new Date(ay.endDate).getFullYear();
    if (Number.isNaN(s) || Number.isNaN(e)) return "";
    return `${s}-${e}`;
  } catch {
    return "";
  }
};

// ============================================================
// RESPONSE EXTRACTOR (same style as the other screens)
// ============================================================
const extractListAndTotal = (
  raw: any,
): { list: VendorRow[]; total: number } => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;
  const list: VendorRow[] = Array.isArray(data?.Data)
    ? data.Data
    : Array.isArray(data)
      ? data
      : [];
  const total =
    data?.["Total elements"] ??
    data?.["Total Element"] ??
    data?.["Total Elements"] ??
    data?.Total ??
    list.length;
  return { list, total: Number(total) || 0 };
};

// ============================================================
// FIELD VALIDATION RULES
// ============================================================
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PIN_REGEX = /^\d{6}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{9,18}$/;

const toUpper = (v?: string) => (typeof v === "string" ? v.toUpperCase() : v);
const onlyDigits = (v?: string) =>
  typeof v === "string" ? v.replace(/\D/g, "") : v;

export default function VendorMaster() {
  const [form] = Form.useForm<VendorFormValues>();

  // ---------- responsive (mobile) ----------
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false; // below 768px

  // table
  const [rows, setRows] = useState<VendorRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // drawer (Add / Edit Vendor)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  // null = Add mode, number = Edit mode (id of the vendor being edited)
  const [editingId, setEditingId] = useState<number | null>(null);
  // the record loaded for editing (keeps the academic year already saved on it)
  const [editingRecord, setEditingRecord] = useState<VendorRow | null>(null);
  const [drawerWidth, setDrawerWidth] = useState<number | string>(
    window.innerWidth < 768 ? "100%" : 560,
  );

  useEffect(() => {
    const handleResize = () =>
      setDrawerWidth(window.innerWidth < 768 ? "100%" : 560);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // If a saved vendor has a type / payment type that is not in our list,
  // still show it properly in the dropdown (edit mode).
  const vendorTypeOptions = useMemo(() => {
    const extra = editingRecord?.vendorType;
    return extra && !VENDOR_TYPE_OPTIONS.some((o) => o.value === extra)
      ? [...VENDOR_TYPE_OPTIONS, { label: prettify(extra), value: extra }]
      : VENDOR_TYPE_OPTIONS;
  }, [editingRecord]);

  const paymentTypeOptions = useMemo(() => {
    const extra = editingRecord?.paymentType;
    return extra && !PAYMENT_TYPE_OPTIONS.some((o) => o.value === extra)
      ? [...PAYMENT_TYPE_OPTIONS, { label: prettify(extra), value: extra }]
      : PAYMENT_TYPE_OPTIONS;
  }, [editingRecord]);

  // ---------- LOAD TABLE DATA ----------
  const fetchVendors = useCallback(async (pageNum: number, size: number) => {
    setTableLoading(true);
    try {
      const res = await api.post(
        apiEndpoints.getAllVendorMasterByFilter(pageNum, size),
        {},
      );
      if (res.data?.success === false) {
        message.error(res.data?.message || "Failed to load vendors");
        setRows([]);
        setTotal(0);
        return;
      }
      const { list, total: count } = extractListAndTotal(res);
      setRows(list);
      setTotal(count);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load vendors");
      setRows([]);
      setTotal(0);
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors(page, pageSize);
  }, [fetchVendors, page, pageSize]);

  // ---------- DRAWER ----------
  const openAddDrawer = () => {
    setEditingId(null);
    setEditingRecord(null);
    form.resetFields();
    // Academic Year is always the login year (field is disabled)
    form.setFieldsValue({
      paymentType: "BANK_TRANSFER",
      academicYear: getLoginAcademicYear(),
    });
    setDrawerOpen(true);
  };

  // Edit: GET /vendorMaster/getVendorMaster/{id} -> fill the form
  const openEditDrawer = async (record: VendorRow) => {
    if (record.vendorMasterId === undefined) return;
    setEditingId(record.vendorMasterId);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await api.get(
        apiEndpoints.getVendorMasterById(record.vendorMasterId),
      );
      if (res.data?.success === false) {
        message.error(res.data?.message || "Failed to load vendor");
        setDrawerOpen(false);
        return;
      }
      // response can be { data: {...} } or the object itself
      const d: VendorRow = res.data?.data ?? res.data ?? record;
      setEditingRecord(d);
      form.setFieldsValue({
        vendorName: d.vendorName,
        vendorType: d.vendorType,
        mobileNumber: d.mobileNumber,
        address: d.address,
        pinCode: d.pinCode,
        panNumber: d.panNumber,
        bankName: d.bankName,
        accountNumber: d.accountNumber,
        ifscCode: d.ifscCode,
        paymentType: d.paymentType,
        remark: d.remark,
        academicYear: d.academicYear || getLoginAcademicYear(),
      });
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load vendor");
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId(null);
    setEditingRecord(null);
    form.resetFields();
  };

  // ---------- DELETE ----------
  // DELETE /vendorMaster/deleteVendorMaster/{id}
  const handleDelete = async (record: VendorRow) => {
    if (record.vendorMasterId === undefined) return;
    try {
      const res = await api.delete(
        apiEndpoints.deleteVendorMaster(record.vendorMasterId),
      );

      // backend can send "success": false with HTTP 200 -> check before showing success
      if (res.data?.success === false) {
        message.error(res.data?.message || "Failed to delete vendor");
        return;
      }

      message.success(res.data?.message || "Vendor deleted successfully");

      // if the last row of this page was deleted, go back one page
      const targetPage = rows.length === 1 && page > 0 ? page - 1 : page;
      if (targetPage !== page) setPage(targetPage); // useEffect reloads the table
      else fetchVendors(page, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete vendor");
    }
  };

  // ---------- SAVE ----------
  const handleSubmit = async (values: VendorFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        vendorName: values.vendorName?.trim(),
        mobileNumber: values.mobileNumber,
        address: values.address?.trim(),
        pinCode: values.pinCode,
        panNumber: values.panNumber,
        bankName: values.bankName?.trim(),
        accountNumber: values.accountNumber,
        ifscCode: values.ifscCode,
        paymentType: values.paymentType,
        vendorType: values.vendorType,
        remark: values.remark?.trim() || "",
        // Add: always the login academic year. Edit: keep the year already saved on the vendor
        academicYear: editingId
          ? editingRecord?.academicYear || getLoginAcademicYear()
          : getLoginAcademicYear(),
        // Edit only: the vendor id
        ...(editingId ? { vendorMasterId: editingId } : {}),
      };

      const res = editingId
        ? await api.put(apiEndpoints.updateVendorMaster(), payload)
        : await api.post(apiEndpoints.saveVendorMaster(), payload);

      // backend can send "success": false with HTTP 200 -> check before showing success
      if (res.data?.success === false) {
        message.error(res.data?.message || "Failed to save vendor");
        return;
      }

      message.success(
        res.data?.message ||
          (editingId ? "Vendor updated successfully" : "Vendor saved successfully"),
      );
      const wasEditing = !!editingId;
      closeDrawer();
      if (!wasEditing) setPage(0);
      fetchVendors(wasEditing ? page : 0, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- TABLE COLUMNS ----------
  const columns = [
    {
      title: "Sr No",
      key: "srNo",
      width: 60,
      render: (_: any, __: VendorRow, index: number) =>
        page * pageSize + index + 1,
    },
    {
      title: "Vendor Name",
      dataIndex: "vendorName",
      key: "vendorName",
      render: (v: string) => v || "-",
    },
    {
      title: "Vendor Type",
      dataIndex: "vendorType",
      key: "vendorType",
      render: (v: string) => (v ? <Tag color="blue">{prettify(v)}</Tag> : "-"),
    },
    {
      title: "Mobile",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
      render: (v: string) => v || "-",
    },
    {
      title: "Address",
      key: "address",
      render: (_: any, r: VendorRow) =>
        r.address ? `${r.address}${r.pinCode ? ` - ${r.pinCode}` : ""}` : "-",
    },
    // {
    //   title: "PAN",
    //   dataIndex: "panNumber",
    //   key: "panNumber",
    //   render: (v: string) => v || "-",
    // },
    // {
    //   title: "Bank Name",
    //   dataIndex: "bankName",
    //   key: "bankName",
    //   render: (v: string) => v || "-",
    // },
    // {
    //   title: "Account No.",
    //   dataIndex: "accountNumber",
    //   key: "accountNumber",
    //   render: (v: string) => v || "-",
    // },
    // {
    //   title: "IFSC",
    //   dataIndex: "ifscCode",
    //   key: "ifscCode",
    //   render: (v: string) => v || "-",
    // },
    // {
    //   title: "Payment Type",
    //   dataIndex: "paymentType",
    //   key: "paymentType",
    //   render: (v: string) => (v ? <Tag color="green">{prettify(v)}</Tag> : "-"),
    // },
    // {
    //   title: "Academic Year",
    //   dataIndex: "academicYear",
    //   key: "academicYear",
    //   render: (v: string) => v || "-",
    // },
    // {
    //   title: "Remark",
    //   dataIndex: "remark",
    //   key: "remark",
    //   render: (v: string) => v || "-",
    // },
    {
      title: "Action",
      key: "action",
      width: 90,
      render: (_: any, record: VendorRow) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditDrawer(record)}
          />
          <Popconfirm
            title="Delete this vendor?"
            description="This action cannot be undone."
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // ---------- MOBILE: one row inside a vendor card ----------
  const cardRow = (label: string, value?: ReactNode) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
        borderBottom: "1px dashed #f0f0f0",
      }}
    >
      <span style={{ color: "#8c8c8c", fontSize: 13, flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{ fontSize: 13, textAlign: "right", wordBreak: "break-word" }}
      >
        {value || "-"}
      </span>
    </div>
  );

  // ---------- MOBILE: all vendors as cards ----------
  const renderVendorCards = () => (
    <Spin spinning={tableLoading}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <Card
            key={String(r.vendorMasterId ?? `${page * pageSize + i}`)}
            size="small"
            title={
              <span
                style={{
                  fontWeight: 600,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {r.vendorName || "-"}
              </span>
            }
            extra={
              r.vendorType ? (
                <Tag color="blue" style={{ marginRight: 0 }}>
                  {prettify(r.vendorType)}
                </Tag>
              ) : null
            }
          >
            {cardRow("Mobile", r.mobileNumber)}
            {cardRow("Address", r.address)}
            {cardRow("Pin Code", r.pinCode)}
            {cardRow("PAN", r.panNumber)}
            {cardRow("Bank Name", r.bankName)}
            {cardRow("Account No.", r.accountNumber)}
            {cardRow("IFSC", r.ifscCode)}
            {cardRow(
              "Payment Type",
              r.paymentType ? (
                <Tag color="green" style={{ marginRight: 0 }}>
                  {prettify(r.paymentType)}
                </Tag>
              ) : (
                "-"
              ),
            )}
            {cardRow("Academic Year", r.academicYear)}
            {cardRow("Remark", r.remark)}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => openEditDrawer(r)}
                style={{ flex: 1 }}
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete this vendor?"
                description="This action cannot be undone."
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDelete(r)}
              >
                <Button danger icon={<DeleteOutlined />} style={{ flex: 1 }}>
                  Delete
                </Button>
              </Popconfirm>
            </div>
          </Card>
        ))}
      </div>

      <div
        style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}
      >
        <Pagination
          simple
          current={page + 1}
          pageSize={pageSize}
          total={total}
          showSizeChanger={false}
          onChange={(newPage) => setPage(newPage - 1)}
        />
      </div>
    </Spin>
  );

  return (
    <Card
      title="Vendor Master"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          {isMobile ? "Add" : "Add Vendor"}
        </Button>
      }
    >
      {!tableLoading && rows.length === 0 ? (
        <Empty description="No vendors found" style={{ padding: "40px 0" }} />
      ) : isMobile ? (
        // MOBILE: vendors in card view
        renderVendorCards()
      ) : (
        // DESKTOP: table
        <div style={{ width: "100%", overflowX: "auto" }}>
          <CommonTable<VendorRow>
            data={rows}
            columns={columns}
            loading={tableLoading}
            rowKey={(r: VendorRow) =>
              String(r.vendorMasterId ?? JSON.stringify(r))
            }
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

      {/* ---------- Add / Edit Vendor drawer ---------- */}
      <Drawer
        title={editingId ? "Edit Vendor" : "Add Vendor"}
        open={drawerOpen}
        onClose={closeDrawer}
        width={drawerWidth}
        destroyOnClose
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={drawerLoading}
              onClick={() => form.submit()}
            >
              {editingId ? "Update" : "Save"}
            </Button>
          </div>
        }
      >
        <Spin spinning={drawerLoading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {/* ---------- Vendor details ---------- */}
            <Typography.Text strong>Vendor Details</Typography.Text>
            <Divider style={{ margin: "8px 0 16px" }} />
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Vendor Name"
                  name="vendorName"
                  rules={[
                    { required: true, whitespace: true, message: "Enter vendor name" },
                  ]}
                >
                  <Input placeholder="Vendor Name" maxLength={100} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Vendor Type"
                  name="vendorType"
                  rules={[{ required: true, message: "Select vendor type" }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Vendor Type"
                    options={vendorTypeOptions}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Mobile Number"
                  name="mobileNumber"
                  normalize={onlyDigits}
                  rules={[
                    { required: true, message: "Enter mobile number" },
                    { pattern: MOBILE_REGEX, message: "Enter a valid 10 digit mobile number" },
                  ]}
                >
                  <Input placeholder="Mobile Number" maxLength={10} inputMode="numeric" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="PAN Number"
                  name="panNumber"
                  normalize={toUpper}
                  rules={[
                    { required: true, message: "Enter PAN number" },
                    { pattern: PAN_REGEX, message: "Enter a valid PAN (e.g. ABCDE1234F)" },
                  ]}
                >
                  <Input placeholder="PAN Number" maxLength={10} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={16}>
                <Form.Item
                  label="Address"
                  name="address"
                  rules={[{ required: true, whitespace: true, message: "Enter address" }]}
                >
                  <Input.TextArea rows={2} placeholder="Address" maxLength={250} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  label="Pin Code"
                  name="pinCode"
                  normalize={onlyDigits}
                  rules={[
                    { required: true, message: "Enter pin code" },
                    { pattern: PIN_REGEX, message: "Enter a valid 6 digit pin code" },
                  ]}
                >
                  <Input placeholder="Pin Code" maxLength={6} inputMode="numeric" />
                </Form.Item>
              </Col>
            </Row>

            {/* ---------- Bank & payment details ---------- */}
            <Typography.Text strong>Bank & Payment Details</Typography.Text>
            <Divider style={{ margin: "8px 0 16px" }} />
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Bank Name"
                  name="bankName"
                  rules={[{ required: true, whitespace: true, message: "Enter bank name" }]}
                >
                  <Input placeholder="Bank Name" maxLength={100} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Payment Type"
                  name="paymentType"
                  rules={[{ required: true, message: "Select payment type" }]}
                >
                  <Select placeholder="Payment Type" options={paymentTypeOptions} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Account Number"
                  name="accountNumber"
                  normalize={onlyDigits}
                  rules={[
                    { required: true, message: "Enter account number" },
                    { pattern: ACCOUNT_REGEX, message: "Enter a valid account number (9-18 digits)" },
                  ]}
                >
                  <Input placeholder="Account Number" maxLength={18} inputMode="numeric" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="IFSC Code"
                  name="ifscCode"
                  normalize={toUpper}
                  rules={[
                    { required: true, message: "Enter IFSC code" },
                    { pattern: IFSC_REGEX, message: "Enter a valid IFSC (e.g. HDFC0001234)" },
                  ]}
                >
                  <Input placeholder="IFSC Code" maxLength={11} />
                </Form.Item>
              </Col>
            </Row>

            {/* ---------- Other ---------- */}
            <Typography.Text strong>Other</Typography.Text>
            <Divider style={{ margin: "8px 0 16px" }} />
            <Row gutter={16}>
              {/* Login academic year, disabled */}
              <Col xs={24} sm={12}>
                <Form.Item label="Academic Year" name="academicYear">
                  <Input disabled />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item label="Remark" name="remark">
                  <Input.TextArea rows={3} placeholder="Remark" maxLength={250} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Drawer>
    </Card>
  );
}
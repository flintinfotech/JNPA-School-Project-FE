import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Grid,
  Input,
  InputNumber,
  Pagination,
  Popconfirm,
  Row,
  Select,
  Spin,
  Tag,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import CommonTable from "../components/commonTable";
import api from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

/* Add these 3 in apiEndpoints.ts:
  saveRequestApproval: () => `/jnpa-school-project/requestApproval/saveRequestApproval`,
  getAllRequestApprovalByFilter: (page: number, size: number) =>
    `/jnpa-school-project/requestApproval/getAllRequestApprovalByFilter?page=${page}&size=${size}&desc&paginate=true`,
  getRequestApprovalById: (requestApprovalId: number | string) =>
    `/jnpa-school-project/requestApproval/getRequestApproval/${requestApprovalId}`,
  updateRequestApproval: () => `/jnpa-school-project/requestApproval/updateRequestApproval`,
  deleteRequestApproval: (requestApprovalId: number | string) =>
    `/jnpa-school-project/requestApproval/deleteRequestApproval/${requestApprovalId}`,
*/

// ============================================================
// TYPES
// ============================================================
interface RequestApprovalRow {
  requestApprovalId?: number;
  requestType?: string;
  remark?: string;
  requestedDate?: string;
  estimatedAmount?: number;
  priority?: string;
  Quantity?: string | number;
  quantity?: string | number;
  academicYear?: string;
  status?: string;
  // purchaseDTO comes from the backend but is NOT shown on the screen
  [key: string]: any;
}

// One row of Purchase Master (same API the School Expenses screen uses)
interface PurchaseRow {
  purchaseId: number;
  productCode?: string;
  category?: string;
  productName?: string;
  purchaseDate?: string | null;
  [key: string]: any;
}

interface RequestApprovalFormValues {
  purchaseId: number; // Product Name dropdown (stores the purchaseId)
  category: string; // auto-filled from the selected product, disabled
  requestType: string;
  remark: string;
  requestedDate: dayjs.Dayjs;
  estimatedAmount: number;
  priority: string;
  quantity: number;
  academicYear: string;
  status: string;
}

// ============================================================
// DROPDOWN OPTIONS (label = shown on screen, value = sent to backend)
// ============================================================
const REQUEST_TYPE_OPTIONS = [{ label: "Purchase", value: "PURCHASE" }];

const PRIORITY_OPTIONS = [
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
];

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: "orange",
  APPROVED: "green",
  REJECTED: "red",
};

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "red",
  MEDIUM: "gold",
  LOW: "blue",
};

const money = (v?: number | null) =>
  v === null || v === undefined
    ? "-"
    : `₹ ${Number(v).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

// "PENDING" -> "Pending"
const capitalize = (v?: string) =>
  v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "-";

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
): { list: RequestApprovalRow[]; total: number } => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;
  const list: RequestApprovalRow[] = Array.isArray(data?.Data)
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

// Purchase Master list response -> array (same extractor as School Expenses)
const extractPurchaseList = (raw: any): PurchaseRow[] => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;
  if (Array.isArray(data?.Data)) return data.Data;
  if (Array.isArray(data?.PurchaseDTOS)) return data.PurchaseDTOS;
  if (Array.isArray(data?.purchaseDTOS)) return data.purchaseDTOS;
  if (Array.isArray(data)) return data;
  return [];
};

export default function RequestApproval() {
  const [form] = Form.useForm<RequestApprovalFormValues>();

  // ---------- responsive (mobile) ----------
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false; // below 768px

  // table
  const [rows, setRows] = useState<RequestApprovalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // Purchase Master (source of Product Name + Category)
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // drawer (Add Request)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  // null = Add mode, number = Edit mode (id of the request being edited)
  const [editingId, setEditingId] = useState<number | null>(null);
  // the record loaded for editing (kept so hidden fields like purchaseDTO go back unchanged)
  const [editingRecord, setEditingRecord] = useState<RequestApprovalRow | null>(null);
  const [drawerWidth, setDrawerWidth] = useState<number | string>(
    window.innerWidth < 768 ? "100%" : 480,
  );

  useEffect(() => {
    const handleResize = () =>
      setDrawerWidth(window.innerWidth < 768 ? "100%" : 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------- LOAD TABLE DATA ----------
  const fetchRequests = useCallback(
    async (pageNum: number, size: number) => {
      setTableLoading(true);
      try {
        const res = await api.post(
          apiEndpoints.getAllRequestApprovalByFilter(pageNum, size),
          {},
        );
        if (res.data?.success === false) {
          message.error(res.data?.message || "Failed to load requests");
          setRows([]);
          setTotal(0);
          return;
        }
        const { list, total: count } = extractListAndTotal(res);
        setRows(list);
        setTotal(count);
      } catch (error: any) {
        message.error(
          error?.response?.data?.message || "Failed to load requests",
        );
        setRows([]);
        setTotal(0);
      } finally {
        setTableLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchRequests(page, pageSize);
  }, [fetchRequests, page, pageSize]);

  // ---------- LOAD PURCHASE MASTER (for the Product Name dropdown) ----------
  const fetchPurchases = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const res = await api.post(apiEndpoints.getAllPurchaseByFilter(0, 100), {});
      setPurchases(res.data?.success === false ? [] : extractPurchaseList(res));
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Failed to load products",
      );
      setPurchases([]);
    } finally {
      setPurchaseLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const productOptions = useMemo(
    () =>
      purchases.map((p) => ({
        label: p.productName || String(p.purchaseId),
        value: p.purchaseId,
      })),
    [purchases],
  );

  // Product Name chosen -> fill Category automatically
  const handleProductChange = (purchaseId: number) => {
    const p = purchases.find((x) => Number(x.purchaseId) === Number(purchaseId));
    form.setFieldsValue({ category: p?.category });
  };

  // ---------- DRAWER ----------
  const openAddDrawer = () => {
    setEditingId(null);
    setEditingRecord(null);
    form.resetFields();
    // Academic Year is always the login year (field is disabled)
    form.setFieldsValue({
      requestType: "PURCHASE",
      status: "PENDING",
      academicYear: getLoginAcademicYear(),
    });
    setDrawerOpen(true);
  };

  // Edit: GET /requestApproval/getRequestApproval/{id} -> fill the form
  const openEditDrawer = async (record: RequestApprovalRow) => {
    if (record.requestApprovalId === undefined) return;
    setEditingId(record.requestApprovalId);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await api.get(
        apiEndpoints.getRequestApprovalById(record.requestApprovalId),
      );
      if (res.data?.success === false) {
        message.error(res.data?.message || "Failed to load request");
        setDrawerOpen(false);
        return;
      }
      // response can be { data: {...} } or the object itself
      const d: RequestApprovalRow = res.data?.data ?? res.data ?? record;
      setEditingRecord(d);
      form.setFieldsValue({
        purchaseId: d.purchaseDTO?.purchaseId,
        category: d.purchaseDTO?.category,
        requestType: d.requestType,
        remark: d.remark,
        requestedDate: d.requestedDate ? dayjs(d.requestedDate) : undefined,
        estimatedAmount: d.estimatedAmount,
        priority: d.priority,
        quantity: Number(d.Quantity ?? d.quantity) || undefined,
        academicYear: d.academicYear || getLoginAcademicYear(),
        status: d.status,
      } as any);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load request");
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  // ---------- DELETE ----------
  // DELETE /requestApproval/deleteRequestApproval/{id}
  const handleDelete = async (record: RequestApprovalRow) => {
    if (record.requestApprovalId === undefined) return;
    try {
      const res = await api.delete(
        apiEndpoints.deleteRequestApproval(record.requestApprovalId),
      );

      // backend can send "success": false with HTTP 200 -> check before showing success
      if (res.data?.success === false) {
        message.error(res.data?.message || "Failed to delete request");
        return;
      }

      message.success(res.data?.message || "Request deleted successfully");

      // if the last row of this page was deleted, go back one page
      const targetPage = rows.length === 1 && page > 0 ? page - 1 : page;
      if (targetPage !== page) setPage(targetPage); // useEffect reloads the table
      else fetchRequests(page, pageSize);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Failed to delete request",
      );
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId(null);
    setEditingRecord(null);
    form.resetFields();
  };

  // purchaseDTO for the payload: from Purchase Master, or (edit) from what the backend returned
  const buildPurchaseDTO = (purchaseId: number) => {
    const p =
      purchases.find((x) => Number(x.purchaseId) === Number(purchaseId)) ||
      editingRecord?.purchaseDTO;
    return {
      purchaseId: Number(purchaseId),
      productCode: p?.productCode,
      category: p?.category,
      productName: p?.productName,
      purchaseDate: p?.purchaseDate ?? undefined,
    };
  };

  // ---------- SAVE ----------
  const handleSubmit = async (values: RequestApprovalFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        requestType: values.requestType,
        remark: values.remark,
        requestedDate: values.requestedDate.format("YYYY-MM-DD"),
        estimatedAmount: values.estimatedAmount,
        priority: values.priority,
        Quantity: String(values.quantity), // backend key is "Quantity" (capital Q), string
        // Add: always the login academic year. Edit: keep the year already saved on the request
        academicYear: editingId
          ? editingRecord?.academicYear || getLoginAcademicYear()
          : getLoginAcademicYear(),
        status: values.status,
        // purchaseDTO = the product selected in the Product Name dropdown
        purchaseDTO: buildPurchaseDTO(values.purchaseId),
        // Edit only: the request id
        ...(editingId ? { requestApprovalId: editingId } : {}),
      };

      const res = editingId
        ? await api.put(apiEndpoints.updateRequestApproval(), payload)
        : await api.post(apiEndpoints.saveRequestApproval(), payload);

      // backend can send "success": false with HTTP 200 -> check before showing success
      if (res.data?.success === false) {
        message.error(res.data?.message || "Failed to save request");
        return;
      }

      message.success(
        res.data?.message ||
          (editingId ? "Request updated successfully" : "Request saved successfully"),
      );
      const wasEditing = !!editingId;
      closeDrawer();
      if (!wasEditing) setPage(0);
      fetchRequests(wasEditing ? page : 0, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to save request");
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
      render: (_: any, __: RequestApprovalRow, index: number) =>
        page * pageSize + index + 1,
    },
    {
      title: "Product Name",
      key: "productName",
      render: (_: any, r: RequestApprovalRow) => r.purchaseDTO?.productName || "-",
    },
    {
      title: "Category",
      key: "category",
      render: (_: any, r: RequestApprovalRow) => r.purchaseDTO?.category || "-",
    },
    {
      title: "Request Type",
      dataIndex: "requestType",
      key: "requestType",
      render: (v: string) => capitalize(v),
    },
    {
      title: "Requested Date",
      dataIndex: "requestedDate",
      key: "requestedDate",
      render: (v: string) => (v ? dayjs(v).format("DD-MM-YYYY") : "-"),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (v: string) =>
        v ? (
          <Tag color={PRIORITY_COLOR[v.toUpperCase()] || "default"}>
            {capitalize(v)}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_: any, r: RequestApprovalRow) => r.Quantity ?? r.quantity ?? "-",
    },
    {
      title: "Estimated Amount",
      dataIndex: "estimatedAmount",
      key: "estimatedAmount",
      render: (v: number) =>
        v === null || v === undefined
          ? "-"
          : `₹ ${Number(v).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
    },
    {
      title: "Academic Year",
      dataIndex: "academicYear",
      key: "academicYear",
      render: (v: string) => v || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) =>
        v ? (
          <Tag color={STATUS_COLOR[v.toUpperCase()] || "default"}>
            {capitalize(v)}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Remark",
      dataIndex: "remark",
      key: "remark",
      render: (v: string) => v || "-",
    },
    {
      title: "Action",
      key: "action",
      width: 90,
      render: (_: any, record: RequestApprovalRow) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditDrawer(record)}
          />
          <Popconfirm
            title="Delete this request?"
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

  // ---------- MOBILE: one row inside a request card ----------
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

  // ---------- MOBILE: all requests as cards ----------
  const renderRequestCards = () => (
    <Spin spinning={tableLoading}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <Card
            key={String(r.requestApprovalId ?? `${page * pageSize + i}`)}
            size="small"
            title={
              <span
                style={{
                  fontWeight: 600,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {r.purchaseDTO?.productName || "-"}
              </span>
            }
            extra={
              r.status ? (
                <Tag
                  color={STATUS_COLOR[r.status.toUpperCase()] || "default"}
                  style={{ marginRight: 0 }}
                >
                  {capitalize(r.status)}
                </Tag>
              ) : null
            }
          >
            {cardRow("Category", r.purchaseDTO?.category)}
            {cardRow("Request Type", capitalize(r.requestType))}
            {cardRow(
              "Requested Date",
              r.requestedDate ? dayjs(r.requestedDate).format("DD-MM-YYYY") : "-",
            )}
            {cardRow(
              "Priority",
              r.priority ? (
                <Tag
                  color={PRIORITY_COLOR[r.priority.toUpperCase()] || "default"}
                  style={{ marginRight: 0 }}
                >
                  {capitalize(r.priority)}
                </Tag>
              ) : (
                "-"
              ),
            )}
            {cardRow("Quantity", String(r.Quantity ?? r.quantity ?? "-"))}
            {cardRow("Estimated Amount", money(r.estimatedAmount))}
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
                title="Delete this request?"
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
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Add Request
        </Button>
      }
    >
      {!tableLoading && rows.length === 0 ? (
        <Empty description="No requests found" style={{ padding: "40px 0" }} />
      ) : isMobile ? (
        // MOBILE: requests in card view
        renderRequestCards()
      ) : (
        // DESKTOP: table
        <div style={{ width: "100%", overflowX: "auto" }}>
          <CommonTable<RequestApprovalRow>
            data={rows}
            columns={columns}
            loading={tableLoading}
            rowKey={(r: RequestApprovalRow) =>
              String(r.requestApprovalId ?? JSON.stringify(r))
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

      {/* ---------- Add Request drawer ---------- */}
      <Drawer
        title={editingId ? "Edit Request" : "Add Request"}
        open={drawerOpen}
        onClose={closeDrawer}
        width={drawerWidth}
        destroyOnClose
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button type="primary" loading={submitting} disabled={drawerLoading} onClick={() => form.submit()}>
              Save
            </Button>
          </div>
        }
      >
        <Spin spinning={drawerLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            {/* Product Name (from Purchase Master) */}
            <Col xs={24} sm={12}>
              <Form.Item
                label="Product Name"
                name="purchaseId"
                rules={[{ required: true, message: "Select product name" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Product Name"
                  loading={purchaseLoading}
                  options={productOptions}
                  onChange={handleProductChange}
                />
              </Form.Item>
            </Col>

            {/* Category (auto-filled from the product, disabled) */}
            <Col xs={24} sm={12}>
              <Form.Item label="Category" name="category">
                <Input disabled placeholder="Category" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Request Type"
                name="requestType"
                rules={[{ required: true, message: "Select request type" }]}
              >
                <Select options={REQUEST_TYPE_OPTIONS} placeholder="Request Type" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Requested Date"
                name="requestedDate"
                rules={[{ required: true, message: "Select requested date" }]}
              >
                <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true, message: "Select priority" }]}
              >
                <Select options={PRIORITY_OPTIONS} placeholder="Priority" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[{ required: true, message: "Enter quantity" }]}
              >
                <InputNumber min={1} precision={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Estimated Amount"
                name="estimatedAmount"
                rules={[{ required: true, message: "Enter estimated amount" }]}
              >
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            {/* Login academic year, disabled */}
            <Col xs={24} sm={12}>
              <Form.Item label="Academic Year" name="academicYear">
                <Input disabled />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: "Select status" }]}
              >
                <Select options={STATUS_OPTIONS} placeholder="Status" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Remark"
                name="remark"
                rules={[{ required: true, message: "Enter remark" }]}
              >
                <Input.TextArea rows={3} placeholder="Remark" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        </Spin>
      </Drawer>
    </Card>
  );
}
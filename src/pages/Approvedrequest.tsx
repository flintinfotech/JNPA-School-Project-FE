import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Grid,
  Input,
  InputNumber,
  Pagination,
  Row,
  Select,
  Spin,
  Tag,
  message,
} from "antd";
import {
  EditOutlined,
  ProfileOutlined,
  ShoppingOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import CommonTable from "../components/commonTable";
import api from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

const { Option } = Select;

// ============================================================
// TYPES
// ============================================================
interface RequestApprovalRow {
  requestApprovalId?: number;
  orderNumber?: string | number;
  requestType?: string;
  remark?: string;
  cancellationReason?: string;
  requestedDate?: string;
  estimatedAmount?: number;
  priority?: string;
  Quantity?: string | number;
  quantity?: string | number;
  academicYear?: string;
  status?: string;
  // purchaseDTO comes from the backend (product of the request)
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

// One row of Vendor Master (getAllVendorMasterByFilter)
interface VendorRow {
  vendorMasterId: number;
  vendorName?: string;
  vendorType?: string;
  mobileNumber?: string;
  [key: string]: any;
}

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

// Payload for getAllRequestApprovalByFilter -> the screen shows ONLY approved requests
const LIST_FILTER_PAYLOAD = {
  status: "APPROVED",
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

// "MAINTENANCE" / "SOME_TYPE" -> "Maintenance" / "Some Type"
const prettify = (v?: string) =>
  v
    ? v
        .split("_")
        .map((w) => capitalize(w))
        .join(" ")
    : "-";

// Academic year starts in April: Oct 2026 -> "2026-2027", Feb 2027 -> "2026-2027"
const getAcademicYear = (d: Dayjs = dayjs()) => {
  const y = d.year();
  return d.month() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

// The Product Name dropdown value (productCode, or purchaseId when there is no code)
const productKey = (p?: { productCode?: string; purchaseId?: number } | null) =>
  p ? String(p.productCode ?? p.purchaseId ?? "") : "";

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
// RESPONSE EXTRACTORS (same style as the other screens)
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

// Vendor Master list response -> array
const extractVendorList = (raw: any): VendorRow[] => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;
  if (Array.isArray(data?.Data)) return data.Data;
  if (Array.isArray(data)) return data;
  return [];
};

export default function RequestApproval() {
  const [form] = Form.useForm();

  // ---------- responsive (mobile) ----------
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false; // below 768px

  // table
  const [rows, setRows] = useState<RequestApprovalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // Purchase Master (source of Category + Product Name)
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Vendor Master (source of the Vendor dropdown)
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [vendorLoading, setVendorLoading] = useState(false);

  // drawer (School Expense form)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  // the approved request that is being edited (its academic year is reused in the expense)
  const [editingRecord, setEditingRecord] = useState<RequestApprovalRow | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRow | null>(null);
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
  // Sends { status: "APPROVED" } so only approved requests come back
  const fetchRequests = useCallback(
    async (pageNum: number, size: number) => {
      setTableLoading(true);
      try {
        const res = await api.post(
          apiEndpoints.getAllRequestApprovalByFilter(pageNum, size),
          LIST_FILTER_PAYLOAD,
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

  // ---------- LOAD PURCHASE MASTER (for the Category / Product Name dropdowns) ----------
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

  // ---------- LOAD VENDOR MASTER (for the Vendor dropdown) ----------
  // POST /vendorMaster/getAllVendorMasterByFilter?page=0&size=100&desc&paginate=true  body: {}
  const fetchVendors = useCallback(async () => {
    setVendorLoading(true);
    try {
      const res = await api.post(apiEndpoints.getAllVendorMasterByFilter(0, 100), {});
      setVendors(res.data?.success === false ? [] : extractVendorList(res));
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Failed to load vendors",
      );
      setVendors([]);
    } finally {
      setVendorLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Unique category list for the drawer's Category dropdown
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [purchases]);

  // Live-watched values from the drawer form
  const drawerCategoryFilter = Form.useWatch("categoryFilter", form);
  const watchTotal = Form.useWatch("total", form);
  const watchPaid = Form.useWatch("paidAmount", form);
  const watchPending = Form.useWatch("pendingAmount", form);

  // Product Name dropdown: only the products of the selected category
  const filteredPurchaseOptions = useMemo(() => {
    const list = !drawerCategoryFilter
      ? purchases
      : purchases.filter((p) => p.category === drawerCategoryFilter);

    // the request's product may not be in Purchase Master any more -> keep its option in the list
    if (selectedPurchase && !list.some((p) => productKey(p) === productKey(selectedPurchase))) {
      return [selectedPurchase, ...list];
    }
    return list;
  }, [purchases, drawerCategoryFilter, selectedPurchase]);

  // Category changed -> narrow the products and clear the selected one
  const handleCategoryFilterChange = (category?: string) => {
    form.setFieldsValue({ categoryFilter: category, productKey: undefined });
    setSelectedPurchase(null);
  };

  // Product changed
  const handlePurchaseChange = (key?: string) => {
    const purchase = purchases.find((item) => productKey(item) === key) || null;
    setSelectedPurchase(purchase);
    form.setFieldsValue({ productKey: key });
  };

  // Total = Quantity x Price, Pending = Total - Paid
  const updateTotal = () => {
    const quantity = Number(form.getFieldValue("quantity") || 0);
    const price = Number(form.getFieldValue("price") || 0);
    const totalValue = quantity * price;
    const paid = Number(form.getFieldValue("paidAmount") || 0);
    form.setFieldsValue({
      total: totalValue,
      pendingAmount: Math.max(totalValue - paid, 0),
    });
  };

  // Pending Amount = Total - Paid Amount (auto, read-only in the form)
  const updatePending = () => {
    const totalValue = Number(form.getFieldValue("total") || 0);
    const paid = Number(form.getFieldValue("paidAmount") || 0);
    form.setFieldsValue({ pendingAmount: Math.max(totalValue - paid, 0) });
  };

  // ---------- DRAWER ----------
  // Edit (on an approved request) opens the School Expense form,
  // with the product and quantity of that request already filled.
  const openEditDrawer = async (record: RequestApprovalRow) => {
    if (record.requestApprovalId === undefined) return;
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      // latest data of the request from the server (falls back to the table row)
      let d: RequestApprovalRow = record;
      try {
        const res = await api.get(
          apiEndpoints.getRequestApprovalById(record.requestApprovalId),
        );
        if (res.data?.success !== false) d = res.data?.data ?? res.data ?? record;
      } catch (e) {
        console.error("Get request by id failed, using the table row:", e);
      }
      setEditingRecord(d);

      const dto = d.purchaseDTO || {};

      // find the same product in Purchase Master (by product code / id, else by category + name)
      let purchase: PurchaseRow | null =
        purchases.find((p) => dto.productCode && p.productCode === dto.productCode) ||
        purchases.find((p) => dto.purchaseId && Number(p.purchaseId) === Number(dto.purchaseId)) ||
        purchases.find((p) => p.productName === dto.productName && p.category === dto.category) ||
        null;

      // not in Purchase Master -> still show what the request itself has
      if (!purchase && (dto.productName || dto.productCode)) {
        purchase = {
          purchaseId: Number(dto.purchaseId) || 0,
          category: dto.category,
          productCode: dto.productCode,
          productName: dto.productName,
        };
      }
      setSelectedPurchase(purchase);

      form.resetFields();
      form.setFieldsValue({
        categoryFilter: purchase?.category ?? dto.category,
        productKey: purchase ? productKey(purchase) : undefined,
        vendorMasterId: undefined,
        // Order Number comes from the backend (shown disabled in Billing Details)
        orderNumber: d.orderNumber ?? record.orderNumber,
        quantity: Number(d.Quantity ?? d.quantity) || 1,
        price: 0,
        total: 0,
        paidAmount: 0,
        pendingAmount: 0,
        status: "PENDING",
        purchaseDate: dayjs(), // defaults to today, can be changed
      });
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load request");
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingRecord(null);
    setSelectedPurchase(null);
    form.resetFields();
  };

  // ---------- SAVE ----------
  // POST schoolExpenses/saveSchoolExpenses  (the School Expense save API)
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();

      // product details come from the selected product (copied into the payload)
      const product =
        purchases.find((p) => productKey(p) === values.productKey) ||
        (selectedPurchase && productKey(selectedPurchase) === values.productKey
          ? selectedPurchase
          : null);
      if (!product) {
        message.error("Please select product");
        return;
      }

      // the backend needs the purchaseId of the product ("The given id must not be null")
      if (!product.purchaseId) {
        message.error("This product was not found in Purchase Master. Please select the product again.");
        return;
      }

      setSubmitting(true);
      try {
        const quantity = Number(values.quantity || 0);
        const price = Number(values.price || 0);
        const totalValue = quantity * price;
        const paidAmount = Number(values.paidAmount || 0);
        const pendingAmount = Math.max(totalValue - paidAmount, 0);
        const purchaseDate = dayjs(values.purchaseDate).format("YYYY-MM-DD"); // sent as YYYY-MM-DD

        const payload = {
          price,
          quantity,
          total: totalValue,
          paidAmount,
          pendingAmount,
          academicYear:
            editingRecord?.academicYear ||
            getLoginAcademicYear() ||
            getAcademicYear(dayjs(values.purchaseDate)),
          purchaseDate,
          status: values.status,
          productCode: product.productCode,
          category: product.category,
          productName: product.productName,
          // REQUIRED by the backend: id of the product in Purchase Master
          purchaseId: Number(product.purchaseId),
          // vendor chosen in the Vendor dropdown
          vendorMasterId: Number(values.vendorMasterId),
        };
        console.log("SAVE SCHOOL EXPENSE PAYLOAD:", payload);

        const res = await api.post(apiEndpoints.saveSchoolExpenses(), payload);

        // backend can send "success": false with HTTP 200 -> check before showing success
        if (res?.data?.success === false) {
          message.error(res?.data?.message || "Failed to save school expense");
          return;
        }
        message.success(res?.data?.message || "School expense saved successfully");
        closeDrawer();
        fetchRequests(page, pageSize);
      } catch (error: any) {
        console.error("Save error:", error);
        message.error(error?.response?.data?.message || "Failed to save school expense");
      } finally {
        setSubmitting(false);
      }
    } catch {
      // Ant Design validation errors are automatically displayed.
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
      // value comes from the backend (orderNumber)
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (v: string | number) => v ?? "-",
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
      render: (v: string) => prettify(v),
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
      render: (v: number) => money(v),
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
      // only one icon (Edit), placed in the middle of the column
      title: "Action",
      key: "action",
      width: 90,
      align: "center" as const,
      render: (_: any, record: RequestApprovalRow) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditDrawer(record)}
          />
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
            {cardRow("Request Type", prettify(r.requestType))}
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

            {/* only the Edit button (same as the table: one action) */}
            <div style={{ display: "flex", marginTop: 12 }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => openEditDrawer(r)}
                style={{ flex: 1 }}
              >
                Edit
              </Button>
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
    <Card>
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

      {/* ---------- School Expense drawer (opens on Edit) — premium look ---------- */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 42, height: 42, borderRadius: 12, fontSize: 20, color: "#fff",
                background: "linear-gradient(135deg,#6366f1,#2563eb)",
                boxShadow: "0 6px 16px rgba(37,99,235,0.35)",
              }}
            >
              <ShoppingOutlined />
            </span>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
                Add School Expense
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "#6b7280" }}>
                Fill in the details to record a new expense
              </div>
            </div>
          </div>
        }
        open={drawerOpen}
        onClose={closeDrawer}
        width={drawerWidth}
        destroyOnClose
        placement="right"
        maskClosable={!submitting}
        closable={!submitting}
        styles={{
          header: { borderBottom: "1px solid #eef0f6", padding: "18px 24px", background: "#fff" },
          body: { padding: 20, background: "linear-gradient(180deg,#f5f7fb 0%,#eef2f9 100%)" },
          footer: { borderTop: "1px solid #eef0f6", padding: "14px 24px", background: "#fff" },
        }}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button size="large" onClick={closeDrawer} disabled={submitting} style={{ borderRadius: 10, minWidth: 100 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              loading={submitting}
              disabled={drawerLoading}
              onClick={handleFinish}
              style={{
                borderRadius: 10, minWidth: 130, fontWeight: 600, border: "none",
                background: "linear-gradient(135deg,#6366f1,#2563eb)",
                boxShadow: "0 6px 16px rgba(37,99,235,0.35)",
              }}
            >
              Save Expense
            </Button>
          </div>
        }
      >
        <Spin spinning={drawerLoading} tip="Loading...">
          <Form form={form} layout="vertical" requiredMark={false}>
            {/* hidden fields kept in the form (shown in the summary strip below) */}
            <Form.Item name="total" hidden><InputNumber /></Form.Item>
            <Form.Item name="pendingAmount" hidden><InputNumber /></Form.Item>

            {/* ---------- 1. PRODUCT DETAILS ---------- */}
            <Card
              size="small"
              style={{ borderRadius: 16, border: "1px solid #e8ecf5", boxShadow: "0 4px 18px rgba(31,41,55,0.06)", marginBottom: 16 }}
              styles={{ body: { padding: 18 } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 30, height: 30, borderRadius: 9, color: "#4f46e5", background: "#eef2ff", fontSize: 15,
                  }}
                >
                  <ProfileOutlined />
                </span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Product Details</span>
              </div>

              <Form.Item label={<span style={{ fontWeight: 600 }}>Category</span>} name="categoryFilter">
                <Select
                  size="large"
                  placeholder="Select category"
                  loading={purchaseLoading}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  onChange={handleCategoryFilterChange}
                >
                  {categoryOptions.map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label={<span style={{ fontWeight: 600 }}>Product Name</span>}
                name="productKey"
                rules={[{ required: true, message: "Please select product" }]}
              >
                <Select
                  size="large"
                  placeholder="Select product"
                  loading={purchaseLoading}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  onChange={handlePurchaseChange}
                >
                  {filteredPurchaseOptions.map((purchase) => (
                    <Option
                      key={productKey(purchase)}
                      value={productKey(purchase)}
                      label={`${purchase.productName ?? ""} ${purchase.productCode ?? ""}`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{purchase.productName}</span>
                        <span style={{ color: "#9ca3af", fontSize: 12, marginLeft: 8 }}>{purchase.productCode}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* VENDOR — list comes from getAllVendorMasterByFilter */}
              <Form.Item
                label={<span style={{ fontWeight: 600 }}>Vendor</span>}
                name="vendorMasterId"
                rules={[{ required: true, message: "Please select vendor" }]}
                style={{ marginBottom: selectedPurchase ? 12 : 0 }}
              >
                <Select
                  size="large"
                  placeholder="Select vendor"
                  loading={vendorLoading}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                >
                  {vendors.map((vendor) => (
                    <Option
                      key={vendor.vendorMasterId}
                      value={vendor.vendorMasterId}
                      label={`${vendor.vendorName ?? ""} ${prettify(vendor.vendorType)}`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{vendor.vendorName}</span>
                        <span style={{ color: "#9ca3af", fontSize: 12, marginLeft: 8 }}>
                          {prettify(vendor.vendorType)}
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* SELECTED PRODUCT INFORMATION — shows as soon as a product is picked */}
              {selectedPurchase && (
                <div
                  style={{
                    display: "flex", gap: 10, flexWrap: "wrap", padding: 12, borderRadius: 12,
                    background: "linear-gradient(135deg,#eef2ff,#e0f2fe)", border: "1px solid #dbe4ff",
                  }}
                >
                  <div style={{ flex: "1 1 120px" }}>
                    <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Category</div>
                    <div style={{ fontWeight: 600, color: "#1e3a8a" }}>{selectedPurchase.category || "-"}</div>
                  </div>
                  <div style={{ flex: "1 1 120px" }}>
                    <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Product Code</div>
                    <div style={{ fontWeight: 600, color: "#1e3a8a" }}>{selectedPurchase.productCode || "-"}</div>
                  </div>
                </div>
              )}
            </Card>

            {/* ---------- 2. BILLING DETAILS ---------- */}
            <Card
              size="small"
              style={{ borderRadius: 16, border: "1px solid #e8ecf5", boxShadow: "0 4px 18px rgba(31,41,55,0.06)" }}
              styles={{ body: { padding: 18 } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 30, height: 30, borderRadius: 9, color: "#059669", background: "#ecfdf5", fontSize: 15,
                  }}
                >
                  <WalletOutlined />
                </span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Billing Details</span>
              </div>

              {/* Order Number — comes from the backend, disabled (dark text so it stays readable) */}
              <ConfigProvider theme={{ token: { colorTextDisabled: "#1f1f1f" } }}>
                <Form.Item
                  label={<span style={{ fontWeight: 600 }}>Order Number</span>}
                  name="orderNumber"
                >
                  <Input size="large" disabled placeholder="Order Number" />
                </Form.Item>
              </ConfigProvider>

              {/* Quantity + Price */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Quantity</span>}
                    name="quantity"
                    rules={[
                      { required: true, message: "Quantity is required" },
                      { type: "number", min: 1, message: "Quantity must be at least 1" },
                    ]}
                  >
                    <InputNumber size="large" style={{ width: "100%" }} min={1} placeholder="Enter quantity" onChange={updateTotal} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Price</span>}
                    name="price"
                    rules={[
                      { required: true, message: "Price is required" },
                      { type: "number", min: 0, message: "Price cannot be negative" },
                    ]}
                  >
                    <InputNumber size="large" style={{ width: "100%" }} min={0} precision={2} prefix="₹" placeholder="Enter price" onChange={updateTotal} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Purchase Date + Status */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Purchase Date</span>}
                    name="purchaseDate"
                    rules={[{ required: true, message: "Please select purchase date" }]}
                  >
                    <DatePicker
                      size="large"
                      style={{ width: "100%" }}
                      format="DD-MM-YYYY"
                      placeholder="Select date"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Status</span>}
                    name="status"
                    rules={[{ required: true, message: "Please select status" }]}
                  >
                    <Select size="large" placeholder="Select status">
                      <Option value="PAID">PAID</Option>
                      <Option value="PENDING">PENDING</Option>
                      <Option value="PARTIAL">PARTIAL</Option>
                      <Option value="OVERDUE">OVERDUE</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* Paid Amount */}
              <Form.Item
                label={<span style={{ fontWeight: 600 }}>Paid Amount</span>}
                name="paidAmount"
                dependencies={["total"]}
                rules={[
                  { type: "number", min: 0, message: "Paid amount cannot be negative" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value === undefined || value === null) return Promise.resolve();
                      if (Number(value) > Number(getFieldValue("total") || 0)) {
                        return Promise.reject(new Error("Paid amount cannot be more than Total"));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  min={0}
                  precision={2}
                  prefix="₹"
                  placeholder="Enter paid amount"
                  onChange={updatePending}
                />
              </Form.Item>

              {/* LIVE SUMMARY — Total / Paid / Pending (auto calculated) */}
              <div
                style={{
                  display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: 14, borderRadius: 14,
                  background: "linear-gradient(135deg,#312e81,#1d4ed8)", color: "#fff",
                  boxShadow: "0 8px 20px rgba(29,78,216,0.28)",
                }}
              >
                {[
                  { label: "Total", value: watchTotal, color: "#fff" },
                  { label: "Paid", value: watchPaid, color: "#86efac" },
                  { label: "Pending", value: watchPending, color: "#fcd34d" },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.6 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color, marginTop: 2 }}>
                      ₹ {Number(item.value || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, marginTop: 14, textAlign: "center" }}>
              Select a product to auto-fill its category and product code. Quantity and Price
              automatically calculate the Total.
            </div>
          </Form>
        </Spin>
      </Drawer>
    </Card>
  );
}
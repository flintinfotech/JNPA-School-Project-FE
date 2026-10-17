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
import { useAuth } from "../hooks/useAuth";
// School Expense APIs: list (getAllSchoolExpensesByFilter), edit (getSchoolExpensesById), save (updateSchoolExpenses)
import {
  getAllSchoolExpensesByFilter,
  getSchoolExpensesById,
  updateSchoolExpenses,
  type SchoolExpensesDTO,
  type UpdateSchoolExpensePayload,
} from "../services/SchoolExpensesService";

const { Option } = Select;

// ============================================================
// TYPES
// ============================================================
// One school expense row (getAllSchoolExpensesByFilter / getSchoolExpensesById)
// any extra field the backend sends (vendorMasterId, orderNumber, purchaseId ...) is kept too
type ExpenseRow = SchoolExpensesDTO & {
  orderNumber?: string | number;
  purchaseId?: number;
  vendorMasterId?: number;
  [key: string]: any;
};

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
  PAID: "green",
  PENDING: "orange",
  PARTIAL: "blue",
  OVERDUE: "red",
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
): { list: ExpenseRow[]; total: number } => {
  const body = raw ?? {};
  const data = body?.data ?? body;
  const list: ExpenseRow[] = Array.isArray(data?.SchoolExpensesDTOS)
    ? data.SchoolExpensesDTOS
    : Array.isArray(data?.Data)
      ? data.Data
      : Array.isArray(data)
        ? data
        : [];
  const total =
    data?.["Total Element"] ??
    data?.["Total elements"] ??
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

export default function SchoolExpenses() {
  // logged-in user's section + medium go in the payload of this screen's list API(s)
  // (admin has none -> payload stays as before -> sees everything)
  const { user } = useAuth();
  const mySection = user?.section || "";
  const myMedium = user?.medium || "";
  const scopePayload = useMemo(() => {
    const p: Record<string, string> = {};
    if (mySection) p.section = mySection;
    if (myMedium) p.medium = myMedium;
    return p;
  }, [mySection, myMedium]);

  const [form] = Form.useForm();

  // ---------- responsive (mobile) ----------
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false; // below 768px

  // table
  const [rows, setRows] = useState<ExpenseRow[]>([]);
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
  const [editingRecord, setEditingRecord] = useState<ExpenseRow | null>(null);
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
  // POST schoolExpenses/getAllSchoolExpensesByFilter  (runs on page load / reload / page change)
  const fetchExpenses = useCallback(
    async (pageNum: number, size: number) => {
      setTableLoading(true);
      try {
        const res = await getAllSchoolExpensesByFilter(pageNum, size, scopePayload);
        if (res?.success === false) {
          message.error(res?.message || "Failed to load school expenses");
          setRows([]);
          setTotal(0);
          return;
        }
        const { list, total: count } = extractListAndTotal(res);
        setRows(list);
        setTotal(count);
      } catch (error: any) {
        message.error(
          error?.response?.data?.message || "Failed to load school expenses",
        );
        setRows([]);
        setTotal(0);
      } finally {
        setTableLoading(false);
      }
    },
    [scopePayload],
  );

  useEffect(() => {
    fetchExpenses(page, pageSize);
  }, [fetchExpenses, page, pageSize]);

  // ---------- LOAD PURCHASE MASTER (for the Category / Product Name dropdowns) ----------
  const fetchPurchases = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const res = await api.post(apiEndpoints.getAllPurchaseByFilter(0, 100), scopePayload);
      setPurchases(res.data?.success === false ? [] : extractPurchaseList(res));
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Failed to load products",
      );
      setPurchases([]);
    } finally {
      setPurchaseLoading(false);
    }
  }, [scopePayload]);

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
  // Edit click -> GET schoolExpenses/getSchoolExpenses/{schoolExpenseId}
  // and the form is filled with that expense.
  const openEditDrawer = async (record: ExpenseRow) => {
    if (record.schoolExpenseId === undefined) return;
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res: any = await getSchoolExpensesById(record.schoolExpenseId);
      if (res?.success === false) {
        message.error(res?.message || "Failed to load school expense");
        setDrawerOpen(false);
        return;
      }
      const d: ExpenseRow = (res?.data ?? record) as ExpenseRow;
      setEditingRecord(d);

      // find the same product in Purchase Master (by product code / id, else by category + name)
      let purchase: PurchaseRow | null =
        purchases.find((p) => d.productCode && p.productCode === d.productCode) ||
        purchases.find((p) => d.purchaseId && Number(p.purchaseId) === Number(d.purchaseId)) ||
        purchases.find((p) => p.productName === d.productName && p.category === d.category) ||
        null;

      // not in Purchase Master -> still show what the expense itself has
      if (!purchase && (d.productName || d.productCode)) {
        purchase = {
          purchaseId: Number(d.purchaseId) || 0,
          category: d.category,
          productCode: d.productCode,
          productName: d.productName,
        };
      }
      setSelectedPurchase(purchase);

      const quantity = Number(d.quantity) || undefined;
      const price = Number(d.price) || 0;
      const totalValue = Number(d.total ?? (Number(d.quantity) || 0) * price) || 0;
      const paid = Number(d.paidAmount) || 0;

      form.resetFields();
      form.setFieldsValue({
        categoryFilter: purchase?.category ?? d.category,
        productKey: purchase ? productKey(purchase) : undefined,
        // vendor is filled only if the backend sends it, otherwise it can be selected again
        vendorMasterId:
          d.vendorMasterId ??
          d.vendorMasterDTO?.vendorMasterId ??
          d.vendorMaster?.vendorMasterId ??
          undefined,
        orderNumber: d.orderNumber ?? record.orderNumber,
        quantity,
        price,
        total: totalValue,
        paidAmount: paid,
        pendingAmount: Number(d.pendingAmount ?? Math.max(totalValue - paid, 0)) || 0,
        status: d.status,
        purchaseDate: d.purchaseDate ? dayjs(d.purchaseDate) : dayjs(),
      });
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load school expense");
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
  // PUT schoolExpenses/updateSchoolExpenses  (body = the expense + schoolExpenseId)
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();

      if (!editingRecord?.schoolExpenseId) {
        message.error("School expense id is missing. Please close and open Edit again.");
        return;
      }

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

      // the backend needs the purchaseId of the product
      const purchaseId = Number(product.purchaseId || editingRecord.purchaseId);
      if (!purchaseId) {
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

        const payload: UpdateSchoolExpensePayload & Record<string, any> = {
          schoolExpenseId: Number(editingRecord.schoolExpenseId),
          price,
          quantity,
          total: totalValue,
          paidAmount,
          pendingAmount,
          // keep the year the expense was saved with
          academicYear:
            editingRecord.academicYear ||
            getLoginAcademicYear() ||
            getAcademicYear(dayjs(values.purchaseDate)),
          purchaseDate,
          status: values.status,
          productCode: product.productCode,
          category: product.category ?? "",
          productName: product.productName ?? "",
          orderNumber: values.orderNumber ?? editingRecord.orderNumber,
          purchaseId,
          vendorMasterId: Number(values.vendorMasterId),
        };
        console.log("UPDATE SCHOOL EXPENSE PAYLOAD:", payload);

        const res = await updateSchoolExpenses(payload);

        // backend can send "success": false with HTTP 200 -> check before showing success
        if (res?.success === false) {
          message.error(res?.message || "Failed to update school expense");
          return;
        }
        message.success(res?.message || "School expense updated successfully");
        closeDrawer();
        fetchExpenses(page, pageSize);
      } catch (error: any) {
        console.error("Update error:", error);
        message.error(error?.response?.data?.message || "Failed to update school expense");
      } finally {
        setSubmitting(false);
      }
    } catch {
      // Ant Design validation errors are automatically displayed.
    }
  };

  // ---------- TABLE COLUMNS ----------
  const statusTag = (v?: string) =>
    v ? (
      <Tag color={STATUS_COLOR[v.toUpperCase()] || "default"} style={{ marginRight: 0 }}>
        {capitalize(v)}
      </Tag>
    ) : (
      "-"
    );

  const columns = [
    {
      title: "Sr No",
      key: "srNo",
      width: 60,
      render: (_: any, __: ExpenseRow, index: number) =>
        page * pageSize + index + 1,
    },
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (v: string | number) => v ?? "-",
    },
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
      render: (v: string) => v || "-",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (v: string) => v || "-",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (v: number) => money(v),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (v: number) => v ?? "-",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (v: number) => money(v),
    },
    {
      title: "Paid Amount",
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: (v: number) => money(v),
    },
    {
      title: "Pending Amount",
      dataIndex: "pendingAmount",
      key: "pendingAmount",
      render: (v: number) => money(v),
    },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      render: (v: string) => (v ? dayjs(v).format("DD-MM-YYYY") : "-"),
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
      render: (v: string) => statusTag(v),
    },
    {
      // only one icon (Edit), placed in the middle of the column
      title: "Action",
      key: "action",
      width: 90,
      align: "center" as const,
      render: (_: any, record: ExpenseRow) => (
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

  // ---------- MOBILE: one row inside an expense card ----------
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

  // ---------- MOBILE: all expenses as cards ----------
  const renderExpenseCards = () => (
    <Spin spinning={tableLoading}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <Card
            key={String(r.schoolExpenseId ?? `${page * pageSize + i}`)}
            size="small"
            title={
              <span
                style={{
                  fontWeight: 600,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {r.productName || "-"}
              </span>
            }
            extra={r.status ? statusTag(r.status) : null}
          >
            {cardRow("Order Number", r.orderNumber != null ? String(r.orderNumber) : "-")}
            {cardRow("Category", r.category)}
            {cardRow("Price", money(r.price))}
            {cardRow("Quantity", r.quantity != null ? String(r.quantity) : "-")}
            {cardRow("Total", money(r.total))}
            {cardRow("Paid Amount", money(r.paidAmount))}
            {cardRow("Pending Amount", money(r.pendingAmount))}
            {cardRow(
              "Purchase Date",
              r.purchaseDate ? dayjs(r.purchaseDate).format("DD-MM-YYYY") : "-",
            )}
            {cardRow("Academic Year", r.academicYear)}

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
        <Empty description="No school expenses found" style={{ padding: "40px 0" }} />
      ) : isMobile ? (
        // MOBILE: expenses in card view
        renderExpenseCards()
      ) : (
        // DESKTOP: table
        <div style={{ width: "100%", overflowX: "auto" }}>
          <CommonTable<ExpenseRow>
            data={rows}
            columns={columns}
            loading={tableLoading}
            rowKey={(r: ExpenseRow) =>
              String(r.schoolExpenseId ?? JSON.stringify(r))
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

      {/* ---------- School Expense drawer (opens on Edit) ---------- */}
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
                Edit School Expense
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "#6b7280" }}>
                Update the details of this expense
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
              Update Expense
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

              {/* Order Number — comes from the backend, disabled (dark text so it stays readable) */}
              <ConfigProvider theme={{ token: { colorTextDisabled: "#1f1f1f" } }}>
                <Form.Item
                  label={<span style={{ fontWeight: 600 }}>Order Number</span>}
                  name="orderNumber"
                >
                  <Input size="large" disabled placeholder="Order Number" />
                </Form.Item>
              </ConfigProvider>

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
                      label={`${purchase.productName ?? ""}`}
                    >
                      <span>{purchase.productName}</span>
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

              {/* Quantity + Price */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Quantity</span>}
                    name="quantity"
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
              Select a product to auto-fill its category. Quantity and Price
              automatically calculate the Total.
            </div>
          </Form>
        </Spin>
      </Drawer>
    </Card>
  );
}
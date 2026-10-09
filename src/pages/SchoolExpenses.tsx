import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button, Card, Col, DatePicker, Divider, Drawer, Empty, Form, Input, InputNumber,
  Popconfirm, Row, Select, Spin, Tag, message,
} from "antd";
import {
  DeleteOutlined, EditOutlined, PlusOutlined, ProfileOutlined, ReloadOutlined, SearchOutlined,
  ShoppingOutlined, WalletOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import CommonTable from "../components/commonTable";
import api from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

const { Option } = Select;

// ============================================================
// TYPES
// ============================================================
// Purchase Master row — only used to PICK a product in the drawer
// (its category / productCode / productName are copied into the expense payload).
interface PurchaseRow {
  purchaseId: number;
  category?: string;
  productCode?: string;
  productName?: string;
  [key: string]: any;
}

// School expense — the backend now sends the product details FLAT on every row
// (no purchaseId / purchaseDTO any more).
interface SchoolExpenseRow {
  schoolExpenseId: number;
  academicYear?: string;
  category?: string;
  productCode?: string;
  productName?: string;
  quantity: number;
  price: number;
  total: number | null;
  paidAmount?: number | null;
  pendingAmount?: number | null;
  purchaseDate?: string | null;
  status: string;
  [key: string]: any;
}

// Search filters — Category / Product Name. They are sent to the list API on Search
// and also re-checked in the browser as a safety net.
interface ExpenseFilters {
  category?: string;
  productName?: string;
}

// Academic year starts in April: Oct 2026 -> "2026-2027", Feb 2027 -> "2026-2027"
const getAcademicYear = (d: Dayjs = dayjs()) => {
  const y = d.year();
  return d.month() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

// The Product Name dropdown value (productCode, or purchaseId when there is no code)
const productKey = (p?: { productCode?: string; purchaseId?: number } | null) =>
  p ? String(p.productCode ?? p.purchaseId ?? "") : "";

// ============================================================
// RESPONSE EXTRACTORS
// ============================================================
const extractExpenseListAndTotal = (raw: any): { list: SchoolExpenseRow[]; total: number } => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;
  const listKeys = ["SchoolExpensesDTOS", "schoolExpensesDTOS", "Data", "data"];

  for (const key of listKeys) {
    if (Array.isArray(data?.[key])) {
      return {
        list: data[key],
        total: Number(
          data?.["Total Element"] ?? data?.["Total Elements"] ?? data?.["Total"] ?? data?.["total"] ?? data[key].length
        ) || 0,
      };
    }
  }
  if (Array.isArray(data)) return { list: data, total: data.length };
  return { list: [], total: 0 };
};

const extractPurchaseList = (raw: any): PurchaseRow[] => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;
  if (Array.isArray(data?.PurchaseDTOS)) return data.PurchaseDTOS;
  if (Array.isArray(data?.purchaseDTOS)) return data.purchaseDTOS;
  if (Array.isArray(data?.Data)) return data.Data;
  if (Array.isArray(data)) return data;
  return [];
};

// ============================================================
// COMPONENT
// ============================================================
export default function SchoolExpenses() {
  // Fetch every expense in one request (size comfortably larger than any real dataset) and
  // paginate on the frontend, so Next / Prev need no new backend call.
  const EXPENSES_FETCH_SIZE = 2000;

  // TABLE STATE
  const [allExpenses, setAllExpenses] = useState<SchoolExpenseRow[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // SEARCH FILTER STATE — typed values (not applied until Search / Enter) + applied values
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<ExpenseFilters>({});

  // PURCHASE MASTER STATE
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // DRAWER STATE
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRow | null>(null);
  const [form] = Form.useForm();

  // RESPONSIVE DRAWER WIDTH
  const [drawerWidth, setDrawerWidth] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 480
  );

  useEffect(() => {
    const handleResize = () => setDrawerWidth(window.innerWidth < 768 ? "100%" : 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ============================================================
  // GET ALL SCHOOL EXPENSES
  // POST schoolExpenses/getAllSchoolExpensesByFilter?page=0&size=...&desc&paginate=true
  // Body: { "productName": "...", "category": "..." } — only the selected filters are sent
  // ============================================================
  const fetchSchoolExpenses = useCallback(async (f: ExpenseFilters) => {
    setTableLoading(true);
    try {
      const body: Record<string, string> = {};
      if (f.productName?.trim()) body.productName = f.productName.trim();
      if (f.category) body.category = f.category;

      const res = await api.post(apiEndpoints.getAllSchoolExpensesByFilter(0, EXPENSES_FETCH_SIZE), body);
      if (res?.data?.success === false) {
        message.error(res?.data?.message || "Failed to load school expenses");
        setAllExpenses([]);
        return;
      }
      const { list } = extractExpenseListAndTotal(res);
      setAllExpenses(list);
    } catch (error: any) {
      console.error("School expenses error:", error);
      message.error(error?.response?.data?.message || "Failed to load school expenses");
    } finally {
      setTableLoading(false);
    }
  }, []);

  // ============================================================
  // GET ALL PURCHASES (only to pick a product in the drawer)
  // Existing Purchase API: /purchase/getAllPurchaseByFilter
  // ============================================================
  const fetchPurchases = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const res = await api.post(apiEndpoints.getAllPurchaseByFilter(0, 100), {});
      if (res?.data?.success === false) {
        message.error(res?.data?.message || "Failed to load products");
        setPurchases([]);
        return;
      }
      setPurchases(extractPurchaseList(res));
    } catch (error: any) {
      console.error("Purchase list error:", error);
      message.error(error?.response?.data?.message || "Failed to load products");
    } finally {
      setPurchaseLoading(false);
    }
  }, []);

  // INITIAL LOAD — nothing searched yet -> body {}
  useEffect(() => { fetchSchoolExpenses({}); }, [fetchSchoolExpenses]);
  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  // Unique category list (for both the search filter dropdown and the drawer's Category dropdown)
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [purchases]);

  // ============================================================
  // SEARCH FILTER HANDLERS
  // ============================================================
  const handleFilterChange = (field: keyof ExpenseFilters, value?: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Search -> calls the list API with the selected Category / Product Name
  const handleSearch = () => {
    setPage(0);
    setAppliedFilters(filters);
    fetchSchoolExpenses(filters);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleReset = () => {
    setFilters({});
    setAppliedFilters({});
    setPage(0);
    fetchSchoolExpenses({});
  };

  // Safety net, in case the backend ignores a filter: the same filters are re-checked here.
  // Category matches exactly; Product Name matches as a case-insensitive substring.
  const filteredExpenses = useMemo(() => {
    const category = appliedFilters.category;
    const productName = appliedFilters.productName?.trim().toLowerCase();

    if (!category && !productName) return allExpenses;

    return allExpenses.filter((record) => {
      const matchesCategory = category ? record.category === category : true;
      const matchesProductName = productName
        ? (record.productName || "").toLowerCase().includes(productName)
        : true;
      return matchesCategory && matchesProductName;
    });
  }, [allExpenses, appliedFilters]);

  const total = filteredExpenses.length;

  const displayedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, page, pageSize]);

  // ============================================================
  // ADD EXPENSE
  // ============================================================
  const openAddDrawer = () => {
    setIsEditing(false);
    setEditingExpenseId(null);
    setSelectedPurchase(null);
    form.resetFields();
    form.setFieldsValue({
      quantity: 1, price: 0, total: 0, paidAmount: 0, pendingAmount: 0, status: "PAID",
      categoryFilter: undefined,
      productKey: undefined,
      purchaseDate: dayjs(), // defaults to today, can be changed
    });
    setDrawerOpen(true);
  };

  // ============================================================
  // EDIT EXPENSE
  // GET schoolExpenses/getSchoolExpenses/{schoolExpenseId}
  // ============================================================
  const openEditDrawer = async (record: SchoolExpenseRow) => {
    setIsEditing(true);
    setEditingExpenseId(record.schoolExpenseId);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      // Load the latest data of this expense from the server (falls back to the table row)
      let data: SchoolExpenseRow = record;
      try {
        const res = await api.get(apiEndpoints.getSchoolExpensesById(record.schoolExpenseId));
        if (res?.data?.success !== false && res?.data?.data) data = res.data.data;
      } catch (e) {
        console.error("Get expense by id failed, using the table row:", e);
      }

      // Find the same product in Purchase Master (by product code, else by category + name)
      let purchase =
        purchases.find((p) => data.productCode && p.productCode === data.productCode) ||
        purchases.find((p) => p.productName === data.productName && p.category === data.category) ||
        null;

      // Not in Purchase Master any more -> still show what the expense itself has
      if (!purchase) {
        purchase = {
          purchaseId: 0,
          category: data.category,
          productCode: data.productCode,
          productName: data.productName,
        };
      }
      setSelectedPurchase(purchase);

      const totalValue =
        data.total !== null && data.total !== undefined
          ? data.total
          : Number(data.quantity || 0) * Number(data.price || 0);

      form.setFieldsValue({
        categoryFilter: purchase.category ?? data.category,
        productKey: productKey(purchase),
        purchaseDate: data.purchaseDate ? dayjs(data.purchaseDate) : undefined,
        quantity: data.quantity,
        price: data.price,
        total: totalValue,
        paidAmount: data.paidAmount ?? 0,
        pendingAmount:
          data.pendingAmount ?? Math.max(Number(totalValue || 0) - Number(data.paidAmount || 0), 0),
        status: data.status,
      });
    } catch (error: any) {
      console.error("Edit expense error:", error);
      message.error(error?.response?.data?.message || "Failed to load expense");
    } finally {
      setDrawerLoading(false);
    }
  };

  // ============================================================
  // CLOSE DRAWER
  // ============================================================
  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setIsEditing(false);
    setEditingExpenseId(null);
    setSelectedPurchase(null);
  };

  // ============================================================
  // DRAWER — CATEGORY CHANGE
  // Selecting a category narrows the Product Name dropdown to that category only.
  // The previously selected product is cleared since it may no longer belong to it.
  // ============================================================
  const handleCategoryFilterChange = (category?: string) => {
    form.setFieldsValue({ categoryFilter: category, productKey: undefined });
    setSelectedPurchase(null);
  };

  // Live-watched category value from the drawer form
  const drawerCategoryFilter = Form.useWatch("categoryFilter", form);

  // live values for the summary strip in the drawer
  const watchTotal = Form.useWatch("total", form);
  const watchPaid = Form.useWatch("paidAmount", form);
  const watchPending = Form.useWatch("pendingAmount", form);

  const filteredPurchaseOptions = useMemo(() => {
    const list = !drawerCategoryFilter
      ? purchases
      : purchases.filter((p) => p.category === drawerCategoryFilter);

    // an expense whose product is no longer in Purchase Master still needs its option in the list
    if (selectedPurchase && !list.some((p) => productKey(p) === productKey(selectedPurchase))) {
      return [selectedPurchase, ...list];
    }
    return list;
  }, [purchases, drawerCategoryFilter, selectedPurchase]);

  // ============================================================
  // PRODUCT CHANGE
  // ============================================================
  const handlePurchaseChange = (key?: string) => {
    const purchase = purchases.find((item) => productKey(item) === key) || null;
    setSelectedPurchase(purchase);
    form.setFieldsValue({ productKey: key });
  };

  // ============================================================
  // UPDATE TOTAL
  // ============================================================
  const updateTotal = () => {
    const quantity = Number(form.getFieldValue("quantity") || 0);
    const price = Number(form.getFieldValue("price") || 0);
    const total = quantity * price;
    const paid = Number(form.getFieldValue("paidAmount") || 0);
    form.setFieldsValue({ total, pendingAmount: Math.max(total - paid, 0) });
  };

  // Pending Amount = Total - Paid Amount (auto, read-only in the form)
  const updatePending = () => {
    const total = Number(form.getFieldValue("total") || 0);
    const paid = Number(form.getFieldValue("paidAmount") || 0);
    form.setFieldsValue({ pendingAmount: Math.max(total - paid, 0) });
  };

  // ============================================================
  // SAVE / UPDATE
  // POST schoolExpenses/saveSchoolExpenses   |   PUT schoolExpenses/updateSchoolExpenses
  // ============================================================
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();

      // product details come from the selected product (copied into the payload)
      const product =
        purchases.find((p) => productKey(p) === values.productKey) ||
        (selectedPurchase && productKey(selectedPurchase) === values.productKey ? selectedPurchase : null);
      if (!product) {
        message.error("Please select product");
        return;
      }

      setSubmitting(true);
      try {
        const quantity = Number(values.quantity || 0);
        const price = Number(values.price || 0);
        const total = quantity * price;
        const paidAmount = Number(values.paidAmount || 0);
        const pendingAmount = Math.max(total - paidAmount, 0);
        const purchaseDateValue = dayjs(values.purchaseDate);
        const purchaseDate = purchaseDateValue.format("YYYY-MM-DD"); // sent as YYYY-MM-DD
        const academicYear = getAcademicYear(purchaseDateValue);

        const common = {
          price,
          quantity,
          total,
          paidAmount,
          pendingAmount,
          academicYear,
          purchaseDate,
          status: values.status,
          productCode: product.productCode,
          category: product.category,
          productName: product.productName,
        };

        // UPDATE
        if (isEditing && editingExpenseId !== null) {
          const payload = { schoolExpenseId: editingExpenseId, ...common };
          console.log("UPDATE SCHOOL EXPENSE PAYLOAD:", payload);

          const res = await api.put(apiEndpoints.updateSchoolExpenses(), payload);
          // Backend may return HTTP 200 but success:false.
          if (res?.data?.success === false) {
            message.error(res?.data?.message || "Failed to update school expense");
            return;
          }
          message.success(res?.data?.message || "School expense updated successfully");
          closeDrawer();
          fetchSchoolExpenses(appliedFilters);
          return;
        }

        // SAVE
        console.log("SAVE SCHOOL EXPENSE PAYLOAD:", common);

        const res = await api.post(apiEndpoints.saveSchoolExpenses(), common);
        // Backend may return HTTP 200 but success:false.
        if (res?.data?.success === false) {
          message.error(res?.data?.message || "Failed to save school expense");
          return;
        }
        message.success(res?.data?.message || "School expense saved successfully");
        closeDrawer();
        fetchSchoolExpenses(appliedFilters);
      } catch (error: any) {
        console.error("Save/Update error:", error);
        message.error(error?.response?.data?.message || "Failed to save school expense");
      } finally {
        setSubmitting(false);
      }
    } catch {
      // Ant Design validation errors are automatically displayed.
    }
  };

  // ============================================================
  // DELETE
  // DELETE schoolExpenses/deleteSchoolExpenses/{schoolExpenseId}
  // ============================================================
  const handleDelete = async (schoolExpenseId: number) => {
    try {
      const res = await api.delete(apiEndpoints.deleteSchoolExpenses(schoolExpenseId));
      if (res?.data?.success === false) {
        message.error(res?.data?.message || "Failed to delete school expense");
        return;
      }
      message.success(res?.data?.message || "School expense deleted successfully");

      // If deleting the last item from a page, go to previous page.
      if (displayedRows.length === 1 && page > 0) setPage(page - 1);
      fetchSchoolExpenses(appliedFilters);
    } catch (error: any) {
      console.error("Delete expense error:", error);
      message.error(error?.response?.data?.message || "Failed to delete school expense");
    }
  };

  // ============================================================
  // PAGINATION — purely a frontend slice (see EXPENSES_FETCH_SIZE note above)
  // ============================================================
  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage - 1);
    setPageSize(newPageSize);
  };

  // ============================================================
  // TABLE COLUMNS
  // ============================================================
  const columns = [
    {
      title: "Sr No", key: "srNo", width: 80,
      render: (_: any, __: SchoolExpenseRow, index: number) => page * pageSize + index + 1,
    },
    {
      title: "Category", key: "category",
      render: (_: any, record: SchoolExpenseRow) => record.category || "-",
    },
    {
      title: "Product Name", key: "productName",
      render: (_: any, record: SchoolExpenseRow) => record.productName || "-",
    },
    {
      title: "Purchase Date", dataIndex: "purchaseDate", key: "purchaseDate",
      render: (value: string) => (value ? dayjs(value).format("DD-MM-YYYY") : "-"),
    },
    {
      title: "Quantity", dataIndex: "quantity", key: "quantity",
      render: (value: number) => value ?? 0,
    },
    {
      title: "Price", dataIndex: "price", key: "price",
      render: (value: number) => `₹ ${Number(value || 0).toFixed(2)}`,
    },
    {
      title: "Total", key: "total",
      render: (_: any, record: SchoolExpenseRow) => {
        const total = record.total !== null && record.total !== undefined
          ? record.total
          : Number(record.quantity || 0) * Number(record.price || 0);
        return `₹ ${Number(total || 0).toFixed(2)}`;
      },
    },
    {
      title: "Paid Amount", key: "paidAmount",
      render: (_: any, record: SchoolExpenseRow) => `₹ ${Number(record.paidAmount || 0).toFixed(2)}`,
    },
    {
      title: "Pending Amount", key: "pendingAmount",
      render: (_: any, record: SchoolExpenseRow) => {
        const total = record.total ?? Number(record.quantity || 0) * Number(record.price || 0);
        const pending = record.pendingAmount ?? Math.max(Number(total || 0) - Number(record.paidAmount || 0), 0);
        return `₹ ${Number(pending || 0).toFixed(2)}`;
      },
    },
    {
      title: "Status", dataIndex: "status", key: "status",
      render: (status: string) => (
        <Tag color={status === "PAID" ? "green" : status === "PENDING" ? "orange" : "blue"}>
          {status || "-"}
        </Tag>
      ),
    },
    {
      title: "Action", key: "action", align: "center" as const,
      render: (_: any, record: SchoolExpenseRow) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => openEditDrawer(record)} />
          <Popconfirm
            title="Delete this expense?"
            description="Are you sure you want to delete this school expense?"
            onConfirm={() => handleDelete(record.schoolExpenseId)}
            okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // ============================================================
  // RETURN
  // ============================================================
  return (
    <div className="p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold m-0">{/* School Expenses */}</h2>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Add Expense
        </Button>
      </div>

      {/* SEARCH FILTER BAR — Category / Product Name + Search / Reset */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Category"
            value={filters.category}
            onChange={(v) => handleFilterChange("category", v)}
            allowClear
            style={{ width: "100%" }}
          >
            {categoryOptions.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Product Name"
            value={filters.productName}
            onChange={(e) => handleFilterChange("productName", e.target.value)}
            onKeyDown={handleSearchKeyDown}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={24} md={12}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              Search
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Col>
      </Row>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        {!tableLoading && displayedRows.length === 0 ? (
          <Card><Empty description="No school expenses found" /></Card>
        ) : (
          <CommonTable
            data={displayedRows}
            columns={columns}
            loading={tableLoading}
            pagination={{
              current: page + 1, pageSize, total,
              onChange: (newPage: number, newPageSize: number) => handlePaginationChange(newPage, newPageSize),
            }}
          />
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="block md:hidden">
        {tableLoading ? (
          <Card><div className="flex justify-center py-8"><Spin /></div></Card>
        ) : displayedRows.length === 0 ? (
          <Card><Empty description="No school expenses found" /></Card>
        ) : (
          <div className="space-y-4">
            {displayedRows.map((record, index) => {
              const calculatedTotal = record.total !== null && record.total !== undefined
                ? record.total
                : Number(record.quantity || 0) * Number(record.price || 0);

              return (
                <Card key={record.schoolExpenseId} className="shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xs text-gray-400">Expense #{page * pageSize + index + 1}</div>
                      <div className="font-semibold text-base mt-1">{record.productName}</div>
                    </div>
                    <Tag color={record.status === "PAID" ? "green" : record.status === "PENDING" ? "orange" : "blue"}>
                      {record.status}
                    </Tag>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-gray-500">Category</div>
                    <div className="font-medium">{record.category || "-"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">Product Code</div>
                      <div className="font-medium">{record.productCode || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Purchase Date</div>
                      <div className="font-medium">
                        {record.purchaseDate ? dayjs(record.purchaseDate).format("DD-MM-YYYY") : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Quantity</div>
                      <div className="font-medium">{record.quantity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Price</div>
                      <div className="font-medium">₹ {Number(record.price || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="border-t mt-4 pt-3 flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg">₹ {Number(calculatedTotal || 0).toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="text-xs text-gray-500">Paid Amount</div>
                      <div className="font-medium">₹ {Number(record.paidAmount || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Pending Amount</div>
                      <div className="font-medium">
                        ₹ {Number(
                          record.pendingAmount ??
                            Math.max(Number(calculatedTotal || 0) - Number(record.paidAmount || 0), 0)
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => openEditDrawer(record)}>
                      Edit
                    </Button>
                    <Popconfirm
                      title="Delete this expense?"
                      description="Are you sure you want to delete this school expense?"
                      onConfirm={() => handleDelete(record.schoolExpenseId)}
                      okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
                    >
                      <Button danger icon={<DeleteOutlined />} size="small">Delete</Button>
                    </Popconfirm>
                  </div>
                </Card>
              );
            })}

            {/* Mobile Pagination */}
            <div className="flex justify-center">
              <div className="w-full">
                <CommonTable
                  data={[]}
                  columns={[]}
                  pagination={{
                    current: page + 1, pageSize, total,
                    onChange: (newPage: number, newPageSize: number) => handlePaginationChange(newPage, newPageSize),
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT DRAWER — premium look */}
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
                {isEditing ? "Update School Expense" : "Add School Expense"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "#6b7280" }}>
                {isEditing ? "Edit the details and save your changes" : "Fill in the details to record a new expense"}
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
              onClick={handleFinish}
              style={{
                borderRadius: 10, minWidth: 130, fontWeight: 600, border: "none",
                background: "linear-gradient(135deg,#6366f1,#2563eb)",
                boxShadow: "0 6px 16px rgba(37,99,235,0.35)",
              }}
            >
              {isEditing ? "Update Expense" : "Save Expense"}
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
                style={{ marginBottom: selectedPurchase ? 12 : 0 }}
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
                    <InputNumber size="large" className="w-full" min={1} placeholder="Enter quantity" onChange={updateTotal} />
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
                    <InputNumber size="large" className="w-full" min={0} precision={2} prefix="₹" placeholder="Enter price" onChange={updateTotal} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Purchase Date (right after Quantity / Price) + Status */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Purchase Date</span>}
                    name="purchaseDate"
                    rules={[{ required: true, message: "Please select purchase date" }]}
                  >
                    <DatePicker
                      size="large"
                      className="w-full"
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
                  className="w-full"
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
    </div>
  );
}
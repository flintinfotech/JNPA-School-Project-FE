import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button, Card, Col, Divider, Drawer, Empty, Form, Input, InputNumber,
  Popconfirm, Row, Select, Spin, Tag, message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, ShoppingOutlined } from "@ant-design/icons";

import CommonTable from "../components/commonTable";
import api from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

const { Option } = Select;

// ============================================================
// TYPES
// ============================================================
interface PurchaseRow {
  purchaseId: number;
  category?: string;
  productCode?: string;
  productName?: string;
  [key: string]: any;
}

interface SchoolExpenseRow {
  schoolExpenseId: number;
  purchaseId: number;
  purchaseDTO?: {
    purchaseId: number;
    category?: string;
    productCode?: string;
    productName?: string;
  };
  quantity: number;
  price: number;
  total: number | null;
  status: string;
  [key: string]: any;
}

// 🆕 Search filters — Category / Product Name. Filtered client-side over
// the FULL fetched list (see EXPENSES_FETCH_SIZE note below), so typing a
// letter / picking a category narrows the visible rows across every page,
// not just whatever page happened to be loaded from the backend.
interface ExpenseFilters {
  category?: string;
  productName?: string;
}

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
  // 🛠️ FIX — Category / Product Name search wasn't finding rows sitting
  // on page 2, 3, 4... etc.
  //
  // Root cause: `rows` only ever held whatever ONE page the backend
  // returned for the requested (page, pageSize), and `displayedRows`
  // filtered that same single page. So if the matching expense wasn't on
  // the page you currently had open, the filter had nothing to find it
  // in — it silently looked empty even though the row existed elsewhere.
  //
  // Fix (same over-fetch pattern already used for Purchase Master below,
  // and for Results.tsx / Achievements.tsx elsewhere in the app): fetch
  // every expense in one request using a size comfortably larger than any
  // real dataset, keep that full list in `allExpenses`, and do BOTH the
  // Category/Product Name filtering AND the pagination entirely on the
  // frontend from that full list. Pagination is now just a client-side
  // slice, so Search now matches against every page, and Next/Prev no
  // longer need a new backend call at all.
  const EXPENSES_FETCH_SIZE = 2000;

  // TABLE STATE
  const [allExpenses, setAllExpenses] = useState<SchoolExpenseRow[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // 🆕 SEARCH FILTER STATE — Category / Product Name
  const [filters, setFilters] = useState<ExpenseFilters>({});

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
  // GET ALL SCHOOL EXPENSES — fetches the FULL list in one call (see
  // EXPENSES_FETCH_SIZE note above). Filtering and pagination both happen
  // on the frontend from this full list, so Search now works no matter
  // which page a matching row lives on.
  // ============================================================
  const fetchSchoolExpenses = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await api.post(apiEndpoints.getAllSchoolExpensesByFilter(0, EXPENSES_FETCH_SIZE), {});
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
  // GET ALL PURCHASES
  // Existing Purchase API: /purchase/getAllPurchaseByFilter
  // We are NOT creating another API.
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

  // INITIAL LOAD — full expense list is fetched once (and re-fetched after
  // add/edit/delete); page/pageSize changes below no longer need a new
  // backend call since pagination is a frontend slice now.
  useEffect(() => { fetchSchoolExpenses(); }, [fetchSchoolExpenses]);
  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  // 🆕 Unique category list (for both the search filter dropdown and the
  // drawer's Category dropdown), derived from whatever Purchase Master
  // already returned — no new API needed.
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [purchases]);

  // ============================================================
  // 🆕 SEARCH FILTER HANDLERS
  // Category is an exact-match dropdown; Product Name stays a live
  // substring search — both filter the FULL fetched list (allExpenses),
  // not just whatever page was last shown.
  // ============================================================
  const handleFilterChange = (field: keyof ExpenseFilters, value?: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Filtering is already live via filteredExpenses; Enter is a no-op
      // beyond that, kept for familiar search-box behavior.
    }
  };

  const handleReset = () => {
    setFilters({});
  };

  // 🆕 Whenever the search filters change, jump back to page 1 — otherwise
  // a narrower result set could leave the user stranded on a page number
  // that no longer has any rows on it.
  useEffect(() => {
    setPage(0);
  }, [filters.category, filters.productName]);

  // 🆕 Filtered over the FULL fetched list (allExpenses), so a match is
  // found regardless of which page it originally belonged to. Category
  // matches exactly (dropdown value); Product Name matches as a
  // case-insensitive substring.
  const filteredExpenses = useMemo(() => {
    const category = filters.category;
    const productName = filters.productName?.trim().toLowerCase();

    if (!category && !productName) return allExpenses;

    return allExpenses.filter((record) => {
      const matchesCategory = category
        ? record.purchaseDTO?.category === category
        : true;
      const matchesProductName = productName
        ? (record.purchaseDTO?.productName || "").toLowerCase().includes(productName)
        : true;
      return matchesCategory && matchesProductName;
    });
  }, [allExpenses, filters.category, filters.productName]);

  // True total is simply how many rows matched, across every page.
  const total = filteredExpenses.length;

  // Current page's slice, computed entirely on the frontend from the
  // filtered full list.
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
    form.setFieldsValue({ quantity: 1, price: 0, total: 0, status: "PAID", categoryFilter: undefined });
    setDrawerOpen(true);
  };

  // ============================================================
  // EDIT EXPENSE
  // ============================================================
  const openEditDrawer = async (record: SchoolExpenseRow) => {
    setIsEditing(true);
    setEditingExpenseId(record.schoolExpenseId);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      // We already have purchaseDTO in list response. Find same purchase from Purchase Master.
      let purchase = purchases.find((item) => Number(item.purchaseId) === Number(record.purchaseId)) || null;

      // If Purchase Master has not loaded yet, use purchaseDTO returned by expense API.
      if (!purchase && record.purchaseDTO) {
        purchase = {
          purchaseId: record.purchaseDTO.purchaseId || record.purchaseId,
          category: record.purchaseDTO.category,
          productCode: record.purchaseDTO.productCode,
          productName: record.purchaseDTO.productName,
        };
      }
      setSelectedPurchase(purchase);

      // purchaseId is stored in form. Product name is only displayed in Select.
      form.setFieldsValue({
        categoryFilter: purchase?.category,
        purchaseId: record.purchaseId,
        quantity: record.quantity,
        price: record.price,
        total: record.total !== null && record.total !== undefined
          ? record.total
          : Number(record.quantity || 0) * Number(record.price || 0),
        status: record.status,
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
  // 🆕 DRAWER — CATEGORY CHANGE
  // Selecting a category narrows the Product Name dropdown to that
  // category only. The previously selected product (if any) is cleared
  // since it may no longer belong to the newly picked category.
  // ============================================================
  const handleCategoryFilterChange = (category?: string) => {
    form.setFieldsValue({ categoryFilter: category, purchaseId: undefined });
    setSelectedPurchase(null);
  };

  // 🆕 Live-watched category value from the drawer form, used to filter
  // the Product Name Select's options below.
  const drawerCategoryFilter = Form.useWatch("categoryFilter", form);

  const filteredPurchaseOptions = useMemo(() => {
    if (!drawerCategoryFilter) return purchases;
    return purchases.filter((p) => p.category === drawerCategoryFilter);
  }, [purchases, drawerCategoryFilter]);

  // ============================================================
  // PRODUCT CHANGE
  // ============================================================
  const handlePurchaseChange = (purchaseId: number) => {
    const purchase = purchases.find((item) => Number(item.purchaseId) === Number(purchaseId)) || null;
    setSelectedPurchase(purchase);
    form.setFieldsValue({ purchaseId });
  };

  // ============================================================
  // UPDATE TOTAL
  // ============================================================
  const updateTotal = () => {
    const quantity = Number(form.getFieldValue("quantity") || 0);
    const price = Number(form.getFieldValue("price") || 0);
    form.setFieldsValue({ total: quantity * price });
  };

  // ============================================================
  // SAVE / UPDATE
  // ============================================================
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      try {
        const quantity = Number(values.quantity || 0);
        const price = Number(values.price || 0);
        const total = quantity * price;

        // UPDATE
        if (isEditing && editingExpenseId !== null) {
          const payload = {
            price,
            quantity,
            schoolExpenseId: editingExpenseId,
            purchaseId: Number(values.purchaseId),
            status: values.status,
          };
          console.log("UPDATE SCHOOL EXPENSE PAYLOAD:", payload);

          const res = await api.put(apiEndpoints.updateSchoolExpenses(), payload);
          // Backend may return HTTP 200 but success:false.
          if (res?.data?.success === false) {
            message.error(res?.data?.message || "Failed to update school expense");
            return;
          }
          message.success(res?.data?.message || "School expense updated successfully");
          closeDrawer();
          fetchSchoolExpenses();
          return;
        }

        // SAVE
        const payload = { price, quantity, total, purchaseId: Number(values.purchaseId), status: values.status };
        console.log("SAVE SCHOOL EXPENSE PAYLOAD:", payload);

        const res = await api.post(apiEndpoints.saveSchoolExpenses(), payload);
        // Backend may return HTTP 200 but success:false.
        if (res?.data?.success === false) {
          message.error(res?.data?.message || "Failed to save school expense");
          return;
        }
        message.success(res?.data?.message || "School expense saved successfully");
        closeDrawer();
        fetchSchoolExpenses();
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
      fetchSchoolExpenses();
    } catch (error: any) {
      console.error("Delete expense error:", error);
      message.error(error?.response?.data?.message || "Failed to delete school expense");
    }
  };

  // ============================================================
  // PAGINATION — purely a frontend slice now (see EXPENSES_FETCH_SIZE
  // note above), so this no longer triggers a backend call.
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
      render: (_: any, record: SchoolExpenseRow) => record.purchaseDTO?.category || "-",
    },
    {
      title: "Product Name", key: "productName",
      render: (_: any, record: SchoolExpenseRow) => record.purchaseDTO?.productName || "-",
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

      {/* 🆕 SEARCH FILTER BAR — Category / Product Name + Search / Reset */}
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
            <Button type="primary" icon={<SearchOutlined />} onClick={() => {}}>
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
                      <div className="font-semibold text-base mt-1">{record.purchaseDTO?.productName}</div>
                    </div>
                    <Tag color={record.status === "PAID" ? "green" : record.status === "PENDING" ? "orange" : "blue"}>
                      {record.status}
                    </Tag>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-gray-500">Category</div>
                    <div className="font-medium">{record.purchaseDTO?.category || "-"}</div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-gray-500">Purchase ID</div>
                    <div className="font-medium">{record.purchaseId}</div>
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

      {/* ADD / EDIT DRAWER — refined visual design */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg,#4096ff,#1677ff)", color: "#fff",
              }}
            >
              <ShoppingOutlined />
            </span>
            <span className="font-semibold">{isEditing ? "Update School Expense" : "Add School Expense"}</span>
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
          header: { borderBottom: "1px solid #f0f0f0", paddingBottom: 16 },
          body: { paddingTop: 20, paddingBottom: 20, background: "#fafafa" },
          footer: { borderTop: "1px solid #f0f0f0" },
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={closeDrawer} disabled={submitting}>Cancel</Button>
            <Button type="primary" loading={submitting} onClick={handleFinish}>
              {isEditing ? "Update" : "Save"}
            </Button>
          </div>
        }
      >
        <Spin spinning={drawerLoading} tip="Loading...">
          <Form form={form} layout="vertical">
            {/* CATEGORY + PRODUCT NAME (purchaseId is the form value) */}
            <Card size="small" className="mb-4" style={{ borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <Form.Item
                label={<span className="font-medium">Category</span>}
                name="categoryFilter"
              >
                <Select
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
                label={<span className="font-medium">Product Name</span>}
                name="purchaseId"
                rules={[{ required: true, message: "Please select product" }]}
                className="!mb-0"
              >
                <Select
                  placeholder="Select product"
                  loading={purchaseLoading}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  onChange={handlePurchaseChange}
                >
                  {filteredPurchaseOptions.map((purchase) => (
                    <Option key={purchase.purchaseId} value={purchase.purchaseId}>
                      <div className="flex justify-between items-center">
                        <span>{purchase.productName}</span>
                        <span className="text-gray-400 text-xs ml-2">{purchase.productCode}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* SELECTED PRODUCT INFORMATION — shows automatically as
                  soon as a Product Name is picked above. */}
              {selectedPurchase && (
                <div
                  className="mt-3 rounded-lg p-3"
                  style={{
                    background: "linear-gradient(135deg,#f0f7ff,#f7fbff)",
                    border: "1px solid #d6e8ff",
                  }}
                >
                  <Row gutter={12}>
                    <Col span={12}>
                      <div className="text-xs text-gray-500">Category</div>
                      <div className="font-medium">{selectedPurchase.category || "-"}</div>
                    </Col>
                    <Col span={12}>
                      <div className="text-xs text-gray-500">Purchase ID</div>
                      <div className="font-medium">{selectedPurchase.purchaseId}</div>
                    </Col>
                    {selectedPurchase.productCode && (
                      <Col span={12} className="mt-3">
                        <div className="text-xs text-gray-500">Product Code</div>
                        <div className="font-medium">{selectedPurchase.productCode}</div>
                      </Col>
                    )}
                  </Row>
                </div>
              )}
            </Card>

            <Divider orientation="left" plain className="!my-3 !text-xs !text-gray-400">
              Billing Details
            </Divider>

            {/* QUANTITY / PRICE / TOTAL / STATUS */}
            <Card size="small" style={{ borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Quantity"
                    name="quantity"
                    rules={[
                      { required: true, message: "Quantity is required" },
                      { type: "number", min: 1, message: "Quantity must be at least 1" },
                    ]}
                  >
                    <InputNumber className="w-full" min={1} placeholder="Enter quantity" onChange={updateTotal} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Price"
                    name="price"
                    rules={[
                      { required: true, message: "Price is required" },
                      { type: "number", min: 0, message: "Price cannot be negative" },
                    ]}
                  >
                    <InputNumber className="w-full" min={0} precision={2} prefix="₹" placeholder="Enter price" onChange={updateTotal} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Total" name="total">
                    <InputNumber className="w-full" precision={2} prefix="₹" disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Status"
                    name="status"
                    rules={[{ required: true, message: "Please select status" }]}
                  >
                    <Select placeholder="Select status">
                      <Option value="PAID">PAID</Option>
                      <Option value="PENDING">PENDING</Option>
                      <Option value="PARTIAL">PARTIAL</Option>
                       <Option value="OVERDUE">OVERDUE</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <div className="text-xs text-gray-400 leading-relaxed mt-3">
              Select a product to auto-fill its category and purchase details. Quantity and Price will
              automatically calculate the Total.
            </div>
          </Form>
        </Spin>
      </Drawer>
    </div>
  );
}
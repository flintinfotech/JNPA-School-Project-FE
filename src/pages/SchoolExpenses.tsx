import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button, Card, Col, DatePicker, Divider, Drawer, Empty, Form, InputNumber,
  Popconfirm, Row, Select, Spin, Tag, message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

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
  purchaseDTO?: { purchaseId: number; category?: string; productCode?: string; productName?: string };
  quantity: number;
  price: number;
  total: number | null;
  purchaseDate?: string;
  status: string;
  [key: string]: any;
}

interface ExpenseFilters {
  category?: string;
  status?: string;
  purchaseDate?: Dayjs | null;
}

// 🛠️ Fetching everything once (large page size) so the new Category /
// Purchase Date / Status search below can match rows on ANY page, not
// just whatever page happened to already be loaded — same fix already
// applied on the Results/Achievements screens.
const MAX_FETCH_SIZE = 10000;

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
        total: Number(data?.["Total Element"] ?? data?.["Total Elements"] ?? data?.["Total"] ?? data?.["total"] ?? data[key].length) || 0,
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
  // ----- TABLE STATE -----
  const [allRows, setAllRows] = useState<SchoolExpenseRow[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // ----- SEARCH FILTERS -----
  const [filters, setFilters] = useState<ExpenseFilters>({});

  // ----- PURCHASE MASTER STATE -----
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // ----- DRAWER STATE -----
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRow | null>(null);
  const [form] = Form.useForm();

  // ----- RESPONSIVE DRAWER WIDTH -----
  const [drawerWidth, setDrawerWidth] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 480
  );

  useEffect(() => {
    const handleResize = () => setDrawerWidth(window.innerWidth < 768 ? "100%" : 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ============================================================
  // CATEGORY OPTIONS — derived from the Purchase master data that's
  // already loaded, no extra API call needed.
  // ============================================================

  const categoryOptions = useMemo(
    () => Array.from(new Set(purchases.map((p) => p.category).filter(Boolean))) as string[],
    [purchases]
  );

  // ============================================================
  // GET ALL SCHOOL EXPENSES (fetches everything once)
  // ============================================================

  const fetchSchoolExpenses = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await api.post(apiEndpoints.getAllSchoolExpensesByFilter(0, MAX_FETCH_SIZE), {});
      if (res?.data?.success === false) {
        message.error(res?.data?.message || "Failed to load school expenses");
        setAllRows([]);
        return;
      }
      const { list } = extractExpenseListAndTotal(res);
      setAllRows(list);
    } catch (error: any) {
      console.error("School expenses error:", error);
      message.error(error?.response?.data?.message || "Failed to load school expenses");
    } finally {
      setTableLoading(false);
    }
  }, []);

  // ============================================================
  // GET ALL PURCHASES (existing API — /purchase/getAllPurchaseByFilter)
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

  // ----- INITIAL LOAD -----
  useEffect(() => { fetchSchoolExpenses(); }, [fetchSchoolExpenses]);
  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  // ============================================================
  // SEARCH BAR HANDLERS
  // ============================================================

  const handleFilterChange = (field: keyof ExpenseFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Filtering already happens live below (filteredRows), Search just
  // jumps back to page 1 so the match is visible immediately.
  const handleSearch = () => setPage(0);

  const handleReset = () => {
    setFilters({});
    setPage(0);
  };

  // ============================================================
  // CLIENT-SIDE FILTER + PAGINATE (runs over the FULL dataset, so a
  // match is found no matter which page it would otherwise land on)
  // ============================================================

  const filteredRows = useMemo(() => {
    const dateStr = filters.purchaseDate ? filters.purchaseDate.format("YYYY-MM-DD") : null;
    return allRows.filter((r) => {
      const matchesCategory = filters.category ? r.purchaseDTO?.category === filters.category : true;
      const matchesStatus = filters.status ? r.status === filters.status : true;
      const matchesDate = dateStr ? r.purchaseDate && dayjs(r.purchaseDate).format("YYYY-MM-DD") === dateStr : true;
      return matchesCategory && matchesStatus && matchesDate;
    });
  }, [allRows, filters]);

  const total = filteredRows.length;
  const rows = useMemo(
    () => filteredRows.slice(page * pageSize, page * pageSize + pageSize),
    [filteredRows, page, pageSize]
  );

  // ============================================================
  // ADD EXPENSE
  // ============================================================

  const openAddDrawer = () => {
    setIsEditing(false);
    setEditingExpenseId(null);
    setSelectedPurchase(null);
    form.resetFields();
    form.setFieldsValue({ quantity: 1, price: 0, total: 0, purchaseDate: dayjs(), status: "PAID" });
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
      let purchase = purchases.find((item) => Number(item.purchaseId) === Number(record.purchaseId)) || null;

      if (!purchase && record.purchaseDTO) {
        purchase = {
          purchaseId: record.purchaseDTO.purchaseId || record.purchaseId,
          category: record.purchaseDTO.category,
          productCode: record.purchaseDTO.productCode,
          productName: record.purchaseDTO.productName,
        };
      }

      setSelectedPurchase(purchase);

      form.setFieldsValue({
        purchaseId: record.purchaseId,
        quantity: record.quantity,
        price: record.price,
        total: record.total !== null && record.total !== undefined
          ? record.total
          : Number(record.quantity || 0) * Number(record.price || 0),
        purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : undefined,
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
        const purchaseDate: string | undefined = values.purchaseDate
          ? (values.purchaseDate as Dayjs).format("YYYY-MM-DD")
          : undefined;

        if (isEditing && editingExpenseId !== null) {
          const payload = {
            price, quantity, total,
            schoolExpenseId: editingExpenseId,
            purchaseId: Number(values.purchaseId),
            purchaseDate,
            status: values.status,
          };

          console.log("UPDATE SCHOOL EXPENSE PAYLOAD:", payload);
          const res = await api.put(apiEndpoints.updateSchoolExpenses(), payload);

          if (res?.data?.success === false) {
            message.error(res?.data?.message || "Failed to update school expense");
            return;
          }

          message.success(res?.data?.message || "School expense updated successfully");
          closeDrawer();
          fetchSchoolExpenses();
          return;
        }

        const payload = {
          price, quantity, total,
          purchaseId: Number(values.purchaseId),
          purchaseDate,
          status: values.status,
        };

        console.log("SAVE SCHOOL EXPENSE PAYLOAD:", payload);
        const res = await api.post(apiEndpoints.saveSchoolExpenses(), payload);

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

      if (rows.length === 1 && page > 0) setPage(page - 1);
      fetchSchoolExpenses();
    } catch (error: any) {
      console.error("Delete expense error:", error);
      message.error(error?.response?.data?.message || "Failed to delete school expense");
    }
  };

  // ============================================================
  // PAGINATION — purely local now, data is already fully loaded
  // ============================================================

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage - 1);
    setPageSize(newPageSize);
  };

  // ============================================================
  // TABLE COLUMNS
  // ============================================================

  const columns = [
    { title: "Sr No", key: "srNo", width: 80, render: (_: any, __: SchoolExpenseRow, index: number) => page * pageSize + index + 1 },
    { title: "Category", key: "category", render: (_: any, record: SchoolExpenseRow) => record.purchaseDTO?.category || "-" },
    { title: "Product Name", key: "productName", render: (_: any, record: SchoolExpenseRow) => record.purchaseDTO?.productName || "-" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity", render: (value: number) => value ?? 0 },
    { title: "Price", dataIndex: "price", key: "price", render: (value: number) => `₹ ${Number(value || 0).toFixed(2)}` },
    {
      title: "Total", key: "total",
      render: (_: any, record: SchoolExpenseRow) => {
        const total = record.total !== null && record.total !== undefined
          ? record.total
          : Number(record.quantity || 0) * Number(record.price || 0);
        return `₹ ${Number(total || 0).toFixed(2)}`;
      },
    },
    { title: "Purchase Date", dataIndex: "purchaseDate", key: "purchaseDate", render: (value: string) => (value ? dayjs(value).format("DD MMM, YYYY") : "-") },
    {
      title: "Status", dataIndex: "status", key: "status",
      render: (status: string) => (
        <Tag color={status === "PAID" ? "green" : status === "PENDING" ? "orange" : "blue"}>{status || "-"}</Tag>
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
  // SEARCH BAR
  // ============================================================

  const renderFilterBar = () => (
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Category"
          value={filters.category || undefined}
          onChange={(value) => handleFilterChange("category", value)}
          style={{ width: "100%" }}
          allowClear
        >
          {categoryOptions.map((cat) => (
            <Option key={cat} value={cat}>{cat}</Option>
          ))}
        </Select>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <DatePicker
          placeholder="Purchase Date"
          value={filters.purchaseDate || null}
          onChange={(value) => handleFilterChange("purchaseDate", value)}
          format="DD/MM/YYYY"
          style={{ width: "100%" }}
          allowClear
        />
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Status"
          value={filters.status || undefined}
          onChange={(value) => handleFilterChange("status", value)}
          style={{ width: "100%" }}
          allowClear
        >
          <Option value="PAID">PAID</Option>
          <Option value="PENDING">PENDING</Option>
          <Option value="PARTIALLY_PAID">PARTIALLY PAID</Option>
        </Select>
      </Col>

      <Col xs={24} sm={24} md={6}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Search</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>Reset</Button>
        </div>
      </Col>
    </Row>
  );

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-end md:items-center gap-3 mb-7">
      
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>Add Expense</Button>
      </div>

      {renderFilterBar()}

      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        {!tableLoading && rows.length === 0 ? (
          <Card><Empty description="No school expenses found" /></Card>
        ) : (
          <div className="overflow-x-auto">
            <CommonTable
              data={rows}
              columns={columns}
              loading={tableLoading}
              pagination={{
                current: page + 1, pageSize, total,
                onChange: (newPage: number, newPageSize: number) => handlePaginationChange(newPage, newPageSize),
              }}
            />
          </div>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="block md:hidden">
        {tableLoading ? (
          <Card><div className="flex justify-center py-8"><Spin /></div></Card>
        ) : rows.length === 0 ? (
          <Card><Empty description="No school expenses found" /></Card>
        ) : (
          <div className="space-y-4">
            {rows.map((record, index) => {
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

                  <div className="mt-3">
                    <div className="text-xs text-gray-500">Purchase Date</div>
                    <div className="font-medium">{record.purchaseDate ? dayjs(record.purchaseDate).format("DD MMM, YYYY") : "-"}</div>
                  </div>

                  <div className="border-t mt-4 pt-3 flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg">₹ {Number(calculatedTotal || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => openEditDrawer(record)}>Edit</Button>
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

            <div className="flex justify-center">
              <div className="w-full overflow-x-auto">
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

      {/* ADD / EDIT DRAWER */}
      <Drawer
        title={isEditing ? "Update School Expense" : "Add School Expense"}
        open={drawerOpen}
        onClose={closeDrawer}
        width={drawerWidth}
        destroyOnClose
        placement="right"
        maskClosable={!submitting}
        closable={!submitting}
        styles={{ body: { paddingTop: 20, paddingBottom: 20 } }}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={closeDrawer} disabled={submitting}>Cancel</Button>
            <Button type="primary" loading={submitting} onClick={handleFinish}>{isEditing ? "Update" : "Save"}</Button>
          </div>
        }
      >
        <Spin spinning={drawerLoading} tip="Loading...">
          <Form form={form} layout="vertical">
            <Form.Item
              label="Product Name"
              name="purchaseId"
              rules={[{ required: true, message: "Please select product" }]}
            >
              <Select
                placeholder="Select product"
                loading={purchaseLoading}
                showSearch
                allowClear
                optionFilterProp="children"
                onChange={handlePurchaseChange}
              >
                {purchases.map((purchase) => (
                  <Option key={purchase.purchaseId} value={purchase.purchaseId}>
                    <div className="flex justify-between items-center">
                      <span>{purchase.productName}</span>
                      <span className="text-gray-400 text-xs ml-2">{purchase.productCode}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedPurchase && (
              <div className="bg-gray-50 border rounded-lg p-3 mb-5">
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

            <Divider orientation="left" plain className="!my-3 !text-xs !text-gray-400">Billing Details</Divider>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="Quantity" name="quantity"
                  rules={[{ required: true, message: "Quantity is required" }, { type: "number", min: 1, message: "Quantity must be at least 1" }]}
                >
                  <InputNumber className="w-full" min={1} placeholder="Enter quantity" onChange={updateTotal} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Price" name="price"
                  rules={[{ required: true, message: "Price is required" }, { type: "number", min: 0, message: "Price cannot be negative" }]}
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
                  label="Purchase Date" name="purchaseDate"
                  rules={[{ required: true, message: "Please select purchase date" }]}
                >
                  <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Select date" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={24}>
                <Form.Item label="Status" name="status" rules={[{ required: true, message: "Please select status" }]}>
                  <Select placeholder="Select status">
                    <Option value="PAID">PAID</Option>
                    <Option value="PENDING">PENDING</Option>
                    <Option value="PARTIALLY_PAID">PARTIALLY PAID</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider className="!my-2" />
            <div className="text-xs text-gray-400 leading-relaxed">
              Select a product to auto-fill its category and purchase details. Quantity and Price will automatically calculate the Total.
            </div>
          </Form>
        </Spin>
      </Drawer>
    </div>
  );
}
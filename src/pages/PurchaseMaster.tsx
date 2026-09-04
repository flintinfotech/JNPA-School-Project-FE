import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Spin,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import CommonTable from "../components/commonTable"; // 👈 change to your actual path
import api from "../lib/axios"; // 👈 change to your actual axios instance path
import { apiEndpoints } from "../services/apiEndpoints"; // 👈 change to your actual path

const { Option } = Select;

interface PurchaseRow {
  purchaseId: number;
  category?: string;
  productCode?: string;
  productName?: string;
  [key: string]: any;
}

// 👇 Loose type — getAllStaticData's response may contain plain strings OR
// objects per key (same as your TimeTable page), so entries are
// normalized via toLabel/toValue at the point of use.
type StaticDataMap = Record<string, any[]>;

// 🛠️ Same string/object normalization helpers used in TimeTable.tsx, so
// this dropdown is safe regardless of whether getAllStaticData returns
// entries as plain strings (e.g. "Lab Equipment") or objects (e.g.
// { label: "Lab Equipment", value: 3 }).
const toLabel = (item: any): string => {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);
  return String(
    item.label ?? item.name ?? item.categoryName ?? item.title ?? item.value ?? ""
  );
};

const toValue = (item: any): string => {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);
  return String(
    item.value ?? item.label ?? item.name ?? item.categoryName ?? item.id ?? ""
  );
};

// 🛠️ We don't know the exact key getAllStaticData uses for the Category
// list, so try the likely candidates. If none match, a console.warn below
// dumps the actual response keys so the real one can be spotted instantly.
const CATEGORY_KEY_CANDIDATES = [
  "category",
  "Category",
  "categories",
  "Categories",
  "purchaseCategory",
  "PurchaseCategory",
  "Purchase Category",
  "Purchase Categories",
];

const getCategoryList = (staticData: StaticDataMap | null): any[] => {
  if (!staticData) return [];
  for (const key of CATEGORY_KEY_CANDIDATES) {
    if (Array.isArray(staticData[key])) return staticData[key];
  }
  return [];
};

// Defensive extractor — unwraps the {success,message,data,timestamp}
// envelope, same pattern used across this app's other list screens, so
// this still works even if the backend later renames/adds wrapper keys.
const extractListAndTotal = (raw: any): { list: PurchaseRow[]; total: number } => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;

  const listKeys = ["PurchaseDTOS", "purchaseDTOS", "Data", "data"];
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

const emptyValues = { purchaseId: undefined, category: undefined, productCode: "", productName: "" };

// 🛠️ Same responsive hook used on the Student Fees screen — flips to the
// mobile card layout below `breakpoint`px and back to the table above it.
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

export default function PurchaseMaster() {
  const isMobile = useIsMobile();

  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  const [staticData, setStaticData] = useState<StaticDataMap | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchPurchases = useCallback(async (pageNum: number, size: number) => {
    setTableLoading(true);
    try {
      const res = await api.post(apiEndpoints.getAllPurchaseByFilter(pageNum, size), {});
      const { list, total: t } = extractListAndTotal(res);
      setRows(list);
      setTotal(t);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load purchases");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases(page, pageSize);
  }, [page, pageSize, fetchPurchases]);

  // Static data (Category dropdown options) — fetched once on mount and
  // cached, same lazy/cache pattern as TimeTable's ensureStaticData.
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(apiEndpoints.getAllStaticData());
        const data = res.data?.data ?? res.data ?? {};
        setStaticData(data);
      } catch {
        // non-fatal — Category dropdown falls back to empty
      }
    })();
  }, []);

  const categoryOptions = getCategoryList(staticData).map((c: any) => ({
    value: toValue(c),
    label: toLabel(c),
  }));

  // 🛠️ dev diagnostic — if static data loaded but none of our guessed key
  // names produced a Category list, warn with the actual keys so the real
  // one can be found immediately in devtools instead of guessing blind.
  useEffect(() => {
    if (staticData && categoryOptions.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "PurchaseMaster: none of the expected keys (" +
          CATEGORY_KEY_CANDIDATES.join(", ") +
          ") were found in getAllStaticData's response, so the Category dropdown is empty." +
          " Actual staticData keys:",
        Object.keys(staticData)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticData]);

  const openAddModal = () => {
    setIsEditing(false);
    form.resetFields();
    form.setFieldsValue(emptyValues);
    setModalOpen(true);
  };

  const openEditModal = async (record: PurchaseRow) => {
    setIsEditing(true);
    setModalOpen(true);
    setModalLoading(true);
    try {
      const res = await api.get(apiEndpoints.getPurchaseById(record.purchaseId));
      const data = res.data?.data ?? res.data;
      form.setFieldsValue({
        purchaseId: data?.purchaseId,
        category: data?.category,
        productCode: data?.productCode,
        productName: data?.productName,
      });
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load purchase");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    form.resetFields();
  };

  // ---------------------------------------------------------------
  // 🛠️ FIX — duplicate/validation failures were being treated as success.
  //
  // Both savePurchase and updatePurchase return HTTP 200 even when the
  // backend rejects the data (e.g. a duplicate product code) — the
  // failure is only signalled by `success: false` in the response BODY,
  // not by an HTTP error status. Since axios only throws on non-2xx
  // responses, the old code's `catch` block never ran for this case, so
  // it fell straight into the "success" path: closed the modal, showed a
  // success toast, and refetched — even though nothing was actually
  // saved. Both branches below now explicitly check `res.data.success`
  // and, when it's false, show the backend's own message and leave the
  // modal open instead of pretending it worked.
  // ---------------------------------------------------------------
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      try {
        let res;
        if (isEditing && values.purchaseId) {
          const payload = {
            purchaseId: values.purchaseId,
            category: values.category,
            productCode: values.productCode,
            productName: values.productName,
          };
          res = await api.put(apiEndpoints.updatePurchase(), payload);
        } else {
          const payload = {
            category: values.category,
            productCode: values.productCode,
            productName: values.productName,
          };
          res = await api.post(apiEndpoints.savePurchase(), payload);
        }

        if (res?.data?.success === false) {
          message.error(
            res?.data?.message ||
              (isEditing ? "Failed to update purchase" : "Failed to save purchase")
          );
          return; // keep the modal open so the user can fix the values
        }

        message.success(
          res?.data?.message ||
            (isEditing ? "Purchase updated successfully" : "Purchase saved successfully")
        );
        closeModal();
        fetchPurchases(page, pageSize);
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Failed to save purchase");
      } finally {
        setSubmitting(false);
      }
    } catch {
      // form field validation errors are shown inline by antd
    }
  };

  const handleDelete = async (purchaseId: number) => {
    try {
      const res = await api.delete(apiEndpoints.deletePurchase(purchaseId));
      if (res?.data?.success === false) {
        message.error(res?.data?.message || "Failed to delete purchase");
        return;
      }
      message.success(res?.data?.message || "Purchase deleted successfully");
      fetchPurchases(page, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete purchase");
    }
  };

  const columns = [
    {
      title: "Product Code",
      dataIndex: "productCode",
      key: "productCode",
      render: (v: string) => v || "-",
    },

    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (v: string) => v || "-",
    },
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
      render: (v: string) => v || "-",
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      render: (_: any, record: PurchaseRow) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Delete this purchase?"
            onConfirm={() => handleDelete(record.purchaseId)}
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
      {/* 🛠️ FIX — "justify-between" with a single child has nothing to push
          against, so the button sat on the left. "justify-end" moves it to
          the right, matching the other screens. */}
      <div className="flex justify-end items-center mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Purchase
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {tableLoading && (
            <div className="text-center text-sm text-gray-400 py-6">Loading...</div>
          )}
          {!tableLoading && rows.length === 0 && (
            <Empty description="No purchases found" style={{ padding: "40px 0" }} />
          )}
          {!tableLoading &&
            rows.map((record) => (
              <div
                key={record.purchaseId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {record.productName || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Code: {record.productCode ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <p>Category: {record.category ?? "-"}</p>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-gray-50">
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => openEditModal(record)}
                  />
                  <Popconfirm
                    title="Delete this purchase?"
                    onConfirm={() => handleDelete(record.purchaseId)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                </div>
              </div>
            ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">Total: {total}</span>
            <div className="flex gap-2">
              <Button
                size="small"
                disabled={page + 1 <= 1}
                onClick={() => setPage(page - 1)}
              >
                Prev
              </Button>
              <Button
                size="small"
                disabled={(page + 1) * pageSize >= total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {!tableLoading && rows.length === 0 ? (
            <Empty description="No purchases found" style={{ padding: "40px 0" }} />
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
        </div>
      )}

      <Modal
        title={isEditing ? "Update Purchase" : "Add Purchase"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Spin spinning={modalLoading} tip="Loading purchase...">
          <Form form={form} layout="vertical">
            <Form.Item name="purchaseId" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              label="Product Code"
              name="productCode"
              rules={[{ required: true, message: "Product code is required" }]}
            >
              <Input placeholder="e.g. PDC-01" />
            </Form.Item>

            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: "Category is required" }]}
            >
              <Select placeholder="Select category" allowClear showSearch optionFilterProp="children">
                {categoryOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Product Name"
              name="productName"
              rules={[{ required: true, message: "Product name is required" }]}
            >
              <Input placeholder="e.g. Beakers" />
            </Form.Item>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" loading={submitting} onClick={handleFinish}>
                {isEditing ? "Update" : "Save"}
              </Button>
            </div>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}
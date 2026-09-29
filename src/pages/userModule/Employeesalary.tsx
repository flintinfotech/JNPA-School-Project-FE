import { useState, useEffect, useCallback, useRef } from "react";
import {
  Drawer,
  Form,
  message,
  Modal,
  Popconfirm,
  Button,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Space,
  Row,
  Col,
  Card,
  Descriptions,
  Empty,
  Tooltip,
  Tag,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import {
  getAllEmployeeDetailsByFilter,
  getEmployeeDetailsById,
  type UserDTO,
  type UserSearchFilters,
} from "../../services/userService";
import {
  saveEmployeeSalary,
  updateEmployeeSalary,
  getSalariesByEmployeeDetailsId,
  deleteEmployeeSalary,
  type EmployeeSalaryDTO,
} from "../../services/employeeSalaryService";
import { getAllStaticData } from "../../services/staticDataService";
import CommonTable from "../../components/commonTable"; // 👈 same table component as Purchase Master (change path if needed)

type EmployeeRow = UserDTO;

// ---------- helpers ----------
const num = (v: any) => Number(v) || 0;

const money = (v?: number | null) =>
  v === null || v === undefined
    ? "-"
    : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Net salary = basic + allowances - deduction (backend calculates the real value on save)
const calcNet = (r: any) =>
  num(r?.basicSalary) +
  num(r?.hra) +
  num(r?.transportAllowance) +
  num(r?.medicalAllowance) +
  num(r?.otherAllowance) -
  num(r?.deduction);

// Academic year starts in April: Sep 2026 -> "2026-2027", Feb 2027 -> "2026-2027"
const getAcademicYear = (d: Dayjs = dayjs()) => {
  const y = d.year();
  return d.month() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const fullName = (r: EmployeeRow) =>
  [r.firstName, (r as any).middleName, r.lastName].filter(Boolean).join(" ").trim();

// Used to detect which saved cards were really changed (only those get updated)
const rowSignature = (r: any) =>
  JSON.stringify([
    r?.salaryDate ? dayjs(r.salaryDate).format("YYYY-MM-DD") : null,
    num(r?.basicSalary),
    num(r?.hra),
    num(r?.transportAllowance),
    num(r?.medicalAllowance),
    num(r?.otherAllowance),
    num(r?.deduction),
    r?.remark ?? "",
  ]);

export default function EmployeeSalary() {
  const [users, setUsers] = useState<EmployeeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // Edit drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null); // which card is being saved
  const [submitting, setSubmitting] = useState(false); // bottom Save/Update button
  const snapshotRef = useRef<Record<number, string>>({}); // saved values, to detect changes
  const [activeEmployee, setActiveEmployee] = useState<{ id: number; name: string } | null>(null);
  const [form] = Form.useForm();

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewSalaries, setViewSalaries] = useState<EmployeeSalaryDTO[]>([]);
  const [viewEmployee, setViewEmployee] = useState<{ id: number; name: string } | null>(null);

  // Search bar state
  const [searchFilters, setSearchFilters] = useState<UserSearchFilters>({
    firstName: "",
    lastName: "",
    role: "",
  });

  // Role dropdown (fetched on first click, not on mount)
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [rolesFetched, setRolesFetched] = useState(false);

  const handleRoleDropdownOpen = async (open: boolean) => {
    if (!open || rolesFetched) return;
    setRoleLoading(true);
    try {
      const response = await getAllStaticData();
      if (response.success) {
        const roles = response.data.role || [];
        setRoleOptions(
          roles.map((r: string) => ({ label: r.charAt(0) + r.slice(1).toLowerCase(), value: r }))
        );
        setRolesFetched(true);
      } else {
        message.error(response.message || "Failed to load roles");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load roles");
    } finally {
      setRoleLoading(false);
    }
  };

  // ---------- EMPLOYEE LIST (same API as Employee Details) ----------
  const fetchUsers = useCallback(
    async (pageNum: number, size: number, filters?: UserSearchFilters) => {
      setTableLoading(true);
      try {
        const response = await getAllEmployeeDetailsByFilter(pageNum, size, filters);
        if (response.success) {
          setUsers(response.data.Data);
          setTotal(response.data.total);
        } else {
          message.error(response.message || "Failed to load employees");
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Failed to load employees");
      } finally {
        setTableLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsers(page, pageSize, searchFilters);
    // searchFilters intentionally left out — search only fires on button click
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, fetchUsers]);

  const handleFilterChange = (field: keyof UserSearchFilters, value: string) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(0);
    fetchUsers(0, pageSize, searchFilters);
  };

  const handleResetFilters = () => {
    const cleared: UserSearchFilters = { firstName: "", lastName: "", role: "" };
    setSearchFilters(cleared);
    setPage(0);
    fetchUsers(0, pageSize, cleared);
  };

  // ---------- salary helpers ----------

  // Prefer the employeeDetailsId on the row, else look it up through userId.
  const resolveEmployeeDetailsId = async (record: EmployeeRow): Promise<number | null> => {
    let id = (record as any).employeeDetailsId;
    if (!id && record.userId) {
      try {
        const res = await getEmployeeDetailsById(record.userId);
        if (res.success && res.data?.employeeDetailsId) id = res.data.employeeDetailsId;
      } catch (error) {
        console.error("Could not resolve employeeDetailsId:", error);
      }
    }
    if (!id) {
      message.error("Employee details not found for this user.");
      return null;
    }
    return id;
  };

  // All salary records of one employee (list API, all pages)
  const fetchSalaryList = async (employeeDetailsId: number): Promise<EmployeeSalaryDTO[]> => {
    try {
      return await getSalariesByEmployeeDetailsId(employeeDetailsId);
    } catch (error) {
      console.error("Salary list fetch failed:", error);
      return [];
    }
  };

  const toFormRow = (s: EmployeeSalaryDTO) => ({
    employeeSalaryId: s.employeeSalaryId,
    academicYear: s.academicYear,
    salaryDate: s.salaryDate ? dayjs(s.salaryDate) : null,
    basicSalary: s.basicSalary,
    hra: s.hra,
    transportAllowance: s.transportAllowance,
    medicalAllowance: s.medicalAllowance,
    otherAllowance: s.otherAllowance,
    deduction: s.deduction,
    remark: s.remark,
  });

  const newRow = () => ({
    academicYear: getAcademicYear(),
    salaryDate: dayjs(),
  });

  // ---------- VIEW ----------
  const openViewModal = async (record: EmployeeRow) => {
    const id = await resolveEmployeeDetailsId(record);
    if (!id) return;
    const list = await fetchSalaryList(id);
    setViewEmployee({ id, name: fullName(record) });
    setViewSalaries(list);
    setViewOpen(true);
  };

  const closeViewModal = () => {
    setViewOpen(false);
    setViewSalaries([]);
    setViewEmployee(null);
  };

  // Deletes ONLY the clicked record (DELETE .../deleteEmployeeSalary/{employeeSalaryId})
  const handleDeleteFromView = async (salary: EmployeeSalaryDTO) => {
    if (!viewEmployee || !salary.employeeSalaryId) return;
    try {
      const res = await deleteEmployeeSalary(salary.employeeSalaryId);
      if (res.success) {
        message.success(res.message);
        setViewSalaries(await fetchSalaryList(viewEmployee.id)); // reload real data
      } else {
        message.error(res.message || "Failed to delete salary");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete salary");
    }
  };

  // ---------- EDIT ----------
  const openEditDrawer = async (record: EmployeeRow) => {
    const id = await resolveEmployeeDetailsId(record);
    if (!id) return;

    const list = await fetchSalaryList(id);
    setActiveEmployee({ id, name: fullName(record) });

    const rows = list.map(toFormRow);
    snapshotRef.current = {};
    rows.forEach((r) => {
      if (r.employeeSalaryId) snapshotRef.current[r.employeeSalaryId] = rowSignature(r);
    });

    form.resetFields();
    form.setFieldsValue({
      // no salary yet -> one blank entry ready to fill
      salaries: rows.length ? rows : [newRow()],
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setActiveEmployee(null);
    setSavingIndex(null);
    setSubmitting(false);
  };

  // Sends ONE card to the server: POST if it is new, PUT if it already has an id.
  // Returns the API response (or null when it failed).
  const persistRow = async (index: number) => {
    if (!activeEmployee) return null;
    const s = form.getFieldValue(["salaries", index]);
    const common = {
      salaryDate: dayjs(s.salaryDate).format("YYYY-MM-DD"),
      basicSalary: s.basicSalary,
      hra: s.hra ?? 0,
      transportAllowance: s.transportAllowance ?? 0,
      medicalAllowance: s.medicalAllowance ?? 0,
      otherAllowance: s.otherAllowance ?? 0,
      deduction: s.deduction ?? 0,
      remark: s.remark,
      academicYear: s.academicYear,
    };

    const response = s.employeeSalaryId
      ? // PUT employeeSalary/updateEmployeeSalary
        await updateEmployeeSalary({ employeeSalaryId: s.employeeSalaryId, ...common })
      : // POST employeeSalary/saveEmployeeSalary
        await saveEmployeeSalary({ employeeDetailsId: activeEmployee.id, ...common });

    if (!response.success) {
      message.error(response.message || "Failed to save salary");
      return null;
    }

    // refresh this card with the saved data (a new card now gets its employeeSalaryId)
    if (response.data) {
      const saved = toFormRow(response.data);
      form.setFieldValue(["salaries", index], saved);
      if (saved.employeeSalaryId) snapshotRef.current[saved.employeeSalaryId] = rowSignature(saved);
    }
    return response;
  };

  // Update / Save icon on a card -> ONLY this card
  const handleSaveCard = async (index: number) => {
    try {
      await form.validateFields([
        ["salaries", index, "salaryDate"],
        ["salaries", index, "basicSalary"],
      ]);
    } catch {
      return;
    }

    setSavingIndex(index);
    try {
      const response = await persistRow(index);
      if (response) message.success(response.message);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSavingIndex(null);
    }
  };

  // Bottom Save / Update button -> new cards are saved, only CHANGED old cards are updated
  const handleSaveAll = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }

    const rows: any[] = form.getFieldValue("salaries") || [];
    if (!rows.length) {
      message.warning("Please add at least one salary.");
      return;
    }

    const pending = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r?.employeeSalaryId || snapshotRef.current[r.employeeSalaryId] !== rowSignature(r));

    if (!pending.length) {
      message.info("No changes to save.");
      return;
    }

    setSubmitting(true);
    try {
      for (const { i } of pending) {
        const response = await persistRow(i);
        if (!response) return; // error already shown, keep the drawer open
      }
      message.success("Employee salary saved successfully");
      closeDrawer();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete ONLY this one card
  const handleDeleteCard = async (index: number, remove: (i: number) => void) => {
    const row = form.getFieldValue(["salaries", index]);

    // Not saved yet -> just drop it from the form, no API call
    if (!row?.employeeSalaryId) {
      remove(index);
      return;
    }

    try {
      // DELETE employeeSalary/deleteEmployeeSalary/{employeeSalaryId}
      const res = await deleteEmployeeSalary(row.employeeSalaryId);
      if (res.success) {
        message.success(res.message);
        remove(index);
      } else {
        message.error(res.message || "Failed to delete salary");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete salary");
    }
  };

  // ---------- TABLE COLUMNS (Action: View + Edit only, same icons as Student Fees) ----------
  const columns = [
    {
      title: "Employee Code",
      dataIndex: "employeeCode",
      key: "employeeCode",
      render: (v: string) => v || "-",
    },
    {
      title: "Name",
      key: "name",
      render: (_: any, r: EmployeeRow) => fullName(r) || "-",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (v: string) => (v ? v.charAt(0) + v.slice(1).toLowerCase() : "-"),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (v: string) => v || "-",
    },
    {
      title: "Mobile No",
      dataIndex: "mobileNo",
      key: "mobileNo",
      render: (v: string) => v || "-",
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      render: (v: string) => v || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) => (v ? <Tag color={v === "ACTIVE" ? "green" : "red"}>{v}</Tag> : "-"),
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      width: 100,
      render: (_: any, record: EmployeeRow) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button icon={<EyeOutlined />} size="small" onClick={() => openViewModal(record)} />
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditDrawer(record)}
          />
        </div>
      ),
    },
  ];

  const moneyInput = <InputNumber style={{ width: "100%" }} min={0} precision={2} placeholder="0.00" />;

  return (
    <div>
      {/* Search Bar */}
      <Row gutter={[12, 12]} style={{ padding: "16px 0" }}>
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="First Name"
            value={searchFilters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Last Name"
            value={searchFilters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Role"
            value={searchFilters.role || undefined}
            onChange={(value) => handleFilterChange("role", value || "")}
            onDropdownVisibleChange={handleRoleDropdownOpen}
            loading={roleLoading}
            style={{ width: "100%" }}
            allowClear
            options={roleOptions}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              Search
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </Col>
      </Row>

      {!tableLoading && users.length === 0 ? (
        <Empty description="No employees found" style={{ padding: "40px 0" }} />
      ) : (
        <CommonTable
          data={users}
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

      {/* ---------- Edit Drawer ---------- */}
      <Drawer
        title={`Employee Salary${activeEmployee?.name ? ` — ${activeEmployee.name}` : ""}`}
        open={drawerOpen}
        onClose={closeDrawer}
        width={750}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.List name="salaries">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }, index) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    title={`Salary ${index + 1}`}
                    extra={
                      <Space>
                        <Tooltip title="Update">
                          <Button
                            type="text"
                            loading={savingIndex === name}
                            icon={<SaveOutlined style={{ color: "#1677ff" }} />}
                            onClick={() => handleSaveCard(name)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Delete this salary record?"
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => handleDeleteCard(name, remove)}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    }
                  >
                    <Form.Item name={[name, "employeeSalaryId"]} hidden>
                      <Input />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Academic Year" name={[name, "academicYear"]}>
                          <Input disabled />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="Salary Date"
                          name={[name, "salaryDate"]}
                          rules={[{ required: true, message: "Salary date is required" }]}
                        >
                          <DatePicker
                            style={{ width: "100%" }}
                            format="DD-MM-YYYY"
                            onChange={(d) => {
                              // keep academic year in sync for entries that are not saved yet
                              const saved = form.getFieldValue(["salaries", name, "employeeSalaryId"]);
                              if (!saved && d) {
                                form.setFieldValue(["salaries", name, "academicYear"], getAcademicYear(d));
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label="Basic Salary"
                          name={[name, "basicSalary"]}
                          rules={[{ required: true, message: "Basic salary is required" }]}
                        >
                          {moneyInput}
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="HRA" name={[name, "hra"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item label="Transport Allowance" name={[name, "transportAllowance"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Medical Allowance" name={[name, "medicalAllowance"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item label="Other Allowance" name={[name, "otherAllowance"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Deduction" name={[name, "deduction"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item label="Net Salary (auto)" shouldUpdate>
                          {() => (
                            <Input
                              disabled
                              value={calcNet(form.getFieldValue(["salaries", name])).toFixed(2)}
                            />
                          )}
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item label="Remark" name={[name, "remark"]}>
                          <Input.TextArea rows={2} placeholder="e.g. September 2026 salary" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}

                {/* New salary entry */}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add(newRow())}
                  style={{ marginBottom: 24 }}
                >
                  Add New Salary
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const rows: any[] = form.getFieldValue("salaries") || [];
              const hasNew = rows.some((r) => !r?.employeeSalaryId);
              return (
                <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button onClick={closeDrawer}>Cancel</Button>
                  <Button type="primary" loading={submitting} onClick={handleSaveAll}>
                    {hasNew ? "Save" : "Update"}
                  </Button>
                </Space>
              );
            }}
          </Form.Item>
        </Form>
      </Drawer>

      {/* ---------- View Modal ---------- */}
      <Modal
        title={`Employee Salary Details${viewEmployee?.name ? ` — ${viewEmployee.name}` : ""}`}
        open={viewOpen}
        onCancel={closeViewModal}
        footer={null}
        width={850}
        destroyOnClose
      >
        {viewSalaries.length === 0 ? (
          <Empty description="No salary records found" />
        ) : (
          viewSalaries.map((s, i) => (
            <Descriptions
              key={s.employeeSalaryId ?? i}
              bordered
              column={2}
              size="middle"
              style={{ marginBottom: 20 }}
              title={`Salary ${i + 1}`}
              extra={
                <Popconfirm
                  title="Delete this salary record?"
                  okText="Yes"
                  cancelText="No"
                  onConfirm={() => handleDeleteFromView(s)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              }
            >
              <Descriptions.Item label="Academic Year">{s.academicYear}</Descriptions.Item>
              <Descriptions.Item label="Salary Date">
                {s.salaryDate ? dayjs(s.salaryDate).format("DD-MM-YYYY") : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Basic Salary">₹ {money(s.basicSalary)}</Descriptions.Item>
              <Descriptions.Item label="HRA">₹ {money(s.hra)}</Descriptions.Item>
              <Descriptions.Item label="Transport Allowance">₹ {money(s.transportAllowance)}</Descriptions.Item>
              <Descriptions.Item label="Medical Allowance">₹ {money(s.medicalAllowance)}</Descriptions.Item>
              <Descriptions.Item label="Other Allowance">₹ {money(s.otherAllowance)}</Descriptions.Item>
              <Descriptions.Item label="Deduction">₹ {money(s.deduction)}</Descriptions.Item>
              <Descriptions.Item label="Net Salary" span={2}>
                <b>₹ {money(s.netSalary)}</b>
              </Descriptions.Item>
              <Descriptions.Item label="Remark" span={2}>
                {s.remark || "-"}
              </Descriptions.Item>
            </Descriptions>
          ))
        )}
      </Modal>
    </div>
  );
}
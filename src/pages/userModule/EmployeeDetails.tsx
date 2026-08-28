import { useState, useEffect, useCallback } from "react";
import { Drawer, Form, message, Modal, Popconfirm, Button, Input, Select, Space, Row, Col, } from "antd";
import { SearchOutlined, ReloadOutlined, PlusOutlined, CopyOutlined } from "@ant-design/icons";
import {
  getAllEmployeeDetailsByFilter,
  saveEmployeeDetails,
  updateEmployeeDetails,
  getEmployeeDetailsById,
  deleteEmployeeDetails,
  type UserDTO,
  type UserSearchFilters,
} from "../../services/userService";
import UserUpdateProfileTable from "./EmployeeDetailsTable";
import User from "./Employee";
import dayjs from "dayjs";
import { getAllStaticData, type StaticDataResponse } from "../../services/staticDataService";
import EmployeeViewer from "./EmployeeViewer";

export default function UpdateUserProfile() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [staticData, setStaticData] = useState<StaticDataResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Credentials popup state (shown after a successful save/update
  // when the backend returns generated login details)
  const [credsModalOpen, setCredsModalOpen] = useState(false);
  const [credsData, setCredsData] = useState<{ userName: string; password: string } | null>(null);

  // Search bar state
  const [searchFilters, setSearchFilters] = useState<UserSearchFilters>({
    firstName: "",
    lastName: "",
    role: "",
  });

  // Role dropdown state (fetched from static data on first click, not on mount)
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [rolesFetched, setRolesFetched] = useState(false);

  // Strips any existing "data:...;base64," prefix so we always work with raw base64,
  // whether it came from old (prefixed) or new (raw) saved records.
  const toRawBase64 = (value: string | null | undefined): string | null => {
    if (!value) return null;
    return value.includes(",") ? value.split(",")[1] : value;
  };

  // Detects the real mime type by inspecting the base64-decoded file signature,
  // since documentType (user-entered/selected) can't be trusted.
  const detectMimeFromBase64 = (rawBase64: string): string => {
    const signature = rawBase64.substring(0, 12); // first ~9 raw bytes as base64 chars

    if (signature.startsWith("JVBERi0")) return "application/pdf";        // %PDF-
    if (signature.startsWith("iVBORw0KGgo")) return "image/png";          // PNG
    if (signature.startsWith("/9j/")) return "image/jpeg";                // JPEG
    if (signature.startsWith("R0lGOD")) return "image/gif";               // GIF
    if (signature.startsWith("UEsDB")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; // .docx (zip-based)
    if (signature.startsWith("0M8R4K")) return "application/msword";      // legacy .doc

    return "application/octet-stream"; // fallback, browser will offer download
  };

  const openAddDrawer = () => {
    setEditingUser(null);
    form.resetFields();
    // New employees default to ACTIVE — matches the Status field's own
    // initialValue, set explicitly here too since resetFields() runs first.
    form.setFieldsValue({ status: "ACTIVE" });
    setDrawerOpen(true);
  };
  // Fetches static data (role list, etc.) only on the first time the Role dropdown is opened
  const handleRoleDropdownOpen = async (open: boolean) => {
    if (!open || rolesFetched) return;

    setRoleLoading(true);
    try {
      const response = await getAllStaticData();
      if (response.success) {
        setStaticData(response.data);

        const roles = response.data.role || [];

        setRoleOptions(
          roles.map((r: string) => ({
            label: r.charAt(0) + r.slice(1).toLowerCase(),
            value: r,
          }))
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
    // searchFilters intentionally left out of deps — search only fires on button click, not per keystroke
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

  const openViewDrawer = async (record: UserDTO) => {
    try {
      const response = await getEmployeeDetailsById(record.userId);
      console.log("View API Response:", response);
      if (response.success) {
        setViewUser(response.data);
        setViewDrawerOpen(true);
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
        "Failed to load employee details"
      );
    }
  };

  const openEditDrawer = async (record: UserDTO) => {
    console.log("Clicked Record:", record);
    console.log("Clicked User ID:", record.userId);

    try {
      const response = await getEmployeeDetailsById(record.userId);

      console.log("API Response:", response);
      if (response.success) {
        const user = response.data;

        setEditingUser(user);

        form.setFieldsValue({
          employeeDetailsId: user.employeeDetailsId,
          userId: record.userId,
          employeeCode: user.employeeCode,
          userName:user.userName,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          gender: user.gender,
          role:user.role,
          email:user.email,
          mobileNo:user.mobileNo,
          qualification: user.qualification,
          specialization: user.specialization,
          experience: user.experience,
          designation: user.designation,
          bloodGroup: user.bloodGroup,
          address: user.address,
          dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
          joiningDate: user.joiningDate ? dayjs(user.joiningDate) : null,
          leavingDate: user.leavingDate ? dayjs(user.leavingDate) : null,
          status: user.status || "ACTIVE", // 👈 NEW — pulled straight from the API response

          documents:
            user.userDocumentDTOS?.map((doc: any) => {
              const rawBase64 = toRawBase64(doc.document);
              const mime = rawBase64 ? detectMimeFromBase64(rawBase64) : "application/octet-stream";
              const dataUrl = rawBase64 ? `data:${mime};base64,${rawBase64}` : null;

              return {
                ...doc,
                document: dataUrl,
                uploadDate: doc.uploadDate ? dayjs(doc.uploadDate) : null,
                fileList: dataUrl
                  ? [
                    {
                      uid: "-1",
                      name: doc.documentName,
                      status: "done",
                      url: dataUrl,
                    },
                  ]
                  : [],
              };
            }) || [],
        });

        setEditingUser(user);
      } else {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({
          employeeDetailsId: null,
          userId: record.userId,
          firstName: record.firstName,
          lastName: record.lastName,
          status: "ACTIVE", // 👈 NEW — default for a record with no employee details yet
        });
      }

      setDrawerOpen(true);
    } catch (error) {
      message.error("Failed to load employee details");
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setEditingUser(null);
  };

  const closeCredsModal = () => {
    setCredsModalOpen(false);
    setCredsData(null);
  };

  const handleCopy = async (value: string | undefined, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      message.success(`${label} copied to clipboard`);
    } catch (err) {
      message.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const handleDelete = async () => {
    if (!editingUser?.employeeDetailsId) {
      message.warning("No employee information found.");
      return;
    }

    try {
      const response = await deleteEmployeeDetails(
        editingUser.employeeDetailsId
      );

      if (response.success) {
        message.success(response.message);
        closeDrawer();
        fetchUsers(page, pageSize, searchFilters);
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
        "Failed to delete employee information"
      );
    }
  };

  // Delete triggered directly from the table's action column.
  // Works for any role: prefers employeeDetailsId already on the row,
  // falls back to fetching via userId only if userId is actually present
  // (some rows may have a null userId, per the employee details payload shape).
  const handleDeleteFromTable = async (record: UserDTO) => {
    try {
      let employeeDetailsId = (record as any).employeeDetailsId;

      if (!employeeDetailsId && record.userId) {
        const detailsResponse = await getEmployeeDetailsById(record.userId);

        if (detailsResponse.success && detailsResponse.data?.employeeDetailsId) {
          employeeDetailsId = detailsResponse.data.employeeDetailsId;
        }
      }

      if (!employeeDetailsId) {
        console.error("Could not resolve employeeDetailsId for record:", record);
        message.error(
          "Unable to delete this employee — missing employee reference. Check console for details."
        );
        return;
      }

      const deleteResponse = await deleteEmployeeDetails(employeeDetailsId);

      if (deleteResponse.success) {
        message.success(deleteResponse.message);
        fetchUsers(page, pageSize, searchFilters);
      } else {
        message.error(deleteResponse.message || "Failed to delete employee");
      }
    } catch (error: any) {
      console.error("Delete failed for record:", record, error);
      message.error(
        error?.response?.data?.message ||
        "Failed to delete employee information"
      );
    }
  };

  const handleFormSubmit = async (values: any) => {
    setSubmitting(true);

    try {
      const payload = {
        employeeDetailsId: values.employeeDetailsId,
        userId: values.userId,
        employeeCode: values.employeeCode,
        userName:values.userName,
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        gender: values.gender,
        role:values.role,
        email:values.email,
        mobileNo:values.mobileNo,
        qualification: values.qualification,
        specialization: values.specialization,
        experience: values.experience,
        designation: values.designation,
        bloodGroup: values.bloodGroup,
        address: values.address,
        dateOfBirth: values.dateOfBirth.format("YYYY-MM-DD"),
        joiningDate: values.joiningDate.format("YYYY-MM-DD"),
        leavingDate: values.leavingDate ? values.leavingDate.format("YYYY-MM-DD") : null,
        status: values.status, // 👈 NEW
        userDocumentDTOS: (values.documents || [])
          .filter((doc: any) => doc.documentName || doc.document)
          .map((doc: any) => ({
            userDocumentId: doc.userDocumentId,
            employeeDetailsId: doc.employeeDetailsId,
            documentName: doc.documentName,
            documentType: doc.documentType,
            uploadDate: doc.uploadDate
              ? dayjs(doc.uploadDate).format("YYYY-MM-DD")
              : null,
            document: toRawBase64(doc.document),
          })),
      };

      let response;

      if (payload.employeeDetailsId) {
        response = await updateEmployeeDetails(payload);
      } else {
        response = await saveEmployeeDetails(payload);
      }

      if (response.success) {
        message.success(response.message);
        closeDrawer();
        fetchUsers(page, pageSize, searchFilters);

        // If the backend returned generated login credentials (userName + password),
        // show them in a small popup so they can be shared with the employee.
        const userDetails = response.data?.["user details"];
        if (userDetails?.userName && userDetails?.password) {
          setCredsData({
            userName: userDetails.userName,
            password: userDetails.password,
          });
          setCredsModalOpen(true);
        }
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
        "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Add Employee
        </Button>
      </div>
      {/* Employee Details Navbar goes here (your existing header/navbar component) */}

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

      <UserUpdateProfileTable
        data={users}
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
        onView={openViewDrawer}
        onEdit={openEditDrawer}
        onDelete={handleDeleteFromTable}
      />

      <Drawer
        title="Employee Details"
        open={drawerOpen}
        onClose={closeDrawer}
        width={700}
        destroyOnClose
      >
        <User
          form={form}
          onFinish={handleFormSubmit}
          isEditing={!!editingUser}
          loading={submitting}
          onDelete={handleDelete}
        />
      </Drawer>
      <Modal
        title="Employee Details"
        open={viewDrawerOpen}
        onCancel={() => {
          setViewDrawerOpen(false);
          setViewUser(null);
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        <EmployeeViewer user={viewUser} />
      </Modal>

      {/* Login Credentials popup — shown after a successful save/update
          when the backend returns a generated userName + password */}
      <Modal
        title="Login Credentials"
        open={credsModalOpen}
        onCancel={closeCredsModal}
        footer={[
          <Button key="ok" type="primary" onClick={closeCredsModal}>
            OK
          </Button>,
        ]}
        width={400}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="User Name">
            <Input
              value={credsData?.userName}
              disabled
              styles={{ input: { color: "#000", WebkitTextFillColor: "#000" } }}
              suffix={
                <CopyOutlined
                  style={{ color: "#1677ff", cursor: "pointer" }}
                  onClick={() => handleCopy(credsData?.userName, "User Name")}
                />
              }
            />
          </Form.Item>
          <Form.Item label="Password">
            <Input
              value={credsData?.password}
              disabled
              styles={{ input: { color: "#000", WebkitTextFillColor: "#000" } }}
              suffix={
                <CopyOutlined
                  style={{ color: "#1677ff", cursor: "pointer" }}
                  onClick={() => handleCopy(credsData?.password, "Password")}
                />
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
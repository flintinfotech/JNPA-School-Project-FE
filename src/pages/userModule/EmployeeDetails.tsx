import { useState, useEffect, useCallback } from "react";
import { Drawer, Form, message, Modal, Popconfirm, Button, Input, Select, Space } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  getAllUsers,
  saveUserInformation,
  updateUserInformation,
  getUserInformationById,
  deleteUserInformation,
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
        const response = await getAllUsers(pageNum, size, filters);
        if (response.success) {
          setUsers(response.data.Data);
          setTotal(response.data.total);
        } else {
          message.error(response.message || "Failed to load users");
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Failed to load users");
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
      const response = await getUserInformationById(record.userId);
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
      const response = await getUserInformationById(record.userId);

      console.log("API Response:", response);
      if (response.success) {
        const user = response.data;

        setEditingUser(user);

        form.setFieldsValue({
          userInformationId: user.userInformationId,
          userId: record.userId,
          employeeCode: user.employeeCode,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          gender: user.gender,
          qualification: user.qualification,
          specialization: user.specialization,
          experience: user.experience,
          designation: user.designation,
          bloodGroup: user.bloodGroup,
          address: user.address,
          dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
          joiningDate: user.joiningDate ? dayjs(user.joiningDate) : null,

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
          userInformationId: null,
          userId: record.userId,
          firstName: record.firstName,
          lastName: record.lastName,
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

  const handleDelete = async () => {
    if (!editingUser?.userInformationId) {
      message.warning("No employee information found.");
      return;
    }

    try {
      const response = await deleteUserInformation(
        editingUser.userInformationId
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

  const handleFormSubmit = async (values: any) => {
    setSubmitting(true);

    try {
      const payload = {
        userInformationId: values.userInformationId,
        userId: values.userId,
        employeeCode: values.employeeCode,
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        gender: values.gender,
        qualification: values.qualification,
        specialization: values.specialization,
        experience: values.experience,
        designation: values.designation,
        bloodGroup: values.bloodGroup,
        address: values.address,
        dateOfBirth: values.dateOfBirth.format("YYYY-MM-DD"),
        joiningDate: values.joiningDate.format("YYYY-MM-DD"),
        userDocumentDTOS: (values.documents || [])
          .filter((doc: any) => doc.documentName || doc.document)
          .map((doc: any) => ({
            userDocumentId: doc.userDocumentId,
            userInformationId: doc.userInformationId,
            documentName: doc.documentName,
            documentType: doc.documentType,
            uploadDate: doc.uploadDate
              ? dayjs(doc.uploadDate).format("YYYY-MM-DD")
              : null,
            document: toRawBase64(doc.document),
          })),
      };

      let response;

      if (payload.userInformationId) {
        response = await updateUserInformation(payload);
      } else {
        response = await saveUserInformation(payload);
      }

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
        "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Employee Details Navbar goes here (your existing header/navbar component) */}

      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "16px 0",
        }}
      >
        <Input
          placeholder="First Name"
          value={searchFilters.firstName}
          onChange={(e) => handleFilterChange("firstName", e.target.value)}
          style={{ width: 180 }}
          allowClear
        />
        <Input
          placeholder="Last Name"
          value={searchFilters.lastName}
          onChange={(e) => handleFilterChange("lastName", e.target.value)}
          style={{ width: 180 }}
          allowClear
        />
        <Select
          placeholder="Role"
          value={searchFilters.role || undefined}
          onChange={(value) => handleFilterChange("role", value || "")}
          onDropdownVisibleChange={handleRoleDropdownOpen}
          loading={roleLoading}
          style={{ width: 180 }}
          allowClear
          options={roleOptions}
        />
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Search
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
            Reset
          </Button>
        </Space>
      </div>

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
    </div>
  );
}

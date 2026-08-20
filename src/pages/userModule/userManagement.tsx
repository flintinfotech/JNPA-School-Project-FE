import { useState, useEffect, useCallback } from "react";
import { Button, Drawer, Form, message, Input, Row, Col } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { getUserById, saveUser, updateUser, type UserDTO } from "../../services/userService";
import UserTable from "./userTable";
import UserForm from "./userForm";
import { getAllStaticData, type StaticDataResponse } from "../../services/staticDataService";
import axiosInstance from "../../lib/axios"; // adjust to whatever you use for calls

type UserFilter = "employee" | "student";

const EMPLOYEE_ROLES = ["Teacher", "Accountant", "Admin", "Principal"];
const STUDENT_ROLES = ["Student"];

interface UserSearchFilters {
  firstName?: string;
  lastName?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // Defaults straight to Employee view — no "all" state, no unfiltered fetch on mount
  const [activeFilter, setActiveFilter] = useState<UserFilter>("employee");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [staticData, setStaticData] = useState<StaticDataResponse | null>(null);

  // Search bar state
  const [searchFilters, setSearchFilters] = useState<UserSearchFilters>({
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const response = await getAllStaticData();

        if (response.success) {
          setStaticData(response.data);
        }
      } catch (err) {
        message.error("Failed to load static data");
      }
    };

    loadStaticData();
  }, []);

  const fetchUsersByFilter = useCallback(
    async (
      pageNum: number,
      size: number,
      roles: string[],
      filters?: UserSearchFilters
    ) => {
      setTableLoading(true);
      try {
        const response = await axiosInstance.post(
          `http://flintinfotech-dev.in:8443/jnpa-school-project/user/getAllUsersByFilter?page=${pageNum}&size=${size}&paginate=true`,
          {
            role: roles,
            firstName: filters?.firstName || undefined,
            lastName: filters?.lastName || undefined,
          }
        );
        if (response.data.success) {
          setUsers(response.data.data.Data);
          setTotal(response.data.data.total);
        } else {
          message.error(response.data.message || "Failed to load users");
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Failed to load users");
      } finally {
        setTableLoading(false);
      }
    },
    []
  );

  const rolesForFilter = (filter: UserFilter) =>
    filter === "employee" ? EMPLOYEE_ROLES : STUDENT_ROLES;

  useEffect(() => {
    fetchUsersByFilter(page, pageSize, rolesForFilter(activeFilter), searchFilters);
    // searchFilters intentionally left out of deps — search only fires on button click, not per keystroke
  }, [page, pageSize, activeFilter, fetchUsersByFilter]);

  const handleFilterClick = (filter: UserFilter) => {
    setPage(0);
    setActiveFilter(filter);
    // Switching between Employee/Student clears any active search
    setSearchFilters({ firstName: "", lastName: "" });
  };

  const handleFilterChange = (field: keyof UserSearchFilters, value: string) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(0);
    fetchUsersByFilter(0, pageSize, rolesForFilter(activeFilter), searchFilters);
  };

  const handleResetFilters = () => {
    const cleared: UserSearchFilters = { firstName: "", lastName: "" };
    setSearchFilters(cleared);
    setPage(0);
    fetchUsersByFilter(0, pageSize, rolesForFilter(activeFilter), cleared);
  };

  const openEditDrawer = async (record: UserDTO) => {
    try {
      setTableLoading(true);

      const response = await getUserById(record.userId);

      console.log("USER DETAILS", response);

      if (response.success) {
        const user = response.data;

        setEditingUser(user);

        form.setFieldsValue({
          userName: user.userName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobileNo: user.mobileNo,
          role: user.role,
          section: user.section,
          medium: user.medium,

          screenIds:
            user.screens?.map(
              (screen: any) => screen.screenId
            ) || [],
        });

        setDrawerOpen(true);
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
        "Failed to load user"
      );
    } finally {
      setTableLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setEditingUser(null);
  };

  const handleFormSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        const response = await updateUser({ ...values, userId: editingUser.userId });
        if (response.success) {
          message.success(response.message || "User updated successfully");
          closeDrawer();
          fetchUsersByFilter(page, pageSize, rolesForFilter(activeFilter), searchFilters);
        } else {
          message.error(response.message || "Failed to update user");
        }
      } else {
        const response = await saveUser(values);
        if (response.success) {
          message.success(response.message || "User saved successfully");
          closeDrawer();
          fetchUsersByFilter(page, pageSize, rolesForFilter(activeFilter), searchFilters);
        } else {
          message.error(response.message || "Failed to save user");
        }
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button
          type={activeFilter === "employee" ? "primary" : "default"}
          onClick={() => handleFilterClick("employee")}
        >
          Employee
        </Button>
        <Button
          type={activeFilter === "student" ? "primary" : "default"}
          onClick={() => handleFilterClick("student")}
        >
          Students
        </Button>
      </div>

      {/* Search Bar */}
      <Row gutter={[12, 12]} style={{ padding: "0 0 16px" }}>
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
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              Search
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </Col>
      </Row>

      <UserTable
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
        onEdit={openEditDrawer}
        filterType={activeFilter}
      />

      <Drawer
        title={editingUser ? "Edit User" : "Add New User"}
        open={drawerOpen}
        onClose={closeDrawer}
        width={400}
        destroyOnClose
      >
        <UserForm
          form={form}
          onFinish={handleFormSubmit}
          isEditing={!!editingUser}
          loading={submitting}
          staticData={staticData}
        />
      </Drawer>
    </div>
  );
}
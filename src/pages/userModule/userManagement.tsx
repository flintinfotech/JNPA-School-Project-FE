import { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Drawer, Form, message, Input, Row, Col, Modal } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { getUserById, saveUser, updateUser, type UserDTO } from "../../services/userService";
import UserTable from "./userTable";
import UserForm from "./userForm";
import UserViewer from "./UserViewer";
import { getAllStaticData, type StaticDataResponse } from "../../services/staticDataService";
import axiosInstance from "../../lib/axios"; // adjust to whatever you use for calls
import { useAuth } from "../../hooks/useAuth";

type UserFilter = "employee" | "student";

const EMPLOYEE_ROLES = ["Teacher", "Accountant", "Admin", "Principal"];
const STUDENT_ROLES = ["Student"];

// Employees: the API is always called with size=10, page after page, and all pages are merged here;
// the table then shows exactly 10 per page (browser paging).
// Reason: the backend sometimes returns fewer than 10 rows for a page (e.g. 9) while "total"
// still counts the missing row (26), so a server page showed 9 users and the total was wrong.
const EMPLOYEE_PAGE_SIZE = 10;

// keep one row per userId
const dedupeByUserId = (list: UserDTO[]): UserDTO[] => {
  const map = new Map<number, UserDTO>();
  list.forEach((u) => {
    if (!map.has(u.userId)) map.set(u.userId, u);
  });
  return Array.from(map.values());
};

interface UserSearchFilters {
  firstName?: string;
  lastName?: string;
}

export default function UserManagement() {
  // logged-in user's section + medium go in the payload of BOTH the Employee and the Student list
  // (admin has none -> nothing is sent -> sees everyone)
  const { user: loggedInUser } = useAuth();
  const mySection = loggedInUser?.section || undefined;
  const myMedium = loggedInUser?.medium || undefined;

  const [users, setUsers] = useState<UserDTO[]>([]); // students (server page)
  const [allEmployees, setAllEmployees] = useState<UserDTO[]>([]); // employees (all, unique)
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

  // Popup view (read-only) state — used for the Students "view" action
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserDTO | null>(null);

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
      const isEmployee = roles.includes("Teacher");
      const buildUrl = (p: number, sz: number) =>
        `http://flintinfotech-dev.in:8443/jnpa-school-project/user/getAllUsersByFilter?page=${p}&size=${sz}&paginate=true`;
      const body = {
        role: roles,
        firstName: filters?.firstName || undefined,
        lastName: filters?.lastName || undefined,
        section: mySection,
        medium: myMedium,
      };
      try {
        if (isEmployee) {
          // call page 0, 1, 2 ... (size 10 each) until "total" is covered, then merge
          const all: UserDTO[] = [];
          let p = 0;
          let apiTotal = 0;
          do {
            const res = await axiosInstance.post(buildUrl(p, EMPLOYEE_PAGE_SIZE), body);
            if (!res.data.success) {
              message.error(res.data.message || "Failed to load users");
              return;
            }
            all.push(...((res.data.data.Data as UserDTO[]) || []));
            apiTotal = Number(res.data.data.total) || 0;
            p++;
          } while (p * EMPLOYEE_PAGE_SIZE < apiTotal && p < 100); // 100 = safety stop

          const unique = dedupeByUserId(all);
          setAllEmployees(unique);
          setTotal(unique.length); // real count of employees that were actually returned
          return;
        }

        // students: normal server-side pagination (size = pageSize = 10)
        const response = await axiosInstance.post(buildUrl(pageNum, size), body);
        if (response.data.success) {
          setUsers(response.data.data.Data || []);
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
    [mySection, myMedium]
  );

  const rolesForFilter = (filter: UserFilter) =>
    filter === "employee" ? EMPLOYEE_ROLES : STUDENT_ROLES;

  // Employees: fetched ONCE (all), paging is done in the browser -> no refetch on page change
  useEffect(() => {
    if (activeFilter === "employee") {
      fetchUsersByFilter(0, pageSize, EMPLOYEE_ROLES, searchFilters);
    }
    // searchFilters intentionally left out of deps — search only fires on button click, not per keystroke
  }, [activeFilter, fetchUsersByFilter]);

  // Students: normal server-side pagination
  useEffect(() => {
    if (activeFilter === "student") {
      fetchUsersByFilter(page, pageSize, STUDENT_ROLES, searchFilters);
    }
  }, [page, pageSize, activeFilter, fetchUsersByFilter]);

  // rows shown in the table: employees = 10 from the full list, students = the server page
  const displayedUsers = useMemo(
    () =>
      activeFilter === "employee"
        ? allEmployees.slice(page * pageSize, page * pageSize + pageSize)
        : users,
    [activeFilter, allEmployees, users, page, pageSize]
  );

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
          standard: user.standard,
          division: user.division,

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

  const openViewModal = async (record: UserDTO) => {
    try {
      setTableLoading(true);

      const response = await getUserById(record.userId);

      if (response.success) {
        setViewUser(response.data);
        setViewModalOpen(true);
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

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewUser(null);
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
        data={displayedUsers}
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
        onView={openViewModal}
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

      <Modal
        title="Student Details"
        open={viewModalOpen}
        onCancel={closeViewModal}
        footer={null}
        width={800}
        destroyOnClose
      >
        <UserViewer user={viewUser} />
      </Modal>
    </div>
  );
}
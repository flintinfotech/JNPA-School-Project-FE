import { useState, useEffect, useCallback } from "react";
import { Button, Drawer, Form, message, Input, Select, Space, Row, Col, Modal } from "antd";
import { PlusOutlined, SearchOutlined, ReloadOutlined, CopyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { deleteStudent, getAllStudents, getStudentById, saveStudent, updateStudent, type StudentDTO } from "../../services/studentService";
import StudentTable from "./StudentTable";
import { useAuth } from "../../hooks/useAuth";
import StudentForm from "./StudentFrom";
import { getAllStaticData, type StaticDataResponse } from "../../services/staticDataService";

const { Option } = Select;

interface StudentSearchFilters {
  firstName?: string;
  lastName?: string;
  gender?: string;
  category?: string;
  status?: string;
  standard?: string;
  division?: string;
  section?: string; // sirf superadmin
  medium?: string; // sirf superadmin
}

export default function StudentManagement() {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDTO | null>(null);

  // logged-in user's section + medium go in the getAllStudentsByFilter payload
  // (admin has none -> nothing is sent -> sees every student)
  const { user: loggedInUser } = useAuth();
  const mySection = loggedInUser?.section || undefined;
  const myMedium = loggedInUser?.medium || undefined;

  // 🔍 DEBUG: role check karne ke baad ye line hata dena
  console.log("LOGGED IN USER:", loggedInUser);

  // 👈 CHANGED: SUPERADMIN role ho, YA Admin role ho jisko apna section/medium set nahi hai
  // (aise admin ko sab data dikhta hai, wahi superadmin hai)
  const normalizedRole = String(loggedInUser?.role || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  const isSuperAdmin =
    normalizedRole === "SUPERADMIN" ||
    (normalizedRole === "ADMIN" && !mySection && !myMedium);

  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [staticData, setStaticData] = useState<StaticDataResponse | null>(null);

  // Credentials popup state — shown after a successful save
  // when the backend returns generated login details (userName + password)
  const [credsModalOpen, setCredsModalOpen] = useState(false);
  const [credsData, setCredsData] = useState<{ userName: string; password: string } | null>(null);

  // Search bar state
  const [searchFilters, setSearchFilters] = useState<StudentSearchFilters>({
    firstName: "",
    lastName: "",
    gender: "",
    category: "",
    status: "",
    standard: "",
    division: "",
    section: "",
    medium: "",
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

  const fetchStudents = useCallback(
    async (pageNum: number, size: number, filters?: StudentSearchFilters) => {
      setTableLoading(true);
      try {
        const response = await getAllStudents(pageNum, size, {
          firstName: filters?.firstName || undefined,
          lastName: filters?.lastName || undefined,
          gender: filters?.gender || undefined,
          category: filters?.category || undefined,
          status: filters?.status || undefined,
          standard: filters?.standard || undefined,
          division: filters?.division || undefined,
          // superadmin ke liye dropdown ki value, baaki sabke liye apna section/medium
          section: isSuperAdmin ? filters?.section || mySection : mySection,
          medium: isSuperAdmin ? filters?.medium || myMedium : myMedium,
        });
        if (response.success) {
          setStudents(response.data.Data);
          setTotal(response.data.Total);
        } else {
          message.error(response.message || "Failed to load students");
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Failed to load students");
      } finally {
        setTableLoading(false);
      }
    },
    [mySection, myMedium, isSuperAdmin]
  );

  useEffect(() => {
    fetchStudents(page, pageSize, searchFilters);
    // searchFilters intentionally left out of deps — search only fires on button click, not per keystroke
  }, [page, pageSize, fetchStudents]);

  const handleFilterChange = (field: keyof StudentSearchFilters, value: string) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(0);
    fetchStudents(0, pageSize, searchFilters);
  };

  const handleResetFilters = () => {
    const cleared: StudentSearchFilters = {
      firstName: "",
      lastName: "",
      gender: "",
      category: "",
      status: "",
      standard: "",
      division: "",
      section: "",
      medium: "",
    };
    setSearchFilters(cleared);
    setPage(0);
    fetchStudents(0, pageSize, cleared);
  };

  const openAddDrawer = () => {
    setEditingStudent(null);
    form.resetFields();
    form.setFieldsValue({
      parentDTO: { relation: "Father" },
      studentDocuments: [{ documentName: "" }],
      academicInformation: [{}],
    });
    setDrawerOpen(true);
  };

  const openEditDrawer = async (record: StudentDTO) => {
    try {
      const response = await getStudentById(record.studentId as number);
      if (!response.success) {
        message.error(response.message || "Failed to load student");
        return;
      }
      const s: StudentDTO = response.data;
      setEditingStudent(s);
      form.setFieldsValue({
        ...s, // studentCode (and every other field) comes along automatically
        dob: s.DOB ? dayjs(s.DOB) : null,
        parentDTO: s.parentDTO || {},
        studentDocuments: (s.studentDocuments || []).map((d) => ({
          ...d,
          uploadDate: d.uploadDate ? dayjs(d.uploadDate) : null,
        })),
        academicInformation: (s.academicInformation || []).map((a) => ({
          ...a,
          admissionDate: a.admissionDate ? dayjs(a.admissionDate) : null,
        })),
      });
      setDrawerOpen(true);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load student");
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setEditingStudent(null);
  };

  const closeCredsModal = () => {
    setCredsModalOpen(false);
    setCredsData(null);
  };

 
const handleCopy = async (value: string | undefined, label: string) => {
  if (!value) {
    message.warning(`${label} is not available`);
    return;
  }

  try {
    // First try the modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      // Fallback for HTTP / non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (!copied) {
        throw new Error("Copy command failed");
      }
    }

    message.success(`${label} copied to clipboard`);
  } catch (error) {
    console.error("Clipboard copy failed:", error);
    message.error(
      `Could not copy ${label}. Please select and copy it manually.`
    );
  }
};


  const handleFormSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingStudent) {
        // BUG FIX: the Student edit form has no Form.Item for fee data
        // (studentFeeDTOS etc.) — or for studentResultDTOS/studentAchievementsDTOS —
        // so `values` from validateFields() never contains them. Sending
        // `values` alone to the update API dropped those fields from the
        // payload entirely, and the backend treated "missing" as "clear it",
        // wiping Total Fee / Pending Fee / Status on the Student Fees screen
        // any time a student's name (or any other basic field) was updated.
        // Fix: start from the full record we already fetched
        // (`editingStudent`, which still has the fee/result/achievement
        // arrays), then layer the actually-edited form `values` on top.
        const response = await updateStudent({
          ...editingStudent,
          ...values,
          studentId: editingStudent.studentId,
        });
        if (response.success) {
          message.success(response.message || "Student updated successfully");
          closeDrawer();
          fetchStudents(page, pageSize, searchFilters);
        } else {
          message.error(response.message || "Failed to update student");
        }
      } else {
        const response = await saveStudent(values);
        if (response.success) {
          message.success(response.message || "Student saved successfully");
          closeDrawer();
          fetchStudents(page, pageSize, searchFilters);

          // If the backend returned generated login credentials
          // (userName + password), show them in a small popup.
          const userDto = response.data?.["User DTO"];
          if (userDto?.userName && userDto?.password) {
            setCredsData({
              userName: userDto.userName,
              password: userDto.password,
            });
            setCredsModalOpen(true);
          }
        } else {
          message.error(response.message || "Failed to save student");
        }
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (studentId: number) => {
    try {
      const response = await deleteStudent(studentId);
      if (response.success) {
        message.success(response.message || "Student deleted successfully");
        if (students.length === 1 && page > 0) {
          setPage(page - 1);
        } else {
          fetchStudents(page, pageSize, searchFilters);
        }
      } else {
        message.error(response.message || "Failed to delete student");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete student");
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Add Student
        </Button>
      </div>

      {/* Search Bar */}
      <Row gutter={[12, 12]} style={{ padding: "16px 0 0" }}>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Input
            placeholder="First Name"
            value={searchFilters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <Input
            placeholder="Last Name"
            value={searchFilters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <Select
            placeholder="Gender"
            value={searchFilters.gender || undefined}
            onChange={(value) => handleFilterChange("gender", value || "")}
            style={{ width: "100%" }}
            allowClear
          >
            <Option value="Male">Male</Option>
            <Option value="Female">Female</Option>
          </Select>
        </Col>

        {/* <Col xs={24} sm={12} md={6} lg={4}>
    <Input
      placeholder="Category"
      value={searchFilters.category}
      onChange={(e) => handleFilterChange("category", e.target.value)}
      style={{ width: "100%" }}
      allowClear
    />
  </Col> */}

        <Col xs={24} sm={12} md={6} lg={4}>
          <Select
            placeholder="Status"
            value={searchFilters.status || undefined}
            onChange={(value) => handleFilterChange("status", value || "")}
            style={{ width: "100%" }}
            allowClear
          >
            {staticData?.["student status"]?.map((status) => (
              <Option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={24} md={24} lg={8}>
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

      {/* Standard + Division filters (staticData se) + Section + Medium (sirf superadmin) */}
      <Row gutter={[12, 12]} style={{ padding: "12px 0 16px" }}>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Select
            placeholder="Standard"
            value={searchFilters.standard || undefined}
            onChange={(value) => handleFilterChange("standard", value || "")}
            style={{ width: "100%" }}
            allowClear
          >
            {staticData?.standard?.map((std) => (
              <Option key={std} value={std}>
                {std}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <Select
            placeholder="Division"
            value={searchFilters.division || undefined}
            onChange={(value) => handleFilterChange("division", value || "")}
            style={{ width: "100%" }}
            allowClear
          >
            {staticData?.division?.map((div) => (
              <Option key={div} value={div}>
                {div}
              </Option>
            ))}
          </Select>
        </Col>

        {/* sirf SUPERADMIN ko dikhenge */}
        {isSuperAdmin && (
          <>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="Section"
                value={searchFilters.section || undefined}
                onChange={(value) => handleFilterChange("section", value || "")}
                style={{ width: "100%" }}
                allowClear
              >
                {staticData?.["class name"]?.map((sec) => (
                  <Option key={sec} value={sec}>
                    {sec}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="Medium"
                value={searchFilters.medium || undefined}
                onChange={(value) => handleFilterChange("medium", value || "")}
                style={{ width: "100%" }}
                allowClear
              >
                {staticData?.medium?.map((med) => (
                  <Option key={med} value={med}>
                    {med}
                  </Option>
                ))}
              </Select>
            </Col>
          </>
        )}
      </Row>

      <StudentTable
        data={students}
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
        onDelete={handleDelete}
      />

      <Drawer
        title={editingStudent ? "Edit Student" : "Add New Student"}
        open={drawerOpen}
        onClose={closeDrawer}
        width={720}
        destroyOnClose
      >
        <StudentForm
          form={form}
          onFinish={handleFormSubmit}
          isEditing={!!editingStudent}
          loading={submitting}
          staticData={staticData}
        />
      </Drawer>

      {/* Login Credentials popup — shown after a successful save
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
        value={credsData?.userName ?? ""}
        readOnly
        suffix={
          <Button
            type="text"
            icon={<CopyOutlined />}
            title="Copy username"
            onClick={() =>
              handleCopy(credsData?.userName, "User Name")
            }
          />
        }
      />
    </Form.Item>

    <Form.Item label="Password">
      <Input
        value={credsData?.password ?? ""}
        readOnly
        suffix={
          <Button
            type="text"
            icon={<CopyOutlined />}
            title="Copy password"
            onClick={() =>
              handleCopy(credsData?.password, "Password")
            }
          />
        }
      />
    </Form.Item>
  </Form>
</Modal>

    </div>
  );
}
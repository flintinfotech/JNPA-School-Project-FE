import { useState, useEffect, useCallback } from "react";
import { Button, Drawer, Form, message, Input, Select, Space, Row, Col } from "antd";
import { PlusOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { deleteStudent, getAllStudents, getStudentById, saveStudent, updateStudent, type StudentDTO } from "../../services/studentService";
import StudentTable from "./StudentTable";
import StudentForm from "./StudentFrom";
import { getAllStaticData, type StaticDataResponse } from "../../services/staticDataService";

const { Option } = Select;

interface StudentSearchFilters {
  firstName?: string;
  lastName?: string;
  gender?: string;
  category?: string;
  status?: string;
}

export default function StudentManagement() {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [staticData, setStaticData] = useState<StaticDataResponse | null>(null);

  // Search bar state
  const [searchFilters, setSearchFilters] = useState<StudentSearchFilters>({
    firstName: "",
    lastName: "",
    gender: "",
    category: "",
    status: "",
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
    []
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
        ...s,
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

  const handleFormSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingStudent) {
        const response = await updateStudent({
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
      <Row gutter={[12, 12]} style={{ padding: "16px 0" }}>
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
    </div>
  );
}
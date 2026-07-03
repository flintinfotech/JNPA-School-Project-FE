import { useState, useEffect, useCallback } from "react";
import { Button, Drawer, Form, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { deleteStudent, getAllStudents, getStudentById, saveStudent, updateStudent, type StudentDTO } from "../../services/studentService";
import StudentTable from "./StudentTable";
import StudentForm from "./StudentFrom";

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

  const fetchStudents = useCallback(async (pageNum: number, size: number) => {
    setTableLoading(true);
    try {
      const response = await getAllStudents(pageNum, size, {});
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
  }, []);

  useEffect(() => {
    fetchStudents(page, pageSize);
  }, [page, pageSize, fetchStudents]);

  const openAddDrawer = () => {
    setEditingStudent(null);
    form.resetFields();
    form.setFieldsValue({
      parentEntities: [{ relation: "Father" }, { relation: "Mother" }],
      studentDocuments: [],
      academicInformation: [{}],
      status: "ACTIVE",
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
        dob: s.dob ? dayjs(s.dob) : null,
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
          fetchStudents(page, pageSize);
        } else {
          message.error(response.message || "Failed to update student");
        }
      } else {
        const response = await saveStudent(values);
        if (response.success) {
          message.success(response.message || "Student saved successfully");
          closeDrawer();
          fetchStudents(page, pageSize);
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
        fetchStudents(page, pageSize);
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
        />
      </Drawer>
    </div>
  );
}
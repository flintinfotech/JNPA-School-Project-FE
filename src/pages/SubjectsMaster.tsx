import React, { useEffect, useState } from "react";
import type { SubjectDTO } from "../services/subjectService";



import {
  Table,
  Button,
  Space,
  Popconfirm,
  Card,
  Drawer,
  Form,
  Input,
  message,
  Grid,
  Tag,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import {
  saveSubject,
  updateSubject,
  deleteSubject,
  getAllSubjects,
  getSubjectById,
  
} from "../services/subjectService";

const SubjectMaster: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectDTO | null>(null);

  const [form] = Form.useForm();
  const { useBreakpoint } = Grid;
const screens = useBreakpoint();

 const showDrawer = () => {
  form.resetFields();
  setEditingSubject(null);
  setOpen(true);
};

  const closeDrawer = () => {
    setOpen(false);
  };

  // =============================
  // Load Subjects
  // =============================
  const loadSubjects = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      setLoading(true);

      const response = await getAllSubjects(page - 1, pageSize);

      setSubjects(response.data.subjectMasterDTOS);

      setPagination({
        current: page,
        pageSize,
        total: response.data["total element"],
      });
    } catch (error) {
      console.log(error);
      message.error("Unable to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  // =============================
  // Save Subject
  // =============================
 const handleSave = async (values: any) => {
  try {
    if (editingSubject) {
      const response = await updateSubject({
        subjectMasterId: editingSubject.subjectMasterId,
        subjectCode: values.subjectCode,
        subjectName: values.subjectName,
      });

      message.success(response.message);
    } else {
      const response = await saveSubject({
        subjectCode: values.subjectCode,
        subjectName: values.subjectName,
      });

     message.success(response.message);
    }

    form.resetFields();
    setEditingSubject(null);
    setOpen(false);

    await loadSubjects();
  } catch (error) {
    console.error(error);
    message.error("Operation failed");
  }
};

  // =============================
  // Edit Subject
  // =============================
 const handleEdit = async (record: SubjectDTO) => {
  try {
    const response = await getSubjectById(record.subjectMasterId);

    const subject = response.data;

    setEditingSubject(subject);

    form.setFieldsValue({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
    });

    setOpen(true);
  } catch (error) {
    console.log(error);
    message.error("Unable to fetch subject details");
  }
};

  // =============================
  // Delete Subject
  // =============================
 const handleDelete = async (id:number) => {

  try {

    const response = await deleteSubject(id);

    message.success(response.message);

    // refresh table data
    loadSubjects();

  } catch(error:any){

    console.log("Delete Error:",error);

    message.error(
      error.response?.data?.message ||
      "Delete operation failed"
    );
  }

};
    // =============================
  // Table Columns
  // =============================
  const columns = [
   {
  title: "Sr. No.",
  key: "srNo",
  width: 100,
  render: (_: any, _record: SubjectDTO, index: number) => {
    return (
      (pagination.current - 1) * pagination.pageSize + index + 1
    );
  },
},
    {
      title: "Subject Name",
      dataIndex: "subjectName",
      key: "subjectName",
    },
    {
      title: "Subject Code",
      dataIndex: "subjectCode",
      key: "subjectCode",
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      width: 150,
      render: (_: any, record: SubjectDTO) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title="Are you sure you want to delete this subject?"
            onConfirm={() =>
              handleDelete(record.subjectMasterId)
            }
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
    return (
    <>
      <Card
        // title="Subject Master"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showDrawer}
          >
            Add Subject
          </Button>
        }
      >
       {screens.md ? (
  <Table
    rowKey="subjectMasterId"
    columns={columns}
    dataSource={subjects}
    loading={loading}
    pagination={{
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
      showSizeChanger: true,
      onChange: (page, pageSize) => {
        loadSubjects(page, pageSize);
      },
    }}
  />
) : (
  <>
    {subjects.map((subject, index) => (
      <Card
        key={subject.subjectMasterId}
        style={{
          marginBottom: 15,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <strong>
            Sr. No.{" "}
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </strong>

          <Tag color="blue">{subject.subjectCode}</Tag>
        </div>

        <p>
          <strong>Subject Name</strong>
          <br />
          {subject.subjectName}
        </p>

        <p>
          <strong>Subject Code</strong>
          <br />
          {subject.subjectCode}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 10,
          }}
        >
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(subject)}
          />

          <Popconfirm
            title="Delete Subject?"
            onConfirm={() => handleDelete(subject.subjectMasterId)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </div>
      </Card>
    ))}

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 10,
        marginTop: 20,
      }}
    >
      <Button
        disabled={pagination.current === 1}
        onClick={() =>
          loadSubjects(
            pagination.current - 1,
            pagination.pageSize
          )
        }
      >
        Previous
      </Button>

      <Button
        disabled={
          pagination.current * pagination.pageSize >=
          pagination.total
        }
        onClick={() =>
          loadSubjects(
            pagination.current + 1,
            pagination.pageSize
          )
        }
      >
        Next
      </Button>
    </div>
  </>
)}
      </Card>

      <Drawer
        title={editingSubject ? "Update Subject" : "Add Subject"}
        placement="right"
        width={420}
        open={open}
        onClose={closeDrawer}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            label="Subject Code"
            name="subjectCode"
            rules={[
              {
                required: true,
                message: "Please enter Subject Code",
              },
            ]}
          >
            <Input placeholder="Enter Subject Code" />
          </Form.Item>

          <Form.Item
            label="Subject Name"
            name="subjectName"
            rules={[
              {
                required: true,
                message: "Please enter Subject Name",
              },
            ]}
          >
            <Input placeholder="Enter Subject Name" />
          </Form.Item>

          <Space>
            <Button onClick={closeDrawer}>
              Cancel
            </Button>

            <Button
  type="primary"
  htmlType="submit"
>
  {editingSubject ? "Update" : "Save"}
</Button>
          </Space>
        </Form>
      </Drawer>
    </>
  );
};

export default SubjectMaster; 
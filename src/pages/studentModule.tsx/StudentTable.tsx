import { useState, useEffect } from "react";
import { Button, Popconfirm, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import CommonTable from "../../components/commonTable";
import type { StudentDTO } from "../../services/studentService";

interface StudentTableProps {
  data: StudentDTO[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onEdit: (record: StudentDTO) => void;
  onDelete: (studentId: number) => void;
}

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

export default function StudentTable({
  data,
  loading,
  pagination,
  onEdit,
  onDelete,
}: StudentTableProps) {
  const isMobile = useIsMobile();

  const columns = [
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "DOB",
      dataIndex: "dob",
      key: "dob",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Blood Group",
      dataIndex: "bloodGroup",
      key: "bloodGroup",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      render: (_: any, record: StudentDTO) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this student?"
            onConfirm={() => onDelete(record.studentId as number)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (isMobile) {
    return (
      <div className="space-y-3">
        {loading && (
          <div className="text-center text-sm text-gray-400 py-6">Loading...</div>
        )}
        {!loading && data.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-6">No students found</div>
        )}
        {!loading &&
          data.map((record) => (
            <div
              key={record.studentId}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {record.firstName} {record.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.gender} | DOB: {record.dob}
                  </p>
                </div>
                <Tag color={record.status === "ACTIVE" ? "green" : "red"}>
                  {record.status}
                </Tag>
              </div>

              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <p>{record.address}</p>
                <p>
                  Blood Group: {record.bloodGroup ?? "-"} | Category:{" "}
                  {record.category ?? "-"}
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-50">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => onEdit(record)}
                />
                <Popconfirm
                  title="Are you sure you want to delete this student?"
                  onConfirm={() => onDelete(record.studentId as number)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </div>
            </div>
          ))}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">Total: {pagination.total}</span>
          <div className="flex gap-2">
            <Button
              size="small"
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
            >
              Prev
            </Button>
            <Button
              size="small"
              disabled={pagination.current * pagination.pageSize >= pagination.total}
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <CommonTable
        data={data}
        columns={columns}
        loading={loading}
        pagination={pagination}
      />
    </div>
  );
}
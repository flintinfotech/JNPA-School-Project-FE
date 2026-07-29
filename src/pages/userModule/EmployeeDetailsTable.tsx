import { useState, useEffect } from "react";
import { Button } from "antd";
import { EyeOutlined, EditOutlined } from "@ant-design/icons";
import CommonTable from "../../components/commonTable";
import type { UserDTO } from "../../services/userService";

interface UserTableProps {
  data: UserDTO[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onView: (record: UserDTO) => void;
  onEdit: (record: UserDTO) => void;
  // onDelete: (userId: number) => void;
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

export default function UserUpdateProfileTable({
  data,
  loading,
  pagination,
  onView,
  onEdit,
  // onDelete,
}: UserTableProps) {
  const isMobile = useIsMobile();

  const columns = [
    {
      title: "Username",
      dataIndex: "userName",
      key: "userName",
    },
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
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Mobile No",
      dataIndex: "mobileNo",
      key: "mobileNo",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      render: (_: any, record: UserDTO) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => onView(record)}
          />

          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
          />
        </div>
      ),
    },
  ];

  // Mobile: stacked cards instead of a wide table
  if (isMobile) {
    return (
      
      <div className="space-y-3">
        {loading && (
          <div className="text-center text-sm text-gray-400 py-6">Loading...</div>
        )}

        {!loading && data.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-6">No users found</div>
        )}

        

        {!loading &&
          data.map((record) => (
            <div
              key={record.userId}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {record.userName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.firstName} {record.lastName}
                  </p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                  {record.role}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <p>{record.email}</p>
                <p>{record.mobileNo}</p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-50">

                <Button
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => onView(record)}
                />
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => onEdit(record)}
                />
              </div>
            </div>
          ))}

        {/* Simple pagination controls for mobile */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            Total: {pagination.total}
          </span>
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

  // Desktop: existing table, wrapped for horizontal scroll safety on smaller laptop widths
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
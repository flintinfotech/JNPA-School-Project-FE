import { Button, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
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
  onEdit: (record: UserDTO) => void;
  onDelete: (userId: number) => void;
}

export default function UserTable({
  data,
  loading,
  pagination,
  onEdit,
  onDelete,
}: UserTableProps) {
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
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_: any, record: UserDTO) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => onDelete(record.userId)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <CommonTable
      data={data}
      columns={columns}
      loading={loading}
      pagination={pagination}
    />
  );
}
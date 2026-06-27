import { useState, useEffect, useCallback } from "react";
import { Button, Drawer, Form, message } from "antd";
import { PlusOutlined, LogoutOutlined } from "@ant-design/icons";
import { deleteUser, getAllUsers, saveUser, updateUser, type UserDTO } from "../services/userService";
import UserTable from "./userModule/userTable";
import UserForm from "./userModule/userForm";

interface UserManagementProps {
  onLogout: () => void;
}

export default function UserManagement({ onLogout }: UserManagementProps) {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async (pageNum: number, size: number) => {
    setTableLoading(true);
    try {
      const response = await getAllUsers(pageNum, size);
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
  }, []);

  useEffect(() => {
    fetchUsers(page, pageSize);
  }, [page, pageSize, fetchUsers]);

  const openAddDrawer = () => {
    setEditingUser(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEditDrawer = (record: UserDTO) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
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
          fetchUsers(page, pageSize);
        } else {
          message.error(response.message || "Failed to update user");
        }
      } else {
        const response = await saveUser(values);
        if (response.success) {
          message.success(response.message || "User saved successfully");
          closeDrawer();
          fetchUsers(page, pageSize);
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

  const handleDelete = async (userId: number) => {
    try {
      const response = await deleteUser(userId);
      if (response.success) {
        message.success(response.message || "User deleted successfully");
        fetchUsers(page, pageSize);
      } else {
        message.error(response.message || "Failed to delete user");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Users</h2>
        <Button
          icon={<LogoutOutlined />}
          danger
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>

      {/* Add User Button */}
      <div className="flex justify-end mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Add User
        </Button>
      </div>

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
        onDelete={handleDelete}
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
        />
      </Drawer>
    </div>
  );
}
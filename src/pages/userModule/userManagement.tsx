import { useState, useEffect, useCallback } from "react";
import { Button, Drawer, Form, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
import {  getAllUsers,getUserById, saveUser, updateUser, type UserDTO } from "../../services/userService";
import UserTable from "./userTable";
import UserForm from "./userForm";
import { getAllStaticData, type StaticDataResponse } from "../../services/staticDataService";

export default function UserManagement() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [staticData, setStaticData] = useState<StaticDataResponse | null>(null);

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

  // const openAddDrawer = () => {
  //   setEditingUser(null);
  //   form.resetFields();
  //   setDrawerOpen(true);
  // };

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

  // const handleDelete = async (userId: number) => {
  //   try {
  //     const response = await deleteUser(userId);
  //     if (response.success) {
  //       message.success(response.message || "User deleted successfully");
  //       fetchUsers(page, pageSize);
  //     } else {
  //       message.error(response.message || "Failed to delete user");
  //     }
  //   } catch (error: any) {
  //     message.error(error?.response?.data?.message || "Failed to delete user");
  //   }
  // };

  return (
    <div>
      {/* Add User Button */}
      {/* <div className="flex justify-end mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Add User
        </Button>
      </div> */}
                 
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
        // onDelete={handleDelete}
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
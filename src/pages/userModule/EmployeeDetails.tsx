import { useState, useEffect, useCallback } from "react";
import { Drawer, Form, message } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
import {  getAllUsers,saveUserInformation,updateUserInformation, getUserInformationById, type UserDTO } from "../../services/userService";
import UserUpdateProfileTable from "./EmployeeDetailsTable";
// import UserViewDrawer from "./UserViewDrawer";
import User from "./Employee";
import dayjs from "dayjs";
// import UserForm from "./userForm";
import { getAllStaticData, type StaticDataResponse } from "../../services/staticDataService";

export default function UpdateUserProfile() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserDTO | null>(null);
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

//   const openAddDrawer = () => {
//     setEditingUser(null);
//     form.resetFields();
//     setDrawerOpen(true);
//   };
  const openViewDrawer = (record: UserDTO) => {
  setViewUser(record);
  setViewDrawerOpen(true);
};


const openEditDrawer = async (record: UserDTO) => {
  try {
    const response = await getUserInformationById(record.userId);

    if (!response.success) {
      message.error(response.message);
      return;
    }

    const user = response.data;

    setEditingUser(user);

    form.setFieldsValue({
      userInformationId: user.userInformationId,
      userId: user.userId,
      employeeCode: user.employeeCode,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      gender: user.gender,
      qualification: user.qualification,
      specialization: user.specialization,
      experience: user.experience,
      designation: user.designation,
      bloodGroup: user.bloodGroup,
      address: user.address,

      dateOfBirth: dayjs(user.dateOfBirth),

      joiningDate: dayjs(user.joiningDate),

      documents: user.userDocumentDTOS?.map((doc: any) => ({
        userDocumentId: doc.userDocumentId,
        userInformationId: doc.userInformationId,
        documentName: doc.documentName,
        documentType: doc.documentType,
        uploadDate: dayjs(doc.uploadDate),
        document: null,
      })),
    });

    setDrawerOpen(true);
  } catch (error: any) {
    message.error(
      error?.response?.data?.message ||
        "Failed to load user information"
    );
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
    const payload = {
      userInformationId: editingUser?.userInformationId,

      userId: values.userId,

      employeeCode: values.employeeCode,

      firstName: values.firstName,

      middleName: values.middleName,

      lastName: values.lastName,

      gender: values.gender,

      qualification: values.qualification,

      specialization: values.specialization,

      experience: values.experience,

      designation: values.designation,

      bloodGroup: values.bloodGroup,

      address: values.address,

      dateOfBirth: values.dateOfBirth.format("YYYY-MM-DD"),

      joiningDate: values.joiningDate.format("YYYY-MM-DD"),

      userDocumentDTOS: (values.documents || []).map((doc: any) => ({
        userDocumentId: doc.userDocumentId,

        userInformationId: doc.userInformationId,

        documentName: doc.documentName,

        documentType: doc.documentType,

        uploadDate: doc.uploadDate
          ? doc.uploadDate.format("YYYY-MM-DD")
          : null,

        document: null,
      })),
    };

    let response;

    if (editingUser) {
      response = await updateUserInformation(payload);
    } else {
      response = await saveUserInformation(payload);
    }

    if (response.success) {
      message.success(response.message);

      closeDrawer();

      fetchUsers(page, pageSize);
    } else {
      message.error(response.message);
    }
  } catch (error: any) {
    message.error(
      error?.response?.data?.message ||
      "Something went wrong"
    );
  } finally {
    setSubmitting(false);
  }
};
//   const handleDelete = async (userId: number) => {
//     try {
//       const response = await deleteUser(userId);
//       if (response.success) {
//         message.success(response.message || "User deleted successfully");
//         fetchUsers(page, pageSize);
//       } else {
//         message.error(response.message || "Failed to delete user");
//       }
//     } catch (error: any) {
//       message.error(error?.response?.data?.message || "Failed to delete user");
//     }
//   };

  return (
    <div>
      {/* Add User Button */}
      

      <UserUpdateProfileTable
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
    onView={openViewDrawer}
    onEdit={openEditDrawer}
/>

      <Drawer
            title="Employee Details"
             open={drawerOpen}
            onClose={closeDrawer}
            width={700}
            destroyOnClose
            >
        <User
            form={form}
            onFinish={handleFormSubmit}
             isEditing={!!editingUser}
            loading={submitting}
        />
      </Drawer>
    </div>
  );
}
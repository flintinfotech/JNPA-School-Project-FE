import { useEffect, useState } from "react";
import CommonForm from "../../components/commonForm";
import type { FormInstance } from "antd/es/form";
import type { StaticDataResponse } from "../../services/staticDataService";
import { Form } from "antd";
import { apiEndpoints } from "../../services/apiEndpoints"; // adjust path to your actual file
import axiosInstance from "../../lib/axios"; // adjust to whatever you use for calls
// import { Select, Checkbox } from "antd";


interface UserFormProps {
  form: FormInstance;
  onFinish: (values: any) => void;
  isEditing: boolean;
  loading: boolean;
  staticData: StaticDataResponse | null;
}

interface ScreenOption {
  screenId: number;
  screenName: string;
}

export default function UserForm({ form, onFinish, isEditing, loading, staticData }: UserFormProps) {
  const selectedRole = Form.useWatch("role", form);
  const [screens, setScreens] = useState<ScreenOption[]>([]);

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const res = await axiosInstance.get(apiEndpoints.getAllScreens());
        setScreens(res.data?.data ?? []);
      } catch (err) {
        console.error("Failed to fetch screens", err);
      }
    };
    fetchScreens();
  }, []);
  const handleFinish = (values: any) => {
    const { screenIds, ...rest } = values;

    onFinish({
      ...rest,

      screens:
        screenIds?.map((id: number) => ({
          screenId: id,
        })) ?? [],
    });
  };

  const fields = [
    {
      name: "userName",
      label: "Username",
      type: "text" as const,
      required: true,
    },
    {
      name: "firstName",
      label: "First Name",
      type: "text" as const,
      required: true,
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text" as const,
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email" as const,
      required: true,
    },
    {
      name: "mobileNo",
      label: "Mobile No",
      type: "text" as const,
      required: true,
      minLength: 10,
      maxLength: 10,
      pattern: "^[0-9]{10}$"
    },
    ...(!isEditing
      ? [
        {
          name: "password",
          label: "Password",
          type: "password" as const,
        },
      ]
      : []),
    {
      name: "role",
      label: "Role",
      type: "select" as const,

      options:
        staticData?.role.map((role) => ({
          label: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
          value: role,
        })) ?? [],
    },
    {
      name: "screenIds",
      label: "Screens",
      type: "select" as const,
      mode: "multiple" as const,
      options: screens.map((screen) => ({
        label: screen.screenName,
        value: screen.screenId,
      })),
    },
    ...(selectedRole === "TEACHER"
      ? [
        {
          name: "section",
          label: "Section",
          type: "select" as const,
          required: true,
          options:
            staticData?.["class name"]?.map((item) => ({
              label: item,
              value: item,
            })) ?? [],
        },
        {
          name: "medium",
          label: "Medium",
          type: "select" as const,
          required: true,
          options: [
            {
              label: "English",
              value: "English",
            },
            {
              label: "Marathi",
              value: "Marathi",
            },
          ],
        },
      ]
      : []),
  ];

  return (
    <CommonForm
      form={form}
      fields={fields}
      onFinish={handleFinish}
      submitText={isEditing ? "Update" : "Add"}
      loading={loading}
    />
  );
}




import CommonForm from "../../components/commonForm";
import type { FormInstance } from "antd/es/form";
import type { StaticDataResponse } from "../../services/staticDataService";

interface UserFormProps {
  form: FormInstance;
  onFinish: (values: any) => void;
  isEditing: boolean;
  loading: boolean;
  staticData: StaticDataResponse | null;
}

export default function UserForm({ form, onFinish, isEditing, loading, staticData }: UserFormProps) {
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
      required: false,
    },
    {
      name: "email",
      label: "Email",
      type: "email" as const,
      required: false,
    },
    {
      name: "mobileNo",
      label: "Mobile No",
      type: "text" as const,
      required: true,
      maxLength: 10
    },
    ...(!isEditing
      ? [
        {
          name: "password",
          label: "Password",
          type: "password" as const,
          required: true,
        },
      ]
      : []),
    {
      name: "role",
      label: "Role",
      type: "select" as const,
      required: true,
      options:
        staticData?.role.map((role) => ({
          label: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
          value: role,
        })) ?? [],
    },
  ];

  return (
    <CommonForm
      form={form}
      fields={fields}
      onFinish={onFinish}
      submitText={isEditing ? "Update" : "Add"}
      loading={loading}
    />
  );
}
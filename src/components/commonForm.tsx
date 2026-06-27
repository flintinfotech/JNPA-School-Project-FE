import { Form, Input, Select, Button } from "antd";
import type { FormInstance, Rule } from "antd/es/form";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "password" | "email" | "number" | "select";
  required?: boolean;
  options?: { label: string; value: string }[];
  rules?: Rule[];
  maxLength?: number;
}

interface CommonFormProps {
  fields: FormFieldConfig[];
  form: FormInstance;
  onFinish: (values: any) => void;
  submitText?: string;
  loading?: boolean;
}

export default function CommonForm({
  fields,
  form,
  onFinish,
  submitText = "Submit",
  loading,
}: CommonFormProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {fields.map((field) => (
        <Form.Item
          key={field.name}
          name={field.name}
          label={field.label}
          rules={
            field.rules ??
            (field.required
              ? [{ required: true, message: `${field.label} is required` }]
              : [])
          }
        >
          {field.type === "select" ? (
            <Select options={field.options} placeholder={`Select ${field.label}`} />
          ) : (
            <Input type={field.type} placeholder={field.label} maxLength={field.maxLength} />
          )}
        </Form.Item>
      ))}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          {submitText}
        </Button>
      </Form.Item>
    </Form>
  );
}
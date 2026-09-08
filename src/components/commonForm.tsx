import { Form, Input, Select, Button, } from "antd";
import type { FormInstance, Rule } from "antd/es/form";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "password" | "email" | "number" | "select";
  required?: boolean;
  options?: { label: string; value: string | number }[];
  rules?: Rule[];
  maxLength?: number;
  mode?: "multiple" | "tags";
  // 👇 Lets a specific field be disabled independently of the whole form's
  // `viewOnly` flag — e.g. keeping a few identity fields locked while
  // updating a record, but leaving the rest of the form editable.
  disabled?: boolean;
}

interface CommonFormProps {
  fields: FormFieldConfig[];
  form: FormInstance;
  onFinish: (values: any) => void;
  submitText?: string;
  loading?: boolean;
  viewOnly?: boolean;
}

export default function CommonForm({
  fields,
  form,
  onFinish,
  submitText = "Submit",
  loading,
  viewOnly = false,
}: CommonFormProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish} disabled={viewOnly}>
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
            <Select
              options={field.options}
              placeholder={`Select ${field.label}`}
              mode={field.mode}
              disabled={field.disabled}
              optionRender={
                field.mode === "multiple"
                  ? (option) => (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {option.label}
                      </div>
                    )
                  : undefined
              }
            />
          ) : (
            <Input
              type={field.type}
              placeholder={field.label}
              maxLength={field.maxLength}
              disabled={field.disabled}
            />
          )}
        </Form.Item>
      ))}
      {!viewOnly && (
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {submitText}
          </Button>
        </Form.Item>
      )}
    </Form>
  );
}
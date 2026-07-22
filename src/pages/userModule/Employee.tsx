import {
  Form,
  Tabs,
  Input,
  Select,
  DatePicker,
  Button,
  Upload,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";

interface UserProps {
  form: any;
  onFinish: (values: any) => void;
  loading: boolean;
  isEditing: boolean;
  viewOnly?: boolean;
}

export default function User({
  form,
  onFinish,
  loading,
  isEditing,
}: UserProps) {
  const [activeTab, setActiveTab] = useState("1");

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "1",
            label: "User Details",
            children: (
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                 name="userInformationId"
                hidden
                   >
              <Input />
            
            </Form.Item>
                <Form.Item
                  label="User ID"
                  name="userId"
                >
                  <Input disabled />
                </Form.Item>

                <Form.Item
                  label="Employee Code"
                  name="employeeCode"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Middle Name"
                  name="middleName"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Gender"
                  name="gender"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select Gender">
                    <Select.Option value="Male">Male</Select.Option>
                    <Select.Option value="Female">Female</Select.Option>
                    <Select.Option value="Other">Other</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Date Of Birth"
                  name="dateOfBirth"
                  rules={[{ required: true }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD-MM-YYYY"
                  />
                </Form.Item>

                <Form.Item
                  label="Qualification"
                  name="qualification"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Specialization"
                  name="specialization"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Experience"
                  name="experience"
                  rules={[{ required: true }]}
                >
                  <Input type="number" />
                </Form.Item>

                <Form.Item
                  label="Designation"
                  name="designation"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Joining Date"
                  name="joiningDate"
                  rules={[{ required: true }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD-MM-YYYY"
                  />
                </Form.Item>

                <Form.Item
                  label="Blood Group"
                  name="bloodGroup"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select Blood Group">
                    <Select.Option value="A+">A+</Select.Option>
                    <Select.Option value="A-">A-</Select.Option>
                    <Select.Option value="B+">B+</Select.Option>
                    <Select.Option value="B-">B-</Select.Option>
                    <Select.Option value="AB+">AB+</Select.Option>
                    <Select.Option value="AB-">AB-</Select.Option>
                    <Select.Option value="O+">O+</Select.Option>
                    <Select.Option value="O-">O-</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Address"
                  name="address"
                  className="col-span-2"
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>

                <div className="col-span-2 flex justify-between mt-4">

                  <Button disabled>
                    Back
                  </Button>

                  <Button
                    type="primary"
                    onClick={() => setActiveTab("2")}
                  >
                    Next
                  </Button>

                </div>

              </div>
            ),
          },

          {
            key: "2",
            label: "Documents",
            children: (
              <Form.List
                name="documents"
                initialValue={[
                  {
                    documentName: "",
                    documentType: "",
                    uploadDate: null,
                    document: null,
                  },
                ]}
              >
                {(fields, { add, remove }) => (
                  <>
                  {fields.map(({ key, name }) => (
  <div
    key={key}
    className="border rounded-lg p-4 mb-5"
  >
    <h3 className="font-semibold text-lg mb-4">
      Document {name + 1}
    </h3>

    <div className="grid grid-cols-2 gap-4">

      <Form.Item
        label="Document Name"
        name={[name, "documentName"]}
        rules={[
          {
            required: false,
            message: "Please enter document name",
          },
        ]}
      >
        <Input placeholder="Enter Document Name" />
      </Form.Item>

      <Form.Item
        label="Document Type"
        name={[name, "documentType"]}
        rules={[
          {
            required: false,
            message: "Please select document type",
          },
        ]}
      >
        <Select placeholder="Select Document Type">
          <Select.Option value="PDF">PDF</Select.Option>
          <Select.Option value="DOC">DOC</Select.Option>
          <Select.Option value="Image">Image</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Upload Date"
        name={[name, "uploadDate"]}
      >
        <DatePicker
          style={{ width: "100%" }}
          format="DD-MM-YYYY"
        />
      </Form.Item>

      <Form.Item
        label="Upload Document"
        name={[name, "document"]}
      >
        <Upload beforeUpload={() => false}>
          <Button>Select File</Button>
        </Upload>
      </Form.Item>

      {fields.length > 1 && (
        <div className="col-span-2 flex justify-end">
          <Button
            danger
            onClick={() => remove(name)}
          >
            Remove Document
          </Button>
        </div>
      )}

    </div>
  </div>
))}

<div className="flex justify-center mb-6">
  <Button
    type="dashed"
    icon={<PlusOutlined />}
    onClick={() =>
      add({
        documentName: "",
        documentType: "",
        uploadDate: null,
        document: null,
      })
    }
  >
    Add Document
  </Button>
</div>

<div className="flex justify-between">

  <Button
    onClick={() => setActiveTab("1")}
  >
    Back
  </Button>

  <Button
    type="primary"
    htmlType="submit"
    loading={loading}
  >
    {isEditing ? "Update" : "Save"}
  </Button>

</div>

                  </>
                )}
              </Form.List>
            ),
          },
        ]}
      />
    </Form>
  );
}
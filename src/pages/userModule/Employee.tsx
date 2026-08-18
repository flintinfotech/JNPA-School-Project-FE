import {
  Form,
  Tabs,
  Input,
  Select,
  DatePicker,
  Button,
  Upload,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getAllStaticData } from "../../services/staticDataService";
import { useState, useEffect } from "react";

interface UserProps {
  form: any;
  onFinish: (values: any) => void;
  loading: boolean;
  isEditing: boolean;
  viewOnly?: boolean;
  onDelete?: () => void;
}

export default function User({
  form,
  onFinish,
  loading,
  isEditing,
  onDelete,
}: UserProps) {
  const [activeTab, setActiveTab] = useState("1");

  // Role dropdown state
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const res = await getAllStaticData();
        if (res?.success) {
          setRoles(res.data?.role || []);
        }
      } catch (err) {
        console.error("Failed to fetch roles", err);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => resolve(reader.result as string);

      reader.onerror = error => reject(error);
    });
  };

  return (
   <Form
  form={form}
  layout="vertical"
  onFinish={onFinish}
  onFinishFailed={({ errorFields }) => {
    message.error("Please fill the highlighted fields before submitting.");
    console.log("Validation failed on:", errorFields);
    // optionally: if any errorField path starts with "documents", switch to tab "2"
  }}
  scrollToFirstError
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
                  name="employeeDetailsId"
                  hidden
                >
                  <Input disabled />
                </Form.Item>
                <Form.Item
                  name="userId"
                  hidden
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Employee Code"
                  name="employeeCode"
                  rules={[{ required: true }]}
                >
                  <Input
                    disabled={isEditing}
                    styles={{ input: { color: "#000", WebkitTextFillColor: "#000" } }}
                  />
                </Form.Item>
                <Form.Item
                  label="User Name"
                  name="userName"
                  rules={[{ required: true }]}
                >
                  <Input
                    disabled={isEditing}
                    styles={{ input: { color: "#000", WebkitTextFillColor: "#000" } }}
                  />
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

                <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                  <Select placeholder="Select Role" loading={rolesLoading}>
                    {roles.map((role) => (
                      <Select.Option key={role} value={role}>
                        {role}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Email "
                  name="email"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Mobile No"
                  name="mobileNo"
                  rules={[
                    { required: true, message: "Please enter mobile number" },
                    {
                      pattern: /^[6-9]\d{9}$/,
                      message: "Enter a valid 10-digit mobile number",
                    },
                  ]}
                >
                  <Input maxLength={10} placeholder="Enter Mobile Number" />
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
                  rules={[
                    { required: true, message: "Please enter experience" },
                    {
                      pattern: /^\d+(\.\d+)?$/,
                      message: "Enter a valid number",
                    },
                  ]}
                >
                  <Input type="number" min={0} placeholder="Enter Experience (years)" />
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
                  label="Leaving Date"
                  name="leavingDate"
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
                        className="border rounded-lg p-5 mb-4 relative bg-white"
                      >
                        {/* Delete icon: always visible, always deletable
                            regardless of whether a file has been uploaded */}
                        <DeleteOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(name);
                          }}
                          style={{
                            position: "absolute",
                            right: 18,
                            top: 18,
                            color: "red",
                            cursor: "pointer",
                            fontSize: 20,
                            zIndex: 10,
                          }}
                        />

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
                            label="Upload Date"
                            name={[name, "uploadDate"]}
                            rules={[{ required: true, message: "Please select upload date" }]}
                            getValueProps={(value) => ({
                              value: value && !dayjs.isDayjs(value) ? dayjs(value) : value,
                            })}
                          >
                            <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
                          </Form.Item>

                          <Form.Item
                            label="File"
                            name={[name, "document"]}
                            valuePropName="fileListDummy"
                            rules={[{ required: true, message: "Please upload a file" }]}
                            getValueFromEvent={() => form.getFieldValue(["documents", name, "document"])}
                          >
                            <Upload
                              listType="text"
                              maxCount={1}
                              fileList={form.getFieldValue(["documents", name, "fileList"]) || []}
                              beforeUpload={async (file) => {
                                const base64 = await convertToBase64(file);
                                const docs = form.getFieldValue("documents") || [];

                                const inferredType = file.type.includes("pdf")
                                  ? "PDF"
                                  : file.type.includes("image")
                                    ? "Image"
                                    : "DOC";

                                docs[name] = {
                                  ...docs[name],
                                  document: base64,
                                  documentType: inferredType,
                                  fileList: [
                                    { uid: file.uid, name: file.name, status: "done", url: base64 },
                                  ],
                                };
                                form.setFieldsValue({ documents: docs });
                                return false;
                              }}
                              onRemove={() => {
                                const docs = form.getFieldValue("documents") || [];
                                docs[name] = {
                                  ...docs[name],
                                  document: null,
                                  documentType: null,
                                  fileList: [],
                                };
                                form.setFieldsValue({ documents: docs });
                              }}
                              onPreview={(file) => {
                                const base64 = file.url || (file as any).thumbUrl;
                                if (!base64 || typeof base64 !== "string" || !base64.includes(",")) {
                                  return;
                                }
                                try {
                                  const [meta, data] = base64.split(",");
                                  const mimeMatch = meta.match(/data:(.*);base64/);
                                  const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
                                  const byteCharacters = atob(data);
                                  const byteNumbers = new Array(byteCharacters.length);
                                  for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                  }
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], { type: mimeType });
                                  const objectUrl = URL.createObjectURL(blob);
                                  window.open(objectUrl, "_blank");
                                  setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
                                } catch (err) {
                                  console.error("Preview failed", err);
                                }
                              }}
                            >
                              <Button icon={<UploadOutlined />}>Select PDF / Image</Button>
                            </Upload>
                          </Form.Item>
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
                      <Button onClick={() => setActiveTab("1")}>Back</Button>
                      <Button type="primary" htmlType="submit" loading={loading}>
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
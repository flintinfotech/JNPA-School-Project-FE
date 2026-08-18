import { useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Tabs,
  Button,
  Upload,
  message,
  ConfigProvider,
} from "antd";
import { PlusOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { FormInstance } from "antd/es/form";
import type { UploadFile } from "antd/es/upload/interface";
import { getAllStaticData, type StaticDataResponse } from "../../services/staticDataService";

const { Option } = Select;

const STANDARD_OPTIONS = [
  "Playgroup",
  "Nursery",
  "Junior KG (LKG)",
  "Senior KG (UKG)",
  "1st Standard",
  "2nd Standard",
  "3rd Standard",
  "4th Standard",
  "5th Standard",
  "6th Standard",
  "7th Standard",
  "8th Standard",
  "9th Standard",
  "10th Standard",
];

interface StudentFormProps {
  form: FormInstance;
  onFinish: (values: any) => void;
  isEditing: boolean;
  loading: boolean;
  viewOnly?: boolean;
  staticData: StaticDataResponse | null;
}


const tabKeys = ["details", "parents", "documents", "academic"];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const base64ToBlobUrl = (
  base64: string | null | undefined,
  mimeType: string
): string => {
  if (!base64) return "";

  // Backend sometimes returns Java byte[] as [B@xxxx
  if (base64.startsWith("[B@")) {
    return "";
  }

  try {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], {
      type: mimeType || "application/octet-stream",
    });

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Invalid profile image Base64:", error);
    return "";
  }
};

const detectMimeType = (base64: string): string => {
  if (base64.startsWith("JVBERi0")) return "application/pdf";
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("R0lGODlh") || base64.startsWith("R0lGODdh")) return "image/gif";
  return "application/octet-stream";
};

export default function StudentForm({
  form,
  onFinish,
  isEditing,
  loading,
  viewOnly = false,
  staticData
}: StudentFormProps) {
  const [activeTab, setActiveTab] = useState("details");

  const documentsWatch: any[] = Form.useWatch("studentDocuments", form) || [];
  const profileImgWatch: string | null = Form.useWatch("profileImg", form);

  const photoUrl = profileImgWatch
    ? base64ToBlobUrl(profileImgWatch, detectMimeType(profileImgWatch))
    : "";

  const photoFileList: UploadFile[] = photoUrl
    ? [
      {
        uid: "profile-photo",
        name: "Student Photo",
        status: "done",
        url: photoUrl,
      },
    ]
    : [];

  const fieldsByTab: Record<string, any[]> = {
    details: [
      "firstName",
      "lastName",
      "gender",
      "dob",
      "address",
      "bloodGroup",
      "category",
      "religion",
      "caste",
      "nationality",
      "status",
    ],
    parents: ["parentEntities"],
    documents: ["studentDocuments"],
    academic: ["academicInformation"],
  };

  const goNext = async () => {
    try {
      await form.validateFields(fieldsByTab[activeTab]);
      const idx = tabKeys.indexOf(activeTab);
      if (idx < tabKeys.length - 1) setActiveTab(tabKeys[idx + 1]);
    } catch {
      message.error("Please fill all required fields in this tab");
    }
  };

  const goBack = () => {
    const idx = tabKeys.indexOf(activeTab);
    if (idx > 0) setActiveTab(tabKeys[idx - 1]);
  };


  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        status: values.status,
        dob: values.dob ? dayjs(values.dob).format("YYYY-MM-DD") : null,
        parentEntities: (values.parentEntities || []).map((p: any) => ({
          ...p,
          annualIncome: p.annualIncome ?? 0,
        })),
        studentDocuments: (values.studentDocuments || []).map((d: any) => {
          const { fileName, mimeType, ...rest } = d;
          return {
            ...rest,
            uploadDate: d.uploadDate
              ? dayjs(d.uploadDate).format("YYYY-MM-DD")
              : null,
          };
        }),
        academicInformation: (values.academicInformation || []).map(
          (a: any) => ({
            ...a,
            admissionDate: a.admissionDate
              ? dayjs(a.admissionDate).format("YYYY-MM-DD")
              : null,
          })
        ),
      };
      onFinish(payload);
    } catch {
      message.error("Please fill all required fields in every tab");
    }
  };

  return (
    <Form form={form} layout="vertical" disabled={viewOnly}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Student Details */}
        <Tabs.TabPane tab="Student Details" key="details" forceRender>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: "First name is required" }]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: "Last name is required" }]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
            <Form.Item
              label="Gender"
              name="gender"
              rules={[{ required: true, message: "Gender is required" }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Date of Birth"
              name="dob"
              rules={[{ required: true, message: "DOB is required" }]}
            >
              <DatePicker className="w-full" format="DD-MM-YYYY" />
            </Form.Item>
            <Form.Item
              label="Address"
              name="address"
              className="md:col-span-2"
              rules={[{ required: true, message: "Address is required" }]}
            >
              <Input.TextArea rows={2} placeholder="Enter address" />
            </Form.Item>
            <Form.Item label="Blood Group" name="bloodGroup">
              <Select placeholder="Select blood group" allowClear>
                {staticData?.["blood group"]?.map((bg) => (
                  <Option key={bg} value={bg}>
                    {bg}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Category" name="category">
              <Input placeholder="e.g. General, OBC" />
            </Form.Item>
            <Form.Item label="Religion" name="religion">
              <Input placeholder="Enter religion" />
            </Form.Item>
            <Form.Item label="Caste" name="caste">
              <Input placeholder="Enter caste" />
            </Form.Item>
            <Form.Item label="Nationality" name="nationality">
              <Input placeholder="Enter nationality" />
            </Form.Item>
            <Form.Item
              label="Aadhar No"
              name="aadharNo"
              rules={[
                { required: true, message: "Aadhar number is required" },
                {
                  pattern: /^\d{4}-\d{4}-\d{4}$/,
                  message: "Aadhar number must be exactly 12 digits",
                },
              ]}
            >
              <Input
                placeholder="Aadhar Card (9999-9999-9999)"
                maxLength={14}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                  const formatted = digits
                    .replace(/(\d{4})(?=\d)/g, "$1-")
                    .trim();
                  form.setFieldValue("aadharNo", formatted);
                }}
              />
            </Form.Item>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: "Status is required" }]}
            >
              <Select placeholder="Select status" allowClear>
                {staticData?.["student status"]?.map((status) => (
                  <Option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Student Photo"
              name="profileImg"
              className="md:col-span-2"
              getValueFromEvent={() => form.getFieldValue("profileImg")}
            >
              <Upload
                listType="picture-card"
                maxCount={1}
                fileList={photoFileList}
                beforeUpload={async (file) => {
                  const isImage = file.type.startsWith("image/");
                  if (!isImage) {
                    message.error("Please upload an image file");
                    return Upload.LIST_IGNORE;
                  }
                  const base64 = await fileToBase64(file);
                  const rawBase64 = base64.split(",")[1];
                  form.setFieldValue("profileImg", rawBase64);
                  return false;
                }}
                onRemove={() => {
                  form.setFieldValue("profileImg", null);
                }}
                onPreview={() => {
                  if (!profileImgWatch) return;
                  const url = base64ToBlobUrl(
                    profileImgWatch,
                    detectMimeType(profileImgWatch)
                  );
                  window.open(url, "_blank");
                }}
              >
                {photoFileList.length === 0 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </div>
        </Tabs.TabPane>

        {/* Parent Details */}
        <Tabs.TabPane tab="Parent Details" key="parents" forceRender>
          <Form.List name="parentEntities">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    className="border border-gray-200 rounded-lg p-4 mb-4 relative"
                  >
                    <div className="flex justify-end">
                      <Button
                        danger
                        type="text"
                        htmlType="button"
                        icon={<DeleteOutlined style={{ fontSize: 18 }} />}
                        onClick={() => remove(name)}
                      />
                    </div>

                    <Form.Item {...restField} name={[name, "parentId"]} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "studentId"]} hidden>
                      <Input />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                      <Form.Item
                        {...restField}
                        label="Name"
                        name={[name, "name"]}
                        rules={[{ required: true, message: "Name is required" }]}
                      >
                        <Input placeholder="Parent name" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Relation"
                        name={[name, "relation"]}
                        rules={[{ required: true, message: "Relation is required" }]}
                      >
                        <Select placeholder="Select relation">
                          <Option value="Father">Father</Option>
                          <Option value="Mother">Mother</Option>
                          <Option value="Guardian">Guardian</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Occupation"
                        name={[name, "occupation"]}
                      >
                        <Input placeholder="Occupation" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Phone"
                        name={[name, "phone"]}
                        rules={[
                          { required: true, message: "Phone is required" },
                          { len: 10, message: "" },
                          { pattern: /^[0-9]{10}$/, message: "Phone number must contain only 10 digits" },
                        ]}
                      >
                        <Input placeholder="Phone number" />
                      </Form.Item>
                      <Form.Item {...restField} label="Email" name={[name, "email"]}>
                        <Input placeholder="Email" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Annual Income"
                        name={[name, "annualIncome"]}
                      >
                        <InputNumber style={{ width: "100%" }} placeholder="Annual income" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Address"
                        name={[name, "address"]}
                        className="md:col-span-2"
                      >
                        <Input.TextArea rows={2} placeholder="Address" />
                      </Form.Item>
                    </div>
                  </div>
                ))}
                <Button
                  htmlType="button"
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add()}
                  block
                >
                  Add Parent / Guardian
                </Button>
              </>
            )}
          </Form.List>
        </Tabs.TabPane>

        {/* Documents */}
        <Tabs.TabPane tab="Documents" key="documents" forceRender>
          <Form.List name="studentDocuments">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => {
                  const currentDoc = documentsWatch[name];
                  const fileList: UploadFile[] =
                    currentDoc?.document || currentDoc?.fileName || currentDoc?.documentName
                      ? [
                        {
                          uid: String(
                            currentDoc?.studentDocumentId ?? `new-${key}`
                          ),
                          name:
                            currentDoc?.fileName ||
                            currentDoc?.documentName ||
                            "Uploaded file",
                          status: "done",
                        },
                      ]
                      : [];

                  return (
                    <div
                      key={key}
                      className="border border-gray-200 rounded-lg p-4 mb-4 relative"
                    >
                      <div className="flex justify-end">
                        <Button
                          danger
                          type="text"
                          htmlType="button"
                          icon={<DeleteOutlined style={{ fontSize: 18 }} />}
                          onClick={() => remove(name)}
                        />
                      </div>

                      <Form.Item {...restField} name={[name, "studentDocumentId"]} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "studentId"]} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "fileName"]} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "mimeType"]} hidden>
                        <Input />
                      </Form.Item>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <Form.Item
                          {...restField}
                          label="Document Name"
                          name={[name, "documentName"]}
                        // rules={[{ required: true, message: "Document name required" }]}
                        >
                          <Input placeholder="e.g. Birth Certificate" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          label="Upload Date"
                          name={[name, "uploadDate"]}
                          rules={[{ required: true, message: "Upload date required" }]}
                        >
                          <DatePicker className="w-full" format="DD-MM-YYYY" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          label="File"
                          name={[name, "document"]}
                          className="md:col-span-2"
                          rules={[{ required: true, message: "Please upload a file" }]}
                          getValueFromEvent={() =>
                            form.getFieldValue(["studentDocuments", name, "document"])
                          }
                        >
                          <Upload
                            maxCount={1}
                            fileList={fileList}
                            onRemove={() => {
                              form.setFieldValue(
                                ["studentDocuments", name, "document"],
                                null
                              );
                              form.setFieldValue(
                                ["studentDocuments", name, "fileName"],
                                null
                              );
                              form.setFieldValue(
                                ["studentDocuments", name, "mimeType"],
                                null
                              );
                            }}
                            beforeUpload={async (file) => {
                              const base64 = await fileToBase64(file);
                              const rawBase64 = base64.split(",")[1];
                              form.setFieldValue(
                                ["studentDocuments", name, "document"],
                                rawBase64
                              );
                              form.setFieldValue(
                                ["studentDocuments", name, "fileName"],
                                file.name
                              );
                              form.setFieldValue(
                                ["studentDocuments", name, "mimeType"],
                                file.type
                              );
                              form.validateFields([
                                ["studentDocuments", name, "document"],
                              ]);
                              return false;
                            }}
                            onPreview={() => {
                              const doc = form.getFieldValue([
                                "studentDocuments",
                                name,
                                "document",
                              ]);
                              const storedMimeType = form.getFieldValue([
                                "studentDocuments",
                                name,
                                "mimeType",
                              ]);
                              if (!doc) {
                                message.warning(
                                  "No file available to preview for this document"
                                );
                                return;
                              }
                              const detected = detectMimeType(doc);
                              const mimeType =
                                detected !== "application/octet-stream"
                                  ? detected
                                  : storedMimeType || detected;
                              const url = base64ToBlobUrl(doc, mimeType);
                              window.open(url, "_blank");
                            }}
                            showUploadList={{
                              showPreviewIcon: true,
                              showRemoveIcon: true,
                            }}
                          >
                            <Button htmlType="button" icon={<UploadOutlined />}>
                              Select PDF / Image
                            </Button>
                          </Upload>
                        </Form.Item>
                      </div>
                    </div>
                  );
                })}
                <Button
                  htmlType="button"
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ documentName: "", uploadDate: null, document: null })}
                  block
                >
                  Add Document
                </Button>
              </>
            )}
          </Form.List>
        </Tabs.TabPane>

        {/* Academic Info */}
        <Tabs.TabPane tab="Academic Info" key="academic" forceRender>
          <Form.List name="academicInformation">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    className="border border-gray-200 rounded-lg p-4 mb-4 relative"
                  >
                    {fields.length > 1 && (
                      <Button
                        danger
                        type="text"
                        htmlType="button"
                        icon={<DeleteOutlined />}
                        className="absolute top-2 right-2"
                        onClick={() => remove(name)}
                      />
                    )}

                    <Form.Item {...restField} name={[name, "academicInformationId"]} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "studentId"]} hidden>
                      <Input />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                      <Form.Item
                        {...restField}
                        label="Admission Id"
                        name={[name, "admissionNo"]}
                        rules={[{ required: true, message: "Admission no required" }]}
                      >
                        <InputNumber style={{ width: "100%" }} placeholder="Admission number" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Admission Date"
                        name={[name, "admissionDate"]}
                        rules={[{ required: true, message: "Admission date required" }]}
                      >
                        <DatePicker className="w-full" format="DD-MM-YYYY" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Standard"
                        name={[name, "standard"]}
                        rules={[{ required: true, message: "Standard required" }]}
                      >
                        <Select placeholder="Select standard" allowClear>
                          <Option value="Playgroup">Playgroup</Option>
                          <Option value="Nursery">Nursery</Option>
                          <Option value="LKG">LKG</Option>
                          <Option value="UKG">UKG</Option>
                          <Option value="1st Standard">1st</Option>
                          <Option value="2nd Standard">2nd</Option>
                          <Option value="3rd Standard">3rd</Option>
                          <Option value="4th Standard">4th</Option>
                          <Option value="5th Standard">5th</Option>
                          <Option value="6th Standard">6th</Option>
                          <Option value="7th Standard">7th</Option>
                          <Option value="8th Standard">8th</Option>
                          <Option value="9th Standard">9th</Option>
                          <Option value="10th Standard">10th</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Section"
                        name={[name, "section"]}
                        rules={[{ required: true, message: "Section required" }]}
                      >
                        <Input placeholder="e.g. B" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Roll No"
                        name={[name, "rollNo"]}
                        rules={[{ required: true, message: "Roll no required" }]}
                      >
                        <Input placeholder="e.g. 05" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Academic Year"
                        name={[name, "academicYear"]}
                        rules={[{ required: true, message: "Academic year required" }]}
                      >
                        <Input placeholder="e.g. 2025-2026" />
                      </Form.Item>
                    </div>
                  </div>
                ))}
                {fields.length === 0 && (
                  <Button
                    htmlType="button"
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add()}
                    block
                  >
                    Add Academic Info
                  </Button>
                )}
              </>
            )}
          </Form.List>
        </Tabs.TabPane>
      </Tabs>
      <ConfigProvider componentDisabled={false}>
        <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button
            htmlType="button"
            onClick={goBack}
            disabled={activeTab === tabKeys[0]}
          >
            Back
          </Button>

          {activeTab !== "academic" ? (
            <Button htmlType="button" type="primary" onClick={goNext}>
              Next
            </Button>
          ) : (
            !viewOnly && (
              <Button
                type="primary"
                htmlType="button"
                loading={loading}
                onClick={handleFinish}
              >
                {isEditing ? "Update" : "Save"}
              </Button>
            )
          )}
        </div>
      </ConfigProvider>
    </Form>
  );
}
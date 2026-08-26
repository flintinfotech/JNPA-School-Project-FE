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
    results?: any[];
}

const BASE_TAB_KEYS = ["details", "parents", "documents", "academic"];

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
// Shows the academic year the user is currently logged in under (selected
// on the login screen and stored by useAuth), e.g. "2026-2027" for
// { startDate: "2026-06-15", endDate: "2027-04-30" }. Falls back to a
// calendar-based guess only if nothing was stored (shouldn't normally happen
// since login always sets this).
const getCurrentAcademicYear = (): string => {
  try {
    const stored = localStorage.getItem("academicYear");
    if (stored) {
      const { startDate, endDate } = JSON.parse(stored) as {
        startDate?: string;
        endDate?: string;
      };
      const startYear = startDate ? new Date(startDate).getFullYear() : NaN;
      const endYear = endDate ? new Date(endDate).getFullYear() : NaN;
      if (!Number.isNaN(startYear) && !Number.isNaN(endYear)) {
        return `${startYear}-${endYear}`;
      }
    }
  } catch {
    // fall through to date-based guess below
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // Jan = 1

  // April (4) is start of new academic year in India
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

export default function StudentForm({
  form,
  onFinish,
  isEditing,
  loading,
  viewOnly = false,
  staticData,
  results: resultsProp,
}: StudentFormProps) {
  const [activeTab, setActiveTab] = useState("details");

  // Result tab is read-only info, so only show it in the view-only modal
  const tabKeys = viewOnly ? [...BASE_TAB_KEYS, "result"] : BASE_TAB_KEYS;

  const documentsWatch: any[] = Form.useWatch("studentDocuments", form) || [];
  const profileImgWatch: string | null = Form.useWatch("profileImg", form);
  // Form.useWatch("studentResultDTOS", ...) was unreliable right after the
  // view modal opens (destroyOnClose remounts the form before the watch
  // picks up the freshly-set value), so prefer the results passed in
  // directly as a prop (StudentTable already fetches and passes these),
  // falling back to the form value only if the prop wasn't supplied.
  const formResultsWatch: any[] = Form.useWatch("studentResultDTOS", form) || [];
  const resultsWatch: any[] = resultsProp && resultsProp.length > 0 ? resultsProp : formResultsWatch;

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
      "aadhaarCard"
    ],
    parents: ["parentDTO"],
    documents: ["studentDocuments"],
    academic: ["academicInformation"],
    result: [],
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
      const { dob, ...restValues } = values; // 👈 pull dob out of form values

      const payload = {
        ...restValues,
        status: values.status,
        studentCode: values.studentCode, // 👈 include student code
        DOB: dob ? dayjs(dob).format("YYYY-MM-DD") : null, // 👈 send as DOB to match backend
        parentDTO: {
          ...values.parentDTO,
          annualIncome: values.parentDTO?.annualIncome ?? 0,
        },
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
              label="Student Code"
              name="studentCode"
            >
              <Input placeholder="Auto-generated by system" disabled />
            </Form.Item>
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
              name="aadhaarCard"
              rules={[
                // { required: false, message: "Aadhaar number is required", whitespace: true },
                {
                  pattern: /^\d{4}-\d{4}-\d{4}$/,
                  message: "Aadhaar number must be exactly 12 digits",
                },
              ]}
            >
              <Input
                placeholder="Aadhaar Card (9999-9999-9999)"
                maxLength={14}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                  const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1-").trim();

                  form.setFieldValue("aadhaarCard", formatted);
                  form.validateFields(["aadhaarCard"]);
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
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <Form.Item name={["parentDTO", "parentId"]} hidden>
              <Input />
            </Form.Item>
            <Form.Item name={["parentDTO", "studentId"]} hidden>
              <Input />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <Form.Item
                label="Name"
                name={["parentDTO", "name"]}
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input placeholder="Parent name" />
              </Form.Item>
              <Form.Item
                label="Relation"
                name={["parentDTO", "relation"]}
                rules={[{ required: true, message: "Relation is required" }]}
              >
                <Select placeholder="Select relation">
                  <Option value="Father">Father</Option>
                  <Option value="Mother">Mother</Option>
                  <Option value="Guardian">Guardian</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Occupation" name={["parentDTO", "occupation"]}>
                <Input placeholder="Occupation" />
              </Form.Item>
              <Form.Item
                label="Phone"
                name={["parentDTO", "phone"]}
                rules={[
                  { required: true, message: "Phone is required" },

                  { pattern: /^[0-9]{10}$/, message: "Phone number must contain only 10 digits" },
                ]}
              >
                <Input placeholder="Phone number" maxLength={10} />
              </Form.Item>
              <Form.Item label="Email" name={["parentDTO", "email"]}>
                <Input placeholder="Email" />
              </Form.Item>
              <Form.Item label="Annual Income" name={["parentDTO", "annualIncome"]}>
                <InputNumber style={{ width: "100%" }} placeholder="Annual income" />
              </Form.Item>
              <Form.Item
                label="Address"
                name={["parentDTO", "address"]}
                className="md:col-span-2"
              >
                <Input.TextArea rows={2} placeholder="Address" />
              </Form.Item>
            </div>
          </div>
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
                    <div className="flex justify-end">
                      <Button
                        danger
                        type="text"
                        htmlType="button"
                        icon={<DeleteOutlined style={{ fontSize: 18 }} />}
                        onClick={() => remove(name)}
                      />
                    </div>

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
                        label="Division"
                        name={[name, "division"]}
                        rules={[{ required: true, message: "Division required" }]}
                      >
                        <Select placeholder="Select division" allowClear>
                          {staticData?.["division"]?.map((division) => (
                            <Option key={division} value={division}>
                              {division}
                            </Option>
                          ))}
                        </Select>
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
                        label="Medium"
                        name={[name, "medium"]}
                        rules={[{ required: true, message: "Medium required" }]}
                      >
                        <Select placeholder="Select medium" allowClear>
                          {staticData?.["medium"]?.map((medium) => (
                            <Option key={medium} value={medium}>
                              {medium}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        label="Academic Year"
                        name={[name, "academicYear"]}
                        // rules={[{ required: true, message: "Academic year required" }]}
                        initialValue={getCurrentAcademicYear()}
                      >
                        <Input disabled className="bg-gray-100" />
                      </Form.Item>
                    </div>
                  </div>
                ))}
                <Button
                  htmlType="button"
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      admissionNo: undefined,
                      admissionDate: null,
                      standard: undefined,
                      division: undefined,
                      rollNo: "",
                      academicYear: getCurrentAcademicYear(),
                    })
                  }
                  block
                >
                  Add Academic Info
                </Button>
              </>
            )}
          </Form.List>
        </Tabs.TabPane>

        {/* Result (view-only) */}
        {viewOnly && (
          <Tabs.TabPane tab="Result" key="result" forceRender>
            {resultsWatch.length === 0 ? (
              <p className="text-sm text-gray-400">No result published yet.</p>
            ) : (
              <div className="space-y-4">
                {resultsWatch.map((res: any, idx: number) => {
                  const isPass = res.resultStatus === "PASS";
                  return (
                    <div
                      key={res.resultId ?? idx}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {res.examType?.replace(/_/g, " ")}
                            {res.standard ? ` — Std.${String(res.standard).replace(" Standard", "")}` : ""}
                            {res.division ? ` (${res.division})` : ""}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Academic Year: {res.academicYear || "-"}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPass
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-500"
                            }`}
                        >
                          {res.resultStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">Start Date</p>
                          <p className="font-medium text-gray-700">
                            {res.startDate ? dayjs(res.startDate).format("DD-MM-YYYY") : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">End Date</p>
                          <p className="font-medium text-gray-700">
                            {res.endDate ? dayjs(res.endDate).format("DD-MM-YYYY") : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Marks</p>
                          <p className="font-medium text-gray-700">
                            {res.obtainedMarks ?? "-"}/{res.totalMarks ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Percentage / Grade</p>
                          <p className="font-medium text-gray-700">
                            {res.percentage !== undefined ? `${res.percentage}%` : "-"} ({res.grade || "-"})
                          </p>
                        </div>
                      </div>

                      {res.examSubjectsDTOS && res.examSubjectsDTOS.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-gray-100">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500 text-xs">
                                <th className="text-left font-medium px-3 py-2">Subject</th>
                                <th className="text-right font-medium px-3 py-2">Obtained</th>
                                <th className="text-right font-medium px-3 py-2">Max</th>
                                <th className="text-right font-medium px-3 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {res.examSubjectsDTOS.map((subj: any, sIdx: number) => (
                                <tr
                                  key={subj.ExamSubjectsId ?? sIdx}
                                  className="border-t border-gray-100"
                                >
                                  <td className="px-3 py-2 text-gray-700">{subj.subjectName}</td>
                                  <td className="px-3 py-2 text-right text-gray-800 font-medium">
                                    {subj.obtainedMarks}
                                  </td>
                                  <td className="px-3 py-2 text-right text-gray-500">
                                    {subj.maximumMarks}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span
                                      className={`text-xs font-semibold ${subj.status === "PASS" ? "text-green-600" : "text-red-500"
                                        }`}
                                    >
                                      {subj.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Tabs.TabPane>
        )}
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

          {activeTab !== tabKeys[tabKeys.length - 1] ? (
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
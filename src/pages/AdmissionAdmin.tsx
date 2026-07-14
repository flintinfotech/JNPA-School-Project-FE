import { useEffect, useRef, useState } from "react";
import {
  Form,
  Tabs,
  Input,
  Button,
  Space,
  Divider,
  message,
  Select,
  Spin,
  Card,
  Row,
  Col,
  Typography,
  Upload,
  Empty,
} from "antd";
import { PlusOutlined, MinusCircleOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

import { useAuth } from "../hooks/useAuth";
import { getAllAdmissionsByFilter, saveAdmission, updateAdmission, type AdmissionDTO } from "../services/AdmissionService";

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title } = Typography;

const HALF_COL = { xs: 24, md: 12 };
const QUARTER_COL = { xs: 24, sm: 12, lg: 6 };

// ---------------------------------------------------------------------------
// base64 helpers (same approach as ExamAndResult)
// ---------------------------------------------------------------------------
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = (err) => reject(err);
  });

const base64ToByteArray = (base64: string): Uint8Array => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Uint8Array(byteNumbers);
};

const detectMimeType = (bytes: Uint8Array): string => {
  const hex = Array.from(bytes.slice(0, 4))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hex.startsWith("25504446")) return "application/pdf";
  if (hex.startsWith("89504e47")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("47494638")) return "image/gif";
  return "application/octet-stream";
};

const extensionForMime = (mime: string): string => {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
};

const buildUploadFileFromBase64 = (base64: string, uid: string, fileName: string): UploadFile => {
  const byteArray = base64ToByteArray(base64);
  const mimeType = detectMimeType(byteArray);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const name = fileName && fileName.includes(".") ? fileName : `${fileName || "file"}.${extensionForMime(mimeType)}`;
  return { uid, name, status: "done", url } as UploadFile;
};

// ---------------------------------------------------------------------------
// Tab configuration - identical structure to ExamAndResult
// ---------------------------------------------------------------------------
type TabConfig = {
  key: string;
  label: string;
  classRoomName: string;
  medium?: string;
};

const TAB_CONFIGS: TabConfig[] = [
  { key: "prePrimary", label: "Pre-Primary", classRoomName: "Pre-Primary", medium: "English" },
  { key: "primaryEnglish", label: "Primary - English", classRoomName: "Primary", medium: "English" },
  { key: "primaryMarathi", label: "Primary - Marathi", classRoomName: "Primary", medium: "Marathi" },
  { key: "secondaryEnglish", label: "Secondary - English", classRoomName: "Secondary", medium: "English" },
  { key: "secondaryMarathi", label: "Secondary - Marathi", classRoomName: "Secondary", medium: "Marathi" },
];

// ---------------------------------------------------------------------------
// Auth / role wiring - same shape as ExamAndResult
// ---------------------------------------------------------------------------
type UserAssignment = {
  role: "ADMIN" | "TEACHER" | string;
  assignedClassRoomName?: string;
  assignedMedium?: string;
};

function useUserAssignment(): UserAssignment {
  const { user } = useAuth();

  if (!user) return { role: "GUEST" };

  return {
    role: user.role,
    assignedClassRoomName: user.section ?? undefined,
    assignedMedium: user.medium ?? undefined,
  };
}

export default function AdmissionAdmin() {
  const assignment = useUserAssignment();

  const visibleTabs =
    assignment.role === "TEACHER"
      ? TAB_CONFIGS.filter(
        (tab) =>
          tab.classRoomName === assignment.assignedClassRoomName &&
          tab.medium === assignment.assignedMedium
      )
      : TAB_CONFIGS;

  if (assignment.role === "TEACHER" && visibleTabs.length === 0) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 60 }}>
        <Empty description="No section/medium has been assigned to your account yet. Please contact the admin." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Tabs defaultActiveKey={visibleTabs[0]?.key} size="large" destroyInactiveTabPane>
        {visibleTabs.map((tab) => (
          <TabPane tab={tab.label} key={tab.key}>
            <AdmissionSection classRoomName={tab.classRoomName} medium={tab.medium} title={tab.label} />
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
}

function AdmissionSection({
  classRoomName,
  medium,
  title,
}: {
  classRoomName: string;
  medium?: string;
  title: string;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admissionId, setAdmissionId] = useState<number | undefined>();

  const [brochureFileList, setBrochureFileList] = useState<UploadFile[]>([]);

  const fetchedForRef = useRef<string | null>(null);

  // Real DB ids for existing nested entities, indexed by array position -
  // same reasoning as ExamAndResult: Form.List + hidden fields is unreliable
  // for carrying ids through to submit.
  const idsRef = useRef<{
    admissionProcess: { admissionProcessId?: number; admissionId?: number }[];
    eligibilityCriteria: { eligibilityCriteriaId?: number; admissionId?: number }[];
    importantDates: { importantDateId?: number; admissionId?: number }[];
    requiredDocuments: { requiredDocumentId?: number; admissionId?: number }[];
  }>({ admissionProcess: [], eligibilityCriteria: [], importantDates: [], requiredDocuments: [] });

  useEffect(() => {
    const fetchKey = `${classRoomName}__${medium ?? ""}`;
    if (fetchedForRef.current === fetchKey) return;
    fetchedForRef.current = fetchKey;

    setLoading(true);

    getAllAdmissionsByFilter(0, 10)
      .then((res) => {
        const list = res.data?.data?.AdmissionDTOS ?? [];

        const existing = list.find((a: any) => {
          const nameMatches =
            (a.classRoomName ?? "").trim().toLowerCase() === classRoomName.trim().toLowerCase();
          if (!nameMatches) return false;
          if (medium === undefined) return true;
          return (a.medium ?? "").trim().toLowerCase() === medium.trim().toLowerCase();
        });

        if (existing) {
          setAdmissionId(existing.admissionId);

          form.setFieldsValue({
            classRoomName: existing.classRoomName,
            academicYearName: existing.academicYearName,
            medium: medium ?? existing.medium,
            admissionProcessDTOS: existing.admissionProcessDTOS ?? [],
            eligibilityCriteriaDTOS: existing.eligibilityCriteriaDTOS ?? [],
            importantDateDTOS: existing.importantDateDTOS ?? [],
            requiredDocumentDTOS: existing.requiredDocumentDTOS ?? [],
          });

          idsRef.current = {
            admissionProcess: (existing.admissionProcessDTOS ?? []).map((p: any) => ({
              admissionProcessId: p.admissionProcessId,
              admissionId: p.admissionId,
            })),
            eligibilityCriteria: (existing.eligibilityCriteriaDTOS ?? []).map((e: any) => ({
              eligibilityCriteriaId: e.eligibilityCriteriaId,
              admissionId: e.admissionId,
            })),
            importantDates: (existing.importantDateDTOS ?? []).map((d: any) => ({
              importantDateId: d.importantDateId,
              admissionId: d.admissionId,
            })),
            requiredDocuments: (existing.requiredDocumentDTOS ?? []).map((r: any) => ({
              requiredDocumentId: r.requiredDocumentId,
              admissionId: r.admissionId,
            })),
          };

          if (existing.brochure) {
            form.setFieldValue("brochure", existing.brochure);
            setBrochureFileList([
              buildUploadFileFromBase64(existing.brochure, "brochure", "brochure"),
            ]);
          } else {
            setBrochureFileList([]);
          }
        } else {
          setAdmissionId(undefined);
          idsRef.current = { admissionProcess: [], eligibilityCriteria: [], importantDates: [], requiredDocuments: [] };
          setBrochureFileList([]);
          form.resetFields();
          form.setFieldsValue({
            classRoomName,
            medium,
            admissionProcessDTOS: [],
            eligibilityCriteriaDTOS: [],
            importantDateDTOS: [],
            requiredDocumentDTOS: [],
          });
        }
      })
      .catch(() => {
        message.error(`Failed to load ${title} data`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [classRoomName, medium, form, title]);

  const handleBrochureChange = async (info: { fileList: UploadFile[] }) => {
    const file = info.fileList[info.fileList.length - 1];

    if (!file) {
      setBrochureFileList([]);
      form.setFieldValue("brochure", null);
      return;
    }

    if (file.originFileObj) {
      const base64 = await fileToBase64(file.originFileObj as File);
      form.setFieldValue("brochure", base64);
      file.url = URL.createObjectURL(file.originFileObj as File);
    }

    setBrochureFileList([file]);
  };

  const handleFinish = async (values: any) => {
    setSaving(true);

    const admissionProcessDTOS = (values.admissionProcessDTOS || []).map((p: any, idx: number) => {
      const orig = idsRef.current.admissionProcess[idx];
      return {
        ...(orig?.admissionProcessId ? { admissionProcessId: orig.admissionProcessId } : {}),
        ...(orig?.admissionId ? { admissionId: orig.admissionId } : {}),
        stepNo: p.stepNo,
        heading: p.heading,
        description: p.description,
      };
    });

    const eligibilityCriteriaDTOS = (values.eligibilityCriteriaDTOS || []).map((e: any, idx: number) => {
      const orig = idsRef.current.eligibilityCriteria[idx];
      return {
        ...(orig?.eligibilityCriteriaId ? { eligibilityCriteriaId: orig.eligibilityCriteriaId } : {}),
        ...(orig?.admissionId ? { admissionId: orig.admissionId } : {}),
        title: e.title,
        description: e.description,
      };
    });

    const importantDateDTOS = (values.importantDateDTOS || []).map((d: any, idx: number) => {
      const orig = idsRef.current.importantDates[idx];
      return {
        ...(orig?.importantDateId ? { importantDateId: orig.importantDateId } : {}),
        ...(orig?.admissionId ? { admissionId: orig.admissionId } : {}),
        eventName: d.eventName,
        eventDate: d.eventDate,
      };
    });

    const requiredDocumentDTOS = (values.requiredDocumentDTOS || []).map((r: any, idx: number) => {
      const orig = idsRef.current.requiredDocuments[idx];
      return {
        ...(orig?.requiredDocumentId ? { requiredDocumentId: orig.requiredDocumentId } : {}),
        ...(orig?.admissionId ? { admissionId: orig.admissionId } : {}),
        documentName: r.documentName,
      };
    });

    const payload: AdmissionDTO = {
      classRoomName: values.classRoomName,
      academicYearName: values.academicYearName,
      // Same lock-to-tab logic as ExamAndResult's medium handling.
      medium: medium ?? values.medium,
      brochure: values.brochure ?? null,
      admissionProcessDTOS,
      eligibilityCriteriaDTOS,
      importantDateDTOS,
      requiredDocumentDTOS,
    };

    try {
      let res;
      if (admissionId) {
        res = await updateAdmission({ ...payload, admissionId });
      } else {
        res = await saveAdmission(payload);
      }

      if (res.data?.success === false) {
        message.error(res.data?.message || `Failed to save ${title} details`);
        return;
      }

      setAdmissionId(res.data.data.admissionId);
      message.success(`${title} admission details saved`);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      message.error(backendMessage || `Failed to save ${title} details`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <Spin tip={`Loading ${title} data...`} />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      {/* Section 1: core admission summary fields */}
      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Row gutter={16}>
          <Col {...HALF_COL}>
            <Form.Item label="Section Name" name="classRoomName" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>
          </Col>
          <Col {...HALF_COL}>
            <Form.Item
              label="Academic Year Name"
              name="academicYearName"
              rules={[{ required: true, message: "Academic year name required" }]}
            >
              <Input placeholder="e.g. 2026-2027" />
            </Form.Item>
          </Col>
          <Col {...HALF_COL}>
            <Form.Item
              label="Medium"
              name="medium"
              rules={[{ required: true, message: "Please select a medium" }]}
            >
              <Select
                placeholder="Select medium"
                disabled={medium !== undefined}
                options={[
                  { value: "English", label: "English" },
                  { value: "Marathi", label: "Marathi" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Section 2: admissionProcessDTOS */}
      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: "24px" }}>
          Admission Process
        </Title>
        <Form.List name="admissionProcessDTOS">
          {(fields, { add, remove }) => (
            <>
              <Row gutter={[16, 16]}>
                {fields.map((field) => (
                  <Col {...HALF_COL} key={field.key}>
                    <div
                      style={{
                        padding: 16,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        background: "#fafafa",
                        height: "100%",
                      }}
                    >
                      <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
                        <Form.Item
                          {...field}
                          name={[field.name, "stepNo"]}
                          rules={[{ required: true, message: "Step no. required" }]}
                          style={{ marginBottom: 8, width: 90 }}
                        >
                          <Input placeholder="Step No." />
                        </Form.Item>
                        <MinusCircleOutlined
                          onClick={() => {
                            idsRef.current.admissionProcess.splice(field.name, 1);
                            remove(field.name);
                          }}
                          style={{ marginLeft: 8 }}
                        />
                      </Space>
                      <Form.Item
                        {...field}
                        name={[field.name, "heading"]}
                        rules={[{ required: true, message: "Heading required" }]}
                      >
                        <Input placeholder="e.g. Application Form" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "description"]}
                        rules={[{ required: true, message: "Description required" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea rows={2} placeholder="e.g. Fill out and submit the admission application form." />
                      </Form.Item>
                    </div>
                  </Col>
                ))}
              </Row>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: 16 }}>
                Add Admission Process Step
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Section 3: eligibilityCriteriaDTOS */}
      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: "24px" }}>
          Eligibility Criteria
        </Title>
        <Form.List name="eligibilityCriteriaDTOS">
          {(fields, { add, remove }) => (
            <>
              <Row gutter={[16, 16]}>
                {fields.map((field) => (
                  <Col {...HALF_COL} key={field.key}>
                    <div
                      style={{
                        padding: 16,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        background: "#FFF7ED",
                        height: "100%",
                      }}
                    >
                      <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
                        <Form.Item
                          {...field}
                          name={[field.name, "title"]}
                          rules={[{ required: true, message: "Title required" }]}
                          style={{ marginBottom: 8, flex: 1 }}
                        >
                          <Input placeholder="e.g. Minimum Age" />
                        </Form.Item>
                        <MinusCircleOutlined
                          onClick={() => {
                            idsRef.current.eligibilityCriteria.splice(field.name, 1);
                            remove(field.name);
                          }}
                          style={{ marginLeft: 8 }}
                        />
                      </Space>
                      <Form.Item
                        {...field}
                        name={[field.name, "description"]}
                        rules={[{ required: true, message: "Description required" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea rows={2} placeholder="e.g. Student should be at least 6 years old." />
                      </Form.Item>
                    </div>
                  </Col>
                ))}
              </Row>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: 16 }}>
                Add Eligibility Criteria
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Section 4: importantDateDTOS */}
      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: "24px" }}>
          Important Dates
        </Title>
        <Form.List name="importantDateDTOS">
          {(fields, { add, remove }) => (
            <>
              <Row gutter={[16, 16]}>
                {fields.map((field) => (
                  <Col {...HALF_COL} key={field.key}>
                    <div
                      style={{
                        padding: 16,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        background: "#fafafa",
                        height: "100%",
                      }}
                    >
                      <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
                        <Form.Item
                          {...field}
                          name={[field.name, "eventName"]}
                          rules={[{ required: true, message: "Event name required" }]}
                          style={{ marginBottom: 8, flex: 1 }}
                        >
                          <Input placeholder="e.g. Admission Form Start" />
                        </Form.Item>
                        <MinusCircleOutlined
                          onClick={() => {
                            idsRef.current.importantDates.splice(field.name, 1);
                            remove(field.name);
                          }}
                          style={{ marginLeft: 8 }}
                        />
                      </Space>
                      <Form.Item
                        {...field}
                        name={[field.name, "eventDate"]}
                        rules={[{ required: true, message: "Event date required" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input type="date" />
                      </Form.Item>
                    </div>
                  </Col>
                ))}
              </Row>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: 16 }}>
                Add Important Date
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Section 5: requiredDocumentDTOS */}
      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: "24px" }}>
          Documents Required
        </Title>
        <Form.List name="requiredDocumentDTOS">
          {(fields, { add, remove }) => (
            <>
              <Row gutter={[12, 12]}>
                {fields.map((field) => (
                  <Col {...QUARTER_COL} key={field.key}>
                    <Space.Compact style={{ width: "100%" }}>
                      <Form.Item
                        {...field}
                        name={[field.name, "documentName"]}
                        rules={[{ required: true, message: "Document name required" }]}
                        style={{ marginBottom: 0, width: "100%" }}
                      >
                        <Input placeholder="e.g. Birth Certificate" />
                      </Form.Item>
                      <Button
                        icon={<MinusCircleOutlined />}
                        onClick={() => {
                          idsRef.current.requiredDocuments.splice(field.name, 1);
                          remove(field.name);
                        }}
                      />
                    </Space.Compact>
                  </Col>
                ))}
              </Row>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: 16 }}>
                Add Document
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Section 6: brochure */}
      <Card variant="borderless" style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: "24px" }}>
          Upload Brochure
        </Title>
        <Form.Item name="brochure" hidden>
          <Input />
        </Form.Item>
        <Upload
          maxCount={1}
          accept=".pdf,image/*"
          fileList={brochureFileList}
          beforeUpload={() => false}
          onChange={handleBrochureChange}
          onPreview={(file) => {
            if (file.url) window.open(file.url, "_blank");
          }}
        >
          <Button icon={<UploadOutlined />}>Upload Brochure</Button>
        </Upload>
      </Card>

      <Divider />
      <Button type="primary" htmlType="submit" size="large" loading={saving}>
        Save {title}
      </Button>
    </Form>
  );
}
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

import {
  saveExam,
  updateExam,
  getAllExamsByFilter,
  type ExamDTO,
} from "../services/ExamResultService"; // adjust path to match your project structure
import { useAuth } from "../hooks/useAuth";

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title, Text } = Typography;

const HALF_COL = { xs: 24, md: 12 };
const QUARTER_COL = { xs: 24, sm: 12, lg: 6 };

// ---------------------------------------------------------------------------
// base64 helpers (same approach as AcademicsForm)
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

// Rebuilds a previewable UploadFile from stored base64 + a name that came
// from the backend (resultName / noticeName), falling back to a sniffed
// extension only if the stored name has none.
const buildUploadFileFromBase64 = (base64: string, uid: string, fileName: string): UploadFile => {
  const byteArray = base64ToByteArray(base64);
  const mimeType = detectMimeType(byteArray);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const name = fileName && fileName.includes(".") ? fileName : `${fileName || "file"}.${extensionForMime(mimeType)}`;
  return { uid, name, status: "done", url } as UploadFile;
};

// ---------------------------------------------------------------------------
// Tab configuration - identical structure to AcademicsForm
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
// Auth / role wiring - same shape as AcademicsForm
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

export default function ExamAndResult() {
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
            <ExamSection classRoomName={tab.classRoomName} medium={tab.medium} title={tab.label} />
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
}

function ExamSection({
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
  const [examId, setExamId] = useState<number | undefined>();

  // Upload fileLists keyed by Form.List field key, for examResultDTOS / examNoticeDTOS
  const [resultFileLists, setResultFileLists] = useState<Record<string, UploadFile[]>>({});
  const [noticeFileLists, setNoticeFileLists] = useState<Record<string, UploadFile[]>>({});
  const [topperImageLists, setTopperImageLists] = useState<Record<string, UploadFile[]>>({});

  const fetchedForRef = useRef<string | null>(null);

  // Real DB ids for existing nested entities, indexed by array position -
  // same reasoning as AcademicsForm: Form.List + hidden fields is unreliable
  // for carrying ids through to submit.
  const idsRef = useRef<{
    examResults: { examResultId?: number; examId?: number }[];
    examNotices: { examNoticeId?: number; examId?: number }[];
    toppers: { topperId?: number; examId?: number }[];
  }>({ examResults: [], examNotices: [], toppers: [] });

  useEffect(() => {
    const fetchKey = `${classRoomName}__${medium ?? ""}`;
    if (fetchedForRef.current === fetchKey) return;
    fetchedForRef.current = fetchKey;

    setLoading(true);

    getAllExamsByFilter(0, 10, { classRoomName, medium: medium as "English" | "Marathi" | undefined })
      .then((res) => {
        const list = res.data?.data?.examDTOS ?? [];

        const existing = list.find((e: any) => {
          const nameMatches =
            (e.classRoomName ?? "").trim().toLowerCase() === classRoomName.trim().toLowerCase();
          if (!nameMatches) return false;
          if (medium === undefined) return true;
          return (e.medium ?? "").trim().toLowerCase() === medium.trim().toLowerCase();
        });

        if (existing) {
          setExamId(existing.examId);

          form.setFieldsValue({
            classRoomName: existing.classRoomName,
            academicYearName: existing.academicYearName,
            medium: medium ?? existing.medium,
            result10th: existing.result10th,
            result12th: existing.result12th,
            studentScoring90: existing.studentScoring90,
            universityRank: existing.universityRank,
            examResultDTOS: existing.examResultDTOS ?? [],
            examNoticeDTOS: existing.examNoticeDTOS ?? [],
            toppersDTOS: existing.toppersDTOS ?? [],
          });

          idsRef.current = {
            examResults: (existing.examResultDTOS ?? []).map((r: any) => ({
              examResultId: r.examResultId,
              examId: r.examId,
            })),
            examNotices: (existing.examNoticeDTOS ?? []).map((n: any) => ({
              examNoticeId: n.examNoticeId,
              examId: n.examId,
            })),
            toppers: (existing.toppersDTOS ?? []).map((t: any) => ({
              topperId: t.topperId,
              examId: t.examId,
            })),
          };

          const initialTopperImages: Record<string, UploadFile[]> = {};
          (existing.toppersDTOS ?? []).forEach((t: any, idx: number) => {
            if (t.studentImage) {
              initialTopperImages[String(idx)] = [
                buildUploadFileFromBase64(t.studentImage, `topper-${idx}`, `${t.userName || "student"}.jpg`),
              ];
            }
          });
          setTopperImageLists(initialTopperImages);

          const initialResultFiles: Record<string, UploadFile[]> = {};
          (existing.examResultDTOS ?? []).forEach((r: any, idx: number) => {
            if (r.resultData) {
              initialResultFiles[String(idx)] = [
                buildUploadFileFromBase64(r.resultData, `result-${idx}`, r.resultName),
              ];
            }
          });
          setResultFileLists(initialResultFiles);

          const initialNoticeFiles: Record<string, UploadFile[]> = {};
          (existing.examNoticeDTOS ?? []).forEach((n: any, idx: number) => {
            if (n.noticeData) {
              initialNoticeFiles[String(idx)] = [
                buildUploadFileFromBase64(n.noticeData, `notice-${idx}`, n.noticeName),
              ];
            }
          });
          setNoticeFileLists(initialNoticeFiles);
        } else {
          setExamId(undefined);
          idsRef.current = { examResults: [], examNotices: [], toppers: [] };
          setResultFileLists({});
          setNoticeFileLists({});
          form.resetFields();
          form.setFieldsValue({
            classRoomName,
            medium,
            examResultDTOS: [],
            examNoticeDTOS: [],
            toppersDTOS: [],
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

  const handleResultFileChange = async (
    fieldName: number,
    entryKey: string,
    info: { fileList: UploadFile[] }
  ) => {
    const file = info.fileList[info.fileList.length - 1];

    if (!file) {
      setResultFileLists((prev) => ({ ...prev, [entryKey]: [] }));
      form.setFieldValue(["examResultDTOS", fieldName, "resultData"], null);
      return;
    }

    if (file.originFileObj) {
      const base64 = await fileToBase64(file.originFileObj as File);
      form.setFieldValue(["examResultDTOS", fieldName, "resultData"], base64);
      // Auto-fill resultName from the uploaded file if left empty
      if (!form.getFieldValue(["examResultDTOS", fieldName, "resultName"])) {
        form.setFieldValue(["examResultDTOS", fieldName, "resultName"], file.name);
      }
      file.url = URL.createObjectURL(file.originFileObj as File);
    }

    setResultFileLists((prev) => ({ ...prev, [entryKey]: [file] }));
  };

  const handleNoticeFileChange = async (
    fieldName: number,
    entryKey: string,
    info: { fileList: UploadFile[] }
  ) => {
    const file = info.fileList[info.fileList.length - 1];

    if (!file) {
      setNoticeFileLists((prev) => ({ ...prev, [entryKey]: [] }));
      form.setFieldValue(["examNoticeDTOS", fieldName, "noticeData"], null);
      return;
    }

    if (file.originFileObj) {
      const base64 = await fileToBase64(file.originFileObj as File);
      form.setFieldValue(["examNoticeDTOS", fieldName, "noticeData"], base64);
      if (!form.getFieldValue(["examNoticeDTOS", fieldName, "noticeName"])) {
        form.setFieldValue(["examNoticeDTOS", fieldName, "noticeName"], file.name);
      }
      file.url = URL.createObjectURL(file.originFileObj as File);
    }

    setNoticeFileLists((prev) => ({ ...prev, [entryKey]: [file] }));
  };

  const handleTopperImageChange = async (
    fieldName: number,
    entryKey: string,
    info: { fileList: UploadFile[] }
  ) => {
    const file = info.fileList[info.fileList.length - 1];

    if (!file) {
      setTopperImageLists((prev) => ({ ...prev, [entryKey]: [] }));
      form.setFieldValue(["toppersDTOS", fieldName, "studentImage"], null);
      return;
    }

    if (file.originFileObj) {
      const base64 = await fileToBase64(file.originFileObj as File);
      form.setFieldValue(["toppersDTOS", fieldName, "studentImage"], base64);
      file.url = URL.createObjectURL(file.originFileObj as File);
    }

    setTopperImageLists((prev) => ({ ...prev, [entryKey]: [file] }));
  };

  const handleFinish = async (values: any) => {
    setSaving(true);

    const examResultDTOS = (values.examResultDTOS || []).map((r: any, idx: number) => {
      const orig = idsRef.current.examResults[idx];
      return {
        ...(orig?.examResultId ? { examResultId: orig.examResultId } : {}),
        ...(orig?.examId ? { examId: orig.examId } : {}),
        resultName: r.resultName,
        resultData: r.resultData ?? null,
      };
    });

    const examNoticeDTOS = (values.examNoticeDTOS || []).map((n: any, idx: number) => {
      const orig = idsRef.current.examNotices[idx];
      return {
        ...(orig?.examNoticeId ? { examNoticeId: orig.examNoticeId } : {}),
        ...(orig?.examId ? { examId: orig.examId } : {}),
        noticeName: n.noticeName,
        noticeData: n.noticeData ?? null,
      };
    });

    const toppersDTOS = (values.toppersDTOS || []).map((t: any, idx: number) => {
      const orig = idsRef.current.toppers[idx];
      return {
        ...(orig?.topperId ? { topperId: orig.topperId } : {}),
        ...(orig?.examId ? { examId: orig.examId } : {}),
        section: t.section,
        medium: t.medium,
        userName: t.userName,
        std: t.std,
        description: t.description,
        studentImage: t.studentImage ?? null, // ← add this line
      };
    });

    const payload: ExamDTO = {
      classRoomName: values.classRoomName,
      academicYearName: values.academicYearName,
      // Same lock-to-tab logic as AcademicsForm's medium handling.
      medium: medium ?? values.medium,
      result10th: values.result10th,
      result12th: values.result12th,
      studentScoring90: values.studentScoring90,
      universityRank: values.universityRank,
      examResultDTOS,
      examNoticeDTOS,
      toppersDTOS,
    };

    try {
      let res;
      if (examId) {
        res = await updateExam({ ...payload, examId });
      } else {
        res = await saveExam(payload);
      }

      if (res.data?.success === false) {
        message.error(res.data?.message || `Failed to save ${title} details`);
        return;
      }

      setExamId(res.data.data.examId);
      message.success(`${title} exam & result details saved`);
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
      {/* Section 1: core exam summary fields */}
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
              <Input placeholder="e.g. 2025-2026" />
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
          <Col {...QUARTER_COL}>
            <Form.Item label="10th Result" name="result10th">
              <Input placeholder="e.g. 98%" />
            </Form.Item>
          </Col>
          <Col {...QUARTER_COL}>
            <Form.Item label="12th Result" name="result12th">
              <Input placeholder="e.g. 96%" />
            </Form.Item>
          </Col>
          <Col {...QUARTER_COL}>
            <Form.Item label="Students Scoring 90%+" name="studentScoring90">
              <Input placeholder="e.g. 45" />
            </Form.Item>
          </Col>
          <Col {...QUARTER_COL}>
            <Form.Item label="University Rank" name="universityRank">
              <Input placeholder="e.g. 5" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Section 2: examResultDTOS */}
      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: "24px" }}>
          Exam Results
        </Title>
        <Form.List name="examResultDTOS">
          {(fields, { add, remove }) => (
            <>
              <Row gutter={[16, 16]}>
                {fields.map((field) => {
                  const entryKey = String(field.name);
                  return (
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
                        <Form.Item name={[field.name, "resultData"]} hidden>
                          <Input />
                        </Form.Item>
                        <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
                          <Form.Item
                            {...field}
                            name={[field.name, "resultName"]}
                            rules={[{ required: true, message: "Result name required" }]}
                            style={{ marginBottom: 8, flex: 1 }}
                          >
                            <Input placeholder="e.g. SSC_Result_2025.pdf" />
                          </Form.Item>
                          <MinusCircleOutlined
                            onClick={() => {
                              idsRef.current.examResults.splice(field.name, 1);
                              remove(field.name);
                            }}
                            style={{ marginLeft: 8 }}
                          />
                        </Space>
                        <Upload
                          maxCount={1}
                          accept=".pdf"
                          fileList={resultFileLists[entryKey] ?? []}
                          beforeUpload={() => false}
                          onChange={(info) => handleResultFileChange(field.name, entryKey, info)}
                          onPreview={(file) => {
                            if (file.url) window.open(file.url, "_blank");
                          }}
                        >
                          <Button icon={<UploadOutlined />}>Upload Result</Button>
                        </Upload>
                      </div>
                    </Col>
                  );
                })}
              </Row>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: 16 }}>
                Add Exam Result
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Section 3: examNoticeDTOS */}
      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: "24px" }}>
          Exam Notices
        </Title>
        <Form.List name="examNoticeDTOS">
          {(fields, { add, remove }) => (
            <>
              <Row gutter={[16, 16]}>
                {fields.map((field) => {
                  const entryKey = String(field.name);
                  return (
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
                        <Form.Item name={[field.name, "noticeData"]} hidden>
                          <Input />
                        </Form.Item>
                        <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
                          <Form.Item
                            {...field}
                            name={[field.name, "noticeName"]}
                            rules={[{ required: true, message: "Notice name required" }]}
                            style={{ marginBottom: 8, flex: 1 }}
                          >
                            <Input placeholder="e.g. Exam_Schedule.pdf" />
                          </Form.Item>
                          <MinusCircleOutlined
                            onClick={() => {
                              idsRef.current.examNotices.splice(field.name, 1);
                              remove(field.name);
                            }}
                            style={{ marginLeft: 8 }}
                          />
                        </Space>
                        <Upload
                          maxCount={1}
                          accept=".pdf"
                          fileList={noticeFileLists[entryKey] ?? []}
                          beforeUpload={() => false}
                          onChange={(info) => handleNoticeFileChange(field.name, entryKey, info)}
                          onPreview={(file) => {
                            if (file.url) window.open(file.url, "_blank");
                          }}
                        >
                          <Button icon={<UploadOutlined />}>Upload Notice</Button>
                        </Upload>
                      </div>
                    </Col>
                  );
                })}
              </Row>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: 16 }}>
                Add Exam Notice
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Section 4: toppersDTOS */}
      <Card variant="borderless" style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <Title level={5} style={{ marginTop: 0, marginBottom: 16, fontSize: "24px" }}>
          Toppers
        </Title>
        <Form.List name="toppersDTOS">
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
                          name={[field.name, "userName"]}
                          rules={[{ required: true, message: "Student name required" }]}
                          style={{ marginBottom: 8, flex: 1 }}
                        >
                          <Input placeholder="e.g. Rahul Sharma" />
                        </Form.Item>
                        <MinusCircleOutlined
                          onClick={() => {
                            idsRef.current.toppers.splice(field.name, 1);
                            remove(field.name);
                          }}
                          style={{ marginLeft: 8 }}
                        />
                      </Space>
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            name={[field.name, "section"]}
                            rules={[{ required: true, message: "Section required" }]}
                          >
                            <Input placeholder="e.g. A" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            name={[field.name, "std"]}
                            rules={[{ required: true, message: "Standard required" }]}
                          >
                            <Input placeholder="e.g. 10" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item {...field} name={[field.name, "studentImage"]} hidden>
                        <Input />
                      </Form.Item>

                      <Row gutter={12} align="middle" style={{ marginBottom: 16 }}>
                        <Col span={16}>
                          <Form.Item
                            {...field}
                            name={[field.name, "medium"]}
                            rules={[{ required: true, message: "Medium required" }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              placeholder="Select medium"
                              options={[
                                { value: "English", label: "English" },
                                { value: "Marathi", label: "Marathi" },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Upload
                            maxCount={1}
                            accept="image/*"
                            listType="picture-card"
                            fileList={topperImageLists[String(field.name)] ?? []}
                            beforeUpload={() => false}
                            onChange={(info) => handleTopperImageChange(field.name, String(field.name), info)}
                            onPreview={(file) => {
                              if (file.url) window.open(file.url, "_blank");
                            }}
                          >
                            {(topperImageLists[String(field.name)] ?? []).length === 0 && (
                              <div><PlusOutlined /><div style={{ marginTop: 4 }}>Photo</div></div>
                            )}
                          </Upload>
                        </Col>
                      </Row>
                      <Form.Item {...field} name={[field.name, "description"]} style={{ marginBottom: 0 }}>
                        <TextArea rows={2} placeholder="e.g. School Topper - 98.6%" />
                      </Form.Item>
                    </div>
                  </Col>
                ))}
              </Row>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: 16 }}>
                Add Topper
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      <Divider />
      <Button type="primary" htmlType="submit" size="large" loading={saving}>
        Save {title}
      </Button>
    </Form>
  );
}
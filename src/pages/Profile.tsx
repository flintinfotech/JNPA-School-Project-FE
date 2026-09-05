import { useEffect, useState } from "react";
import {
  Spin,
  Empty,
  message,
  Tabs,
  Modal,
  Form,
  Input,
  DatePicker,
  Upload,
  Button,
  Tooltip,
  Popconfirm,
  Card,
  Divider,
  Tag,
} from "antd";
import {
  PaperClipOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";
import { getEmployeeDetailsById } from "../services/userService";
import { getSubjectsByEmployeeDetailsId } from "../services/teacherSubjectService";

// ===========================
// Types (matches actual API response)
// ===========================

interface LoggedInUser {
  userId: number;
  userName: string;
  role: string;
  medium?: string | null;
  standard?: string | null;
  section?: string | null;
  division?: string | null;
  academicYear?: string | null;
}

interface UserDocumentDTO {
  userDocumentId: number;
  employeeDetailsId: number;
  documentName: string;
  documentType: string | null;
  uploadDate: string;
  document: string; // base64
}

interface TeacherInformation {
  employeeDetailsId: number;
  userId: number;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  designation?: string;
  experience?: number;
  qualification?: string;
  specialization?: string;
  joiningDate?: string;
  employeeCode?: string;
  bloodGroup?: string;
  address?: string;
  userDocumentDTOS?: UserDocumentDTO[];
}

interface SubjectDTO {
  subjectMasterId: number;
  subjectName: string;
  subjectCode: string;
}

interface ClassSubjectGroup {
  classMasterId: string;
  standard: string;
  division: string;
  medium: string;
  subjects: SubjectDTO[];
}

// Homework record (matches homework API response)
interface HomeworkRecord {
  homeworkId: number;
  subject: string;
  standard: string;
  division: string;
  medium: string;
  academicYear: string;
  homeworkDate: string;
  remark: string | null;
  uploadedFile: string | null; // base64
}

// The API returns subjects grouped under a key that encodes the class,
// e.g. "classMasterId=5, standard=10, division=A, medium=English"
const parseClassMasterKey = (key: string) => {
  const idMatch = key.match(/classMasterId=([^,]+)/);
  const standardMatch = key.match(/standard=([^,]+)/);
  const divisionMatch = key.match(/division=([^,]+)/);
  const mediumMatch = key.match(/medium=([^)]+)/);

  return {
    classMasterId: idMatch ? idMatch[1].trim() : "-",
    standard: standardMatch ? standardMatch[1].trim() : "-",
    division: divisionMatch ? divisionMatch[1].trim() : "-",
    medium: mediumMatch ? mediumMatch[1].trim() : "-",
  };
};

// ===========================
// Document / base64 helpers (shared by Documents tab + Homework attachment)
// ===========================

const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:.*;base64,/, "").replace(/[\r\n\s]/g, "");
};

const detectMimeFromBase64 = (rawBase64: string): string => {
  const signature = rawBase64.substring(0, 12);

  if (signature.startsWith("JVBERi0")) return "application/pdf";
  if (signature.startsWith("iVBORw0KGgo")) return "image/png";
  if (signature.startsWith("/9j/")) return "image/jpeg";
  if (signature.startsWith("R0lGOD")) return "image/gif";
  if (signature.startsWith("UEsDB"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (signature.startsWith("0M8R4K")) return "application/msword";

  return "application/octet-stream";
};

const extensionForMime = (mime: string) => {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/gif") return "gif";
  if (mime.includes("wordprocessingml")) return "docx";
  if (mime === "application/msword") return "doc";
  return "file";
};

// Decode a raw base64 string into a blob URL (detects real file type from bytes)
const base64ToBlobUrl = (rawBase64: string): { url: string; mime: string } => {
  const cleaned = cleanBase64(rawBase64);
  const mime = detectMimeFromBase64(cleaned);

  const byteCharacters = atob(cleaned);
  const byteArrays: Uint8Array[] = [];
  const sliceSize = 1024;

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  const blob = new Blob(byteArrays, { type: mime });
  return { url: URL.createObjectURL(blob), mime };
};

const openDocument = (doc: UserDocumentDTO) => {
  if (!doc.document) {
    console.warn("No document data for", doc.documentName);
    return;
  }
  try {
    const { url } = base64ToBlobUrl(doc.document);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    console.error("Failed to decode/open document:", err);
  }
};

const openBase64File = (rawBase64: string) => {
  try {
    const { url } = base64ToBlobUrl(rawBase64);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    console.error("Failed to decode/open file:", err);
    message.error("Unable to open file");
  }
};

// ===========================
// Homework helpers
// ===========================

const extractHomeworkList = (raw: any): HomeworkRecord[] => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;
  const list = data?.["Homework list"] ?? data?.["homeworkList"] ?? data?.["Data"] ?? data?.["data"];
  return Array.isArray(list) ? list : [];
};

// ===========================
// Academic Year — same logic as ResultDrawer.tsx
// ===========================
// Shows the academic year the user is currently logged in under (selected
// on the login screen and stored by useAuth), e.g. "2026-2027" for
// { startDate: "2026-06-15", endDate: "2027-04-30" }. Falls back to a
// calendar-based guess only if nothing was stored (shouldn't normally
// happen since login always sets this). Same logic as ResultDrawer.tsx /
// StudentFrom.tsx, kept in sync so Academic Year reads identically across
// the app.
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
    // fall through to the calendar-based guess below
  }

  const now = new Date();
  const year = now.getFullYear();
  // School years typically start mid-year (e.g. June) — before that month,
  // treat it as still part of the previous academic year.
  const ACADEMIC_YEAR_START_MONTH = 5; // June (0-indexed)
  return now.getMonth() >= ACADEMIC_YEAR_START_MONTH
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

// ===========================
// Small read-only field row
// ===========================

const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="grid grid-cols-3 border-b border-gray-100 last:border-b-0">
    <div className="col-span-1 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
      {label}
    </div>
    <div className="col-span-2 px-4 py-3 text-sm text-gray-800 break-words">
      {value === undefined || value === null || value === "" ? "-" : value}
    </div>
  </div>
);

// A plain bordered wrapper for tab content (no colored header — the Tabs bar
// already labels each section)
const TabPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white">
    {children}
  </div>
);

export default function Profile() {
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInformation | null>(null);
  const [classGroups, setClassGroups] = useState<ClassSubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // HOMEWORK: Add / Edit modal state
  // ----------------------------------------------------------
  const [homeworkModalOpen, setHomeworkModalOpen] = useState(false);
  const [homeworkSubmitting, setHomeworkSubmitting] = useState(false);
  const [homeworkForm] = Form.useForm();
  const [editingHomeworkId, setEditingHomeworkId] = useState<number | null>(null);
  const [filePreview, setFilePreview] = useState<{ base64: string; mime: string } | null>(null);

  // ----------------------------------------------------------
  // HOMEWORK: View list modal state
  // ----------------------------------------------------------
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewContext, setViewContext] = useState<
    { subject: string; standard: string; division: string; medium: string } | null
  >(null);
  const [homeworkList, setHomeworkList] = useState<HomeworkRecord[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLoading(false);
      return;
    }

    const parsedUser: LoggedInUser = JSON.parse(storedUser);
    setLoggedInUser(parsedUser);

    const isTeacher = parsedUser.role?.toLowerCase() === "teacher";

    if (!isTeacher) {
      setLoading(false);
      return;
    }

    const loadTeacherProfile = async () => {
      try {
        setLoading(true);

        // Step 1: get this teacher's userInformation (personal + teaching details + documents)
        const infoResponse: any = await getEmployeeDetailsById(parsedUser.userId);
        const info: TeacherInformation = infoResponse?.data || infoResponse;
        setTeacherInfo(info);

        // Step 2: get subjects assigned to this teacher, grouped by class
        if (info?.employeeDetailsId) {
          const subjectsResponse = await getSubjectsByEmployeeDetailsId(
            info.employeeDetailsId
          );

          const data = subjectsResponse.data?.data || {};

          const groups: ClassSubjectGroup[] = Object.keys(data).map((key) => {
            const parsed = parseClassMasterKey(key);
            return {
              ...parsed,
              subjects: data[key] || [],
            };
          });

          setClassGroups(groups);
        }
      } catch (error) {
        console.log(error);
        message.error("Unable to load profile details");
      } finally {
        setLoading(false);
      }
    };

    loadTeacherProfile();
  }, []);

  // ============================================================
  // HOMEWORK: fetch list filtered for a specific subject/class
  // ============================================================
  const fetchHomeworkList = async (context: {
    subject: string;
    standard: string;
    division: string;
    medium: string;
  }) => {
    setViewLoading(true);
    try {
      const res = await api.post(apiEndpoints.getAllHomeworkByFilter(0, 100), {});

      if (res?.data?.success === false) {
        message.error(res?.data?.message || "Failed to load homework");
        setHomeworkList([]);
        return;
      }

      const list = extractHomeworkList(res);

      const filtered = list.filter(
        (item) =>
          item.subject === context.subject &&
          item.standard === context.standard &&
          item.division === context.division &&
          item.medium === context.medium
      );

      setHomeworkList(filtered);
    } catch (error: any) {
      console.error("Homework list error:", error);
      message.error(error?.response?.data?.message || "Failed to load homework");
    } finally {
      setViewLoading(false);
    }
  };

  // ============================================================
  // HOMEWORK: open View modal
  // ============================================================
  const openViewModal = (group: ClassSubjectGroup, subject: SubjectDTO) => {
    const context = {
      subject: subject.subjectName,
      standard: group.standard,
      division: group.division,
      medium: group.medium,
    };
    setViewContext(context);
    setViewModalOpen(true);
    fetchHomeworkList(context);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewContext(null);
    setHomeworkList([]);
  };

  // ============================================================
  // HOMEWORK: open Add modal (subject/standard/division/medium/academicYear
  // pre-filled & disabled, rest left empty)
  // ============================================================
  const openUploadModal = (group: ClassSubjectGroup, subject: SubjectDTO) => {
    setEditingHomeworkId(null);
    setFilePreview(null);
    homeworkForm.resetFields();
    homeworkForm.setFieldsValue({
      subject: subject.subjectName,
      standard: group.standard,
      division: group.division,
      medium: group.medium,
      academicYear: getCurrentAcademicYear(),
      homeworkDate: null,
      remark: "",
    });
    setHomeworkModalOpen(true);
  };

  // ============================================================
  // HOMEWORK: open Edit modal from the View list
  // ============================================================
  const openEditHomeworkModal = (record: HomeworkRecord) => {
    setEditingHomeworkId(record.homeworkId);

    if (record.uploadedFile) {
      const cleaned = cleanBase64(record.uploadedFile);
      setFilePreview({ base64: cleaned, mime: detectMimeFromBase64(cleaned) });
    } else {
      setFilePreview(null);
    }

    homeworkForm.resetFields();
    homeworkForm.setFieldsValue({
      subject: record.subject,
      standard: record.standard,
      division: record.division,
      medium: record.medium,
      // Academic Year is always shown as the current login year (same rule
      // as the Add flow), not whatever was stored on the old record.
      academicYear: getCurrentAcademicYear() || record.academicYear,
      homeworkDate: record.homeworkDate ? dayjs(record.homeworkDate) : null,
      remark: record.remark || "",
    });

    setHomeworkModalOpen(true);
  };

  const closeHomeworkModal = () => {
    setHomeworkModalOpen(false);
    homeworkForm.resetFields();
    setEditingHomeworkId(null);
    setFilePreview(null);
  };

  // ============================================================
  // HOMEWORK: file select -> base64 (no auto-upload, just read+preview)
  // ============================================================
  const handleFileBeforeUpload = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const cleaned = cleanBase64(result);
      const mime = detectMimeFromBase64(cleaned);
      setFilePreview({ base64: cleaned, mime });
      homeworkForm.setFieldsValue({ uploadedFile: cleaned });
    };

    reader.onerror = () => {
      message.error("Failed to read file");
    };

    reader.readAsDataURL(file);
    return false; // prevent antd's own upload behaviour
  };

  const removeSelectedFile = () => {
    setFilePreview(null);
    homeworkForm.setFieldsValue({ uploadedFile: null });
  };

  // ============================================================
  // HOMEWORK: save (POST) / update (PUT)
  // ============================================================
  const handleHomeworkSubmit = async () => {
    try {
      const values = await homeworkForm.validateFields();
      setHomeworkSubmitting(true);

      try {
        const payload: any = {
          subject: values.subject,
          standard: values.standard,
          division: values.division,
          medium: values.medium,
          academicYear: values.academicYear,
          homeworkDate: values.homeworkDate ? values.homeworkDate.format("YYYY-MM-DD") : null,
          remark: values.remark ? values.remark : null,
          uploadedFile: filePreview ? filePreview.base64 : null,
        };

        if (editingHomeworkId !== null) {
          payload.homeworkId = editingHomeworkId;

          const res = await api.put(apiEndpoints.updateHomework(), payload);

          if (res?.data?.success === false) {
            message.error(res?.data?.message || "Failed to update homework");
            return;
          }

          message.success(res?.data?.message || "Homework updated successfully");
        } else {
          const res = await api.post(apiEndpoints.saveHomework(), payload);

          if (res?.data?.success === false) {
            message.error(res?.data?.message || "Failed to save homework");
            return;
          }

          message.success(res?.data?.message || "Homework saved successfully");
        }

        closeHomeworkModal();

        if (viewContext) {
          fetchHomeworkList(viewContext);
        }
      } catch (error: any) {
        console.error("Homework save/update error:", error);
        message.error(error?.response?.data?.message || "Failed to save homework");
      } finally {
        setHomeworkSubmitting(false);
      }
    } catch {
      // Ant Design validation errors are automatically displayed.
    }
  };

  // ============================================================
  // HOMEWORK: delete
  // ============================================================
  const handleDeleteHomework = async (homeworkId: number) => {
    try {
      const res = await api.delete(apiEndpoints.deleteHomework(homeworkId));

      if (res?.data?.success === false) {
        message.error(res?.data?.message || "Failed to delete homework");
        return;
      }

      message.success(res?.data?.message || "Record deleted successfully");

      if (viewContext) {
        fetchHomeworkList(viewContext);
      }
    } catch (error: any) {
      console.error("Delete homework error:", error);
      message.error(error?.response?.data?.message || "Failed to delete homework");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin tip="Loading profile..." />
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <div className="p-6">
        <Empty description="No profile data found. Please log in again." />
      </div>
    );
  }

  const isTeacher = loggedInUser.role?.toLowerCase() === "teacher";
  const fullName = [teacherInfo?.firstName, teacherInfo?.middleName, teacherInfo?.lastName]
    .filter(Boolean)
    .join(" ");

  const documents = teacherInfo?.userDocumentDTOS || [];

  // ===========================
  // Tab contents
  // ===========================

  const accountTab = (
    <TabPanel>
      <InfoRow label="Name" value={fullName || loggedInUser.userName} />
      <InfoRow label="Username" value={loggedInUser.userName} />
      <InfoRow label="Role" value={loggedInUser.role} />
      <InfoRow label="Medium" value={loggedInUser.medium} />
      <InfoRow label="Standard" value={loggedInUser.standard} />
      <InfoRow label="Division" value={loggedInUser.division} />
    </TabPanel>
  );

  const teachingTab = (
    <TabPanel>
      <InfoRow label="Employee Code" value={teacherInfo?.employeeCode} />
      <InfoRow label="Designation" value={teacherInfo?.designation} />
      <InfoRow label="Qualification" value={teacherInfo?.qualification} />
      <InfoRow label="Specialization" value={teacherInfo?.specialization} />
      <InfoRow label="Experience (yrs)" value={teacherInfo?.experience} />
      <InfoRow label="Gender" value={teacherInfo?.gender} />
      <InfoRow label="Date of Birth" value={teacherInfo?.dateOfBirth} />
      <InfoRow label="Blood Group" value={teacherInfo?.bloodGroup} />
      <InfoRow label="Joining Date" value={teacherInfo?.joiningDate} />
      <InfoRow label="Address" value={teacherInfo?.address} />
    </TabPanel>
  );

  const documentsTab = (
    <TabPanel>
      <div className="p-4">
        {documents.length === 0 ? (
          <Empty description="No documents uploaded" />
        ) : (
          <div className="flex flex-col gap-3">
            {documents.map((doc) => {
              const cleaned = doc.document ? cleanBase64(doc.document) : "";
              const mime = cleaned
                ? detectMimeFromBase64(cleaned)
                : "application/octet-stream";
              const ext = extensionForMime(mime);

              return (
                <div
                  key={doc.userDocumentId}
                  className="border border-gray-200 rounded-md p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {doc.documentName || "Document"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Uploaded: {doc.uploadDate || "-"}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1 text-blue-600 cursor-pointer text-sm"
                    onClick={() => openDocument(doc)}
                  >
                    <PaperClipOutlined />
                    <span>
                      View {doc.documentName || "document"}.{ext}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TabPanel>
  );

  const classesTab = (
    <TabPanel>
      <div className="p-4">
        {classGroups.length === 0 ? (
          <Empty description="No class or subject assigned yet" />
        ) : (
          <div className="flex flex-col gap-4">
            {classGroups.map((group) => (
              <div
                key={group.classMasterId}
                className="border border-gray-200 rounded-md p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Standard: </span>
                    {group.standard}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Division: </span>
                    {group.division}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Medium: </span>
                    {group.medium}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {group.subjects.map((subject) => (
                    <div
                      key={subject.subjectMasterId}
                      className="border border-gray-200 rounded-md bg-gray-50 text-center px-2 py-2"
                    >
                      <div className="font-medium text-sm">{subject.subjectName}</div>
                      <div className="text-xs text-gray-500 mb-1">{subject.subjectCode}</div>

                      <div className="flex justify-center items-center gap-3 mt-1">
                        <Tooltip title="Upload Homework">
                          <UploadOutlined
                            className="text-blue-600 cursor-pointer"
                            onClick={() => openUploadModal(group, subject)}
                          />
                        </Tooltip>
                        <Tooltip title="View Homework">
                          <EyeOutlined
                            className="text-green-600 cursor-pointer"
                            onClick={() => openViewModal(group, subject)}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabPanel>
  );

  const items = isTeacher
    ? [
        { key: "account", label: "Account Details", children: accountTab },
        { key: "teaching", label: "Teaching Details", children: teachingTab },
        { key: "documents", label: "Documents", children: documentsTab },
        { key: "classes", label: "Assigned Classes & Subjects", children: classesTab },
      ]
    : [{ key: "account", label: "Account Details", children: accountTab }];

  return (
    <div className="profile-page p-4 md:p-6 max-w-4xl mx-auto">
      {/* 👇 Same override used in ResultDrawer.tsx — keeps disabled
          Input / Select / DatePicker / InputNumber fields dark & readable
          instead of Ant Design's default faded/gray look. Scoped to
          `.profile-page` so it doesn't leak elsewhere. */}
      <style>{`
        .profile-page .ant-input[disabled],
        .profile-page .ant-input-disabled,
        .profile-page textarea.ant-input-disabled {
          color: rgba(0, 0, 0, 0.88) !important;
          -webkit-text-fill-color: rgba(0, 0, 0, 0.88) !important;
        }

        .profile-page .ant-select-disabled .ant-select-selector,
        .profile-page .ant-select-disabled .ant-select-selection-item {
          color: rgba(0, 0, 0, 0.88) !important;
        }

        .profile-page .ant-picker-disabled .ant-picker-input > input {
          color: rgba(0, 0, 0, 0.88) !important;
        }

        .profile-page .ant-picker-disabled {
          background: #f5f5f5 !important;
        }

        .profile-page .ant-input-number-disabled .ant-input-number-input {
          color: rgba(0, 0, 0, 0.88) !important;
        }

        .homework-modal .ant-modal-content {
          border-radius: 14px;
          overflow: hidden;
        }

        .homework-modal .ant-modal-header {
          background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
          padding: 16px 24px;
        }

        .homework-modal .ant-modal-title {
          color: #ffffff !important;
          font-weight: 600;
          font-size: 16px;
        }

        .homework-modal .ant-modal-close {
          color: #ffffff;
        }

        .homework-modal .ant-modal-close:hover {
          color: #f0f0f0;
        }
      `}</style>

      <Tabs defaultActiveKey="account" items={items} type="card" />

      {/* ======================================================
          HOMEWORK: ADD / EDIT MODAL
      ======================================================= */}
      <Modal
        title={editingHomeworkId ? "Update Homework" : "Add Homework"}
        open={homeworkModalOpen}
        onCancel={closeHomeworkModal}
        onOk={handleHomeworkSubmit}
        confirmLoading={homeworkSubmitting}
        okText={editingHomeworkId ? "Update" : "Save"}
        destroyOnClose
        className="homework-modal"
        width={560}
        styles={{ body: { background: "#fafafa", padding: "20px 24px" } }}
      >
        <Form form={homeworkForm} layout="vertical">
          <Card
            size="small"
            style={{
              marginBottom: 16,
              borderRadius: 10,
              border: "1px solid #eef0f3",
              boxShadow: "0 1px 3px rgba(16,24,40,0.04)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div className="flex items-center gap-2 mb-3 text-gray-600 text-xs font-semibold uppercase tracking-wide">
              <BookOutlined /> Class & Subject
            </div>
            <div className="grid grid-cols-2 gap-x-3">
              <Form.Item label="Subject" name="subject">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Standard" name="standard">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Division" name="division">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Medium" name="medium">
                <Input disabled />
              </Form.Item>
            </div>

            <Form.Item
              label={
                <span>
                  <CalendarOutlined className="mr-1" />
                  Academic Year
                </span>
              }
              name="academicYear"
              style={{ marginBottom: 0 }}
            >
              <Input disabled />
            </Form.Item>
          </Card>

          <Card
            size="small"
            style={{
              borderRadius: 10,
              border: "1px solid #eef0f3",
              boxShadow: "0 1px 3px rgba(16,24,40,0.04)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div className="flex items-center gap-2 mb-3 text-gray-600 text-xs font-semibold uppercase tracking-wide">
              Homework Details
            </div>

            <Form.Item
              label="Homework Date"
              name="homeworkDate"
              rules={[{ required: true, message: "Please select homework date" }]}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item label="Remark" name="remark">
              <Input.TextArea rows={3} placeholder="Enter remark (optional)" />
            </Form.Item>

            <Form.Item label="Attachment" name="uploadedFile" style={{ marginBottom: 0 }}>
              {filePreview ? (
                <div className="border border-gray-200 rounded-md p-3 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    {filePreview.mime.startsWith("image/") ? (
                      <img
                        src={`data:${filePreview.mime};base64,${filePreview.base64}`}
                        alt="preview"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <FileOutlined className="text-xl text-blue-600" />
                    )}
                    <span
                      className="text-sm text-blue-600 cursor-pointer"
                      onClick={() => openBase64File(filePreview.base64)}
                    >
                      View attachment
                    </span>
                  </div>
                  <CloseCircleOutlined
                    className="text-red-500 cursor-pointer"
                    onClick={removeSelectedFile}
                  />
                </div>
              ) : (
                <Upload beforeUpload={handleFileBeforeUpload} showUploadList={false} maxCount={1}>
                  <Button icon={<UploadOutlined />}>Select File</Button>
                </Upload>
              )}
            </Form.Item>
          </Card>
        </Form>
      </Modal>

      {/* ======================================================
          HOMEWORK: VIEW LIST MODAL
      ======================================================= */}
      <Modal
        title={
          viewContext
            ? `Homework – ${viewContext.subject} (${viewContext.standard} ${viewContext.division})`
            : "Homework"
        }
        open={viewModalOpen}
        onCancel={closeViewModal}
        footer={null}
        destroyOnClose
        width={640}
        className="homework-modal"
        styles={{ body: { background: "#fafafa", padding: "20px 24px" } }}
      >
        <Spin spinning={viewLoading}>
          {homeworkList.length === 0 ? (
            <Empty description="No homework found" />
          ) : (
            <div className="flex flex-col gap-3">
              {homeworkList.map((record) => (
                <Card
                  key={record.homeworkId}
                  size="small"
                  style={{
                    borderRadius: 10,
                    border: "1px solid #eef0f3",
                    boxShadow: "0 1px 3px rgba(16,24,40,0.04)",
                  }}
                  bodyStyle={{ padding: 14 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag color="blue" icon={<CalendarOutlined />}>
                          {record.homeworkDate}
                        </Tag>
                        {record.academicYear && (
                          <Tag color="default">{record.academicYear}</Tag>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {record.remark || "No remark"}
                      </div>
                      {record.uploadedFile && (
                        <div
                          className="flex items-center gap-1 text-blue-600 text-xs mt-2 cursor-pointer"
                          onClick={() => openBase64File(record.uploadedFile as string)}
                        >
                          <PaperClipOutlined />
                          <span>View attachment</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Tooltip title="Edit">
                        <EditOutlined
                          className="text-blue-600 cursor-pointer"
                          onClick={() => openEditHomeworkModal(record)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Delete this homework?"
                        onConfirm={() => handleDeleteHomework(record.homeworkId)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Tooltip title="Delete">
                          <DeleteOutlined className="text-red-500 cursor-pointer" />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
}
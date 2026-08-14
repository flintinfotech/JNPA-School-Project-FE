import { useEffect, useState } from "react";
import { Spin, Empty, message, Tabs } from "antd";
import { PaperClipOutlined } from "@ant-design/icons";
import { getEmployeeDetailsById } from "../services/userService";
import { getSubjectsByEmployeeDetailsId } from "../services/teacherSubjectService";

// ===========================
// Types (matches actual API response)
// ===========================

interface LoggedInUser {
  userId: number;
  userName: string;
  role: string;
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
// Document helpers (same approach as EmployeeViewer.tsx —
// detect real file type from decoded bytes, never trust documentType)
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

const openDocument = (doc: UserDocumentDTO) => {
  if (!doc.document) {
    console.warn("No document data for", doc.documentName);
    return;
  }

  try {
    const cleaned = cleanBase64(doc.document);
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
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    console.error("Failed to decode/open document:", err);
  }
};

// ===========================
// Small read-only field row
// ===========================

const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="grid grid-cols-3 border-b border-gray-100 last:border-b-0">
    {/* <div className="col-span-1 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600"> */}
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
                      <div className="text-xs text-gray-500">{subject.subjectCode}</div>
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
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Tabs defaultActiveKey="account" items={items} type="card" />
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Spin, Empty, message } from "antd";
import {
    HiArrowLeft,
    HiCheckCircle,
    HiXCircle,
    HiPrinter,
    HiDownload,
    HiPhone,
    HiMail,
    HiUser,
} from "react-icons/hi";
import dayjs from "dayjs";
import { getStudentById, getStudentByUserId, type StudentDTO } from "../services/studentService";

// ===========================
// Base64 -> file helpers (same approach used in StudentForm.tsx)
// ===========================
const base64ToBlobUrl = (
    base64: string | null | undefined,
    mimeType: string
): string => {
    if (!base64) return "";
    if (base64.startsWith("[B@")) return "";

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
        console.error("Invalid Base64:", error);
        return "";
    }
};

const detectMimeType = (base64: string): string => {
    if (base64.startsWith("JVBERi0")) return "application/pdf";
    if (base64.startsWith("iVBORw0KGgo")) return "image/png";
    if (base64.startsWith("/9j/")) return "image/jpeg";
    if (base64.startsWith("R0lGODlh") || base64.startsWith("R0lGODdh"))
        return "image/gif";
    return "application/octet-stream";
};

// ===========================
// Small building blocks
// ===========================
function ChecklistRow({
    label,
    complete,
}: {
    label: string;
    complete: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-b-0">
            <span
                className={`text-sm font-medium ${complete ? "text-indigo-700" : "text-slate-400"
                    }`}
            >
                {label}
            </span>
            {complete ? (
                <HiCheckCircle className="text-green-500" size={20} />
            ) : (
                <HiXCircle className="text-slate-300" size={20} />
            )}
        </div>
    );
}

function InfoStat({ value, label }: { value: string; label: string }) {
    return (
        <div className="text-center">
            <p className="text-base font-semibold text-slate-800">{value || "-"}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
    );
}

export default function StudentProfile() {
    const { studentId: studentIdFromRoute } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const { onLogout } = useOutletContext<{ onLogout: () => void }>();

    const isParent = localStorage.getItem("isParent") === "true";

    const [student, setStudent] = useState<StudentDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudent = async () => {
            setLoading(true);
            try {
                let response;

                if (studentIdFromRoute) {
                    // Admin flow — opened from the Students table with an explicit ID
                    response = await getStudentById(studentIdFromRoute);
                } else {
                    // Parent flow — plain /student-profile, fetch by the logged-in userId
                    const storedUser = localStorage.getItem("user");
                    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
                    const userId = parsedUser?.userId;

                    if (!userId) {
                        message.error("No student selected. Please login again.");
                        setLoading(false);
                        return;
                    }

                    response = await getStudentByUserId(userId);
                }

                if (response?.success) {
                    setStudent(response.data);
                } else {
                    message.error(response?.message || "Failed to load student.");
                }
            } catch (error) {
                console.error("Failed to load student:", error);
                message.error("Failed to load student profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [studentIdFromRoute]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Spin size="large" tip="Loading profile..." />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Empty description="Student not found" />
            </div>
        );
    }

    const academic = student.academicInformation?.[0];
    const parent = student.parentDTO;
    const documents = student.studentDocuments || [];

    const photoUrl = student.profileImg
        ? base64ToBlobUrl(student.profileImg, detectMimeType(student.profileImg))
        : "";

    const isActive = student.status === "ACTIVE";

    // Section completeness — drives the checklist ticks/crosses
    const personalInfoComplete = Boolean(
        student.firstName && student.lastName && student.gender && student.DOB
    );
    const addressInfoComplete = Boolean(student.address);
    const parentInfoComplete = Boolean(parent?.name && parent?.phone);
    const academicInfoComplete = Boolean(academic?.standard && academic?.rollNo);
    const documentsComplete = documents.length > 0;

    const allComplete =
        personalInfoComplete &&
        addressInfoComplete &&
        parentInfoComplete &&
        academicInfoComplete &&
        documentsComplete;

    const handlePrint = () => window.print();

    const handleViewDocument = (doc: (typeof documents)[number]) => {
        if (!doc.document) {
            message.warning("No file attached for this document.");
            return;
        }
        const url = base64ToBlobUrl(doc.document, detectMimeType(doc.document));
        if (url) window.open(url, "_blank");
        else message.error("Could not open this document.");
    };
    const handleBack = () => {
        if (isParent) {
            onLogout();                                  // clears token/user/screens/isParent
            navigate("/parent-login", { replace: true }); // sends them straight to the login screen
        } else {
            navigate(-1);                                // admin table flow — keep existing behavior
        }
    };
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                {/* ── Card 1: Student overview ───────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-base font-semibold text-indigo-700">
                            {student.firstName} {student.lastName}
                        </h2>
                    </div>

                    <div className="p-5 flex flex-col items-center">
                        <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt={`${student.firstName} ${student.lastName}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <HiUser size={48} className="text-slate-300" />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full mt-6">
                            <InfoStat
                                value={String(student.studentId ?? "-")}
                                label="Admission No"
                            />
                            <InfoStat value={student.gender || "-"} label="Gender" />
                            <InfoStat
                                value={academic?.rollNo || "-"}
                                label="Roll No"
                            />
                            <div className="text-center">
                                <p
                                    className={`text-base font-semibold ${isActive ? "text-green-600" : "text-red-500"
                                        }`}
                                >
                                    {student.status || "-"}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">Status</p>
                            </div>
                        </div>

                        <div className="w-full border-t border-slate-100 mt-5 pt-4 text-center">
                            {allComplete ? (
                                <p className="text-sm font-medium text-green-600">
                                    Student profile is complete
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-amber-600">
                                    Some profile details are pending
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Card 2: Information checklist ──────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-base font-semibold text-indigo-700">
                            {academic?.standard
                                ? `Std. ${academic.standard}${academic.section ? ` - ${academic.section}` : ""
                                }`
                                : "Class Info"}
                        </h2>
                        {academic?.academicYear && (
                            <p className="text-xs text-slate-500 mt-0.5">
                                Academic Year: {academic.academicYear}
                            </p>
                        )}
                    </div>

                    <div className="p-5">
                        <ChecklistRow label="Personal Info" complete={personalInfoComplete} />
                        <ChecklistRow label="Address Info" complete={addressInfoComplete} />
                        <ChecklistRow label="Parent Info" complete={parentInfoComplete} />
                        <ChecklistRow label="Academic Info" complete={academicInfoComplete} />
                        <ChecklistRow
                            label="Uploaded Documents"
                            complete={documentsComplete}
                        />

                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-xs font-medium text-slate-500 mb-1">
                                Summary
                            </p>
                            {allComplete ? (
                                <p className="text-sm text-green-600 flex items-center gap-1.5">
                                    <HiCheckCircle size={16} /> All required information is
                                    filled in.
                                </p>
                            ) : (
                                <p className="text-sm text-amber-600">
                                    A few sections still need details.
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handlePrint}
                            className="mt-5 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition cursor-pointer print:hidden"
                        >
                            <HiPrinter size={18} />
                            Print Profile
                        </button>
                    </div>
                </div>

                {/* ── Card 3: Parent contact + documents ─────────── */}
                <div className="flex flex-col gap-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-indigo-700">
                                Parent / Guardian
                            </h2>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm font-medium text-slate-800">
                                {parent?.name || "-"}{" "}
                                {parent?.relation && (
                                    <span className="text-slate-400 font-normal">
                                        ({parent.relation})
                                    </span>
                                )}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <HiPhone size={16} className="text-slate-400" />
                                {parent?.phone || "-"}
                            </div>
                            {parent?.email && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <HiMail size={16} className="text-slate-400" />
                                    {parent.email}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-indigo-700">
                                Documents
                            </h2>
                        </div>
                        <div className="p-5">
                            {documents.length === 0 ? (
                                <p className="text-sm text-slate-400">
                                    No documents uploaded.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map((doc, idx) => (
                                        <div
                                            key={doc.studentDocumentId ?? idx}
                                            className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0"
                                        >
                                            <div>
                                                <p className="text-sm text-slate-700">
                                                    {doc.documentName}
                                                </p>
                                                {doc.uploadDate && (
                                                    <p className="text-xs text-slate-400">
                                                        {dayjs(doc.uploadDate).format("DD-MM-YYYY")}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleViewDocument(doc)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer print:hidden"
                                            >
                                                <HiDownload size={14} />
                                                View
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
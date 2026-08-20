import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Spin, Empty, message } from "antd";
import {
    HiArrowLeft,
    HiCheckCircle,
    HiXCircle,
    HiPrinter,
    HiDownload,
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

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-b-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-medium text-slate-800 text-right">
                {value !== undefined && value !== null && value !== "" ? value : "-"}
            </span>
        </div>
    );
}

function Card({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-indigo-700">{title}</h2>
                {subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                )}
            </div>
            <div className="p-5">{children}</div>
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

    // Also catch the browser/device back button (not just an in-page click).
    // Parents landing on this page get an extra history entry pointing to
    // itself, so the first "back" press is intercepted and redirected to
    // the parent login screen instead of leaving the app in a weird state.
    // NOTE: this must run before any early returns below (Rules of Hooks —
    // hooks can't be called conditionally / after a return).
    useEffect(() => {
        if (!isParent) return;

        window.history.pushState(null, "", window.location.pathname);

        const handlePopState = () => {
            onLogout();
            navigate("/parent-login", { replace: true });
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isParent]);

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
    const academicRecords = student.academicInformation || [];
    const parent = student.parentDTO;
    const documents = student.studentDocuments || [];

    const photoUrl = student.profileImg
        ? base64ToBlobUrl(student.profileImg, detectMimeType(student.profileImg))
        : "";

    const isActive = student.status === "ACTIVE";

    // division completeness — drives the checklist ticks/crosses
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

    // const handlePrint = () => window.print();

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
            onLogout();                                    // clears token/user/screens (keeps isParent so route guards know where to send them)
            navigate("/parent-login", { replace: true });  // sends them straight to the parent login screen
        } else {
            navigate(-1);                                   // admin table flow — keep existing behavior
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">

            <div className="max-w-6xl mx-auto mb-4 print:hidden">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-700 cursor-pointer"
                >
                    <HiArrowLeft size={16} />
                    Back
                </button>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                {/* ── Left: Student overview (sticky on desktop) ─── */}
                <div className="md:sticky md:top-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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

                        <div className="w-full border-t border-slate-100 mt-4 pt-4 space-y-2">
                            <ChecklistRow label="Personal Info" complete={personalInfoComplete} />
                            <ChecklistRow label="Address Info" complete={addressInfoComplete} />
                            <ChecklistRow label="Parent Info" complete={parentInfoComplete} />
                            <ChecklistRow label="Academic Info" complete={academicInfoComplete} />
                            <ChecklistRow label="Uploaded Documents" complete={documentsComplete} />
                        </div>

                        {/* <button
                            onClick={handlePrint}
                            className="mt-5 w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg py-2 hover:bg-indigo-50 cursor-pointer print:hidden"
                        >
                            <HiPrinter size={16} />
                            Print Profile
                        </button> */}
                    </div>
                </div>

                {/* ── Right: all recorded information, in cards ──── */}
                <div className="md:col-span-2 flex flex-col gap-5">
                    {/* Personal Information */}
                    <Card title="Personal Information">
                        <InfoRow label="First Name" value={student.firstName} />
                        <InfoRow label="Last Name" value={student.lastName} />
                        <InfoRow label="Gender" value={student.gender} />
                        <InfoRow
                            label="Date of Birth"
                            value={student.DOB ? dayjs(student.DOB).format("DD-MM-YYYY") : undefined}
                        />
                        <InfoRow label="Blood Group" value={student.bloodGroup} />
                        <InfoRow label="Category" value={student.category} />
                        <InfoRow label="Religion" value={student.religion} />
                        <InfoRow label="Caste" value={student.caste} />
                        <InfoRow label="Nationality" value={student.nationality} />
                        <InfoRow label="Aadhaar No" value={student.aadhaarCard} />
                        <InfoRow label="Address" value={student.address} />
                        <InfoRow label="Status" value={student.status} />
                    </Card>

                    {/* Parent / Guardian */}
                    <Card title="Parent / Guardian">
                        <InfoRow label="Name" value={parent?.name} />
                        <InfoRow label="Relation" value={parent?.relation} />
                        <InfoRow label="Occupation" value={parent?.occupation} />
                        <InfoRow label="Phone" value={parent?.phone} />
                        <InfoRow label="Email" value={parent?.email} />
                        <InfoRow label="Address" value={parent?.address} />
                        <InfoRow
                            label="Annual Income"
                            value={
                                parent?.annualIncome !== undefined && parent?.annualIncome !== null
                                    ? `₹ ${parent.annualIncome}`
                                    : undefined
                            }
                        />
                    </Card>

                    {/* Academic Information — one sub-card per record, since a
                        student can have multiple years of academic history */}
                    {academicRecords.length === 0 ? (
                        <Card title="Academic Information">
                            <p className="text-sm text-slate-400">
                                No academic information added yet.
                            </p>
                        </Card>
                    ) : (
                        academicRecords.map((rec, idx) => (
                            <Card
                                key={rec.academicInformationId ?? idx}
                                title={
                                    rec.standard
                                        ? `Std. ${rec.standard}${rec.division ? ` - ${rec.division}` : ""}`
                                        : `Academic Record ${idx + 1}`
                                }
                                subtitle={rec.academicYear ? `Academic Year: ${rec.academicYear}` : undefined}
                            >
                                <InfoRow label="Admission No" value={rec.admissionNo} />
                                <InfoRow
                                    label="Admission Date"
                                    value={rec.admissionDate ? dayjs(rec.admissionDate).format("DD-MM-YYYY") : undefined}
                                />
                                <InfoRow label="Standard" value={rec.standard} />
                                <InfoRow label="Division" value={rec.division} />
                                <InfoRow label="Roll No" value={rec.rollNo} />
                                <InfoRow label="Academic Year" value={rec.academicYear} />
                                <InfoRow label="Blood Group" value={rec.bloodGroup} />
                                <InfoRow label="Category" value={rec.category} />
                                <InfoRow label="Caste" value={rec.caste} />
                                <InfoRow
                                    label="Date of Birth"
                                    value={rec.dob ? dayjs(rec.dob).format("DD-MM-YYYY") : undefined}
                                />
                            </Card>
                        ))
                    )}

                    {/* Documents */}
                    <Card title="Documents">
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
                    </Card>
                </div>
            </div>
        </div>
    );
}
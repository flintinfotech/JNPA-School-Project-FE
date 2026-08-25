import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Spin, Empty, message } from "antd";
import {
    HiCheckCircle,
    HiXCircle,
    HiDownload,
    HiUser,
    HiStar,
} from "react-icons/hi";
import dayjs from "dayjs";

import {
    getStudentById,
    getStudentByUserId,
    type StudentDTO,
    type StudentResultDTO,
} from "../services/studentService";

// ===========================
// Base64 -> file helpers
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

    if (
        base64.startsWith("R0lGODlh") ||
        base64.startsWith("R0lGODdh")
    ) {
        return "image/gif";
    }

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

function InfoStat({
    value,
    label,
}: {
    value: string;
    label: string;
}) {
    return (
        <div className="text-center">
            <p className="text-base font-semibold text-slate-800">
                {value || "-"}
            </p>

            <p className="text-xs text-slate-500 mt-0.5">
                {label}
            </p>
        </div>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-b-0">
            <span className="text-sm text-slate-500">
                {label}
            </span>

            <span className="text-sm font-medium text-slate-800 text-right">
                {value !== undefined &&
                    value !== null &&
                    value !== ""
                    ? value
                    : "-"}
            </span>
        </div>
    );
}

// ===========================
// Common Card
// ===========================

function Card({
    title,
    subtitle,
    children,
    className = "",
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full ${className}`}
        >
            <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-indigo-700">
                    {title}
                </h2>

                {subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="p-5 flex-1">
                {children}
            </div>
        </div>
    );
}

// ===========================
// Achievements Card
// ===========================

function AchievementCard({
    achievements,
}: {
    achievements: {
        studentAchievementId?: number;
        achievementName?: string;
        achievementDescription?: string;
        academicYear?: string;
        studentId?: number;
    }[];
}) {
    return (
        <Card
            title="Achievements"
            subtitle="Student achievements and accomplishments"
        >
            {achievements.length === 0 ? (
                <div className="text-center py-6">
                    <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-3">
                        <HiStar
                            size={28}
                            className="text-amber-400"
                        />
                    </div>

                    <p className="text-sm font-medium text-slate-500">
                        No achievements added yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {achievements.map((achievement, index) => (
                        <div
                            key={
                                achievement.studentAchievementId ??
                                index
                            }
                            className="flex items-start gap-3 p-4 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white hover:shadow-md transition-all duration-200"
                        >
                            {/* Achievement Icon */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <HiStar
                                    size={21}
                                    className="text-amber-500"
                                />
                            </div>

                            {/* Title + Description */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-800">
                                    {achievement.achievementName ||
                                        "Achievement"}
                                </h3>

                                <p className="text-xs text-slate-500 mt-1 leading-5">
                                    {achievement.achievementDescription ||
                                        "No description available."}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ===========================
// Result Card
// ===========================

function ResultCard({
    results,
}: {
    results: StudentResultDTO[];
}) {
    if (!results || results.length === 0) {
        return (
            <Card title="Result">
                <p className="text-sm text-slate-400">
                    No result published yet.
                </p>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {results.map((res, idx) => {
                const isPass = res.resultStatus === "PASS";

                const examLabel =
                    res.examType?.replace(/_/g, " ") ||
                    `Result ${idx + 1}`;

                return (
                    <Card
                        key={res.resultId ?? idx}
                        title={examLabel}
                        subtitle={
                            res.academicYear
                                ? `Academic Year: ${res.academicYear}`
                                : undefined
                        }
                    >
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <p className="text-sm text-slate-600">
                                {res.standard
                                    ? `Std.${res.standard.replace(
                                        " Standard",
                                        ""
                                    )}`
                                    : ""}

                                {res.division
                                    ? ` (${res.division})`
                                    : ""}
                            </p>

                            <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPass
                                        ? "bg-green-50 text-green-600"
                                        : "bg-red-50 text-red-500"
                                    }`}
                            >
                                {res.resultStatus}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <InfoRow
                                label="Start Date"
                                value={
                                    res.startDate
                                        ? dayjs(
                                            res.startDate
                                        ).format(
                                            "DD-MM-YYYY"
                                        )
                                        : undefined
                                }
                            />

                            <InfoRow
                                label="End Date"
                                value={
                                    res.endDate
                                        ? dayjs(
                                            res.endDate
                                        ).format(
                                            "DD-MM-YYYY"
                                        )
                                        : undefined
                                }
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <InfoStat
                                value={`${res.obtainedMarks ?? "-"}/${res.totalMarks ?? "-"}`}
                                label="Marks"
                            />

                            <InfoStat
                                value={
                                    res.percentage !==
                                        undefined
                                        ? `${res.percentage}%`
                                        : "-"
                                }
                                label="Percentage"
                            />

                            <InfoStat
                                value={res.grade || "-"}
                                label="Grade"
                            />
                        </div>

                        {res.examSubjectsDTOS &&
                            res.examSubjectsDTOS.length > 0 && (
                                <div className="overflow-hidden rounded-lg border border-slate-100">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-xs">
                                                <th className="text-left font-medium px-3 py-2">
                                                    Subject
                                                </th>

                                                <th className="text-right font-medium px-3 py-2">
                                                    Obtained
                                                </th>

                                                <th className="text-right font-medium px-3 py-2">
                                                    Max
                                                </th>

                                                <th className="text-right font-medium px-3 py-2">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {res.examSubjectsDTOS.map(
                                                (subj, sIdx) => (
                                                    <tr
                                                        key={
                                                            subj.ExamSubjectsId ??
                                                            sIdx
                                                        }
                                                        className="border-t border-slate-100"
                                                    >
                                                        <td className="px-3 py-2 text-slate-700">
                                                            {
                                                                subj.subjectName
                                                            }
                                                        </td>

                                                        <td className="px-3 py-2 text-right text-slate-800 font-medium">
                                                            {
                                                                subj.obtainedMarks
                                                            }
                                                        </td>

                                                        <td className="px-3 py-2 text-right text-slate-500">
                                                            {
                                                                subj.maximumMarks
                                                            }
                                                        </td>

                                                        <td className="px-3 py-2 text-right">
                                                            <span
                                                                className={`text-xs font-semibold ${subj.status ===
                                                                        "PASS"
                                                                        ? "text-green-600"
                                                                        : "text-red-500"
                                                                    }`}
                                                            >
                                                                {
                                                                    subj.status
                                                                }
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                    </Card>
                );
            })}
        </div>
    );
}

// ===========================
// Student Profile
// ===========================

export default function StudentProfile() {
    const {
        studentId: studentIdFromRoute,
    } = useParams<{ studentId: string }>();

    const navigate = useNavigate();

    const {
        onLogout,
    } = useOutletContext<{ onLogout: () => void }>();

    const isParent =
        localStorage.getItem("isParent") === "true";

    const [student, setStudent] =
        useState<StudentDTO | null>(null);

    const [loading, setLoading] = useState(true);

    // ===========================
    // Fetch Student
    // ===========================

    useEffect(() => {
        const fetchStudent = async () => {
            setLoading(true);

            try {
                let response;

                if (studentIdFromRoute) {
                    // Admin flow
                    response =
                        await getStudentById(
                            studentIdFromRoute
                        );
                } else {
                    // Parent flow
                    const storedUser =
                        localStorage.getItem("user");

                    const parsedUser = storedUser
                        ? JSON.parse(storedUser)
                        : null;

                    const userId =
                        parsedUser?.userId;

                    if (!userId) {
                        message.error(
                            "No student selected. Please login again."
                        );

                        setLoading(false);
                        return;
                    }

                    response =
                        await getStudentByUserId(userId);
                }

                if (response?.success) {
                    setStudent(response.data);
                } else {
                    message.error(
                        response?.message ||
                        "Failed to load student."
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to load student:",
                    error
                );

                message.error(
                    "Failed to load student profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [studentIdFromRoute]);

    // ===========================
    // Parent Back Button Handling
    // ===========================

    useEffect(() => {
        if (!isParent) return;

        window.history.pushState(
            null,
            "",
            window.location.pathname
        );

        const handlePopState = () => {
            onLogout();

            navigate("/parent-login", {
                replace: true,
            });
        };

        window.addEventListener(
            "popstate",
            handlePopState
        );

        return () =>
            window.removeEventListener(
                "popstate",
                handlePopState
            );

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isParent]);

    // ===========================
    // Loading
    // ===========================

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Spin
                    size="large"
                    tip="Loading profile..."
                />
            </div>
        );
    }

    // ===========================
    // Student Not Found
    // ===========================

    if (!student) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Empty description="Student not found" />
            </div>
        );
    }

    // ===========================
    // Data
    // ===========================

    const academic =
        student.academicInformation?.[0];

    const academicRecords =
        student.academicInformation || [];

    const parent =
        student.parentDTO;

    const documents =
        student.studentDocuments || [];

    const results =
        student.studentResultDTOS || [];

    // ===========================
    // Achievements
    // ===========================

   const achievements = student.studentAchievementsDTOS || [];

    // ===========================
    // Profile Image
    // ===========================

    const photoUrl = student.profileImg
        ? base64ToBlobUrl(
            student.profileImg,
            detectMimeType(
                student.profileImg
            )
        )
        : "";

    const isActive =
        student.status === "ACTIVE";

    // ===========================
    // Profile Completion
    // ===========================

    const personalInfoComplete =
        Boolean(
            student.firstName &&
            student.lastName &&
            student.gender &&
            student.DOB
        );

    const addressInfoComplete =
        Boolean(student.address);

    const parentInfoComplete =
        Boolean(
            parent?.name &&
            parent?.phone
        );

    const academicInfoComplete =
        Boolean(
            academic?.standard &&
            academic?.rollNo
        );

    const documentsComplete =
        documents.length > 0;

    const allComplete =
        personalInfoComplete &&
        addressInfoComplete &&
        parentInfoComplete &&
        academicInfoComplete &&
        documentsComplete;

    // ===========================
    // Document View
    // ===========================

    const handleViewDocument = (
        doc: (typeof documents)[number]
    ) => {
        if (!doc.document) {
            message.warning(
                "No file attached for this document."
            );

            return;
        }

        const url = base64ToBlobUrl(
            doc.document,
            detectMimeType(doc.document)
        );

        if (url) {
            window.open(url, "_blank");
        } else {
            message.error(
                "Could not open this document."
            );
        }
    };

    // ===========================
    // Back
    // ===========================

    const handleBack = () => {
        if (isParent) {
            onLogout();

            navigate("/parent-login", {
                replace: true,
            });
        } else {
            navigate(-1);
        }
    };

    // ===========================
    // UI
    // ===========================

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

                {/* ===========================
                    LEFT - STUDENT OVERVIEW
                =========================== */}

                <div className="md:sticky md:top-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-base font-semibold text-indigo-700">
                            {student.firstName}{" "}
                            {student.lastName}
                        </h2>
                    </div>

                    <div className="p-5 flex flex-col items-center">

                        {/* Profile Image */}

                        <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">

                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt={`${student.firstName} ${student.lastName}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <HiUser
                                    size={48}
                                    className="text-slate-300"
                                />
                            )}

                        </div>

                        {/* Stats */}

                        <div className="grid grid-cols-2 gap-4 w-full mt-6">

                            <InfoStat
                                value={String(
                                    student.studentId ??
                                    "-"
                                )}
                                label="Admission No"
                            />

                            <InfoStat
                                value={
                                    student.gender ||
                                    "-"
                                }
                                label="Gender"
                            />

                            <InfoStat
                                value={
                                    academic?.rollNo ||
                                    "-"
                                }
                                label="Roll No"
                            />

                            <div className="text-center">

                                <p
                                    className={`text-base font-semibold ${isActive
                                            ? "text-green-600"
                                            : "text-red-500"
                                        }`}
                                >
                                    {student.status ||
                                        "-"}
                                </p>

                                <p className="text-xs text-slate-500 mt-0.5">
                                    Status
                                </p>

                            </div>

                        </div>

                        {/* Profile Status */}

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

                        {/* Checklist */}

                        <div className="w-full border-t border-slate-100 mt-4 pt-4 space-y-2">

                            <ChecklistRow
                                label="Personal Info"
                                complete={
                                    personalInfoComplete
                                }
                            />

                            <ChecklistRow
                                label="Address Info"
                                complete={
                                    addressInfoComplete
                                }
                            />

                            <ChecklistRow
                                label="Parent Info"
                                complete={
                                    parentInfoComplete
                                }
                            />

                            <ChecklistRow
                                label="Academic Info"
                                complete={
                                    academicInfoComplete
                                }
                            />

                            <ChecklistRow
                                label="Uploaded Documents"
                                complete={
                                    documentsComplete
                                }
                            />

                        </div>

                    </div>
                </div>

                {/* ===========================
                    RIGHT SIDE
                =========================== */}

                <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-7 gap-5 items-start">

                    {/* ===========================
                        LEFT SUB COLUMN
                    =========================== */}

                    <div className="lg:col-span-3 flex flex-col gap-5">
                        <AchievementCard
                            achievements={achievements}
                        />
                        {/* ===========================
                            PERSONAL INFORMATION
                        =========================== */}

                        <Card title="Personal Information">

                            <InfoRow
                                label="First Name"
                                value={student.firstName}
                            />

                            <InfoRow
                                label="Last Name"
                                value={student.lastName}
                            />

                            <InfoRow
                                label="Gender"
                                value={student.gender}
                            />

                            <InfoRow
                                label="Date of Birth"
                                value={
                                    student.DOB
                                        ? dayjs(
                                            student.DOB
                                        ).format(
                                            "DD-MM-YYYY"
                                        )
                                        : undefined
                                }
                            />

                            <InfoRow
                                label="Blood Group"
                                value={
                                    student.bloodGroup
                                }
                            />

                            <InfoRow
                                label="Category"
                                value={
                                    student.category
                                }
                            />

                            <InfoRow
                                label="Religion"
                                value={
                                    student.religion
                                }
                            />

                            <InfoRow
                                label="Caste"
                                value={
                                    student.caste
                                }
                            />

                            <InfoRow
                                label="Nationality"
                                value={
                                    student.nationality
                                }
                            />

                            <InfoRow
                                label="Aadhaar No"
                                value={
                                    student.aadhaarCard
                                }
                            />

                            <InfoRow
                                label="Address"
                                value={
                                    student.address
                                }
                            />

                            <InfoRow
                                label="Status"
                                value={
                                    student.status
                                }
                            />

                        </Card>

                        

                    

                        {/* ===========================
                            PARENT / GUARDIAN
                        =========================== */}

                        <Card title="Parent / Guardian">

                            <InfoRow
                                label="Name"
                                value={parent?.name}
                            />

                            <InfoRow
                                label="Relation"
                                value={
                                    parent?.relation
                                }
                            />

                            <InfoRow
                                label="Occupation"
                                value={
                                    parent?.occupation
                                }
                            />

                            <InfoRow
                                label="Phone"
                                value={
                                    parent?.phone
                                }
                            />

                            <InfoRow
                                label="Email"
                                value={
                                    parent?.email
                                }
                            />

                            <InfoRow
                                label="Address"
                                value={
                                    parent?.address
                                }
                            />

                            <InfoRow
                                label="Annual Income"
                                value={
                                    parent?.annualIncome !==
                                        undefined &&
                                        parent?.annualIncome !==
                                        null
                                        ? `₹ ${parent.annualIncome}`
                                        : undefined
                                }
                            />

                        </Card>

                        {/* ===========================
                            ACADEMIC INFORMATION
                        =========================== */}

                        {academicRecords.length ===
                            0 ? (
                            <Card title="Academic Information">

                                <p className="text-sm text-slate-400">
                                    No academic information
                                    added yet.
                                </p>

                            </Card>
                        ) : (
                            academicRecords.map(
                                (rec, idx) => (
                                    <Card
                                        key={
                                            rec.academicInformationId ??
                                            idx
                                        }
                                        title={
                                            rec.standard
                                                ? `Std.${rec.standard.replace(
                                                    " Standard",
                                                    ""
                                                )}${rec.division
                                                    ? ` Division-${rec.division}`
                                                    : ""
                                                }`
                                                : `Academic Record ${idx + 1
                                                }`
                                        }
                                        subtitle={
                                            rec.academicYear
                                                ? `Academic Year: ${rec.academicYear}`
                                                : undefined
                                        }
                                    >

                                        <InfoRow
                                            label="Admission No"
                                            value={
                                                rec.admissionNo
                                            }
                                        />

                                        <InfoRow
                                            label="Admission Date"
                                            value={
                                                rec.admissionDate
                                                    ? dayjs(
                                                        rec.admissionDate
                                                    ).format(
                                                        "DD-MM-YYYY"
                                                    )
                                                    : undefined
                                            }
                                        />

                                        <InfoRow
                                            label="Standard"
                                            value={
                                                rec.standard
                                            }
                                        />

                                        <InfoRow
                                            label="Division"
                                            value={
                                                rec.division
                                            }
                                        />

                                        <InfoRow
                                            label="Roll No"
                                            value={
                                                rec.rollNo
                                            }
                                        />

                                        <InfoRow
                                            label="Academic Year"
                                            value={
                                                rec.academicYear
                                            }
                                        />

                                        <InfoRow
                                            label="Blood Group"
                                            value={
                                                rec.bloodGroup
                                            }
                                        />

                                        <InfoRow
                                            label="Category"
                                            value={
                                                rec.category
                                            }
                                        />

                                        <InfoRow
                                            label="Caste"
                                            value={
                                                rec.caste
                                            }
                                        />

                                        <InfoRow
                                            label="Date of Birth"
                                            value={
                                                rec.dob
                                                    ? dayjs(
                                                        rec.dob
                                                    ).format(
                                                        "DD-MM-YYYY"
                                                    )
                                                    : undefined
                                            }
                                        />

                                    </Card>
                                )
                            )
                        )}

                        {/* ===========================
                            DOCUMENTS
                        =========================== */}

                        <Card title="Documents">

                            {documents.length ===
                                0 ? (
                                <p className="text-sm text-slate-400">
                                    No documents uploaded.
                                </p>
                            ) : (
                                <div className="space-y-2">

                                    {documents.map(
                                        (
                                            doc,
                                            idx
                                        ) => (
                                            <div
                                                key={
                                                    doc.studentDocumentId ??
                                                    idx
                                                }
                                                className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0"
                                            >

                                                <div>

                                                    <p className="text-sm text-slate-700">
                                                        {
                                                            doc.documentName
                                                        }
                                                    </p>

                                                    {doc.uploadDate && (
                                                        <p className="text-xs text-slate-400">
                                                            {dayjs(
                                                                doc.uploadDate
                                                            ).format(
                                                                "DD-MM-YYYY"
                                                            )}
                                                        </p>
                                                    )}

                                                </div>

                                                <button
                                                    onClick={() =>
                                                        handleViewDocument(
                                                            doc
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer print:hidden"
                                                >
                                                    <HiDownload
                                                        size={
                                                            14
                                                        }
                                                    />

                                                    View
                                                </button>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                        </Card>

                    </div>

                    {/* ===========================
                        RESULT COLUMN
                    =========================== */}

                    <div className="lg:col-span-4 lg:sticky lg:top-6">

                        <ResultCard
                            results={results}
                        />

                    </div>

                </div>

            </div>

        </div>
    );
}
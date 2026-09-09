import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Empty, message, Select, DatePicker, Button, Tag, Pagination } from "antd";
import { ArrowLeftOutlined, PaperClipOutlined, CalendarOutlined } from "@ant-design/icons";
import { HiBookOpen } from "react-icons/hi";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import api from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";
import {
    getStudentById,
    getStudentByUserId,
    type StudentDTO,
} from "../services/studentService"; // 👈 adjust path to match your project

const { Option } = Select;

// ===========================
// Base64 -> file helpers (same as StudentProfile.tsx, kept local so this
// page can be its own standalone route without extra shared imports)
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
    if (base64.startsWith("R0lGODlh") || base64.startsWith("R0lGODdh")) {
        return "image/gif";
    }
    return "application/octet-stream";
};

// ===========================
// Homework
// ===========================

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

// The API wraps the list under a "Homework list" key — normalize that here
// so the rest of the component doesn't need to know the exact response shape.
const extractHomeworkList = (raw: any): HomeworkRecord[] => {
    const body = raw?.data ?? raw ?? {};
    const data = body?.data ?? body;
    const list =
        data?.["Homework list"] ??
        data?.["homeworkList"] ??
        data?.["Data"] ??
        data?.["data"];
    return Array.isArray(list) ? list : [];
};

// ===========================
// Page
// ===========================

const PAGE_SIZE = 10;

export default function StudentHomework() {
    const { studentId: studentIdFromRoute } = useParams<{ studentId: string }>();
    const navigate = useNavigate();

    const [student, setStudent] = useState<StudentDTO | null>(null);
    const [loading, setLoading] = useState(true);

    const [homework, setHomework] = useState<HomeworkRecord[]>([]);
    const [homeworkLoading, setHomeworkLoading] = useState(false);
    const [homeworkError, setHomeworkError] = useState<string | null>(null);

    // Category (Subject) + Date are just narrowing filters on top of the
    // full list — the full list is fetched and shown immediately as soon
    // as it loads; picking a category/date only trims what's visible.
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

    // Pagination — client-side, 10 records per page over the filtered list.
    const [currentPage, setCurrentPage] = useState(1);

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
                    response = await getStudentById(studentIdFromRoute);
                } else {
                    // Parent flow
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

    // ===========================
    // Fetch Homework — fires as soon as the student (and hence their class)
    // is known, and populates the page immediately. No selection needed to
    // see data — the Category/Date controls only filter what's on screen.
    //   POST /jnpa-school-project/homework/getAllHomeworkByFilter?page=0&size=20&paginate=true
    //   payload: { academicYear, division, medium, standard }
    //
    // 🛠️ FIX — Student Homework showed the screen but always returned 0
    // records for parents.
    //
    // Root cause: `AcademicInformationDTO` (studentService.ts) has no
    // "medium" field on it at all, so `academicInfo?.medium` was always
    // `undefined`, and classScope.medium fell back to `""` (empty string)
    // via `|| ""`. That empty string was then sent to the backend as a
    // real filter value: `{ ..., medium: "" }`. The backend appears to
    // treat every field in the filter body as an exact-match condition —
    // including empty ones — so it was effectively asking for "homework
    // where medium equals '' ", which no real record matches (they're all
    // "English"/"Marathi" etc), so it always came back empty. Standard/
    // division/academicYear happened to resolve to real values, so this
    // only showed up because of the missing `medium` field — but the same
    // bug would hit any field that's blank for a given student.
    //
    // Fix: build the classScope as before (for display / the safety
    // filter below), but only include a field in the actual POST body when
    // it has a real, non-empty value. Omitted fields let the backend treat
    // them as "no filter on this field" instead of "must equal ''".
    // ===========================

    useEffect(() => {
        if (!student) return;

        const academicInfo = student.academicInformation?.[0];

        const classScope = {
            academicYear: academicInfo?.academicYear || "",
            division: academicInfo?.division || (academicInfo as any)?.section || "",
            medium: (academicInfo as any)?.medium || "",
            standard: academicInfo?.standard || "",
        };

        // 🆕 Only send fields that actually have a value — never send an
        // empty string as a "filter" the backend will match literally.
        const requestPayload: Record<string, string> = {};
        if (classScope.academicYear) requestPayload.academicYear = classScope.academicYear;
        if (classScope.division) requestPayload.division = classScope.division;
        if (classScope.medium) requestPayload.medium = classScope.medium;
        if (classScope.standard) requestPayload.standard = classScope.standard;

        // Debug aid — if homework still comes back empty, check this log
        // first: does classScope have every field you expect (standard,
        // division, medium, academicYear) populated with a real value
        // that matches how homework was saved (e.g. "1st Standard", not
        // "1")? If a field is missing here, the student's
        // academicInformation from the backend doesn't have that data
        // under the field name this component expects.
        // eslint-disable-next-line no-console
        console.log("StudentHomework classScope:", classScope, "payload sent:", requestPayload);

        const loadHomework = async () => {
            setHomeworkLoading(true);
            setHomeworkError(null);

            try {
                const res = await api.post(
                    apiEndpoints.getAllHomeworkByFilter(0, 20),
                    requestPayload
                );

                if (res?.data?.success === false) {
                    setHomeworkError(res?.data?.message || "Failed to load homework");
                    setHomework([]);
                    return;
                }

                const list = extractHomeworkList(res);

                // Safety filter against the same class scope, in case the
                // backend ever ignores some fields or returns a broader
                // set than expected. Only applies a check for fields that
                // actually had a value.
                const filtered = list.filter((item) => {
                    const matchesStandard = classScope.standard
                        ? item.standard === classScope.standard
                        : true;
                    const matchesDivision = classScope.division
                        ? item.division === classScope.division
                        : true;
                    const matchesMedium = classScope.medium
                        ? item.medium === classScope.medium
                        : true;
                    const matchesYear = classScope.academicYear
                        ? item.academicYear === classScope.academicYear
                        : true;
                    return (
                        matchesStandard && matchesDivision && matchesMedium && matchesYear
                    );
                });

                setHomework(filtered);
            } catch (err: any) {
                console.error("Failed to load homework:", err);
                setHomeworkError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Something went wrong while loading homework."
                );
            } finally {
                setHomeworkLoading(false);
            }
        };

        loadHomework();
    }, [student]);

    const handleViewAttachment = (rawBase64: string) => {
        const url = base64ToBlobUrl(rawBase64, detectMimeType(rawBase64));
        if (url) {
            window.open(url, "_blank");
        } else {
            message.error("Could not open this attachment.");
        }
    };

    // Category (Subject) options — built from whatever homework the API
    // actually returned for this student's class.
    const categoryOptions = Array.from(
        new Set(homework.map((hw) => hw.subject).filter(Boolean))
    );

    // Full list shown by default; Category/Date just narrow it down.
    // Newest homework first.
    const filteredHomework = [...homework]
        .filter((hw) => (selectedCategory ? hw.subject === selectedCategory : true))
        .filter((hw) =>
            selectedDate ? hw.homeworkDate === selectedDate.format("YYYY-MM-DD") : true
        )
        .sort((a, b) => (b.homeworkDate || "").localeCompare(a.homeworkDate || ""));

    // Reset to page 1 whenever the filters (or the underlying data) change,
    // so we never get stuck on a page that no longer has any records.
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, selectedDate, homework]);

    const totalCount = filteredHomework.length;

    // Slice out just the current page's records.
    const paginatedHomework = filteredHomework.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // ===========================
    // Loading / Not found
    // ===========================

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <Spin size="large" tip="Loading..." />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <Empty description="Student not found" />
            </div>
        );
    }

    const academic = student.academicInformation?.[0];

    // ===========================
    // UI
    // ===========================

    return (
        <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 md:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-5 flex-wrap">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                        size="middle"
                    >
                        Back
                    </Button>

                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg font-semibold text-indigo-700 flex items-center gap-2">
                            <HiBookOpen /> Homework
                        </h1>
                        <p className="text-xs text-slate-500 truncate">
                            {student.firstName} {student.lastName}
                            {academic?.standard
                                ? ` • Std.${academic.standard.replace(" Standard", "")}${
                                      academic.division ? ` (${academic.division})` : ""
                                  }`
                                : ""}
                        </p>
                    </div>
                </div>

                {/* ===========================
                    Filters — Category (Subject) dropdown + optional date.
                    Both are optional narrow-downs; the full list is already
                    visible below without picking anything.
                =========================== */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 mb-4 sm:mb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">
                                Category (Subject)
                            </label>
                            <Select
                                className="w-full"
                                placeholder={
                                    homeworkLoading
                                        ? "Loading subjects..."
                                        : categoryOptions.length === 0
                                        ? "No subjects available"
                                        : "All Subjects"
                                }
                                value={selectedCategory ?? undefined}
                                onChange={(v) => setSelectedCategory(v ?? null)}
                                allowClear
                                loading={homeworkLoading}
                                disabled={homeworkLoading || categoryOptions.length === 0}
                            >
                                {categoryOptions.map((subj) => (
                                    <Option key={subj} value={subj}>
                                        {subj}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">
                                Filter by Date
                            </label>
                            <DatePicker
                                className="w-full"
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                format="DD-MM-YYYY"
                                allowClear
                                placeholder="All Dates"
                            />
                        </div>
                    </div>
                </div>

                {/* ===========================
                    Total count — always visible once homework has loaded,
                    reflects whatever the current filters have narrowed to.
                =========================== */}
                {!homeworkLoading && !homeworkError && homework.length > 0 && (
                    <div className="flex items-center justify-between mb-3 px-1">
                        <p className="text-xs sm:text-sm text-slate-500">
                            Total:{" "}
                            <span className="font-semibold text-slate-700">
                                {totalCount}
                            </span>{" "}
                            {totalCount === 1 ? "record" : "records"}
                        </p>
                    </div>
                )}

                {/* ===========================
                    Results — visible immediately, filters just narrow it
                =========================== */}

                {homeworkLoading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-10 flex items-center justify-center">
                        <Spin tip="Loading homework..." />
                    </div>
                ) : homeworkError ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-8 text-center px-4">
                        <p className="text-sm text-red-500 font-medium">
                            Failed to load homework.
                        </p>
                        <p className="text-xs text-slate-400 mt-2">{homeworkError}</p>
                    </div>
                ) : homework.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-12 text-center px-4">
                        <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                            <HiBookOpen size={28} className="text-indigo-400" />
                        </div>
                        <p className="text-sm text-slate-400">
                            No homework assigned yet.
                        </p>
                    </div>
                ) : filteredHomework.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-8 text-center px-4">
                        <p className="text-sm text-slate-400">
                            No homework found
                            {selectedCategory ? ` for "${selectedCategory}"` : ""}
                            {selectedDate ? ` on ${selectedDate.format("DD-MM-YYYY")}` : ""}.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            {paginatedHomework.map((hw, idx) => (
                                <div
                                    key={hw.homeworkId ?? idx}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                            <HiBookOpen size={18} className="text-indigo-500" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            {/* Subject + tags — wraps naturally on narrow screens */}
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="text-sm font-semibold text-slate-800">
                                                    {hw.subject || "Subject"}
                                                </h3>

                                                <Tag color="blue" icon={<CalendarOutlined />}>
                                                    {hw.homeworkDate
                                                        ? dayjs(hw.homeworkDate).format("DD-MM-YYYY")
                                                        : "-"}
                                                </Tag>

                                                {hw.academicYear && (
                                                    <Tag color="default">{hw.academicYear}</Tag>
                                                )}
                                            </div>

                                            <p className="text-xs text-slate-500 mb-2 break-words">
                                                {hw.standard
                                                    ? `Std.${hw.standard.replace(" Standard", "")}`
                                                    : ""}
                                                {hw.division ? ` (${hw.division})` : ""}
                                                {hw.medium ? ` • ${hw.medium} Medium` : ""}
                                            </p>

                                            <p className="text-sm text-slate-700 break-words">
                                                {hw.remark || "No remark added."}
                                            </p>

                                            {hw.uploadedFile && (
                                                <button
                                                    onClick={() =>
                                                        handleViewAttachment(hw.uploadedFile as string)
                                                    }
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer mt-2"
                                                >
                                                    <PaperClipOutlined />
                                                    View attachment
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ===========================
                            Pagination — only shown when there's more than
                            one page's worth of (filtered) records.
                        =========================== */}
                        {totalCount > PAGE_SIZE && (
                            <div className="flex justify-center sm:justify-end mt-4 sm:mt-5">
                                <Pagination
                                    current={currentPage}
                                    pageSize={PAGE_SIZE}
                                    total={totalCount}
                                    onChange={(page) => setCurrentPage(page)}
                                    showSizeChanger={false}
                                />
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
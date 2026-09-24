import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Spin, Empty, message, Tabs, Button, DatePicker } from "antd";
import {
    PrinterOutlined,
    CheckOutlined,
    CloseOutlined,
    LeftOutlined,
    RightOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import {
    HiCheckCircle,
    HiXCircle,
    HiDownload,
    HiUser,
    HiStar,
    HiCurrencyRupee,
    HiCalendar,
} from "react-icons/hi";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import FeeReceiptModal, { getPaymentReceiptNo } from "../components/FeeReceipt";

import {
    getStudentById,
    getStudentByUserId,
    getStudentFeeById,
    extractFeesFromStudent,
    type StudentDTO,
    type StudentResultDTO,
    type StudentFeeDTO,
    type FeePaymentDTO,
} from "../services/studentService";
import {
    getStudentAttendanceForMonth,
    type AttendanceStatus,
} from "../services/attendanceService";

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
// Small formatting helper
// ===========================

const formatCurrency = (value?: number | null): string => {
    if (value === undefined || value === null || isNaN(value)) return "-";
    return `\u20b9 ${Number(value).toLocaleString("en-IN")}`;
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
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] border-b border-slate-200 last:border-b-0">
            <span className="px-4 pt-2 pb-1 sm:py-2 text-xs sm:text-sm font-medium sm:font-normal text-slate-400 sm:text-slate-500 bg-slate-50">
                {label}
            </span>

            <span className="px-4 pb-2 sm:py-2 text-sm font-medium text-slate-800 break-words">
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
    extra,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    extra?: React.ReactNode;
}) {
    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full ${className}`}
        >
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-base font-semibold text-indigo-700">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-xs text-slate-500 mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>

                {extra && <div className="shrink-0">{extra}</div>}
            </div>

            <div className="p-3 sm:p-5 flex-1">
                {children}
            </div>
        </div>
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
                        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
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
                                <div className="overflow-x-auto rounded-lg border border-slate-100">
                                    <table className="w-full text-sm min-w-[420px]">
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
// Fee Card (read-only)
// -----------------------------------------------------------
// Shows the same fee data as the "View" (eye icon) drawer on the
// Student Fees screen, driven by GET
// /jnpa-school-project/studentFee/getStudentFee/{studentFeeId}.
// Purely read-only — no inputs, no edit/delete actions.
// ===========================
function FeeCard({
    fees,
    loading,
    error,
    onPrintReceipt,
}: {
    fees: StudentFeeDTO[];
    loading: boolean;
    error: string | null;
    onPrintReceipt: (fee: StudentFeeDTO, payment: FeePaymentDTO | null) => void;
}) {
    if (loading) {
        return (
            <Card title="Fee">
                <div className="py-10 flex items-center justify-center">
                    <Spin tip="Loading fee details..." />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card title="Fee">
                <div className="py-8 text-center">
                    <p className="text-sm text-red-500 font-medium">
                        Failed to load fee details.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">{error}</p>
                </div>
            </Card>
        );
    }

    if (!fees || fees.length === 0) {
        return (
            <Card title="Fee">
                <div className="py-8 text-center">
                    <p className="text-sm text-slate-400">
                        No fee records found.
                    </p>
                </div>
            </Card>
        );
    }

    // ===========================
    // Overall Fee Summary
    // ===========================

    const totalFee = fees.reduce(
        (sum, fee) => sum + (Number(fee.totalFeeAmount) || 0),
        0
    );

    const totalPaid = fees.reduce(
        (sum, fee) => sum + (Number(fee.paidAmount) || 0),
        0
    );

    const totalPending = fees.reduce(
        (sum, fee) => sum + (Number(fee.pendingAmount) || 0),
        0
    );

    const totalDue = fees.reduce(
        (sum, fee) => sum + (Number(fee.dueAmount) || 0),
        0
    );

    return (
        <div className="flex flex-col gap-5">

            {/* =================================
                Overall Fee Summary
            ================================= */}

            <Card title="Fee Summary">

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                    <InfoStat
                        value={formatCurrency(totalFee)}
                        label="Total Fee"
                    />

                    <InfoStat
                        value={formatCurrency(totalPaid)}
                        label="Paid Amount"
                    />

                    <InfoStat
                        value={formatCurrency(totalPending)}
                        label="Pending Amount"
                    />

                    <InfoStat
                        value={formatCurrency(totalDue)}
                        label="Due Amount"
                    />

                </div>

            </Card>


            {/* =================================
                Individual Fee Records
            ================================= */}

            {fees.map((fee, index) => {

                const payments: FeePaymentDTO[] = fee.feePaymentDTOS || [];

                const feeTotal = fee.totalFeeAmount;
                const feePaid = fee.paidAmount;
                const feePending = fee.pendingAmount;
                const feeDue = fee.dueAmount;
                const feeName = fee.feeName;
                const feeDueDate = fee.dueDate;
                const feeYear = fee.academicYear;
                const feeId = fee.studentFeeId;

                return (
                    <Card
                        key={feeId ?? index}
                        title={feeName || `Fee Record ${index + 1}`}
                        subtitle={
                            feeYear
                                ? `Academic Year: ${feeYear}`
                                : undefined
                        }
                        extra={
                            <Button
                                size="small"
                                icon={<PrinterOutlined />}
                                onClick={() => onPrintReceipt(fee, null)}
                            >
                                Print Receipt
                            </Button>
                        }
                    >

                        {/* =================================
                            Main Fee Information
                        ================================= */}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">

                            {/* Total Fee */}

                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                <p className="text-xs text-slate-500 mb-1">
                                    Total Fee
                                </p>

                                <p className="text-lg font-semibold text-slate-800">
                                    {formatCurrency(feeTotal)}
                                </p>
                            </div>


                            {/* Paid Amount */}

                            <div className="rounded-lg border border-slate-100 bg-green-50 p-4">
                                <p className="text-xs text-slate-500 mb-1">
                                    Paid Amount
                                </p>

                                <p className="text-lg font-semibold text-green-600">
                                    {formatCurrency(feePaid)}
                                </p>
                            </div>


                            {/* Pending Amount */}

                            <div className="rounded-lg border border-slate-100 bg-orange-50 p-4">
                                <p className="text-xs text-slate-500 mb-1">
                                    Pending Amount
                                </p>

                                <p className="text-lg font-semibold text-orange-600">
                                    {formatCurrency(feePending)}
                                </p>
                            </div>

                        </div>


                        {/* =================================
                            Fee Details
                        ================================= */}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">

                            <InfoRow
                                label="Due Amount"
                                value={
                                    feeDue !== undefined
                                        ? formatCurrency(feeDue)
                                        : "-"
                                }
                            />

                            <InfoRow
                                label="Due Date"
                                value={
                                    feeDueDate
                                        ? dayjs(feeDueDate).format("DD-MM-YYYY")
                                        : "-"
                                }
                            />

                        </div>


                        {/* =================================
                            Payment History
                        ================================= */}

                        {payments.length > 0 && (
                            <div className="mt-4">

                                <div className="flex items-center justify-between mb-3">

                                    <h4 className="text-sm font-semibold text-slate-700">
                                        Payment History
                                    </h4>

                                    <span className="text-xs text-slate-400">
                                        {payments.length} Payment
                                        {payments.length !== 1 ? "s" : ""}
                                    </span>

                                </div>


                                <div className="overflow-x-auto rounded-lg border border-slate-100">

                                    <table className="w-full text-sm min-w-[720px]">

                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-xs">

                                                <th className="text-left font-medium px-3 py-3">
                                                    Receipt No
                                                </th>

                                                <th className="text-left font-medium px-3 py-3">
                                                    Payment Date
                                                </th>

                                                <th className="text-right font-medium px-3 py-3">
                                                    Amount
                                                </th>

                                                <th className="text-left font-medium px-3 py-3">
                                                    Payment Mode
                                                </th>

                                                <th className="text-left font-medium px-3 py-3">
                                                    Transaction ID
                                                </th>

                                                <th className="text-left font-medium px-3 py-3">
                                                    Remarks
                                                </th>

                                                <th className="text-right font-medium px-3 py-3">
                                                    Receipt
                                                </th>

                                            </tr>
                                        </thead>


                                        <tbody>

                                            {payments.map((payment, paymentIndex) => {
                                                const paymentId = payment.feePaymentId;
                                                const paymentDate = payment.paymentDate;
                                                const paymentAmount = payment.amount;
                                                const paymentMode = payment.paymentMode;
                                                const paymentTxn = payment.transactionId;
                                                const paymentRemarks = payment.remarks;

                                                return (
                                                    <tr
                                                        key={paymentId ?? paymentIndex}
                                                        className="border-t border-slate-100"
                                                    >

                                                        <td className="px-3 py-3 text-slate-600 font-medium">
                                                            {getPaymentReceiptNo(payment)}
                                                        </td>

                                                        <td className="px-3 py-3 text-slate-600">
                                                            {paymentDate
                                                                ? dayjs(paymentDate).format("DD-MM-YYYY")
                                                                : "-"}
                                                        </td>

                                                        <td className="px-3 py-3 text-right font-semibold text-green-600">
                                                            {formatCurrency(paymentAmount)}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                                                                {paymentMode || "-"}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-3 text-slate-600">
                                                            {paymentTxn || "-"}
                                                        </td>

                                                        <td className="px-3 py-3 text-slate-500">
                                                            {paymentRemarks || "-"}
                                                        </td>

                                                        <td className="px-3 py-3 text-right">
                                                            <Button
                                                                size="small"
                                                                icon={<PrinterOutlined />}
                                                                onClick={() => onPrintReceipt(fee, payment)}
                                                            >
                                                                Receipt
                                                            </Button>
                                                        </td>

                                                    </tr>
                                                );
                                            })}

                                        </tbody>

                                    </table>

                                </div>

                            </div>
                        )}

                    </Card>
                );
            })}

        </div>
    );
}

// ===========================
// Attendance Card (read-only)
// -----------------------------------------------------------
// Shows this one student's own attendance as a full calendar grid —
// green check badge on days marked Present, red cross badge for Absent,
// plain number for days nothing was marked yet, greyed-out numbers for
// the padding days from the previous/next month. Driven by
// getStudentAttendanceForMonth(), which filters
// GET /studentAttendance/getAllStudentAttendanceByFilter by studentId
// + the visible month's date range (with a client-side re-filter as a
// safety net — see attendanceService.ts).
//
// Mobile layout notes:
//   - Month-nav row wraps (flex-wrap) instead of overflowing on narrow
//     screens, and the month DatePicker shrinks a bit below `sm`.
//   - The two stat cards go flex-col (stacked, full width) below `sm`
//     since a phone-width screen is too narrow to fit both side by
//     side without squeezing their text; from `sm` up (still stacked
//     under the calendar on tablet widths) they sit side by side; from
//     `md` up they move next to the calendar, stacked again.
//   - Calendar day cells shrink their min-height a bit below `sm` to
//     save vertical space on short phone screens.
// ===========================

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AttendanceCard({
    month,
    onMonthChange,
    attendanceMap,
    loading,
}: {
    month: Dayjs;
    onMonthChange: (next: Dayjs) => void;
    attendanceMap: Record<string, AttendanceStatus>;
    loading: boolean;
}) {
    const presentCount = Object.values(attendanceMap).filter(
        (status) => status === "PRESENT"
    ).length;

    const absentCount = Object.values(attendanceMap).filter(
        (status) => status === "ABSENT"
    ).length;

    // Build a Sun-Sat grid covering the whole month, padded with the
    // trailing days of the previous month and the leading days of the
    // next month so every week row has all 7 columns filled in.
    const startOfMonth = month.startOf("month");
    const daysInMonth = month.daysInMonth();
    const startWeekday = startOfMonth.day(); // 0 (Sun) – 6 (Sat)
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

    const cells = Array.from({ length: totalCells }, (_, i) => {
        const date = startOfMonth.add(i - startWeekday, "day");
        return { date, inCurrentMonth: date.month() === month.month() };
    });

    const today = dayjs();
    const isNextMonthDisabled = month.add(1, "month").isAfter(today, "month");

    return (
        <Card title="Attendance">
            <div className="flex flex-col md:flex-row gap-5 items-center justify-center">
                {/* Calendar */}
                <div className="w-full md:w-[380px] shrink-0">
                    {/* Month nav: ‹ September 2026 ▾ › + jump-to-today.
                        flex-wrap so it drops to a second line instead of
                        overflowing on very narrow phones. */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                        <div className="flex items-center gap-1">
                            <Button
                                shape="circle"
                                size="small"
                                icon={<LeftOutlined />}
                                onClick={() => onMonthChange(month.subtract(1, "month"))}
                            />
                            <DatePicker
                                picker="month"
                                value={month}
                                onChange={(date) => date && onMonthChange(date)}
                                allowClear={false}
                                bordered={false}
                                format="MMMM YYYY"
                                className="!font-semibold !text-slate-800 !px-1 sm:!px-2 w-[120px] sm:w-[150px]"
                            />
                            <Button
                                shape="circle"
                                size="small"
                                icon={<RightOutlined />}
                                disabled={isNextMonthDisabled}
                                onClick={() => onMonthChange(month.add(1, "month"))}
                            />
                        </div>

                        <Button
                            shape="circle"
                            size="small"
                            icon={<CalendarOutlined />}
                            onClick={() => onMonthChange(dayjs())}
                            title="Jump to current month"
                        />
                    </div>

                    {loading ? (
                        <div className="py-10 flex items-center justify-center">
                            <Spin tip="Loading attendance..." />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            {/* Weekday header row */}
                            <div className="grid grid-cols-7">
                                {WEEKDAY_LABELS.map((d) => (
                                    <div
                                        key={d}
                                        className="bg-indigo-50 text-indigo-700 text-[10px] sm:text-xs font-semibold text-center py-1.5 sm:py-2 border-b border-slate-200"
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Day cells */}
                            <div className="grid grid-cols-7">
                                {cells.map(({ date, inCurrentMonth }) => {
                                    const status = attendanceMap[date.format("YYYY-MM-DD")];
                                    const isToday = date.isSame(today, "day");

                                    return (
                                        <div
                                            key={date.format("YYYY-MM-DD")}
                                            className={`min-h-[44px] sm:min-h-[56px] flex flex-col items-center justify-start gap-0.5 sm:gap-1 py-1.5 sm:py-2 border-b border-r border-slate-100 last:border-r-0 ${
                                                isToday ? "bg-indigo-50/70" : ""
                                            }`}
                                        >
                                            <span
                                                className={`text-[11px] sm:text-xs font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                                                    !inCurrentMonth
                                                        ? "text-slate-300"
                                                        : isToday
                                                        ? "bg-indigo-600 text-white"
                                                        : "text-slate-700"
                                                }`}
                                            >
                                                {date.date()}
                                            </span>

                                            {inCurrentMonth && status && (
                                                <span
                                                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white ${
                                                        status === "PRESENT" ? "bg-green-500" : "bg-red-500"
                                                    }`}
                                                >
                                                    {status === "PRESENT" ? (
                                                        <CheckOutlined style={{ fontSize: 9 }} />
                                                    ) : (
                                                        <CloseOutlined style={{ fontSize: 9 }} />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Present / Absent — stacked on phones (safest fit), side by
                    side once there's a bit more room (sm), stacked again
                    next to the calendar from md up. */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-72 md:mt-8">
                    <div className="flex-1 relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-green-100 p-4 flex items-center gap-4">
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-green-200/40 blur-xl" />
                        <div className="relative w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md shrink-0">
                            <CheckOutlined style={{ fontSize: 18 }} />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-semibold text-green-800">Present</p>
                            <p className="text-2xl font-bold text-green-900 leading-tight">{presentCount}</p>
                            <p className="text-xs text-green-700">Days</p>
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-pink-100 p-4 flex items-center gap-4">
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-red-200/40 blur-xl" />
                        <div className="relative w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md shrink-0">
                            <CloseOutlined style={{ fontSize: 18 }} />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-semibold text-red-800">Absent</p>
                            <p className="text-2xl font-bold text-red-900 leading-tight">{absentCount}</p>
                            <p className="text-xs text-red-700">Days</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
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

    // Which tab is showing on the right-hand side (Personal / Address /
    // Academic / Documents / etc.)
    const [activeTab, setActiveTab] = useState("personal");

    // ===========================
    // Fee tab state
    // -----------------------------------------------------------
    // Fee list comes from the student payload (studentFeeDTOS), then
    // each record is enriched on-demand via
    // GET /studentFee/getStudentFee/{studentFeeId}.
    // ===========================
    const [fees, setFees] = useState<StudentFeeDTO[]>([]);
    const [feeLoading, setFeeLoading] = useState(false);
    const [feeError, setFeeError] = useState<string | null>(null);
    const [feeFetchedForId, setFeeFetchedForId] = useState<number | null>(null);

    // Which fee's/transaction's printable receipt is currently open
    // (either the card-level "Print Receipt" button, or a "Receipt"
    // button on one payment row) — null when the modal is closed.
    const [receiptTarget, setReceiptTarget] = useState<{
        fee: StudentFeeDTO;
        payment: FeePaymentDTO | null;
    } | null>(null);

    // ===========================
    // Attendance tab state
    // -----------------------------------------------------------
    // Which calendar month is showing, and that month's attendance for
    // THIS student only (date -> PRESENT/ABSENT), fetched fresh whenever
    // the tab is opened or the month is changed.
    // ===========================
    const [attendanceMonth, setAttendanceMonth] = useState<Dayjs>(dayjs());
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
    const [attendanceLoading, setAttendanceLoading] = useState(false);

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
    // Fetch Fee Data
    // -----------------------------------------------------------
    // Fires when the user opens the Fee tab. The student payload
    // (getStudentById / getStudentByUserId) carries one or more fee
    // records under studentFeeDTOS, each with its own studentFeeId.
    // For each of those ids we call the dedicated detail endpoint —
    //   GET /jnpa-school-project/studentFee/getStudentFee/{studentFeeId}
    // — to get the fully populated record (including every
    // feePaymentDTOS entry), the same data shown by the "View" (eye
    // icon) drawer on the Student Fees screen. Only fetches once per
    // student (won't re-fetch every time you switch tabs back and
    // forth) — remove the feeFetchedForId guard if you want it to
    // always refetch instead.
    // ===========================

    useEffect(() => {
        if (activeTab !== "fee") return;
        if (!student) return;

        const studentKey = student.studentId ?? null;
        if (feeFetchedForId === studentKey) return; // already fetched

        const feeStubs = extractFeesFromStudent(student);

        if (feeStubs.length === 0) {
            setFees([]);
            setFeeError(null);
            setFeeFetchedForId(studentKey);
            return;
        }

        const loadFees = async () => {
            setFeeLoading(true);
            setFeeError(null);

            try {
                const results = await Promise.all(
                    feeStubs.map(async (stub) => {
                        if (!stub.studentFeeId) return stub;
                        const res = await getStudentFeeById(stub.studentFeeId);
                        return res?.data ?? stub;
                    })
                );

                setFees(results);
                setFeeFetchedForId(studentKey);
            } catch (err: any) {
                console.error("Failed to load fee details:", err);
                setFeeError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Something went wrong while loading fee details."
                );
            } finally {
                setFeeLoading(false);
            }
        };

        loadFees();
    }, [activeTab, student, feeFetchedForId]);

    // ===========================
    // Fetch Attendance Data
    // -----------------------------------------------------------
    // Fires when the Attendance tab is open, and again whenever the
    // visible month is changed via the ‹ › buttons.
    // ===========================

    useEffect(() => {
        if (activeTab !== "attendance") return;
        if (!student?.studentId) return;

        let cancelled = false;
        setAttendanceLoading(true);

        getStudentAttendanceForMonth(
            student.studentId,
            attendanceMonth.year(),
            attendanceMonth.month() + 1
        )
            .then((map) => {
                if (!cancelled) setAttendanceMap(map);
            })
            .finally(() => {
                if (!cancelled) setAttendanceLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [activeTab, student?.studentId, attendanceMonth]);

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
        <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-8 sm:py-6">

            

            <div className="max-w-6xl mx-auto">

               {/* ===========================
    TOP OVERVIEW
    ONE CARD WITH PARTITION
=========================== */}

<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

    <div className="grid grid-cols-1 md:grid-cols-2">

        {/* ===========================
            STUDENT PROFILE
        =========================== */}
        <div className="p-4 sm:p-6 flex flex-col items-center text-center">

            <h2 className="text-base font-semibold text-indigo-700 mb-4">
                {student.firstName} {student.lastName}
            </h2>

            {/* Profile Image */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">

                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <HiUser
                        size={40}
                        className="text-slate-300"
                    />
                )}

            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-5 w-full max-w-sm mt-6">

                <InfoStat
                    value={String(student.studentId ?? "-")}
                    label="Admission Id"
                />

                <InfoStat
                    value={student.gender || "-"}
                    label="Gender"
                />

                <InfoStat
                    value={academic?.rollNo || "-"}
                    label="Roll No"
                />

                {/* Status */}
                <div className="text-center">

                    <p
                        className={`text-base font-semibold ${
                            isActive
                                ? "text-green-600"
                                : "text-red-500"
                        }`}
                    >
                        {student.status || "-"}
                    </p>

                    <p className="text-xs text-slate-500 mt-0.5">
                        Status
                    </p>

                </div>

            </div>

            

        </div>


        {/* ===========================
            VERTICAL PARTITION
            + PROFILE CHECKLIST
        =========================== */}

        <div className="p-4 sm:p-6 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-center">


                
            <div className="space-y-0">

                <ChecklistRow
                    label="Personal Info"
                    complete={personalInfoComplete}
                />

                <ChecklistRow
                    label="Address Info"
                    complete={addressInfoComplete}
                />

                <ChecklistRow
                    label="Academic Info"
                    complete={academicInfoComplete}
                />

                <ChecklistRow
                    label="Uploaded Documents"
                    complete={documentsComplete}
                />

            </div>
            {/* Profile Completion */}
            <div className="w-full border-t border-slate-100 mt-6 pt-4">

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

</div>
                {/* ===========================
                    TABS — full width, below the overview row
                =========================== */}

               <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

    <div className="px-2 sm:px-4 pt-2">

        <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
                        items={[
                            {
                                key: "personal",
                                label: "Personal Info",
                                children: (
                                    <div className="px-1 pb-5">
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <InfoRow label="First Name" value={student.firstName} />
                                        <InfoRow label="Last Name" value={student.lastName} />
                                        <InfoRow label="Gender" value={student.gender} />
                                        <InfoRow
                                            label="Date of Birth"
                                            value={
                                                student.DOB
                                                    ? dayjs(student.DOB).format("DD-MM-YYYY")
                                                    : undefined
                                            }
                                        />
                                        <InfoRow label="Blood Group" value={student.bloodGroup} />
                                        <InfoRow label="Category" value={student.category} />
                                        <InfoRow label="Religion" value={student.religion} />
                                        <InfoRow label="Caste" value={student.caste} />
                                        <InfoRow label="Nationality" value={student.nationality} />
                                        <InfoRow label="Aadhaar No" value={student.aadhaarCard} />
                                        <InfoRow label="Status" value={student.status} />
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: "address",
                                label: "Address Info",
                                children: (
                                    <div className="px-1 pb-5">
                                        <InfoRow label="Student Address" value={student.address} />
                                        <InfoRow label="Parent / Guardian Address" value={parent?.address} />
                                    </div>
                                ),
                            },
                            {
                                key: "parent",
                                label: "Parent / Guardian",
                                children: (
                                    <div className="px-1 pb-5">
                                        <InfoRow label="Name" value={parent?.name} />
                                        <InfoRow label="Relation" value={parent?.relation} />
                                        <InfoRow label="Occupation" value={parent?.occupation} />
                                        <InfoRow label="Phone" value={parent?.phone} />
                                        <InfoRow label="Email" value={parent?.email} />
                                        <InfoRow label="Address" value={parent?.address} />
                                        <InfoRow
                                            label="Annual Income"
                                            value={
                                                parent?.annualIncome !== undefined &&
                                                    parent?.annualIncome !== null
                                                    ? `\u20b9 ${parent.annualIncome}`
                                                    : undefined
                                            }
                                        />
                                    </div>
                                ),
                            },
                            {
                                key: "academic",
                                label: "Academic Info",
                                children: (
                                    <div className="px-1 pb-5 flex flex-col gap-4">
                                        {academicRecords.length === 0 ? (
                                            <p className="text-sm text-slate-400">
                                                No academic information added yet.
                                            </p>
                                        ) : (
                                            academicRecords.map((rec, idx) => (
                                                <div
                                                    key={rec.academicInformationId ?? idx}
                                                    className="rounded-xl border border-slate-100 p-4"
                                                >
                                                    <h3 className="text-sm font-semibold text-indigo-700 mb-1">
                                                        {rec.standard
                                                            ? `Std.${rec.standard.replace(" Standard", "")}${rec.section ? ` Section-${rec.section}` : ""
                                                            }`
                                                            : `Academic Record ${idx + 1}`}
                                                    </h3>

                                                    {rec.academicYear && (
                                                        <p className="text-xs text-slate-500 mb-2">
                                                            Academic Year: {rec.academicYear}
                                                        </p>
                                                    )}

                                                    <InfoRow label="Admission No" value={rec.admissionNo} />
                                                    <InfoRow
                                                        label="Admission Date"
                                                        value={
                                                            rec.admissionDate
                                                                ? dayjs(rec.admissionDate).format("DD-MM-YYYY")
                                                                : undefined
                                                        }
                                                    />
                                                    <InfoRow label="Standard" value={rec.standard} />
                                                    {/* <InfoRow label="Section" value={rec.section} /> */}
                                                    {/* 🛠️ FIX: Division and Medium are real fields on
                                                        academicInformation (same ones editable in the
                                                        Student edit form's Academic Info section) but
                                                        were missing from this read-only view. */}
                                                    <InfoRow label="Division" value={rec.division} />
                                                    <InfoRow label="Medium" value={rec.medium} />
                                                    <InfoRow label="Roll No" value={rec.rollNo} />
                                                    <InfoRow label="Academic Year" value={rec.academicYear} />
                                                    <InfoRow label="Blood Group" value={rec.bloodGroup} />
                                                    <InfoRow label="Category" value={rec.category} />
                                                    <InfoRow label="Caste" value={rec.caste} />
                                                    <InfoRow
                                                        label="Date of Birth"
                                                        value={
                                                            rec.dob
                                                                ? dayjs(rec.dob).format("DD-MM-YYYY")
                                                                : undefined
                                                        }
                                                    />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: "achievements",
                                label: "Achievements",
                                children: (
                                    <div className="px-1 pb-5">
                                        {achievements.length === 0 ? (
                                            <div className="text-center py-6">
                                                <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-3">
                                                    <HiStar size={28} className="text-amber-400" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">
                                                    No achievements added yet.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {achievements.map((achievement, index) => (
                                                    <div
                                                        key={achievement.studentAchievementId ?? index}
                                                        className="flex items-start gap-3 p-4 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white hover:shadow-md transition-all duration-200"
                                                    >
                                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                            <HiStar size={21} className="text-amber-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-semibold text-slate-800">
                                                                {achievement.achievementName || "Achievement"}
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
                                    </div>
                                ),
                            },
                            {
                                key: "documents",
                                label: "Uploaded Documents",
                                children: (
                                    <div className="px-1 pb-5">
                                        {documents.length === 0 ? (
                                            <p className="text-sm text-slate-400">No documents uploaded.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {documents.map((doc, idx) => (
                                                    <div
                                                        key={doc.studentDocumentId ?? idx}
                                                        className="flex items-center justify-between gap-2 py-2 border-b border-slate-50 last:border-b-0"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm text-slate-700 truncate">
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
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer print:hidden shrink-0"
                                                        >
                                                            <HiDownload size={14} />
                                                            View
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: "results",
                                label: "Results",
                                children: (
                                    <div className="px-1 pb-5">
                                        <ResultCard results={results} />
                                    </div>
                                ),
                            },
                            {
                                key: "fee",
                                label: (
                                    <span className="inline-flex items-center gap-1">
                                        <HiCurrencyRupee size={15} />
                                        Fee
                                    </span>
                                ),
                                children: (
                                    <div className="px-1 pb-5">
                                        <FeeCard
                                            fees={fees}
                                            loading={feeLoading}
                                            error={feeError}
                                            onPrintReceipt={(fee, payment) =>
                                                setReceiptTarget({ fee, payment })
                                            }
                                        />
                                    </div>
                                ),
                            },
                            {
                                key: "attendance",
                                label: (
                                    <span className="inline-flex items-center gap-1">
                                        <HiCalendar size={15} />
                                        Attendance
                                    </span>
                                ),
                                children: (
                                    <div className="px-1 pb-5">
                                        <AttendanceCard
                                            month={attendanceMonth}
                                            onMonthChange={setAttendanceMonth}
                                            attendanceMap={attendanceMap}
                                            loading={attendanceLoading}
                                        />
                                    </div>
                                ),
                            },
                        ]}
                    />

                </div>

            </div>

        </div>

        <FeeReceiptModal
            open={!!receiptTarget}
            onClose={() => setReceiptTarget(null)}
            student={student}
            academic={academic}
            fee={receiptTarget?.fee ?? null}
            payment={receiptTarget?.payment ?? null}
        />
        </div>

    );
}
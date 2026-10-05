import { useState, useEffect, useCallback, useMemo } from "react";
import {
  message,
  Modal,
  Button,
  Input,
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Empty,
  Grid,
  Pagination,
  Spin,
} from "antd";
import { SearchOutlined, ReloadOutlined, FilePdfOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import jsPDF from "jspdf"; // npm install jspdf jspdf-autotable
import autoTable from "jspdf-autotable";
import { getAllStaticData } from "../services/staticDataService";
import CommonTable from "../components/commonTable";
// Same two imports as the Employee Salary screen (only the paths may need a change)
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";
// Search bar: Standard, Division, From date, To date, First name, Last name
interface StudentSearchFilters {
  firstName: string;
  lastName: string;
  standard?: string;
  division?: string;
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
}
const EMPTY_FILTERS: StudentSearchFilters = {
  firstName: "",
  lastName: "",
  standard: undefined,
  division: undefined,
  fromDate: null,
  toDate: null,
};
// static data may come as plain strings or as objects -> always give the Select a string
const toOption = (item: any): { label: string; value: string } => {
  const v = typeof item === "string" ? item : String(item?.name ?? item?.value ?? item?.label ?? item);
  return { label: v, value: v };
};
// ---------- helpers ----------
const num = (v: any) => Number(v) || 0;
 
const money = (v?: number | null) =>
  v === null || v === undefined
    ? "-"
    : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Academic year starts in April: Sep 2026 -> "2026-2027", Feb 2027 -> "2026-2027"
const getAcademicYear = (d: Dayjs = dayjs()) => {
  const y = d.year();
  return d.month() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};
/* =====================================================================
   EXPORT REPORT (report API + PDF builder, all inside this file)
   ===================================================================== */
interface FeeReportRow {
  academicYear: string;
  feeName: string;
  paidAmount: number;
  pendingAmount: number;
  totalFeeAmount: number;
}
interface FeeReportStudent {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  printDate?: string;
  printTime?: string;
  feeReportDataDTOS: FeeReportRow[];
}
// Put your real school details here (they appear in the report header)
const SCHOOL = {
  name: "JNPV School",
  subtitle: "Jawaharlal Nehru Port Vidyalaya",
  addressLines: ["Your school address line 1", "City, State, PIN"],
  contact: "Contact No: 0000000000",
  email: "Email: school@example.com",
};
const MAROON: [number, number, number] = [128, 0, 0];
const PDF_MARGIN = { top: 15, left: 10, right: 10, bottom: 18 };
const PDF_COLUMNS = ["Academic Year", "Fee Name", "Total Fee", "Paid Amount", "Pending Amount"];
const PDF_COL_WIDTHS = [30, 55, 35, 35, 35]; // = 190mm
const pdfColumnStyles = PDF_COL_WIDTHS.reduce((acc, w, i) => {
  acc[i] = { cellWidth: w };
  return acc;
}, {} as Record<number, { cellWidth: number }>);
const fix2 = (v: any) => num(v).toFixed(2);
const capitalize = (v?: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "-");
const reportName = (s: FeeReportStudent) => [s.firstName, s.lastName].filter(Boolean).join(" ").trim();
const sumOf = (rows: any[], key: string) => rows.reduce((acc, r) => acc + num(r?.[key]), 0);
// POST studentFee/getStudentFeeReportData?page=&size=&desc&paginate=true
// Body example (only the selected filters are sent, nothing selected -> {}):
// {
//   "fromDate": "2026-08-02",
//   "toDate": "2026-08-05",
//   "division": "A",
//   "standard": "2nd Standard"
// }
// This function is used by BOTH Search and Export Report.
// We read ALL pages, then first / last name are filtered here in the browser.
const fetchStudentFeeReport = async (filters: StudentSearchFilters): Promise<FeeReportStudent[]> => {
  const size = 20;
  let pageNo = 0;
  let totalCount = 0;
  const all: FeeReportStudent[] = [];
 
  // Only the selected filters go in the payload
  const payload: Record<string, string> = {};
  if (filters.standard) payload.standard = filters.standard;
  if (filters.division) payload.division = filters.division;
  if (filters.fromDate) payload.fromDate = filters.fromDate.format("YYYY-MM-DD");
  if (filters.toDate) payload.toDate = filters.toDate.format("YYYY-MM-DD");
  do {
    const res = await axiosInstance.post(apiEndpoints.getStudentFeeReportData(pageNo, size), payload);
    const data = res.data;
    if (!data?.success) throw new Error(data?.message || "Failed to load fee report");
    const list: FeeReportStudent[] = data.data?.Data || [];
    // this API sends the count as "Total elements"
    totalCount = data.data?.["Total elements"] ?? data.data?.Total ?? list.length;
    all.push(...list);
    if (list.length === 0) break; // safety: never loop forever
    pageNo += 1;
  } while (all.length < totalCount);
  // First / last name are filtered here in the browser
  const first = (filters.firstName || "").trim().toLowerCase();
  const last = (filters.lastName || "").trim().toLowerCase();
  return all.filter(
    (s) =>
      (!first || (s.firstName || "").trim().toLowerCase().includes(first)) &&
      (!last || (s.lastName || "").trim().toLowerCase().includes(last)) &&
      // safety net: if the backend sends standard / division on each student, filter on them too
      (!filters.standard || !(s as any).standard || (s as any).standard === filters.standard) &&
      (!filters.division || !(s as any).division || (s as any).division === filters.division)
  );
};
// Builds the report in the same layout as the Employee Salary report
// and returns it as a Blob (shown in a preview popup, can be downloaded from there).
const buildFeeReportPdf = (
  students: FeeReportStudent[],
  academicYear: string,
  filters: StudentSearchFilters
): Blob => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  // ----- header (first page only) -----
  let y = 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...MAROON);
  doc.text(SCHOOL.name, centerX, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  [SCHOOL.subtitle, ...SCHOOL.addressLines, SCHOOL.contact, SCHOOL.email]
    .filter(Boolean)
    .forEach((line) => {
      y += 5;
      doc.text(line, centerX, y, { align: "center" });
    });
  y += 9;
  const title = "Student Fee Report";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...MAROON);
  doc.text(title, centerX, y, { align: "center" });
  const titleWidth = doc.getTextWidth(title);
  doc.setDrawColor(...MAROON);
  doc.setLineWidth(0.4);
  doc.line(centerX - titleWidth / 2, y + 1, centerX + titleWidth / 2, y + 1);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Academic Year: ${academicYear}`, centerX, y, { align: "center" });
  // applied filters (only the ones that were selected)
  const filterParts = [
    filters.standard ? `Standard: ${filters.standard}` : "",
    filters.division ? `Division: ${filters.division}` : "",
    filters.fromDate ? `From: ${filters.fromDate.format("DD-MM-YYYY")}` : "",
    filters.toDate ? `To: ${filters.toDate.format("DD-MM-YYYY")}` : "",
  ].filter(Boolean);
  if (filterParts.length) {
    y += 5;
    doc.text(filterParts.join("      "), centerX, y, { align: "center" });
  }
  y += 4;
  doc.setDrawColor(...MAROON);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGIN.left, y, pageWidth - PDF_MARGIN.right, y);
  let cursorY = y + 6;
  // ----- one block per student -----
  const allRows: FeeReportRow[] = [];
  const bold = { fontStyle: "bold" as const };
  students.forEach((stu) => {
    const rows = stu.feeReportDataDTOS || [];
    allRows.push(...rows);
    const hasFees = rows.length > 0;
    // keep one student block together on a page
    const estimatedHeight = ((hasFees ? 2 : 1) + rows.length + 2) * 6.5 + 6;
    if (cursorY + estimatedHeight > pageHeight - PDF_MARGIN.bottom) {
      doc.addPage();
      cursorY = PDF_MARGIN.top;
    }
    // Student info row (+ column titles only when the student has fees — empty ones stay blank)
    const head: any[] = [
      [
        { content: `Student Name: ${reportName(stu)}`, colSpan: 2, styles: { halign: "left" } },
        { content: `Gender: ${capitalize(stu.gender)}`, colSpan: 1, styles: { halign: "left" } },
        { content: `Phone: ${stu.phone || "-"}`, colSpan: 2, styles: { halign: "right" } },
      ],
    ];
    if (hasFees) {
      head.push(PDF_COLUMNS.map((c) => ({ content: c, styles: { fontSize: 7.5, halign: "left" } })));
    }
    const body: any[] = rows.map((r) => [
      r.academicYear || "-",
      r.feeName || "-",
      fix2(r.totalFeeAmount),
      fix2(r.paidAmount),
      fix2(r.pendingAmount),
    ]);
    const totalPending = sumOf(rows, "pendingAmount");
    // Total row (0.00 when there are no fees)
    body.push([
      { content: "Total", colSpan: 2, styles: bold },
      { content: fix2(sumOf(rows, "totalFeeAmount")), styles: bold },
      { content: fix2(sumOf(rows, "paidAmount")), styles: bold },
      { content: fix2(totalPending), styles: bold },
    ]);
    // closing line, right aligned
    body.push([
      {
        content: `Total Pending Amount: ${fix2(totalPending)}`,
        colSpan: 5,
        styles: { halign: "right", fontStyle: "bold" },
      },
    ]);
    const totalRowIndex = body.length - 2;
    const closingRowIndex = body.length - 1;
    autoTable(doc, {
      startY: cursorY,
      margin: PDF_MARGIN,
      theme: "plain",
      head,
      body,
      rowPageBreak: "avoid",
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.3,
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2,
        textColor: [0, 0, 0],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: { top: 0, right: 0, bottom: 0.2, left: 0 } as any,
      },
      columnStyles: pdfColumnStyles,
      didParseCell: (data) => {
        if (
          data.section === "body" &&
          (data.row.index === totalRowIndex || data.row.index === closingRowIndex)
        ) {
          data.cell.styles.lineColor = [0, 0, 0] as any;
          data.cell.styles.lineWidth = { top: 0.2, right: 0, bottom: 0, left: 0 } as any;
        }
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 6;
  });
  // ----- grand total -----
  if (cursorY + 14 > pageHeight - PDF_MARGIN.bottom) {
    doc.addPage();
    cursorY = PDF_MARGIN.top;
  }
  autoTable(doc, {
    startY: cursorY,
    margin: PDF_MARGIN,
    theme: "plain",
    body: [
      [
        { content: "Grand Total", colSpan: 2, styles: bold },
        { content: fix2(sumOf(allRows, "totalFeeAmount")), styles: bold },
        { content: fix2(sumOf(allRows, "paidAmount")), styles: bold },
        { content: fix2(sumOf(allRows, "pendingAmount")), styles: bold },
      ],
    ],
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2, textColor: [0, 0, 0] },
    columnStyles: pdfColumnStyles,
    didParseCell: (data) => {
      data.cell.styles.lineColor = [0, 0, 0] as any;
      data.cell.styles.lineWidth = { top: 0.3, right: 0, bottom: 0.3, left: 0 } as any;
    },
  });
  // ----- footer on every page: Print Date / Time / Page x of y -----
  const firstStu = students[0];
  const printDate = firstStu?.printDate ? dayjs(firstStu.printDate) : dayjs();
  const printTime = firstStu?.printTime ? firstStu.printTime.toUpperCase() : dayjs().format("hh:mm A");
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);
    doc.line(PDF_MARGIN.left, pageHeight - 14, pageWidth - PDF_MARGIN.right, pageHeight - 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Print Date: ${printDate.format("DD-MM-YYYY")}     Time: ${printTime}`,
      PDF_MARGIN.left,
      pageHeight - 9
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - PDF_MARGIN.right, pageHeight - 9, {
      align: "right",
    });
  }
  return doc.output("blob");
};
/* ===================================================================== */
export default function StudentFeeReport() {
  // ---------- responsive (mobile) ----------
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false; // below 768px
  // table data = fee report API result (all pages), paginated in the browser
  const [allStudents, setAllStudents] = useState<FeeReportStudent[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);
  // Export report
  const [exporting, setExporting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState("Student_Fee_Report.pdf");
  // Search bar state
  const [searchFilters, setSearchFilters] = useState<StudentSearchFilters>(EMPTY_FILTERS);
  // Standard / Division dropdown options (same static data as Class Master)
  const [standardOptions, setStandardOptions] = useState<{ label: string; value: string }[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<{ label: string; value: string }[]>([]);
  useEffect(() => {
    getAllStaticData()
      .then((res) => {
        if (res?.success) {
          setStandardOptions((res.data.standard || []).map(toOption));
          setDivisionOptions((res.data.division || []).map(toOption));
        }
      })
      .catch((e) => console.error("Failed to load standard / division", e));
  }, []);
 
  // both dates are optional, but From can never be after To
  const datesInvalid = (f: StudentSearchFilters) =>
    !!f.fromDate && !!f.toDate && f.fromDate.isAfter(f.toDate, "day");
  // ---------- LOAD DATA (fee report API with the payload) — used by first load, Search and Reset ----------
  const loadReport = useCallback(async (filters: StudentSearchFilters) => {
    setTableLoading(true);
    try {
      setAllStudents(await fetchStudentFeeReport(filters));
    } catch (error: any) {
      console.error("Student fee report error:", error);
      message.error(error?.response?.data?.message || error?.message || "Failed to load student fee report");
      setAllStudents([]);
    } finally {
      setTableLoading(false);
    }
  }, []);
  // first load: nothing selected -> payload {}
  useEffect(() => {
    loadReport(EMPTY_FILTERS);
  }, [loadReport]);
  // free the blob URL if the screen is closed while the report is open
  useEffect(() => {
    return () => {
      if (reportUrl) URL.revokeObjectURL(reportUrl);
    };
  }, [reportUrl]);
 
  const displayedRows = useMemo(() => {
    const start = page * pageSize;
    return allStudents.slice(start, start + pageSize);
  }, [allStudents, page, pageSize]);
  const handleFilterChange = (field: keyof StudentSearchFilters, value: any) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };
  // ---------- SEARCH -> calls the fee report API with the payload ----------
  const handleSearch = () => {
    if (datesInvalid(searchFilters)) {
      message.warning("From date cannot be after To date");
      return;
    }
    setPage(0);
    loadReport(searchFilters);
  };
  const handleResetFilters = () => {
    setSearchFilters({ ...EMPTY_FILTERS });
    setPage(0);
    loadReport(EMPTY_FILTERS);
  };
  // ---------- EXPORT REPORT -> calls the fee report API again with the payload, then builds the PDF ----------
  // Uses the search bar: Standard, Division, From date - To date, first / last name.
  const handleExportReport = async () => {
    if (datesInvalid(searchFilters)) {
      message.warning("From date cannot be after To date");
      return;
    }
    setExporting(true);
    try {
      const list = await fetchStudentFeeReport(searchFilters);
      if (!list.length) {
        message.warning("No data found for the selected filters");
        return;
      }
      const blob = buildFeeReportPdf(list, getAcademicYear(searchFilters.fromDate || dayjs()), searchFilters);
      setReportFileName(`Student_Fee_Report_${dayjs().format("DD-MM-YYYY")}.pdf`);
      setReportUrl(URL.createObjectURL(blob));
      setReportOpen(true);
    } catch (error: any) {
      console.error("Export report failed:", error);
      message.error(error?.response?.data?.message || error?.message || "Failed to generate report");
    } finally {
      setExporting(false);
    }
  };
  const closeReport = () => {
    setReportOpen(false);
    if (reportUrl) URL.revokeObjectURL(reportUrl);
    setReportUrl(null);
  };
  const downloadReport = () => {
    if (!reportUrl) return;
    const a = document.createElement("a");
    a.href = reportUrl;
    a.download = reportFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  // Mobile browsers often cannot show a PDF inside an iframe, so this opens it in a new tab
  const openReportInNewTab = () => {
    if (!reportUrl) return;
    window.open(reportUrl, "_blank");
  };
 
  // totals of one student (from the fee report rows)
  const totalsOf = (s: FeeReportStudent) => {
    const rows = s.feeReportDataDTOS || [];
    return {
      total: sumOf(rows, "totalFeeAmount"),
      paid: sumOf(rows, "paidAmount"),
      pending: sumOf(rows, "pendingAmount"),
    };
  };
  // ---------- TABLE COLUMNS (from the fee report API) ----------
  const columns = [
    {
      title: "Sr No",
      key: "srNo",
      width: 80,
      render: (_: any, __: FeeReportStudent, index: number) => page * pageSize + index + 1,
    },
    { title: "First Name", dataIndex: "firstName", key: "firstName", render: (v: string) => v || "-" },
    { title: "Last Name", dataIndex: "lastName", key: "lastName", render: (v: string) => v || "-" },
    { title: "Gender", dataIndex: "gender", key: "gender", render: (v: string) => (v ? capitalize(v) : "-") },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (v: string) => v || "-" },
    {
      title: "Total Fee",
      key: "totalFee",
      render: (_: any, r: FeeReportStudent) => `₹ ${money(totalsOf(r).total)}`,
    },
    {
      title: "Paid Amount",
      key: "paid",
      render: (_: any, r: FeeReportStudent) => `₹ ${money(totalsOf(r).paid)}`,
    },
    {
      title: "Pending Amount",
      key: "pending",
      render: (_: any, r: FeeReportStudent) => `₹ ${money(totalsOf(r).pending)}`,
    },
  ];
  // ---------- MOBILE: one row inside a student card ----------
  const cardRow = (label: string, value?: string | null) => (
<div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
        borderBottom: "1px dashed #f0f0f0",
      }}
>
<span style={{ color: "#8c8c8c", fontSize: 13, flexShrink: 0 }}>{label}</span>
<span style={{ fontSize: 13, textAlign: "right", wordBreak: "break-word" }}>{value || "-"}</span>
</div>
  );
  // ---------- MOBILE: all students as cards ----------
  const renderStudentCards = () => (
<Spin spinning={tableLoading}>
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {displayedRows.map((r, i) => {
          const t = totalsOf(r);
          return (
<Card
              key={`${r.firstName}-${r.lastName}-${r.phone}-${page * pageSize + i}`}
              size="small"
              title={
<span style={{ fontWeight: 600, whiteSpace: "normal", wordBreak: "break-word" }}>
                  {reportName(r) || "-"}
</span>
              }
>
              {cardRow("Gender", r.gender ? capitalize(r.gender) : "-")}
              {cardRow("Phone", r.phone)}
              {cardRow("Total Fee", `₹ ${money(t.total)}`)}
              {cardRow("Paid Amount", `₹ ${money(t.paid)}`)}
              {cardRow("Pending Amount", `₹ ${money(t.pending)}`)}
</Card>
          );
        })}
</div>
<div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
<Pagination
          simple
          current={page + 1}
          pageSize={pageSize}
          total={allStudents.length}
          showSizeChanger={false}
          onChange={(newPage) => setPage(newPage - 1)}
        />
</div>
</Spin>
  );
  return (
<div>
      {/* Search Bar */}
<Row gutter={[12, 12]} style={{ padding: "16px 0" }}>
<Col xs={24} sm={12} md={4}>
<Select
            placeholder="Standard"
            value={searchFilters.standard}
            onChange={(value) => handleFilterChange("standard", value)}
            options={standardOptions}
            style={{ width: "100%" }}
            allowClear
          />
</Col>
<Col xs={24} sm={12} md={4}>
<Select
            placeholder="Division"
            value={searchFilters.division}
            onChange={(value) => handleFilterChange("division", value)}
            options={divisionOptions}
            style={{ width: "100%" }}
            allowClear
          />
</Col>
<Col xs={24} sm={12} md={4}>
<DatePicker
            placeholder="From Date"
            format="DD-MM-YYYY"
            value={searchFilters.fromDate}
            onChange={(d) => handleFilterChange("fromDate", d)}
            disabledDate={(d) => !!searchFilters.toDate && d.isAfter(searchFilters.toDate, "day")}
            style={{ width: "100%" }}
          />
</Col>
<Col xs={24} sm={12} md={4}>
<DatePicker
            placeholder="To Date"
            format="DD-MM-YYYY"
            value={searchFilters.toDate}
            onChange={(d) => handleFilterChange("toDate", d)}
            disabledDate={(d) => !!searchFilters.fromDate && d.isBefore(searchFilters.fromDate, "day")}
            style={{ width: "100%" }}
          />
</Col>
<Col xs={24} sm={12} md={4}>
<Input
            placeholder="First Name"
            value={searchFilters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: "100%" }}
            allowClear
          />
</Col>
<Col xs={24} sm={12} md={4}>
<Input
            placeholder="Last Name"
            value={searchFilters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: "100%" }}
            allowClear
          />
</Col>
<Col xs={24}>
<div
            style={{
              display: "flex",
              justifyContent: isMobile ? "flex-start" : "flex-end",
              gap: 8,
              flexWrap: "wrap",
            }}
>
<Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              style={isMobile ? { flex: 1 } : undefined}
>
              Search
</Button>
<Button
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
              style={isMobile ? { flex: 1 } : undefined}
>
              Reset
</Button>
            {/* Export Report, right next to Reset */}
<Button
              icon={<FilePdfOutlined />}
              loading={exporting}
              onClick={handleExportReport}
              style={{
                color: "#cf1322",
                borderColor: "#cf1322",
                ...(isMobile ? { flex: "1 1 100%" } : {}),
              }}
>
              Export Report
</Button>
</div>
</Col>
</Row>
      {!tableLoading && allStudents.length === 0 ? (
<Empty description="No students found" style={{ padding: "40px 0" }} />
      ) : isMobile ? (
        // MOBILE: students in card view
        renderStudentCards()
      ) : (
        // DESKTOP: table
<div style={{ width: "100%", overflowX: "auto" }}>
<CommonTable
            data={displayedRows}
            columns={columns}
            loading={tableLoading}
            rowKey={(r: FeeReportStudent) => `${r.firstName}-${r.lastName}-${r.phone}`}
            pagination={{
              current: page + 1,
              pageSize,
              total: allStudents.length,
              onChange: (newPage: number, newPageSize: number) => {
                setPage(newPage - 1);
                setPageSize(newPageSize);
              },
            }}
          />
</div>
      )}
      {/* ---------- Report preview (opens when Export Report is clicked) ---------- */}
<Modal
        title="Student Fee Report"
        open={reportOpen}
        onCancel={closeReport}
        width={isMobile ? "96%" : 900}
        centered
        destroyOnClose
        footer={
          isMobile ? (
            // MOBILE: Open in new tab full width, Download + Close side by side
<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
<Button block onClick={openReportInNewTab} style={{ flex: "1 1 100%", margin: 0 }}>
                Open in new tab
</Button>
<Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={downloadReport}
                style={{ flex: 1, margin: 0 }}
>
                Download PDF
</Button>
<Button onClick={closeReport} style={{ flex: 1, margin: 0 }}>
                Close
</Button>
</div>
          ) : (
            [
<Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadReport}>
                Download PDF
</Button>,
<Button key="close" onClick={closeReport}>
                Close
</Button>,
            ]
          )
        }
>
        {reportUrl && (
<iframe
            title="Student Fee Report"
            src={reportUrl}
            style={{
              width: "100%",
              height: isMobile ? "60vh" : "75vh",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
            }}
          />
        )}
</Modal>
</div>
  );
}
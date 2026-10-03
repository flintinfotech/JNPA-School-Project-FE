import { useState, useEffect, useCallback } from "react";
import {
  message,
  Modal,
  Button,
  Input,
  Row,
  Col,
  Card,
  Empty,
  Tag,
  Grid,
  Pagination,
  Spin,
} from "antd";
import { SearchOutlined, ReloadOutlined, FilePdfOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import jsPDF from "jspdf"; // npm install jspdf jspdf-autotable
import autoTable from "jspdf-autotable";
import { getAllStudents } from "../services/studentService";
import CommonTable from "../components/commonTable";

// Same two imports as the Employee Salary screen (only the paths may need a change)
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

// Search bar has only first name + last name
interface StudentSearchFilters {
  firstName: string;
  lastName: string;
}

// ---------- helpers ----------
const num = (v: any) => Number(v) || 0;

// Academic year starts in April: Sep 2026 -> "2026-2027", Feb 2027 -> "2026-2027"
const getAcademicYear = (d: Dayjs = dayjs()) => {
  const y = d.year();
  return d.month() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const fullName = (r: any) => [r.firstName, r.lastName].filter(Boolean).join(" ").trim();

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

// POST studentFee/getStudentFeeReportData?page=&size=&desc&paginate=true   body: {}
// The backend gets an EMPTY payload and returns everyone, so we read ALL pages and then
// apply the search bar (first name / last name) here in the browser.
const fetchStudentFeeReport = async (filters: StudentSearchFilters): Promise<FeeReportStudent[]> => {
  const size = 20;
  let pageNo = 0;
  let totalCount = 0;
  const all: FeeReportStudent[] = [];

  do {
    // empty payload {}
    const res = await axiosInstance.post(apiEndpoints.getStudentFeeReportData(pageNo, size), {});
    const data = res.data;
    if (!data?.success) throw new Error(data?.message || "Failed to load fee report");

    const list: FeeReportStudent[] = data.data?.Data || [];
    // this API sends the count as "Total elements"
    totalCount = data.data?.["Total elements"] ?? data.data?.Total ?? list.length;
    all.push(...list);

    if (list.length === 0) break; // safety: never loop forever
    pageNo += 1;
  } while (all.length < totalCount);

  // Backend returns everyone, so the search bar filters are applied here
  const first = (filters.firstName || "").trim().toLowerCase();
  const last = (filters.lastName || "").trim().toLowerCase();

  return all.filter(
    (s) =>
      (!first || (s.firstName || "").trim().toLowerCase().includes(first)) &&
      (!last || (s.lastName || "").trim().toLowerCase().includes(last))
  );
};

// Builds the report in the same layout as the Employee Salary report
// and returns it as a Blob (shown in a preview popup, can be downloaded from there).
const buildFeeReportPdf = (students: FeeReportStudent[], academicYear: string): Blob => {
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

  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // Export report
  const [exporting, setExporting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState("Student_Fee_Report.pdf");

  // Search bar state
  const [searchFilters, setSearchFilters] = useState<StudentSearchFilters>({
    firstName: "",
    lastName: "",
  });

  // ---------- STUDENT LIST (same API as the Student screen) ----------
  const fetchStudents = useCallback(
    async (pageNum: number, size: number, filters?: StudentSearchFilters) => {
      setTableLoading(true);
      try {
        const response = await getAllStudents(pageNum, size, {
          firstName: filters?.firstName || undefined,
          lastName: filters?.lastName || undefined,
        } as any);
        if (response.success) {
          setStudents(response.data.Data);
          setTotal(response.data.Total);
        } else {
          message.error(response.message || "Failed to load students");
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Failed to load students");
      } finally {
        setTableLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStudents(page, pageSize, searchFilters);
    // searchFilters intentionally left out — search only fires on button click
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, fetchStudents]);

  // free the blob URL if the screen is closed while the report is open
  useEffect(() => {
    return () => {
      if (reportUrl) URL.revokeObjectURL(reportUrl);
    };
  }, [reportUrl]);

  const handleFilterChange = (field: keyof StudentSearchFilters, value: string) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(0);
    fetchStudents(0, pageSize, searchFilters);
  };

  const handleResetFilters = () => {
    const cleared: StudentSearchFilters = { firstName: "", lastName: "" };
    setSearchFilters(cleared);
    setPage(0);
    fetchStudents(0, pageSize, cleared);
  };

  // ---------- EXPORT REPORT ----------
  // Uses whatever is typed in the search bar (first name / last name).
  const handleExportReport = async () => {
    setExporting(true);
    try {
      const list = await fetchStudentFeeReport(searchFilters);

      if (!list.length) {
        message.warning("No data found for the selected filters");
        return;
      }

      const blob = buildFeeReportPdf(list, getAcademicYear());

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

  // ---------- TABLE COLUMNS (no Action, no Address / Blood Group / Middle Name) ----------
  const columns = [
    {
      title: "Student Code",
      dataIndex: "studentCode",
      key: "studentCode",
      render: (v: string) => v || "-",
    },
    { title: "First Name", dataIndex: "firstName", key: "firstName" },
    { title: "Last Name", dataIndex: "lastName", key: "lastName" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    {
      title: "DOB",
      dataIndex: "DOB",
      key: "DOB",
      render: (v: string) => (v ? dayjs(v).format("DD-MM-YYYY") : "-"),
    },
    { title: "Category", dataIndex: "category", key: "category", render: (v: string) => v || "-" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) => (v ? <Tag color={v === "ACTIVE" ? "green" : "red"}>{v}</Tag> : "-"),
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
        {students.map((r: any, i) => (
          <Card
            key={r.studentId ?? i}
            size="small"
            title={
              <span style={{ fontWeight: 600, whiteSpace: "normal", wordBreak: "break-word" }}>
                {fullName(r) || "-"}
              </span>
            }
            extra={r.status ? <Tag color={r.status === "ACTIVE" ? "green" : "red"}>{r.status}</Tag> : null}
          >
            {cardRow("Student Code", r.studentCode)}
            {cardRow("Gender", r.gender)}
            {cardRow("DOB", r.DOB ? dayjs(r.DOB).format("DD-MM-YYYY") : "-")}
            {cardRow("Category", r.category)}
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
        <Pagination
          simple
          current={page + 1}
          pageSize={pageSize}
          total={total}
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
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="First Name"
            value={searchFilters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Last Name"
            value={searchFilters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={24} md={12}>
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

      {!tableLoading && students.length === 0 ? (
        <Empty description="No students found" style={{ padding: "40px 0" }} />
      ) : isMobile ? (
        // MOBILE: students in card view
        renderStudentCards()
      ) : (
        // DESKTOP: table
        <div style={{ width: "100%", overflowX: "auto" }}>
          <CommonTable
            data={students}
            columns={columns}
            loading={tableLoading}
            pagination={{
              current: page + 1,
              pageSize,
              total,
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

<h2>hiii Vikas </h2>
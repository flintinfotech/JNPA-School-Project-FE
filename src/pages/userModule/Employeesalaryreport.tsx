import { useState, useEffect, useCallback, useRef } from "react";
import {
  Drawer,
  Form,
  message,
  Modal,
  Popconfirm,
  Button,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Space,
  Row,
  Col,
  Card,
  Descriptions,
  Empty,
  Tooltip,
  Tag,
  Grid,
  Pagination,
  Spin,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import jsPDF from "jspdf"; // npm install jspdf jspdf-autotable
import autoTable from "jspdf-autotable";
import {
  getAllEmployeeDetailsByFilter,
  getEmployeeDetailsById,
  type UserDTO,
  type UserSearchFilters,
} from "../../services/userService";
import {
  saveEmployeeSalary,
  updateEmployeeSalary,
  getSalariesByEmployeeDetailsId,
  deleteEmployeeSalary,
  type EmployeeSalaryDTO,
} from "../../services/employeeSalaryService";
import { getAllStaticData } from "../../services/staticDataService";
import CommonTable from "../../components/commonTable"; // same table component as Purchase Master (change path if needed)

// Use the SAME two imports your other services use (only the paths may need a change)
import axiosInstance from "../../lib/axios"; // your axios instance
import { apiEndpoints } from "../../services/apiEndpoints"; // the file that contains apiEndpoints

type EmployeeRow = UserDTO;

// ---------- helpers ----------
const num = (v: any) => Number(v) || 0;

const money = (v?: number | null) =>
  v === null || v === undefined
    ? "-"
    : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Net salary = basic + allowances - deduction (backend calculates the real value on save)
const calcNet = (r: any) =>
  num(r?.basicSalary) +
  num(r?.hra) +
  num(r?.transportAllowance) +
  num(r?.medicalAllowance) +
  num(r?.otherAllowance) -
  num(r?.deduction);

// Academic year starts in April: Sep 2026 -> "2026-2027", Feb 2027 -> "2026-2027"
const getAcademicYear = (d: Dayjs = dayjs()) => {
  const y = d.year();
  return d.month() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const fullName = (r: EmployeeRow) =>
  [r.firstName, (r as any).middleName, r.lastName].filter(Boolean).join(" ").trim();

// Used to detect which saved cards were really changed (only those get updated)
const rowSignature = (r: any) =>
  JSON.stringify([
    r?.salaryDate ? dayjs(r.salaryDate).format("YYYY-MM-DD") : null,
    num(r?.basicSalary),
    num(r?.hra),
    num(r?.transportAllowance),
    num(r?.medicalAllowance),
    num(r?.otherAllowance),
    num(r?.deduction),
    r?.remark ?? "",
  ]);

/* =====================================================================
   EXPORT REPORT (report API + PDF builder, all inside this file)
   ===================================================================== */

interface SalaryReportRow {
  basicSalary: number;
  deduction: number;
  hra: number;
  medicalAllowance: number;
  netSalary: number;
  otherAllowance: number;
  salaryDate: string;
  transportAllowance: number;
}

interface SalaryReportEmployee {
  designation: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  printDate?: string;
  printTime?: string;
  role: string;
  reportDataDTOList: SalaryReportRow[];
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
const PDF_COLUMNS = ["Date", "Basic Salary", "HRA", "Transport", "Medical", "Other", "Deduction", "Net Salary"];
const PDF_COL_WIDTHS = [24, 24, 22, 24, 24, 22, 22, 28]; // = 190mm
const pdfColumnStyles = PDF_COL_WIDTHS.reduce((acc, w, i) => {
  acc[i] = { cellWidth: w };
  return acc;
}, {} as Record<number, { cellWidth: number }>);

const fix2 = (v: any) => num(v).toFixed(2);
const capitalize = (v?: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "-");
const reportName = (e: SalaryReportEmployee) =>
  [e.firstName, e.middleName, e.lastName].filter(Boolean).join(" ").trim();
const sumOf = (rows: any[], key: string) => rows.reduce((acc, r) => acc + num(r?.[key]), 0);

// POST employeeDetails/getEmployeeSalaryReportData?page=&size=&paginate=true   body: {}
// The backend gets an EMPTY payload and returns everyone, so we read ALL pages and then
// apply the search bar (role / first name / last name) here in the browser.
// Select "Teacher" and only teachers come in the report.
const fetchSalaryReport = async (filters: UserSearchFilters): Promise<SalaryReportEmployee[]> => {
  const size = 20;
  let pageNo = 0;
  let totalCount = 0;
  const all: SalaryReportEmployee[] = [];

  do {
    // empty payload {}
    const res = await axiosInstance.post(apiEndpoints.getEmployeeSalaryReportData(pageNo, size), {});
    const data = res.data;
    if (!data?.success) throw new Error(data?.message || "Failed to load salary report");

    const list: SalaryReportEmployee[] = data.data?.Data || [];
    totalCount = data.data?.total ?? list.length;
    all.push(...list);

    if (list.length === 0) break; // safety: never loop forever
    pageNo += 1;
  } while (all.length < totalCount);

  // Backend returns everyone, so the search bar filters are applied here
  const role = (filters.role || "").toUpperCase();
  const first = (filters.firstName || "").trim().toLowerCase();
  const last = (filters.lastName || "").trim().toLowerCase();

  return all.filter(
    (e) =>
      (!role || (e.role || "").toUpperCase() === role) &&
      (!first || (e.firstName || "").toLowerCase().includes(first)) &&
      (!last || (e.lastName || "").toLowerCase().includes(last))
  );
};

// Builds the report in the same layout as the reference "Party Outstanding" PDF
// and returns it as a Blob (shown in a preview popup, can be downloaded from there).
const buildSalaryReportPdf = (
  employees: SalaryReportEmployee[],
  fromDate: Dayjs,
  toDate: Dayjs,
  roleFilter?: string
): Blob => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // ----- header (first page only, same style as the reference PDF) -----
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
  const title = "Employee Salary Report";
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
  const periodLine =
    `From Date: ${fromDate.format("DD-MM-YYYY")}      To Date: ${toDate.format("DD-MM-YYYY")}` +
    (roleFilter ? `      Role: ${capitalize(roleFilter)}` : "");
  doc.text(periodLine, centerX, y, { align: "center" });

  y += 4;
  doc.setDrawColor(...MAROON);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGIN.left, y, pageWidth - PDF_MARGIN.right, y);

  let cursorY = y + 6;

  // ----- one block per employee -----
  const allRows: SalaryReportRow[] = [];
  const bold = { fontStyle: "bold" as const };

  employees.forEach((emp) => {
    const rows = emp.reportDataDTOList || [];
    allRows.push(...rows);
    const hasSalary = rows.length > 0;

    // keep one employee block together on a page
    const estimatedHeight = ((hasSalary ? 2 : 1) + rows.length + 2) * 6.5 + 6;
    if (cursorY + estimatedHeight > pageHeight - PDF_MARGIN.bottom) {
      doc.addPage();
      cursorY = PDF_MARGIN.top;
    }

    // Employee info row (+ column titles only when the employee has salary — empty ones stay blank)
    const head: any[] = [
      [
        { content: `Employee Name: ${reportName(emp)}`, colSpan: 3, styles: { halign: "left" } },
        { content: `Designation: ${emp.designation || "-"}`, colSpan: 3, styles: { halign: "left" } },
        { content: `Role: ${capitalize(emp.role)}`, colSpan: 2, styles: { halign: "right" } },
      ],
    ];
    if (hasSalary) {
      head.push(PDF_COLUMNS.map((c) => ({ content: c, styles: { fontSize: 7.5, halign: "left" } })));
    }

    const body: any[] = rows.map((r) => [
      r.salaryDate ? dayjs(r.salaryDate).format("DD-MM-YYYY") : "-",
      fix2(r.basicSalary),
      fix2(r.hra),
      fix2(r.transportAllowance),
      fix2(r.medicalAllowance),
      fix2(r.otherAllowance),
      fix2(r.deduction),
      fix2(r.netSalary),
    ]);

    const totalNet = sumOf(rows, "netSalary");

    // Total row (0.00 when there is no salary)
    body.push([
      { content: "Total", styles: bold },
      { content: fix2(sumOf(rows, "basicSalary")), styles: bold },
      { content: fix2(sumOf(rows, "hra")), styles: bold },
      { content: fix2(sumOf(rows, "transportAllowance")), styles: bold },
      { content: fix2(sumOf(rows, "medicalAllowance")), styles: bold },
      { content: fix2(sumOf(rows, "otherAllowance")), styles: bold },
      { content: fix2(sumOf(rows, "deduction")), styles: bold },
      { content: fix2(totalNet), styles: bold },
    ]);

    // closing line, right aligned
    body.push([
      {
        content: `Total Net Salary: ${fix2(totalNet)}`,
        colSpan: 8,
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
        { content: "Grand Total", styles: bold },
        { content: fix2(sumOf(allRows, "basicSalary")), styles: bold },
        { content: fix2(sumOf(allRows, "hra")), styles: bold },
        { content: fix2(sumOf(allRows, "transportAllowance")), styles: bold },
        { content: fix2(sumOf(allRows, "medicalAllowance")), styles: bold },
        { content: fix2(sumOf(allRows, "otherAllowance")), styles: bold },
        { content: fix2(sumOf(allRows, "deduction")), styles: bold },
        { content: fix2(sumOf(allRows, "netSalary")), styles: bold },
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
  const firstEmp = employees[0];
  const printDate = firstEmp?.printDate ? dayjs(firstEmp.printDate) : dayjs();
  const printTime = firstEmp?.printTime ? firstEmp.printTime.toUpperCase() : dayjs().format("hh:mm A");

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

export default function EmployeeSalary() {
  // ---------- responsive (mobile) ----------
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false; // below 768px

  const [users, setUsers] = useState<EmployeeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);

  // Edit drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null); // which card is being saved
  const [submitting, setSubmitting] = useState(false); // bottom Save/Update button
  const snapshotRef = useRef<Record<number, string>>({}); // saved values, to detect changes
  const [activeEmployee, setActiveEmployee] = useState<{ id: number; name: string } | null>(null);
  const [form] = Form.useForm();

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewSalaries, setViewSalaries] = useState<EmployeeSalaryDTO[]>([]);
  const [viewEmployee, setViewEmployee] = useState<{ id: number; name: string } | null>(null);

  // Export report
  const [exporting, setExporting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState("Employee_Salary_Report.pdf");

  // Search bar state
  const [searchFilters, setSearchFilters] = useState<UserSearchFilters>({
    firstName: "",
    lastName: "",
    role: "",
  });

  // Role dropdown (fetched on first click, not on mount)
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [rolesFetched, setRolesFetched] = useState(false);

  const handleRoleDropdownOpen = async (open: boolean) => {
    if (!open || rolesFetched) return;
    setRoleLoading(true);
    try {
      const response = await getAllStaticData();
      if (response.success) {
        const roles = response.data.role || [];
        setRoleOptions(
          roles.map((r: string) => ({ label: r.charAt(0) + r.slice(1).toLowerCase(), value: r }))
        );
        setRolesFetched(true);
      } else {
        message.error(response.message || "Failed to load roles");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load roles");
    } finally {
      setRoleLoading(false);
    }
  };

  // ---------- EMPLOYEE LIST (same API as Employee Details) ----------
  const fetchUsers = useCallback(
    async (pageNum: number, size: number, filters?: UserSearchFilters) => {
      setTableLoading(true);
      try {
        const response = await getAllEmployeeDetailsByFilter(pageNum, size, filters);
        if (response.success) {
          setUsers(response.data.Data);
          setTotal(response.data.total);
        } else {
          message.error(response.message || "Failed to load employees");
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Failed to load employees");
      } finally {
        setTableLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsers(page, pageSize, searchFilters);
    // searchFilters intentionally left out — search only fires on button click
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, fetchUsers]);

  // free the blob URL if the screen is closed while the report is open
  useEffect(() => {
    return () => {
      if (reportUrl) URL.revokeObjectURL(reportUrl);
    };
  }, [reportUrl]);

  const handleFilterChange = (field: keyof UserSearchFilters, value: string) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(0);
    fetchUsers(0, pageSize, searchFilters);
  };

  const handleResetFilters = () => {
    const cleared: UserSearchFilters = { firstName: "", lastName: "", role: "" };
    setSearchFilters(cleared);
    setPage(0);
    fetchUsers(0, pageSize, cleared);
  };

  // ---------- EXPORT REPORT ----------
  // Uses whatever is selected/typed in the search bar:
  // Role = Teacher -> only teachers in the report, Role = Admin -> only admins, etc.
  const handleExportReport = async () => {
    setExporting(true);
    try {
      const employees = await fetchSalaryReport(searchFilters);

      if (!employees.length) {
        message.warning("No data found for the selected filters");
        return;
      }

      // Report period = current academic year (1 Apr – 31 Mar)
      const startYear = Number(getAcademicYear().split("-")[0]);

      const blob = buildSalaryReportPdf(
        employees,
        dayjs(`${startYear}-04-01`),
        dayjs(`${startYear + 1}-03-31`),
        searchFilters.role || undefined
      );

      setReportFileName(
        `Employee_Salary_Report${searchFilters.role ? `_${capitalize(searchFilters.role)}` : ""}_${dayjs().format("DD-MM-YYYY")}.pdf`
      );
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

  // ---------- salary helpers ----------

  // Prefer the employeeDetailsId on the row, else look it up through userId.
  const resolveEmployeeDetailsId = async (record: EmployeeRow): Promise<number | null> => {
    let id = (record as any).employeeDetailsId;
    if (!id && record.userId) {
      try {
        const res = await getEmployeeDetailsById(record.userId);
        if (res.success && res.data?.employeeDetailsId) id = res.data.employeeDetailsId;
      } catch (error) {
        console.error("Could not resolve employeeDetailsId:", error);
      }
    }
    if (!id) {
      message.error("Employee details not found for this user.");
      return null;
    }
    return id;
  };

  // All salary records of one employee (list API, all pages)
  const fetchSalaryList = async (employeeDetailsId: number): Promise<EmployeeSalaryDTO[]> => {
    try {
      return await getSalariesByEmployeeDetailsId(employeeDetailsId);
    } catch (error) {
      console.error("Salary list fetch failed:", error);
      return [];
    }
  };

  const toFormRow = (s: EmployeeSalaryDTO) => ({
    employeeSalaryId: s.employeeSalaryId,
    academicYear: s.academicYear,
    salaryDate: s.salaryDate ? dayjs(s.salaryDate) : null,
    basicSalary: s.basicSalary,
    hra: s.hra,
    transportAllowance: s.transportAllowance,
    medicalAllowance: s.medicalAllowance,
    otherAllowance: s.otherAllowance,
    deduction: s.deduction,
    remark: s.remark,
  });

  const newRow = () => ({
    academicYear: getAcademicYear(),
    salaryDate: dayjs(),
  });

  // ---------- VIEW ----------
  const openViewModal = async (record: EmployeeRow) => {
    const id = await resolveEmployeeDetailsId(record);
    if (!id) return;
    const list = await fetchSalaryList(id);
    setViewEmployee({ id, name: fullName(record) });
    setViewSalaries(list);
    setViewOpen(true);
  };

  const closeViewModal = () => {
    setViewOpen(false);
    setViewSalaries([]);
    setViewEmployee(null);
  };

  // Deletes ONLY the clicked record (DELETE .../deleteEmployeeSalary/{employeeSalaryId})
  const handleDeleteFromView = async (salary: EmployeeSalaryDTO) => {
    if (!viewEmployee || !salary.employeeSalaryId) return;
    try {
      const res = await deleteEmployeeSalary(salary.employeeSalaryId);
      if (res.success) {
        message.success(res.message);
        setViewSalaries(await fetchSalaryList(viewEmployee.id)); // reload real data
      } else {
        message.error(res.message || "Failed to delete salary");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete salary");
    }
  };

  // ---------- EDIT ----------
  const openEditDrawer = async (record: EmployeeRow) => {
    const id = await resolveEmployeeDetailsId(record);
    if (!id) return;

    const list = await fetchSalaryList(id);
    setActiveEmployee({ id, name: fullName(record) });

    const rows = list.map(toFormRow);
    snapshotRef.current = {};
    rows.forEach((r) => {
      if (r.employeeSalaryId) snapshotRef.current[r.employeeSalaryId] = rowSignature(r);
    });

    form.resetFields();
    form.setFieldsValue({
      // no salary yet -> one blank entry ready to fill
      salaries: rows.length ? rows : [newRow()],
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setActiveEmployee(null);
    setSavingIndex(null);
    setSubmitting(false);
  };

  // Sends ONE card to the server: POST if it is new, PUT if it already has an id.
  // Returns the API response (or null when it failed).
  const persistRow = async (index: number) => {
    if (!activeEmployee) return null;
    const s = form.getFieldValue(["salaries", index]);
    const common = {
      salaryDate: dayjs(s.salaryDate).format("YYYY-MM-DD"),
      basicSalary: s.basicSalary,
      hra: s.hra ?? 0,
      transportAllowance: s.transportAllowance ?? 0,
      medicalAllowance: s.medicalAllowance ?? 0,
      otherAllowance: s.otherAllowance ?? 0,
      deduction: s.deduction ?? 0,
      remark: s.remark,
      academicYear: s.academicYear,
    };

    const response = s.employeeSalaryId
      ? // PUT employeeSalary/updateEmployeeSalary
        await updateEmployeeSalary({ employeeSalaryId: s.employeeSalaryId, ...common })
      : // POST employeeSalary/saveEmployeeSalary
        await saveEmployeeSalary({ employeeDetailsId: activeEmployee.id, ...common });

    if (!response.success) {
      message.error(response.message || "Failed to save salary");
      return null;
    }

    // refresh this card with the saved data (a new card now gets its employeeSalaryId)
    if (response.data) {
      const saved = toFormRow(response.data);
      form.setFieldValue(["salaries", index], saved);
      if (saved.employeeSalaryId) snapshotRef.current[saved.employeeSalaryId] = rowSignature(saved);
    }
    return response;
  };

  // Update / Save icon on a card -> ONLY this card
  const handleSaveCard = async (index: number) => {
    try {
      await form.validateFields([
        ["salaries", index, "salaryDate"],
        ["salaries", index, "basicSalary"],
      ]);
    } catch {
      return;
    }

    setSavingIndex(index);
    try {
      const response = await persistRow(index);
      if (response) message.success(response.message);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSavingIndex(null);
    }
  };

  // Bottom Save / Update button -> new cards are saved, only CHANGED old cards are updated
  const handleSaveAll = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }

    const rows: any[] = form.getFieldValue("salaries") || [];
    if (!rows.length) {
      message.warning("Please add at least one salary.");
      return;
    }

    const pending = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r?.employeeSalaryId || snapshotRef.current[r.employeeSalaryId] !== rowSignature(r));

    if (!pending.length) {
      message.info("No changes to save.");
      return;
    }

    setSubmitting(true);
    try {
      for (const { i } of pending) {
        const response = await persistRow(i);
        if (!response) return; // error already shown, keep the drawer open
      }
      message.success("Employee salary saved successfully");
      closeDrawer();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete ONLY this one card
  const handleDeleteCard = async (index: number, remove: (i: number) => void) => {
    const row = form.getFieldValue(["salaries", index]);

    // Not saved yet -> just drop it from the form, no API call
    if (!row?.employeeSalaryId) {
      remove(index);
      return;
    }

    try {
      // DELETE employeeSalary/deleteEmployeeSalary/{employeeSalaryId}
      const res = await deleteEmployeeSalary(row.employeeSalaryId);
      if (res.success) {
        message.success(res.message);
        remove(index);
      } else {
        message.error(res.message || "Failed to delete salary");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete salary");
    }
  };

  // ---------- TABLE COLUMNS (Action column with View + Edit removed) ----------
  const columns = [
    {
      title: "Employee Code",
      dataIndex: "employeeCode",
      key: "employeeCode",
      render: (v: string) => v || "-",
    },
    {
      title: "Name",
      key: "name",
      render: (_: any, r: EmployeeRow) => fullName(r) || "-",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (v: string) => (v ? v.charAt(0) + v.slice(1).toLowerCase() : "-"),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (v: string) => v || "-",
    },
    {
      title: "Mobile No",
      dataIndex: "mobileNo",
      key: "mobileNo",
      render: (v: string) => v || "-",
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      render: (v: string) => v || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) => (v ? <Tag color={v === "ACTIVE" ? "green" : "red"}>{v}</Tag> : "-"),
    },
  ];

  const moneyInput = <InputNumber style={{ width: "100%" }} min={0} precision={2} placeholder="0.00" />;

  // ---------- MOBILE: one row inside an employee card ----------
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

  // ---------- MOBILE: all employees as cards (no View / Edit buttons, same as desktop) ----------
  const renderEmployeeCards = () => (
    <Spin spinning={tableLoading}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {users.map((r, i) => (
          <Card
            key={(r as any).employeeDetailsId ?? r.userId ?? i}
            size="small"
            title={
              <span style={{ fontWeight: 600, whiteSpace: "normal", wordBreak: "break-word" }}>
                {fullName(r) || "-"}
              </span>
            }
            extra={
              r.status ? <Tag color={r.status === "ACTIVE" ? "green" : "red"}>{r.status}</Tag> : null
            }
          >
            {cardRow("Employee Code", (r as any).employeeCode)}
            {cardRow("Role", r.role ? r.role.charAt(0) + r.role.slice(1).toLowerCase() : "-")}
            {cardRow("Email", r.email)}
            {cardRow("Mobile No", (r as any).mobileNo)}
            {cardRow("Designation", (r as any).designation)}
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
        <Col xs={24} sm={12} md={5}>
          <Input
            placeholder="First Name"
            value={searchFilters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={5}>
          <Input
            placeholder="Last Name"
            value={searchFilters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={5}>
          <Select
            placeholder="Role"
            value={searchFilters.role || undefined}
            onChange={(value) => handleFilterChange("role", value || "")}
            onDropdownVisibleChange={handleRoleDropdownOpen}
            loading={roleLoading}
            style={{ width: "100%" }}
            allowClear
            options={roleOptions}
          />
        </Col>

        <Col xs={24} sm={12} md={9}>
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

      {!tableLoading && users.length === 0 ? (
        <Empty description="No employees found" style={{ padding: "40px 0" }} />
      ) : isMobile ? (
        // MOBILE: employees in card view
        renderEmployeeCards()
      ) : (
        // DESKTOP: same table as before
        <div style={{ width: "100%", overflowX: "auto" }}>
          <CommonTable
            data={users}
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
        title={`Employee Salary Report${searchFilters.role ? ` — ${capitalize(searchFilters.role)}` : ""}`}
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
            title="Employee Salary Report"
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

      {/* ---------- Edit Drawer ---------- */}
      <Drawer
        title={`Employee Salary${activeEmployee?.name ? ` — ${activeEmployee.name}` : ""}`}
        open={drawerOpen}
        onClose={closeDrawer}
        width={isMobile ? "100%" : 750}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.List name="salaries">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }, index) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    title={`Salary ${index + 1}`}
                    extra={
                      <Space>
                        <Tooltip title="Update">
                          <Button
                            type="text"
                            loading={savingIndex === name}
                            icon={<SaveOutlined style={{ color: "#1677ff" }} />}
                            onClick={() => handleSaveCard(name)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Delete this salary record?"
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => handleDeleteCard(name, remove)}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    }
                  >
                    <Form.Item name={[name, "employeeSalaryId"]} hidden>
                      <Input />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Academic Year" name={[name, "academicYear"]}>
                          <Input disabled />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Salary Date"
                          name={[name, "salaryDate"]}
                          rules={[{ required: true, message: "Salary date is required" }]}
                        >
                          <DatePicker
                            style={{ width: "100%" }}
                            format="DD-MM-YYYY"
                            onChange={(d) => {
                              // keep academic year in sync for entries that are not saved yet
                              const saved = form.getFieldValue(["salaries", name, "employeeSalaryId"]);
                              if (!saved && d) {
                                form.setFieldValue(["salaries", name, "academicYear"], getAcademicYear(d));
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Basic Salary"
                          name={[name, "basicSalary"]}
                          rules={[{ required: true, message: "Basic salary is required" }]}
                        >
                          {moneyInput}
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label="HRA" name={[name, "hra"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item label="Transport Allowance" name={[name, "transportAllowance"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Medical Allowance" name={[name, "medicalAllowance"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item label="Other Allowance" name={[name, "otherAllowance"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Deduction" name={[name, "deduction"]}>
                          {moneyInput}
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item label="Net Salary (auto)" shouldUpdate>
                          {() => (
                            <Input
                              disabled
                              value={calcNet(form.getFieldValue(["salaries", name])).toFixed(2)}
                            />
                          )}
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item label="Remark" name={[name, "remark"]}>
                          <Input.TextArea rows={2} placeholder="e.g. September 2026 salary" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}

                {/* New salary entry */}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add(newRow())}
                  style={{ marginBottom: 24 }}
                >
                  Add New Salary
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const rows: any[] = form.getFieldValue("salaries") || [];
              const hasNew = rows.some((r) => !r?.employeeSalaryId);
              return (
                <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button onClick={closeDrawer}>Cancel</Button>
                  <Button type="primary" loading={submitting} onClick={handleSaveAll}>
                    {hasNew ? "Save" : "Update"}
                  </Button>
                </Space>
              );
            }}
          </Form.Item>
        </Form>
      </Drawer>

      {/* ---------- View Modal ---------- */}
      <Modal
        title={`Employee Salary Details${viewEmployee?.name ? ` — ${viewEmployee.name}` : ""}`}
        open={viewOpen}
        onCancel={closeViewModal}
        footer={null}
        width={isMobile ? "96%" : 850}
        destroyOnClose
      >
        {viewSalaries.length === 0 ? (
          <Empty description="No salary records found" />
        ) : (
          viewSalaries.map((s, i) => (
            <Descriptions
              key={s.employeeSalaryId ?? i}
              bordered
              column={isMobile ? 1 : 2}
              size={isMobile ? "small" : "middle"}
              style={{ marginBottom: 20 }}
              title={`Salary ${i + 1}`}
              extra={
                <Popconfirm
                  title="Delete this salary record?"
                  okText="Yes"
                  cancelText="No"
                  onConfirm={() => handleDeleteFromView(s)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              }
            >
              <Descriptions.Item label="Academic Year">{s.academicYear}</Descriptions.Item>
              <Descriptions.Item label="Salary Date">
                {s.salaryDate ? dayjs(s.salaryDate).format("DD-MM-YYYY") : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Basic Salary">₹ {money(s.basicSalary)}</Descriptions.Item>
              <Descriptions.Item label="HRA">₹ {money(s.hra)}</Descriptions.Item>
              <Descriptions.Item label="Transport Allowance">₹ {money(s.transportAllowance)}</Descriptions.Item>
              <Descriptions.Item label="Medical Allowance">₹ {money(s.medicalAllowance)}</Descriptions.Item>
              <Descriptions.Item label="Other Allowance">₹ {money(s.otherAllowance)}</Descriptions.Item>
              <Descriptions.Item label="Deduction">₹ {money(s.deduction)}</Descriptions.Item>
              <Descriptions.Item label="Net Salary" span={isMobile ? 1 : 2}>
                <b>₹ {money(s.netSalary)}</b>
              </Descriptions.Item>
              <Descriptions.Item label="Remark" span={isMobile ? 1 : 2}>
                {s.remark || "-"}
              </Descriptions.Item>
            </Descriptions>
          ))
        )}
      </Modal>
    </div>
  );
}
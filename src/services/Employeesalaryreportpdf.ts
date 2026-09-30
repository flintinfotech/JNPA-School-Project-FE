// import jsPDF from "jspdf";
// import autoTable from "";
// import dayjs, { type Dayjs } from "dayjs";
// import type { SalaryReportEmployeeDTO } from "./Employeesalaryreportservice";

// // ✏️ Edit these with your real school details (shown in the PDF header)
// const SCHOOL = {
//   name: "JNPV School",
//   subtitle: "Jawaharlal Nehru Port Vidyalaya",
//   addressLines: ["Your school address line 1", "City, State, PIN"],
//   contact: "Contact No: 0000000000",
//   email: "Email: school@example.com",
// };

// const MAROON: [number, number, number] = [128, 0, 0];
// const MARGIN = { top: 15, left: 10, right: 10, bottom: 18 };

// const num = (v: any) => Number(v) || 0;
// const fix = (v: any) => num(v).toFixed(2);
// const cap = (v?: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "-");

// const fullName = (e: SalaryReportEmployeeDTO) =>
//   [e.firstName, e.middleName, e.lastName].filter(Boolean).join(" ").trim();

// const COLUMNS = [
//   "Date",
//   "Basic Salary",
//   "HRA",
//   "Transport",
//   "Medical",
//   "Other",
//   "Deduction",
//   "Net Salary",
// ];

// // total = 190mm (A4 width 210 - margins)
// const COLUMN_WIDTHS = [24, 24, 22, 24, 24, 22, 22, 28];

// const sumOf = (rows: any[], key: string) => rows.reduce((acc, r) => acc + num(r?.[key]), 0);

// interface Options {
//   fromDate: Dayjs;
//   toDate: Dayjs;
//   /** optional PNG/JPEG data-URL shown at the top-left (jsPDF cannot read .avif/.webp) */
//   logoDataUrl?: string | null;
// }

// export function generateEmployeeSalaryReportPdf(
//   employees: SalaryReportEmployeeDTO[],
//   { fromDate, toDate, logoDataUrl }: Options
// ) {
//   const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
//   const pageWidth = doc.internal.pageSize.getWidth();
//   const pageHeight = doc.internal.pageSize.getHeight();
//   const centerX = pageWidth / 2;

//   // ---------- page header (first page only, like the reference) ----------
//   if (logoDataUrl) {
//     try {
//       doc.addImage(logoDataUrl, "PNG", 12, 8, 26, 26);
//     } catch (e) {
//       console.warn("Logo could not be added to the PDF", e);
//     }
//   }

//   let y = 14;
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(16);
//   doc.setTextColor(...MAROON);
//   doc.text(SCHOOL.name, centerX, y, { align: "center" });

//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(9);
//   doc.setTextColor(0, 0, 0);
//   [SCHOOL.subtitle, ...SCHOOL.addressLines, SCHOOL.contact, SCHOOL.email]
//     .filter(Boolean)
//     .forEach((line) => {
//       y += 5;
//       doc.text(line, centerX, y, { align: "center" });
//     });

//   y += 9;
//   const title = "Employee Salary Report";
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(13);
//   doc.setTextColor(...MAROON);
//   doc.text(title, centerX, y, { align: "center" });
//   const titleWidth = doc.getTextWidth(title);
//   doc.setDrawColor(...MAROON);
//   doc.setLineWidth(0.4);
//   doc.line(centerX - titleWidth / 2, y + 1, centerX + titleWidth / 2, y + 1);

//   y += 8;
//   doc.setFontSize(9);
//   doc.setTextColor(0, 0, 0);
//   doc.text(
//     `From Date: ${fromDate.format("DD-MM-YYYY")}      To Date: ${toDate.format("DD-MM-YYYY")}`,
//     centerX,
//     y,
//     { align: "center" }
//   );

//   y += 4;
//   doc.setDrawColor(...MAROON);
//   doc.setLineWidth(0.3);
//   doc.line(MARGIN.left, y, pageWidth - MARGIN.right, y);

//   let cursorY = y + 6;

//   // ---------- one block per employee ----------
//   const allRows: any[] = [];

//   employees.forEach((emp) => {
//     const rows = emp.reportDataDTOList || [];
//     allRows.push(...rows);
//     const hasSalary = rows.length > 0;

//     // keep one employee block together on a page
//     const estimatedHeight = ((hasSalary ? 2 : 1) + rows.length + 2) * 6.5 + 6;
//     if (cursorY + estimatedHeight > pageHeight - MARGIN.bottom) {
//       doc.addPage();
//       cursorY = MARGIN.top;
//     }

//     // header: employee info row (+ column titles only when salary exists, like the reference)
//     const head: any[] = [
//       [
//         { content: `Employee Name: ${fullName(emp)}`, colSpan: 3, styles: { halign: "left" } },
//         { content: `Designation: ${emp.designation || "-"}`, colSpan: 3, styles: { halign: "left" } },
//         { content: `Role: ${cap(emp.role)}`, colSpan: 2, styles: { halign: "right" } },
//       ],
//     ];
//     if (hasSalary) {
//       head.push(
//         COLUMNS.map((c, i) => ({
//           content: c,
//           styles: { fontSize: 7.5, halign: i === 0 ? "left" : "left" },
//         }))
//       );
//     }

//     const body: any[] = rows.map((r) => [
//       r.salaryDate ? dayjs(r.salaryDate).format("DD-MM-YYYY") : "-",
//       fix(r.basicSalary),
//       fix(r.hra),
//       fix(r.transportAllowance),
//       fix(r.medicalAllowance),
//       fix(r.otherAllowance),
//       fix(r.deduction),
//       fix(r.netSalary),
//     ]);

//     const bold = { fontStyle: "bold" as const };
//     const totalNet = sumOf(rows, "netSalary");

//     // Total row (shows 0.00 when there is no salary, exactly like an empty party block)
//     body.push([
//       { content: "Total", styles: bold },
//       { content: fix(sumOf(rows, "basicSalary")), styles: bold },
//       { content: fix(sumOf(rows, "hra")), styles: bold },
//       { content: fix(sumOf(rows, "transportAllowance")), styles: bold },
//       { content: fix(sumOf(rows, "medicalAllowance")), styles: bold },
//       { content: fix(sumOf(rows, "otherAllowance")), styles: bold },
//       { content: fix(sumOf(rows, "deduction")), styles: bold },
//       { content: fix(totalNet), styles: bold },
//     ]);

//     // closing line, right aligned
//     body.push([
//       {
//         content: `Total Net Salary: ${fix(totalNet)}`,
//         colSpan: 8,
//         styles: { halign: "right", fontStyle: "bold" },
//       },
//     ]);

//     const totalRowIndex = body.length - 2;
//     const closingRowIndex = body.length - 1;

//     autoTable(doc, {
//       startY: cursorY,
//       margin: MARGIN,
//       theme: "plain",
//       head,
//       body,
//       rowPageBreak: "avoid",
//       tableLineColor: [0, 0, 0],
//       tableLineWidth: 0.3,
//       styles: {
//         font: "helvetica",
//         fontSize: 8,
//         cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
//         textColor: [0, 0, 0],
//         overflow: "linebreak",
//       },
//       headStyles: {
//         fillColor: [255, 255, 255],
//         textColor: [0, 0, 0],
//         fontStyle: "bold",
//         lineColor: [0, 0, 0],
//         lineWidth: { top: 0, right: 0, bottom: 0.2, left: 0 } as any,
//       },
//       columnStyles: COLUMN_WIDTHS.reduce((acc, w, i) => {
//         acc[i] = { cellWidth: w };
//         return acc;
//       }, {} as Record<number, { cellWidth: number }>),
//       didParseCell: (data) => {
//         if (data.section === "body") {
//           // thin line above the Total row and the closing row
//           if (data.row.index === totalRowIndex || data.row.index === closingRowIndex) {
//             data.cell.styles.lineColor = [0, 0, 0] as any;
//             data.cell.styles.lineWidth = { top: 0.2, right: 0, bottom: 0, left: 0 } as any;
//           }
//         }
//       },
//     });

//     cursorY = (doc as any).lastAutoTable.finalY + 6;
//   });

//   // ---------- grand total ----------
//   if (cursorY + 14 > pageHeight - MARGIN.bottom) {
//     doc.addPage();
//     cursorY = MARGIN.top;
//   }

//   const gBold = { fontStyle: "bold" as const };
//   autoTable(doc, {
//     startY: cursorY,
//     margin: MARGIN,
//     theme: "plain",
//     body: [
//       [
//         { content: "Grand Total", styles: gBold },
//         { content: fix(sumOf(allRows, "basicSalary")), styles: gBold },
//         { content: fix(sumOf(allRows, "hra")), styles: gBold },
//         { content: fix(sumOf(allRows, "transportAllowance")), styles: gBold },
//         { content: fix(sumOf(allRows, "medicalAllowance")), styles: gBold },
//         { content: fix(sumOf(allRows, "otherAllowance")), styles: gBold },
//         { content: fix(sumOf(allRows, "deduction")), styles: gBold },
//         { content: fix(sumOf(allRows, "netSalary")), styles: gBold },
//       ],
//     ],
//     styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2, textColor: [0, 0, 0] },
//     columnStyles: COLUMN_WIDTHS.reduce((acc, w, i) => {
//       acc[i] = { cellWidth: w };
//       return acc;
//     }, {} as Record<number, { cellWidth: number }>),
//     didParseCell: (data) => {
//       data.cell.styles.lineColor = [0, 0, 0] as any;
//       data.cell.styles.lineWidth = { top: 0.3, right: 0, bottom: 0.3, left: 0 } as any;
//     },
//   });

//   // ---------- footer on every page: Print Date / Time / Page x of y ----------
//   const first = employees[0];
//   const printDate = first?.printDate ? dayjs(first.printDate) : dayjs();
//   const printTime = first?.printTime ? first.printTime.toUpperCase() : dayjs().format("hh:mm A");

//   const totalPages = doc.getNumberOfPages();
//   for (let i = 1; i <= totalPages; i++) {
//     doc.setPage(i);
//     doc.setDrawColor(150, 150, 150);
//     doc.setLineWidth(0.2);
//     doc.line(MARGIN.left, pageHeight - 14, pageWidth - MARGIN.right, pageHeight - 14);

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(8.5);
//     doc.setTextColor(0, 0, 0);
//     doc.text(
//       `Print Date: ${printDate.format("DD-MM-YYYY")}     Time: ${printTime}`,
//       MARGIN.left,
//       pageHeight - 9
//     );
//     doc.text(`Page ${i} of ${totalPages}`, pageWidth - MARGIN.right, pageHeight - 9, {
//       align: "right",
//     });
//   }

//   doc.save(`Employee_Salary_Report_${dayjs().format("DD-MM-YYYY")}.pdf`);
// }
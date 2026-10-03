import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import {
  reportEntryStatus,
  sumReport,
  type SchoolExpenseReportProduct,
} from "./SchoolExpensesService";

// ✏️ Put your real school details here (they appear in the report header)
const SCHOOL = {
  name: "JNPV School",
  subtitle: "Jawaharlal Nehru Port Vidyalaya",
  addressLines: ["Your school address line 1", "City, State, PIN"],
  contact: "Contact No: 0000000000",
  email: "Email: school@example.com",
};

const MAROON: [number, number, number] = [128, 0, 0];
const MARGIN = { top: 15, left: 10, right: 10, bottom: 18 };

const COLUMNS = ["Purchase Date", "Academic Year", "Qty", "Price", "Total", "Paid", "Pending", "Status"];
const COL_WIDTHS = [26, 26, 14, 24, 26, 26, 26, 22]; // = 190mm
const RIGHT_COLS = [2, 3, 4, 5, 6];
const columnStyles = COL_WIDTHS.reduce((acc, w, i) => {
  acc[i] = { cellWidth: w, halign: RIGHT_COLS.includes(i) ? "right" : "left" };
  return acc;
}, {} as Record<number, any>);

const num = (v: any) => Number(v) || 0;
const fix2 = (v: any) => num(v).toFixed(2);

export const buildSchoolExpensesReportPdf = (
  products: SchoolExpenseReportProduct[],
  filters: { category?: string; productName?: string; status?: string }
): Blob => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // ----- header (first page) -----
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
  const title = "School Expenses Report";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...MAROON);
  doc.text(title, centerX, y, { align: "center" });
  const titleWidth = doc.getTextWidth(title);
  doc.setDrawColor(...MAROON);
  doc.setLineWidth(0.4);
  doc.line(centerX - titleWidth / 2, y + 1, centerX + titleWidth / 2, y + 1);

  const filterParts = [
    filters.category ? `Category: ${filters.category}` : "",
    filters.productName ? `Product: ${filters.productName}` : "",
    filters.status ? `Status: ${filters.status}` : "",
  ].filter(Boolean);
  if (filterParts.length) {
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(filterParts.join("      "), centerX, y, { align: "center" });
  }

  y += 4;
  doc.setDrawColor(...MAROON);
  doc.setLineWidth(0.3);
  doc.line(MARGIN.left, y, pageWidth - MARGIN.right, y);

  let cursorY = y + 6;
  const bold = { fontStyle: "bold" as const };

  // ----- one block per product -----
  products.forEach((p) => {
    const entries = p.reportDataDTOList || [];
    const hasRows = entries.length > 0;

    // keep one product block together on a page
    const estimatedHeight = ((hasRows ? 2 : 1) + entries.length + 2) * 6.5 + 6;
    if (cursorY + estimatedHeight > pageHeight - MARGIN.bottom) {
      doc.addPage();
      cursorY = MARGIN.top;
    }

    const head: any[] = [
      [
        { content: `Category: ${p.category || "-"}`, colSpan: 3, styles: { halign: "left" } },
        { content: `Product: ${(p.productName || "-").trim()}`, colSpan: 3, styles: { halign: "left" } },
        { content: `Code: ${p.productCode || "-"}`, colSpan: 2, styles: { halign: "right" } },
      ],
    ];
    if (hasRows) {
      head.push(COLUMNS.map((c, i) => ({
        content: c,
        styles: { fontSize: 7.5, halign: RIGHT_COLS.includes(i) ? "right" : "left" },
      })));
    }

    const body: any[] = entries.map((e) => [
      e.purchaseDate ? dayjs(e.purchaseDate).format("DD-MM-YYYY") : "-",
      e.academicYear || "-",
      e.quantity ?? 0,
      fix2(e.price),
      fix2(e.total),
      e.paidAmount === null || e.paidAmount === undefined ? "-" : fix2(e.paidAmount),
      e.pendingAmount === null || e.pendingAmount === undefined ? "-" : fix2(e.pendingAmount),
      reportEntryStatus(e),
    ]);

    const totalAmount = sumReport(entries, "total");

    body.push([
      { content: "Total", colSpan: 2, styles: bold },
      { content: String(sumReport(entries, "quantity")), styles: bold },
      "",
      { content: fix2(totalAmount), styles: bold },
      { content: fix2(sumReport(entries, "paidAmount")), styles: bold },
      { content: fix2(sumReport(entries, "pendingAmount")), styles: bold },
      "",
    ]);

    body.push([
      {
        content: `Total Amount: ${fix2(totalAmount)}`,
        colSpan: 8,
        styles: { halign: "right", fontStyle: "bold" },
      },
    ]);

    const totalRowIndex = body.length - 2;
    const closingRowIndex = body.length - 1;

    autoTable(doc, {
      startY: cursorY,
      margin: MARGIN,
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
      columnStyles,
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
  const allEntries = products.flatMap((p) => p.reportDataDTOList || []);
  if (cursorY + 14 > pageHeight - MARGIN.bottom) {
    doc.addPage();
    cursorY = MARGIN.top;
  }

  autoTable(doc, {
    startY: cursorY,
    margin: MARGIN,
    theme: "plain",
    body: [
      [
        { content: "Grand Total", colSpan: 2, styles: bold },
        { content: String(sumReport(allEntries, "quantity")), styles: bold },
        "",
        { content: fix2(sumReport(allEntries, "total")), styles: bold },
        { content: fix2(sumReport(allEntries, "paidAmount")), styles: bold },
        { content: fix2(sumReport(allEntries, "pendingAmount")), styles: bold },
        "",
      ],
    ],
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2, textColor: [0, 0, 0] },
    columnStyles,
    didParseCell: (data) => {
      data.cell.styles.lineColor = [0, 0, 0] as any;
      data.cell.styles.lineWidth = { top: 0.3, right: 0, bottom: 0.3, left: 0 } as any;
    },
  });

  // ----- footer on every page: Print Date / Time / Page x of y -----
  const first = products[0];
  const printDate = first?.printDate ? dayjs(first.printDate) : dayjs();
  const printTime = first?.printTime ? first.printTime.toUpperCase() : dayjs().format("hh:mm A");

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);
    doc.line(MARGIN.left, pageHeight - 14, pageWidth - MARGIN.right, pageHeight - 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Print Date: ${printDate.format("DD-MM-YYYY")}     Time: ${printTime}`,
      MARGIN.left,
      pageHeight - 9
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - MARGIN.right, pageHeight - 9, {
      align: "right",
    });
  }

  return doc.output("blob");
};
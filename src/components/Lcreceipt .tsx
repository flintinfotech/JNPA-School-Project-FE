import { Modal, Button, message } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { SCHOOL_INFO } from "./FeeReceipt";

// ===========================
// Leaving Certificate — printable modal
// ===========================
// Same visual language as FeeReceipt.tsx (letterhead, logo, band, bordered
// info table) so every printout in the app looks consistent. Reuses
// SCHOOL_INFO from FeeReceipt.tsx so the school name/address/logo never
// drift out of sync between the two printouts.

export interface LCReceiptData {
  lcNumber?: string | null;
  lcDate?: string | null;
  admissionNumber?: string | null;
  admissionDate?: string | null;
  studentName?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  surname?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  nationality?: string | null;
  motherTongue?: string | null;
  religion?: string | null;
  caste?: string | null;
  standardAtLeaving?: string | null;
  division?: string | null;
  medium?: string | null;
  academicYear?: string | null;
  dateOfLeaving?: string | null;
  reasonForLeaving?: string | null;
  result?: string | null;
  conduct?: string | null;
  remark?: string | null;
}

const fmtDate = (value?: string | null): string => {
  if (!value) return "-";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : String(value);
};

const val = (value?: string | null): string =>
  value === undefined || value === null || value === "" ? "-" : String(value);

const esc = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ===========================
// Shared print stylesheet — used both for the on-screen preview (in the
// modal below) and for the standalone print document (see handlePrint).
// Kept as one string so the preview and the actual printout can never
// drift apart again.
// ===========================
const LC_STYLES = `
  .lc-receipt {
    font-family: "Times New Roman", Georgia, serif;
    color: #1f1f1f;
    border: 1px solid #333;
  }
  .lc-receipt table { width: 100%; border-collapse: collapse; }
  .lc-receipt .lr-header {
    display: flex;
    align-items: center;
    gap: 14px;
    justify-content: center;
    padding: 16px 20px 10px;
  }
  .lc-receipt .lr-header img { width: 56px; height: 56px; object-fit: contain; }
  .lc-receipt .lr-header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; }
  .lc-receipt .lr-header p { margin: 2px 0 0; font-size: 12px; color: #444; }
  .lc-receipt .lr-band {
    background: #e9e9e9;
    text-align: center;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 4px 0;
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
  }
  .lc-receipt .lr-items th, .lc-receipt .lr-items td {
    border-top: 1px solid #333;
    padding: 6px 10px;
    font-size: 13px;
  }
  .lc-receipt .lr-items th { text-align: left; background: #f5f5f5; }
  .lc-receipt .lr-items td.field-label { width: 45%; }
  .lc-receipt .lr-footer {
    padding: 30px 20px 18px;
    font-size: 12px;
    color: #444;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid #333;
  }
  .lc-receipt .lr-footer .sign-box {
    text-align: center;
    padding-top: 30px;
    border-top: 1px solid #333;
    width: 150px;
  }
  .lc-receipt .lr-footer .stamp-box {
    width: 90px;
    height: 90px;
    border: 1px dashed #999;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 10px;
    color: #999;
    line-height: 1.3;
  }
  .lc-receipt .lr-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  @media (max-width: 480px) {
    .lc-receipt .lr-header { gap: 8px; padding: 12px 10px 8px; }
    .lc-receipt .lr-header img { width: 40px; height: 40px; }
    .lc-receipt .lr-header h1 { font-size: 15px; }
    .lc-receipt .lr-header p { font-size: 10px; }
    .lc-receipt .lr-band { font-size: 12px; padding: 3px 0; }
    .lc-receipt .lr-items th, .lc-receipt .lr-items td { padding: 4px 6px; font-size: 11px; }
    .lc-receipt .lr-footer { padding: 20px 12px 12px; font-size: 10px; }
    .lc-receipt .lr-footer .sign-box { width: 100px; padding-top: 20px; }
    .lc-receipt .lr-footer .stamp-box { width: 64px; height: 64px; font-size: 8px; }
  }
`;

// ===========================
// Print-only overrides — the standalone print window uses these ON TOP
// of LC_STYLES to force everything (header + all 24 rows + sign/stamp
// footer) onto a single A4 page, sized to actually fill that page
// (rather than leaving a big empty gap at the bottom) — an explicit
// @page size/margin stops the browser falling back to its own larger
// default margins and spilling onto a second page.
// ===========================
const LC_PRINT_OVERRIDES = `
  @page { size: A4; margin: 12mm; }
  html, body { height: auto; }
  body { margin: 0; padding: 0; }
  .lc-receipt { border-width: 1px; page-break-inside: avoid; }
  .lc-receipt .lr-header { padding: 14px 20px 10px; gap: 14px; }
  .lc-receipt .lr-header img { width: 52px; height: 52px; }
  .lc-receipt .lr-header h1 { font-size: 19px; }
  .lc-receipt .lr-header p { font-size: 11px; }
  .lc-receipt .lr-band { font-size: 13px; padding: 5px 0; }
  .lc-receipt .lr-items th, .lc-receipt .lr-items td { padding: 6px 12px; font-size: 12.5px; }
  .lc-receipt .lr-footer { padding: 24px 20px 12px; }
  .lc-receipt .lr-footer .sign-box { width: 140px; padding-top: 24px; font-size: 12px; }
  .lc-receipt .lr-footer .stamp-box { width: 78px; height: 78px; font-size: 9px; }
`;

export default function LCReceiptModal({
  open,
  onClose,
  lc,
}: {
  open: boolean;
  onClose: () => void;
  lc: LCReceiptData | null;
}) {
  if (!lc) return null;

  // Every field that exists on the LC form (24 in total, in the same
  // order they appear in the "Leaving Certificate" tab) gets its own row.
  const rows: { no: number; label: string; value: string }[] = [
    { no: 1, label: "LC Number", value: val(lc.lcNumber) },
    { no: 2, label: "LC Date", value: fmtDate(lc.lcDate) },
    { no: 3, label: "Admission Number", value: val(lc.admissionNumber) },
    { no: 4, label: "Admission Date", value: fmtDate(lc.admissionDate) },
    { no: 5, label: "Student Name", value: val(lc.studentName) },
    { no: 6, label: "Surname", value: val(lc.surname) },
    { no: 7, label: "Father's Name", value: val(lc.fatherName) },
    { no: 8, label: "Mother's Name", value: val(lc.motherName) },
    { no: 9, label: "Gender", value: val(lc.gender) },
    { no: 10, label: "Date of Birth", value: fmtDate(lc.dateOfBirth) },
    { no: 11, label: "Place of Birth", value: val(lc.placeOfBirth) },
    { no: 12, label: "Nationality", value: val(lc.nationality) },
    { no: 13, label: "Mother Tongue", value: val(lc.motherTongue) },
    { no: 14, label: "Religion", value: val(lc.religion) },
    { no: 15, label: "Caste", value: val(lc.caste) },
    { no: 16, label: "Standard at Leaving", value: val(lc.standardAtLeaving) },
    { no: 17, label: "Division", value: val(lc.division) },
    { no: 18, label: "Medium", value: val(lc.medium) },
    { no: 19, label: "Academic Year", value: val(lc.academicYear) },
    { no: 20, label: "Date of Leaving", value: fmtDate(lc.dateOfLeaving) },
    { no: 21, label: "Reason for Leaving", value: val(lc.reasonForLeaving) },
    { no: 22, label: "Result", value: val(lc.result) },
    { no: 23, label: "Conduct", value: val(lc.conduct) },
    { no: 24, label: "Remark", value: val(lc.remark) },
  ];

  // Shared markup builder — reused for both the on-screen preview and the
  // standalone print document, so what you see in the modal is exactly
  // what gets printed/downloaded.
  const certificateBodyHtml = () => `
    <div class="lr-header">
      <img src="${SCHOOL_INFO.logo}" alt="${esc(SCHOOL_INFO.shortName)}" />
      <div>
        <h1>${esc(SCHOOL_INFO.name)}</h1>
        <p>${esc(SCHOOL_INFO.address)}</p>
      </div>
    </div>
    <div class="lr-band">LEAVING CERTIFICATE</div>
    <div class="lr-table-wrap">
      <table class="lr-items">
        <thead>
          <tr><th class="field-label">Particulars</th><th>Details</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr><td class="field-label">${esc(row.label)}</td><td>${esc(
                  row.value
                )}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="lr-footer">
      <div class="sign-box">Class Teacher</div>
      <div class="stamp-box">School Seal / Stamp</div>
      <div class="sign-box">Principal</div>
    </div>
  `;

  // ============================================================
  // 🛠️ FIX — printing used to rely on window.print() straight from the
  // modal, hidden/shown via a @media print stylesheet. AntD's Modal wrap
  // (position: fixed, its own overflow/scroll handling) sits between the
  // certificate and the page in ways a print stylesheet can't reliably
  // undo across browsers — so anything below the modal's scrollable area
  // (the sign/stamp footer, with 24 rows above it) kept getting cut out
  // of the printed/downloaded output even though it showed fine on
  // screen.
  //
  // Printing the certificate from its own standalone window sidesteps
  // that completely: this document has no modal, no scroll container, no
  // fixed positioning to fight with, so the full content — including the
  // footer — always makes it onto the printed page. The browser's own
  // print dialog ("Save as PDF") covers the "download" requirement the
  // same way it already does for the fee receipt.
  // ============================================================
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) {
      message.error(
        "Pop-up blocked — please allow pop-ups for this site to print the certificate."
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Leaving Certificate</title>
          <meta charset="utf-8" />
          <style>
            body { margin: 0; padding: 16px; }
            ${LC_STYLES}
            ${LC_PRINT_OVERRIDES}
          </style>
        </head>
        <body>
          <div class="lc-receipt">${certificateBodyHtml()}</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for the logo image to finish loading before printing, so it
    // isn't printed as a blank box. window.onload covers the image; a
    // short fallback timeout handles browsers that fire onload early.
    // The "printed" flag stops both from firing the dialog twice.
    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      printWindow.focus();
      printWindow.print();
    };
    printWindow.onload = triggerPrint;
    setTimeout(triggerPrint, 400);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={720}
      style={{ maxWidth: "95vw", top: 16 }}
      styles={{ body: { maxHeight: "80vh", overflowY: "auto", padding: 0 } }}
      wrapClassName="lc-receipt-modal-wrap"
      closeIcon={<span className="lc-receipt-close-icon">✕</span>}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
        >
          Print / Download
        </Button>,
      ]}
    >
      {/* On-screen preview only — actual printing happens in its own
          window via handlePrint above, using the exact same markup. */}
      <div className="lc-receipt">
        <style>{`
          .lc-receipt-modal-wrap .ant-modal-close {
            top: -18px;
            right: -18px;
            width: 36px;
            height: 36px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .lc-receipt-modal-wrap .ant-modal-close:hover { background: #f5f5f5; }
          .lc-receipt-close-icon {
            font-size: 16px;
            line-height: 1;
            color: rgba(0, 0, 0, 0.65);
          }
          ${LC_STYLES}
        `}</style>

        <div dangerouslySetInnerHTML={{ __html: certificateBodyHtml() }} />
      </div>
    </Modal>
  );
}
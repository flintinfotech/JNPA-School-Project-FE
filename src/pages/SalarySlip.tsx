import { Modal, Button, message } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import SchoolLogo from "../assets/SchoolLogo.avif";

// ===========================
// Salary Slip — standalone printable modal
// (no dependency on FeeReceipt / LC receipt)
// ===========================
// Shows ONLY the fields of the Profile > Salary form:
// Month, Academic Year, Salary Date, Account No, Bank Name, IFSC Code,
// Basic Salary, HRA, Medical Allowance, Transport Allowance,
// Other Allowance, Deduction, Net Salary, Remark.

export interface SalarySlipRecord {
  employeeSalaryId?: number | null;
  employeeDetailsId?: number | null;
  academicYear?: string | null;
  basicSalary?: number | null;
  hra?: number | null;
  medicalAllowance?: number | null;
  otherAllowance?: number | null;
  transportAllowance?: number | null;
  deduction?: number | null;
  netSalary?: number | null;
  salaryDate?: string | null;
  remark?: string | null;
}

export interface SalarySlipBank {
  accountNo?: string | null;
  bankName?: string | null;
  ifscCode?: string | null;
}

// ---------- own school header ----------
const SCHOOL = {
  name: "Jawaharlal Nehru Port Vidyalaya",
  address: "WX3H+282, Sector 3, Jaskhar, Maharashtra - 400707, India",
  logo: SchoolLogo,
};

// ---------- own helpers ----------
const val = (v?: string | number | null): string =>
  v === undefined || v === null || v === "" ? "-" : String(v);

const fmtDate = (v?: string | null, fmt = "DD-MM-YYYY"): string => {
  if (!v) return "-";
  const d = dayjs(v);
  return d.isValid() ? d.format(fmt) : String(v);
};

const esc = (v: string): string =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const money = (n: number): string =>
  "₹ " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const below100 = (n: number): string =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;

const below1000 = (n: number): string => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h && r) return `${ONES[h]} Hundred ${below100(r)}`;
  if (h) return `${ONES[h]} Hundred`;
  return below100(r);
};

const amountInWords = (value: number): string => {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${below100(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  return parts.join(" ");
};

// ---------- styles (screen preview + print window) ----------
const SLIP_STYLES = `
  .salary-slip { font-family: "Times New Roman", Georgia, serif; color: #1f1f1f; border: 1px solid #333; background:#fff; }
  .salary-slip table { width: 100%; border-collapse: collapse; }
  .salary-slip .sl-header { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 16px 20px 10px; }
  .salary-slip .sl-header img { width: 56px; height: 56px; object-fit: contain; }
  .salary-slip .sl-header h1 { margin: 0; font-size: 20px; letter-spacing: .5px; }
  .salary-slip .sl-header p { margin: 2px 0 0; font-size: 12px; color: #444; }
  .salary-slip .sl-band { background: #e9e9e9; text-align: center; font-weight: 700; letter-spacing: 1px; padding: 5px 0;
    border-top: 1px solid #333; border-bottom: 1px solid #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .salary-slip .sl-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 20px; padding: 12px 20px; font-size: 13px; border-bottom: 1px solid #333; }
  .salary-slip .sl-meta .cell span { display: block; }
  .salary-slip .sl-meta .cell span:first-child { color: #555; font-size: 11.5px; }
  .salary-slip .sl-meta .cell span:last-child { font-weight: 600; }
  .salary-slip .sl-tables { display: flex; gap: 16px; padding: 16px 20px 4px; }
  .salary-slip .sl-tables > div { flex: 1; }
  .salary-slip .sl-tables h3 { margin: 0 0 4px; font-size: 12.5px; text-transform: uppercase; letter-spacing: .5px; color: #444; }
  .salary-slip .sl-tables table { border: 1px solid #333; }
  .salary-slip .sl-tables th, .salary-slip .sl-tables td { border-top: 1px solid #333; padding: 6px 10px; font-size: 13px; }
  .salary-slip .sl-tables th { text-align: left; background: #f5f5f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .salary-slip .sl-tables td:last-child, .salary-slip .sl-tables th:last-child { text-align: right; }
  .salary-slip .sl-tables tr.total td { font-weight: 700; background: #fafafa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .salary-slip .sl-net { display: flex; justify-content: space-between; align-items: center; margin: 14px 20px 0; padding: 10px 14px;
    background: #f0f5ff; border: 1px solid #adc6ff; border-radius: 4px; font-weight: 700; font-size: 14px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .salary-slip .sl-words { padding: 8px 20px 12px; font-size: 12px; font-style: italic; color: #444; }
  .salary-slip .sl-bank { margin: 4px 20px 12px; padding: 10px 14px; border: 1px dashed #999; border-radius: 4px; font-size: 12.5px; }
  .salary-slip .sl-bank h3 { margin: 0 0 6px; font-size: 12.5px; text-transform: uppercase; letter-spacing: .5px; color: #444; }
  .salary-slip .sl-bank .row { display: flex; justify-content: space-between; padding: 2px 0; }
  .salary-slip .sl-bank .row span:first-child { color: #555; }
  .salary-slip .sl-bank .row span:last-child { font-weight: 600; }
  .salary-slip .sl-remark { margin: 0 20px 12px; font-size: 12.5px; }
  .salary-slip .sl-footer { padding: 26px 20px 16px; font-size: 11.5px; color: #666; display: flex; justify-content: space-between;
    align-items: flex-end; border-top: 1px solid #333; }
  .salary-slip .sl-footer .note { max-width: 55%; }
  .salary-slip .sl-footer .sign-box { text-align: center; padding-top: 30px; border-top: 1px solid #333; width: 150px; font-size: 12px; color: #444; }
  @media (max-width: 480px) {
    .salary-slip .sl-header { gap: 8px; padding: 12px 10px 8px; }
    .salary-slip .sl-header img { width: 40px; height: 40px; }
    .salary-slip .sl-header h1 { font-size: 15px; }
    .salary-slip .sl-header p { font-size: 10px; }
    .salary-slip .sl-meta { grid-template-columns: 1fr; padding: 10px 12px; }
    .salary-slip .sl-tables { flex-direction: column; padding: 10px 12px 0; }
    .salary-slip .sl-tables th, .salary-slip .sl-tables td { padding: 4px 6px; font-size: 11px; }
    .salary-slip .sl-net { margin: 10px 12px 0; font-size: 12px; }
    .salary-slip .sl-words, .salary-slip .sl-remark { padding-left: 12px; padding-right: 12px; margin-left: 0; margin-right: 0; }
    .salary-slip .sl-bank { margin: 4px 12px 12px; font-size: 11px; }
    .salary-slip .sl-footer { padding: 18px 12px 12px; font-size: 10px; }
    .salary-slip .sl-footer .sign-box { width: 100px; padding-top: 20px; }
  }
`;

const SLIP_PRINT_OVERRIDES = `
  @page { size: A4; margin: 12mm; }
  html, body { height: auto; }
  body { margin: 0; padding: 0; }
  .salary-slip { page-break-inside: avoid; }
`;

// ---------- build the slip markup (used by preview, print and PDF) ----------
export const buildSlipHtml = (
  salary: SalarySlipRecord,
  bank?: SalarySlipBank | null
): string => {
  const basic = Number(salary.basicSalary) || 0;
  const hra = Number(salary.hra) || 0;
  const medical = Number(salary.medicalAllowance) || 0;
  const transport = Number(salary.transportAllowance) || 0;
  const other = Number(salary.otherAllowance) || 0;
  const deduction = Number(salary.deduction) || 0;

  const totalEarnings = basic + hra + medical + transport + other;
  const netSalary =
    salary.netSalary !== undefined && salary.netSalary !== null
      ? Number(salary.netSalary)
      : totalEarnings - deduction;

  const month = fmtDate(salary.salaryDate, "MMMM");
  const payPeriod = fmtDate(salary.salaryDate, "MMMM YYYY");

  const earnings = [
    { label: "Basic Salary", amount: basic },
    { label: "HRA", amount: hra },
    { label: "Medical Allowance", amount: medical },
    { label: "Transport Allowance", amount: transport },
    { label: "Other Allowance", amount: other },
  ];

  return `
    <div class="sl-header">
      <img src="${SCHOOL.logo}" alt="logo" />
      <div>
        <h1>${esc(SCHOOL.name)}</h1>
        <p>${esc(SCHOOL.address)}</p>
      </div>
    </div>
    <div class="sl-band">SALARY SLIP — ${esc(payPeriod)}</div>

    <div class="sl-meta">
      <div class="cell"><span>Month</span><span>${esc(month)}</span></div>
      <div class="cell"><span>Academic Year</span><span>${esc(val(salary.academicYear))}</span></div>
      <div class="cell"><span>Salary Date</span><span>${esc(fmtDate(salary.salaryDate))}</span></div>
    </div>

    <div class="sl-tables">
      <div>
        <h3>Earnings</h3>
        <table>
          <thead><tr><th>Component</th><th>Amount</th></tr></thead>
          <tbody>
            ${earnings.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(money(r.amount))}</td></tr>`).join("")}
            <tr class="total"><td>Total Earnings</td><td>${esc(money(totalEarnings))}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3>Deductions</h3>
        <table>
          <thead><tr><th>Component</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>Deduction</td><td>${esc(money(deduction))}</td></tr>
            <tr class="total"><td>Total Deductions</td><td>${esc(money(deduction))}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="sl-net"><span>Net Salary</span><span>${esc(money(netSalary))}</span></div>
    <div class="sl-words">Rupees ${esc(amountInWords(netSalary))} Only</div>

    <div class="sl-bank">
      <h3>Bank Details</h3>
      <div class="row"><span>Account No</span><span>${esc(val(bank?.accountNo))}</span></div>
      <div class="row"><span>Bank Name</span><span>${esc(val(bank?.bankName))}</span></div>
      <div class="row"><span>IFSC Code</span><span>${esc(val(bank?.ifscCode))}</span></div>
    </div>

    ${salary.remark ? `<div class="sl-remark"><b>Remark:</b> ${esc(salary.remark)}</div>` : ""}

    <div class="sl-footer">
      <div class="note">This is a computer-generated salary slip and does not require a signature.</div>
      <div class="sign-box">Authorized Signatory</div>
    </div>
  `;
};

// ---------- PRINT (opens the browser print dialog; "Save as PDF" is available there) ----------
export const printSalarySlip = (
  salary: SalarySlipRecord,
  bank?: SalarySlipBank | null
) => {
  const payPeriod = fmtDate(salary.salaryDate, "MMMM YYYY");
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    message.error("Pop-up blocked — please allow pop-ups to print the salary slip.");
    return;
  }
  w.document.open();
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8" />
    <title>Salary Slip - ${esc(payPeriod)}</title>
    <style>body{margin:0;padding:16px;} ${SLIP_STYLES} ${SLIP_PRINT_OVERRIDES}</style>
    </head><body><div class="salary-slip">${buildSlipHtml(salary, bank)}</div></body></html>`);
  w.document.close();

  let printed = false;
  const go = () => {
    if (printed) return;
    printed = true;
    w.focus();
    w.print();
  };
  w.onload = go;
  setTimeout(go, 400);
};

// ---------- preview modal ----------
export default function SalarySlipModal({
  open,
  onClose,
  salary,
  bank,
}: {
  open: boolean;
  onClose: () => void;
  salary: SalarySlipRecord | null;
  bank?: SalarySlipBank | null;
}) {
  if (!salary) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={720}
      wrapClassName="salary-slip-modal-wrap"
      closeIcon={<span className="salary-slip-close-icon">✕</span>}
      style={{ maxWidth: "95vw", top: 32 }}
      styles={{ body: { maxHeight: "80vh", overflowY: "auto", padding: 0 } }}
      footer={[
        <Button key="close" onClick={onClose}>Close</Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => printSalarySlip(salary, bank)}>
          Print
        </Button>,
      ]}
    >
      <div className="salary-slip">
        <style>{`
          /* Close (✕) button floats above the top-right corner of the modal.
             Change top / right to move it up or down. */
          .salary-slip-modal-wrap .ant-modal-close {
            top: -16px;
            right: -10px;
            width: 34px;
            height: 34px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
          }
          .salary-slip-modal-wrap .ant-modal-close:hover { background: #f5f5f5; }
          .salary-slip-close-icon { font-size: 15px; line-height: 1; color: rgba(0, 0, 0, 0.65); }
          ${SLIP_STYLES}
        `}</style>
        <div dangerouslySetInnerHTML={{ __html: buildSlipHtml(salary, bank) }} />
      </div>
    </Modal>
  );
}
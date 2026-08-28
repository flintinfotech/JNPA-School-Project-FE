import { Modal, Button } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import SchoolLogo from "../assets/SchoolLogo.avif";
import type {
  StudentDTO,
  StudentFeeDTO,
  FeePaymentDTO,
  AcademicInformationDTO,
} from "../services/studentService";

// ===========================
// School letterhead info
// ===========================
// Same details used on the public site (see Footer.tsx / HomePage.tsx).
// Change here once if the school's details change — everything else
// (receipt, any future printouts) can just import SCHOOL_INFO.
export const SCHOOL_INFO = {
  name: "Jawaharlal Nehru Port Vidyalaya",
  shortName: "JNPV",
  address: "WX3H+282, Sector 3, Jaskhar, Maharashtra - 400707, India",
  email: "admissions@jnpv.org",
  logo: SchoolLogo,
};

// ===========================
// Number -> Indian words (for "Total in Words")
// ===========================
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${TENS[tens]}${ones ? " " + ONES[ones] : ""}`;
}

function threeDigits(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  if (hundred && rest) return `${ONES[hundred]} Hundred ${twoDigits(rest)}`;
  if (hundred) return `${ONES[hundred]} Hundred`;
  return twoDigits(rest);
}

// Indian numbering: crore / lakh / thousand / hundred
export function numberToIndianWords(value?: number | null): string {
  const num = Math.round(Number(value) || 0);
  if (!num) return "Zero";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = num % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  return parts.join(" ");
}

const formatCurrency = (value?: number | null): string => {
  if (value === undefined || value === null || isNaN(value)) return "-";
  return `\u20b9 ${Number(value).toLocaleString("en-IN")}`;
};

// Status text/color shown on the printed receipt for the FEE itself (e.g.
// "PENDING", "PAID"/"COMPLETED", "OVERDUE"). Kept as plain inline-styled
// text (not an antd Tag) so it prints cleanly.
const feeStatusStyle = (status?: string) => {
  const s = (status || "").toUpperCase();
  if (s === "PAID" || s === "COMPLETED" || s === "SUCCESS")
    return { color: "#237804", fontWeight: 700 };
  if (s === "PENDING") return { color: "#ad6800", fontWeight: 700 };
  if (s === "FAILED" || s === "CANCELLED" || s === "OVERDUE") return { color: "#a8071a", fontWeight: 700 };
  return { color: "#1f1f1f", fontWeight: 700 };
};

// ===========================
// Receipt No helpers
// ===========================
// Same formula used inside the receipt itself — exported so the Fee tab
// (StudentProfile.tsx) can display the same Receipt No next to each
// fee card / payment row, without it ever drifting out of sync.
export function getCardReceiptNo(fee: { studentFeeId?: number }): string {
  return `FEE-${fee.studentFeeId ?? "NA"}`;
}

export function getPaymentReceiptNo(payment: {
  feePaymentId?: number;
  transactionId?: string;
  receiptNo?: string;
}): string {
  // Prefer the receipt number the backend actually generated for this
  // payment; fall back to the transaction id, then the payment's own id,
  // only if receiptNo isn't present on older records.
  return (
    payment.receiptNo ||
    payment.transactionId ||
    (payment.feePaymentId ? `PAY-${payment.feePaymentId}` : "-")
  );
}

// ===========================
// Fee Receipt Modal
// ===========================
// Renders a printable receipt for ONE fee transaction (a single entry
// from fee.feePaymentDTOS), styled after the school's standard fee
// receipt layout (receipt no / adm no / name / class header, a fee
// breakdown table, pay-mode info, and a total-in-words line).
export default function FeeReceiptModal({
  open,
  onClose,
  student,
  academic,
  fee,
  payment,
}: {
  open: boolean;
  onClose: () => void;
  student: StudentDTO | null;
  academic?: AcademicInformationDTO;
  fee: StudentFeeDTO | null;
  // Pass a specific FeePaymentDTO for a single-transaction receipt, or
  // null/omit for a card-level receipt covering the whole fee record
  // (all payments made against it, total paid to date).
  payment?: FeePaymentDTO | null;
}) {
  if (!student || !fee) return null;

  const isCardLevel = !payment;
  const allPayments = fee.feePaymentDTOS || [];

  const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim();

  const className =
    academic?.standard || academic?.section
      ? `${academic?.standard || ""}${academic?.section ? ` - ${academic.section}` : ""}`
      : "-";

  // Receipt No / Date / amount differ depending on whether this is a
  // single-transaction receipt or the whole fee card's receipt.
  const receiptNo = isCardLevel
    ? getCardReceiptNo(fee)
    : getPaymentReceiptNo(payment!);

  const latestPaymentDate = allPayments.length
    ? allPayments.reduce((latest, p) => {
        if (!p.paymentDate) return latest;
        return !latest || dayjs(p.paymentDate).isAfter(dayjs(latest)) ? p.paymentDate : latest;
      }, undefined as string | undefined)
    : undefined;

  const receiptDate = isCardLevel ? latestPaymentDate : payment!.paymentDate;
  const receiptAmount = isCardLevel ? fee.paidAmount : payment!.amount;

  // Same name shown as the card title on the Fee tab (fee.feeName) —
  // reused here so the receipt is titled after the actual fee head,
  // e.g. "Tuition Fee Receipt" instead of a generic "Fee Receipt".
  const receiptTitle = `${fee.feeName || "Fee"} Receipt`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={640}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Print Receipt
        </Button>,
      ]}
    //   title={receiptTitle}
    >
      {/* Only this block is visible when printing — see @media print rules below. */}
      <div id="fee-receipt-print-area" className="fee-receipt">
        <style>{`
          .fee-receipt {
            font-family: "Times New Roman", Georgia, serif;
            color: #1f1f1f;
            border: 1px solid #333;
          }
          .fee-receipt table { width: 100%; border-collapse: collapse; }
          .fee-receipt .fr-header {
            display: flex;
            align-items: center;
            gap: 14px;
            justify-content: center;
            padding: 16px 20px 10px;
          }
          .fee-receipt .fr-header img { width: 56px; height: 56px; object-fit: contain; }
          .fee-receipt .fr-header h1 {
            margin: 0; font-size: 20px; letter-spacing: 0.5px;
          }
          .fee-receipt .fr-header p { margin: 2px 0 0; font-size: 12px; color: #444; }
          .fee-receipt .fr-band {
            background: #e9e9e9;
            text-align: center;
            font-weight: 700;
            letter-spacing: 1px;
            padding: 4px 0;
            border-top: 1px solid #333;
            border-bottom: 1px solid #333;
          }
          .fee-receipt .fr-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 24px;
            padding: 12px 20px;
            font-size: 13px;
          }
          .fee-receipt .fr-info div { display: flex; }
          .fee-receipt .fr-info span.label { width: 92px; color: #333; }
          .fee-receipt .fr-items th, .fee-receipt .fr-items td {
            border-top: 1px solid #333;
            padding: 6px 10px;
            font-size: 13px;
          }
          .fee-receipt .fr-items th { text-align: left; background: #f5f5f5; }
          .fee-receipt .fr-items td.num, .fee-receipt .fr-items th.num { text-align: right; }
          .fee-receipt .fr-paymode {
            padding: 10px 20px;
            font-size: 13px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 24px;
            border-top: 1px solid #333;
          }
          .fee-receipt .fr-total-row {
            display: flex; justify-content: space-between;
            padding: 8px 20px;
            font-weight: 700;
            border-top: 1px solid #333;
          }
          .fee-receipt .fr-words {
            padding: 10px 20px;
            font-size: 13px;
            border-top: 1px solid #333;
          }
          .fee-receipt .fr-footer {
            padding: 10px 20px 16px;
            font-size: 11px;
            color: #444;
            border-top: 1px solid #333;
          }
          .fee-receipt .fr-copy {
            text-align: center;
            font-size: 11px;
            letter-spacing: 2px;
            color: #666;
            padding-bottom: 10px;
          }

          @media print {
            body * { visibility: hidden; }
            #fee-receipt-print-area, #fee-receipt-print-area * { visibility: visible; }
            #fee-receipt-print-area {
              position: absolute; left: 0; top: 0; width: 100%;
              border: none;
            }
          }
        `}</style>

        {/* Header */}
        <div className="fr-header">
          <img src={SCHOOL_INFO.logo} alt={SCHOOL_INFO.shortName} />
          <div>
            <h1>{SCHOOL_INFO.name}</h1>
            <p>{SCHOOL_INFO.address}</p>
          </div>
        </div>

        <div className="fr-band">{receiptTitle.toUpperCase()}</div>

        {/* Receipt / student info */}
        <div className="fr-info">
          <div><span className="label">Receipt No</span>: {receiptNo}</div>
          <div>
            <span className="label">Date</span>:{" "}
            {receiptDate ? dayjs(receiptDate).format("DD/MM/YYYY") : "-"}
          </div>

          <div><span className="label">Adm No</span>: {academic?.admissionNo ?? "-"}</div>
          <div><span className="label">Session</span>: {fee.academicYear || academic?.academicYear || "-"}</div>

          <div><span className="label">Name</span>: {studentName || "-"}</div>
          <div><span className="label">Class</span>: {className}</div>

          <div><span className="label">Fee Head</span>: {fee.feeName || "-"}</div>
          <div><span className="label">Roll No</span>: {academic?.rollNo ?? "-"}</div>
        </div>

        {/* Fee breakdown */}
        <table className="fr-items">
          <thead>
            <tr>
              <th style={{ width: 40 }}>Sl.No</th>
              <th>Description</th>
              <th className="num">Total Fee</th>
              <th className="num">Paid</th>
              <th className="num">Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>{fee.feeName || "-"}</td>
              <td className="num">{formatCurrency(fee.totalFeeAmount)}</td>
              <td className="num">{formatCurrency(receiptAmount)}</td>
              <td className="num">{formatCurrency(fee.pendingAmount ?? fee.dueAmount)}</td>
              <td style={feeStatusStyle(fee.status)}>{fee.status || "-"}</td>
            </tr>
          </tbody>
        </table>

        {isCardLevel ? (
          <>
            {/* Card-level receipt: list every payment made against this fee */}
            <div className="fr-band" style={{ background: "#fff", fontWeight: 700 }}>
              PAYMENTS RECEIVED
            </div>
            {allPayments.length > 0 ? (
              <table className="fr-items">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Txn / Ref No</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map((p, i) => (
                    <tr key={p.feePaymentId ?? i}>
                      <td>{getPaymentReceiptNo(p)}</td>
                      <td>{p.paymentDate ? dayjs(p.paymentDate).format("DD/MM/YYYY") : "-"}</td>
                      <td>{p.paymentMode || "-"}</td>
                      <td>{p.transactionId || "-"}</td>
                      <td className="num">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="fr-paymode">
                <div>No payments recorded yet.</div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Single-transaction receipt: this one payment's details */}
            <div className="fr-band" style={{ background: "#fff", fontWeight: 700 }}>
              PAY MODE INFORMATION
            </div>
            <div className="fr-paymode">
              <div><span className="label">Pay Mode</span>: {payment!.paymentMode || "-"}</div>
              <div>
                <span className="label">Date</span>:{" "}
                {payment!.paymentDate ? dayjs(payment!.paymentDate).format("DD/MM/YYYY") : "-"}
              </div>
              <div><span className="label">Txn / Ref No</span>: {payment!.transactionId || "-"}</div>
              <div><span className="label">Remarks</span>: {payment!.remarks || "-"}</div>
            </div>
          </>
        )}

        <div className="fr-total-row">
          <span>{isCardLevel ? "Total Paid" : "Total"}</span>
          <span>{formatCurrency(receiptAmount)}</span>
        </div>

        <div className="fr-words">
          <strong>Total in Words:</strong> {numberToIndianWords(receiptAmount)} Only
        </div>

        <div className="fr-footer">
          This is a computer generated receipt and does not require a signature.
        </div>

        <div className="fr-copy">PARENT COPY</div>
      </div>
    </Modal>
  );
}
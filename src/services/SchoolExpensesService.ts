import axiosInstance from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

// =====================================================
// Types
// =====================================================

// One school expense. The backend now sends the product details FLAT on every row
// (no purchaseId / purchaseDTO any more).
export interface SchoolExpensesDTO {
  schoolExpenseId: number;
  academicYear: string;
  category: string;
  productCode?: string;
  productName: string;
  price: number;
  quantity: number;
  total: number | null;
  paidAmount?: number | null;
  pendingAmount?: number | null;
  purchaseDate: string;
  status: string;
}

export interface SchoolExpensesResponse {
  success: boolean;
  message: string;
  data: SchoolExpensesDTO;
  timestamp?: string;
}

export interface SchoolExpensesListResponse {
  success: boolean;
  message: string;
  data: {
    SchoolExpensesDTOS: SchoolExpensesDTO[];
    "Total Element": number;
  };
  timestamp?: string;
}

// Body for POST saveSchoolExpenses
export interface SaveSchoolExpensePayload {
  price: number;
  quantity: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  academicYear: string;
  purchaseDate: string;
  status: string;
  productCode?: string;
  category: string;
  productName: string;
}

// Body for PUT updateSchoolExpenses (same as save + schoolExpenseId)
export interface UpdateSchoolExpensePayload extends SaveSchoolExpensePayload {
  schoolExpenseId: number;
}

// =====================================================
// Save School Expenses
// POST schoolExpenses/saveSchoolExpenses
// =====================================================

export const saveSchoolExpenses = async (
  payload: SaveSchoolExpensePayload
): Promise<SchoolExpensesResponse> => {
  const response = await axiosInstance.post(
    apiEndpoints.saveSchoolExpenses(),
    payload
  );

  return response.data;
};

// =====================================================
// Get School Expenses By ID
// GET schoolExpenses/getSchoolExpenses/{schoolExpenseId}
// =====================================================

export const getSchoolExpensesById = async (
  schoolExpenseId: number | string
): Promise<SchoolExpensesResponse> => {
  const response = await axiosInstance.get(
    apiEndpoints.getSchoolExpensesById(schoolExpenseId)
  );

  return response.data;
};

// =====================================================
// Update School Expenses
// PUT schoolExpenses/updateSchoolExpenses
// =====================================================

export const updateSchoolExpenses = async (
  payload: UpdateSchoolExpensePayload
): Promise<SchoolExpensesResponse> => {
  const response = await axiosInstance.put(
    apiEndpoints.updateSchoolExpenses(),
    payload
  );

  return response.data;
};

// =====================================================
// Delete School Expenses
// DELETE schoolExpenses/deleteSchoolExpenses/{schoolExpenseId}
// =====================================================

export const deleteSchoolExpenses = async (
  schoolExpenseId: number | string
) => {
  const response = await axiosInstance.delete(
    apiEndpoints.deleteSchoolExpenses(schoolExpenseId)
  );

  return response.data;
};

// =====================================================
// Get All School Expenses
// POST schoolExpenses/getAllSchoolExpensesByFilter?page=&size=&desc&paginate=true
// Body: { "productName": "Carrom", "category": "Physics Lab Equipment" }  (only what is selected)
// =====================================================

export interface SchoolExpenseListPayload {
  productName?: string;
  category?: string;
}

export const getAllSchoolExpensesByFilter = async (
  page: number,
  size: number,
  payload: SchoolExpenseListPayload = {}
): Promise<SchoolExpensesListResponse> => {
  // empty values are NOT sent
  const body: Record<string, string> = {};
  if (payload.productName?.trim()) body.productName = payload.productName.trim();
  if (payload.category?.trim()) body.category = payload.category.trim();

  const response = await axiosInstance.post(
    apiEndpoints.getAllSchoolExpensesByFilter(page, size),
    body
  );

  return response.data;
};

// =====================================================
// School Expenses REPORT
// POST schoolExpenses/getSchoolExpensesReportData?page=&size=&desc&paginate=true
// =====================================================

export interface SchoolExpenseReportEntry {
  academicYear: string | null;
  paidAmount: number | null;
  pendingAmount: number | null;
  price: number | null;
  purchaseDate: string | null;
  quantity: number | null;
  total: number | null;
}

// One block per product, with all its purchases. This is the shape the report screen and
// the PDF already use, so they keep working without any change.
export interface SchoolExpenseReportProduct {
  category: string;
  productCode?: string;
  productName: string;
  printDate?: string;
  printTime?: string;
  reportDataDTOList: SchoolExpenseReportEntry[];
}

// The backend now sends ONE FLAT ROW per purchase (category, productName, quantity, total ...).
interface SchoolExpenseReportFlatRow extends SchoolExpenseReportEntry {
  category: string;
  productCode?: string;
  productName: string;
  printDate?: string;
  printTime?: string;
}

// Body sent to the report API. Empty values are NOT sent, so the body is {}
// when nothing is selected. Dates are "YYYY-MM-DD". Example:
// {
//   "productName": "Carrom",
//   "category": "Physics Lab Equipment",
//   "range:purchaseDate": { "start": "2026-10-01", "end": "2026-11-04" }
// }
export interface SchoolExpenseReportPayload {
  category?: string;
  productName?: string;
  "range:purchaseDate"?: { start?: string; end?: string };
}

// Groups the flat rows by product, so each product has its list of purchases.
const groupReportRows = (rows: SchoolExpenseReportFlatRow[]): SchoolExpenseReportProduct[] => {
  const map = new Map<string, SchoolExpenseReportProduct>();

  rows.forEach((r) => {
    const key = r.productCode || `${r.category}|${(r.productName || "").trim()}`;
    let product = map.get(key);
    if (!product) {
      product = {
        category: r.category,
        productCode: r.productCode,
        productName: r.productName,
        printDate: r.printDate,
        printTime: r.printTime,
        reportDataDTOList: [],
      };
      map.set(key, product);
    }
    product.reportDataDTOList.push({
      academicYear: r.academicYear ?? null,
      paidAmount: r.paidAmount ?? null,
      pendingAmount: r.pendingAmount ?? null,
      price: r.price ?? null,
      purchaseDate: r.purchaseDate ?? null,
      quantity: r.quantity ?? null,
      total: r.total ?? null,
    });
  });

  return Array.from(map.values());
};

// The backend paginates, so we read ALL pages here. The screen also re-checks
// the filters in the browser as a safety net.
export const getAllSchoolExpensesReportData = async (
  payload: SchoolExpenseReportPayload = {}
): Promise<SchoolExpenseReportProduct[]> => {
  const size = 50;
  let pageNo = 0;
  let totalCount = 0;
  const all: SchoolExpenseReportFlatRow[] = [];

  // remove empty values (strings and the nested date range)
  const body: Record<string, any> = {};
  if (payload.productName?.trim()) body.productName = payload.productName.trim();
  if (payload.category?.trim()) body.category = payload.category.trim();
  const range = payload["range:purchaseDate"];
  if (range?.start || range?.end) {
    body["range:purchaseDate"] = {
      ...(range.start ? { start: range.start } : {}),
      ...(range.end ? { end: range.end } : {}),
    };
  }

  do {
    const res = await axiosInstance.post(
      apiEndpoints.getSchoolExpensesReportData(pageNo, size),
      body
    );
    const data = res.data;
    if (!data?.success) throw new Error(data?.message || "Failed to load school expenses report");

    const list: SchoolExpenseReportFlatRow[] = data.data?.Data || [];
    totalCount = data.data?.total ?? list.length;
    all.push(...list);

    if (list.length === 0) break; // safety: never loop forever
    pageNo += 1;
  } while (all.length < totalCount);

  return groupReportRows(all);
};

// ---------- report helpers (shared by the screen and the PDF) ----------
const n = (v: any) => Number(v) || 0;

// The report API has no status field, so it is worked out from the amounts:
//   pending > 0                 -> PENDING
//   nothing pending, paid > 0   -> PAID
//   no payment info             -> "-"
export const reportEntryStatus = (e: SchoolExpenseReportEntry): string => {
  if (n(e.pendingAmount) > 0) return "PENDING";
  if (n(e.paidAmount) > 0) return "PAID";
  return "-";
};

export const reportProductStatus = (entries: SchoolExpenseReportEntry[]): string => {
  const statuses = entries.map(reportEntryStatus);
  if (statuses.includes("PENDING")) return "PENDING";
  if (statuses.includes("PAID")) return "PAID";
  return "-";
};

export const sumReport = (
  entries: SchoolExpenseReportEntry[],
  key: keyof SchoolExpenseReportEntry
): number => entries.reduce((acc, e) => acc + n(e[key]), 0);
import axiosInstance from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

// =====================================================
// Types
// =====================================================

export interface PurchaseDTO {
  purchaseId: number;
  category: string;
  productCode?: string;
  productName: string;
}

export interface SchoolExpensesDTO {
  schoolExpenseId: number;
  purchaseId: number;
  purchaseDTO: PurchaseDTO;
  quantity: number;
  price: number;
  total: number | null;
  paidAmount?: number | null;
  pendingAmount?: number | null;
  // 🆕 New field, inserted before "status".
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

// =====================================================
// Save School Expenses
// =====================================================

export const saveSchoolExpenses = async (
  payload: {
    price: number;
    quantity: number;
    total: number;
    purchaseId: number;
    paidAmount: number;
    pendingAmount: number;
    // 🆕
    purchaseDate: string;
    status: string;
  }
): Promise<SchoolExpensesResponse> => {
  const response = await axiosInstance.post(
    apiEndpoints.saveSchoolExpenses(),
    payload
  );

  return response.data;
};

// =====================================================
// Get School Expenses By ID
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
// =====================================================

export const updateSchoolExpenses = async (
  payload: {
    price: number;
    quantity: number;
    // 🛠️ FIX — total must be sent on update too, or the backend stores
    // it as null and dashboard expense totals come out wrong.
    total: number;
    schoolExpenseId: number;
    purchaseId: number;
    paidAmount: number;
    pendingAmount: number;
    // 🆕
    purchaseDate: string;
    status: string;
  }
): Promise<SchoolExpensesResponse> => {
  const response = await axiosInstance.put(
    apiEndpoints.updateSchoolExpenses(),
    payload
  );

  return response.data;
};

// =====================================================
// Delete School Expenses
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
// =====================================================

export const getAllSchoolExpensesByFilter = async (
  page: number,
  size: number,
  payload: object = {}
): Promise<SchoolExpensesListResponse> => {
  const response = await axiosInstance.post(
    apiEndpoints.getAllSchoolExpensesByFilter(page, size),
    payload
  );

  return response.data;
};

// =====================================================
// School Expenses REPORT (one block per product, with all its purchases)
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

export interface SchoolExpenseReportProduct {
  category: string;
  productCode?: string;
  productName: string;
  printDate?: string;
  printTime?: string;
  reportDataDTOList: SchoolExpenseReportEntry[];
}

// 🆕 Body sent to the report API. Empty values are NOT sent, so the body is {}
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

// The backend paginates, so we read ALL pages here. The screen also re-checks
// the filters in the browser as a safety net.
export const getAllSchoolExpensesReportData = async (
  payload: SchoolExpenseReportPayload = {}
): Promise<SchoolExpenseReportProduct[]> => {
  const size = 50;
  let pageNo = 0;
  let totalCount = 0;
  const all: SchoolExpenseReportProduct[] = [];

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

    const list: SchoolExpenseReportProduct[] = data.data?.Data || [];
    totalCount = data.data?.total ?? list.length;
    all.push(...list);

    if (list.length === 0) break; // safety: never loop forever
    pageNo += 1;
  } while (all.length < totalCount);

  return all;
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
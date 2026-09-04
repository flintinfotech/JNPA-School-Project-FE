
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
    schoolExpenseId: number;
    purchaseId: number;
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


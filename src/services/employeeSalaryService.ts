import axiosInstance from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface EmployeeSalaryDTO {
  employeeSalaryId?: number;
  employeeDetailsId: number;
  salaryDate: string;
  basicSalary: number;
  hra: number;
  transportAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  deduction: number;
  netSalary?: number;
  remark?: string;
  academicYear: string;
  // optional: only shown if backend sends them
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface EmployeeSalaryFilters {
  firstName?: string;
  lastName?: string;
  role?: string;
  employeeDetailsId?: number;
}

export const saveEmployeeSalary = async (payload: any) => {
  const res = await axiosInstance.post(apiEndpoints.saveEmployeeSalary(), payload);
  return res.data;
};

export const updateEmployeeSalary = async (payload: any) => {
  const res = await axiosInstance.put(apiEndpoints.updateEmployeeSalary(), payload);
  return res.data;
};

// Returns ONE salary record by its employeeSalaryId.
// To get all records of an employee use getSalariesByEmployeeDetailsId() below.
export const getEmployeeSalary = async (employeeSalaryId: number | string) => {
  const res = await axiosInstance.get(apiEndpoints.getEmployeeSalary(employeeSalaryId));
  return res.data;
};

export const deleteEmployeeSalary = async (employeeSalaryId: number | string) => {
  const res = await axiosInstance.delete(apiEndpoints.deleteEmployeeSalary(employeeSalaryId));
  return res.data;
};

export const getAllEmployeeSalaryByFilter = async (
  page: number,
  size: number,
  filters?: EmployeeSalaryFilters
) => {
  // Empty filter values are removed, so the body stays {} when nothing is searched
  const body: Record<string, string | number> = {};
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) body[k] = v as string | number;
  });
  const res = await axiosInstance.post(apiEndpoints.getAllEmployeeSalaryByFilter(page, size), body);
  return res.data;
};

// Loads EVERY salary record of one employee using the list API (all pages).
// The employeeDetailsId is sent in the body, and the result is also filtered here,
// so it works even if the backend ignores that filter.
// If your backend rejects the unknown "employeeDetailsId" body field, remove it from
// the call below — the client-side filter will still keep only this employee's rows.
export const getSalariesByEmployeeDetailsId = async (
  employeeDetailsId: number
): Promise<EmployeeSalaryDTO[]> => {
  const size = 100;
  const all: EmployeeSalaryDTO[] = [];

  for (let page = 0; page < 50; page++) {
    const res = await getAllEmployeeSalaryByFilter(page, size, { employeeDetailsId });
    if (!res?.success) break;

    const rows: EmployeeSalaryDTO[] = res.data?.Data ?? [];
    all.push(...rows);

    const total: number = res.data?.total ?? 0;
    if (rows.length === 0 || all.length >= total) break;
  }

  return all.filter((r) => Number(r.employeeDetailsId) === Number(employeeDetailsId));
};
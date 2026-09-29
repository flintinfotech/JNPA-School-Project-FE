import api from "../lib/axios";
import { apiEndpoints } from "./apiEndpoints";

export interface EmployeeSalaryDTO {
  employeeSalaryId: number;
  employeeDetailsId: number;
  academicYear?: string;
  basicSalary?: number;
  hra?: number;
  medicalAllowance?: number;
  otherAllowance?: number;
  transportAllowance?: number;
  deduction?: number;
  netSalary?: number;
  salaryDate?: string;
  remark?: string;
}

export const getEmployeeSalaryByFilter = async (
  employeeDetailsId: number,
  page: number = 0,
  size: number = 10
): Promise<EmployeeSalaryDTO[]> => {
  try {
    const { data } = await api.post(
      apiEndpoints.getAllEmployeeSalaryByFilter(page, size),
      { employeeDetailsId }
    );
console.log("SALARY RAW RESPONSE:", data);
    if (data?.success === false) {
      return [];
    }

    const list = data?.data?.Data || data?.data?.data || data?.data || [];
    console.log("SALARY LIST:", list);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Failed to load salary records:", error);
    return [];
  }
};
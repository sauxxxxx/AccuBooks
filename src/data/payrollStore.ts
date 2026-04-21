import { createStore } from "./createStore";
import {
  payrollEmployees as initialEmployees,
  payrollRecords as initialRecords,
  type PayrollEmployee,
  type PayrollRecord,
} from "../pages/payroll/payrollData";

export type PayrollState = {
  employees: PayrollEmployee[];
  records: PayrollRecord[];
};

const payrollStore = createStore<PayrollState>({
  employees: [...initialEmployees],
  records: [...initialRecords],
});

export const usePayrollStore = payrollStore.useStore;
export const updatePayrollStore = payrollStore.update;
export const setPayrollStore = payrollStore.set;


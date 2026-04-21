export type PayrollTabKey = "employees" | "records";

export type PayrollPeriodRange = {
  end: Date;
  key: string;
  label: string;
  start: Date;
};

export type PayrollContributionBreakdown = {
  employerPagIbig: number;
  employerPhilHealth: number;
  employerSss: number;
  employeePagIbig: number;
  employeePhilHealth: number;
  employeeSss: number;
  employerContributions: number;
  monthlyTaxableIncome: number;
  totalEmployeeDeductions: number;
  withholdingTax: number;
};

export type PayrollEmployee = {
  allowances?: number;
  basicSalary: number;
  email?: string;
  firstName?: string;
  id: string;
  lastName?: string;
  pagIbigNumber?: string;
  name: string;
  philhealthNumber?: string;
  position: string;
  sssNumber?: string;
  status: "active";
  tin?: string;
  frequency: "Semi Monthly";
};

export type NewPayrollEmployeeDraft = {
  allowances: number;
  basicSalaryMonthly: number;
  email: string;
  firstName: string;
  lastName: string;
  pagIbigNumber: string;
  position: string;
  philhealthNumber: string;
  sssNumber: string;
  tin: string;
};

export type PayrollRecord = {
  deductions: number;
  employee: string;
  employeeId?: string;
  gross: number;
  breakdown?: PayrollContributionBreakdown;
  netPay: number;
  payDate?: string;
  period: string;
  periodEnd?: string;
  periodKey?: string;
  periodStart?: string;
  payslipNumber?: string;
  payrollRunId?: string;
  source?: "generated" | "manual";
  status: "draft" | "approved" | "paid";
};

export const payrollTabs: Array<{ key: PayrollTabKey; label: string; icon: "users" | "file-text" }> = [
  { key: "employees", label: "Employees", icon: "users" },
  { key: "records", label: "Payroll Records", icon: "file-text" },
];

export const payrollEmployees: PayrollEmployee[] = [
  {
    id: "payroll-employee-1",
    name: "Liza Bautista",
    position: "Tax Specialist",
    basicSalary: 38000,
    frequency: "Semi Monthly",
    status: "active",
  },
  {
    id: "payroll-employee-2",
    name: "Ramon Cruz",
    position: "Payroll Officer",
    basicSalary: 30000,
    frequency: "Semi Monthly",
    status: "active",
  },
  {
    id: "payroll-employee-3",
    name: "Ana Garcia",
    position: "Senior Accountant",
    basicSalary: 45000,
    frequency: "Semi Monthly",
    status: "active",
  },
  {
    id: "payroll-employee-4",
    name: "Jose Mendoza",
    position: "Junior Accountant",
    basicSalary: 28000,
    frequency: "Semi Monthly",
    status: "active",
  },
];

export const payrollRecords: PayrollRecord[] = [
  { employee: "Ana Garcia", period: "2026-04-01 – 2026-04-15", gross: 24000, deductions: 5250, netPay: 18750, status: "draft" },
  { employee: "Jose Mendoza", period: "2026-04-01 – 2026-04-15", gross: 15000, deductions: 2825, netPay: 12175, status: "draft" },
  { employee: "Ana Garcia", period: "2026-02-01 – 2026-02-15", gross: 24000, deductions: 5250, netPay: 18750, status: "paid" },
  { employee: "Liza Bautista", period: "2026-02-01 – 2026-02-15", gross: 20250, deductions: 4475, netPay: 15775, status: "approved" },
  { employee: "Ana Garcia", period: "2026-01-16 – 2026-01-31", gross: 24000, deductions: 5250, netPay: 18750, status: "paid" },
  { employee: "Jose Mendoza", period: "2026-01-16 – 2026-01-31", gross: 15000, deductions: 2825, netPay: 12175, status: "paid" },
  { employee: "Ana Garcia", period: "2026-01-01 – 2026-01-15", gross: 24000, deductions: 5250, netPay: 18750, status: "paid" },
  { employee: "Jose Mendoza", period: "2026-01-01 – 2026-01-15", gross: 15000, deductions: 2825, netPay: 12175, status: "paid" },
  { employee: "Liza Bautista", period: "2026-01-01 – 2026-01-15", gross: 20250, deductions: 4475, netPay: 15775, status: "paid" },
];

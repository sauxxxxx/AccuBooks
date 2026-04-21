import type { IconName } from "../../components/Icon";

export type SummaryTone = "income" | "expenses" | "cashflow" | "warning";

export type SummaryMetric = {
  icon: IconName;
  note?: string;
  tone: SummaryTone;
  title: string;
  value: string;
};

export type DashboardTab = "Daily" | "Weekly" | "Monthly" | "Annual";

export type CashFlowPoint = {
  expenses: number;
  income: number;
  label: string;
};

export type ExpenseSlice = {
  color: string;
  label: string;
  value: number;
};

export type Transaction = {
  amount: string;
  date: string;
  description: string;
  status: "draft" | "posted" | "partial";
  type: string;
};

export const dashboardTabs: DashboardTab[] = ["Daily", "Weekly", "Monthly", "Annual"];

export const summaryMetrics: SummaryMetric[] = [
  {
    icon: "trending-up",
    title: "Total Income",
    value: "₱202,000.00",
    tone: "income",
  },
  {
    icon: "trending-down",
    title: "Total Expenses",
    value: "₱280,000.00",
    tone: "expenses",
  },
  {
    icon: "dollar-sign",
    title: "Net Cash Flow",
    value: "-₱78,000.00",
    tone: "cashflow",
  },
  {
    icon: "alert-triangle",
    note: "Needs attention",
    title: "Overdue Invoices",
    value: "0",
    tone: "warning",
  },
];

export const cashFlowByPeriod: Record<DashboardTab, CashFlowPoint[]> = {
  Daily: [
    { label: "Mon", income: 8, expenses: 5 },
    { label: "Tue", income: 10, expenses: 7 },
    { label: "Wed", income: 14, expenses: 9 },
    { label: "Thu", income: 12, expenses: 10 },
    { label: "Fri", income: 20, expenses: 14 },
    { label: "Sat", income: 18, expenses: 12 },
    { label: "Sun", income: 24, expenses: 15 },
  ],
  Weekly: [
    { label: "W5", income: 0, expenses: 5 },
    { label: "W6", income: 22, expenses: 35 },
    { label: "W7", income: 26, expenses: 0 },
    { label: "W8", income: 1, expenses: 0 },
    { label: "W9", income: 0, expenses: 72 },
    { label: "W10", income: 54, expenses: 0 },
    { label: "W11", income: 0, expenses: 8 },
    { label: "W12", income: 0, expenses: 12 },
    { label: "W13", income: 0, expenses: 0 },
    { label: "W14", income: 0, expenses: 0 },
    { label: "W15", income: 54, expenses: 35 },
    { label: "W16", income: 0, expenses: 0 },
  ],
  Monthly: [
    { label: "Jan", income: 24, expenses: 18 },
    { label: "Feb", income: 28, expenses: 20 },
    { label: "Mar", income: 30, expenses: 24 },
    { label: "Apr", income: 36, expenses: 26 },
    { label: "May", income: 42, expenses: 32 },
    { label: "Jun", income: 48, expenses: 34 },
    { label: "Jul", income: 55, expenses: 42 },
    { label: "Aug", income: 52, expenses: 40 },
    { label: "Sep", income: 45, expenses: 33 },
    { label: "Oct", income: 62, expenses: 44 },
    { label: "Nov", income: 68, expenses: 48 },
    { label: "Dec", income: 74, expenses: 51 },
  ],
  Annual: [
    { label: "2022", income: 180, expenses: 152 },
    { label: "2023", income: 220, expenses: 168 },
    { label: "2024", income: 260, expenses: 205 },
    { label: "2025", income: 320, expenses: 250 },
    { label: "2026", income: 380, expenses: 290 },
  ],
};

export const expenseSlices: ExpenseSlice[] = [
  { color: "#4ea974", label: "Salaries & Wages", value: 38 },
  { color: "#f59e0b", label: "Utilities Expense", value: 14 },
  { color: "#a855f7", label: "Marketing & Advertising", value: 10 },
  { color: "#ec4899", label: "Transportation Expense", value: 8 },
  { color: "#84cc16", label: "Office Supplies", value: 7 },
  { color: "#445947", label: "Rent Expense", value: 23 },
];

export const recentTransactions: Transaction[] = [
  {
    amount: "₱18,000.00",
    date: "Apr 10, 2026",
    description: "Insurance premium - annual",
    status: "draft",
    type: "cash disbursements",
  },
  {
    amount: "₱35,000.00",
    date: "Apr 7, 2026",
    description: "Office rental - April",
    status: "posted",
    type: "cash disbursements",
  },
  {
    amount: "₱54,000.00",
    date: "Apr 5, 2026",
    description: "Service revenue - All clients April",
    status: "posted",
    type: "cash receipts",
  },
  {
    amount: "₱12,000.00",
    date: "Mar 15, 2026",
    description: "Marketing materials - Q1",
    status: "posted",
    type: "cash disbursements",
  },
  {
    amount: "₱5,800.00",
    date: "Mar 10, 2026",
    description: "Transportation and travel expense - March",
    status: "posted",
    type: "cash disbursements",
  },
  {
    amount: "₱54,000.00",
    date: "Mar 5, 2026",
    description: "Service revenue - All clients March",
    status: "posted",
    type: "cash receipts",
  },
  {
    amount: "₱70,500.00",
    date: "Feb 28, 2026",
    description: "Semi-monthly payroll - February 16-28",
    status: "posted",
    type: "general",
  },
  {
    amount: "₱25,000.00",
    date: "Feb 14, 2026",
    description: "Service revenue from Santos IT - February",
    status: "posted",
    type: "cash receipts",
  },
];

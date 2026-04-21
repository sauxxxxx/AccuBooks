export type FinancialStatementTabKey = "balance-sheet" | "income-statement" | "trial-balance" | "cash-flow";

export type FinancialStatementTab = {
  key: FinancialStatementTabKey;
  label: string;
};

export type StatementRow = {
  amount: number;
  depth?: number;
  label: string;
};

export type StatementSection = {
  rows: StatementRow[];
  title: string;
  totalAmount: number;
  totalLabel: string;
};

export type TrialBalanceRow = {
  account: string;
  credit: number;
  debit: number;
};

export type BalanceSheetSummary = {
  assets: number;
  equity: number;
  liabilities: number;
};

export const financialStatementTabs: FinancialStatementTab[] = [
  { key: "balance-sheet", label: "Balance Sheet" },
  { key: "income-statement", label: "Income Statement" },
  { key: "trial-balance", label: "Trial Balance" },
  { key: "cash-flow", label: "Cash Flow Statement" },
];

export const balanceSheetSections: StatementSection[] = [
  {
    title: "Assets",
    rows: [
      { amount: 0, depth: 1, label: "1000 - Cash" },
      { amount: -12_950, depth: 1, label: "1010 - Cash in Bank" },
      { amount: 0, depth: 1, label: "1100 - Accounts Receivable" },
      { amount: 0, depth: 1, label: "1200 - Prepaid Expenses" },
      { amount: 0, depth: 1, label: "1300 - Inventory" },
      { amount: 0, depth: 1, label: "1500 - Office Equipment" },
      { amount: 0, depth: 1, label: "1510 - Accumulated Depreciation - Equipment" },
      { amount: 0, depth: 1, label: "1600 - Computer Equipment" },
    ],
    totalAmount: -12_950,
    totalLabel: "Total Assets",
  },
  {
    title: "Liabilities",
    rows: [
      { amount: 0, depth: 1, label: "2000 - Accounts Payable" },
      { amount: 0, depth: 1, label: "2100 - Accrued Expenses" },
      { amount: 0, depth: 1, label: "2200 - VAT Payable" },
      { amount: 12_400, depth: 1, label: "2300 - Withholding Tax Payable" },
      { amount: 9_000, depth: 1, label: "2400 - SSS Payable" },
      { amount: 7_050, depth: 1, label: "2410 - PhilHealth Payable" },
      { amount: 1_600, depth: 1, label: "2420 - Pag-IBIG Payable" },
    ],
    totalAmount: 30_050,
    totalLabel: "Total Liabilities",
  },
  {
    title: "Equity",
    rows: [
      { amount: 0, depth: 1, label: "3000 - Owner's Capital" },
      { amount: 0, depth: 1, label: "3100 - Retained Earnings" },
      { amount: -43_000, depth: 1, label: "Net Income" },
    ],
    totalAmount: -43_000,
    totalLabel: "Total Equity",
  },
];

export const balanceSheetSummary: BalanceSheetSummary = {
  assets: -12_950,
  equity: -43_000,
  liabilities: 30_050,
};

export const incomeStatementSections: StatementSection[] = [
  {
    title: "Revenues",
    rows: [
      { amount: 202_000, depth: 1, label: "4000 - Service Revenue" },
      { amount: 0, depth: 1, label: "4010 - Sales Revenue" },
      { amount: 0, depth: 1, label: "4100 - Interest Income" },
      { amount: 0, depth: 1, label: "4200 - Other Income" },
    ],
    totalAmount: 202_000,
    totalLabel: "Total Revenue",
  },
  {
    title: "Expenses",
    rows: [
      { amount: 141_000, depth: 1, label: "5000 - Salaries & Wages" },
      { amount: 0, depth: 1, label: "5010 - Employee Benefits" },
      { amount: 70_000, depth: 1, label: "5100 - Rent Expense" },
      { amount: 13_000, depth: 1, label: "5200 - Utilities Expense" },
      { amount: 3_200, depth: 1, label: "5300 - Office Supplies" },
      { amount: 0, depth: 1, label: "5400 - Professional Fees" },
      { amount: 0, depth: 1, label: "5500 - Depreciation Expense" },
      { amount: 5_800, depth: 1, label: "5600 - Transportation Expense" },
      { amount: 12_000, depth: 1, label: "5700 - Marketing & Advertising" },
      { amount: 0, depth: 1, label: "5800 - Insurance Expense" },
      { amount: 0, depth: 1, label: "5900 - Miscellaneous Expense" },
    ],
    totalAmount: 245_000,
    totalLabel: "Total Expenses",
  },
];

export const incomeStatementNetIncome = -43_000;

export const trialBalanceRows: TrialBalanceRow[] = [
  { account: "1010 - Cash in Bank", debit: 0, credit: 12_950 },
  { account: "2300 - Withholding Tax Payable", debit: 0, credit: 12_400 },
  { account: "2400 - SSS Payable", debit: 0, credit: 9_000 },
  { account: "2410 - PhilHealth Payable", debit: 0, credit: 7_050 },
  { account: "2420 - Pag-IBIG Payable", debit: 0, credit: 1_600 },
  { account: "4000 - Service Revenue", debit: 0, credit: 202_000 },
  { account: "5000 - Salaries & Wages", debit: 141_000, credit: 0 },
  { account: "5100 - Rent Expense", debit: 70_000, credit: 0 },
  { account: "5200 - Utilities Expense", debit: 13_000, credit: 0 },
  { account: "5300 - Office Supplies", debit: 3_200, credit: 0 },
  { account: "5600 - Transportation Expense", debit: 5_800, credit: 0 },
  { account: "5700 - Marketing & Advertising", debit: 12_000, credit: 0 },
];

export const trialBalanceTotals = {
  credit: 245_000,
  debit: 245_000,
};

export const cashFlowOperatingRows: StatementRow[] = [
  { amount: -43_000, depth: 1, label: "Net Income" },
];

export const cashFlowOperationsRows: StatementRow[] = [
  { amount: 0, depth: 1, label: "Change in Accounts Receivable" },
  { amount: 0, depth: 1, label: "Change in Accounts Payable" },
  { amount: 0, depth: 1, label: "Change in VAT Payable" },
  { amount: 12_400, depth: 1, label: "Change in Withholding Tax Payable" },
  { amount: 9_000, depth: 1, label: "Change in SSS Payable" },
  { amount: 7_050, depth: 1, label: "Change in PhilHealth Payable" },
  { amount: 1_600, depth: 1, label: "Change in Pag-IBIG Payable" },
];

export const cashFlowNetCashFlow = -43_000;

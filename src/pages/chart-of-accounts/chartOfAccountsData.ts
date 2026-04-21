export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type AccountStatus = "Active" | "Inactive";
export type AccountBalance = "Debit" | "Credit";
export type AccountTypeFilter = "All Types" | AccountType;

export type NewChartAccountDraft = {
  code: string;
  name: string;
  normalBalance: AccountBalance;
  parentCode: string | null;
  status: AccountStatus;
  type: AccountType;
};

export type ChartAccountNode = {
  children?: ChartAccountNode[];
  code: string;
  name: string;
  normalBalance: AccountBalance;
  status: AccountStatus;
  type: AccountType;
};

export const accountTypeOptions: AccountTypeFilter[] = [
  "All Types",
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
];

export const chartOfAccounts: ChartAccountNode[] = [
  {
    code: "1000",
    name: "Assets",
    normalBalance: "Debit",
    status: "Active",
    type: "asset",
    children: [
      {
        code: "1010",
        name: "Cash and Cash Equivalents",
        normalBalance: "Debit",
        status: "Active",
        type: "asset",
        children: [
          {
            code: "1011",
            name: "Cash on Hand",
            normalBalance: "Debit",
            status: "Active",
            type: "asset",
          },
          {
            code: "1012",
            name: "Bank - BPI",
            normalBalance: "Debit",
            status: "Active",
            type: "asset",
          },
          {
            code: "1013",
            name: "Bank - BDO",
            normalBalance: "Debit",
            status: "Active",
            type: "asset",
          },
        ],
      },
      {
        code: "1100",
        name: "Accounts Receivable",
        normalBalance: "Debit",
        status: "Active",
        type: "asset",
        children: [
          {
            code: "1110",
            name: "Trade Receivables",
            normalBalance: "Debit",
            status: "Active",
            type: "asset",
          },
          {
            code: "1120",
            name: "Employee Advances",
            normalBalance: "Debit",
            status: "Active",
            type: "asset",
          },
        ],
      },
      {
        code: "1200",
        name: "Prepaid Expenses",
        normalBalance: "Debit",
        status: "Active",
        type: "asset",
      },
      {
        code: "1300",
        name: "Inventory",
        normalBalance: "Debit",
        status: "Active",
        type: "asset",
      },
      {
        code: "1500",
        name: "Fixed Assets",
        normalBalance: "Debit",
        status: "Active",
        type: "asset",
        children: [
          {
            code: "1510",
            name: "Office Equipment",
            normalBalance: "Debit",
            status: "Active",
            type: "asset",
          },
          {
            code: "1520",
            name: "Computer Equipment",
            normalBalance: "Debit",
            status: "Active",
            type: "asset",
          },
          {
            code: "1530",
            name: "Accumulated Depreciation - Equipment",
            normalBalance: "Credit",
            status: "Active",
            type: "asset",
          },
        ],
      },
    ],
  },
  {
    code: "2000",
    name: "Liabilities",
    normalBalance: "Credit",
    status: "Active",
    type: "liability",
    children: [
      {
        code: "2100",
        name: "Accounts Payable",
        normalBalance: "Credit",
        status: "Active",
        type: "liability",
        children: [
          {
            code: "2110",
            name: "Trade Payables",
            normalBalance: "Credit",
            status: "Active",
            type: "liability",
          },
          {
            code: "2120",
            name: "Supplier Deposits",
            normalBalance: "Credit",
            status: "Active",
            type: "liability",
          },
        ],
      },
      {
        code: "2200",
        name: "Statutory Payables",
        normalBalance: "Credit",
        status: "Active",
        type: "liability",
        children: [
          {
            code: "2210",
            name: "VAT Payable",
            normalBalance: "Credit",
            status: "Active",
            type: "liability",
          },
          {
            code: "2220",
            name: "Withholding Tax Payable",
            normalBalance: "Credit",
            status: "Active",
            type: "liability",
          },
          {
            code: "2230",
            name: "SSS Payable",
            normalBalance: "Credit",
            status: "Active",
            type: "liability",
          },
          {
            code: "2240",
            name: "PhilHealth Payable",
            normalBalance: "Credit",
            status: "Active",
            type: "liability",
          },
          {
            code: "2250",
            name: "Pag-IBIG Payable",
            normalBalance: "Credit",
            status: "Active",
            type: "liability",
          },
        ],
      },
      {
        code: "2300",
        name: "Accrued Expenses",
        normalBalance: "Credit",
        status: "Active",
        type: "liability",
      },
    ],
  },
  {
    code: "3000",
    name: "Equity",
    normalBalance: "Credit",
    status: "Active",
    type: "equity",
    children: [
      {
        code: "3100",
        name: "Owner's Capital",
        normalBalance: "Credit",
        status: "Active",
        type: "equity",
      },
      {
        code: "3200",
        name: "Retained Earnings",
        normalBalance: "Credit",
        status: "Active",
        type: "equity",
      },
    ],
  },
  {
    code: "4000",
    name: "Revenue",
    normalBalance: "Credit",
    status: "Active",
    type: "revenue",
    children: [
      {
        code: "4100",
        name: "Sales Revenue",
        normalBalance: "Credit",
        status: "Active",
        type: "revenue",
      },
      {
        code: "4200",
        name: "Service Revenue",
        normalBalance: "Credit",
        status: "Active",
        type: "revenue",
      },
      {
        code: "4300",
        name: "Other Income",
        normalBalance: "Credit",
        status: "Active",
        type: "revenue",
      },
    ],
  },
  {
    code: "5000",
    name: "Expenses",
    normalBalance: "Debit",
    status: "Active",
    type: "expense",
    children: [
      {
        code: "5100",
        name: "Cost of Sales",
        normalBalance: "Debit",
        status: "Active",
        type: "expense",
        children: [
          {
            code: "5110",
            name: "Freight and Handling",
            normalBalance: "Debit",
            status: "Active",
            type: "expense",
          },
        ],
      },
      {
        code: "5200",
        name: "Payroll Expenses",
        normalBalance: "Debit",
        status: "Active",
        type: "expense",
        children: [
          {
            code: "5210",
            name: "Salaries & Wages",
            normalBalance: "Debit",
            status: "Active",
            type: "expense",
          },
          {
            code: "5220",
            name: "Employee Benefits",
            normalBalance: "Debit",
            status: "Active",
            type: "expense",
          },
        ],
      },
      {
        code: "5300",
        name: "Rent and Occupancy",
        normalBalance: "Debit",
        status: "Active",
        type: "expense",
        children: [
          {
            code: "5310",
            name: "Rent Expense",
            normalBalance: "Debit",
            status: "Active",
            type: "expense",
          },
        ],
      },
      {
        code: "5400",
        name: "Utilities",
        normalBalance: "Debit",
        status: "Active",
        type: "expense",
        children: [
          {
            code: "5410",
            name: "Electricity",
            normalBalance: "Debit",
            status: "Active",
            type: "expense",
          },
          {
            code: "5420",
            name: "Internet and Communications",
            normalBalance: "Debit",
            status: "Active",
            type: "expense",
          },
        ],
      },
      {
        code: "5500",
        name: "Transportation",
        normalBalance: "Debit",
        status: "Active",
        type: "expense",
        children: [
          {
            code: "5510",
            name: "Travel Expense",
            normalBalance: "Debit",
            status: "Active",
            type: "expense",
          },
          {
            code: "5520",
            name: "Fuel and Gas",
            normalBalance: "Debit",
            status: "Active",
            type: "expense",
          },
        ],
      },
      {
        code: "5600",
        name: "Office Supplies",
        normalBalance: "Debit",
        status: "Active",
        type: "expense",
      },
      {
        code: "5700",
        name: "Professional Fees",
        normalBalance: "Debit",
        status: "Active",
        type: "expense",
      },
      {
        code: "5800",
        name: "Taxes and Licenses",
        normalBalance: "Debit",
        status: "Active",
        type: "expense",
      },
    ],
  },
];

export const journalFilters = ["All", "General", "Cash Receipts", "Cash Disbursements", "Sales", "Purchase"] as const;

export type JournalFilter = (typeof journalFilters)[number];
export type JournalStatus = "draft" | "posted" | "partial";
export type JournalJournal = Exclude<JournalFilter, "All">;
export type JournalType = "Income" | "Expense" | "Transfer" | "Adjustment";

export type JournalEntry = {
  credit: number;
  date: string;
  debit: number;
  description: string;
  entryNumber: string;
  createdAt?: string;
  createdBy?: string;
  client?: string;
  lineItems?: JournalLineItem[];
  journal: JournalJournal;
  reference?: string;
  transactionType?: JournalType;
  status: JournalStatus;
};

export type JournalLineItem = {
  account: string;
  credit: number;
  debit: number;
  id: string;
};

export type JournalEntryDraft = {
  client: string;
  date: string;
  description: string;
  lineItems: JournalLineItem[];
  reference: string;
  transactionType: JournalType;
};

export const transactionTypeOptions: JournalType[] = ["Income", "Expense", "Transfer", "Adjustment"];

export const accountOptions = [
  "Cash on Hand",
  "Bank",
  "Accounts Receivable",
  "Service Revenue",
  "Sales Revenue",
  "Rent Expense",
  "Utilities Expense",
  "Salaries and Wages",
  "Transportation Expense",
  "Office Supplies Expense",
  "Payroll Payable",
  "Withholding Tax Payable",
];

export const journalEntries: JournalEntry[] = [
  {
    credit: 18000,
    date: "Apr 10, 2026",
    debit: 18000,
    description: "Insurance premium - annual",
    entryNumber: "JE-2026-019",
    lineItems: [
      { account: "5800 - Taxes and Licenses", credit: 0, debit: 18000, id: "je-019-1" },
      { account: "1012 - Bank - BPI", credit: 18000, debit: 0, id: "je-019-2" },
    ],
    journal: "Cash Disbursements",
    status: "draft",
  },
  {
    credit: 35000,
    date: "Apr 7, 2026",
    debit: 35000,
    description: "Office rental - April",
    entryNumber: "JE-2026-018",
    lineItems: [
      { account: "5310 - Rent Expense", credit: 0, debit: 35000, id: "je-018-1" },
      { account: "1012 - Bank - BPI", credit: 35000, debit: 0, id: "je-018-2" },
    ],
    journal: "Cash Disbursements",
    status: "posted",
  },
  {
    credit: 54000,
    date: "Apr 5, 2026",
    debit: 54000,
    description: "Service revenue - All clients April",
    client: "Multiple clients",
    entryNumber: "JE-2026-017",
    lineItems: [
      { account: "1012 - Bank - BPI", credit: 0, debit: 54000, id: "je-017-1" },
      { account: "4200 - Service Revenue", credit: 54000, debit: 0, id: "je-017-2" },
    ],
    journal: "Cash Receipts",
    status: "posted",
  },
  {
    credit: 12000,
    date: "Mar 15, 2026",
    debit: 12000,
    description: "Marketing materials - Q1",
    entryNumber: "JE-2026-016",
    lineItems: [
      { account: "5600 - Office Supplies", credit: 0, debit: 12000, id: "je-016-1" },
      { account: "1012 - Bank - BPI", credit: 12000, debit: 0, id: "je-016-2" },
    ],
    journal: "Cash Disbursements",
    status: "posted",
  },
  {
    credit: 5800,
    date: "Mar 10, 2026",
    debit: 5800,
    description: "Transportation and travel expense - March",
    entryNumber: "JE-2026-015",
    lineItems: [
      { account: "5510 - Travel Expense", credit: 0, debit: 5800, id: "je-015-1" },
      { account: "1012 - Bank - BPI", credit: 5800, debit: 0, id: "je-015-2" },
    ],
    journal: "Cash Disbursements",
    status: "posted",
  },
  {
    credit: 54000,
    date: "Mar 5, 2026",
    debit: 54000,
    description: "Service revenue - All clients March",
    client: "Multiple clients",
    entryNumber: "JE-2026-014",
    lineItems: [
      { account: "1012 - Bank - BPI", credit: 0, debit: 54000, id: "je-014-1" },
      { account: "4200 - Service Revenue", credit: 54000, debit: 0, id: "je-014-2" },
    ],
    journal: "Cash Receipts",
    status: "posted",
  },
  {
    credit: 70500,
    date: "Feb 28, 2026",
    debit: 70500,
    description: "Semi-monthly payroll - February 16-28",
    entryNumber: "JE-2026-013",
    createdAt: "Apr 16, 2026 6:48 AM",
    createdBy: "wshaun035@gmail.com",
    lineItems: [
      { account: "5210 - Salaries & Wages", credit: 0, debit: 70500, id: "je-013-1" },
      { account: "1012 - Bank - BPI", credit: 55475, debit: 0, id: "je-013-2" },
      { account: "2230 - SSS Payable", credit: 4500, debit: 0, id: "je-013-3" },
      { account: "2240 - PhilHealth Payable", credit: 3525, debit: 0, id: "je-013-4" },
      { account: "2250 - Pag-IBIG Payable", credit: 800, debit: 0, id: "je-013-5" },
      { account: "2220 - Withholding Tax Payable", credit: 6200, debit: 0, id: "je-013-6" },
    ],
    journal: "General",
    status: "posted",
  },
  {
    credit: 25000,
    date: "Feb 14, 2026",
    debit: 25000,
    description: "Service revenue from Santos IT - February",
    client: "Santos IT Solutions",
    entryNumber: "JE-2026-012",
    lineItems: [
      { account: "1012 - Bank - BPI", credit: 0, debit: 25000, id: "je-012-1" },
      { account: "4200 - Service Revenue", credit: 25000, debit: 0, id: "je-012-2" },
    ],
    journal: "Cash Receipts",
    status: "posted",
  },
  {
    credit: 35000,
    date: "Feb 7, 2026",
    debit: 35000,
    description: "Office rental payment - February",
    entryNumber: "JE-2026-011",
    lineItems: [
      { account: "5310 - Rent Expense", credit: 0, debit: 35000, id: "je-011-1" },
      { account: "1012 - Bank - BPI", credit: 35000, debit: 0, id: "je-011-2" },
    ],
    journal: "Cash Disbursements",
    status: "posted",
  },
  {
    credit: 48000,
    date: "Jan 30, 2026",
    debit: 48000,
    description: "Inventory purchase - end of month",
    entryNumber: "JE-2026-010",
    lineItems: [
      { account: "1300 - Inventory", credit: 0, debit: 48000, id: "je-010-1" },
      { account: "2100 - Accounts Payable", credit: 48000, debit: 0, id: "je-010-2" },
    ],
    journal: "Purchase",
    status: "partial",
  },
  {
    credit: 62000,
    date: "Jan 22, 2026",
    debit: 62000,
    description: "Retail sales batch - January",
    client: "Multiple clients",
    entryNumber: "JE-2026-009",
    lineItems: [
      { account: "1012 - Bank - BPI", credit: 0, debit: 62000, id: "je-009-1" },
      { account: "4100 - Sales Revenue", credit: 62000, debit: 0, id: "je-009-2" },
    ],
    journal: "Sales",
    status: "posted",
  },
];

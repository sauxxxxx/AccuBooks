export const arApTabs = ["Accounts Receivable", "Accounts Payable", "Aging Report", "Payment History"] as const;

export type ArApTab = (typeof arApTabs)[number];
export const recordPaymentTypeOptions = ["AR (from Client)", "AP (to Supplier)"] as const;
export const recordPaymentMethodOptions = ["Cash", "Bank Transfer", "Check", "Online"] as const;

export type RecordPaymentType = (typeof recordPaymentTypeOptions)[number];
export type RecordPaymentMethod = (typeof recordPaymentMethodOptions)[number];

export type ArInvoiceRow = {
  balance: number;
  client: string;
  dueDate: string;
  invoiceNumber: string;
  paid: number;
  status: "partial" | "sent";
  total: number;
};

export type ApPaymentRow = {
  amount: number;
  date: string;
  method: string;
  paymentNumber: string;
  supplier: string;
};

export type AgingBucketRow = {
  amount: number;
  bucket: string;
};

export type PaymentHistoryRow = {
  amount: number;
  date: string;
  entity: string;
  method: string;
  paymentNumber: string;
  type: "AR" | "AP";
};

export type RecordPaymentDraft = {
  amount: number;
  date: string;
  entity: string;
  method: RecordPaymentMethod;
  reference: string;
  type: RecordPaymentType;
};

export const arInvoices: ArInvoiceRow[] = [
  {
    balance: 25000,
    client: "Santos IT Solutions",
    dueDate: "Apr 20, 2026",
    invoiceNumber: "INV-2026-006",
    paid: 0,
    status: "sent",
    total: 25000,
  },
  {
    balance: 6000,
    client: "Flores Restaurant Group",
    dueDate: "Mar 20, 2026",
    invoiceNumber: "INV-2026-004",
    paid: 0,
    status: "sent",
    total: 6000,
  },
  {
    balance: 8500,
    client: "Reyes & Associates Law Firm",
    dueDate: "Mar 20, 2026",
    invoiceNumber: "INV-2026-005",
    paid: 10000,
    status: "partial",
    total: 18500,
  },
];

export const openPayables = [
  { amount: 35000, supplier: "Makati Office Rentals Inc." },
  { amount: 4500, supplier: "Globe Telecom" },
  { amount: 35000, supplier: "Makati Office Rentals Inc." },
];

export const apPayments: ApPaymentRow[] = [
  {
    amount: 35000,
    date: "Feb 7, 2026",
    method: "Bank Transfer",
    paymentNumber: "PAY-2026-005",
    supplier: "Makati Office Rentals Inc.",
  },
  {
    amount: 4500,
    date: "Jan 31, 2026",
    method: "Online",
    paymentNumber: "PAY-2026-006",
    supplier: "Globe Telecom",
  },
  {
    amount: 35000,
    date: "Jan 7, 2026",
    method: "Bank Transfer",
    paymentNumber: "PAY-2026-004",
    supplier: "Makati Office Rentals Inc.",
  },
];

export const agingBuckets: AgingBucketRow[] = [
  { amount: 25000, bucket: "Current" },
  { amount: 14500, bucket: "1-30 Days" },
  { amount: 0, bucket: "31-60 Days" },
  { amount: 0, bucket: "61-90 Days" },
  { amount: 0, bucket: "90+ Days" },
  { amount: 0, bucket: "No Due Date" },
  { amount: 39500, bucket: "Total" },
];

export const paymentHistory: PaymentHistoryRow[] = [
  {
    amount: 10000,
    date: "Mar 20, 2026",
    entity: "Reyes & Associates Law Firm",
    method: "Bank Transfer",
    paymentNumber: "PAY-2026-007",
    type: "AR",
  },
  {
    amount: 8000,
    date: "Feb 15, 2026",
    entity: "Dela Cruz Trading Co.",
    method: "Cash",
    paymentNumber: "PAY-2026-003",
    type: "AR",
  },
  {
    amount: 35000,
    date: "Feb 7, 2026",
    entity: "Makati Office Rentals Inc.",
    method: "Bank Transfer",
    paymentNumber: "PAY-2026-005",
    type: "AP",
  },
  {
    amount: 4500,
    date: "Jan 31, 2026",
    entity: "Globe Telecom",
    method: "Online",
    paymentNumber: "PAY-2026-006",
    type: "AP",
  },
  {
    amount: 15000,
    date: "Jan 20, 2026",
    entity: "Reyes & Associates Law Firm",
    method: "Bank Transfer",
    paymentNumber: "PAY-2026-001",
    type: "AR",
  },
  {
    amount: 25000,
    date: "Jan 18, 2026",
    entity: "Santos IT Solutions",
    method: "Bank Transfer",
    paymentNumber: "PAY-2026-002",
    type: "AR",
  },
  {
    amount: 35000,
    date: "Jan 7, 2026",
    entity: "Makati Office Rentals Inc.",
    method: "Bank Transfer",
    paymentNumber: "PAY-2026-004",
    type: "AP",
  },
];

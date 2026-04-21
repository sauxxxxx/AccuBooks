export type InvoiceStatus = "sent" | "partial" | "paid";
export type InvoiceType = "Official Invoice" | "Acknowledgment Receipt";

export type InvoiceClient = {
  address: string;
  name: string;
  tin: string;
};

export type InvoiceLineItem = {
  description: string;
  qty: number;
  unitPrice: number;
};

export type InvoiceRecord = {
  amount: number;
  amountPaid: number;
  client: string;
  clientAddress: string;
  clientTin: string;
  date: string;
  dueDate: string;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  notes: string;
  status: InvoiceStatus;
  type: InvoiceType;
};

export type InvoiceDraftLineItem = {
  description: string;
  id: string;
  qty: string;
  unitPrice: string;
};

export type InvoiceDraftLineItemInput = {
  description: string;
  qty: number;
  unitPrice: number;
};

export type NewInvoiceDraft = {
  client: string;
  clientAddress: string;
  clientTin: string;
  date: string;
  dueDate: string;
  invoiceType: InvoiceType;
  lineItems: InvoiceDraftLineItemInput[];
  notes: string;
};

export const invoiceTypeOptions: InvoiceType[] = ["Official Invoice", "Acknowledgment Receipt"];

export const invoiceClients: InvoiceClient[] = [
  {
    address: "Makati Central Business District, Makati City",
    name: "Santos IT Solutions",
    tin: "987-654-321-000",
  },
  {
    address: "Legazpi Village, Makati City",
    name: "Flores Restaurant Group",
    tin: "123-456-789-001",
  },
  {
    address: "Ortigas Center, Pasig City",
    name: "Reyes & Associates Law Firm",
    tin: "123-456-789-002",
  },
  {
    address: "Binan, Laguna",
    name: "Dela Cruz Trading Co.",
    tin: "123-456-789-003",
  },
];

export const invoiceRows: InvoiceRecord[] = [
  {
    amount: 25000,
    amountPaid: 0,
    client: "Santos IT Solutions",
    clientAddress: "Makati Central Business District, Makati City",
    clientTin: "987-654-321-000",
    date: "Apr 5, 2026",
    dueDate: "Apr 20, 2026",
    invoiceNumber: "INV-2026-006",
    lineItems: [{ description: "Monthly systems support", qty: 1, unitPrice: 25000 }],
    notes: "Official invoice for March support and maintenance.",
    status: "sent",
    type: "Official Invoice",
  },
  {
    amount: 6000,
    amountPaid: 0,
    client: "Flores Restaurant Group",
    clientAddress: "Legazpi Village, Makati City",
    clientTin: "123-456-789-001",
    date: "Mar 5, 2026",
    dueDate: "Mar 20, 2026",
    invoiceNumber: "INV-2026-004",
    lineItems: [{ description: "Monthly bookkeeping retainer", qty: 1, unitPrice: 6000 }],
    notes: "Official invoice for March bookkeeping services.",
    status: "sent",
    type: "Official Invoice",
  },
  {
    amount: 18500,
    amountPaid: 10000,
    client: "Reyes & Associates Law Firm",
    clientAddress: "Ortigas Center, Pasig City",
    clientTin: "123-456-789-002",
    date: "Mar 5, 2026",
    dueDate: "Mar 20, 2026",
    invoiceNumber: "INV-2026-005",
    lineItems: [{ description: "Legal retainer and advisory fees", qty: 1, unitPrice: 18500 }],
    notes: "Partial payment received on account.",
    status: "partial",
    type: "Official Invoice",
  },
  {
    amount: 8000,
    amountPaid: 8000,
    client: "Dela Cruz Trading Co.",
    clientAddress: "Binan, Laguna",
    clientTin: "123-456-789-003",
    date: "Feb 15, 2026",
    dueDate: "Feb 28, 2026",
    invoiceNumber: "AR-2026-001",
    lineItems: [{ description: "Cash payment received for January services", qty: 1, unitPrice: 8000 }],
    notes: "Acknowledgment receipt for January collection.",
    status: "paid",
    type: "Acknowledgment Receipt",
  },
  {
    amount: 8000,
    amountPaid: 8000,
    client: "Dela Cruz Trading Co.",
    clientAddress: "Binan, Laguna",
    clientTin: "123-456-789-003",
    date: "Feb 5, 2026",
    dueDate: "Feb 20, 2026",
    invoiceNumber: "INV-2026-003",
    lineItems: [{ description: "Monthly management services", qty: 1, unitPrice: 8000 }],
    notes: "Paid in full.",
    status: "paid",
    type: "Official Invoice",
  },
  {
    amount: 15000,
    amountPaid: 15000,
    client: "Reyes & Associates Law Firm",
    clientAddress: "Ortigas Center, Pasig City",
    clientTin: "123-456-789-002",
    date: "Jan 5, 2026",
    dueDate: "Jan 20, 2026",
    invoiceNumber: "INV-2026-001",
    lineItems: [{ description: "Monthly professional services", qty: 1, unitPrice: 15000 }],
    notes: "Paid in full.",
    status: "paid",
    type: "Official Invoice",
  },
  {
    amount: 25000,
    amountPaid: 25000,
    client: "Santos IT Solutions",
    clientAddress: "Makati Central Business District, Makati City",
    clientTin: "987-654-321-000",
    date: "Jan 5, 2026",
    dueDate: "Jan 20, 2026",
    invoiceNumber: "INV-2026-002",
    lineItems: [{ description: "Monthly systems support", qty: 1, unitPrice: 25000 }],
    notes: "Paid in full.",
    status: "paid",
    type: "Official Invoice",
  },
];

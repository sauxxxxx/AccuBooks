export type ClientStatus = "active" | "inactive";

export type ClientPayment = {
  amount: number;
  date: string;
  id: string;
};

export type ClientRecord = {
  addOns: string[];
  address: string;
  contactPerson: string;
  contractEnd: string;
  contractStart: string;
  email: string;
  id: string;
  monthlyBilling: number;
  name: string;
  notes: string;
  oneTimeFees: number;
  packageName: string;
  phone: string;
  recentPayments: ClientPayment[];
  status: ClientStatus;
  tin: string;
  totalBilled: number;
  totalPaid: number;
};

export type ClientDraft = {
  addOnServices: string;
  address: string;
  contactPerson: string;
  contractEnd: string;
  contractStart: string;
  email: string;
  monthlyBilling: string;
  name: string;
  notes: string;
  oneTimeFees: string;
  packageName: string;
  phone: string;
  status: ClientStatus;
  tin: string;
};

export const clientStatusOptions: ClientStatus[] = ["active", "inactive"];

export const clients: ClientRecord[] = [
  {
    addOns: ["BIR Filing", "Payroll"],
    address: "Binan, Laguna",
    contactPerson: "Juan Dela Cruz",
    contractEnd: "2026-12-31",
    contractStart: "2026-01-01",
    email: "juan@delacruztrading.ph",
    id: "client-1",
    monthlyBilling: 8000,
    name: "Dela Cruz Trading Co.",
    notes: "Monthly bookkeeping and tax compliance.",
    oneTimeFees: 0,
    packageName: "Bookkeeping Only",
    phone: "09171234567",
    recentPayments: [{ amount: 8000, date: "Mar 20, 2026", id: "client-1-payment-1" }],
    status: "active",
    tin: "123-456-789-000",
    totalBilled: 8000,
    totalPaid: 8000,
  },
  {
    addOns: ["Payroll"],
    address: "Legazpi Village, Makati City",
    contactPerson: "Rosa Flores",
    contractEnd: "2026-12-31",
    contractStart: "2026-01-01",
    email: "rosa@floresresto.ph",
    id: "client-2",
    monthlyBilling: 6000,
    name: "Flores Restaurant Group",
    notes: "Basic bookkeeping package for restaurant operations.",
    oneTimeFees: 0,
    packageName: "Basic Bookkeeping",
    phone: "09182345678",
    recentPayments: [{ amount: 6000, date: "Mar 5, 2026", id: "client-2-payment-1" }],
    status: "active",
    tin: "123-456-789-001",
    totalBilled: 6000,
    totalPaid: 6000,
  },
  {
    addOns: ["BIR Filing", "Inventory Review"],
    address: "Quezon City",
    contactPerson: "Ben Navarro",
    contractEnd: "2026-06-30",
    contractStart: "2025-07-01",
    email: "ben@navarrocon.ph",
    id: "client-3",
    monthlyBilling: 20000,
    name: "Navarro Construction",
    notes: "Premium accounting support for construction and project tracking.",
    oneTimeFees: 5000,
    packageName: "Full Accounting Package",
    phone: "09193456789",
    recentPayments: [],
    status: "inactive",
    tin: "123-456-789-002",
    totalBilled: 20000,
    totalPaid: 0,
  },
  {
    addOns: ["BIR Filing", "Payroll"],
    address: "Unit 5, Makati Ave., Makati City",
    contactPerson: "Atty. Maria Reyes",
    contractEnd: "2025-12-31",
    contractStart: "2025-01-01",
    email: "maria@reyeslaw.ph",
    id: "client-4",
    monthlyBilling: 15000,
    name: "Reyes & Associates Law Firm",
    notes: "Law firm retainer with payroll and compliance support.",
    oneTimeFees: 5000,
    packageName: "Full Accounting Package",
    phone: "09171234567",
    recentPayments: [
      { amount: 10000, date: "Mar 20, 2026", id: "client-4-payment-1" },
      { amount: 15000, date: "Jan 20, 2026", id: "client-4-payment-2" },
    ],
    status: "active",
    tin: "123-456-789-000",
    totalBilled: 0,
    totalPaid: 25000,
  },
  {
    addOns: ["Tax Filing"],
    address: "Makati Central Business District, Makati City",
    contactPerson: "Carlo Santos",
    contractEnd: "2026-12-31",
    contractStart: "2026-01-01",
    email: "carlo@santosit.ph",
    id: "client-5",
    monthlyBilling: 25000,
    name: "Santos IT Solutions",
    notes: "Premium support for systems consulting and bookkeeping.",
    oneTimeFees: 0,
    packageName: "Premium Package",
    phone: "09184567890",
    recentPayments: [{ amount: 25000, date: "Jan 18, 2026", id: "client-5-payment-1" }],
    status: "active",
    tin: "987-654-321-000",
    totalBilled: 25000,
    totalPaid: 25000,
  },
];

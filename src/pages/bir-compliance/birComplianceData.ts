export type BirComplianceTabKey = "vat" | "ewt" | "compensation" | "income-tax";

export type BirPeriodMode = "Monthly" | "Quarterly" | "Annual";

export const birComplianceTabs: Array<{ key: BirComplianceTabKey; label: string }> = [
  { key: "vat", label: "VAT (2550M/Q)" },
  { key: "ewt", label: "EWT (0619E/1601EQ)" },
  { key: "compensation", label: "Compensation (1601C)" },
  { key: "income-tax", label: "Income Tax (1701Q)" },
];

export const birPeriodModes: BirPeriodMode[] = ["Monthly", "Quarterly", "Annual"];

export const birMonthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const birVatBreakdown = {
  outputVatSales: 2678.57,
  inputVatPurchases: 0,
};

export const birEwtRows = [
  { category: "Professional Fees", rate: "5% / 10%", amount: 0 },
  { category: "Services", rate: "2%", amount: 0 },
  { category: "Rental", rate: "5%", amount: 0 },
] as const;

export const birCompensationTaxWithheld = 18950;

export const birIncomeTaxNote =
  "Income tax computation based on quarterly net income from financial statements. Refer to the Income Statement for detailed breakdown.";

export const birVatNote =
  "* Values are auto-computed from invoices and journal entries. You can manually override amounts.";

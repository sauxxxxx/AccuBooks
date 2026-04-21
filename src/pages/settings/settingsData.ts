export type SettingCategory =
  | "general"
  | "company_profile"
  | "bir_invoice_setup"
  | "payroll"
  | "pagibig"
  | "philhealth"
  | "sss"
  | "vat"
  | "withholding_tax";

export type SettingsTabKey = "company-bir" | "payroll-rules" | "tax-rates" | "contributions" | "all-settings";

export type SettingRecord = {
  category: SettingCategory;
  description: string;
  effectiveDate: string;
  id: string;
  key: string;
  name: string;
  value: string;
};

export type SettingDraft = {
  category: SettingCategory;
  description: string;
  effectiveDate: string;
  key: string;
  name: string;
  value: string;
};

export const settingCategoryOptions: Array<{ label: string; value: SettingCategory }> = [
  { label: "Company profile", value: "company_profile" },
  { label: "Bir invoice setup", value: "bir_invoice_setup" },
  { label: "General", value: "general" },
  { label: "Payroll", value: "payroll" },
  { label: "Pag-ibig", value: "pagibig" },
  { label: "PhilHealth", value: "philhealth" },
  { label: "Sss", value: "sss" },
  { label: "Vat", value: "vat" },
  { label: "Withholding tax", value: "withholding_tax" },
];

export const settingsTabConfig: Record<
  SettingsTabKey,
  {
    categories: SettingCategory[] | null;
    label: string;
    panelTitle: string;
    showDescription: boolean;
  }
> = {
  "company-bir": {
    categories: ["company_profile", "bir_invoice_setup"],
    label: "Company & Bir",
    panelTitle: "Company & Bir Profile",
    showDescription: true,
  },
  "payroll-rules": {
    categories: ["payroll"],
    label: "Payroll Rules",
    panelTitle: "Payroll Rule Settings",
    showDescription: true,
  },
  "all-settings": {
    categories: null,
    label: "All settings",
    panelTitle: "All settings",
    showDescription: true,
  },
  contributions: {
    categories: ["pagibig", "philhealth", "sss"],
    label: "Contributions",
    panelTitle: "Government Contribution Settings",
    showDescription: false,
  },
  "tax-rates": {
    categories: ["vat", "withholding_tax"],
    label: "Tax rates",
    panelTitle: "Tax rate settings",
    showDescription: false,
  },
};

export const settings: SettingRecord[] = [
  {
    category: "company_profile",
    description: "Company logo shown on invoices and official documents.",
    effectiveDate: "",
    id: "setting-company-logo",
    key: "company_logo_url",
    name: "Company Logo",
    value: "",
  },
  {
    category: "company_profile",
    description: "Registered business name printed on invoices and official documents.",
    effectiveDate: "",
    id: "setting-company-name",
    key: "registered_business_name",
    name: "Registered Business Name",
    value: "AccuBooks Accounting Services",
  },
  {
    category: "payroll",
    description: "Default payroll cycle used for automatic payroll runs.",
    effectiveDate: "",
    id: "setting-payroll-cycle",
    key: "payroll_cycle",
    name: "Payroll Cycle",
    value: "semi_monthly",
  },
  {
    category: "payroll",
    description: "Number of payroll periods per year for annualized tax computation.",
    effectiveDate: "",
    id: "setting-payroll-periods",
    key: "payroll_periods_per_year",
    name: "Payroll Periods Per Year",
    value: "24",
  },
  {
    category: "payroll",
    description: "Sss employee share rate applied to the monthly salary credit.",
    effectiveDate: "",
    id: "setting-sss-employee-rate",
    key: "sss_employee_rate",
    name: "Sss employee rate",
    value: "0.05",
  },
  {
    category: "payroll",
    description: "Sss employer share rate applied to the monthly salary credit.",
    effectiveDate: "",
    id: "setting-sss-employer-rate",
    key: "sss_employer_rate",
    name: "Sss employer rate",
    value: "0.10",
  },
  {
    category: "payroll",
    description: "Minimum monthly salary credit used for Sss computation.",
    effectiveDate: "",
    id: "setting-sss-min-base",
    key: "sss_min_monthly_base",
    name: "Sss minimum monthly base",
    value: "5000",
  },
  {
    category: "payroll",
    description: "Maximum monthly salary credit used for Sss computation.",
    effectiveDate: "",
    id: "setting-sss-max-base",
    key: "sss_max_monthly_base",
    name: "Sss maximum monthly base",
    value: "35000",
  },
  {
    category: "payroll",
    description: "PhilHealth employee share rate for payroll computation.",
    effectiveDate: "",
    id: "setting-philhealth-employee-rate",
    key: "philhealth_employee_rate",
    name: "PhilHealth Employee Rate",
    value: "0.025",
  },
  {
    category: "payroll",
    description: "PhilHealth employer share rate for payroll computation.",
    effectiveDate: "",
    id: "setting-philhealth-employer-rate",
    key: "philhealth_employer_rate",
    name: "PhilHealth Employer Rate",
    value: "0.025",
  },
  {
    category: "payroll",
    description: "Minimum total monthly premium used for PhilHealth computation.",
    effectiveDate: "",
    id: "setting-philhealth-min-premium",
    key: "philhealth_min_monthly_premium",
    name: "PhilHealth Minimum Monthly Premium",
    value: "500",
  },
  {
    category: "payroll",
    description: "Maximum total monthly premium used for PhilHealth computation.",
    effectiveDate: "",
    id: "setting-philhealth-max-premium",
    key: "philhealth_max_monthly_premium",
    name: "PhilHealth Maximum Monthly Premium",
    value: "5000",
  },
  {
    category: "payroll",
    description: "Pag-ibig employee share rate for payroll computation.",
    effectiveDate: "",
    id: "setting-pagibig-employee-rate",
    key: "pagibig_employee_rate",
    name: "Pag-ibig employee rate",
    value: "0.02",
  },
  {
    category: "payroll",
    description: "Pag-ibig employer share rate for payroll computation.",
    effectiveDate: "",
    id: "setting-pagibig-employer-rate",
    key: "pagibig_employer_rate",
    name: "Pag-ibig employer rate",
    value: "0.02",
  },
  {
    category: "payroll",
    description: "Monthly Pag-ibig contribution cap.",
    effectiveDate: "",
    id: "setting-pagibig-cap",
    key: "pagibig_monthly_cap",
    name: "Pag-ibig monthly cap",
    value: "200",
  },
  {
    category: "payroll",
    description: "Annualized withholding tax brackets used by payroll. Edit as structured data.",
    effectiveDate: "",
    id: "setting-payroll-tax-brackets",
    key: "payroll_withholding_brackets",
    name: "Payroll Withholding Brackets",
    value:
      '[{"label":"Not over 250000","over":0,"to":250000,"base":0,"rate":0},{"label":"Over 250000 to 400000","over":250000,"to":400000,"base":0,"rate":0.15},{"label":"Over 400000 to 800000","over":400000,"to":800000,"base":22500,"rate":0.2},{"label":"Over 800000 to 2000000","over":800000,"to":2000000,"base":102500,"rate":0.25},{"label":"Over 2000000 to 8000000","over":2000000,"to":8000000,"base":402500,"rate":0.3},{"label":"Over 8000000","over":8000000,"base":2202500,"rate":0.35}]',
  },
  {
    category: "company_profile",
    description: "Registered address shown on Bir-compliant invoices.",
    effectiveDate: "",
    id: "setting-company-address",
    key: "registered_business_address",
    name: "Registered Address",
    value: "Makati Central Business District, Makati City",
  },
  {
    category: "company_profile",
    description: "Company tin used on invoices and compliance forms.",
    effectiveDate: "",
    id: "setting-company-tin",
    key: "business_tin",
    name: "Business tin",
    value: "123-456-789-000",
  },
  {
    category: "bir_invoice_setup",
    description: "Bir registration status printed with the seller tin line.",
    effectiveDate: "",
    id: "setting-vat-status",
    key: "vat_registration_status",
    name: "Vat registration status",
    value: "Vat reg",
  },
  {
    category: "bir_invoice_setup",
    description: "Branch code printed beside the registered tin.",
    effectiveDate: "",
    id: "setting-branch-code",
    key: "branch_code",
    name: "Branch Code",
    value: "00000",
  },
  {
    category: "bir_invoice_setup",
    description: "Invoice number prefix used for Atp-aligned serials.",
    effectiveDate: "",
    id: "setting-invoice-prefix",
    key: "invoice_serial_prefix",
    name: "Invoice serial prefix",
    value: "INV-2026",
  },
  {
    category: "bir_invoice_setup",
    description: "First serial in the approved invoice range.",
    effectiveDate: "",
    id: "setting-atp-start",
    key: "atp_serial_start",
    name: "Atp serial start",
    value: "INV-2026-001",
  },
  {
    category: "bir_invoice_setup",
    description: "Last serial in the approved invoice range.",
    effectiveDate: "",
    id: "setting-atp-end",
    key: "atp_serial_end",
    name: "Atp serial end",
    value: "INV-2026-999",
  },
  {
    category: "pagibig",
    description: "Pag-ibig contribution rate for salary computation.",
    effectiveDate: "",
    id: "setting-pagibig-rate",
    key: "pagibig_rate",
    name: "Pag-ibig rate",
    value: "0.02",
  },
  {
    category: "pagibig",
    description: "Maximum monthly Pag-ibig contribution.",
    effectiveDate: "",
    id: "setting-pagibig-max",
    key: "pagibig_max",
    name: "Pag-ibig max",
    value: "200",
  },
  {
    category: "philhealth",
    description: "PhilHealth premium rate used in payroll computation.",
    effectiveDate: "",
    id: "setting-philhealth-rate",
    key: "philhealth_rate",
    name: "PhilHealth Rate",
    value: "0.05",
  },
  {
    category: "sss",
    description: "Maximum monthly Sss employee contribution.",
    effectiveDate: "",
    id: "setting-sss-max",
    key: "sss_max",
    name: "Sss max contribution",
    value: "1125",
  },
  {
    category: "vat",
    description: "Standard vat rate in the Philippines.",
    effectiveDate: "",
    id: "setting-vat-rate",
    key: "vat_rate",
    name: "Vat rate",
    value: "0.12",
  },
  {
    category: "withholding_tax",
    description: "Expanded withholding tax on professional fees for large invoices.",
    effectiveDate: "",
    id: "setting-ewt-professional",
    key: "ewt_professional",
    name: "Withholding tax - Professional fees (≥250k)",
    value: "0.10",
  },
  {
    category: "withholding_tax",
    description: "Expanded withholding tax on professional fees for smaller invoices.",
    effectiveDate: "",
    id: "setting-ewt-professional-low",
    key: "ewt_professional_low",
    name: "Withholding tax - Professional fees (<250k)",
    value: "0.05",
  },
  {
    category: "withholding_tax",
    description: "Expanded withholding tax on services.",
    effectiveDate: "",
    id: "setting-ewt-services",
    key: "ewt_services",
    name: "Withholding tax - Services",
    value: "0.02",
  },
  {
    category: "withholding_tax",
    description: "Expanded withholding tax on rental payments.",
    effectiveDate: "",
    id: "setting-ewt-rental",
    key: "ewt_rental",
    name: "Withholding tax - Rental",
    value: "0.05",
  },
];

export function getSettingsForTab(tab: SettingsTabKey) {
  const config = settingsTabConfig[tab];

  if (!config.categories) {
    return settings;
  }

  return settings.filter((setting) => config.categories?.includes(setting.category));
}

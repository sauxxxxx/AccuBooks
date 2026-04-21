import type { JournalEntry, JournalLineItem } from "../pages/journal-entries/journalEntriesData";
import type { SettingRecord } from "../pages/settings/settingsData";
import type { PayrollContributionBreakdown, PayrollEmployee, PayrollPeriodRange, PayrollRecord } from "../pages/payroll/payrollData";

type TaxBracket = {
  base: number;
  label: string;
  over: number;
  rate: number;
  to?: number;
};

export type PayrollRules = {
  cycle: "semi_monthly" | "monthly";
  periodsPerYear: number;
  pagIbig: {
    employeeRate: number;
    employerRate: number;
    monthlyCap: number;
  };
  philhealth: {
    employeeRate: number;
    employerRate: number;
    maxMonthlyPremium: number;
    minMonthlyPremium: number;
  };
  sss: {
    employeeRate: number;
    employerRate: number;
    maxMonthlyBase: number;
    minMonthlyBase: number;
  };
  withholdingBrackets: TaxBracket[];
};

export type PayrollRunResult = {
  journalEntry: JournalEntry | null;
  period: PayrollPeriodRange;
  records: PayrollRecord[];
};

const DEFAULT_WITHHOLDING_BRACKETS: TaxBracket[] = [
  { base: 0, label: "Not over 250000", over: 0, rate: 0, to: 250000 },
  { base: 0, label: "Over 250000 to 400000", over: 250000, rate: 0.15, to: 400000 },
  { base: 22500, label: "Over 400000 to 800000", over: 400000, rate: 0.2, to: 800000 },
  { base: 102500, label: "Over 800000 to 2000000", over: 800000, rate: 0.25, to: 2000000 },
  { base: 402500, label: "Over 2000000 to 8000000", over: 2000000, rate: 0.3, to: 8000000 },
  { base: 2202500, label: "Over 8000000", over: 8000000, rate: 0.35 },
];

const DEFAULT_RULES: PayrollRules = {
  cycle: "semi_monthly",
  periodsPerYear: 24,
  pagIbig: {
    employeeRate: 0.02,
    employerRate: 0.02,
    monthlyCap: 200,
  },
  philhealth: {
    employeeRate: 0.025,
    employerRate: 0.025,
    maxMonthlyPremium: 5000,
    minMonthlyPremium: 500,
  },
  sss: {
    employeeRate: 0.05,
    employerRate: 0.1,
    maxMonthlyBase: 35000,
    minMonthlyBase: 5000,
  },
  withholdingBrackets: DEFAULT_WITHHOLDING_BRACKETS,
};

const DISPLAY_DATE = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number.parseFloat((value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseSetting(settings: SettingRecord[], key: string, fallback = "") {
  return settings.find((setting) => setting.key === key)?.value ?? fallback;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatPeriodLabel(start: Date, end: Date) {
  return `${DISPLAY_DATE.format(start)} - ${DISPLAY_DATE.format(end)}`;
}

function formatPeriodKey(start: Date, end: Date) {
  return `${formatIsoDate(start)}_${formatIsoDate(end)}`;
}

function parseBracketSetting(value: string) {
  try {
    const parsed = JSON.parse(value) as Partial<TaxBracket>[];

    if (!Array.isArray(parsed)) {
      return DEFAULT_WITHHOLDING_BRACKETS;
    }

    const brackets = parsed
      .map((entry) => {
        const over = Number(entry.over);
        const base = Number(entry.base);
        const rate = Number(entry.rate);
        const to = entry.to == null ? undefined : Number(entry.to);
        const label = typeof entry.label === "string" ? entry.label : "";

        if (!Number.isFinite(over) || !Number.isFinite(base) || !Number.isFinite(rate) || !label) {
          return null;
        }

        const bracket: TaxBracket = {
          base,
          label,
          over,
          rate,
        };

        if (Number.isFinite(to)) {
          bracket.to = to;
        }

        return bracket;
      })
      .filter((entry): entry is TaxBracket => Boolean(entry));

    return brackets.length > 0 ? brackets : DEFAULT_WITHHOLDING_BRACKETS;
  } catch {
    return DEFAULT_WITHHOLDING_BRACKETS;
  }
}

function getAnnualTax(taxableIncome: number, brackets: TaxBracket[]) {
  if (taxableIncome <= 0) {
    return 0;
  }

  const sortedBrackets = [...brackets].sort((left, right) => left.over - right.over);
  const bracket =
    sortedBrackets.find((entry) => taxableIncome > entry.over && (entry.to == null || taxableIncome <= entry.to)) ??
    sortedBrackets[sortedBrackets.length - 1] ??
    DEFAULT_WITHHOLDING_BRACKETS[0];

  return roundMoney(bracket.base + (taxableIncome - bracket.over) * bracket.rate);
}

function getPeriod(referenceDate: Date, cycle: PayrollRules["cycle"]) {
  if (cycle === "monthly") {
    const start = startOfMonth(referenceDate);
    const end = endOfMonth(referenceDate);

    return {
      end,
      key: formatPeriodKey(start, end),
      label: formatPeriodLabel(start, end),
      periodsPerYear: 12,
      start,
    };
  }

  const isFirstHalf = referenceDate.getDate() <= 15;
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), isFirstHalf ? 1 : 16);
  const end = isFirstHalf ? new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 15) : endOfMonth(referenceDate);

  return {
    end,
    key: formatPeriodKey(start, end),
    label: formatPeriodLabel(start, end),
    periodsPerYear: 24,
    start,
  };
}

export function getPayrollRules(settings: SettingRecord[]): PayrollRules {
  const cycleSetting = parseSetting(settings, "payroll_cycle", DEFAULT_RULES.cycle);
  const cycle = cycleSetting.trim().toLowerCase() === "monthly" ? "monthly" : "semi_monthly";
  const periodsPerYear = parseNumber(parseSetting(settings, "payroll_periods_per_year", `${DEFAULT_RULES.periodsPerYear}`), DEFAULT_RULES.periodsPerYear);
  const sssEmployeeRate = parseNumber(parseSetting(settings, "sss_employee_rate", `${DEFAULT_RULES.sss.employeeRate}`), DEFAULT_RULES.sss.employeeRate);
  const sssEmployerRate = parseNumber(parseSetting(settings, "sss_employer_rate", `${DEFAULT_RULES.sss.employerRate}`), DEFAULT_RULES.sss.employerRate);
  const sssMinMonthlyBase = parseNumber(parseSetting(settings, "sss_min_monthly_base", `${DEFAULT_RULES.sss.minMonthlyBase}`), DEFAULT_RULES.sss.minMonthlyBase);
  const sssMaxMonthlyBase = parseNumber(parseSetting(settings, "sss_max_monthly_base", `${DEFAULT_RULES.sss.maxMonthlyBase}`), DEFAULT_RULES.sss.maxMonthlyBase);
  const philhealthEmployeeRate = parseNumber(parseSetting(settings, "philhealth_employee_rate", `${DEFAULT_RULES.philhealth.employeeRate}`), DEFAULT_RULES.philhealth.employeeRate);
  const philhealthEmployerRate = parseNumber(parseSetting(settings, "philhealth_employer_rate", `${DEFAULT_RULES.philhealth.employerRate}`), DEFAULT_RULES.philhealth.employerRate);
  const philhealthMinMonthlyPremium = parseNumber(parseSetting(settings, "philhealth_min_monthly_premium", `${DEFAULT_RULES.philhealth.minMonthlyPremium}`), DEFAULT_RULES.philhealth.minMonthlyPremium);
  const philhealthMaxMonthlyPremium = parseNumber(parseSetting(settings, "philhealth_max_monthly_premium", `${DEFAULT_RULES.philhealth.maxMonthlyPremium}`), DEFAULT_RULES.philhealth.maxMonthlyPremium);
  const pagibigEmployeeRate = parseNumber(parseSetting(settings, "pagibig_employee_rate", `${DEFAULT_RULES.pagIbig.employeeRate}`), DEFAULT_RULES.pagIbig.employeeRate);
  const pagibigEmployerRate = parseNumber(parseSetting(settings, "pagibig_employer_rate", `${DEFAULT_RULES.pagIbig.employerRate}`), DEFAULT_RULES.pagIbig.employerRate);
  const pagibigMonthlyCap = parseNumber(parseSetting(settings, "pagibig_monthly_cap", `${DEFAULT_RULES.pagIbig.monthlyCap}`), DEFAULT_RULES.pagIbig.monthlyCap);
  const withholdingBrackets = parseBracketSetting(parseSetting(settings, "payroll_withholding_brackets", JSON.stringify(DEFAULT_WITHHOLDING_BRACKETS)));

  return {
    cycle,
    periodsPerYear,
    pagIbig: {
      employeeRate: pagibigEmployeeRate,
      employerRate: pagibigEmployerRate,
      monthlyCap: pagibigMonthlyCap,
    },
    philhealth: {
      employeeRate: philhealthEmployeeRate,
      employerRate: philhealthEmployerRate,
      maxMonthlyPremium: philhealthMaxMonthlyPremium,
      minMonthlyPremium: philhealthMinMonthlyPremium,
    },
    sss: {
      employeeRate: sssEmployeeRate,
      employerRate: sssEmployerRate,
      maxMonthlyBase: sssMaxMonthlyBase,
      minMonthlyBase: sssMinMonthlyBase,
    },
    withholdingBrackets,
  };
}

export function getPayrollPeriod(referenceDate: Date, cycle: PayrollRules["cycle"]) {
  return getPeriod(referenceDate, cycle);
}

function getMonthlyEmployerShare(monthlyCompensation: number, rateA: number, rateB: number, floor: number, ceiling: number) {
  const totalRate = rateA + rateB;
  const totalPremium = clamp(monthlyCompensation * totalRate, floor, ceiling);

  if (totalPremium <= 0 || totalRate <= 0) {
    return {
      employer: 0,
      employee: 0,
      total: 0,
    };
  }

  const employeeShare = roundMoney(totalPremium * (rateA / totalRate));
  const employerShare = roundMoney(totalPremium - employeeShare);

  return {
    employer: employerShare,
    employee: employeeShare,
    total: roundMoney(totalPremium),
  };
}

function getMonthlyPagIbigShare(monthlyCompensation: number, rateA: number, rateB: number, cap: number) {
  const totalRate = rateA + rateB;
  const totalContribution = clamp(monthlyCompensation * totalRate, 0, cap);

  if (totalContribution <= 0 || totalRate <= 0) {
    return {
      employer: 0,
      employee: 0,
      total: 0,
    };
  }

  const employeeShare = roundMoney(totalContribution * (rateA / totalRate));
  const employerShare = roundMoney(totalContribution - employeeShare);

  return {
    employer: employerShare,
    employee: employeeShare,
    total: roundMoney(totalContribution),
  };
}

function buildRecord(employee: PayrollEmployee, rules: PayrollRules, period: PayrollPeriodRange, index: number): PayrollRecord {
  const monthlyCompensation = roundMoney(employee.basicSalary + (employee.allowances ?? 0));
  const periodsPerMonth = rules.periodsPerYear / 12;
  const gross = roundMoney(monthlyCompensation / periodsPerMonth);
  const sssBase = clamp(monthlyCompensation, rules.sss.minMonthlyBase, rules.sss.maxMonthlyBase);
  const sssEmployeeMonthly = roundMoney(sssBase * rules.sss.employeeRate);
  const sssEmployerMonthly = roundMoney(sssBase * rules.sss.employerRate);
  const philhealthShares = getMonthlyEmployerShare(
    monthlyCompensation,
    rules.philhealth.employeeRate,
    rules.philhealth.employerRate,
    rules.philhealth.minMonthlyPremium,
    rules.philhealth.maxMonthlyPremium,
  );
  const pagibigShares = getMonthlyPagIbigShare(
    monthlyCompensation,
    rules.pagIbig.employeeRate,
    rules.pagIbig.employerRate,
    rules.pagIbig.monthlyCap,
  );
  const monthlyTaxableIncome = Math.max(
    0,
    roundMoney(monthlyCompensation - sssEmployeeMonthly - philhealthShares.employee - pagibigShares.employee),
  );
  const annualTaxableIncome = monthlyTaxableIncome * 12;
  const annualTax = getAnnualTax(annualTaxableIncome, rules.withholdingBrackets);
  const withholdingTax = roundMoney(annualTax / rules.periodsPerYear);
  const employeeSss = roundMoney(sssEmployeeMonthly / periodsPerMonth);
  const employerSss = roundMoney(sssEmployerMonthly / periodsPerMonth);
  const employeePhilHealth = roundMoney(philhealthShares.employee / periodsPerMonth);
  const employerPhilHealth = roundMoney(philhealthShares.employer / periodsPerMonth);
  const employeePagIbig = roundMoney(pagibigShares.employee / periodsPerMonth);
  const employerPagIbig = roundMoney(pagibigShares.employer / periodsPerMonth);
  const totalEmployeeDeductions = roundMoney(employeeSss + employeePhilHealth + employeePagIbig + withholdingTax);
  const netPay = roundMoney(gross - totalEmployeeDeductions);

  const breakdown: PayrollContributionBreakdown = {
    employerContributions: roundMoney(employerSss + employerPhilHealth + employerPagIbig),
    employerPagIbig,
    employerPhilHealth,
    employerSss,
    employeePagIbig,
    employeePhilHealth,
    employeeSss,
    monthlyTaxableIncome: roundMoney(monthlyTaxableIncome),
    totalEmployeeDeductions,
    withholdingTax,
  };

  return {
    breakdown,
    deductions: totalEmployeeDeductions,
    employee: employee.name,
    employeeId: employee.id,
    gross,
    netPay,
    payDate: period.end.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    period: period.label,
    periodEnd: period.end.toISOString().slice(0, 10),
    periodKey: period.key,
    periodStart: period.start.toISOString().slice(0, 10),
    payslipNumber: `PS-${period.start.getFullYear()}${String(period.start.getMonth() + 1).padStart(2, "0")}${String(
      period.start.getDate(),
    ).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
    payrollRunId: `payroll-run-${period.key}`,
    source: "generated",
    status: "draft",
  };
}

export function generatePayrollRun(
  employees: PayrollEmployee[],
  settings: SettingRecord[],
  referenceDate: Date,
  existingRecords: PayrollRecord[] = [],
  existingJournalEntries: JournalEntry[] = [],
): PayrollRunResult {
  const rules = getPayrollRules(settings);
  const period = getPayrollPeriod(referenceDate, rules.cycle);
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const existingRunRecords = existingRecords.filter((record) => record.periodKey === period.key);

  if (existingRunRecords.length > 0) {
    return {
      journalEntry: null,
      period,
      records: [],
    };
  }

  const records = activeEmployees.map((employee, index) => buildRecord(employee, rules, period, index));
  const totalGross = roundMoney(records.reduce((sum, record) => sum + record.gross, 0));
  const totalEmployeeDeductions = roundMoney(records.reduce((sum, record) => sum + record.deductions, 0));
  const totalNetPay = roundMoney(records.reduce((sum, record) => sum + record.netPay, 0));
  const totalEmployerContributions = roundMoney(
    records.reduce((sum, record) => sum + (record.breakdown?.employerContributions ?? 0), 0),
  );
  const totalWithholding = roundMoney(records.reduce((sum, record) => sum + (record.breakdown?.withholdingTax ?? 0), 0));
  const totalSss = roundMoney(
    records.reduce((sum, record) => sum + (record.breakdown?.employeeSss ?? 0) + (record.breakdown?.employerSss ?? 0), 0),
  );
  const totalPhilHealth = roundMoney(
    records.reduce(
      (sum, record) =>
        sum + (record.breakdown?.employeePhilHealth ?? 0) + (record.breakdown?.employerPhilHealth ?? 0),
      0,
    ),
  );
  const totalPagIbig = roundMoney(
    records.reduce((sum, record) => sum + (record.breakdown?.employeePagIbig ?? 0) + (record.breakdown?.employerPagIbig ?? 0), 0),
  );

  const journalLineItems: JournalLineItem[] = [
    { account: "5000 - Salaries & Wages", credit: 0, debit: totalGross, id: `payroll-${period.key}-1` },
    { account: "5010 - Employee Benefits", credit: 0, debit: totalEmployerContributions, id: `payroll-${period.key}-2` },
    { account: "2100 - Accrued Expenses", credit: totalNetPay, debit: 0, id: `payroll-${period.key}-3` },
    { account: "2230 - Withholding Tax Payable", credit: totalWithholding, debit: 0, id: `payroll-${period.key}-4` },
    { account: "2400 - SSS Payable", credit: totalSss, debit: 0, id: `payroll-${period.key}-5` },
    { account: "2410 - PhilHealth Payable", credit: totalPhilHealth, debit: 0, id: `payroll-${period.key}-6` },
    { account: "2420 - Pag-IBIG Payable", credit: totalPagIbig, debit: 0, id: `payroll-${period.key}-7` },
  ].filter((lineItem) => lineItem.credit > 0 || lineItem.debit > 0);

  const highestEntryNumber = existingJournalEntries.reduce((highest, entry) => {
    const suffix = Number.parseInt(entry.entryNumber.split("-").pop() ?? "0", 10);
    return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
  }, 0);
  const entryNumber = `JE-${referenceDate.getFullYear()}-${String(highestEntryNumber + 1).padStart(3, "0")}`;

  const journalEntry: JournalEntry = {
    credit: roundMoney(totalNetPay + totalWithholding + totalSss + totalPhilHealth + totalPagIbig),
    date: period.end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    debit: roundMoney(totalGross + totalEmployerContributions),
    description: `Payroll run - ${period.label}`,
    entryNumber,
    lineItems: journalLineItems,
    journal: "General",
    reference: period.key,
    status: "posted",
  };

  return {
    journalEntry,
    period,
    records,
  };
}

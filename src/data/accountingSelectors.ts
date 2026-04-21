import {
  cashFlowByPeriod as fallbackCashFlowByPeriod,
  expenseSlices as fallbackExpenseSlices,
  recentTransactions as fallbackRecentTransactions,
  summaryMetrics as fallbackSummaryMetrics,
  type CashFlowPoint,
  type DashboardTab,
  type ExpenseSlice,
  type SummaryMetric,
  type Transaction,
} from "../pages/dashboard/dashboardData";
import {
  balanceSheetSections as balanceSheetTemplate,
  balanceSheetSummary as fallbackBalanceSheetSummary,
  cashFlowNetCashFlow as fallbackCashFlowNetCashFlow,
  cashFlowOperatingRows as cashFlowOperatingRowsTemplate,
  cashFlowOperationsRows as cashFlowOperationsRowsTemplate,
  incomeStatementNetIncome as fallbackIncomeStatementNetIncome,
  incomeStatementSections as incomeStatementTemplate,
  trialBalanceRows as trialBalanceTemplate,
  trialBalanceTotals as fallbackTrialBalanceTotals,
  type BalanceSheetSummary,
  type StatementRow,
  type StatementSection,
  type TrialBalanceRow,
} from "../pages/financial-statements/financialStatementsData";
import type { JournalEntry, JournalLineItem } from "../pages/journal-entries/journalEntriesData";
import type { InvoiceRecord } from "../pages/invoicing/invoicingData";
import type { PaymentHistoryRow } from "../pages/ar-ap/arApData";
import type { PayrollState } from "./payrollStore";
import type { SettingRecord } from "../pages/settings/settingsData";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

const expenseSliceCatalog = [
  { aliases: ["salaries & wages", "salaries and wages"], color: fallbackExpenseSlices[0]?.color ?? "#4ea974", label: "Salaries & Wages" },
  { aliases: ["utilities expense", "utilities", "electricity", "internet and communications"], color: fallbackExpenseSlices[1]?.color ?? "#f59e0b", label: "Utilities Expense" },
  { aliases: ["marketing & advertising", "marketing and advertising", "marketing", "advertising"], color: fallbackExpenseSlices[2]?.color ?? "#a855f7", label: "Marketing & Advertising" },
  { aliases: ["transportation expense", "transportation", "travel expense", "travel"], color: fallbackExpenseSlices[3]?.color ?? "#ec4899", label: "Transportation Expense" },
  { aliases: ["office supplies", "office supplies expense"], color: fallbackExpenseSlices[4]?.color ?? "#84cc16", label: "Office Supplies" },
  { aliases: ["rent expense", "rental", "rent and occupancy"], color: fallbackExpenseSlices[5]?.color ?? "#445947", label: "Rent Expense" },
] as const;

const revenueAliases = [
  ["service revenue"],
  ["sales revenue"],
  ["interest income"],
  ["other income"],
] as const;

const expenseAliases = [
  ["salaries & wages", "salaries and wages"],
  ["employee benefits"],
  ["rent expense", "rental", "rent and occupancy"],
  ["utilities expense", "utilities", "electricity", "internet and communications"],
  ["office supplies", "office supplies expense"],
  ["professional fees"],
  ["depreciation expense", "accumulated depreciation"],
  ["transportation expense", "transportation", "travel expense", "travel"],
  ["marketing & advertising", "marketing and advertising", "marketing", "advertising"],
  ["insurance expense", "insurance", "taxes and licenses"],
  ["miscellaneous expense", "miscellaneous"],
  ["freight and handling"],
] as const;

const cashAndBankAliases = ["cash on hand", "cash in bank", "bank"];
const receivableAliases = ["trade receivables", "accounts receivable", "receivables"];
const inventoryAliases = ["inventory"];
const fixedAssetAliases = ["office equipment", "computer equipment", "accumulated depreciation", "depreciation"];
const accountsPayableAliases = ["accounts payable", "trade payables", "supplier deposits"];
const accruedExpenseAliases = ["accrued expenses"];
const vatPayableAliases = ["vat payable"];
const withholdingTaxAliases = ["withholding tax payable"];
const sssAliases = ["sss payable"];
const philhealthAliases = ["philhealth payable"];
const pagibigAliases = ["pag-ibig payable"];
const ownerCapitalAliases = ["owner's capital", "retained earnings"];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenize(value: string) {
  return normalize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function extractRelevantTokens(value: string) {
  return tokenize(value).filter((token) => token.length > 2 && !/^\d+$/.test(token));
}

function matchesAlias(accountText: string, alias: string) {
  const normalizedAccount = normalize(accountText);
  const normalizedAlias = normalize(alias);

  if (!normalizedAccount || !normalizedAlias) {
    return false;
  }

  if (normalizedAccount.includes(normalizedAlias) || normalizedAlias.includes(normalizedAccount)) {
    return true;
  }

  const accountTokens = new Set(extractRelevantTokens(accountText));
  const aliasTokens = new Set(extractRelevantTokens(alias));

  if (!accountTokens.size || !aliasTokens.size) {
    return false;
  }

  let overlap = 0;
  aliasTokens.forEach((token) => {
    if (accountTokens.has(token)) {
      overlap += 1;
    }
  });

  const threshold = Math.min(accountTokens.size, aliasTokens.size) <= 2 ? 1 : 2;
  return overlap >= threshold;
}

function matchesAnyAlias(accountText: string, aliases: readonly string[]) {
  return aliases.some((alias) => matchesAlias(accountText, alias));
}

function parseLooseDate(value: string) {
  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getLineItemNet(lineItem: JournalLineItem, aliases: readonly string[]) {
  if (!matchesAnyAlias(lineItem.account, aliases)) {
    return 0;
  }

  return lineItem.debit - lineItem.credit;
}

function sumNetByAliases(entries: JournalEntry[], aliases: readonly string[]) {
  return entries.reduce((total, entry) => {
    return (
      total +
      (entry.lineItems?.reduce((entryTotal, lineItem) => entryTotal + getLineItemNet(lineItem, aliases), 0) ?? 0)
    );
  }, 0);
}

function sumSignedByAliases(entries: JournalEntry[], aliases: readonly string[], direction: "debit" | "credit") {
  return entries.reduce((total, entry) => {
    return (
      total +
      (entry.lineItems?.reduce((entryTotal, lineItem) => {
        if (!matchesAnyAlias(lineItem.account, aliases)) {
          return entryTotal;
        }

        return entryTotal + (direction === "debit" ? lineItem.debit : lineItem.credit);
      }, 0) ?? 0)
    );
  }, 0);
}

function signValue(value: number, mode: "debit" | "credit") {
  return mode === "debit" ? value : -value;
}

function formatTrialAmount(netAmount: number) {
  return netAmount >= 0
    ? { credit: "", debit: formatCurrency(netAmount) }
    : { credit: formatCurrency(Math.abs(netAmount)), debit: "" };
}

function sumEntryAmount(entry: JournalEntry) {
  return entry.lineItems?.reduce((sum, lineItem) => sum + lineItem.debit + lineItem.credit, 0) ?? entry.debit + entry.credit;
}

function mapTemplateSection(
  section: StatementSection,
  resolver: (label: string) => number,
): StatementSection {
  const rows = section.rows.map((row) => ({
    ...row,
    amount: resolver(row.label),
  }));

  return {
    ...section,
    rows,
    totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
  };
}

const balanceSheetRowRules: Record<string, { aliases: readonly string[]; mode: "debit" | "credit" }> = {
  "1000 - Cash": { aliases: cashAndBankAliases, mode: "debit" },
  "1010 - Cash in Bank": { aliases: ["cash in bank", "bank - bpi", "bank - bdo"], mode: "debit" },
  "1100 - Accounts Receivable": { aliases: receivableAliases, mode: "debit" },
  "1200 - Prepaid Expenses": { aliases: ["prepaid expenses"], mode: "debit" },
  "1300 - Inventory": { aliases: inventoryAliases, mode: "debit" },
  "1500 - Office Equipment": { aliases: ["office equipment"], mode: "debit" },
  "1510 - Accumulated Depreciation - Equipment": { aliases: ["accumulated depreciation"], mode: "credit" },
  "1600 - Computer Equipment": { aliases: ["computer equipment"], mode: "debit" },
  "2000 - Accounts Payable": { aliases: accountsPayableAliases, mode: "credit" },
  "2100 - Accrued Expenses": { aliases: accruedExpenseAliases, mode: "credit" },
  "2200 - VAT Payable": { aliases: vatPayableAliases, mode: "credit" },
  "2300 - Withholding Tax Payable": { aliases: withholdingTaxAliases, mode: "credit" },
  "2400 - SSS Payable": { aliases: sssAliases, mode: "credit" },
  "2410 - PhilHealth Payable": { aliases: philhealthAliases, mode: "credit" },
  "2420 - Pag-IBIG Payable": { aliases: pagibigAliases, mode: "credit" },
  "3000 - Owner's Capital": { aliases: ownerCapitalAliases, mode: "credit" },
  "3100 - Retained Earnings": { aliases: ["retained earnings"], mode: "credit" },
  "4000 - Service Revenue": { aliases: revenueAliases[0], mode: "credit" },
  "4010 - Sales Revenue": { aliases: revenueAliases[1], mode: "credit" },
  "4100 - Interest Income": { aliases: revenueAliases[2], mode: "credit" },
  "4200 - Other Income": { aliases: revenueAliases[3], mode: "credit" },
  "5000 - Salaries & Wages": { aliases: expenseAliases[0], mode: "debit" },
  "5010 - Employee Benefits": { aliases: expenseAliases[1], mode: "debit" },
  "5100 - Rent Expense": { aliases: expenseAliases[2], mode: "debit" },
  "5200 - Utilities Expense": { aliases: expenseAliases[3], mode: "debit" },
  "5300 - Office Supplies": { aliases: expenseAliases[4], mode: "debit" },
  "5400 - Professional Fees": { aliases: expenseAliases[5], mode: "debit" },
  "5500 - Depreciation Expense": { aliases: expenseAliases[6], mode: "debit" },
  "5600 - Transportation Expense": { aliases: expenseAliases[7], mode: "debit" },
  "5700 - Marketing & Advertising": { aliases: expenseAliases[8], mode: "debit" },
  "5800 - Insurance Expense": { aliases: expenseAliases[9], mode: "debit" },
  "5900 - Miscellaneous Expense": { aliases: expenseAliases[10], mode: "debit" },
};

const trialBalanceRowRules: Record<string, readonly string[]> = {
  "1010 - Cash in Bank": ["cash in bank", "bank - bpi", "bank - bdo"],
  "2300 - Withholding Tax Payable": withholdingTaxAliases,
  "2400 - SSS Payable": sssAliases,
  "2410 - PhilHealth Payable": philhealthAliases,
  "2420 - Pag-IBIG Payable": pagibigAliases,
  "4000 - Service Revenue": revenueAliases[0],
  "5000 - Salaries & Wages": expenseAliases[0],
  "5100 - Rent Expense": expenseAliases[2],
  "5200 - Utilities Expense": expenseAliases[3],
  "5300 - Office Supplies": expenseAliases[4],
  "5600 - Transportation Expense": expenseAliases[7],
  "5700 - Marketing & Advertising": expenseAliases[8],
};

const cashFlowOperationRules: Record<string, readonly string[]> = {
  "Change in Accounts Receivable": receivableAliases,
  "Change in Accounts Payable": accountsPayableAliases,
  "Change in VAT Payable": vatPayableAliases,
  "Change in Withholding Tax Payable": withholdingTaxAliases,
  "Change in SSS Payable": sssAliases,
  "Change in PhilHealth Payable": philhealthAliases,
  "Change in Pag-IBIG Payable": pagibigAliases,
};

function getNetAmount(entries: JournalEntry[], aliases: readonly string[]) {
  return sumNetByAliases(entries, aliases);
}

function getStatementAmount(entries: JournalEntry[], label: string) {
  const rule = balanceSheetRowRules[label] ?? trialBalanceRowRules[label] ?? null;

  if (!rule) {
    return 0;
  }

  const net = getNetAmount(entries, rule.aliases);
  const rowRule = balanceSheetRowRules[label];

  if (!rowRule) {
    return net;
  }

  return signValue(net, rowRule.mode);
}

function getIncomeStatementAmount(entries: JournalEntry[], label: string) {
  const rule = balanceSheetRowRules[label];

  if (!rule) {
    return 0;
  }

  const net = getNetAmount(entries, rule.aliases);
  return rule.mode === "credit" ? -net : net;
}

function getExpenseSliceTotals(entries: JournalEntry[]) {
  return expenseSliceCatalog.map((slice) => ({
    ...slice,
    amount: entries.reduce((total, entry) => {
      const entryAmount =
        entry.lineItems?.reduce((sum, lineItem) => {
          if (!matchesAnyAlias(lineItem.account, slice.aliases)) {
            return sum;
          }

          return sum + lineItem.debit;
        }, 0) ?? 0;

      return total + entryAmount;
    }, 0),
  }));
}

function getExpenseSlices(entries: JournalEntry[], allowFallback = true): ExpenseSlice[] {
  const totals = getExpenseSliceTotals(entries);
  const totalAmount = totals.reduce((sum, slice) => sum + slice.amount, 0);

  if (totalAmount <= 0) {
    if (!allowFallback) {
      return [];
    }

    return fallbackExpenseSlices.map((slice) => ({ ...slice }));
  }

  let remaining = 100;

  return totals.map((slice, index) => {
    if (index === totals.length - 1) {
      return {
        color: slice.color,
        label: slice.label,
        value: Math.max(0, remaining),
      };
    }

    const percent = Math.round((slice.amount / totalAmount) * 100);
    remaining -= percent;

    return {
      color: slice.color,
      label: slice.label,
      value: Math.max(0, percent),
    };
  });
}

function getIncomeExpenses(entries: JournalEntry[]) {
  let income = 0;
  let expenses = 0;

  entries.forEach((entry) => {
    entry.lineItems?.forEach((lineItem) => {
      if (revenueAliases.some((aliases) => matchesAnyAlias(lineItem.account, aliases))) {
        income += lineItem.credit;
      }

      if (expenseAliases.some((aliases) => matchesAnyAlias(lineItem.account, aliases))) {
        expenses += lineItem.debit;
      }
    });
  });

  return { expenses, income };
}

function getWeekOfYear(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function buildCashFlowBuckets(entries: JournalEntry[], period: DashboardTab, allowFallback = true): CashFlowPoint[] {
  if (!entries.length) {
    if (!allowFallback) {
      return [];
    }

    return fallbackCashFlowByPeriod[period].map((point) => ({ ...point }));
  }

  const pointsByBucket = new Map<string, { expenses: number; income: number; label: string }>();

  const recordPoint = (bucketKey: string, label: string, income: number, expenses: number) => {
    const current = pointsByBucket.get(bucketKey) ?? { expenses: 0, income: 0, label };
    current.income += income / 1000;
    current.expenses += expenses / 1000;
    pointsByBucket.set(bucketKey, current);
  };

  const sortedEntries = [...entries].sort((left, right) => {
    const leftDate = parseLooseDate(left.date)?.getTime() ?? 0;
    const rightDate = parseLooseDate(right.date)?.getTime() ?? 0;
    return leftDate - rightDate;
  });

  const classifyEntry = (entry: JournalEntry) => {
    let income = 0;
    let expenses = 0;

    entry.lineItems?.forEach((lineItem) => {
      if (revenueAliases.some((aliases) => matchesAnyAlias(lineItem.account, aliases))) {
        income += lineItem.credit;
      }

      if (expenseAliases.some((aliases) => matchesAnyAlias(lineItem.account, aliases))) {
        expenses += lineItem.debit;
      }
    });

    return { expenses, income };
  };

  if (period === "Daily") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    labels.forEach((label) => pointsByBucket.set(label, { expenses: 0, income: 0, label }));

    sortedEntries.forEach((entry) => {
      const parsed = parseLooseDate(entry.date);

      if (!parsed) {
        return;
      }

      const bucketIndex = (parsed.getDay() + 6) % 7;
      const label = labels[bucketIndex];
      const bucket = classifyEntry(entry);
      recordPoint(label, label, bucket.income, bucket.expenses);
    });

    return labels.map((label) => {
      const bucket = pointsByBucket.get(label) ?? { expenses: 0, income: 0, label };
      return { expenses: bucket.expenses, income: bucket.income, label: bucket.label };
    });
  }

  if (period === "Weekly") {
    const weekMap = new Map<string, { expenses: number; income: number; label: string }>();

    sortedEntries.forEach((entry) => {
      const parsed = parseLooseDate(entry.date);

      if (!parsed) {
        return;
      }

      const bucketKey = `${parsed.getFullYear()}-${getWeekOfYear(parsed)}`;
      const label = `W${getWeekOfYear(parsed)}`;
      const bucket = classifyEntry(entry);
      recordPoint(bucketKey, label, bucket.income, bucket.expenses);
      weekMap.set(bucketKey, pointsByBucket.get(bucketKey) ?? { expenses: 0, income: 0, label });
    });

    const sortedBuckets = [...pointsByBucket.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .slice(-12)
      .map(([, bucket]) => bucket);

    return sortedBuckets.length > 0 ? sortedBuckets.map((bucket) => ({ ...bucket })) : fallbackCashFlowByPeriod[period].map((point) => ({ ...point }));
  }

  if (period === "Monthly") {
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthLabels.forEach((label) => pointsByBucket.set(label, { expenses: 0, income: 0, label }));

    sortedEntries.forEach((entry) => {
      const parsed = parseLooseDate(entry.date);

      if (!parsed) {
        return;
      }

      const label = monthLabels[parsed.getMonth()];
      const bucket = classifyEntry(entry);
      recordPoint(label, label, bucket.income, bucket.expenses);
    });

    return monthLabels.map((label) => {
      const bucket = pointsByBucket.get(label) ?? { expenses: 0, income: 0, label };
      return { expenses: bucket.expenses, income: bucket.income, label: bucket.label };
    });
  }

  const latestYear = sortedEntries.reduce((highest, entry) => {
    const parsed = parseLooseDate(entry.date);
    return parsed ? Math.max(highest, parsed.getFullYear()) : highest;
  }, new Date().getFullYear());
  const yearLabels = Array.from({ length: 5 }, (_, index) => `${latestYear - 4 + index}`);
  yearLabels.forEach((label) => pointsByBucket.set(label, { expenses: 0, income: 0, label }));

  sortedEntries.forEach((entry) => {
    const parsed = parseLooseDate(entry.date);

    if (!parsed) {
      return;
    }

    const label = `${parsed.getFullYear()}`;
    const bucket = classifyEntry(entry);
    recordPoint(label, label, bucket.income, bucket.expenses);
  });

  return yearLabels.map((label) => {
    const bucket = pointsByBucket.get(label) ?? { expenses: 0, income: 0, label };
    return { expenses: bucket.expenses, income: bucket.income, label: bucket.label };
  });
}

function getDashboardSummaryMetrics(entries: JournalEntry[], invoices: InvoiceRecord[]): SummaryMetric[] {
  const { income, expenses } = getIncomeExpenses(entries);
  const overdueCount = invoices.filter((invoice) => {
    if (invoice.status === "paid") {
      return false;
    }

    const dueDate = parseLooseDate(invoice.dueDate);

    return dueDate ? dueDate.getTime() < new Date().setHours(0, 0, 0, 0) : false;
  }).length;

  const derived = [
    { ...fallbackSummaryMetrics[0], value: formatCurrency(income) },
    { ...fallbackSummaryMetrics[1], value: formatCurrency(expenses) },
    { ...fallbackSummaryMetrics[2], value: formatCurrency(income - expenses) },
    { ...fallbackSummaryMetrics[3], value: `${overdueCount}` },
  ];

  return derived;
}

function getDashboardRecentTransactions(entries: JournalEntry[], allowFallback = true): Transaction[] {
  const sorted = [...entries].sort((left, right) => {
    const leftDate = parseLooseDate(left.date)?.getTime() ?? 0;
    const rightDate = parseLooseDate(right.date)?.getTime() ?? 0;
    return rightDate - leftDate;
  });

  if (!sorted.length) {
    if (!allowFallback) {
      return [];
    }

    return fallbackRecentTransactions.map((transaction) => ({ ...transaction }));
  }

  return sorted.slice(0, 8).map((entry) => ({
    amount: formatCurrency(Math.max(entry.credit, entry.debit)),
    date: entry.date,
    description: entry.description,
    status: entry.status,
    type: entry.journal.toLowerCase(),
  }));
}

function computeSectionAmounts<T extends { label: string; depth?: number }>(
  rows: T[],
  entries: JournalEntry[],
  rules: Record<string, { aliases: readonly string[]; mode: "debit" | "credit" }>,
) {
  return rows.map((row) => {
    const rule = rules[row.label];

    if (!rule) {
      return { ...row, amount: 0 };
    }

    const net = getNetAmount(entries, rule.aliases);
    const amount = rule.mode === "debit" ? net : -net;

    return {
      ...row,
      amount,
    };
  });
}

function buildStatementSections(entries: JournalEntry[]) {
  const balanceSheetSections: StatementSection[] = balanceSheetTemplate.map((section) =>
    mapTemplateSection(section, (label) => {
      const rule = balanceSheetRowRules[label];

      if (!rule) {
        return 0;
      }

      const net = getNetAmount(entries, rule.aliases);
      return rule.mode === "debit" ? net : -net;
    }),
  );

  const balanceSheetSummary: BalanceSheetSummary = {
    assets: balanceSheetSections.find((section) => section.title === "Assets")?.totalAmount ?? 0,
    liabilities: balanceSheetSections.find((section) => section.title === "Liabilities")?.totalAmount ?? 0,
    equity: balanceSheetSections.find((section) => section.title === "Equity")?.totalAmount ?? 0,
  };

  const incomeStatementSections: StatementSection[] = incomeStatementTemplate.map((section) =>
    mapTemplateSection(section, (label) => {
      const rule = balanceSheetRowRules[label];

      if (!rule) {
        return 0;
      }

      const net = getNetAmount(entries, rule.aliases);
      return rule.mode === "credit" ? -net : net;
    }),
  );

  const incomeStatementNetIncome =
    (incomeStatementSections.find((section) => section.title === "Revenues")?.totalAmount ?? 0) -
    (incomeStatementSections.find((section) => section.title === "Expenses")?.totalAmount ?? 0);

  const trialBalanceRows: TrialBalanceRow[] = trialBalanceTemplate.map((row) => {
    const aliases = trialBalanceRowRules[row.account] ?? [row.account];
    const net = getNetAmount(entries, aliases);
    const debit = net >= 0 ? net : 0;
    const credit = net < 0 ? Math.abs(net) : 0;

    return {
      account: row.account,
      credit,
      debit,
    };
  });

  const trialBalanceTotals = {
    credit: trialBalanceRows.reduce((sum, row) => sum + row.credit, 0),
    debit: trialBalanceRows.reduce((sum, row) => sum + row.debit, 0),
  };

  const netIncome = incomeStatementNetIncome;
  const cashFlowOperatingRows: StatementRow[] = cashFlowOperatingRowsTemplate.map((row) => ({
    ...row,
    amount: row.label === "Net Income" ? netIncome : row.amount,
  }));
  const cashFlowOperationsRows: StatementRow[] = cashFlowOperationsRowsTemplate.map((row) => {
    const aliases = cashFlowOperationRules[row.label];

    if (!aliases) {
      return { ...row, amount: 0 };
    }

    const net = getNetAmount(entries, aliases);
    return {
      ...row,
      amount: -net,
    };
  });
  const cashFlowNetCashFlow =
    netIncome + cashFlowOperationsRows.reduce((sum, row) => sum + row.amount, 0);

  return {
    balanceSheetSections,
    balanceSheetSummary,
    cashFlowNetCashFlow,
    cashFlowOperatingRows,
    cashFlowOperationsRows,
    incomeStatementNetIncome,
    incomeStatementSections,
    trialBalanceRows,
    trialBalanceTotals,
  };
}

function getVatRate(settings: SettingRecord[]) {
  const setting = settings.find((entry) => entry.key === "vat_rate");
  const parsed = Number.parseFloat(setting?.value ?? "");

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.12;
}

function getEwtRate(settings: SettingRecord[], key: string, fallback: number) {
  const setting = settings.find((entry) => entry.key === key);
  const parsed = Number.parseFloat(setting?.value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getPayrollCompensationTotal(payroll: PayrollState) {
  return payroll.records.reduce((sum, record) => sum + (record.breakdown?.withholdingTax ?? record.deductions), 0);
}

export function buildDashboardSummaryMetrics(entries: JournalEntry[], invoices: InvoiceRecord[]) {
  return getDashboardSummaryMetrics(entries, invoices);
}

export function buildDashboardRecentTransactions(entries: JournalEntry[], options?: { allowFallback?: boolean }) {
  return getDashboardRecentTransactions(entries, options?.allowFallback !== false);
}

export function buildCashFlowSeries(entries: JournalEntry[], period: DashboardTab, options?: { allowFallback?: boolean }) {
  return buildCashFlowBuckets(entries, period, options?.allowFallback !== false);
}

export function buildExpenseSlices(entries: JournalEntry[], options?: { allowFallback?: boolean }) {
  return getExpenseSlices(entries, options?.allowFallback !== false);
}

export function buildFinancialStatementData(entries: JournalEntry[]) {
  return buildStatementSections(entries);
}

export function buildBirComplianceData(options: {
  entries: JournalEntry[];
  invoices: InvoiceRecord[];
  payroll: PayrollState;
  settings: SettingRecord[];
}) {
  const { entries, invoices, payroll, settings } = options;
  const vatRate = getVatRate(settings);
  const incomeStatement = buildStatementSections(entries);
  const outputVatSales = invoices
    .filter((invoice) => invoice.type === "Official Invoice")
    .reduce((sum, invoice) => {
      const vatBase = invoice.amount / (1 + vatRate);
      return sum + (invoice.amount - vatBase);
    }, 0);

  const inputVatPurchases = entries.reduce((sum, entry) => {
    return (
      sum +
      (entry.lineItems?.reduce((entryTotal, lineItem) => {
        if (!matchesAnyAlias(lineItem.account, ["input vat", "input vat purchases"])) {
          return entryTotal;
        }

        return entryTotal + lineItem.debit;
      }, 0) ?? 0)
    );
  }, 0);

  const ewtRows = [
    {
      amount: entries.reduce((sum, entry) => sum + getNetAmount([entry], ["professional fees"]), 0) * getEwtRate(settings, "ewt_professional", 0.1),
      category: "Professional Fees",
      rate: `${Math.round(getEwtRate(settings, "ewt_professional", 0.1) * 100)}%`,
    },
    {
      amount: entries.reduce((sum, entry) => sum + getNetAmount([entry], ["services"]), 0) * getEwtRate(settings, "ewt_services", 0.02),
      category: "Services",
      rate: `${Math.round(getEwtRate(settings, "ewt_services", 0.02) * 100)}%`,
    },
    {
      amount: entries.reduce((sum, entry) => sum + getNetAmount([entry], ["rental", "rent expense"]), 0) * getEwtRate(settings, "ewt_rental", 0.05),
      category: "Rental",
      rate: `${Math.round(getEwtRate(settings, "ewt_rental", 0.05) * 100)}%`,
    },
  ].map((row) => ({
    ...row,
    amount: Math.max(0, row.amount),
  }));

  const compensationTaxWithheld = getPayrollCompensationTotal(payroll);
  const incomeTaxNote = `Income tax computation based on quarterly net income of ${formatCurrency(incomeStatement.incomeStatementNetIncome)} from financial statements.`;

  return {
    compensationTaxWithheld,
    ewtRows,
    incomeTaxNote,
    inputVatPurchases,
    outputVatSales,
    vatNote: "* Values are auto-computed from invoices, journal entries, and settings. You can manually override amounts.",
  };
}

export function buildPaymentHistoryRowNumber(existing: PaymentHistoryRow[]) {
  return existing.reduce((highest, row) => {
    const entryParts = row.paymentNumber.split("-");
    const suffix = Number.parseInt(entryParts[entryParts.length - 1] ?? "0", 10);
    return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
  }, 0) + 1;
}

export function buildInvoiceSeriesFallback(period: DashboardTab) {
  return fallbackCashFlowByPeriod[period].map((point) => ({ ...point }));
}

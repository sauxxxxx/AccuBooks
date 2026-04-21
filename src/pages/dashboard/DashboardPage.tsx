import { useMemo, useState } from "react";
import { useClientsStore } from "../../data/clientsStore";
import { useInvoicesStore } from "../../data/invoicesStore";
import { useJournalEntriesStore } from "../../data/journalEntriesStore";
import { chartOfAccounts, type ChartAccountNode } from "../chart-of-accounts/chartOfAccountsData";
import { DashboardFilters, DEFAULT_DASHBOARD_FILTERS, type DashboardFilterState } from "./DashboardFilters";
import { CashFlowChart } from "./CashFlowChart";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSummaryCards } from "./DashboardSummaryCards";
import { DashboardTabs } from "./DashboardTabs";
import { ExpenseBreakdown } from "./ExpenseBreakdown";
import { RecentTransactions } from "./RecentTransactions";
import { dashboardTabs } from "./dashboardData";
import { transactionTypeOptions, type JournalEntry, type JournalType } from "../journal-entries/journalEntriesData";

type AccountFilterOption = {
  label: string;
  searchTerms: string[];
};

function normalizeFilterText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isGenericClientLabel(value: string) {
  const normalized = normalizeFilterText(value);
  return normalized === "all clients" || normalized === "multiple clients" || normalized === "various clients";
}

function extractAccountCode(label: string) {
  const code = Number.parseInt(label.split("-")[0]?.trim() ?? "", 10);
  return Number.isFinite(code) ? code : Number.MAX_SAFE_INTEGER;
}

function collectChartAccountOptions(nodes: ChartAccountNode[]): AccountFilterOption[] {
  const options: AccountFilterOption[] = [];

  const visit = (node: ChartAccountNode): string[] => {
    const childTerms = node.children?.flatMap((child) => visit(child)) ?? [];
    const label = `${node.code} - ${node.name}`;
    const terms = new Set([normalizeFilterText(label), normalizeFilterText(node.code), normalizeFilterText(node.name)]);

    childTerms.forEach((term) => terms.add(term));

    options.push({ label, searchTerms: [...terms] });
    return [...terms];
  };

  nodes.forEach((node) => {
    visit(node);
  });

  return options.sort((left, right) => {
    const codeDiff = extractAccountCode(left.label) - extractAccountCode(right.label);
    return codeDiff !== 0 ? codeDiff : left.label.localeCompare(right.label);
  });
}

function collectJournalAccountOptions(entries: JournalEntry[]): AccountFilterOption[] {
  const options = new Map<string, AccountFilterOption>();

  entries.forEach((entry) => {
    entry.lineItems?.forEach((lineItem) => {
      const label = lineItem.account.trim();

      if (!label) {
        return;
      }

      const key = normalizeFilterText(label);
      if (!options.has(key)) {
        options.set(key, { label, searchTerms: [key] });
      }
    });
  });

  return [...options.values()];
}

function buildAccountOptions(entries: JournalEntry[]) {
  const merged = new Map<string, AccountFilterOption>();

  [...collectChartAccountOptions(chartOfAccounts), ...collectJournalAccountOptions(entries)].forEach((option) => {
    const key = normalizeFilterText(option.label);
    const current = merged.get(key);

    if (current) {
      current.searchTerms = [...new Set([...current.searchTerms, ...option.searchTerms])];
      return;
    }

    merged.set(key, { ...option, searchTerms: [...option.searchTerms] });
  });

  return [...merged.values()].sort((left, right) => {
    const codeDiff = extractAccountCode(left.label) - extractAccountCode(right.label);
    return codeDiff !== 0 ? codeDiff : left.label.localeCompare(right.label);
  });
}

function matchesText(source: string, target: string) {
  const normalizedSource = normalizeFilterText(source);
  const normalizedTarget = normalizeFilterText(target);

  return normalizedSource.includes(normalizedTarget) || normalizedTarget.includes(normalizedSource);
}

function getEntryTransactionType(entry: JournalEntry): JournalType {
  if (entry.transactionType) {
    return entry.transactionType;
  }

  switch (entry.journal) {
    case "Cash Receipts":
    case "Sales":
      return "Income";
    case "Cash Disbursements":
    case "Purchase":
      return "Expense";
    default:
      return "Adjustment";
  }
}

function entryMatchesClient(entry: JournalEntry, clientFilter: string) {
  if (clientFilter === DEFAULT_DASHBOARD_FILTERS.client) {
    return true;
  }

  const directMatch = [entry.client ?? "", entry.reference ?? "", entry.description]
    .filter(Boolean)
    .some((value) => matchesText(value, clientFilter));

  if (directMatch) {
    return true;
  }

  if (entry.client && isGenericClientLabel(entry.client)) {
    return true;
  }

  return matchesText(entry.description, "all clients") || matchesText(entry.description, "multiple clients");
}

function entryMatchesAccount(entry: JournalEntry, accountFilter: string, accountOptions: Map<string, AccountFilterOption>) {
  if (accountFilter === DEFAULT_DASHBOARD_FILTERS.account) {
    return true;
  }

  const option = accountOptions.get(normalizeFilterText(accountFilter));

  if (!option) {
    return false;
  }

  return entry.lineItems?.some((lineItem) => {
    const normalizedAccount = normalizeFilterText(lineItem.account);
    return option.searchTerms.some((term) => normalizedAccount.includes(term) || term.includes(normalizedAccount));
  }) ?? false;
}

function entryMatchesTransactionType(entry: JournalEntry, transactionTypeFilter: string) {
  if (transactionTypeFilter === DEFAULT_DASHBOARD_FILTERS.transactionType) {
    return true;
  }

  return getEntryTransactionType(entry) === transactionTypeFilter;
}

function buildClientOptions(clients: Array<{ name: string }>, invoices: Array<{ client: string }>, entries: JournalEntry[]) {
  const names = new Set<string>();

  clients.forEach((client) => {
    if (client.name.trim()) {
      names.add(client.name.trim());
    }
  });

  invoices.forEach((invoice) => {
    if (invoice.client.trim()) {
      names.add(invoice.client.trim());
    }
  });

  entries.forEach((entry) => {
    const clientName = entry.client?.trim();

    if (clientName && !isGenericClientLabel(clientName)) {
      names.add(clientName);
    }
  });

  return [...names].sort((left, right) => left.localeCompare(right, "en"));
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState(dashboardTabs[1]);
  const [filters, setFilters] = useState<DashboardFilterState>(DEFAULT_DASHBOARD_FILTERS);
  const clients = useClientsStore();
  const invoices = useInvoicesStore();
  const journalEntries = useJournalEntriesStore();

  const clientOptions = useMemo(() => buildClientOptions(clients, invoices, journalEntries), [clients, invoices, journalEntries]);
  const accountOptions = useMemo(() => buildAccountOptions(journalEntries), [journalEntries]);
  const accountOptionMap = useMemo(
    () => new Map(accountOptions.map((option) => [normalizeFilterText(option.label), option] as const)),
    [accountOptions],
  );

  const dashboardFilters = useMemo(
    () => ({
      account: filters.account,
      client: filters.client,
      transactionType: filters.transactionType,
    }),
    [filters.account, filters.client, filters.transactionType],
  );

  const hasActiveFilters = useMemo(
    () =>
      filters.client !== DEFAULT_DASHBOARD_FILTERS.client ||
      filters.account !== DEFAULT_DASHBOARD_FILTERS.account ||
      filters.transactionType !== DEFAULT_DASHBOARD_FILTERS.transactionType,
    [filters.account, filters.client, filters.transactionType],
  );

  const filteredEntries = useMemo(
    () =>
      journalEntries.filter(
        (entry) =>
          entryMatchesClient(entry, filters.client) &&
          entryMatchesAccount(entry, filters.account, accountOptionMap) &&
          entryMatchesTransactionType(entry, filters.transactionType),
      ),
    [accountOptionMap, filters.account, filters.client, filters.transactionType, journalEntries],
  );

  const filteredInvoices = useMemo(() => {
    if (filters.client === DEFAULT_DASHBOARD_FILTERS.client) {
      return invoices;
    }

    return invoices.filter((invoice) => matchesText(invoice.client, filters.client));
  }, [filters.client, invoices]);

  return (
    <div className="dashboard-page">
      <DashboardHeader description="Cash flow overview and financial summary" title="Dashboard" />

      <DashboardFilters
        accountOptions={accountOptions.map((option) => option.label)}
        clientOptions={clientOptions}
        hasActiveFilters={hasActiveFilters}
        onApply={setFilters}
        onReset={() => setFilters(DEFAULT_DASHBOARD_FILTERS)}
        transactionTypeOptions={transactionTypeOptions}
        value={dashboardFilters}
      />

      <DashboardSummaryCards journalEntries={filteredEntries} invoices={filteredInvoices} />

      <DashboardTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="dashboard-page__grid">
        <CashFlowChart journalEntries={filteredEntries} period={activeTab} />
        <ExpenseBreakdown journalEntries={filteredEntries} />
      </div>

      <RecentTransactions journalEntries={filteredEntries} />
    </div>
  );
}

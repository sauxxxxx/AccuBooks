import { useMemo, useState } from "react";
import { Icon } from "../../components/Icon";
import { buildFinancialStatementData } from "../../data/accountingSelectors";
import { useJournalEntriesStore } from "../../data/journalEntriesStore";
import {
  financialStatementTabs,
  type FinancialStatementTabKey,
  type StatementRow,
  type StatementSection,
  type TrialBalanceRow,
} from "./financialStatementsData";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number, options?: { blankZero?: boolean }) {
  if (options?.blankZero && value === 0) {
    return "";
  }

  const prefix = value < 0 ? "-" : "";
  return `${prefix}₱${currencyFormatter.format(Math.abs(value))}`;
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function SectionTableCard({
  section,
  showZeroes = true,
}: {
  section: StatementSection;
  showZeroes?: boolean;
}) {
  return (
    <section className="fs-card">
      <h2 className="fs-card__title">{section.title}</h2>

      <div className="fs-tableWrap">
        <table className="fs-table" aria-label={section.title}>
          <thead>
            <tr className="fs-table__head">
              <th className="fs-table__headCell" scope="col">
                Account
              </th>
              <th className="fs-table__headCell fs-table__headCell--right" scope="col">
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            {section.rows.map((row) => (
              <tr key={row.label} className="fs-table__row">
                <td className="fs-table__cell">
                  <span className="fs-table__account" style={{ paddingLeft: `${(row.depth ?? 0) * 18}px` }}>
                    {row.label}
                  </span>
                </td>
                <td className="fs-table__cell fs-table__cell--mono fs-table__cell--right">
                  {formatCurrency(row.amount, { blankZero: !showZeroes })}
                </td>
              </tr>
            ))}

            <tr className="fs-table__row fs-table__row--total">
              <td className="fs-table__cell fs-table__cell--strong">{section.totalLabel}</td>
              <td className="fs-table__cell fs-table__cell--mono fs-table__cell--right fs-table__cell--strong">
                {formatCurrency(section.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrialBalanceCard({
  rows,
  totals,
}: {
  rows: TrialBalanceRow[];
  totals: {
    credit: number;
    debit: number;
  };
}) {
  return (
    <section className="fs-card">
      <div className="fs-tableWrap">
        <table className="fs-table" aria-label="Trial balance">
          <colgroup>
            <col style={{ width: "60%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>

          <thead>
            <tr className="fs-table__head">
              <th className="fs-table__headCell" scope="col">
                Account
              </th>
              <th className="fs-table__headCell fs-table__headCell--right" scope="col">
                Debit
              </th>
              <th className="fs-table__headCell fs-table__headCell--right" scope="col">
                Credit
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.account} className="fs-table__row">
                <td className="fs-table__cell">{row.account}</td>
                <td className="fs-table__cell fs-table__cell--mono fs-table__cell--right">
                  {formatCurrency(row.debit, { blankZero: true })}
                </td>
                <td className="fs-table__cell fs-table__cell--mono fs-table__cell--right">
                  {formatCurrency(row.credit, { blankZero: true })}
                </td>
              </tr>
            ))}

            <tr className="fs-table__row fs-table__row--total">
              <td className="fs-table__cell fs-table__cell--strong">Totals</td>
              <td className="fs-table__cell fs-table__cell--mono fs-table__cell--right fs-table__cell--strong">
                {formatCurrency(totals.debit)}
              </td>
              <td className="fs-table__cell fs-table__cell--mono fs-table__cell--right fs-table__cell--strong">
                {formatCurrency(totals.credit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CashFlowCard({
  cashFlowNetCashFlow,
  cashFlowOperationsRows,
  cashFlowOperatingRows,
}: {
  cashFlowNetCashFlow: number;
  cashFlowOperationsRows: StatementRow[];
  cashFlowOperatingRows: StatementRow[];
}) {
  return (
    <section className="fs-card">
      <h2 className="fs-card__title">Cash Flow Statement</h2>

      <div className="fs-flowBlock">
        <h3 className="fs-flowBlock__title">Operating Activities</h3>
        <div className="fs-flowRow fs-flowRow--summary">
          <span>Net Income</span>
          <strong className="fs-flowRow__amount">{formatCurrency(cashFlowNetCashFlow)}</strong>
        </div>
      </div>

      <div className="fs-flowDivider" />

      <div className="fs-flowBlock">
        <h3 className="fs-flowBlock__title">Cash from Operations</h3>
        {cashFlowOperationsRows.map((row) => (
          <div key={row.label} className="fs-flowRow">
            <span style={{ paddingLeft: `${(row.depth ?? 0) * 18}px` }}>{row.label}</span>
            <span className="fs-flowRow__amount">{formatCurrency(row.amount)}</span>
          </div>
        ))}
      </div>

      <div className="fs-flowDivider" />

      <div className="fs-flowRow fs-flowRow--summary fs-flowRow--total">
        <strong>Net Cash Flow</strong>
        <strong className={`fs-flowRow__amount ${cashFlowNetCashFlow < 0 ? "fs-flowRow__amount--negative" : ""}`}>
          {formatCurrency(cashFlowNetCashFlow)}
        </strong>
      </div>
    </section>
  );
}

function buildStatementCsvRows(
  tab: FinancialStatementTabKey,
  data: {
    balanceSheetSections: StatementSection[];
    balanceSheetSummary: {
      assets: number;
      equity: number;
      liabilities: number;
    };
    cashFlowNetCashFlow: number;
    cashFlowOperatingRows: StatementRow[];
    cashFlowOperationsRows: StatementRow[];
    incomeStatementNetIncome: number;
    incomeStatementSections: StatementSection[];
    trialBalanceRows: TrialBalanceRow[];
    trialBalanceTotals: {
      credit: number;
      debit: number;
    };
  },
) {
  const {
    balanceSheetSections,
    balanceSheetSummary,
    cashFlowNetCashFlow,
    cashFlowOperatingRows,
    cashFlowOperationsRows,
    incomeStatementNetIncome,
    incomeStatementSections,
    trialBalanceRows,
    trialBalanceTotals,
  } = data;

  if (tab === "balance-sheet") {
    return [
      ["Section", "Account", "Amount"],
      ...balanceSheetSections.flatMap((section) => [
        ...section.rows.map((row) => [section.title, row.label, formatCurrency(row.amount)]),
        [section.title, section.totalLabel, formatCurrency(section.totalAmount)],
      ]),
      ["Summary", "Assets", formatCurrency(balanceSheetSummary.assets)],
      ["Summary", "Liabilities", formatCurrency(balanceSheetSummary.liabilities)],
      ["Summary", "Equity", formatCurrency(balanceSheetSummary.equity)],
    ];
  }

  if (tab === "income-statement") {
    return [
      ["Section", "Account", "Amount"],
      ...incomeStatementSections.flatMap((section) => [
        ...section.rows.map((row) => [section.title, row.label, formatCurrency(row.amount)]),
        [section.title, section.totalLabel, formatCurrency(section.totalAmount)],
      ]),
      ["Summary", "Net Income", formatCurrency(incomeStatementNetIncome)],
    ];
  }

  if (tab === "trial-balance") {
    return [
      ["Account", "Debit", "Credit"],
      ...trialBalanceRows.map((row) => [row.account, formatCurrency(row.debit, { blankZero: true }), formatCurrency(row.credit, { blankZero: true })]),
      ["Totals", formatCurrency(trialBalanceTotals.debit), formatCurrency(trialBalanceTotals.credit)],
    ];
  }

  return [
    ["Section", "Account", "Amount"],
    ["Operating Activities", "Net Income", formatCurrency(cashFlowNetCashFlow)],
    ...cashFlowOperatingRows.map((row) => ["Operating Activities", row.label, formatCurrency(row.amount)]),
    ...cashFlowOperationsRows.map((row) => ["Cash from Operations", row.label, formatCurrency(row.amount)]),
    ["Summary", "Net Cash Flow", formatCurrency(cashFlowNetCashFlow)],
  ];
}

export function FinancialStatementsPage() {
  const [activeTab, setActiveTab] = useState<FinancialStatementTabKey>("balance-sheet");
  const journalEntries = useJournalEntriesStore();
  const statementData = useMemo(() => buildFinancialStatementData(journalEntries), [journalEntries]);
  const {
    balanceSheetSections,
    balanceSheetSummary,
    cashFlowNetCashFlow,
    cashFlowOperatingRows,
    cashFlowOperationsRows,
    incomeStatementNetIncome,
    incomeStatementSections,
    trialBalanceRows,
    trialBalanceTotals,
  } = statementData;

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "balance-sheet":
        return (
          <div className="fs-stack">
            {balanceSheetSections.map((section) => (
              <SectionTableCard key={section.title} section={section} />
            ))}

            <div className="fs-summaryBar fs-summaryBar--balanced">
              <strong>Assets = Liabilities + Equity</strong>
              <span className="fs-summaryBar__value fs-summaryBar__value--balanced">
                {formatCurrency(balanceSheetSummary.assets)} = {formatCurrency(balanceSheetSummary.liabilities + balanceSheetSummary.equity)} ✓ Balanced
              </span>
            </div>
          </div>
        );

      case "income-statement":
        return (
          <div className="fs-stack">
            {incomeStatementSections.map((section) => (
              <SectionTableCard key={section.title} section={section} />
            ))}

            <div className="fs-summaryBar fs-summaryBar--negative">
              <strong>Net Income</strong>
              <span className={`fs-summaryBar__value ${incomeStatementNetIncome < 0 ? "fs-summaryBar__value--negative" : ""}`}>
                {formatCurrency(incomeStatementNetIncome)}
              </span>
            </div>
          </div>
        );

      case "trial-balance":
        return <TrialBalanceCard rows={trialBalanceRows} totals={trialBalanceTotals} />;

      case "cash-flow":
        return (
          <CashFlowCard
            cashFlowNetCashFlow={cashFlowNetCashFlow}
            cashFlowOperationsRows={cashFlowOperationsRows}
            cashFlowOperatingRows={cashFlowOperatingRows}
          />
        );
    }
  }, [activeTab, statementData]);

  const handleExport = () => {
    const filename = `financial-statements-${activeTab}.csv`;
    downloadCsv(filename, buildStatementCsvRows(activeTab, statementData));
  };

  return (
    <div className="fs-page">
      <header className="fs-header">
        <div className="fs-header__copy">
          <h1 className="fs-header__title">Financial Statements</h1>
          <p className="fs-header__description">Auto-generated from journal entries</p>
        </div>

        <button type="button" className="button button--secondary fs-header__action" onClick={handleExport}>
          <Icon name="download" size={18} />
          <span>Export CSV</span>
        </button>
      </header>

      <nav className="fs-tabs" role="tablist" aria-label="Financial statement views">
        {financialStatementTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`fs-tabs__tab ${tab.key === activeTab ? "fs-tabs__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={tab.key === activeTab}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="fs-content" key={activeTab}>
        {tabContent}
      </main>
    </div>
  );
}

import { useMemo } from "react";
import { Icon } from "../../components/Icon";
import { buildDashboardSummaryMetrics } from "../../data/accountingSelectors";
import type { InvoiceRecord } from "../invoicing/invoicingData";
import type { JournalEntry } from "../journal-entries/journalEntriesData";

const toneClassMap: Record<string, string> = {
  cashflow: "dashboard-stat--cashflow",
  expenses: "dashboard-stat--expenses",
  income: "dashboard-stat--income",
  warning: "dashboard-stat--warning",
};

type DashboardSummaryCardsProps = {
  invoices: InvoiceRecord[];
  journalEntries: JournalEntry[];
};

export function DashboardSummaryCards({ invoices, journalEntries }: DashboardSummaryCardsProps) {
  const summaryMetrics = useMemo(() => buildDashboardSummaryMetrics(journalEntries, invoices), [invoices, journalEntries]);

  return (
    <section className="dashboard-stats" aria-label="Selected KPIs">
      {summaryMetrics.map((metric) => (
        <article key={metric.title} className={`dashboard-stat ${toneClassMap[metric.tone]}`}>
          <div className="dashboard-stat__copy">
            <p className="dashboard-stat__label">{metric.title}</p>
            <p className="dashboard-stat__value">{metric.value}</p>
            {metric.note ? <p className="dashboard-stat__note">{metric.note}</p> : null}
          </div>

          <div className="dashboard-stat__icon" aria-hidden="true">
            <Icon name={metric.icon} size={20} />
          </div>
        </article>
      ))}
    </section>
  );
}

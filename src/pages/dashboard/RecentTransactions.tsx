import { useMemo } from "react";
import { buildDashboardRecentTransactions } from "../../data/accountingSelectors";
import type { JournalEntry } from "../journal-entries/journalEntriesData";

type RecentTransactionsProps = {
  journalEntries: JournalEntry[];
};

export function RecentTransactions({ journalEntries }: RecentTransactionsProps) {
  const recentTransactions = useMemo(
    () => buildDashboardRecentTransactions(journalEntries, { allowFallback: false }),
    [journalEntries],
  );

  return (
    <section className="dashboard-panel dashboard-panel--transactions" aria-labelledby="recent-transactions">
      <div className="dashboard-panel__header">
        <h2 id="recent-transactions">Recent Transactions</h2>
      </div>

      {recentTransactions.length ? (
        <div className="dashboard-transactions">
          {recentTransactions.map((transaction, index) => (
            <article key={`${transaction.description}-${transaction.date}`} className="dashboard-transaction">
              <div className="dashboard-transaction__copy">
                <h3 className="dashboard-transaction__title">{transaction.description}</h3>
                <p className="dashboard-transaction__meta">
                  {transaction.date} · {transaction.type}
                </p>
              </div>

              <div className="dashboard-transaction__summary">
                <span className="dashboard-transaction__amount">{transaction.amount}</span>
                <span className={`dashboard-status dashboard-status--${transaction.status}`}>{transaction.status}</span>
              </div>

              {index < recentTransactions.length - 1 ? <div className="dashboard-transaction__divider" aria-hidden="true" /> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="dashboard-emptyState">
          <p className="dashboard-emptyState__title">No matching transactions</p>
          <p className="dashboard-emptyState__text">Try widening the filters to see recent activity.</p>
        </div>
      )}
    </section>
  );
}

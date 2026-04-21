import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import type { JournalEntry, JournalStatus } from "./journalEntriesData";

type JournalEntriesTableProps = {
  entries: JournalEntry[];
  onView: (entry: JournalEntry) => void;
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getStatusActionIcon(status: JournalStatus) {
  return status === "draft" ? "check-circle" : "x-circle";
}

function getStatusActionLabel(status: JournalStatus) {
  return status === "draft" ? "Post entry" : "Void entry";
}

export function JournalEntriesTable({ entries, onView }: JournalEntriesTableProps) {
  const tableCardRef = useRef<HTMLElement | null>(null);
  const [tableShellHeight, setTableShellHeight] = useState<number | null>(null);

  useEffect(() => {
    const tableCard = tableCardRef.current;

    if (!tableCard) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setTableShellHeight(tableCard.scrollHeight);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [entries]);

  return (
    <div
      className="journal-tableShell"
      style={tableShellHeight === null ? undefined : { height: tableShellHeight }}
    >
      <section ref={tableCardRef} className="journal-tableCard" aria-labelledby="journal-entries-table">
        <h2 className="sr-only" id="journal-entries-table">
          Journal entries table
        </h2>

        <div className="journal-tableWrap">
          <table className="journal-table" aria-label="Journal entries">
            <colgroup>
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
            </colgroup>

            <thead>
              <tr className="journal-table__headRow">
                <th className="journal-table__headCell" scope="col">
                  Entry #
                </th>
                <th className="journal-table__headCell" scope="col">
                  Date
                </th>
                <th className="journal-table__headCell" scope="col">
                  Description
                </th>
                <th className="journal-table__headCell" scope="col">
                  Journal
                </th>
                <th className="journal-table__headCell journal-table__headCell--right" scope="col">
                  Debit
                </th>
                <th className="journal-table__headCell journal-table__headCell--right" scope="col">
                  Credit
                </th>
                <th className="journal-table__headCell" scope="col">
                  Status
                </th>
                <th className="journal-table__headCell journal-table__headCell--actions" scope="col">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {entries.length ? (
                entries.map((entry) => (
                  <tr
                    key={entry.entryNumber}
                    className="journal-table__row journal-table__row--clickable"
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${entry.entryNumber}`}
                    onClick={() => onView(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onView(entry);
                      }
                    }}
                  >
                    <td className="journal-table__cell journal-table__cell--mono">{entry.entryNumber}</td>
                    <td className="journal-table__cell">{entry.date}</td>
                    <td className="journal-table__cell" title={entry.description}>
                      <span className="journal-table__truncate">{entry.description}</span>
                    </td>
                    <td className="journal-table__cell">{entry.journal}</td>
                    <td className="journal-table__cell journal-table__cell--mono journal-table__cell--right">
                      {formatCurrency(entry.debit)}
                    </td>
                    <td className="journal-table__cell journal-table__cell--mono journal-table__cell--right">
                      {formatCurrency(entry.credit)}
                    </td>
                    <td className="journal-table__cell">
                      <span className={`dashboard-status dashboard-status--${entry.status}`}>{entry.status}</span>
                    </td>
                    <td className="journal-table__cell journal-table__cell--actions">
                      <button
                        type="button"
                        className={`journal-table__action journal-table__action--${entry.status === "draft" ? "positive" : "negative"}`}
                        aria-label={`${getStatusActionLabel(entry.status)} ${entry.entryNumber}`}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        <Icon name={getStatusActionIcon(entry.status)} size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="journal-table__emptyCell" colSpan={8}>
                    No journal entries match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

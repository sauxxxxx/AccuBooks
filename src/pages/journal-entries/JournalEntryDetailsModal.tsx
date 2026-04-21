import { useEffect } from "react";
import { Icon } from "../../components/Icon";
import type { JournalEntry, JournalLineItem } from "./journalEntriesData";

type JournalEntryDetailsModalProps = {
  entry: JournalEntry;
  onClose: () => void;
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

const fallbackCreatedAt = "Apr 16, 2026 6:48 AM";
const fallbackCreatedBy = "wshaun035@gmail.com";

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function buildFallbackLineItems(entry: JournalEntry): JournalLineItem[] {
  const debitAccountByJournal: Record<JournalEntry["journal"], string> = {
    "Cash Disbursements": `5000 - ${entry.description}`,
    "Cash Receipts": "1010 - Cash in Bank",
    General: "5000 - Salaries & Wages",
    Purchase: "1300 - Inventory",
    Sales: "1100 - Accounts Receivable",
  };

  const creditAccountByJournal: Record<JournalEntry["journal"], string> = {
    "Cash Disbursements": "1010 - Cash in Bank",
    "Cash Receipts": "4000 - Service Revenue",
    General: "1010 - Cash in Bank",
    Purchase: "1010 - Cash in Bank",
    Sales: "4100 - Sales Revenue",
  };

  return [
    {
      account: debitAccountByJournal[entry.journal],
      credit: 0,
      debit: entry.debit,
      id: `${entry.entryNumber}-debit`,
    },
    {
      account: creditAccountByJournal[entry.journal],
      credit: entry.credit,
      debit: 0,
      id: `${entry.entryNumber}-credit`,
    },
  ];
}

export function JournalEntryDetailsModal({ entry, onClose }: JournalEntryDetailsModalProps) {
  const lineItems = entry.lineItems?.length ? entry.lineItems : buildFallbackLineItems(entry);
  const debitTotal = lineItems.reduce((sum, lineItem) => sum + lineItem.debit, 0);
  const creditTotal = lineItems.reduce((sum, lineItem) => sum + lineItem.credit, 0);
  const createdAt = entry.createdAt ?? fallbackCreatedAt;
  const createdBy = entry.createdBy ?? fallbackCreatedBy;

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="journal-details__overlay" onClick={onClose}>
      <div
        className="journal-details__modal journal-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-entry-details-title"
      >
        <div className="journal-details__header">
          <h2 id="journal-entry-details-title">Journal Entry Details</h2>
          <button type="button" className="journal-details__close" aria-label="Close details" onClick={onClose}>
            <Icon name="x-circle" size={24} />
          </button>
        </div>

        <div className="journal-details__metaGrid">
          <div className="journal-details__metaItem">
            <span>Entry #:</span>
            <strong>{entry.entryNumber}</strong>
          </div>
          <div className="journal-details__metaItem">
            <span>Date:</span>
            <strong>{entry.date}</strong>
          </div>
          <div className="journal-details__metaItem">
            <span>Journal:</span>
            <strong>{entry.journal}</strong>
          </div>
          <div className="journal-details__metaItem">
            <span>Status:</span>
            <strong className={`dashboard-status dashboard-status--${entry.status}`}>{entry.status}</strong>
          </div>
          <div className="journal-details__metaItem">
            <span>Reference:</span>
            <strong>{entry.reference || "—"}</strong>
          </div>
        </div>

        <div className="journal-details__description">
          <span>Description:</span>
          <strong>{entry.description}</strong>
        </div>

        <div className="journal-details__lineCard">
          <div className="journal-details__lineHead">
            <div>Account</div>
            <div className="journal-details__lineHeadAmount">Debit</div>
            <div className="journal-details__lineHeadAmount">Credit</div>
          </div>

          <div className="journal-details__lineBody">
            {lineItems.map((lineItem) => (
              <div key={lineItem.id} className="journal-details__lineRow">
                <div className="journal-details__account">{lineItem.account}</div>
                <div className="journal-details__amount">{lineItem.debit ? formatCurrency(lineItem.debit) : ""}</div>
                <div className="journal-details__amount">{lineItem.credit ? formatCurrency(lineItem.credit) : ""}</div>
              </div>
            ))}
          </div>

          <div className="journal-details__totals">
            <div className="journal-details__totalsLabel">Totals</div>
            <div className="journal-details__amount journal-details__amount--total">{formatCurrency(debitTotal)}</div>
            <div className="journal-details__amount journal-details__amount--total">{formatCurrency(creditTotal)}</div>
          </div>
        </div>

        <div className="journal-details__footer">Created: {createdAt} · By: {createdBy}</div>
      </div>
    </div>
  );
}

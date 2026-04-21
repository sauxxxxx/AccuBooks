import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Icon } from "../../components/Icon";
import { buildPaymentHistoryRowNumber } from "../../data/accountingSelectors";
import { updateClientsStore, useClientsStore } from "../../data/clientsStore";
import { useInvoicesStore, updateInvoicesStore } from "../../data/invoicesStore";
import { useJournalEntriesStore, updateJournalEntries } from "../../data/journalEntriesStore";
import { usePaymentHistoryStore, updatePaymentHistoryStore } from "../../data/paymentHistoryStore";
import { useSuppliersStore } from "../../data/suppliersStore";
import { RecordPaymentModal } from "./RecordPaymentModal";
import {
  agingBuckets,
  arApTabs,
  type PaymentHistoryRow,
  type RecordPaymentDraft,
  type ArApTab,
} from "./arApData";
import type { InvoiceRecord } from "../invoicing/invoicingData";
import type { JournalEntry } from "../journal-entries/journalEntriesData";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

function parseDateValue(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function formatHistoryDate(value: string) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function parseLooseDate(value: string) {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPaymentEntityOptions(
  type: RecordPaymentDraft["type"],
  clients: Array<{ name: string }>,
  suppliers: Array<{ name: string }>,
) {
  return type === "AR (from Client)"
    ? Array.from(new Set(clients.map((row) => row.name)))
    : Array.from(new Set(suppliers.map((row) => row.name)));
}

function getNextJournalEntryIndex(entries: JournalEntry[]) {
  return entries.reduce((highest, row) => {
    if (!row.entryNumber.startsWith("JE-")) {
      return highest;
    }

    const entryParts = row.entryNumber.split("-");
    const suffix = Number.parseInt(entryParts[entryParts.length - 1] ?? "0", 10);
    return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
  }, 0) + 1;
}

function applyArPaymentToInvoices(invoices: InvoiceRecord[], clientName: string, amount: number) {
  let remaining = amount;

  const sorted = [...invoices]
    .filter((invoice) => invoice.client === clientName && invoice.status !== "paid")
    .sort((left, right) => {
      const leftDate = parseLooseDate(left.dueDate)?.getTime() ?? 0;
      const rightDate = parseLooseDate(right.dueDate)?.getTime() ?? 0;
      return leftDate - rightDate;
    });

  const updates = new Map<string, InvoiceRecord>();

  for (const invoice of sorted) {
    if (remaining <= 0) {
      break;
    }

    const outstanding = Math.max(0, invoice.amount - invoice.amountPaid);

    if (outstanding <= 0) {
      continue;
    }

    const applied = Math.min(outstanding, remaining);
    remaining -= applied;
    const nextPaid = invoice.amountPaid + applied;

    updates.set(invoice.invoiceNumber, {
      ...invoice,
      amountPaid: nextPaid,
      status: nextPaid >= invoice.amount ? "paid" : nextPaid > 0 ? "partial" : invoice.status,
    });
  }

  return invoices.map((invoice) => updates.get(invoice.invoiceNumber) ?? invoice);
}

function buildPaymentJournalEntry(
  draft: RecordPaymentDraft,
  paymentNumber: string,
  journalEntryNumber: string,
): JournalEntry {
  const isAr = draft.type === "AR (from Client)";
  const amount = draft.amount;

  return {
    credit: amount,
    date: draft.date,
    debit: amount,
    client: isAr ? draft.entity : undefined,
    description: `${paymentNumber} - ${draft.entity}`,
    entryNumber: journalEntryNumber,
    journal: isAr ? "Cash Receipts" : "Cash Disbursements",
    reference: draft.reference?.trim() || paymentNumber,
    lineItems: isAr
      ? [
          { account: "1012 - Bank - BPI", credit: 0, debit: amount, id: `${paymentNumber}-je-1` },
          { account: "1110 - Trade Receivables", credit: amount, debit: 0, id: `${paymentNumber}-je-2` },
        ]
        : [
            { account: "2110 - Trade Payables", credit: 0, debit: amount, id: `${paymentNumber}-je-1` },
            { account: "1012 - Bank - BPI", credit: amount, debit: 0, id: `${paymentNumber}-je-2` },
          ],
      status: "posted",
      transactionType: isAr ? "Income" : "Expense",
    };
  }

function ArApSummaryCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: "trending-down" | "trending-up" | "dollar-sign";
  label: string;
  tone: "receivable" | "payable" | "position";
  value: string;
}) {
  return (
    <article className={`arap-summaryCard arap-summaryCard--${tone}`}>
      <div className="arap-summaryCard__copy">
        <p className="arap-summaryCard__label">{label}</p>
        <p className="arap-summaryCard__value">{value}</p>
      </div>

      <div className="arap-summaryCard__icon">
        <Icon name={icon} size={22} />
      </div>
    </article>
  );
}

function ArApTabs({
  activeTab,
  onChange,
}: {
  activeTab: ArApTab;
  onChange: (tab: ArApTab) => void;
}) {
  return (
    <div className="arap-tabs" role="tablist" aria-label="Accounts receivable and payable sections">
      {arApTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`arap-tabs__tab ${tab === activeTab ? "arap-tabs__tab--active" : ""}`}
          role="tab"
          aria-selected={tab === activeTab}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function ArApTableCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="arap-panel arap-panel--table" aria-labelledby={`arap-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <h2 className="arap-panel__title" id={`arap-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ArApPage() {
  const [activeTab, setActiveTab] = useState<ArApTab>("Accounts Receivable");
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const invoices = useInvoicesStore();
  const paymentHistoryRows = usePaymentHistoryStore();
  const journalEntries = useJournalEntriesStore();
  const clients = useClientsStore();
  const suppliers = useSuppliersStore();

  const totalReceivable = useMemo(
    () =>
      invoices.reduce((sum, invoice) => {
        if (invoice.type !== "Official Invoice" || invoice.amountPaid >= invoice.amount) {
          return sum;
        }

        return sum + (invoice.amount - invoice.amountPaid);
      }, 0),
    [invoices],
  );

  const totalPayable = useMemo(
    () =>
      paymentHistoryRows
        .filter((row) => row.type === "AP")
        .reduce((sum, row) => sum + row.amount, 0),
    [paymentHistoryRows],
  );

  const netPosition = totalReceivable - totalPayable;

  const receivableRows = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.type === "Official Invoice" && invoice.amountPaid < invoice.amount)
        .map((invoice) => ({
          balance: invoice.amount - invoice.amountPaid,
          client: invoice.client,
          dueDate: invoice.dueDate,
          invoiceNumber: invoice.invoiceNumber,
          paid: invoice.amountPaid,
          status: invoice.status === "paid" ? "sent" : invoice.status,
          total: invoice.amount,
        })),
    [invoices],
  );

  const payableRows = useMemo(
    () =>
      paymentHistoryRows
        .filter((row) => row.type === "AP")
        .map((row) => ({
          amount: row.amount,
          date: row.date,
          method: row.method,
          paymentNumber: row.paymentNumber,
          supplier: row.entity,
        })),
    [paymentHistoryRows],
  );

  const handleSavePayment = (draft: RecordPaymentDraft) => {
    const entityOptions = getPaymentEntityOptions(draft.type, clients, suppliers);
    const entity = draft.entity.trim() || entityOptions[0] || "Payment record";
    const paymentNumber = `PAY-2026-${String(buildPaymentHistoryRowNumber(paymentHistoryRows)).padStart(3, "0")}`;
    const paymentRow: PaymentHistoryRow = {
      amount: draft.amount,
      date: formatHistoryDate(draft.date),
      entity,
      method: draft.method,
      paymentNumber,
      type: draft.type === "AR (from Client)" ? "AR" : "AP",
    };
    const journalEntryNumber = `JE-2026-${String(getNextJournalEntryIndex(journalEntries)).padStart(3, "0")}`;

    updatePaymentHistoryStore((current) => [paymentRow, ...current]);
    updateJournalEntries((current) => [buildPaymentJournalEntry({ ...draft, entity }, paymentNumber, journalEntryNumber), ...current]);

    if (draft.type === "AR (from Client)") {
      updateInvoicesStore((current) => applyArPaymentToInvoices(current, entity, draft.amount));

      updateClientsStore((current) =>
        current.map((client) => {
          if (client.name !== entity) {
            return client;
          }

          return {
            ...client,
            recentPayments: [
              { amount: draft.amount, date: formatHistoryDate(draft.date), id: `${client.id}-payment-${paymentNumber}` },
              ...client.recentPayments,
            ],
            totalPaid: client.totalPaid + draft.amount,
          };
        }),
      );
    }

    setIsRecordPaymentOpen(false);
  };

  return (
    <div className="arap-page">
      <header className="arap-header">
        <div className="arap-header__copy">
          <h1 className="arap-header__title">Accounts Receivable &amp; Payable</h1>
          <p className="arap-header__description">Track outstanding balances and payments</p>
        </div>

        <button
          type="button"
          className="arap-button arap-button--primary"
          aria-haspopup="dialog"
          onClick={() => setIsRecordPaymentOpen(true)}
        >
          <Icon name="plus" size={18} />
          <span>Record Payment</span>
        </button>
      </header>

      <section className="arap-summaryGrid" aria-label="AR/AP summary metrics">
        <ArApSummaryCard icon="trending-down" label="Total Receivable" tone="receivable" value={formatCurrency(totalReceivable)} />
        <ArApSummaryCard icon="trending-up" label="Total Payable" tone="payable" value={formatCurrency(totalPayable)} />
        <ArApSummaryCard icon="dollar-sign" label="Net Position" tone="position" value={formatCurrency(netPosition)} />
      </section>

      <ArApTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "Accounts Receivable" ? (
        <ArApTableCard title="Accounts Receivable">
          <div className="arap-tableWrap">
            <table className="arap-table arap-table--receivables" aria-label="Accounts receivable">
              <colgroup>
                <col style={{ width: "13%" }} />
                <col style={{ width: "29%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>

              <thead>
                <tr className="arap-table__headRow">
                  <th className="arap-table__headCell" scope="col">
                    Invoice #
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Client
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Due Date
                  </th>
                  <th className="arap-table__headCell arap-table__headCell--right" scope="col">
                    Total
                  </th>
                  <th className="arap-table__headCell arap-table__headCell--right" scope="col">
                    Paid
                  </th>
                  <th className="arap-table__headCell arap-table__headCell--right" scope="col">
                    Balance
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {receivableRows.map((row) => (
                  <tr key={row.invoiceNumber} className="arap-table__row">
                    <td className="arap-table__cell arap-table__cell--mono">{row.invoiceNumber}</td>
                    <td className="arap-table__cell arap-table__cell--strong">{row.client}</td>
                    <td className="arap-table__cell">{row.dueDate}</td>
                    <td className="arap-table__cell arap-table__cell--mono arap-table__cell--right">{formatCurrency(row.total)}</td>
                    <td className="arap-table__cell arap-table__cell--mono arap-table__cell--right arap-table__cell--paid">
                      {formatCurrency(row.paid)}
                    </td>
                    <td className="arap-table__cell arap-table__cell--mono arap-table__cell--right arap-table__cell--strong">
                      {formatCurrency(row.balance)}
                    </td>
                    <td className="arap-table__cell">
                      <span className={`arap-statusBadge arap-statusBadge--${row.status}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ArApTableCard>
      ) : null}

      {activeTab === "Accounts Payable" ? (
        <ArApTableCard title="Accounts Payable">
          <div className="arap-tableWrap">
            <table className="arap-table arap-table--payables" aria-label="Accounts payable">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "42%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>

              <thead>
                <tr className="arap-table__headRow">
                  <th className="arap-table__headCell" scope="col">
                    Payment #
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Supplier
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Date
                  </th>
                  <th className="arap-table__headCell arap-table__headCell--right" scope="col">
                    Amount
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Method
                  </th>
                </tr>
              </thead>

              <tbody>
                {payableRows.map((row) => (
                  <tr key={row.paymentNumber} className="arap-table__row">
                    <td className="arap-table__cell arap-table__cell--mono">{row.paymentNumber}</td>
                    <td className="arap-table__cell arap-table__cell--strong">{row.supplier}</td>
                    <td className="arap-table__cell">{row.date}</td>
                    <td className="arap-table__cell arap-table__cell--mono arap-table__cell--right">{formatCurrency(row.amount)}</td>
                    <td className="arap-table__cell">{row.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ArApTableCard>
      ) : null}

      {activeTab === "Aging Report" ? (
        <ArApTableCard title="AR Aging Report">
          <div className="arap-tableWrap">
            <table className="arap-table arap-table--aging" aria-label="AR aging report">
              <colgroup>
                <col style={{ width: "70%" }} />
                <col style={{ width: "30%" }} />
              </colgroup>

              <thead>
                <tr className="arap-table__headRow">
                  <th className="arap-table__headCell" scope="col">
                    Aging Bucket
                  </th>
                  <th className="arap-table__headCell arap-table__headCell--right" scope="col">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {agingBuckets.map((row) => (
                  <tr key={row.bucket} className={`arap-table__row ${row.bucket === "Total" ? "arap-table__row--total" : ""}`}>
                    <td className={`arap-table__cell ${row.bucket === "Total" ? "arap-table__cell--strong" : ""}`}>{row.bucket}</td>
                    <td className="arap-table__cell arap-table__cell--mono arap-table__cell--right arap-table__cell--strong">
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ArApTableCard>
      ) : null}

      {activeTab === "Payment History" ? (
        <ArApTableCard title="Payment History">
          <div className="arap-tableWrap">
            <table className="arap-table arap-table--history" aria-label="Payment history">
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>

              <thead>
                <tr className="arap-table__headRow">
                  <th className="arap-table__headCell" scope="col">
                    Payment #
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Date
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Type
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Entity
                  </th>
                  <th className="arap-table__headCell arap-table__headCell--right" scope="col">
                    Amount
                  </th>
                  <th className="arap-table__headCell" scope="col">
                    Method
                  </th>
                </tr>
              </thead>

              <tbody>
                {paymentHistoryRows.map((row) => (
                  <tr key={row.paymentNumber} className="arap-table__row">
                    <td className="arap-table__cell arap-table__cell--mono">{row.paymentNumber}</td>
                    <td className="arap-table__cell">{row.date}</td>
                    <td className="arap-table__cell">
                      <span className={`arap-typeBadge arap-typeBadge--${row.type.toLowerCase()}`}>{row.type}</span>
                    </td>
                    <td className="arap-table__cell arap-table__cell--strong">{row.entity}</td>
                    <td className="arap-table__cell arap-table__cell--mono arap-table__cell--right">{formatCurrency(row.amount)}</td>
                    <td className="arap-table__cell">{row.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ArApTableCard>
      ) : null}

      {isRecordPaymentOpen ? (
        <RecordPaymentModal onClose={() => setIsRecordPaymentOpen(false)} onSave={handleSavePayment} />
      ) : null}
    </div>
  );
}

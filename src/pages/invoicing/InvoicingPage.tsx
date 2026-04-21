import { useState } from "react";
import { Icon } from "../../components/Icon";
import { InvoiceModal } from "./InvoiceModal";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { type InvoiceRecord, type NewInvoiceDraft } from "./invoicingData";
import { buildPaymentHistoryRowNumber } from "../../data/accountingSelectors";
import { updateClientsStore, useClientsStore } from "../../data/clientsStore";
import { updateInvoicesStore, useInvoicesStore } from "../../data/invoicesStore";
import { updateJournalEntries, useJournalEntriesStore } from "../../data/journalEntriesStore";
import { updatePaymentHistoryStore, usePaymentHistoryStore } from "../../data/paymentHistoryStore";
import { useSettingsStore } from "../../data/settingsStore";
import type { JournalEntry } from "../journal-entries/journalEntriesData";
import type { PaymentHistoryRow } from "../ar-ap/arApData";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

function getNextInvoiceIndex(rows: InvoiceRecord[], prefix: "INV" | "AR") {
  return rows.reduce((highest, row) => {
    if (!row.invoiceNumber.startsWith(`${prefix}-`)) {
      return highest;
    }

    const entryParts = row.invoiceNumber.split("-");
    const suffix = Number.parseInt(entryParts[entryParts.length - 1] ?? "0", 10);
    return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
  }, 0) + 1;
}

function getInvoicePrefix(invoiceType: NewInvoiceDraft["invoiceType"]) {
  return invoiceType === "Acknowledgment Receipt" ? "AR" : "INV";
}

function getNextSequenceIndex(
  entries: Array<{ entryNumber?: string; invoiceNumber?: string }>,
  prefix: string,
  field: "entryNumber" | "invoiceNumber" = "entryNumber",
) {
  return entries.reduce((highest, row) => {
    const value = row[field];

    if (!value || !value.startsWith(`${prefix}-`)) {
      return highest;
    }

    const entryParts = value.split("-");
    const suffix = Number.parseInt(entryParts[entryParts.length - 1] ?? "0", 10);
    return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
  }, 0) + 1;
}

function parseVatRate(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.12;
}

function buildInvoiceJournalEntry(
  draft: NewInvoiceDraft,
  invoiceNumber: string,
  journalEntryNumber: string,
  vatRate: number,
): JournalEntry {
  const subtotal = draft.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;
  const isReceipt = draft.invoiceType === "Acknowledgment Receipt";
  const postingDate = draft.date;

  return {
    credit: total,
    date: postingDate,
    debit: total,
    client: draft.client,
    description: `${invoiceNumber} - ${draft.client}`,
    entryNumber: journalEntryNumber,
    journal: isReceipt ? "Cash Receipts" : "Sales",
    reference: invoiceNumber,
    lineItems: isReceipt
      ? [
          { account: "1012 - Bank - BPI", credit: 0, debit: total, id: `${invoiceNumber}-je-1` },
          { account: "4200 - Service Revenue", credit: subtotal, debit: 0, id: `${invoiceNumber}-je-2` },
          { account: "2210 - VAT Payable", credit: vatAmount, debit: 0, id: `${invoiceNumber}-je-3` },
        ]
        : [
            { account: "1110 - Trade Receivables", credit: 0, debit: total, id: `${invoiceNumber}-je-1` },
            { account: "4200 - Service Revenue", credit: subtotal, debit: 0, id: `${invoiceNumber}-je-2` },
            { account: "2210 - VAT Payable", credit: vatAmount, debit: 0, id: `${invoiceNumber}-je-3` },
          ],
    status: "posted",
    transactionType: "Income",
  };
}

export function InvoicingPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const invoices = useInvoicesStore();
  const journalEntries = useJournalEntriesStore();
  const paymentHistory = usePaymentHistoryStore();
  const clients = useClientsStore();
  const settings = useSettingsStore();

  const handleSaveInvoice = (draft: NewInvoiceDraft) => {
    const prefix = getInvoicePrefix(draft.invoiceType);
    const amount = draft.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const invoiceNumber = `${prefix}-2026-${String(getNextSequenceIndex(invoices, prefix)).padStart(3, "0")}`;
    const vatRate = parseVatRate(settings.find((setting) => setting.key === "vat_rate")?.value ?? "0.12");
    const journalEntryNumber = `JE-2026-${String(getNextSequenceIndex(journalEntries, "JE", "entryNumber")).padStart(3, "0")}`;
    const nextInvoice: InvoiceRecord = {
      amount,
      amountPaid: draft.invoiceType === "Acknowledgment Receipt" ? amount : 0,
      client: draft.client,
      clientAddress: draft.clientAddress,
      clientTin: draft.clientTin,
      date: draft.date,
      dueDate: draft.dueDate,
      invoiceNumber,
      lineItems: draft.lineItems.map((item) => ({
        description: item.description,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
      })),
      notes: draft.notes,
      status: draft.invoiceType === "Acknowledgment Receipt" ? "paid" : "sent",
      type: draft.invoiceType,
    };

    updateInvoicesStore((current) => [nextInvoice, ...current]);

    updateClientsStore((current) =>
      current.map((client) => {
        if (client.name !== draft.client) {
          return client;
        }

        if (draft.invoiceType === "Acknowledgment Receipt") {
          return {
            ...client,
            recentPayments: [
              { amount, date: draft.date, id: `${client.id}-invoice-${invoiceNumber}` },
              ...client.recentPayments,
            ],
            totalBilled: client.totalBilled + amount,
            totalPaid: client.totalPaid + amount,
          };
        }

        return {
          ...client,
          totalBilled: client.totalBilled + amount,
        };
      }),
    );

    updateJournalEntries((current) => [buildInvoiceJournalEntry(draft, invoiceNumber, journalEntryNumber, vatRate), ...current]);

    if (draft.invoiceType === "Acknowledgment Receipt") {
      const paymentNumber = `PAY-2026-${String(buildPaymentHistoryRowNumber(paymentHistory)).padStart(3, "0")}`;
      const paymentHistoryRow: PaymentHistoryRow = {
        amount,
        date: draft.date,
        entity: draft.client,
        method: "Cash",
        paymentNumber,
        type: "AR",
      };

      updatePaymentHistoryStore((current) => [paymentHistoryRow, ...current]);
    }

    setIsCreateOpen(false);
  };

  return (
    <div className="invoice-page">
      <header className="invoice-header">
        <div className="invoice-header__copy">
          <h1 className="invoice-header__title">Invoicing</h1>
          <p className="invoice-header__description">BIR-compliant invoice generation</p>
        </div>

        <button
          type="button"
          className="button button--primary invoice-button invoice-button--primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <Icon name="plus" size={18} />
          <span>New Invoice</span>
        </button>
      </header>

      <section className="invoice-panel" aria-labelledby="invoice-table-title">
        <div className="invoice-panel__header">
          <h2 className="invoice-panel__title" id="invoice-table-title">
            Invoices
          </h2>
        </div>

        <div className="invoice-tableWrap">
          <table className="invoice-table" aria-label="Invoices">
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>

            <thead>
              <tr className="invoice-table__headRow">
                <th className="invoice-table__headCell" scope="col">
                  Invoice #
                </th>
                <th className="invoice-table__headCell" scope="col">
                  Date
                </th>
                <th className="invoice-table__headCell" scope="col">
                  Client
                </th>
                <th className="invoice-table__headCell" scope="col">
                  Type
                </th>
                <th className="invoice-table__headCell invoice-table__headCell--right" scope="col">
                  Amount
                </th>
                <th className="invoice-table__headCell" scope="col">
                  Status
                </th>
                <th className="invoice-table__headCell invoice-table__headCell--center" scope="col">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.invoiceNumber} className="invoice-table__row">
                  <td className="invoice-table__cell invoice-table__cell--mono">{invoice.invoiceNumber}</td>
                  <td className="invoice-table__cell">{invoice.date}</td>
                  <td className="invoice-table__cell invoice-table__cell--strong">{invoice.client}</td>
                  <td className="invoice-table__cell">{invoice.type}</td>
                  <td className="invoice-table__cell invoice-table__cell--mono invoice-table__cell--right invoice-table__cell--strong">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="invoice-table__cell">
                    <span className={`invoice-statusBadge invoice-statusBadge--${invoice.status}`}>{invoice.status}</span>
                  </td>
                  <td className="invoice-table__cell invoice-table__cell--center">
                    <button
                      type="button"
                      className="invoice-table__action"
                      aria-label={`Preview ${invoice.invoiceNumber}`}
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <Icon name="eye" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isCreateOpen ? (
        <InvoiceModal
          onClose={() => setIsCreateOpen(false)}
          onSave={handleSaveInvoice}
        />
      ) : null}

      {selectedInvoice ? (
        <InvoicePreviewModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      ) : null}
    </div>
  );
}

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { Icon } from "../../components/Icon";
import type { ClientRecord } from "./clientsData";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

type ClientDetailsModalProps = {
  client: ClientRecord;
  onClose: () => void;
};

function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

export function ClientDetailsModal({ client, onClose }: ClientDetailsModalProps) {
  const portalTarget = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!portalTarget) {
    return null;
  }

  const outstanding = client.totalBilled - client.totalPaid;

  return createPortal(
    <div className="journal-details__overlay clients-details__overlay" onClick={onClose}>
      <div
        className="journal-details__modal journal-modal clients-details__modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-details-title"
      >
        <div className="journal-details__header clients-details__header">
          <h2 id="client-details-title">Client Details</h2>
          <button type="button" className="journal-details__close" aria-label="Close details" onClick={onClose}>
            <Icon name="x-circle" size={20} />
          </button>
        </div>

        <div className="clients-details__stack">
          <div className="clients-details__metaGrid">
            <div className="clients-details__metaItem">
              <span>Name:</span>
              <strong>{client.name}</strong>
            </div>
            <div className="clients-details__metaItem">
              <span>Status:</span>
              <span className={`clients-statusBadge clients-statusBadge--${client.status}`}>{client.status}</span>
            </div>
            <div className="clients-details__metaItem">
              <span>Email:</span>
              <strong>{client.email}</strong>
            </div>
            <div className="clients-details__metaItem">
              <span>Phone:</span>
              <strong>{client.phone}</strong>
            </div>
            <div className="clients-details__metaItem">
              <span>TIN:</span>
              <strong>{client.tin}</strong>
            </div>
            <div className="clients-details__metaItem">
              <span>Contact:</span>
              <strong>{client.contactPerson}</strong>
            </div>
            <div className="clients-details__metaItem clients-details__metaItem--full">
              <span>Address:</span>
              <strong>{client.address}</strong>
            </div>
          </div>

          <div className="clients-details__divider" />

          <div className="clients-details__detailGrid">
            <div className="clients-details__detailItem">
              <span>Package:</span>
              <strong>{client.packageName}</strong>
            </div>
            <div className="clients-details__detailItem">
              <span>Add-ons:</span>
              <strong>{client.addOns.join(", ") || "None"}</strong>
            </div>
            <div className="clients-details__detailItem">
              <span>Contract:</span>
              <strong>
                {client.contractStart} – {client.contractEnd}
              </strong>
            </div>
            <div className="clients-details__detailItem">
              <span>Monthly Billing:</span>
              <strong>{formatCurrency(client.monthlyBilling)}</strong>
            </div>
            <div className="clients-details__detailItem clients-details__detailItem--full">
              <span>One-time Fees:</span>
              <strong>{formatCurrency(client.oneTimeFees)}</strong>
            </div>
          </div>

          <div className="clients-details__divider" />

          <div className="clients-details__summaryGrid">
            <div className="clients-details__summaryCard clients-details__summaryCard--neutral">
              <span className="clients-details__summaryLabel">Total Billed</span>
              <strong className="clients-details__summaryValue">{formatCurrency(client.totalBilled)}</strong>
            </div>
            <div className="clients-details__summaryCard clients-details__summaryCard--paid">
              <span className="clients-details__summaryLabel">Total Paid</span>
              <strong className="clients-details__summaryValue">{formatCurrency(client.totalPaid)}</strong>
            </div>
            <div className="clients-details__summaryCard clients-details__summaryCard--outstanding">
              <span className="clients-details__summaryLabel">Outstanding</span>
              <strong className="clients-details__summaryValue">{formatCurrency(outstanding)}</strong>
            </div>
          </div>

          <section className="clients-details__paymentsSection" aria-labelledby="client-payments-title">
            <h3 id="client-payments-title">Recent Payments ({client.recentPayments.length})</h3>
            <div className="clients-details__payments">
              {client.recentPayments.length > 0 ? (
                client.recentPayments.map((payment) => (
                  <div key={payment.id} className="clients-details__paymentRow">
                    <span className="clients-details__paymentDate">{payment.date}</span>
                    <span className="clients-details__paymentAmount">{formatCurrency(payment.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="clients-details__empty">No payments recorded.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}

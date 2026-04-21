import { createPortal } from "react-dom";
import { useEffect } from "react";
import { Icon } from "../../components/Icon";
import { useSettingsStore } from "../../data/settingsStore";
import type { InvoiceRecord } from "./invoicingData";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

function getInvoiceSubtotal(invoice: InvoiceRecord) {
  return invoice.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

function parseVatRate(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.12;
}

function getSettingValue(settings: ReturnType<typeof useSettingsStore>, key: string, fallback = "") {
  return settings.find((setting) => setting.key === key)?.value.trim() || fallback;
}

type InvoicePreviewModalProps = {
  invoice: InvoiceRecord;
  onClose: () => void;
};

export function InvoicePreviewModal({ invoice, onClose }: InvoicePreviewModalProps) {
  const settings = useSettingsStore();
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const portalTarget = typeof document === "undefined" ? null : document.body;

  if (!portalTarget) {
    return null;
  }

  const subtotal = getInvoiceSubtotal(invoice);
  const vatRate = parseVatRate(settings.find((setting) => setting.key === "vat_rate")?.value ?? "0.12");
  const vatableSales = vatRate > 0 ? subtotal / (1 + vatRate) : subtotal;
  const vatAmount = subtotal - vatableSales;
  const balanceDue = invoice.amount - invoice.amountPaid;
  const businessName = getSettingValue(settings, "registered_business_name", "Registered Business Name");
  const businessAddress = getSettingValue(settings, "registered_business_address", "Registered Business Address");
  const businessTin = getSettingValue(settings, "business_tin", "000-000-000-000");
  const branchCode = getSettingValue(settings, "branch_code", "00000");
  const vatRegistrationStatus = getSettingValue(settings, "vat_registration_status", "VAT REG");
  const invoiceSerialPrefix = getSettingValue(settings, "invoice_serial_prefix", "INV-2026");
  const atpSerialStart = getSettingValue(settings, "atp_serial_start", `${invoiceSerialPrefix}-001`);
  const atpSerialEnd = getSettingValue(settings, "atp_serial_end", `${invoiceSerialPrefix}-999`);
  const companyLogoUrl = getSettingValue(settings, "company_logo_url");

  return createPortal(
    <div className="invoice-preview__overlay" onClick={onClose}>
      <div
        className="invoice-preview__modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-preview-title"
      >
        <div className="invoice-preview__header">
          <h2 id="invoice-preview-title">Invoice Preview</h2>
          <button type="button" className="journal-modal__close" aria-label="Close preview" onClick={onClose}>
            <Icon name="x-circle" size={20} />
          </button>
        </div>

        <section className="invoice-preview__sheet" aria-label={`Preview for ${invoice.invoiceNumber}`}>
          <div className="invoice-preview__sellerHeader">
            <div className="invoice-preview__sellerIdentity">
              {companyLogoUrl ? (
                <div className="invoice-preview__sellerLogoFrame">
                  <img className="invoice-preview__sellerLogo" src={companyLogoUrl} alt={`${businessName} logo`} />
                </div>
              ) : null}
              <p className="invoice-preview__sellerName">{businessName}</p>
              <p className="invoice-preview__sellerMeta">{businessAddress}</p>
            </div>

            <div className="invoice-preview__sellerAside">
              <p className="invoice-preview__sellerMeta">
                <strong>{vatRegistrationStatus} TIN</strong> {businessTin}
              </p>
              <p className="invoice-preview__sellerMeta">
                <strong>Branch Code</strong> {branchCode}
              </p>
              <p className="invoice-preview__sellerMeta">
                <strong>ATP Serial Range</strong> {atpSerialStart} - {atpSerialEnd}
              </p>
            </div>
          </div>

          <div className="invoice-preview__documentHeader">
            <h3 className="invoice-preview__documentTitle">{invoice.type.toUpperCase()}</h3>
            <p className="invoice-preview__documentNumber">Invoice # {invoice.invoiceNumber}</p>
          </div>

          <div className="invoice-preview__meta">
            <div>
              <p className="invoice-preview__metaLabel">Bill To:</p>
              <p className="invoice-preview__metaValue">{invoice.client}</p>
              <p className="invoice-preview__metaMinor">TIN: {invoice.clientTin}</p>
              <p className="invoice-preview__metaMinor">{invoice.clientAddress}</p>
            </div>
            <div className="invoice-preview__metaDate">
              <p className="invoice-preview__metaLabel">Date:</p>
              <p className="invoice-preview__metaValue">{invoice.date}</p>
            </div>
          </div>

          <div className="invoice-preview__tableWrap">
            <table className="invoice-preview__table" aria-label="Invoice line items">
              <colgroup>
                <col style={{ width: "56%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead>
                <tr className="invoice-preview__tableHeadRow">
                  <th className="invoice-preview__tableHeadCell" scope="col">
                    Description
                  </th>
                  <th className="invoice-preview__tableHeadCell invoice-preview__tableHeadCell--right" scope="col">
                    Qty
                  </th>
                  <th className="invoice-preview__tableHeadCell invoice-preview__tableHeadCell--right" scope="col">
                    Unit Price
                  </th>
                  <th className="invoice-preview__tableHeadCell invoice-preview__tableHeadCell--right" scope="col">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((lineItem, index) => {
                  const amount = lineItem.qty * lineItem.unitPrice;

                  return (
                    <tr key={`${invoice.invoiceNumber}-${index}`} className="invoice-preview__tableRow">
                      <td className="invoice-preview__tableCell">{lineItem.description}</td>
                      <td className="invoice-preview__tableCell invoice-preview__tableCell--right">{lineItem.qty}</td>
                      <td className="invoice-preview__tableCell invoice-preview__tableCell--right">{formatCurrency(lineItem.unitPrice)}</td>
                      <td className="invoice-preview__tableCell invoice-preview__tableCell--right">{formatCurrency(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="invoice-preview__totals">
            <div className="invoice-preview__totalsRow">
              <span>VATable Sales:</span>
              <span>{formatCurrency(vatableSales)}</span>
            </div>
            <div className="invoice-preview__totalsRow">
              <span>VAT (12%):</span>
              <span>{formatCurrency(vatAmount)}</span>
            </div>
            <div className="invoice-preview__totalsRow invoice-preview__totalsRow--total">
              <span>TOTAL:</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
            <div className="invoice-preview__totalsRow invoice-preview__totalsRow--paid">
              <span>Amount Paid:</span>
              <span>{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="invoice-preview__totalsRow">
              <span>Balance Due:</span>
              <span>{formatCurrency(balanceDue)}</span>
            </div>
          </div>

          <div className="invoice-preview__footer">
            <button type="button" className="invoice-preview__print" onClick={() => void 0}>
              Print Invoice
            </button>
          </div>
        </section>
      </div>
    </div>,
    portalTarget,
  );
}

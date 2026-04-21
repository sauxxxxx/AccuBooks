import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { useClientsStore } from "../../data/clientsStore";
import { useSettingsStore } from "../../data/settingsStore";
import {
  invoiceTypeOptions,
  type InvoiceDraftLineItem,
  type InvoiceType,
  type NewInvoiceDraft,
} from "./invoicingData";

const DEFAULT_INVOICE_DATE = "04/17/2026";
const DEFAULT_DUE_DATE = "04/30/2026";
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type InvoiceForm = {
  client: string;
  clientAddress: string;
  clientTin: string;
  date: string;
  dueDate: string;
  invoiceType: InvoiceType;
  lineItems: InvoiceDraftLineItem[];
  notes: string;
};

type InvoiceDateField = "date" | "dueDate" | null;
type InvoiceMenuField = "client" | "invoiceType" | null;

type InvoiceModalProps = {
  onClose: () => void;
  onSave: (draft: NewInvoiceDraft) => void;
};

function createLineItem(index: number): InvoiceDraftLineItem {
  return {
    description: "Service/item",
    id: `invoice-line-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
    qty: "1",
    unitPrice: "0",
  };
}

function createInitialForm(): InvoiceForm {
  return {
    client: "",
    clientAddress: "",
    clientTin: "",
    date: DEFAULT_INVOICE_DATE,
    dueDate: DEFAULT_DUE_DATE,
    invoiceType: "Official Invoice",
    lineItems: [createLineItem(0)],
    notes: "",
  };
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

function formatDateValue(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}/${day}/${date.getFullYear()}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function buildCalendarCells(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function parseAmount(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function parseVatRate(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.12;
}

export function InvoiceModal({ onClose, onSave }: InvoiceModalProps) {
  const [form, setForm] = useState(createInitialForm);
  const [error, setError] = useState("");
  const [activeMenu, setActiveMenu] = useState<InvoiceMenuField>(null);
  const [activeDateField, setActiveDateField] = useState<InvoiceDateField>(null);
  const [datePickerMonth, setDatePickerMonth] = useState(() => startOfMonth(parseDateValue(DEFAULT_INVOICE_DATE) ?? new Date()));
  const dateFieldRef = useRef<HTMLLabelElement | null>(null);
  const dueDateFieldRef = useRef<HTMLLabelElement | null>(null);
  const clients = useClientsStore();
  const settings = useSettingsStore();
  const vatRate = parseVatRate(settings.find((setting) => setting.key === "vat_rate")?.value ?? "0.12");

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      const targetElement = target instanceof Element ? target : null;

      if (dateFieldRef.current && target instanceof Node && !dateFieldRef.current.contains(target)) {
        setActiveDateField((current) => (current === "date" ? null : current));
      }

      if (dueDateFieldRef.current && target instanceof Node && !dueDateFieldRef.current.contains(target)) {
        setActiveDateField((current) => (current === "dueDate" ? null : current));
      }

      if (
        targetElement &&
        !targetElement.closest("[data-invoice-select]") &&
        !targetElement.closest("[data-invoice-select-menu]")
      ) {
        setActiveMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeDateField) {
          setActiveDateField(null);
          return;
        }

        if (activeMenu) {
          setActiveMenu(null);
          return;
        }

        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDateField, activeMenu, onClose]);

  useEffect(() => {
    if (!activeDateField) {
      return;
    }

    const sourceDate = activeDateField === "date" ? form.date : form.dueDate;
    const parsedDate = parseDateValue(sourceDate);
    setDatePickerMonth(startOfMonth(parsedDate ?? new Date()));
  }, [activeDateField, form.date, form.dueDate]);

  const lineItemsTotal = useMemo(
    () => form.lineItems.reduce((sum, item) => sum + parseAmount(item.qty) * parseAmount(item.unitPrice), 0),
    [form.lineItems],
  );

  const vatableSales = vatRate > 0 ? lineItemsTotal / (1 + vatRate) : lineItemsTotal;
  const vatAmount = lineItemsTotal - vatableSales;

  const updateLineItem = (id: string, patch: Partial<InvoiceDraftLineItem>) => {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((lineItem) => (lineItem.id === id ? { ...lineItem, ...patch } : lineItem)),
    }));
  };

  const handleClientSelect = (name: string) => {
    const clientProfile = clients.find((client) => client.name === name);

    setForm((current) => ({
      ...current,
      client: name,
      clientAddress: clientProfile?.address ?? "",
      clientTin: clientProfile?.tin ?? "",
    }));
    setActiveMenu(null);
  };

  const handleSelectDate = (date: Date) => {
    const formattedDate = formatDateValue(date);

    setForm((current) => {
      if (activeDateField === "dueDate") {
        return { ...current, dueDate: formattedDate };
      }

      return { ...current, date: formattedDate };
    });

    setDatePickerMonth(startOfMonth(date));
    setActiveDateField(null);
  };

  const handleSave = () => {
    const client = form.client.trim();
    const lineItems = form.lineItems
      .map((lineItem) => ({
        description: lineItem.description.trim(),
        qty: parseAmount(lineItem.qty),
        unitPrice: parseAmount(lineItem.unitPrice),
        id: lineItem.id,
      }))
      .filter((lineItem) => lineItem.description || lineItem.qty > 0 || lineItem.unitPrice > 0);

    if (!client || lineItems.length === 0) {
      setError("Select a client and add at least one line item.");
      return;
    }

    onSave({
      client,
      clientAddress: form.clientAddress.trim(),
      clientTin: form.clientTin.trim(),
      date: form.date,
      dueDate: form.dueDate,
      invoiceType: form.invoiceType,
      lineItems: lineItems.map(({ qty, unitPrice, description }) => ({
        description,
        qty,
        unitPrice,
      })),
      notes: form.notes.trim(),
    });
  };

  const portalTarget = typeof document === "undefined" ? null : document.body;

  if (!portalTarget) {
    return null;
  }

  const datePickerTarget = activeDateField === "date" ? form.date : form.dueDate;
  const activeDate = parseDateValue(datePickerTarget);

  return createPortal(
    <div className="journal-modal__overlay" onClick={onClose}>
      <div
        className="journal-modal invoice-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
      >
        <div className="journal-modal__header">
          <h2 id="invoice-modal-title">New Invoice</h2>
          <button type="button" className="journal-modal__close" aria-label="Close modal" onClick={onClose}>
            <Icon name="x-circle" size={20} />
          </button>
        </div>

        <form
          className="journal-modal__form invoice-modal__form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          {error ? <p className="invoice-modal__error">{error}</p> : null}

          <div className="journal-modal__grid journal-modal__grid--two">
            <div className="journal-modal__field" data-invoice-select>
              <span>Invoice Type</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${activeMenu === "invoiceType" ? "journal-modal__selectButton--open" : ""}`}
                onClick={() => setActiveMenu((current) => (current === "invoiceType" ? null : "invoiceType"))}
                aria-expanded={activeMenu === "invoiceType"}
              >
                <span>{form.invoiceType}</span>
                <Icon name="chevron-down" size={16} />
              </button>

              {activeMenu === "invoiceType" ? (
                <div className="journal-modal__selectMenu" data-invoice-select-menu role="listbox" aria-label="Invoice type">
                  {invoiceTypeOptions.map((option) => {
                    const isSelected = option === form.invoiceType;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                        onClick={() => {
                          setForm((current) => ({ ...current, invoiceType: option }));
                          setActiveMenu(null);
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span>{option}</span>
                        {isSelected ? <Icon name="check" size={16} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="journal-modal__field" data-invoice-select>
              <span>Client</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${activeMenu === "client" ? "journal-modal__selectButton--open" : ""}`}
                onClick={() => setActiveMenu((current) => (current === "client" ? null : "client"))}
                aria-expanded={activeMenu === "client"}
              >
                <span>{form.client || "Select client"}</span>
                <Icon name="chevron-down" size={16} />
              </button>

              {activeMenu === "client" ? (
                <div className="journal-modal__selectMenu" data-invoice-select-menu role="listbox" aria-label="Client">
                  {clients.map((option) => {
                    const isSelected = option.name === form.client;

                    return (
                      <button
                        key={option.name}
                        type="button"
                        className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                        onClick={() => handleClientSelect(option.name)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span>{option.name}</span>
                        {isSelected ? <Icon name="check" size={16} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="invoice-modal__details">
            <div className="journal-modal__grid journal-modal__grid--three">
              <label className="journal-modal__field" ref={dateFieldRef}>
                <span>Date</span>
                <div
                  className={`journal-modal__inputWrap journal-modal__inputWrap--icon journal-modal__dateInputWrap ${
                    activeDateField === "date" ? "journal-modal__inputWrap--open" : ""
                  }`}
                >
                  <input
                    readOnly
                    type="text"
                    value={form.date}
                    onClick={() => {
                      setActiveMenu(null);
                      setActiveDateField("date");
                    }}
                  />
                  <button
                    type="button"
                    className="journal-modal__dateButton"
                    onClick={() => {
                      setActiveMenu(null);
                      setActiveDateField("date");
                    }}
                    aria-label="Open invoice date picker"
                  >
                    <Icon name="calendar" size={16} />
                  </button>
                </div>

                {activeDateField === "date" ? (
                  <div className="journal-modal__datePicker" role="dialog" aria-label="Select invoice date">
                    <div className="journal-modal__datePickerHeader">
                      <button type="button" onClick={() => setDatePickerMonth((current) => addMonths(current, -1))}>
                        <Icon name="chevron-left" size={16} />
                      </button>
                      <strong>{DATE_FORMATTER.format(datePickerMonth)}</strong>
                      <button type="button" onClick={() => setDatePickerMonth((current) => addMonths(current, 1))}>
                        <Icon name="chevron-right" size={16} />
                      </button>
                    </div>

                    <div className="journal-modal__datePickerWeekdays">
                      {WEEKDAY_LABELS.map((weekday) => (
                        <span key={weekday}>{weekday}</span>
                      ))}
                    </div>

                    <div className="journal-modal__datePickerGrid">
                      {buildCalendarCells(datePickerMonth).map((day, index) => {
                        if (!day) {
                          return <span key={`empty-${index}`} className="journal-modal__datePickerCell" />;
                        }

                        const isSelected = activeDate ? isSameDate(day, activeDate) : false;

                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            className={`journal-modal__datePickerCell ${
                              isSelected ? "journal-modal__datePickerCell--active" : ""
                            }`}
                            onClick={() => handleSelectDate(day)}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </label>

              <label className="journal-modal__field" ref={dueDateFieldRef}>
                <span>Due Date</span>
                <div
                  className={`journal-modal__inputWrap journal-modal__inputWrap--icon journal-modal__dateInputWrap ${
                    activeDateField === "dueDate" ? "journal-modal__inputWrap--open" : ""
                  }`}
                >
                  <input
                    readOnly
                    type="text"
                    value={form.dueDate}
                    onClick={() => {
                      setActiveMenu(null);
                      setActiveDateField("dueDate");
                    }}
                  />
                  <button
                    type="button"
                    className="journal-modal__dateButton"
                    onClick={() => {
                      setActiveMenu(null);
                      setActiveDateField("dueDate");
                    }}
                    aria-label="Open invoice due date picker"
                  >
                    <Icon name="calendar" size={16} />
                  </button>
                </div>

                {activeDateField === "dueDate" ? (
                  <div className="journal-modal__datePicker" role="dialog" aria-label="Select invoice due date">
                    <div className="journal-modal__datePickerHeader">
                      <button type="button" onClick={() => setDatePickerMonth((current) => addMonths(current, -1))}>
                        <Icon name="chevron-left" size={16} />
                      </button>
                      <strong>{DATE_FORMATTER.format(datePickerMonth)}</strong>
                      <button type="button" onClick={() => setDatePickerMonth((current) => addMonths(current, 1))}>
                        <Icon name="chevron-right" size={16} />
                      </button>
                    </div>

                    <div className="journal-modal__datePickerWeekdays">
                      {WEEKDAY_LABELS.map((weekday) => (
                        <span key={weekday}>{weekday}</span>
                      ))}
                    </div>

                    <div className="journal-modal__datePickerGrid">
                      {buildCalendarCells(datePickerMonth).map((day, index) => {
                        if (!day) {
                          return <span key={`empty-${index}`} className="journal-modal__datePickerCell" />;
                        }

                        const isSelected = activeDate ? isSameDate(day, activeDate) : false;

                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            className={`journal-modal__datePickerCell ${
                              isSelected ? "journal-modal__datePickerCell--active" : ""
                            }`}
                            onClick={() => handleSelectDate(day)}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </label>

              <label className="journal-modal__field">
                <span>Client TIN</span>
                <div className="journal-modal__inputWrap">
                  <input
                    value={form.clientTin}
                    onChange={(event) => setForm((current) => ({ ...current, clientTin: event.target.value }))}
                    placeholder=""
                  />
                </div>
              </label>
            </div>

            <label className="journal-modal__field">
              <span>Client Address</span>
              <div className="journal-modal__inputWrap">
                <input
                  value={form.clientAddress}
                  onChange={(event) => setForm((current) => ({ ...current, clientAddress: event.target.value }))}
                  placeholder=""
                />
              </div>
            </label>
          </div>

          <div className="invoice-modal__lineItems">
            <div className="invoice-modal__lineItemsHeader">
              <h3>Line Items</h3>
              <button
                type="button"
                className="button button--secondary invoice-modal__addLine"
                onClick={() => setForm((current) => ({ ...current, lineItems: [...current.lineItems, createLineItem(current.lineItems.length)] }))}
              >
                <Icon name="plus" size={16} />
                <span>Add</span>
              </button>
            </div>

            <div className="invoice-modal__lineItemsTable" role="table" aria-label="Invoice line items">
              <div className="invoice-modal__lineItemsHead" role="row">
                <span>Description</span>
                <span className="invoice-modal__lineItemsHead--right">Qty</span>
                <span className="invoice-modal__lineItemsHead--right">Unit Price</span>
                <span className="invoice-modal__lineItemsHead--right">Amount</span>
                <span className="sr-only">Remove</span>
              </div>

              {form.lineItems.map((lineItem) => {
                const amount = parseAmount(lineItem.qty) * parseAmount(lineItem.unitPrice);

                return (
                  <div key={lineItem.id} className="invoice-modal__lineItem" role="row">
                    <label className="invoice-modal__lineItemField" aria-label="Description">
                      <div className="journal-modal__inputWrap">
                        <input
                          value={lineItem.description}
                          onChange={(event) => updateLineItem(lineItem.id, { description: event.target.value })}
                          placeholder="Service/item"
                        />
                      </div>
                    </label>

                    <label className="invoice-modal__lineItemField invoice-modal__lineItemField--qty" aria-label="Quantity">
                      <div className="journal-modal__inputWrap">
                        <input
                          inputMode="decimal"
                          value={lineItem.qty}
                          onChange={(event) => updateLineItem(lineItem.id, { qty: event.target.value })}
                          placeholder="1"
                        />
                      </div>
                    </label>

                    <label className="invoice-modal__lineItemField invoice-modal__lineItemField--price" aria-label="Unit price">
                      <div className="journal-modal__inputWrap">
                        <input
                          inputMode="decimal"
                          value={lineItem.unitPrice}
                          onChange={(event) => updateLineItem(lineItem.id, { unitPrice: event.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </label>

                    <div className="invoice-modal__lineItemAmount">{formatMoney(amount)}</div>

                    <button
                      type="button"
                      className="invoice-modal__lineItemRemove"
                      aria-label="Remove line item"
                      onClick={() => {
                        setForm((current) => ({
                          ...current,
                          lineItems:
                            current.lineItems.length === 1
                              ? [createLineItem(0)]
                              : current.lineItems.filter((item) => item.id !== lineItem.id),
                        }));
                      }}
                    >
                      <Icon name="trash-2" size={15} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="invoice-modal__summary">
              <div className="invoice-modal__summaryRow">
                <span>VATable Sales</span>
                <span>{formatMoney(vatableSales)}</span>
              </div>
              <div className="invoice-modal__summaryRow">
                <span>VAT (12%)</span>
                <span>{formatMoney(vatAmount)}</span>
              </div>
              <div className="invoice-modal__summaryRow invoice-modal__summaryRow--total">
                <span>Total Amount Due</span>
                <span>{formatMoney(lineItemsTotal)}</span>
              </div>
            </div>
          </div>

          <label className="journal-modal__field">
            <span>Notes</span>
            <div className="journal-modal__inputWrap">
              <textarea
                className="invoice-modal__notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder=""
              />
            </div>
          </label>

          <div className="journal-modal__footer invoice-modal__footer">
            <button type="button" className="button button--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button invoice-modal__save">
              <span>Save Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget,
  );
}

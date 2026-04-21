import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { useClientsStore } from "../../data/clientsStore";
import { useSuppliersStore } from "../../data/suppliersStore";
import {
  recordPaymentMethodOptions,
  recordPaymentTypeOptions,
  type RecordPaymentDraft,
  type RecordPaymentMethod,
  type RecordPaymentType,
} from "./arApData";

const DEFAULT_PAYMENT_DATE = "04/17/2026";
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type RecordPaymentForm = {
  amount: string;
  date: string;
  entity: string;
  method: RecordPaymentMethod;
  reference: string;
  type: RecordPaymentType;
};

type RecordPaymentModalProps = {
  onClose: () => void;
  onSave: (draft: RecordPaymentDraft) => void;
};

function createInitialForm(): RecordPaymentForm {
  return {
    amount: "",
    date: DEFAULT_PAYMENT_DATE,
    entity: "",
    method: "Cash",
    reference: "",
    type: "AR (from Client)",
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

export function RecordPaymentModal({ onClose, onSave }: RecordPaymentModalProps) {
  const [form, setForm] = useState(createInitialForm);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => startOfMonth(parseDateValue(DEFAULT_PAYMENT_DATE) ?? new Date()));
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [entityMenuOpen, setEntityMenuOpen] = useState(false);
  const [methodMenuOpen, setMethodMenuOpen] = useState(false);
  const datePickerRef = useRef<HTMLLabelElement | null>(null);
  const typeSelectRef = useRef<HTMLDivElement | null>(null);
  const entitySelectRef = useRef<HTMLDivElement | null>(null);
  const methodSelectRef = useRef<HTMLDivElement | null>(null);
  const clients = useClientsStore();
  const suppliers = useSuppliersStore();

  const entityOptions = useMemo(() => {
    const source =
      form.type === "AR (from Client)"
        ? clients.map((row) => row.name)
        : suppliers.map((row) => row.name);

    return Array.from(new Set(source));
  }, [clients, form.type, suppliers]);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (datePickerRef.current && !datePickerRef.current.contains(target)) {
        setDatePickerOpen(false);
      }

      if (typeSelectRef.current && !typeSelectRef.current.contains(target)) {
        setTypeMenuOpen(false);
      }

      if (entitySelectRef.current && !entitySelectRef.current.contains(target)) {
        setEntityMenuOpen(false);
      }

      if (methodSelectRef.current && !methodSelectRef.current.contains(target)) {
        setMethodMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (datePickerOpen) {
          setDatePickerOpen(false);
          return;
        }

        if (typeMenuOpen) {
          setTypeMenuOpen(false);
          return;
        }

        if (entityMenuOpen) {
          setEntityMenuOpen(false);
          return;
        }

        if (methodMenuOpen) {
          setMethodMenuOpen(false);
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
  }, [datePickerOpen, entityMenuOpen, methodMenuOpen, onClose, typeMenuOpen]);

  useEffect(() => {
    if (!datePickerOpen) {
      return;
    }

    const parsedDate = parseDateValue(form.date);
    setDatePickerMonth(startOfMonth(parsedDate ?? new Date()));
  }, [datePickerOpen, form.date]);

  const handleSelectDate = (date: Date) => {
    setForm((current) => ({
      ...current,
      date: formatDateValue(date),
    }));
    setDatePickerMonth(startOfMonth(date));
    setDatePickerOpen(false);
  };

  const handleSave = () => {
    const parsedDate = parseDateValue(form.date);
    onSave({
      amount: parseAmount(form.amount),
      date: parsedDate ? formatDateValue(parsedDate) : form.date,
      entity: form.entity.trim(),
      method: form.method,
      reference: form.reference.trim(),
      type: form.type,
    });
  };

  const portalTarget = typeof document === "undefined" ? null : document.body;

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div className="journal-modal__overlay" onClick={onClose}>
      <div
        className="journal-modal journal-modal--record-payment"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-payment-modal-title"
      >
        <div className="journal-modal__header">
          <h2 id="record-payment-modal-title">Record Payment</h2>
          <button type="button" className="journal-modal__close" aria-label="Close modal" onClick={onClose}>
            <Icon name="x-circle" size={20} />
          </button>
        </div>

        <form
          className="journal-modal__form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className="journal-modal__grid journal-modal__grid--two">
            <div className="journal-modal__field" ref={typeSelectRef}>
              <span>Type</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${typeMenuOpen ? "journal-modal__selectButton--open" : ""}`}
                onClick={() => {
                  setDatePickerOpen(false);
                  setEntityMenuOpen(false);
                  setMethodMenuOpen(false);
                  setTypeMenuOpen((current) => !current);
                }}
                aria-expanded={typeMenuOpen}
              >
                <span>{form.type}</span>
                <Icon name="chevron-down" size={16} />
              </button>

              {typeMenuOpen ? (
                <div className="journal-modal__selectMenu" role="listbox" aria-label="Record payment type">
                  {recordPaymentTypeOptions.map((option) => {
                    const isSelected = option === form.type;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                        onClick={() => {
                          setForm((current) => ({
                            ...current,
                            entity: "",
                            type: option,
                          }));
                          setTypeMenuOpen(false);
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

            <label className="journal-modal__field" ref={datePickerRef}>
              <span>Date</span>
              <div
                className={`journal-modal__inputWrap journal-modal__inputWrap--icon journal-modal__dateInputWrap ${
                  datePickerOpen ? "journal-modal__inputWrap--open" : ""
                }`}
              >
                <input
                  readOnly
                  type="text"
                  value={form.date}
                  onClick={() => {
                    setTypeMenuOpen(false);
                    setEntityMenuOpen(false);
                    setMethodMenuOpen(false);
                    setDatePickerOpen(true);
                  }}
                  onFocus={() => {
                    setTypeMenuOpen(false);
                    setEntityMenuOpen(false);
                    setMethodMenuOpen(false);
                    setDatePickerOpen(true);
                  }}
                />
                <button
                  type="button"
                  className="journal-modal__dateButton"
                  aria-label="Open date picker"
                  aria-expanded={datePickerOpen}
                  onClick={() => {
                    setTypeMenuOpen(false);
                    setEntityMenuOpen(false);
                    setMethodMenuOpen(false);
                    setDatePickerOpen((current) => !current);
                  }}
                >
                  <Icon name="calendar" size={16} />
                </button>
              </div>

              {datePickerOpen ? (
                <div className="journal-modal__dateMenu" role="dialog" aria-label="Date picker">
                  <div className="journal-modal__dateMenuHeader">
                    <button
                      type="button"
                      className="journal-modal__dateNavButton"
                      aria-label="Previous month"
                      onClick={() => setDatePickerMonth((current) => addMonths(current, -1))}
                    >
                      <Icon name="chevron-left" size={16} />
                    </button>
                    <div className="journal-modal__dateMenuTitle">{DATE_FORMATTER.format(datePickerMonth)}</div>
                    <button
                      type="button"
                      className="journal-modal__dateNavButton"
                      aria-label="Next month"
                      onClick={() => setDatePickerMonth((current) => addMonths(current, 1))}
                    >
                      <Icon name="chevron-right" size={16} />
                    </button>
                  </div>

                  <div className="journal-modal__dateWeekdays" aria-hidden="true">
                    {WEEKDAY_LABELS.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>

                  <div className="journal-modal__dateGrid" role="grid" aria-label={DATE_FORMATTER.format(datePickerMonth)}>
                    {buildCalendarCells(datePickerMonth).map((date, index) => {
                      if (!date) {
                        return <span key={`empty-${index}`} className="journal-modal__dateDay journal-modal__dateDay--empty" />;
                      }

                      const selectedDate = parseDateValue(form.date);
                      const today = new Date();
                      const isSelected = selectedDate ? isSameDate(date, selectedDate) : false;
                      const isToday = isSameDate(date, today);

                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          className={`journal-modal__dateDay ${isSelected ? "journal-modal__dateDay--selected" : ""} ${
                            isToday ? "journal-modal__dateDay--today" : ""
                          }`}
                          onClick={() => handleSelectDate(date)}
                          role="gridcell"
                          aria-label={date.toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </label>
          </div>

          <div className="journal-modal__field journal-modal__field--full" ref={entitySelectRef}>
            <span>{form.type === "AR (from Client)" ? "Client" : "Supplier"}</span>
            <button
              type="button"
              className={`journal-modal__selectButton ${entityMenuOpen ? "journal-modal__selectButton--open" : ""}`}
              onClick={() => {
                setDatePickerOpen(false);
                setTypeMenuOpen(false);
                setMethodMenuOpen(false);
                setEntityMenuOpen((current) => !current);
              }}
              aria-expanded={entityMenuOpen}
            >
              <span className={form.entity ? "" : "journal-modal__selectPlaceholder"}>{form.entity || "Select..."}</span>
              <Icon name="chevron-down" size={16} />
            </button>

            {entityMenuOpen ? (
              <div className="journal-modal__selectMenu" role="listbox" aria-label={form.type === "AR (from Client)" ? "Client" : "Supplier"}>
                {entityOptions.map((option) => {
                  const isSelected = option === form.entity;

                  return (
                    <button
                      key={option}
                      type="button"
                      className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                      onClick={() => {
                        setForm((current) => ({ ...current, entity: option }));
                        setEntityMenuOpen(false);
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

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Amount</span>
              <div className="journal-modal__inputWrap">
                <input
                  inputMode="decimal"
                  placeholder="0"
                  type="text"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                />
              </div>
            </label>

            <div className="journal-modal__field" ref={methodSelectRef}>
              <span>Method</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${methodMenuOpen ? "journal-modal__selectButton--open" : ""}`}
                onClick={() => {
                  setDatePickerOpen(false);
                  setTypeMenuOpen(false);
                  setEntityMenuOpen(false);
                  setMethodMenuOpen((current) => !current);
                }}
                aria-expanded={methodMenuOpen}
              >
                <span>{form.method}</span>
                <Icon name="chevron-down" size={16} />
              </button>

              {methodMenuOpen ? (
                <div className="journal-modal__selectMenu" role="listbox" aria-label="Payment method">
                  {recordPaymentMethodOptions.map((option) => {
                    const isSelected = option === form.method;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                        onClick={() => {
                          setForm((current) => ({ ...current, method: option }));
                          setMethodMenuOpen(false);
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
          </div>

          <label className="journal-modal__field journal-modal__field--full">
            <span>Reference</span>
            <div className="journal-modal__inputWrap">
              <input
                type="text"
                value={form.reference}
                placeholder="Check #, ref #"
                onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
              />
            </div>
          </label>

          <div className="journal-modal__footer">
            <button type="button" className="button button--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget,
  );
}

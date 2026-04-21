import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { useClientsStore } from "../../data/clientsStore";
import type { JournalEntryDraft, JournalLineItem, JournalType } from "./journalEntriesData";
import { accountOptions, transactionTypeOptions } from "./journalEntriesData";

const DEFAULT_ENTRY_DATE = "04/16/2026";
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type JournalEntryDraftLineItem = {
  account: string;
  credit: string;
  debit: string;
  id: string;
};

type AccountMenuState = {
  id: string;
  left: number;
  placement: "down" | "up";
  top: number;
  width: number;
};

type ClientMenuState = {
  left: number;
  top: number;
  width: number;
};

type JournalEntryModalProps = {
  onClose: () => void;
  onSave: (draft: JournalEntryDraft) => void;
};

function createLineItem(index: number): JournalEntryDraftLineItem {
  return {
    account: "",
    credit: "",
    debit: "",
    id: `line-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
  };
}

function createInitialForm() {
  return {
    client: "",
    date: DEFAULT_ENTRY_DATE,
    description: "",
    lineItems: [createLineItem(0), createLineItem(1)],
    reference: "",
    transactionType: "Income" as JournalType,
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

export function JournalEntryModal({ onClose, onSave }: JournalEntryModalProps) {
  const [form, setForm] = useState(createInitialForm);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => startOfMonth(parseDateValue(DEFAULT_ENTRY_DATE) ?? new Date()));
  const [transactionTypeOpen, setTransactionTypeOpen] = useState(false);
  const [clientMenu, setClientMenu] = useState<ClientMenuState | null>(null);
  const [accountMenu, setAccountMenu] = useState<AccountMenuState | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const datePickerRef = useRef<HTMLLabelElement | null>(null);
  const transactionTypeRef = useRef<HTMLDivElement | null>(null);
  const clientSelectRef = useRef<HTMLDivElement | null>(null);
  const clients = useClientsStore();

  const clientOptions = useMemo(
    () =>
      [...new Set(clients.map((client) => client.name.trim()).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right, "en"),
      ),
    [clients],
  );

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

      if (datePickerRef.current && target instanceof Node && !datePickerRef.current.contains(target)) {
        setDatePickerOpen(false);
      }

      if (transactionTypeRef.current && target instanceof Node && !transactionTypeRef.current.contains(target)) {
        setTransactionTypeOpen(false);
      }

      if (
        clientSelectRef.current &&
        target instanceof Node &&
        !clientSelectRef.current.contains(target) &&
        !targetElement?.closest("[data-journal-client-picker-menu]")
      ) {
        setClientMenu(null);
      }

      if (
        accountMenu &&
        targetElement &&
        !targetElement.closest("[data-journal-account-picker]") &&
        !targetElement.closest("[data-journal-account-picker-menu]")
      ) {
        setAccountMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (datePickerOpen) {
          setDatePickerOpen(false);
          return;
        }

        if (transactionTypeOpen) {
          setTransactionTypeOpen(false);
          return;
        }

        if (clientMenu) {
          setClientMenu(null);
          return;
        }

        if (accountMenu) {
          setAccountMenu(null);
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
  }, [accountMenu, clientMenu, datePickerOpen, onClose, transactionTypeOpen]);

  useEffect(() => {
    if (!datePickerOpen) {
      return;
    }

    const parsedDate = parseDateValue(form.date);
    setDatePickerMonth(startOfMonth(parsedDate ?? new Date()));
  }, [datePickerOpen, form.date]);

  const updateLineItem = (id: string, patch: Partial<JournalEntryDraftLineItem>) => {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((lineItem) => (lineItem.id === id ? { ...lineItem, ...patch } : lineItem)),
    }));
  };

  const handleSelectDate = (date: Date) => {
    setForm((current) => ({
      ...current,
      date: formatDateValue(date),
    }));
    setDatePickerMonth(startOfMonth(date));
    setDatePickerOpen(false);
  };

  const handleSave = () => {
    const lineItems: JournalLineItem[] = form.lineItems.map((lineItem) => ({
      account: lineItem.account,
      credit: parseAmount(lineItem.credit),
      debit: parseAmount(lineItem.debit),
      id: lineItem.id,
    }));

    onSave({
      client: form.client,
      date: form.date,
      description: form.description,
      lineItems,
      reference: form.reference,
      transactionType: form.transactionType,
    });
  };

  const debitTotal = form.lineItems.reduce((sum, lineItem) => sum + parseAmount(lineItem.debit), 0);
  const creditTotal = form.lineItems.reduce((sum, lineItem) => sum + parseAmount(lineItem.credit), 0);
  const activeAccountLineItem = useMemo(
    () => (accountMenu ? form.lineItems.find((lineItem) => lineItem.id === accountMenu.id) ?? null : null),
    [accountMenu, form.lineItems],
  );

  const handleOpenAccountMenu = (lineItemId: string, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuHeight = Math.min(accountOptions.length * 38 + 12, 300);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    setAccountMenu({
      id: lineItemId,
      left: rect.left,
      placement: shouldOpenUp ? "up" : "down",
      top: shouldOpenUp ? Math.max(12, rect.top - menuHeight - 6) : rect.bottom + 6,
      width: rect.width,
    });
  };

  const handleOpenClientMenu = (button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuHeight = Math.min((clientOptions.length + 1) * 38 + 12, 300);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    setClientMenu({
      left: rect.left,
      top: shouldOpenUp ? Math.max(12, rect.top - menuHeight - 6) : rect.bottom + 6,
      width: rect.width,
    });
  };

  const clientMenuNode =
    clientMenu && typeof document !== "undefined"
      ? createPortal(
          <div
            className="journal-modal__selectMenu journal-modal__selectMenu--portal"
            data-journal-client-picker-menu
            role="listbox"
            aria-label="Client"
            style={{
              left: `${clientMenu.left}px`,
              maxHeight: "300px",
              overflowY: "auto",
              position: "fixed",
              right: "auto",
              top: `${clientMenu.top}px`,
              width: `${clientMenu.width}px`,
              zIndex: 90,
            }}
          >
            <button
              type="button"
              className={`journal-modal__selectOption ${!form.client ? "journal-modal__selectOption--active" : ""}`}
              onClick={() => {
                setForm((current) => ({ ...current, client: "" }));
                setClientMenu(null);
              }}
              role="option"
              aria-selected={!form.client}
            >
              <span>Select client</span>
              {!form.client ? <Icon name="check" size={16} /> : null}
            </button>

            {clientOptions.map((option) => {
              const isSelected = option === form.client;

              return (
                <button
                  key={option}
                  type="button"
                  className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                  onClick={() => {
                    setForm((current) => ({ ...current, client: option }));
                    setClientMenu(null);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{option}</span>
                  {isSelected ? <Icon name="check" size={16} /> : null}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  const accountMenuNode =
    accountMenu && activeAccountLineItem && typeof document !== "undefined"
      ? createPortal(
          <div
            className="journal-modal__selectMenu journal-modal__selectMenu--portal"
            data-journal-account-picker-menu
            role="listbox"
            aria-label="Account"
            style={{
              left: `${accountMenu.left}px`,
              maxHeight: "300px",
              overflowY: "auto",
              position: "fixed",
              right: "auto",
              top: `${accountMenu.top}px`,
              width: `${accountMenu.width}px`,
              zIndex: 90,
            }}
          >
            {accountOptions.map((option) => {
              const isSelected = option === activeAccountLineItem.account;

              return (
                <button
                  key={option}
                  type="button"
                  className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                  onClick={() => {
                    updateLineItem(activeAccountLineItem.id, { account: option });
                    setAccountMenu(null);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{option}</span>
                  {isSelected ? <Icon name="check" size={16} /> : null}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="journal-modal__overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="journal-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-entry-modal-title"
      >
        <div className="journal-modal__header">
          <h2 id="journal-entry-modal-title">New Journal Entry</h2>
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
                    setTransactionTypeOpen(false);
                    setClientMenu(null);
                    setDatePickerOpen(true);
                  }}
                  onFocus={() => {
                    setTransactionTypeOpen(false);
                    setClientMenu(null);
                    setDatePickerOpen(true);
                  }}
                />
                <button
                  type="button"
                  className="journal-modal__dateButton"
                  aria-label="Open date picker"
                  aria-expanded={datePickerOpen}
                  onClick={() => {
                    setTransactionTypeOpen(false);
                    setClientMenu(null);
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

            <div className="journal-modal__field" ref={transactionTypeRef}>
              <span>Transaction Type</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${transactionTypeOpen ? "journal-modal__selectButton--open" : ""}`}
                onClick={() => {
                  setClientMenu(null);
                  setTransactionTypeOpen((current) => !current);
                }}
              >
                <span>{form.transactionType}</span>
                <Icon name="chevron-down" size={16} />
              </button>

              {transactionTypeOpen ? (
                <div className="journal-modal__selectMenu" role="listbox" aria-label="Transaction Type">
                  {transactionTypeOptions.map((option) => {
                    const isSelected = option === form.transactionType;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                        onClick={() => {
                          setForm((current) => ({ ...current, transactionType: option }));
                          setTransactionTypeOpen(false);
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
            <span>Description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Reference</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  value={form.reference}
                  onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                />
              </div>
            </label>

            <div className="journal-modal__field" ref={clientSelectRef} data-journal-client-picker>
              <span>Client</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${clientMenu ? "journal-modal__selectButton--open" : ""}`}
                aria-expanded={Boolean(clientMenu)}
                onClick={(event) => {
                  if (clientMenu) {
                    setClientMenu(null);
                    return;
                  }

                  setDatePickerOpen(false);
                  setTransactionTypeOpen(false);
                  setAccountMenu(null);
                  handleOpenClientMenu(event.currentTarget);
                }}
              >
                <span className={form.client ? "" : "journal-modal__selectPlaceholder"}>
                  {form.client || "Select client"}
                </span>
                <Icon name="chevron-down" size={16} />
              </button>
            </div>
          </div>

          <div className="journal-modal__sectionHeader">
            <h3>Line Items</h3>
            <button
              type="button"
              className="journal-modal__addLine"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  lineItems: [...current.lineItems, createLineItem(current.lineItems.length)],
                }))
              }
            >
              <Icon name="plus" size={17} />
              <span>Add Line</span>
            </button>
          </div>

          <div className="journal-modal__lineCard">
            <div className="journal-modal__lineHead">
              <div>Account</div>
              <div>Debit</div>
              <div>Credit</div>
            </div>

            <div className="journal-modal__lineBody">
              {form.lineItems.map((lineItem) => (
                <div key={lineItem.id} className="journal-modal__lineRow">
                  <div className="journal-modal__accountPicker" data-journal-account-picker>
                    <button
                      type="button"
                      className={`journal-modal__selectButton ${
                        accountMenu?.id === lineItem.id ? "journal-modal__selectButton--open" : ""
                      }`}
                      aria-expanded={accountMenu?.id === lineItem.id}
                      onClick={(event) => {
                        if (accountMenu?.id === lineItem.id) {
                          setAccountMenu(null);
                          return;
                        }

                        setDatePickerOpen(false);
                        setTransactionTypeOpen(false);
                        setClientMenu(null);
                        handleOpenAccountMenu(lineItem.id, event.currentTarget);
                      }}
                    >
                      <span className={lineItem.account ? "" : "journal-modal__selectPlaceholder"}>
                        {lineItem.account || "Select account"}
                      </span>
                      <Icon name="chevron-down" size={16} />
                    </button>
                  </div>

                  <label className="journal-modal__moneyField">
                    <input
                      inputMode="decimal"
                      placeholder="0.00"
                      type="text"
                      value={lineItem.debit}
                      onChange={(event) => updateLineItem(lineItem.id, { debit: event.target.value })}
                    />
                  </label>

                  <label className="journal-modal__moneyField">
                    <input
                      inputMode="decimal"
                      placeholder="0.00"
                      type="text"
                      value={lineItem.credit}
                      onChange={(event) => updateLineItem(lineItem.id, { credit: event.target.value })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {clientMenuNode}
          {accountMenuNode}

          <div className="journal-modal__totals">
            <div className="journal-modal__totalsLabel">Totals:</div>
            <div className="journal-modal__totalsValue">{formatMoney(debitTotal)}</div>
            <div className="journal-modal__totalsValue">{formatMoney(creditTotal)}</div>
          </div>

          <div className="journal-modal__footer">
            <button type="button" className="button button--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

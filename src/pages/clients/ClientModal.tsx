import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import type { ClientDraft, ClientRecord, ClientStatus } from "./clientsData";
import { clientStatusOptions } from "./clientsData";

const DEFAULT_CONTRACT_START = "";
const DEFAULT_CONTRACT_END = "";
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type ClientForm = {
  addOnServices: string;
  address: string;
  contactPerson: string;
  contractEnd: string;
  contractStart: string;
  email: string;
  monthlyBilling: string;
  name: string;
  notes: string;
  oneTimeFees: string;
  packageName: string;
  phone: string;
  status: ClientStatus;
  tin: string;
};

type DateFieldKey = "contractEnd" | "contractStart";

type DateMenuState = {
  field: DateFieldKey;
  left: number;
  top: number;
  width: number;
};

type StatusMenuState = {
  left: number;
  top: number;
  width: number;
};

type ClientModalProps = {
  client?: ClientRecord | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (draft: ClientDraft) => void;
};

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

function createInitialForm(client?: ClientRecord | null): ClientForm {
  if (!client) {
    return {
      addOnServices: "",
      address: "",
      contactPerson: "",
      contractEnd: DEFAULT_CONTRACT_END,
      contractStart: DEFAULT_CONTRACT_START,
      email: "",
      monthlyBilling: "0",
      name: "",
      notes: "",
      oneTimeFees: "0",
      packageName: "",
      phone: "",
      status: "active",
      tin: "",
    };
  }

  return {
    addOnServices: client.addOns.join(", "),
    address: client.address,
    contactPerson: client.contactPerson,
    contractEnd: client.contractEnd,
    contractStart: client.contractStart,
    email: client.email,
    monthlyBilling: `${client.monthlyBilling}`,
    name: client.name,
    notes: client.notes,
    oneTimeFees: `${client.oneTimeFees}`,
    packageName: client.packageName,
    phone: client.phone,
    status: client.status,
    tin: client.tin,
  };
}

function menuPlacement(rect: DOMRect, menuHeight: number, menuWidth: number) {
  const margin = 12;
  const spaceBelow = window.innerHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;
  const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

  const left = Math.min(Math.max(margin, Math.round(rect.left)), window.innerWidth - menuWidth - margin);
  const top = shouldOpenUp ? Math.max(margin, Math.round(rect.top - menuHeight - 6)) : Math.round(rect.bottom + 6);

  return { left, top, width: menuWidth };
}

function formatDateField(value: string) {
  return value || "";
}

export function ClientModal({ client, mode, onClose, onSave }: ClientModalProps) {
  const [form, setForm] = useState<ClientForm>(() => createInitialForm(client));
  const [datePickerMonth, setDatePickerMonth] = useState(() => startOfMonth(parseDateValue(client?.contractStart ?? "") ?? new Date()));
  const [dateMenu, setDateMenu] = useState<DateMenuState | null>(null);
  const [statusMenu, setStatusMenu] = useState<StatusMenuState | null>(null);
  const contractStartRef = useRef<HTMLLabelElement | null>(null);
  const contractEndRef = useRef<HTMLLabelElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const portalTarget = typeof document === "undefined" ? null : document.body;
  const title = mode === "create" ? "Add Client" : "Edit Client";
  const saveLabel = mode === "create" ? "Save Client" : "Update Client";

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
      const withinTrigger =
        (contractStartRef.current && target instanceof Node && contractStartRef.current.contains(target)) ||
        (contractEndRef.current && target instanceof Node && contractEndRef.current.contains(target)) ||
        (statusRef.current && target instanceof Node && statusRef.current.contains(target));
      const withinMenu =
        Boolean(targetElement?.closest("[data-client-date-menu]")) || Boolean(targetElement?.closest("[data-client-status-menu]"));

      if (!withinTrigger && !withinMenu) {
        setDateMenu(null);
        setStatusMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (dateMenu) {
          setDateMenu(null);
          return;
        }

        if (statusMenu) {
          setStatusMenu(null);
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
  }, [dateMenu, onClose, statusMenu]);

  useEffect(() => {
    if (!dateMenu) {
      return;
    }

    const source = dateMenu.field === "contractStart" ? form.contractStart : form.contractEnd;
    const parsedDate = parseDateValue(source);
    setDatePickerMonth(startOfMonth(parsedDate ?? new Date()));
  }, [dateMenu, form.contractEnd, form.contractStart]);

  const handleOpenDateMenu = (field: DateFieldKey, fieldRef: { current: HTMLLabelElement | null }) => {
    const rect = fieldRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const menuWidth = Math.min(Math.max(Math.round(rect.width), 320), window.innerWidth - 24);
    const placement = menuPlacement(rect, 344, menuWidth);

    setStatusMenu(null);
    setDateMenu({
      field,
      ...placement,
    });
  };

  const handleOpenStatusMenu = () => {
    const rect = statusRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const menuWidth = Math.min(Math.max(Math.round(rect.width), 220), window.innerWidth - 24);
    const placement = menuPlacement(rect, 116, menuWidth);

    setDateMenu(null);
    setStatusMenu({
      ...placement,
    });
  };

  const handleSubmit = () => {
    onSave({
      addOnServices: form.addOnServices,
      address: form.address,
      contactPerson: form.contactPerson,
      contractEnd: form.contractEnd,
      contractStart: form.contractStart,
      email: form.email,
      monthlyBilling: form.monthlyBilling,
      name: form.name,
      notes: form.notes,
      oneTimeFees: form.oneTimeFees,
      packageName: form.packageName,
      phone: form.phone,
      status: form.status,
      tin: form.tin,
    });
  };

  const dateMenuNode =
    portalTarget && dateMenu
      ? createPortal(
          <div
            className="journal-modal__dateMenu"
            data-client-date-menu
            role="dialog"
            aria-label="Select contract date"
            style={{
              left: `${dateMenu.left}px`,
              maxHeight: "344px",
              overflow: "visible",
              position: "fixed",
              right: "auto",
              top: `${dateMenu.top}px`,
              width: `${dateMenu.width}px`,
              zIndex: 90,
            }}
          >
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

                const selectedDate = parseDateValue(dateMenu.field === "contractStart" ? form.contractStart : form.contractEnd);
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
                    onClick={() => {
                      const formatted = formatDateValue(date);
                      setForm((current) => ({
                        ...current,
                        [dateMenu.field]: formatted,
                      }));
                      setDateMenu(null);
                    }}
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
          </div>,
          portalTarget,
        )
      : null;

  const statusMenuNode =
    portalTarget && statusMenu
      ? createPortal(
          <div
            className="journal-modal__selectMenu journal-modal__selectMenu--portal clients-modal__selectMenu--portal"
            data-client-status-menu
            role="listbox"
            aria-label="Client status"
            style={{
              left: `${statusMenu.left}px`,
              maxHeight: "160px",
              overflowY: "auto",
              position: "fixed",
              right: "auto",
              top: `${statusMenu.top}px`,
              width: `${statusMenu.width}px`,
              zIndex: 90,
            }}
          >
            {clientStatusOptions.map((option) => {
              const isSelected = option === form.status;

              return (
                <button
                  key={option}
                  type="button"
                  className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                  onClick={() => {
                    setForm((current) => ({ ...current, status: option }));
                    setStatusMenu(null);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{option === "active" ? "Active" : "Inactive"}</span>
                  {isSelected ? <Icon name="check" size={16} /> : null}
                </button>
              );
            })}
          </div>,
          portalTarget,
        )
      : null;

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div className="journal-modal__overlay" onClick={onClose}>
      <div
        className="journal-modal clients-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clients-modal-title"
      >
        <div className="journal-modal__header">
          <h2 id="clients-modal-title">{title}</h2>
          <button type="button" className="journal-modal__close" aria-label="Close modal" onClick={onClose}>
            <Icon name="x-circle" size={20} />
          </button>
        </div>

        <form
          className="journal-modal__form clients-modal__form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Name</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Contact Person</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))}
                />
              </div>
            </label>
          </div>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Email</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Phone</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>
            </label>
          </div>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>TIN</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  value={form.tin}
                  onChange={(event) => setForm((current) => ({ ...current, tin: event.target.value }))}
                />
              </div>
            </label>

            <div className="journal-modal__field" ref={statusRef}>
              <span>Status</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${statusMenu ? "journal-modal__selectButton--open" : ""}`}
                aria-haspopup="listbox"
                aria-expanded={Boolean(statusMenu)}
                onClick={() => {
                  if (statusMenu) {
                    setStatusMenu(null);
                    return;
                  }

                  handleOpenStatusMenu();
                }}
              >
                <span>{form.status === "active" ? "Active" : "Inactive"}</span>
                <Icon name="chevron-down" size={16} />
              </button>
            </div>
          </div>

          <label className="journal-modal__field journal-modal__field--full">
            <span>Address</span>
            <div className="journal-modal__inputWrap">
              <input
                type="text"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
            </div>
          </label>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Package Availed</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  value={form.packageName}
                  onChange={(event) => setForm((current) => ({ ...current, packageName: event.target.value }))}
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Add-on Services</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  value={form.addOnServices}
                  onChange={(event) => setForm((current) => ({ ...current, addOnServices: event.target.value }))}
                />
              </div>
            </label>
          </div>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field" ref={contractStartRef}>
              <span>Contract Start</span>
              <div
                className={`journal-modal__inputWrap journal-modal__inputWrap--icon journal-modal__dateInputWrap ${
                  dateMenu?.field === "contractStart" ? "journal-modal__inputWrap--open" : ""
                }`}
              >
                <input
                  readOnly
                  placeholder="mm/dd/yyyy"
                  type="text"
                  value={formatDateField(form.contractStart)}
                  onClick={() => handleOpenDateMenu("contractStart", contractStartRef)}
                  onFocus={() => handleOpenDateMenu("contractStart", contractStartRef)}
                />
                <button
                  type="button"
                  className="journal-modal__dateButton"
                  aria-label="Open contract start date picker"
                  aria-expanded={dateMenu?.field === "contractStart"}
                  onClick={() => handleOpenDateMenu("contractStart", contractStartRef)}
                >
                  <Icon name="calendar" size={16} />
                </button>
              </div>
            </label>

            <label className="journal-modal__field" ref={contractEndRef}>
              <span>Contract End</span>
              <div
                className={`journal-modal__inputWrap journal-modal__inputWrap--icon journal-modal__dateInputWrap ${
                  dateMenu?.field === "contractEnd" ? "journal-modal__inputWrap--open" : ""
                }`}
              >
                <input
                  readOnly
                  placeholder="mm/dd/yyyy"
                  type="text"
                  value={formatDateField(form.contractEnd)}
                  onClick={() => handleOpenDateMenu("contractEnd", contractEndRef)}
                  onFocus={() => handleOpenDateMenu("contractEnd", contractEndRef)}
                />
                <button
                  type="button"
                  className="journal-modal__dateButton"
                  aria-label="Open contract end date picker"
                  aria-expanded={dateMenu?.field === "contractEnd"}
                  onClick={() => handleOpenDateMenu("contractEnd", contractEndRef)}
                >
                  <Icon name="calendar" size={16} />
                </button>
              </div>
            </label>
          </div>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Monthly Billing</span>
              <div className="journal-modal__inputWrap">
                <input
                  inputMode="decimal"
                  type="text"
                  value={form.monthlyBilling}
                  onChange={(event) => setForm((current) => ({ ...current, monthlyBilling: event.target.value }))}
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>One-time Fees</span>
              <div className="journal-modal__inputWrap">
                <input
                  inputMode="decimal"
                  type="text"
                  value={form.oneTimeFees}
                  onChange={(event) => setForm((current) => ({ ...current, oneTimeFees: event.target.value }))}
                />
              </div>
            </label>
          </div>

          <label className="journal-modal__field journal-modal__field--full">
            <span>Notes</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

          <div className="journal-modal__footer">
            <button type="button" className="button button--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              {saveLabel}
            </button>
          </div>
        </form>
      </div>

      {dateMenuNode}
      {statusMenuNode}
    </div>,
    portalTarget,
  );
}

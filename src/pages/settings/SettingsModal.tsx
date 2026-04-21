import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import type { SettingCategory, SettingDraft, SettingRecord } from "./settingsData";
import { settingCategoryOptions } from "./settingsData";

type SettingForm = {
  category: SettingCategory;
  description: string;
  effectiveDate: string;
  key: string;
  name: string;
  value: string;
};

type CategoryMenuState = {
  left: number;
  top: number;
  width: number;
};

type DateMenuState = {
  left: number;
  top: number;
  width: number;
};

type SettingsModalProps = {
  initialCategory?: SettingCategory;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (draft: SettingDraft) => void;
  setting?: SettingRecord | null;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

function createInitialForm(setting?: SettingRecord | null, initialCategory?: SettingCategory): SettingForm {
  if (!setting) {
    return {
      category: initialCategory ?? "general",
      description: "",
      effectiveDate: "",
      key: "",
      name: "",
      value: "",
    };
  }

  return {
    category: setting.category,
    description: setting.description,
    effectiveDate: setting.effectiveDate,
    key: setting.key,
    name: setting.name,
    value: setting.value,
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

function formatCategoryLabel(value: SettingCategory) {
  return settingCategoryOptions.find((option) => option.value === value)?.label ?? value.replace(/_/g, " ");
}

export function SettingsModal({ initialCategory, mode, onClose, onSave, setting }: SettingsModalProps) {
  const [form, setForm] = useState<SettingForm>(() => createInitialForm(setting, initialCategory));
  const [categoryMenu, setCategoryMenu] = useState<CategoryMenuState | null>(null);
  const [dateMenu, setDateMenu] = useState<DateMenuState | null>(null);
  const [datePickerMonth, setDatePickerMonth] = useState(() =>
    startOfMonth(parseDateValue(setting?.effectiveDate ?? "") ?? new Date()),
  );
  const categoryRef = useRef<HTMLDivElement | null>(null);
  const effectiveDateRef = useRef<HTMLLabelElement | null>(null);
  const portalTarget = typeof document === "undefined" ? null : document.body;
  const title = mode === "create" ? "Add Setting" : "Edit Setting";
  const saveLabel = mode === "create" ? "Save" : "Save";

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!dateMenu) {
      return;
    }

    const source = form.effectiveDate;
    const parsedDate = parseDateValue(source);
    setDatePickerMonth(startOfMonth(parsedDate ?? new Date()));
  }, [dateMenu, form.effectiveDate]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      const targetElement = target instanceof Element ? target : null;
      const withinTrigger =
        (categoryRef.current && target instanceof Node && categoryRef.current.contains(target)) ||
        (effectiveDateRef.current && target instanceof Node && effectiveDateRef.current.contains(target));
      const withinMenu =
        Boolean(targetElement?.closest("[data-settings-category-menu]")) ||
        Boolean(targetElement?.closest("[data-settings-date-menu]"));

      if (!withinTrigger && !withinMenu) {
        setCategoryMenu(null);
        setDateMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (dateMenu) {
          setDateMenu(null);
          return;
        }

        if (categoryMenu) {
          setCategoryMenu(null);
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
  }, [categoryMenu, dateMenu, onClose]);

  const handleOpenCategoryMenu = () => {
    const rect = categoryRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const menuWidth = Math.min(Math.max(Math.round(rect.width), 220), window.innerWidth - 24);
    const placement = menuPlacement(rect, 220, menuWidth);

    setDateMenu(null);
    setCategoryMenu({
      ...placement,
    });
  };

  const handleOpenDateMenu = () => {
    const rect = effectiveDateRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const menuWidth = Math.min(Math.max(Math.round(rect.width), 320), window.innerWidth - 24);
    const placement = menuPlacement(rect, 344, menuWidth);

    setCategoryMenu(null);
    setDateMenu({
      ...placement,
    });
  };

  const handleSubmit = () => {
    onSave({
      category: form.category,
      description: form.description,
      effectiveDate: form.effectiveDate,
      key: form.key,
      name: form.name,
      value: form.value,
    });
  };

  const categoryMenuNode =
    portalTarget && categoryMenu
      ? createPortal(
          <div
            className="journal-modal__selectMenu journal-modal__selectMenu--portal"
            data-settings-category-menu
            role="listbox"
            aria-label="Setting category"
            style={{
              left: `${categoryMenu.left}px`,
              maxHeight: "220px",
              overflowY: "auto",
              position: "fixed",
              right: "auto",
              top: `${categoryMenu.top}px`,
              width: `${categoryMenu.width}px`,
              zIndex: 90,
            }}
          >
            {settingCategoryOptions.map((option) => {
              const isSelected = option.value === form.category;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                  onClick={() => {
                    setForm((current) => ({ ...current, category: option.value }));
                    setCategoryMenu(null);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{option.label}</span>
                  {isSelected ? <Icon name="check" size={16} /> : null}
                </button>
              );
            })}
          </div>,
          portalTarget,
        )
      : null;

  const dateMenuNode =
    portalTarget && dateMenu
      ? createPortal(
          <div
            className="journal-modal__dateMenu"
            data-settings-date-menu
            role="dialog"
            aria-label="Select effective date"
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

                const selectedDate = parseDateValue(form.effectiveDate);
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
                      setForm((current) => ({
                        ...current,
                        effectiveDate: formatDateValue(date),
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

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div className="journal-modal__overlay" onClick={onClose}>
      <div
        className="journal-modal clients-modal settings-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div className="journal-modal__header">
          <h2 id="settings-modal-title">{title}</h2>
          <button type="button" className="journal-modal__close" aria-label="Close modal" onClick={onClose}>
            <Icon name="x-circle" size={20} />
          </button>
        </div>

        <form
          className="journal-modal__form settings-modal__form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Key</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  placeholder={mode === "create" ? "e.g. vat_rate" : ""}
                  value={form.key}
                  onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Name</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  placeholder={mode === "create" ? "e.g. Vat rate" : ""}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Value</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={mode === "create" ? "e.g. 0.12" : ""}
                  value={form.value}
                  onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                />
              </div>
            </label>

            <div className="journal-modal__field" ref={categoryRef}>
              <span>Category</span>
              <div className="journal-modal__inputWrap">
                <button
                  type="button"
                  className="journal-modal__selectButton"
                  onClick={handleOpenCategoryMenu}
                  aria-haspopup="listbox"
                  aria-expanded={Boolean(categoryMenu)}
                >
                  <span>{formatCategoryLabel(form.category)}</span>
                  <Icon name="chevron-down" size={16} />
                </button>
              </div>
            </div>
          </div>

          <label className="journal-modal__field journal-modal__field--full">
            <span>Description</span>
            <div className="journal-modal__inputWrap">
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
              />
            </div>
          </label>

          <label className="journal-modal__field journal-modal__field--full" ref={effectiveDateRef}>
            <span>Effective Date</span>
            <div className="journal-modal__inputWrap journal-modal__inputWrap--icon journal-modal__dateInputWrap">
              <input
                type="text"
                placeholder="mm/dd/yyyy"
                value={form.effectiveDate}
                onChange={(event) => setForm((current) => ({ ...current, effectiveDate: event.target.value }))}
                onClick={handleOpenDateMenu}
                readOnly
              />
              <button type="button" className="journal-modal__dateButton" onClick={handleOpenDateMenu} aria-label="Open date picker">
                <Icon name="calendar" size={16} />
              </button>
            </div>
          </label>

          <div className="journal-modal__footer">
            <button type="button" className="journal-modal__secondaryButton" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="journal-modal__primaryButton">
              {saveLabel}
            </button>
          </div>
        </form>
      </div>

      {categoryMenuNode}
      {dateMenuNode}
    </div>,
    portalTarget,
  );
}

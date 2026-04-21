import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../../components/Icon";

export type DashboardFilterState = {
  account: string;
  client: string;
  transactionType: string;
};

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilterState = {
  account: "All accounts",
  client: "All clients",
  transactionType: "All types",
};

type FilterKey = keyof DashboardFilterState;

type DashboardFiltersProps = {
  accountOptions: string[];
  clientOptions: string[];
  hasActiveFilters: boolean;
  onApply: (value: DashboardFilterState) => void;
  onReset: () => void;
  transactionTypeOptions: string[];
  value: DashboardFilterState;
};

type FilterConfigItem = {
  icon: "clients" | "accounts" | "dollar-sign";
  key: FilterKey;
  options: string[];
};

type FilterMenuPosition = {
  left: number;
  maxHeight: number;
  top: number;
  width: number;
};

function getFilterLabel(key: FilterKey) {
  switch (key) {
    case "account":
      return "Account";
    case "client":
      return "Client";
    case "transactionType":
      return "Transaction type";
    default:
      return key;
  }
}

function getFilterHint(key: FilterKey, value: string) {
  if (key === "client") {
    return value;
  }

  if (key === "account") {
    return value;
  }

  return value;
}

export function DashboardFilters({
  accountOptions,
  clientOptions,
  hasActiveFilters,
  onApply,
  onReset,
  transactionTypeOptions,
  value,
}: DashboardFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);
  const [draft, setDraft] = useState<DashboardFilterState>(value);
  const [menuPosition, setMenuPosition] = useState<FilterMenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const filterConfig = useMemo<FilterConfigItem[]>(
    () => [
      {
        icon: "clients",
        key: "client",
        options: [DEFAULT_DASHBOARD_FILTERS.client, ...clientOptions.filter((option) => option !== DEFAULT_DASHBOARD_FILTERS.client)],
      },
      {
        icon: "accounts",
        key: "account",
        options: [DEFAULT_DASHBOARD_FILTERS.account, ...accountOptions.filter((option) => option !== DEFAULT_DASHBOARD_FILTERS.account)],
      },
      {
        icon: "dollar-sign",
        key: "transactionType",
        options: [
          DEFAULT_DASHBOARD_FILTERS.transactionType,
          ...transactionTypeOptions.filter((option) => option !== DEFAULT_DASHBOARD_FILTERS.transactionType),
        ],
      },
    ],
    [accountOptions, clientOptions, transactionTypeOptions],
  );

  const activeCount = useMemo(
    () =>
      [
        value.client !== DEFAULT_DASHBOARD_FILTERS.client,
        value.account !== DEFAULT_DASHBOARD_FILTERS.account,
        value.transactionType !== DEFAULT_DASHBOARD_FILTERS.transactionType,
      ].filter(Boolean).length,
    [value.account, value.client, value.transactionType],
  );

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const targetElement = event.target as Element | null;

      if (targetElement?.closest("[data-dashboard-filter-menu]")) {
        return;
      }

      if (rootRef.current && !rootRef.current.contains(target)) {
        setIsOpen(false);
        setOpenKey(null);
        setMenuPosition(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setOpenKey(null);
        setMenuPosition(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setOpenKey(null);
      setMenuPosition(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!openKey) {
      setMenuPosition(null);
    }
  }, [openKey]);

  useEffect(() => {
    if (!openKey) {
      return;
    }

    const handleViewportChange = () => {
      setOpenKey(null);
      setMenuPosition(null);
    };

    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [openKey]);

  const applyFilters = () => {
    onApply(draft);
    setIsOpen(false);
    setOpenKey(null);
    setMenuPosition(null);
  };

  const clearFilters = () => {
    const resetValue = DEFAULT_DASHBOARD_FILTERS;
    setDraft(resetValue);
    onApply(resetValue);
    onReset();
    setOpenKey(null);
    setMenuPosition(null);
  };

  const openMenuForFilter = (key: FilterKey, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const preferredWidth = Math.min(304, Math.max(240, rect.width));
    const margin = 12;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const isBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove;
    const width = Math.min(preferredWidth, window.innerWidth - margin * 2);
    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
    const maxHeight = Math.max(180, Math.min(300, isBelow ? spaceBelow : spaceAbove));
    const top = isBelow ? rect.bottom + 8 : Math.max(margin, rect.top - 8 - maxHeight);

    setOpenKey(key);
    setMenuPosition({ left, maxHeight, top, width });
  };

  return (
    <section className="dashboard-filters" aria-label="Dashboard filters" ref={rootRef}>
      <button
        type="button"
        className={`dashboard-filters__trigger ${isOpen ? "dashboard-filters__trigger--open" : ""}`}
        aria-expanded={isOpen}
        aria-controls="dashboard-filters-panel"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="dashboard-filters__triggerIcon" aria-hidden="true">
          <Icon name="sliders" size={15} />
        </span>
        <span className="dashboard-filters__triggerCopy">
          <span className="dashboard-filters__triggerLabel">Filter</span>
          <span className="dashboard-filters__triggerValue">{activeCount > 0 ? `${activeCount} active` : "All data"}</span>
        </span>
        <span className="dashboard-filters__triggerChevron" aria-hidden="true">
          <Icon name="chevron-down" size={16} />
        </span>
      </button>

      {isOpen ? (
        <div className="dashboard-filters__panel" id="dashboard-filters-panel" role="dialog" aria-label="Dashboard filters">
          <div className="dashboard-filters__prompt">
            <span className="dashboard-filters__promptIcon" aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <p>Describe what you want to filter</p>
          </div>

          <div className="dashboard-filters__stack">
            {filterConfig.map((filter) => {
              const isRowOpen = openKey === filter.key;
              const currentValue = draft[filter.key];

              return (
                <div key={filter.key} className="dashboard-filters__categoryGroup">
                  <button
                    type="button"
                    className={`dashboard-filters__category ${isRowOpen ? "dashboard-filters__category--open" : ""}`}
                    aria-expanded={isRowOpen}
                    aria-haspopup="listbox"
                    onClick={(event) => {
                      const button = event.currentTarget;

                      if (isRowOpen) {
                        setOpenKey(null);
                        setMenuPosition(null);
                        return;
                      }

                      openMenuForFilter(filter.key, button);
                    }}
                  >
                    <span className="dashboard-filters__categoryIcon" aria-hidden="true">
                      <Icon name={filter.icon} size={16} />
                    </span>

                    <span className="dashboard-filters__categoryCopy">
                      <span className="dashboard-filters__categoryLabel">{getFilterLabel(filter.key)}</span>
                      <span className="dashboard-filters__categoryValue">{getFilterHint(filter.key, currentValue)}</span>
                    </span>

                    <span className="dashboard-filters__categoryChevron" aria-hidden="true">
                      <Icon name={isRowOpen ? "chevron-down" : "chevron-right"} size={16} />
                    </span>
                  </button>

                  {isRowOpen && menuPosition && typeof document !== "undefined"
                    ? createPortal(
                        <div
                          className="dashboard-filters__menu dashboard-filters__menu--portal"
                          data-dashboard-filter-menu
                          role="listbox"
                          aria-label={getFilterLabel(filter.key)}
                          style={{
                            position: "fixed",
                            left: `${menuPosition.left}px`,
                            margin: 0,
                            maxHeight: `${menuPosition.maxHeight}px`,
                            zIndex: 70,
                            top: `${menuPosition.top}px`,
                            width: `${menuPosition.width}px`,
                          }}
                        >
                          {filter.options.map((option) => {
                            const isSelected = option === currentValue;

                            return (
                              <button
                                key={option}
                                type="button"
                                className={`dashboard-filters__option ${isSelected ? "dashboard-filters__option--active" : ""}`}
                                onClick={() => {
                                  setDraft((current) => ({
                                    ...current,
                                    [filter.key]: option,
                                  }));
                                  setOpenKey(null);
                                  setMenuPosition(null);
                                }}
                                role="option"
                                aria-selected={isSelected}
                              >
                                <span>{option}</span>
                                {isSelected ? <Icon name="check" size={15} /> : null}
                              </button>
                            );
                          })}
                        </div>,
                        document.body,
                      )
                    : null}
                </div>
              );
            })}
          </div>

          <div className="dashboard-filters__footer">
            <button
              type="button"
              className="button button--secondary dashboard-filters__clear"
              disabled={!hasActiveFilters}
              onClick={clearFilters}
            >
              Clear filters
            </button>
            <button type="button" className="button button--primary dashboard-filters__apply" onClick={applyFilters}>
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

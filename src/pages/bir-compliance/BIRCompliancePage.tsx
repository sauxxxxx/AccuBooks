import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { buildBirComplianceData } from "../../data/accountingSelectors";
import { useInvoicesStore } from "../../data/invoicesStore";
import { useJournalEntriesStore } from "../../data/journalEntriesStore";
import { usePayrollStore } from "../../data/payrollStore";
import { useSettingsStore } from "../../data/settingsStore";
import {
  birComplianceTabs,
  birMonthNames,
  birPeriodModes,
  type BirComplianceTabKey,
  type BirPeriodMode,
} from "./birComplianceData";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  const prefix = value < 0 ? "-" : "";
  return `${prefix}₱${currencyFormatter.format(Math.abs(value))}`;
}

function parseMoney(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatPeriodLabel(mode: BirPeriodMode, monthIndex: number, year: number) {
  if (mode === "Quarterly") {
    const quarter = Math.floor(monthIndex / 3) + 1;
    return `Q${quarter} ${year}`;
  }

  if (mode === "Annual") {
    return `${year}`;
  }

  return `${birMonthNames[monthIndex]} ${year}`;
}

function buildVatExportRows(outputVatSales: number, inputVatPurchases: number) {
  const vatPayable = outputVatSales - inputVatPurchases;

  return [
    ["Section", "Value"],
    ["Output VAT (Sales)", formatCurrency(outputVatSales)],
    ["Input VAT (Purchases)", formatCurrency(inputVatPurchases)],
    ["VAT Payable", formatCurrency(vatPayable)],
  ];
}

function buildEwtExportRows(rows: Array<{ category: string; rate: string; amount: number }>) {
  return [
    ["Category", "Rate", "Amount"],
    ...rows.map((row) => [row.category, row.rate, formatCurrency(row.amount)]),
    ["Total EWT", "", formatCurrency(rows.reduce((sum, row) => sum + row.amount, 0))],
  ];
}

function buildSimpleExportRows(title: string, amount: number, note: string) {
  return [
    ["Section", "Value"],
    [title, formatCurrency(amount)],
    ["Note", note],
  ];
}

export function BirCompliancePage() {
  const journalEntries = useJournalEntriesStore();
  const invoices = useInvoicesStore();
  const payroll = usePayrollStore();
  const settings = useSettingsStore();
  const derivedBir = useMemo(
    () =>
      buildBirComplianceData({
        entries: journalEntries,
        invoices,
        payroll,
        settings,
      }),
    [invoices, journalEntries, payroll, settings],
  );
  const [activeTab, setActiveTab] = useState<BirComplianceTabKey>("vat");
  const [periodMode, setPeriodMode] = useState<BirPeriodMode>("Monthly");
  const [periodMonthIndex, setPeriodMonthIndex] = useState(3);
  const [periodYear, setPeriodYear] = useState(2026);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [outputVatValue, setOutputVatValue] = useState(() => derivedBir.outputVatSales.toFixed(2));
  const [inputVatValue, setInputVatValue] = useState(() => derivedBir.inputVatPurchases.toFixed(2));

  const modeRef = useRef<HTMLDivElement | null>(null);
  const periodRef = useRef<HTMLDivElement | null>(null);
  const lastDerivedValuesRef = useRef({
    input: derivedBir.inputVatPurchases.toFixed(2),
    output: derivedBir.outputVatSales.toFixed(2),
  });

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (modeRef.current && !modeRef.current.contains(target)) {
        setModeMenuOpen(false);
      }

      if (periodRef.current && !periodRef.current.contains(target)) {
        setPeriodMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModeMenuOpen(false);
        setPeriodMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const nextOutput = derivedBir.outputVatSales.toFixed(2);
    const nextInput = derivedBir.inputVatPurchases.toFixed(2);

    setOutputVatValue((current) => (current === lastDerivedValuesRef.current.output ? nextOutput : current));
    setInputVatValue((current) => (current === lastDerivedValuesRef.current.input ? nextInput : current));

    lastDerivedValuesRef.current = {
      input: nextInput,
      output: nextOutput,
    };
  }, [derivedBir.inputVatPurchases, derivedBir.outputVatSales]);

  const outputVatSales = parseMoney(outputVatValue);
  const inputVatPurchases = parseMoney(inputVatValue);
  const vatPayable = outputVatSales - inputVatPurchases;
  const periodLabel = formatPeriodLabel(periodMode, periodMonthIndex, periodYear);
  const { compensationTaxWithheld, ewtRows, incomeTaxNote, vatNote } = derivedBir;

  const handleExport = () => {
    const filename = `bir-compliance-${activeTab}-${periodYear}-${String(periodMonthIndex + 1).padStart(2, "0")}.csv`;

    if (activeTab === "vat") {
      downloadCsv(filename, buildVatExportRows(outputVatSales, inputVatPurchases));
      return;
    }

    if (activeTab === "ewt") {
      downloadCsv(filename, buildEwtExportRows(ewtRows));
      return;
    }

    if (activeTab === "compensation") {
      downloadCsv(filename, buildSimpleExportRows("Total Compensation Tax Withheld", compensationTaxWithheld, "Computed from payroll records withholding tax amounts."));
      return;
    }

    downloadCsv(filename, [
      ["Section", "Value"],
      ["Quarterly Income Tax", incomeTaxNote],
    ]);
  };

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "vat":
        return (
          <section className="bir-card">
            <div className="bir-card__header">
              <h2 className="bir-card__title">VAT Computation (12%)</h2>
              <button type="button" className="button button--secondary bir-card__action" onClick={handleExport}>
                <Icon name="download" size={16} />
                <span>Export</span>
              </button>
            </div>

            <div className="bir-vat">
              <div className="bir-vat__row">
                <span className="bir-vat__label">Output VAT (Sales)</span>
                <input
                  aria-label="Output VAT Sales"
                  className="bir-vat__input"
                  inputMode="decimal"
                  value={outputVatValue}
                  onChange={(event) => setOutputVatValue(event.target.value)}
                />
                <span className="bir-vat__amount">{formatCurrency(outputVatSales)}</span>
              </div>

              <div className="bir-vat__row">
                <span className="bir-vat__label">Input VAT (Purchases)</span>
                <input
                  aria-label="Input VAT Purchases"
                  className="bir-vat__input"
                  inputMode="decimal"
                  value={inputVatValue}
                  onChange={(event) => setInputVatValue(event.target.value)}
                />
                <span className="bir-vat__amount">{formatCurrency(inputVatPurchases)}</span>
              </div>

              <div className="bir-vat__row bir-vat__row--total">
                <strong>VAT Payable</strong>
                <span className="bir-vat__spacer" aria-hidden="true" />
                <strong className="bir-vat__amount bir-vat__amount--negative">{formatCurrency(vatPayable)}</strong>
              </div>
            </div>

            <p className="bir-card__note">{vatNote}</p>
          </section>
        );

      case "ewt":
        return (
          <section className="bir-card">
            <div className="bir-card__header">
              <h2 className="bir-card__title">Expanded Withholding Tax</h2>
              <button type="button" className="button button--secondary bir-card__action" onClick={handleExport}>
                <Icon name="download" size={16} />
                <span>Export</span>
              </button>
            </div>

            <div className="bir-tableWrap">
              <table className="bir-table" aria-label="Expanded withholding tax">
                <thead>
                  <tr className="bir-table__headRow">
                    <th className="bir-table__headCell" scope="col">
                      Category
                    </th>
                    <th className="bir-table__headCell" scope="col">
                      Rate
                    </th>
                    <th className="bir-table__headCell bir-table__headCell--right" scope="col">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ewtRows.map((row) => (
                    <tr key={row.category} className="bir-table__row">
                      <td className="bir-table__cell">{row.category}</td>
                      <td className="bir-table__cell bir-table__cell--muted">{row.rate}</td>
                      <td className="bir-table__cell bir-table__cell--mono bir-table__cell--right">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}

                  <tr className="bir-table__row bir-table__row--total">
                    <td className="bir-table__cell bir-table__cell--strong">Total EWT</td>
                    <td className="bir-table__cell" />
                    <td className="bir-table__cell bir-table__cell--mono bir-table__cell--right bir-table__cell--strong">
                      {formatCurrency(ewtRows.reduce((sum, row) => sum + row.amount, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        );

      case "compensation":
        return (
          <section className="bir-card bir-card--summary">
            <div className="bir-card__header">
              <h2 className="bir-card__title">Withholding Tax on Compensation (BIR Form 1601-C)</h2>
              <button type="button" className="button button--secondary bir-card__action" onClick={handleExport}>
                <Icon name="download" size={16} />
                <span>Export</span>
              </button>
            </div>

            <div className="bir-summaryRow">
              <span>Total Compensation Tax Withheld</span>
              <strong className="bir-summaryRow__value">{formatCurrency(compensationTaxWithheld)}</strong>
            </div>

            <p className="bir-card__note">Computed from payroll records withholding tax amounts.</p>
          </section>
        );

      case "income-tax":
        return (
          <section className="bir-card bir-card--info">
            <h2 className="bir-card__title">Quarterly Income Tax (BIR Form 1701Q)</h2>
            <p className="bir-card__body">{incomeTaxNote}</p>
          </section>
        );
    }
  }, [activeTab, compensationTaxWithheld, ewtRows, incomeTaxNote, inputVatPurchases, inputVatValue, outputVatSales, outputVatValue, periodMonthIndex, periodYear, vatNote, vatPayable]);

  return (
    <div className="bir-page">
      <header className="bir-header">
        <div className="bir-header__copy">
          <h1 className="bir-header__title">BIR Compliance</h1>
          <p className="bir-header__description">Tax computations and BIR form preparation</p>
        </div>

        <div className="bir-header__controls">
          <div className="bir-control bir-control--select" ref={modeRef}>
            <button
              type="button"
              className={`bir-control__button ${modeMenuOpen ? "bir-control__button--open" : ""}`}
              aria-expanded={modeMenuOpen}
              onClick={() => setModeMenuOpen((current) => !current)}
            >
              <span>{periodMode}</span>
              <Icon name="chevron-down" size={16} />
            </button>

            {modeMenuOpen ? (
              <div className="bir-control__menu" role="listbox" aria-label="BIR compliance period mode">
                {birPeriodModes.map((option) => {
                  const isSelected = option === periodMode;

                  return (
                    <button
                      key={option}
                      type="button"
                      className={`bir-control__option ${isSelected ? "bir-control__option--active" : ""}`}
                      onClick={() => {
                        setPeriodMode(option);
                        setModeMenuOpen(false);
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

          <div className="bir-control bir-control--period" ref={periodRef}>
            <button
              type="button"
              className={`bir-control__button bir-control__button--period ${periodMenuOpen ? "bir-control__button--open" : ""}`}
              aria-expanded={periodMenuOpen}
              onClick={() => setPeriodMenuOpen((current) => !current)}
            >
              <span>{periodLabel}</span>
              <Icon name="calendar" size={16} />
            </button>

            {periodMenuOpen ? (
              <div className="bir-periodMenu" aria-label="BIR compliance period picker">
                <div className="bir-periodMenu__header">
                  <button
                    type="button"
                    className="bir-periodMenu__nav"
                    aria-label="Previous year"
                    onClick={() => setPeriodYear((current) => current - 1)}
                  >
                    <Icon name="chevron-left" size={16} />
                  </button>
                  <strong>{periodYear}</strong>
                  <button
                    type="button"
                    className="bir-periodMenu__nav"
                    aria-label="Next year"
                    onClick={() => setPeriodYear((current) => current + 1)}
                  >
                    <Icon name="chevron-right" size={16} />
                  </button>
                </div>

                <div className="bir-periodMenu__grid" role="listbox" aria-label="Months">
                  {birMonthNames.map((month, index) => {
                    const isSelected = index === periodMonthIndex;

                    return (
                      <button
                        key={month}
                        type="button"
                        className={`bir-periodMenu__month ${isSelected ? "bir-periodMenu__month--active" : ""}`}
                        onClick={() => {
                          setPeriodMonthIndex(index);
                          setPeriodMenuOpen(false);
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {month.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="bir-tabs" role="tablist" aria-label="BIR compliance views">
        {birComplianceTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`bir-tabs__tab ${tab.key === activeTab ? "bir-tabs__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={tab.key === activeTab}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="bir-content" key={activeTab}>
        {tabContent}
      </main>
    </div>
  );
}

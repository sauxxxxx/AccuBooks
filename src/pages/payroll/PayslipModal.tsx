import { createPortal } from "react-dom";
import { useEffect, useMemo } from "react";
import { Icon } from "../../components/Icon";
import type { PayrollEmployee, PayrollRecord } from "./payrollData";
import type { SettingRecord } from "../settings/settingsData";

type PayslipModalProps = {
  employee: PayrollEmployee | null;
  onClose: () => void;
  record: PayrollRecord;
  settings: SettingRecord[];
};

function getSettingValue(settings: SettingRecord[], key: string) {
  return settings.find((entry) => entry.key === key)?.value.trim() ?? "";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

export function PayslipModal({ employee, onClose, record, settings }: PayslipModalProps) {
  const portalTarget = typeof document === "undefined" ? null : document.body;
  const companyLogoUrl = getSettingValue(settings, "company_logo_url");
  const businessName = getSettingValue(settings, "registered_business_name") || "AccuBooks Accounting Services";
  const businessAddress = getSettingValue(settings, "registered_business_address");
  const businessTin = getSettingValue(settings, "business_tin");
  const payeeEmail = employee?.email?.trim() ?? "";
  const breakdown = record.breakdown;

  const summaryRows = useMemo(() => {
    const rows: Array<{ label: string; value: number }> = [
      { label: "Gross Pay", value: record.gross },
    ];

    if (breakdown) {
      rows.push(
        { label: "SSS", value: breakdown.employeeSss },
        { label: "PhilHealth", value: breakdown.employeePhilHealth },
        { label: "Pag-IBIG", value: breakdown.employeePagIbig },
        { label: "Withholding Tax", value: breakdown.withholdingTax },
        { label: "Total Deductions", value: breakdown.totalEmployeeDeductions },
        { label: "Net Pay", value: record.netPay },
      );
    } else {
      rows.push(
        { label: "Deductions", value: record.deductions },
        { label: "Net Pay", value: record.netPay },
      );
    }

    return rows;
  }, [breakdown, record.deductions, record.gross, record.netPay]);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    if (!payeeEmail) {
      return;
    }

    const subject = encodeURIComponent(`Payslip ${record.payslipNumber ?? record.period}`);
    const body = encodeURIComponent(
      [
        `Hello ${employee?.name ?? record.employee},`,
        "",
        `Your payslip for ${record.period} is ready.`,
        `Net Pay: ${formatCurrency(record.netPay)}`,
        "",
        "Please open the payroll module and use Print / Save PDF to attach the payslip before sending if needed.",
        "",
        "Thanks,",
        businessName,
      ].join("\n"),
    );

    window.location.href = `mailto:${payeeEmail}?subject=${subject}&body=${body}`;
  };

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div className="journal-modal__overlay payroll-payslip__overlay" onClick={onClose}>
      <div
        className="journal-modal payroll-payslip__sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-payslip-title"
      >
        <div className="journal-modal__header payroll-payslip__header">
          <h2 id="payroll-payslip-title">Payslip</h2>
          <button type="button" className="journal-modal__close" aria-label="Close modal" onClick={onClose}>
            <Icon name="x-circle" size={20} />
          </button>
        </div>

        <div className="payroll-payslip__printRoot">
          <section className="payroll-payslip__company">
            <div className="payroll-payslip__companyBrand">
              {companyLogoUrl ? (
                <div className="payroll-payslip__companyLogoFrame">
                  <img alt={`${businessName} logo`} className="payroll-payslip__companyLogo" src={companyLogoUrl} />
                </div>
              ) : (
                <div className="payroll-payslip__companyMark" aria-hidden="true">
                  <Icon name="bank" size={22} />
                </div>
              )}

              <div>
                <div className="payroll-payslip__companyName">{businessName}</div>
                <div className="payroll-payslip__companyMeta">{businessAddress}</div>
                <div className="payroll-payslip__companyMeta">{businessTin ? `TIN: ${businessTin}` : "TIN not configured"}</div>
              </div>
            </div>

            <div className="payroll-payslip__headerMeta">
              <div>
                <span>Payroll Period</span>
                <strong>{record.period}</strong>
              </div>
              <div>
                <span>Payslip No.</span>
                <strong>{record.payslipNumber ?? "Draft"}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong className={`payroll-statusBadge payroll-statusBadge--${record.status}`}>{record.status}</strong>
              </div>
              <div>
                <span>Pay Date</span>
                <strong>{record.payDate ?? record.periodEnd ?? "-"}</strong>
              </div>
            </div>
          </section>

          <section className="payroll-payslip__employee">
            <div>
              <span>Employee</span>
              <strong>{employee?.name ?? record.employee}</strong>
            </div>
            <div>
              <span>Position</span>
              <strong>{employee?.position ?? "Employee"}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{employee?.email || "Not provided"}</strong>
            </div>
          </section>

          <section className="payroll-payslip__summary">
            {summaryRows.map((row) => (
              <div key={row.label} className={`payroll-payslip__summaryRow ${row.label === "Net Pay" ? "payroll-payslip__summaryRow--strong" : ""}`}>
                <span>{row.label}</span>
                <strong>{formatCurrency(row.value)}</strong>
              </div>
            ))}
          </section>

          {breakdown ? (
            <section className="payroll-payslip__breakdown">
              <h3>Deductions Breakdown</h3>
              <div className="payroll-payslip__breakdownGrid">
                <div className="payroll-payslip__breakdownCell">
                  <span>Employee SSS</span>
                  <strong>{formatCurrency(breakdown.employeeSss)}</strong>
                </div>
                <div className="payroll-payslip__breakdownCell">
                  <span>Employer SSS</span>
                  <strong>{formatCurrency(breakdown.employerSss)}</strong>
                </div>
                <div className="payroll-payslip__breakdownCell">
                  <span>Employee PhilHealth</span>
                  <strong>{formatCurrency(breakdown.employeePhilHealth)}</strong>
                </div>
                <div className="payroll-payslip__breakdownCell">
                  <span>Employer PhilHealth</span>
                  <strong>{formatCurrency(breakdown.employerPhilHealth)}</strong>
                </div>
                <div className="payroll-payslip__breakdownCell">
                  <span>Employee Pag-IBIG</span>
                  <strong>{formatCurrency(breakdown.employeePagIbig)}</strong>
                </div>
                <div className="payroll-payslip__breakdownCell">
                  <span>Employer Pag-IBIG</span>
                  <strong>{formatCurrency(breakdown.employerPagIbig)}</strong>
                </div>
                <div className="payroll-payslip__breakdownCell">
                  <span>Withholding Tax</span>
                  <strong>{formatCurrency(breakdown.withholdingTax)}</strong>
                </div>
                <div className="payroll-payslip__breakdownCell">
                  <span>Monthly Taxable Income</span>
                  <strong>{formatCurrency(breakdown.monthlyTaxableIncome)}</strong>
                </div>
              </div>
            </section>
          ) : null}

          <div className="payroll-payslip__footer">
            <button type="button" className="button button--secondary payroll-payslip__secondary" onClick={handlePrint}>
              <Icon name="download" size={16} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              className="button payroll-payslip__primary"
              onClick={handleEmail}
              disabled={!payeeEmail}
            >
              <Icon name="mail" size={16} />
              <span>Email Payslip</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}

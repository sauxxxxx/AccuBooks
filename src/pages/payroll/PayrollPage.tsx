import { useMemo, useState } from "react";
import { Icon } from "../../components/Icon";
import { useJournalEntriesStore, updateJournalEntries } from "../../data/journalEntriesStore";
import { useSettingsStore } from "../../data/settingsStore";
import { generatePayrollRun, getPayrollPeriod, getPayrollRules } from "../../data/payrollCalculations";
import { updatePayrollStore, usePayrollStore } from "../../data/payrollStore";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { PayslipModal } from "./PayslipModal";
import {
  payrollTabs,
  type NewPayrollEmployeeDraft,
  type PayrollEmployee,
  type PayrollRecord,
  type PayrollTabKey,
} from "./payrollData";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return `\u20B1${currencyFormatter.format(value)}`;
}

function statusClass(status: string) {
  return `payroll-statusBadge--${status}`;
}

function tabIcon(tabIcon: "users" | "file-text") {
  return tabIcon === "users" ? "users" : "statements";
}

function getEmployeeLabel(record: PayrollRecord, employees: PayrollEmployee[]) {
  return employees.find((employee) => employee.id === record.employeeId)?.name ?? record.employee;
}

export function PayrollPage() {
  const [activeTab, setActiveTab] = useState<PayrollTabKey>("employees");
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const payroll = usePayrollStore();
  const settings = useSettingsStore();
  const journalEntries = useJournalEntriesStore();
  const employees = payroll.employees;
  const payrollRecords = payroll.records;
  const payrollRules = useMemo(() => getPayrollRules(settings), [settings]);
  const currentPeriod = useMemo(() => getPayrollPeriod(new Date(), payrollRules.cycle), [payrollRules.cycle]);

  const handleSaveEmployee = (draft: NewPayrollEmployeeDraft) => {
    const fullName = `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim();

    updatePayrollStore((current) => ({
      ...current,
      employees: [
        {
          allowances: draft.allowances,
          basicSalary: draft.basicSalaryMonthly,
          email: draft.email,
          firstName: draft.firstName,
          frequency: "Semi Monthly",
          id: `payroll-employee-${Date.now()}`,
          lastName: draft.lastName,
          name: fullName,
          pagIbigNumber: draft.pagIbigNumber,
          philhealthNumber: draft.philhealthNumber,
          position: draft.position,
          sssNumber: draft.sssNumber,
          status: "active",
          tin: draft.tin,
        },
        ...current.employees,
      ],
    }));

    setAddEmployeeOpen(false);
    setActiveTab("employees");
  };

  const handleRunPayroll = () => {
    const result = generatePayrollRun(employees, settings, new Date(), payrollRecords, journalEntries);

    if (result.records.length === 0) {
      const existingCurrentRecord = payrollRecords.find((record) => record.periodKey === currentPeriod.key) ?? null;

      if (existingCurrentRecord) {
        setSelectedPayslip(existingCurrentRecord);
      }

      setActiveTab("records");
      return;
    }

    updatePayrollStore((current) => ({
      ...current,
      records: [...result.records, ...current.records],
    }));

    if (result.journalEntry) {
      updateJournalEntries((current) => [result.journalEntry!, ...current]);
    }

    setSelectedPayslip(result.records[0] ?? null);
    setActiveTab("records");
  };

  const handleOpenPayslip = (record: PayrollRecord) => {
    setSelectedPayslip(record);
  };

  return (
    <div className="payroll-page">
      <header className="payroll-header">
        <div className="payroll-header__copy">
          <h1 className="payroll-header__title">Payroll</h1>
          <p className="payroll-header__description">Employee management and salary computation</p>
        </div>

        <div className="payroll-header__actions">
          <button
            type="button"
            className="button button--secondary payroll-button payroll-button--secondary"
            onClick={() => setAddEmployeeOpen(true)}
          >
            <Icon name="plus" size={17} />
            <span>Add Employee</span>
          </button>
          <button
            type="button"
            className="button button--primary payroll-button payroll-button--primary"
            onClick={handleRunPayroll}
          >
            <Icon name="play" size={16} />
            <span>Run Payroll</span>
          </button>
        </div>
      </header>

      <nav className="payroll-tabs" role="tablist" aria-label="Payroll views">
        {payrollTabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              type="button"
              className={`payroll-tabs__tab ${isActive ? "payroll-tabs__tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={isActive}
            >
              <Icon name={tabIcon(tab.icon)} size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <main className="payroll-content">
        {activeTab === "employees" ? (
          <section className="payroll-panel">
            <div className="payroll-tableWrap">
              <table className="payroll-table" aria-label="Employees">
                <colgroup>
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>

                <thead>
                  <tr className="payroll-table__headRow">
                    <th className="payroll-table__headCell" scope="col">
                      Name
                    </th>
                    <th className="payroll-table__headCell" scope="col">
                      Position
                    </th>
                    <th className="payroll-table__headCell payroll-table__headCell--right" scope="col">
                      Basic Salary
                    </th>
                    <th className="payroll-table__headCell" scope="col">
                      Frequency
                    </th>
                    <th className="payroll-table__headCell" scope="col">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="payroll-table__row">
                      <td className="payroll-table__cell payroll-table__cell--strong">{employee.name}</td>
                      <td className="payroll-table__cell">{employee.position}</td>
                      <td className="payroll-table__cell payroll-table__cell--mono payroll-table__cell--right">
                        {formatCurrency(employee.basicSalary)}
                      </td>
                      <td className="payroll-table__cell">{employee.frequency}</td>
                      <td className="payroll-table__cell">
                        <span className={`payroll-statusBadge ${statusClass(employee.status)}`}>{employee.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="payroll-panel">
            <div className="payroll-tableWrap">
              <table className="payroll-table" aria-label="Payroll records">
                <colgroup>
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "9%" }} />
                </colgroup>

                <thead>
                  <tr className="payroll-table__headRow">
                    <th className="payroll-table__headCell" scope="col">
                      Employee
                    </th>
                    <th className="payroll-table__headCell" scope="col">
                      Period
                    </th>
                    <th className="payroll-table__headCell payroll-table__headCell--right" scope="col">
                      Gross
                    </th>
                    <th className="payroll-table__headCell payroll-table__headCell--right" scope="col">
                      Deductions
                    </th>
                    <th className="payroll-table__headCell payroll-table__headCell--right" scope="col">
                      Net Pay
                    </th>
                    <th className="payroll-table__headCell" scope="col">
                      Status
                    </th>
                    <th className="payroll-table__headCell payroll-table__headCell--action" scope="col">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payrollRecords.map((record, index) => (
                    <tr
                      key={record.payslipNumber ?? `${record.employee}-${record.period}-${index}`}
                      className="payroll-table__row"
                    >
                      <td className="payroll-table__cell payroll-table__cell--strong">{getEmployeeLabel(record, employees)}</td>
                      <td className="payroll-table__cell payroll-table__cell--period">{record.period}</td>
                      <td className="payroll-table__cell payroll-table__cell--mono payroll-table__cell--right">
                        {formatCurrency(record.gross)}
                      </td>
                      <td className="payroll-table__cell payroll-table__cell--mono payroll-table__cell--right payroll-table__cell--danger">
                        {formatCurrency(record.deductions)}
                      </td>
                      <td className="payroll-table__cell payroll-table__cell--mono payroll-table__cell--right payroll-table__cell--strong">
                        {formatCurrency(record.netPay)}
                      </td>
                      <td className="payroll-table__cell">
                        <span className={`payroll-statusBadge ${statusClass(record.status)}`}>{record.status}</span>
                      </td>
                      <td className="payroll-table__cell payroll-table__cell--action">
                        <button
                          type="button"
                          className="payroll-table__action"
                          aria-label={`Open ${record.employee} payroll record`}
                          onClick={() => handleOpenPayslip(record)}
                        >
                          <Icon name="mail" size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {addEmployeeOpen ? <AddEmployeeModal onClose={() => setAddEmployeeOpen(false)} onSave={handleSaveEmployee} /> : null}
      {selectedPayslip ? (
        <PayslipModal
          employee={employees.find((employee) => employee.id === selectedPayslip.employeeId) ?? null}
          onClose={() => setSelectedPayslip(null)}
          record={selectedPayslip}
          settings={settings}
        />
      ) : null}
    </div>
  );
}

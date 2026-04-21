import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Icon } from "../../components/Icon";
import type { NewPayrollEmployeeDraft } from "./payrollData";

type AddEmployeeModalProps = {
  onClose: () => void;
  onSave: (draft: NewPayrollEmployeeDraft) => void;
};

type AddEmployeeForm = {
  allowances: string;
  basicSalaryMonthly: string;
  email: string;
  firstName: string;
  lastName: string;
  pagIbigNumber: string;
  position: string;
  philhealthNumber: string;
  sssNumber: string;
  tin: string;
};

const DEFAULT_FORM: AddEmployeeForm = {
  allowances: "0",
  basicSalaryMonthly: "",
  email: "",
  firstName: "",
  lastName: "",
  pagIbigNumber: "",
  position: "",
  philhealthNumber: "",
  sssNumber: "",
  tin: "",
};

function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function AddEmployeeModal({ onClose, onSave }: AddEmployeeModalProps) {
  const [form, setForm] = useState<AddEmployeeForm>(DEFAULT_FORM);
  const [error, setError] = useState("");

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

  const handleSave = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const position = form.position.trim();
    const salary = parseMoney(form.basicSalaryMonthly);

    if (!firstName || !lastName || !position || salary <= 0) {
      setError("First name, last name, position, and basic salary are required.");
      return;
    }

    onSave({
      allowances: parseMoney(form.allowances),
      basicSalaryMonthly: salary,
      email: form.email.trim(),
      firstName,
      lastName,
      pagIbigNumber: form.pagIbigNumber.trim(),
      position,
      philhealthNumber: form.philhealthNumber.trim(),
      sssNumber: form.sssNumber.trim(),
      tin: form.tin.trim(),
    });
  };

  const portalTarget = typeof document === "undefined" ? null : document.body;

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div className="journal-modal__overlay" onClick={onClose}>
      <div
        className="journal-modal payroll-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-employee-modal-title"
      >
        <div className="journal-modal__header">
          <h2 id="add-employee-modal-title">Add Employee</h2>
          <button type="button" className="payroll-modal__close" aria-label="Close modal" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <form
          className="journal-modal__form payroll-modal__form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          {error ? <p className="payroll-modal__error">{error}</p> : null}

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>First Name</span>
              <div className="journal-modal__inputWrap">
                <input
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(event) => {
                    setError("");
                    setForm((current) => ({ ...current, firstName: event.target.value }));
                  }}
                  placeholder=""
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Last Name</span>
              <div className="journal-modal__inputWrap">
                <input
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(event) => {
                    setError("");
                    setForm((current) => ({ ...current, lastName: event.target.value }));
                  }}
                  placeholder=""
                />
              </div>
            </label>
          </div>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Email</span>
              <div className="journal-modal__inputWrap">
                <input
                  autoComplete="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder=""
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Position</span>
              <div className="journal-modal__inputWrap">
                <input
                  autoComplete="organization-title"
                  value={form.position}
                  onChange={(event) => {
                    setError("");
                    setForm((current) => ({ ...current, position: event.target.value }));
                  }}
                  placeholder=""
                />
              </div>
            </label>
          </div>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Basic Salary (Monthly)</span>
              <div className="journal-modal__inputWrap">
                <input
                  inputMode="decimal"
                  type="number"
                  value={form.basicSalaryMonthly}
                  onChange={(event) => {
                    setError("");
                    setForm((current) => ({ ...current, basicSalaryMonthly: event.target.value }));
                  }}
                  placeholder="0"
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Allowances</span>
              <div className="journal-modal__inputWrap">
                <input
                  inputMode="decimal"
                  type="number"
                  value={form.allowances}
                  onChange={(event) => setForm((current) => ({ ...current, allowances: event.target.value }))}
                  placeholder="0"
                />
              </div>
            </label>
          </div>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>TIN</span>
              <div className="journal-modal__inputWrap">
                <input
                  value={form.tin}
                  onChange={(event) => setForm((current) => ({ ...current, tin: event.target.value }))}
                  placeholder=""
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>SSS #</span>
              <div className="journal-modal__inputWrap">
                <input
                  value={form.sssNumber}
                  onChange={(event) => setForm((current) => ({ ...current, sssNumber: event.target.value }))}
                  placeholder=""
                />
              </div>
            </label>
          </div>

          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>PhilHealth #</span>
              <div className="journal-modal__inputWrap">
                <input
                  value={form.philhealthNumber}
                  onChange={(event) => setForm((current) => ({ ...current, philhealthNumber: event.target.value }))}
                  placeholder=""
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Pag-IBIG #</span>
              <div className="journal-modal__inputWrap">
                <input
                  value={form.pagIbigNumber}
                  onChange={(event) => setForm((current) => ({ ...current, pagIbigNumber: event.target.value }))}
                  placeholder=""
                />
              </div>
            </label>
          </div>

          <div className="journal-modal__footer payroll-modal__footer">
            <button type="button" className="button button--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button payroll-modal__save">
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget,
  );
}

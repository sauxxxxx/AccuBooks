import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import type { SupplierDraft, SupplierRecord, SupplierStatus } from "./suppliersData";
import { supplierStatusOptions } from "./suppliersData";

type SupplierForm = {
  address: string;
  contactPerson: string;
  email: string;
  name: string;
  notes: string;
  phone: string;
  status: SupplierStatus;
  tin: string;
};

type StatusMenuState = {
  left: number;
  top: number;
  width: number;
};

type SupplierModalProps = {
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (draft: SupplierDraft) => void;
  supplier?: SupplierRecord | null;
};

function createInitialForm(supplier?: SupplierRecord | null): SupplierForm {
  if (!supplier) {
    return {
      address: "",
      contactPerson: "",
      email: "",
      name: "",
      notes: "",
      phone: "",
      status: "active",
      tin: "",
    };
  }

  return {
    address: supplier.address,
    contactPerson: supplier.contactPerson,
    email: supplier.email,
    name: supplier.name,
    notes: supplier.notes,
    phone: supplier.phone,
    status: supplier.status,
    tin: supplier.tin,
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

function formatStatusLabel(value: SupplierStatus) {
  return value === "active" ? "Active" : "Inactive";
}

export function SupplierModal({ mode, onClose, onSave, supplier }: SupplierModalProps) {
  const [form, setForm] = useState<SupplierForm>(() => createInitialForm(supplier));
  const [statusMenu, setStatusMenu] = useState<StatusMenuState | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const portalTarget = typeof document === "undefined" ? null : document.body;
  const title = mode === "create" ? "Add Supplier" : "Edit Supplier";
  const saveLabel = mode === "create" ? "Save Supplier" : "Update Supplier";

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
      const withinTrigger = statusRef.current && target instanceof Node && statusRef.current.contains(target);
      const withinMenu = Boolean(targetElement?.closest("[data-supplier-status-menu]"));

      if (!withinTrigger && !withinMenu) {
        setStatusMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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
  }, [onClose, statusMenu]);

  const handleOpenStatusMenu = () => {
    const rect = statusRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const menuWidth = Math.min(Math.max(Math.round(rect.width), 220), window.innerWidth - 24);
    const placement = menuPlacement(rect, 116, menuWidth);

    setStatusMenu({
      ...placement,
    });
  };

  const handleSubmit = () => {
    onSave({
      address: form.address,
      contactPerson: form.contactPerson,
      email: form.email,
      name: form.name,
      notes: form.notes,
      phone: form.phone,
      status: form.status,
      tin: form.tin,
    });
  };

  const statusMenuNode =
    portalTarget && statusMenu
      ? createPortal(
          <div
            className="journal-modal__selectMenu journal-modal__selectMenu--portal clients-modal__selectMenu--portal"
            data-supplier-status-menu
            role="listbox"
            aria-label="Supplier status"
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
            {supplierStatusOptions.map((option) => {
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
                  <span>{formatStatusLabel(option)}</span>
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
        aria-labelledby="suppliers-modal-title"
      >
        <div className="journal-modal__header">
          <h2 id="suppliers-modal-title">{title}</h2>
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
              <div className="journal-modal__inputWrap">
                <button
                  type="button"
                  className="journal-modal__selectButton"
                  onClick={handleOpenStatusMenu}
                  aria-haspopup="listbox"
                  aria-expanded={Boolean(statusMenu)}
                >
                  <span>{formatStatusLabel(form.status)}</span>
                  <Icon name="chevron-down" size={16} />
                </button>
              </div>
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

          <label className="journal-modal__field journal-modal__field--full">
            <span>Notes</span>
            <div className="journal-modal__inputWrap">
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
              />
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

      {statusMenuNode}
    </div>,
    portalTarget,
  );
}

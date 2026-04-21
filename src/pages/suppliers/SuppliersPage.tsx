import { useMemo, useState } from "react";
import { Icon } from "../../components/Icon";
import { SupplierModal } from "./SupplierModal";
import { type SupplierDraft, type SupplierRecord } from "./suppliersData";
import { updateSuppliersStore, useSuppliersStore } from "../../data/suppliersStore";

function formatStatusLabel(status: SupplierRecord["status"]) {
  return status === "active" ? "active" : "inactive";
}

function draftToSupplierRecord(draft: SupplierDraft, existing?: SupplierRecord): SupplierRecord {
  return {
    address: draft.address.trim(),
    contactPerson: draft.contactPerson.trim(),
    email: draft.email.trim(),
    id: existing?.id ?? `supplier-${Date.now()}`,
    name: draft.name.trim(),
    notes: draft.notes.trim(),
    phone: draft.phone.trim(),
    status: draft.status,
    tin: draft.tin.trim(),
  };
}

export function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const suppliers = useSuppliersStore();

  const filteredSuppliers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return suppliers;
    }

    return suppliers.filter((supplier) => {
      const haystack = [supplier.name, supplier.contactPerson, supplier.email, supplier.tin, supplier.address, supplier.status]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchQuery, suppliers]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEdit = (supplier: SupplierRecord) => {
    setEditingSupplier(supplier);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (draft: SupplierDraft) => {
    const nextSupplier = draftToSupplierRecord(draft, editingSupplier ?? undefined);

    updateSuppliersStore((current) => {
      if (editingSupplier) {
        return current.map((supplier) => (supplier.id === editingSupplier.id ? nextSupplier : supplier));
      }

      return [nextSupplier, ...current];
    });

    setEditingSupplier(null);
    setIsSupplierModalOpen(false);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find((entry) => entry.id === supplierId);

    if (!supplier) {
      return;
    }

    const confirmed = window.confirm(`Delete ${supplier.name}?`);

    if (!confirmed) {
      return;
    }

    updateSuppliersStore((current) => current.filter((entry) => entry.id !== supplierId));
    setEditingSupplier((current) => (current?.id === supplierId ? null : current));
  };

  return (
    <div className="clients-page">
      <header className="clients-header">
        <div className="clients-header__copy">
          <h1 className="clients-header__title">Suppliers</h1>
          <p className="clients-header__description">Manage supplier information</p>
        </div>

        <button
          type="button"
          className="button button--primary clients-button clients-button--primary"
          onClick={handleOpenCreate}
        >
          <Icon name="plus" size={17} />
          <span>Add Supplier</span>
        </button>
      </header>

      <section className="clients-searchCard" aria-label="Search suppliers">
        <div className="clients-searchField">
          <Icon name="search" size={17} />
          <input
            type="search"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </section>

      <section className="clients-panel" aria-labelledby="suppliers-table-title">
        <table className="clients-table" aria-label="Suppliers">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>

          <thead>
            <tr className="clients-table__headRow">
              <th className="clients-table__headCell" id="suppliers-table-title" scope="col">
                Name
              </th>
              <th className="clients-table__headCell" scope="col">
                Contact
              </th>
              <th className="clients-table__headCell" scope="col">
                Email
              </th>
              <th className="clients-table__headCell" scope="col">
                TIN
              </th>
              <th className="clients-table__headCell" scope="col">
                Status
              </th>
              <th className="clients-table__headCell clients-table__headCell--actions" scope="col">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="clients-table__row">
                  <td className="clients-table__cell clients-table__cell--strong">{supplier.name}</td>
                  <td className="clients-table__cell">{supplier.contactPerson}</td>
                  <td className="clients-table__cell">{supplier.email}</td>
                  <td className="clients-table__cell clients-table__cell--mono">{supplier.tin}</td>
                  <td className="clients-table__cell">
                    <span className={`clients-statusBadge clients-statusBadge--${supplier.status}`}>
                      {formatStatusLabel(supplier.status)}
                    </span>
                  </td>
                  <td className="clients-table__cell clients-table__cell--actions">
                    <button
                      type="button"
                      className="clients-table__action"
                      aria-label={`Edit ${supplier.name}`}
                      onClick={() => handleOpenEdit(supplier)}
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      type="button"
                      className="clients-table__action clients-table__action--danger"
                      aria-label={`Delete ${supplier.name}`}
                      onClick={() => handleDeleteSupplier(supplier.id)}
                    >
                      <Icon name="trash-2" size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="clients-table__row">
                <td className="clients-table__emptyCell" colSpan={6}>
                  No suppliers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {isSupplierModalOpen ? (
        <SupplierModal
          key={editingSupplier?.id ?? "create"}
          mode={editingSupplier ? "edit" : "create"}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setEditingSupplier(null);
          }}
          onSave={handleSaveSupplier}
          supplier={editingSupplier}
        />
      ) : null}
    </div>
  );
}

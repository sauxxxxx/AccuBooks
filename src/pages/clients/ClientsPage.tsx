import { useMemo, useState } from "react";
import { Icon } from "../../components/Icon";
import { ClientDetailsModal } from "./ClientDetailsModal";
import { ClientModal } from "./ClientModal";
import {
  type ClientDraft,
  type ClientRecord,
} from "./clientsData";
import { updateClientsStore, useClientsStore } from "../../data/clientsStore";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

function parseAmount(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitAddOns(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function draftToClientRecord(draft: ClientDraft, existing?: ClientRecord): ClientRecord {
  const monthlyBilling = parseAmount(draft.monthlyBilling);
  const oneTimeFees = parseAmount(draft.oneTimeFees);

  return {
    addOns: splitAddOns(draft.addOnServices),
    address: draft.address.trim(),
    contactPerson: draft.contactPerson.trim(),
    contractEnd: draft.contractEnd.trim(),
    contractStart: draft.contractStart.trim(),
    email: draft.email.trim(),
    id: existing?.id ?? `client-${Date.now()}`,
    monthlyBilling,
    name: draft.name.trim(),
    notes: draft.notes.trim(),
    oneTimeFees,
    packageName: draft.packageName.trim(),
    phone: draft.phone.trim(),
    recentPayments: existing?.recentPayments ?? [],
    status: draft.status,
    tin: draft.tin.trim(),
    totalBilled: existing?.totalBilled ?? 0,
    totalPaid: existing?.totalPaid ?? 0,
  };
}

export function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const clients = useClientsStore();

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((client) => {
      const haystack = [
        client.name,
        client.email,
        client.packageName,
        client.status,
        client.contactPerson,
        client.phone,
        client.address,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [clients, searchQuery]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  const handleOpenEdit = (client: ClientRecord) => {
    setSelectedClient(null);
    setEditingClient(client);
    setIsClientModalOpen(true);
  };

  const handleSaveClient = (draft: ClientDraft) => {
    const nextClient = draftToClientRecord(draft, editingClient ?? undefined);

    updateClientsStore((current) => {
      if (editingClient) {
        return current.map((client) => (client.id === editingClient.id ? nextClient : client));
      }

      return [nextClient, ...current];
    });

    setSelectedClient((current) => (current && editingClient && current.id === editingClient.id ? nextClient : current));
    setEditingClient(null);
    setIsClientModalOpen(false);
  };

  const handleDeleteClient = (clientId: string) => {
    const client = clients.find((entry) => entry.id === clientId);

    if (!client) {
      return;
    }

    const confirmed = window.confirm(`Delete ${client.name}?`);

    if (!confirmed) {
      return;
    }

    updateClientsStore((current) => current.filter((entry) => entry.id !== clientId));
    setSelectedClient((current) => (current?.id === clientId ? null : current));
    setEditingClient((current) => (current?.id === clientId ? null : current));
  };

  return (
    <div className="clients-page">
      <header className="clients-header">
        <div className="clients-header__copy">
          <h1 className="clients-header__title">Clients</h1>
          <p className="clients-header__description">Manage client profiles and billing</p>
        </div>

        <button type="button" className="button button--primary clients-button clients-button--primary" onClick={handleOpenCreate}>
          <Icon name="plus" size={17} />
          <span>Add Client</span>
        </button>
      </header>

      <section className="clients-searchCard" aria-label="Search clients">
        <div className="clients-searchField">
          <Icon name="search" size={17} />
          <input
            type="search"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </section>

      <section className="clients-panel" aria-labelledby="clients-table-title">
        <table className="clients-table" aria-label="Clients">
          <colgroup>
            <col style={{ width: "24%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>

          <thead>
            <tr className="clients-table__headRow">
              <th className="clients-table__headCell" id="clients-table-title" scope="col">
                Name
              </th>
              <th className="clients-table__headCell" scope="col">
                Email
              </th>
              <th className="clients-table__headCell" scope="col">
                Package
              </th>
              <th className="clients-table__headCell clients-table__headCell--right" scope="col">
                Monthly Billing
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
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr key={client.id} className="clients-table__row">
                  <td className="clients-table__cell clients-table__cell--strong">{client.name}</td>
                  <td className="clients-table__cell">{client.email}</td>
                  <td className="clients-table__cell">{client.packageName}</td>
                  <td className="clients-table__cell clients-table__cell--mono clients-table__cell--right">
                    {formatCurrency(client.monthlyBilling)}
                  </td>
                  <td className="clients-table__cell">
                    <span className={`clients-statusBadge clients-statusBadge--${client.status}`}>{client.status}</span>
                  </td>
                  <td className="clients-table__cell clients-table__cell--actions">
                    <button
                      type="button"
                      className="clients-table__action"
                      aria-label={`View ${client.name}`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <Icon name="eye" size={16} />
                    </button>
                    <button
                      type="button"
                      className="clients-table__action"
                      aria-label={`Edit ${client.name}`}
                      onClick={() => handleOpenEdit(client)}
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      type="button"
                      className="clients-table__action clients-table__action--danger"
                      aria-label={`Delete ${client.name}`}
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Icon name="trash-2" size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="clients-table__row">
                <td className="clients-table__emptyCell" colSpan={6}>
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {isClientModalOpen ? (
        <ClientModal
          key={editingClient?.id ?? "create"}
          client={editingClient}
          mode={editingClient ? "edit" : "create"}
          onClose={() => {
            setIsClientModalOpen(false);
            setEditingClient(null);
          }}
          onSave={handleSaveClient}
        />
      ) : null}

      {selectedClient ? <ClientDetailsModal client={selectedClient} onClose={() => setSelectedClient(null)} /> : null}
    </div>
  );
}

import { useMemo, useState } from "react";
import { JournalEntriesHeader } from "./JournalEntriesHeader";
import { JournalEntriesTabs } from "./JournalEntriesTabs";
import { JournalEntryDetailsModal } from "./JournalEntryDetailsModal";
import { JournalEntriesTable } from "./JournalEntriesTable";
import { JournalEntryModal } from "./JournalEntryModal";
import {
  type JournalEntry,
  type JournalEntryDraft,
  type JournalFilter,
} from "./journalEntriesData";
import { updateJournalEntries, useJournalEntriesStore } from "../../data/journalEntriesStore";

function formatEntryNumber(nextIndex: number) {
  return `JE-2026-${String(nextIndex).padStart(3, "0")}`;
}

function deriveJournalGroup(transactionType: JournalEntryDraft["transactionType"]): JournalEntry["journal"] {
  switch (transactionType) {
    case "Income":
      return "Cash Receipts";
    case "Expense":
      return "Cash Disbursements";
    default:
      return "General";
  }
}

function getNextEntryIndex(entries: JournalEntry[]) {
  return entries.reduce((highest, entry) => {
    const entryParts = entry.entryNumber.split("-");
    const suffix = Number.parseInt(entryParts[entryParts.length - 1] ?? "0", 10);
    return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
  }, 0) + 1;
}

export function JournalEntriesPage() {
  const [activeFilter, setActiveFilter] = useState<JournalFilter>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const entries = useJournalEntriesStore();

  const filteredEntries = useMemo(() => {
    if (activeFilter === "All") {
      return entries;
    }

    return entries.filter((entry) => entry.journal === activeFilter);
  }, [activeFilter, entries]);

  const handleSaveEntry = (draft: JournalEntryDraft) => {
    const debitTotal = draft.lineItems.reduce((sum, item) => sum + item.debit, 0);
    const creditTotal = draft.lineItems.reduce((sum, item) => sum + item.credit, 0);
    updateJournalEntries((current) => {
      const nextEntry: JournalEntry = {
        credit: Math.max(debitTotal, creditTotal),
        date: draft.date,
        debit: Math.max(debitTotal, creditTotal),
        client: draft.client.trim() || undefined,
        description: draft.description.trim() || "New journal entry",
        entryNumber: formatEntryNumber(getNextEntryIndex(current)),
        journal: deriveJournalGroup(draft.transactionType),
        lineItems: draft.lineItems,
        reference: draft.reference.trim() || undefined,
        status: "draft",
        transactionType: draft.transactionType,
      };

      return [nextEntry, ...current];
    });
    setIsModalOpen(false);
  };

  return (
    <div className="journal-page">
      <JournalEntriesHeader
        onCreateEntry={() => {
          setSelectedEntry(null);
          setIsModalOpen(true);
        }}
      />
      <JournalEntriesTabs activeFilter={activeFilter} onChange={setActiveFilter} />
      <JournalEntriesTable
        entries={filteredEntries}
        onView={(entry) => {
          setIsModalOpen(false);
          setSelectedEntry(entry);
        }}
      />

      {isModalOpen ? <JournalEntryModal onClose={() => setIsModalOpen(false)} onSave={handleSaveEntry} /> : null}
      {selectedEntry ? <JournalEntryDetailsModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} /> : null}
    </div>
  );
}

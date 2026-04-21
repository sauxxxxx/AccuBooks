import type { JournalFilter } from "./journalEntriesData";
import { journalFilters } from "./journalEntriesData";

type JournalEntriesTabsProps = {
  activeFilter: JournalFilter;
  onChange: (filter: JournalFilter) => void;
};

export function JournalEntriesTabs({ activeFilter, onChange }: JournalEntriesTabsProps) {
  return (
    <div className="journal-tabs" role="tablist" aria-label="Journal entry filters">
      {journalFilters.map((filter) => (
        <button
          key={filter}
          type="button"
          className={`journal-tabs__tab ${filter === activeFilter ? "journal-tabs__tab--active" : ""}`}
          role="tab"
          aria-selected={filter === activeFilter}
          onClick={() => onChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

import { Icon } from "../../components/Icon";

type JournalEntriesHeaderProps = {
  onCreateEntry: () => void;
};

export function JournalEntriesHeader({ onCreateEntry }: JournalEntriesHeaderProps) {
  return (
    <header className="journal-header">
      <div className="journal-header__copy">
        <h1 className="journal-header__title">Journal Entries</h1>
        <p className="journal-header__description">Record and manage accounting transactions</p>
      </div>

      <button type="button" className="button button--primary journal-header__action" onClick={onCreateEntry}>
        <Icon name="plus" size={18} />
        <span>New Entry</span>
      </button>
    </header>
  );
}

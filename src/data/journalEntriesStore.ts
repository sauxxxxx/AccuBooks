import { useSyncExternalStore } from "react";
import { journalEntries as initialJournalEntries, type JournalEntry } from "../pages/journal-entries/journalEntriesData";

type JournalEntriesUpdater = (current: JournalEntry[]) => JournalEntry[];

let journalEntriesState: JournalEntry[] = [...initialJournalEntries];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return journalEntriesState;
}

export function useJournalEntriesStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function updateJournalEntries(updater: JournalEntriesUpdater) {
  journalEntriesState = updater(journalEntriesState);
  emitChange();
}


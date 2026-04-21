import { useSyncExternalStore } from "react";

type Updater<T> = (current: T) => T;

export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<() => void>();

  const getSnapshot = () => state;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const emitChange = () => {
    listeners.forEach((listener) => listener());
  };

  const useStore = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const update = (updater: Updater<T>) => {
    state = updater(state);
    emitChange();
  };

  const set = (nextState: T) => {
    state = nextState;
    emitChange();
  };

  return {
    getSnapshot,
    set,
    update,
    useStore,
  };
}


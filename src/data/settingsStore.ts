import { createStore } from "./createStore";
import { settings as initialSettings, type SettingRecord } from "../pages/settings/settingsData";

const settingsStore = createStore<SettingRecord[]>([...initialSettings]);

export const useSettingsStore = settingsStore.useStore;
export const updateSettingsStore = settingsStore.update;
export const setSettingsStore = settingsStore.set;


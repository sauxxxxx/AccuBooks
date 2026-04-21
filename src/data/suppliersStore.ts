import { createStore } from "./createStore";
import { suppliers as initialSuppliers, type SupplierRecord } from "../pages/suppliers/suppliersData";

const suppliersStore = createStore<SupplierRecord[]>([...initialSuppliers]);

export const useSuppliersStore = suppliersStore.useStore;
export const updateSuppliersStore = suppliersStore.update;
export const setSuppliersStore = suppliersStore.set;


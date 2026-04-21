import { createStore } from "./createStore";
import { invoiceRows as initialInvoices, type InvoiceRecord } from "../pages/invoicing/invoicingData";

const invoicesStore = createStore<InvoiceRecord[]>([...initialInvoices]);

export const useInvoicesStore = invoicesStore.useStore;
export const updateInvoicesStore = invoicesStore.update;
export const setInvoicesStore = invoicesStore.set;


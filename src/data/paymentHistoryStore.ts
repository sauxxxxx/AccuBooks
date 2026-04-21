import { createStore } from "./createStore";
import { paymentHistory as initialPaymentHistory, type PaymentHistoryRow } from "../pages/ar-ap/arApData";

const paymentHistoryStore = createStore<PaymentHistoryRow[]>([...initialPaymentHistory]);

export const usePaymentHistoryStore = paymentHistoryStore.useStore;
export const updatePaymentHistoryStore = paymentHistoryStore.update;
export const setPaymentHistoryStore = paymentHistoryStore.set;


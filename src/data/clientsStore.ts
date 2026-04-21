import { createStore } from "./createStore";
import { clients as initialClients, type ClientRecord } from "../pages/clients/clientsData";

const clientsStore = createStore<ClientRecord[]>([...initialClients]);

export const useClientsStore = clientsStore.useStore;
export const updateClientsStore = clientsStore.update;
export const setClientsStore = clientsStore.set;


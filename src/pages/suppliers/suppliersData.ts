export type SupplierStatus = "active" | "inactive";

export type SupplierRecord = {
  address: string;
  contactPerson: string;
  email: string;
  id: string;
  name: string;
  notes: string;
  phone: string;
  status: SupplierStatus;
  tin: string;
};

export type SupplierDraft = {
  address: string;
  contactPerson: string;
  email: string;
  name: string;
  notes: string;
  phone: string;
  status: SupplierStatus;
  tin: string;
};

export const supplierStatusOptions: SupplierStatus[] = ["active", "inactive"];

export const suppliers: SupplierRecord[] = [
  {
    address: "Makati City",
    contactPerson: "Account Manager",
    email: "billing@globe.com.ph",
    id: "supplier-1",
    name: "Globe Telecom",
    notes: "Telecom and internet service provider.",
    phone: "09171234567",
    status: "active",
    tin: "004-628-000-000",
  },
  {
    address: "Makati City",
    contactPerson: "Property Manager",
    email: "rental@makatiofficerental.ph",
    id: "supplier-2",
    name: "Makati Office Rentals Inc.",
    notes: "Office lease and utilities billing.",
    phone: "09182345678",
    status: "active",
    tin: "008-765-432-000",
  },
  {
    address: "Pasig City",
    contactPerson: "Customer Service",
    email: "customercare@meralco.com.ph",
    id: "supplier-3",
    name: "Meralco",
    notes: "Electricity billing and service support.",
    phone: "09193456789",
    status: "active",
    tin: "000-418-000-000",
  },
  {
    address: "Quezon City",
    contactPerson: "Corporate Sales",
    email: "corporate@nbs.com.ph",
    id: "supplier-4",
    name: "National Book Store",
    notes: "Office supplies and reference materials.",
    phone: "09184567890",
    status: "active",
    tin: "005-123-456-000",
  },
  {
    address: "Manila",
    contactPerson: "Operations",
    email: "ops@philpost.com.ph",
    id: "supplier-5",
    name: "PhilPost Logistics",
    notes: "Document and parcel delivery services.",
    phone: "09195678901",
    status: "active",
    tin: "003-234-567-000",
  },
];

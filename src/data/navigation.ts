import type { IconName } from "../components/Icon";
import type { SectionKey } from "./types";

export type NavItem = {
  icon: IconName;
  label: string;
  path: string;
};

type Section = {
  description: string;
  path: string;
  title: string;
};

export const navItems: NavItem[] = [
  { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
  { icon: "journal", label: "Journal Entries", path: "/journal-entries" },
  { icon: "accounts", label: "Chart of Accounts", path: "/chart-of-accounts" },
  { icon: "statements", label: "Financial Statements", path: "/financial-statements" },
  { icon: "compliance", label: "BIR Compliance", path: "/bir-compliance" },
  { icon: "payroll", label: "Payroll", path: "/payroll" },
  { icon: "invoicing", label: "Invoicing", path: "/invoicing" },
  { icon: "arap", label: "AR / AP", path: "/ar-ap" },
  { icon: "clients", label: "Clients", path: "/clients" },
  { icon: "suppliers", label: "Suppliers", path: "/suppliers" },
  { icon: "settings", label: "Settings", path: "/settings" },
];

export const sections: Record<SectionKey, Section> = {
  dashboard: {
    title: "Dashboard",
    path: "/dashboard",
    description: "Accounting workspace shell.",
  },
  "journal-entries": {
    title: "Journal Entries",
    path: "/journal-entries",
    description: "Journal entries.",
  },
  "chart-of-accounts": {
    title: "Chart of Accounts",
    path: "/chart-of-accounts",
    description: "Chart of accounts.",
  },
  "financial-statements": {
    title: "Financial Statements",
    path: "/financial-statements",
    description: "Financial statements.",
  },
  "bir-compliance": {
    title: "BIR Compliance",
    path: "/bir-compliance",
    description: "BIR compliance.",
  },
  payroll: {
    title: "Payroll",
    path: "/payroll",
    description: "Payroll.",
  },
  invoicing: {
    title: "Invoicing",
    path: "/invoicing",
    description: "Invoicing.",
  },
  "ar-ap": {
    title: "AR / AP",
    path: "/ar-ap",
    description: "AR and AP.",
  },
  clients: {
    title: "Clients",
    path: "/clients",
    description: "Clients.",
  },
  suppliers: {
    title: "Suppliers",
    path: "/suppliers",
    description: "Suppliers.",
  },
  settings: {
    title: "Settings",
    path: "/settings",
    description: "Settings.",
  },
};

import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ArApPage } from "./pages/ar-ap/ArApPage";
import { ChartOfAccountsPage } from "./pages/chart-of-accounts/ChartOfAccountsPage";
import { BirCompliancePage } from "./pages/bir-compliance/BIRCompliancePage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { FinancialStatementsPage } from "./pages/financial-statements/FinancialStatementsPage";
import { ClientsPage } from "./pages/clients/ClientsPage";
import { InvoicingPage } from "./pages/invoicing/InvoicingPage";
import { JournalEntriesPage } from "./pages/journal-entries/JournalEntriesPage";
import { PayrollPage } from "./pages/payroll/PayrollPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { SuppliersPage } from "./pages/suppliers/SuppliersPage";
import { SectionPage } from "./pages/SectionPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="journal-entries" element={<JournalEntriesPage />} />
        <Route path="chart-of-accounts" element={<ChartOfAccountsPage />} />
        <Route path="financial-statements" element={<FinancialStatementsPage />} />
        <Route path="bir-compliance" element={<BirCompliancePage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="invoicing" element={<InvoicingPage />} />
        <Route path="ar-ap" element={<ArApPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate replace to="/dashboard" />} />
      </Route>
    </Routes>
  );
}

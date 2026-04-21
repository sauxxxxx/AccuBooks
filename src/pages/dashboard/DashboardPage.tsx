import { useState } from "react";
import { CashFlowChart } from "./CashFlowChart";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSummaryCards } from "./DashboardSummaryCards";
import { DashboardTabs } from "./DashboardTabs";
import { ExpenseBreakdown } from "./ExpenseBreakdown";
import { RecentTransactions } from "./RecentTransactions";
import type { DashboardTab } from "./dashboardData";

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("Weekly");

  return (
    <div className="dashboard-page">
      <DashboardHeader description="Cash flow overview and financial summary" filterLabel="All Clients" title="Dashboard" />

      <DashboardSummaryCards />

      <DashboardTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="dashboard-page__grid">
        <CashFlowChart period={activeTab} />
        <ExpenseBreakdown />
      </div>

      <RecentTransactions />
    </div>
  );
}

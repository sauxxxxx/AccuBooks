import { dashboardTabs, type DashboardTab } from "./dashboardData";

type DashboardTabsProps = {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

export function DashboardTabs({ activeTab, onChange }: DashboardTabsProps) {

  return (
    <div className="dashboard-tabs" role="tablist" aria-label="Cash flow range">
      {dashboardTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`dashboard-tabs__tab ${tab === activeTab ? "dashboard-tabs__tab--active" : ""}`}
          role="tab"
          aria-selected={tab === activeTab}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

import { Icon } from "../../components/Icon";

type DashboardHeaderProps = {
  description: string;
  filterLabel: string;
  title: string;
};

export function DashboardHeader({ description, filterLabel, title }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__copy">
        <h1 className="dashboard-header__title">{title}</h1>
        <p className="dashboard-header__description">{description}</p>
      </div>

      <button type="button" className="dashboard-filter" aria-label={`Filter by ${filterLabel}`}>
        <span>{filterLabel}</span>
        <Icon name="chevron-down" size={18} />
      </button>
    </header>
  );
}

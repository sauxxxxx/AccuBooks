type DashboardHeaderProps = {
  description: string;
  title: string;
};

export function DashboardHeader({ description, title }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__copy">
        <h1 className="dashboard-header__title">{title}</h1>
        <p className="dashboard-header__description">{description}</p>
      </div>
    </header>
  );
}

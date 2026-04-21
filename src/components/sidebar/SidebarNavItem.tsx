import { NavLink } from "react-router-dom";
import type { NavItem } from "../../data/navigation";
import { Icon } from "../Icon";

type SidebarNavItemProps = {
  collapsed: boolean;
  item: NavItem;
  onCloseMobile: () => void;
};

export function SidebarNavItem({ collapsed, item, onCloseMobile }: SidebarNavItemProps) {
  return (
    <NavLink
      aria-label={item.label}
      className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
      onClick={onCloseMobile}
      title={collapsed ? item.label : undefined}
      to={item.path}
    >
      <span className="sidebar__linkIcon" aria-hidden="true">
        <Icon name={item.icon} size={22} />
      </span>
      <span className="sidebar__linkLabel">{item.label}</span>
    </NavLink>
  );
}

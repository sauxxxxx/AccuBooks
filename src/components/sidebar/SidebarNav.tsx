import type { NavItem } from "../../data/navigation";
import { SidebarNavItem } from "./SidebarNavItem";

type SidebarNavProps = {
  collapsed: boolean;
  items: NavItem[];
  onCloseMobile: () => void;
};

export function SidebarNav({ collapsed, items, onCloseMobile }: SidebarNavProps) {
  return (
    <nav className="sidebar__nav" aria-label="Primary">
      {items.map((item) => (
        <SidebarNavItem key={item.path} collapsed={collapsed} item={item} onCloseMobile={onCloseMobile} />
      ))}
    </nav>
  );
}

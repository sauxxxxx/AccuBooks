import { navItems } from "../data/navigation";
import { SidebarBrand } from "./sidebar/SidebarBrand";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { SidebarNav } from "./sidebar/SidebarNav";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}>
      <SidebarBrand />
      <SidebarNav collapsed={collapsed} items={navItems} onCloseMobile={onCloseMobile} />
      <SidebarFooter collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
    </aside>
  );
}

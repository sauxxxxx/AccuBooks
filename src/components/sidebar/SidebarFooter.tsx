import { Icon } from "../Icon";

type SidebarFooterProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function SidebarFooter({ collapsed, onToggleCollapse }: SidebarFooterProps) {
  return (
    <div className="sidebar__footer">
      <button type="button" className="sidebar__collapseButton" onClick={onToggleCollapse}>
        <span className="sidebar__collapseIcon" aria-hidden="true">
          <Icon name={collapsed ? "collapse-right" : "collapse-left"} size={22} />
        </span>
        <span className="sidebar__collapseLabel">{collapsed ? "Expand" : "Collapse"}</span>
      </button>
    </div>
  );
}

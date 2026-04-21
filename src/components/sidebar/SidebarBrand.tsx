import { Icon } from "../Icon";

export function SidebarBrand() {
  return (
    <div className="sidebar__brand">
      <div className="sidebar__brandMark" aria-hidden="true">
        <Icon name="bank" className="sidebar__brandMarkIcon" size={24} />
      </div>
      <div className="sidebar__brandText">
        <div className="sidebar__brandName">AccuBooks</div>
        <div className="sidebar__brandSubtext">PH ACCOUNTING</div>
      </div>
    </div>
  );
}

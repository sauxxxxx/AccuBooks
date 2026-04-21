import { Icon } from "./Icon";

type TopbarProps = {
  onOpenMobileNav: () => void;
};

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="topbar__menuButton" onClick={onOpenMobileNav} aria-label="Open navigation">
          <Icon name="menu" size={20} />
        </button>
      </div>

      <label className="topbar__search">
        <Icon name="search" className="topbar__searchIcon" size={17} />
        <input
          aria-label="Search across AccuBooks"
          placeholder="Search journal entries, clients, accounts"
          type="search"
        />
      </label>

      <div className="topbar__right">
        <button type="button" className="topbar__iconButton" aria-label="Notifications">
          <Icon name="bell" size={18} />
        </button>

        <button type="button" className="topbar__accountButton" aria-label="Account">
          <Icon name="user" size={18} />
        </button>
      </div>
    </header>
  );
}

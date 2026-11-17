import { navItems } from "../../constants";
import type { Page } from "../../types";

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function Sidebar({ page, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand-mark">E</div>
      <div className="brand-name">
        Employee<span>Hub</span>
      </div>

      <div className="sidebar-caption">WORKSPACE</div>

      <nav className="side-nav" aria-label="Main navigation">
        {navItems.map(([item, icon]) => (
          <button
            type="button"
            key={item}
            className={`nav-link ${page === item ? "active" : ""}`}
            onClick={() => onNavigate(item)}
          >
            <span className="nav-icon">{icon}</span>
            {item}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <span className="status-dot" />
        <div>
          <strong>Workspace active</strong>
          <small>Employee management</small>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-outline-light mt-3"
        onClick={onLogout}
      >
        Sign Out
      </button>
    </aside>
  );
}

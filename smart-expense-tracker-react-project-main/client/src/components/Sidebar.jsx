import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "active-sidebar-link" : "";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/dashboard" className="logo">
          <span className="logo-icon">💰</span>
          <span className="logo-text">ExpenseTracker</span>
        </Link>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>
        <div className="user-info">
          <span className="user-name">{user?.name || "User"}</span>
          <span className="user-email">{user?.email || "user@example.com"}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`sidebar-link ${isActive("/dashboard")}`}>
          <span className="sidebar-icon">📊</span> Dashboard
        </Link>
        <Link to="/groups" className={`sidebar-link ${isActive("/groups") || location.pathname.startsWith("/groups/") ? "active-sidebar-link" : ""}`}>
          <span className="sidebar-icon">👥</span> SplitSphere
        </Link>
        <Link to="/analytics" className={`sidebar-link ${isActive("/analytics")}`}>
          <span className="sidebar-icon">📈</span> Analytics
        </Link>
        <Link to="/expenses" className={`sidebar-link ${isActive("/expenses")}`}>
          <span className="sidebar-icon">💸</span> Expenses
        </Link>
        <Link to="/income" className={`sidebar-link ${isActive("/income")}`}>
          <span className="sidebar-icon">💵</span> Income
        </Link>
        <Link to="/settings" className={`sidebar-link ${isActive("/settings")}`}>
          <span className="sidebar-icon">⚙️</span> Settings
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={toggleTheme} className="sidebar-btn theme-toggle-sidebar">
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <button onClick={logout} className="sidebar-btn logout-sidebar">
          <span className="sidebar-icon">🚪</span> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

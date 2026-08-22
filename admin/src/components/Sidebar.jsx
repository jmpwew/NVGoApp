import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function NavBadge({ count }) {
  if (!count) return null;
  return <span className="nav-badge">{count > 99 ? '99+' : count}</span>;
}

const ROLE_LABELS = {
  admin:   'Admin',
  verifier:'Verifier',
  police:  'Police',
  bfp:     'BFP',
  medical: 'Medical',
};

export default function Sidebar({ isOpen, onClose, badges = {}, role = 'admin' }) {
  const { pendingReports = 0, unreadSupport = 0 } = badges;

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-section-label">{ROLE_LABELS[role] || 'Main'}</div>
        <nav>
          {role === 'admin' && (
            <>
              <NavLink to="/dashboard"     onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/reports"       onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span>Reports</span> <NavBadge count={pendingReports} />
              </NavLink>
              <NavLink to="/users"         onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span>Users</span>
              </NavLink>
              <NavLink to="/news"          onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span>News</span>
              </NavLink>
              <NavLink to="/announcements" onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span>Announcements</span>
              </NavLink>
              <NavLink to="/notifications" onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span>Notifications</span>
              </NavLink>
              <NavLink to="/support"       onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span>Support Messages</span> <NavBadge count={unreadSupport} />
              </NavLink>
              <NavLink to="/hotlines"      onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span>Emergency Hotlines</span>
              </NavLink>
            </>
          )}

          {role === 'verifier' && (
            <NavLink to="/verifier" onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span>Pending Reports</span>
            </NavLink>
          )}

          {['police', 'bfp', 'medical'].includes(role) && (
            <NavLink to="/office" onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span>Assigned Reports</span>
            </NavLink>
          )}

          {/* Only 'admin' is an individually-issued login — verifier and
              office accounts are shared, so they get "Account Settings"
              (see AccountPage.jsx) instead of a self-editable profile. */}
          {['verifier', 'police', 'bfp', 'medical'].includes(role) ? (
            <NavLink to="/account" onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span>Account Settings</span>
            </NavLink>
          ) : (
            <NavLink to="/profile" onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span>Profile</span>
            </NavLink>
          )}
        </nav>
      </div>
    </>
  );
}
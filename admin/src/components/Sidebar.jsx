import { NavLink } from 'react-router-dom';
import {
  BellIcon, ClipboardListIcon, DashboardIcon, MegaphoneIcon, MessageCircleIcon,
  NewspaperIcon, PhoneIcon, ShieldIcon, UserIcon,
} from './Icons';
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

function SidebarLink({ to, icon: Icon, children, badge, onClose }) {
  return (
    <NavLink to={to} onClick={onClose} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
      <span className="nav-link-main"><Icon aria-hidden="true" />{children}</span>
      <NavBadge count={badge} />
    </NavLink>
  );
}

export default function Sidebar({ isOpen, isCollapsed, onClose, badges = {}, role = 'admin' }) {
  const { pendingReports = 0, unreadSupport = 0 } = badges;

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside
        className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-section-label">{ROLE_LABELS[role] || 'Main'}</div>
        <nav>
          {role === 'admin' && (
            <>
              <div className="nav-group-label">Operations</div>
              <SidebarLink to="/dashboard" icon={DashboardIcon} onClose={onClose}>Dashboard</SidebarLink>
              <SidebarLink to="/reports" icon={ClipboardListIcon} badge={pendingReports} onClose={onClose}>Reports</SidebarLink>
              <SidebarLink to="/support" icon={MessageCircleIcon} badge={unreadSupport} onClose={onClose}>Support Messages</SidebarLink>
              <SidebarLink to="/notifications" icon={BellIcon} onClose={onClose}>Notifications</SidebarLink>

              <div className="nav-group-label">Content</div>
              <SidebarLink to="/news" icon={NewspaperIcon} onClose={onClose}>News</SidebarLink>
              <SidebarLink to="/announcements" icon={MegaphoneIcon} onClose={onClose}>Announcements</SidebarLink>
              <SidebarLink to="/hotlines" icon={PhoneIcon} onClose={onClose}>Emergency Hotlines</SidebarLink>

              <div className="nav-group-label">Administration</div>
              <SidebarLink to="/users" icon={UserIcon} onClose={onClose}>Users</SidebarLink>
              <SidebarLink to="/transparency" icon={ShieldIcon} onClose={onClose}>Transparency Board</SidebarLink>
              <SidebarLink to="/audit-logs" icon={ClipboardListIcon} onClose={onClose}>Audit Logs</SidebarLink>
              <SidebarLink to="/profile" icon={UserIcon} onClose={onClose}>Profile</SidebarLink>
            </>
          )}

          {role === 'verifier' && (
            <SidebarLink to="/verifier" icon={ClipboardListIcon} onClose={onClose}>Pending Reports</SidebarLink>
          )}

          {['police', 'bfp', 'medical'].includes(role) && (
            <SidebarLink to="/office" icon={ClipboardListIcon} onClose={onClose}>Assigned Reports</SidebarLink>
          )}

          
          {['verifier', 'police', 'bfp', 'medical'].includes(role) ? (
            <SidebarLink to="/account" icon={UserIcon} onClose={onClose}>Account Settings</SidebarLink>
          ) : null}
        </nav>
      </aside>
    </>
  );
}

import { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import ReportsPage       from './pages/ReportsPage';
import UsersPage         from './pages/UsersPage';
import NewsPage          from './pages/NewsPage';
import NotificationsPage from './pages/NotificationsPage';
import SupportPage       from './pages/SupportPage';
import HotlinesPage      from './pages/HotlinesPage';
import ProfilePage       from './pages/ProfilePage';
import VerifierDashboard from './pages/VerifierDashboard';
import OfficeDashboard   from './pages/OfficeDashboard';
import Header            from './components/Header';
import Sidebar           from './components/Sidebar';
import './index.css';

const API = 'http://localhost:5000';

function getStoredRole() {
  try {
    return JSON.parse(localStorage.getItem('admin') || '{}').role || null;
  } catch {
    return null;
  }
}

// Where each role should land after login / on an unauthorized route
function homeRouteForRole(role) {
  if (role === 'admin') return '/dashboard';
  if (role === 'verifier') return '/verifier';
  if (['police', 'bfp', 'medical'].includes(role)) return '/office';
  return '/login';
}

function Layout({ children }) {
  const [navOpen, setNavOpen] = useState(false);
  const [badges, setBadges]   = useState({ pendingReports: 0, unreadSupport: 0 });
  const role = getStoredRole();

  useEffect(() => {
    // stats/badges endpoint is admin-only; skip it for other roles
    if (role !== 'admin') return;

    let cancelled = false;
    const token = localStorage.getItem('token');

    async function fetchBadges() {
      try {
        const res = await axios.get(`${API}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!cancelled) {
          setBadges({
            pendingReports: res.data.pendingReports || 0,
            unreadSupport:  res.data.unreadSupport || 0,
          });
        }
      } catch (err) {
        console.log(err);
      }
    }

    fetchBadges();
    const interval = setInterval(fetchBadges, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [role]);

  return (
    <div>
      <Header onToggleNav={() => setNavOpen(o => !o)} />
      <Sidebar isOpen={navOpen} onClose={() => setNavOpen(false)} badges={badges} role={role} />
      <div style={{ minHeight: 'calc(100vh - 64px)' }}>
        {children}
      </div>
    </div>
  );
}

// Wraps a page and restricts it to a set of allowed roles.
// Logged out -> /login. Logged in but wrong role -> their own dashboard.
function RoleRoute({ allow, children }) {
  const token = localStorage.getItem('token');
  const role = getStoredRole();

  if (!token) return <Navigate to="/login" />;
  if (!allow.includes(role)) return <Navigate to={homeRouteForRole(role)} />;

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Main Admin */}
        <Route path="/dashboard" element={<RoleRoute allow={['admin']}><DashboardPage /></RoleRoute>} />
        <Route path="/reports"   element={<RoleRoute allow={['admin']}><ReportsPage /></RoleRoute>} />
        <Route path="/users"     element={<RoleRoute allow={['admin']}><UsersPage /></RoleRoute>} />
        <Route path="/news"      element={<RoleRoute allow={['admin']}><NewsPage /></RoleRoute>} />
        <Route path="/notifications" element={<RoleRoute allow={['admin']}><NotificationsPage /></RoleRoute>} />
        <Route path="/support"   element={<RoleRoute allow={['admin']}><SupportPage /></RoleRoute>} />
        <Route path="/hotlines"  element={<RoleRoute allow={['admin']}><HotlinesPage /></RoleRoute>} />

        {/* Verifier */}
        <Route path="/verifier"  element={<RoleRoute allow={['verifier']}><VerifierDashboard /></RoleRoute>} />

        {/* Offices: police | bfp | medical share one dashboard, filtered server-side by role */}
        <Route path="/office"    element={<RoleRoute allow={['police', 'bfp', 'medical']}><OfficeDashboard /></RoleRoute>} />

        {/* Shared */}
        <Route path="/profile"   element={<RoleRoute allow={['admin', 'verifier', 'police', 'bfp', 'medical']}><ProfilePage /></RoleRoute>} />

        <Route path="*" element={<Navigate to={homeRouteForRole(getStoredRole())} />} />
      </Routes>
    </BrowserRouter>
  );
}
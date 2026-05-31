import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import ReportsPage       from './pages/ReportsPage';
import UsersPage         from './pages/UsersPage';
import NewsPage          from './pages/NewsPage';
import NotificationsPage from './pages/NotificationsPage';
import SupportPage       from './pages/SupportPage';
import HotlinesPage      from './pages/HotlinesPage';
import Sidebar           from './components/Sidebar';
import './index.css';

function Layout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '220px', flex: 1, minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/reports"   element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
        <Route path="/users"     element={<PrivateRoute><UsersPage /></PrivateRoute>} />
        <Route path="/news"      element={<PrivateRoute><NewsPage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/support"   element={<PrivateRoute><SupportPage /></PrivateRoute>} />
        <Route path="/hotlines"  element={<PrivateRoute><HotlinesPage /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
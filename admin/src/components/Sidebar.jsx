import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        NV<span>Go</span> Admin
      </div>

      <nav>
        <NavLink to="/dashboard"     className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}> Dashboard</NavLink>
        <NavLink to="/reports"       className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}> Reports</NavLink>
        <NavLink to="/users"         className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}> Users</NavLink>
        <NavLink to="/news"          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}> News</NavLink>
        <NavLink to="/notifications" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}> Notifications</NavLink>
        <NavLink to="/support"       className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}> Support Messages</NavLink>
      </nav>

      <div className="sidebar-logout">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MenuIcon, SearchIcon, BellIcon, ChevronDownIcon, UserIcon, LogoutIcon } from './Icons';
import './Header.css';
import playNotificationSound, { unlockAudio } from '../playNotificationSound';

import { API } from '../config';
const POLL_MS = 5000;

const ROLE_LABELS = {
  admin:    'Admin',
  verifier: 'Verifier',
  police:   'Police',
  bfp:      'BFP',
  medical:  'Medical',
};

export default function Header({ onToggleNav }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen]   = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [search, setSearch]             = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]      = useState(0);
  const [markingAll, setMarkingAll]        = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const prevUnreadCount = useRef(null); 

  const admin = (() => {
    try { return JSON.parse(localStorage.getItem('admin')) || {}; }
    catch { return {}; }
  })();

  const isOfficeRole = ['verifier', 'police', 'bfp', 'medical'].includes(admin.role);
  const profilePath = isOfficeRole ? '/account' : '/profile';

  const displayName = `${admin.firstname || ''} ${admin.lastname || ''}`.trim() || admin.email || 'Admin User';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    function handleFirstGesture() {
      unlockAudio();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    }
    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  
  async function ensureNotificationPermission() {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  function isTabUnfocused() {
    return document.hidden || !document.hasFocus();
  }

  async function showDesktopNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
     
      const res = await axios.get(`${API}/api/admin/alerts`, { headers, params: { limit: 1 } });
      const latest = res.data?.[0];
      const title = latest?.title || 'New notification';
      const body  = latest?.detail || 'You have a new update in NVGo Admin.';

      const desktopNotif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'nvgo-admin-alert',
      });
      desktopNotif.onclick = () => {
        window.focus();
        if (latest) handleNotificationClick(latest);
        desktopNotif.close();
      };
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchUnreadCount() {
    try {
      const res = await axios.get(`${API}/api/admin/alerts/unread-count`, { headers });
      const newCount = res.data.count || 0;
      if (prevUnreadCount.current !== null && newCount > prevUnreadCount.current) {
        playNotificationSound();
        if (isTabUnfocused()) showDesktopNotification();
      }
      prevUnreadCount.current = newCount;
      setUnreadCount(newCount);
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchFeed() {
    try {
      const res = await axios.get(`${API}/api/admin/alerts`, { headers });
      setNotifications(res.data);
    } catch (err) {
      console.log(err);
    }
  }

 
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // only load the full list when the dropdown is actually opened
  useEffect(() => {
    if (notifOpen) fetchFeed();
  }, [notifOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/reports?search=${encodeURIComponent(search.trim())}`);
    }
  }

  function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  async function markOneRead(item) {
    if (item.is_read) return;
    // optimistic update so the UI feels instant
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await axios.patch(`${API}/api/admin/alerts/${item.id}/read`, {}, { headers });
    } catch (err) {
      console.log(err);
    }
  }

  async function handleNotificationClick(item) {
    setNotifOpen(false);
    await markOneRead(item);
    const reportId = item.related_id;
    if (admin.role === 'admin') {
      if (item.type === 'support') {
        navigate('/support');
      } else {
        navigate(reportId ? `/reports?reportId=${reportId}` : '/reports');
      }
    } else if (admin.role === 'verifier') {
      navigate(reportId ? `/verifier?reportId=${reportId}` : '/verifier');
    } else {
      navigate(reportId ? `/office?reportId=${reportId}` : '/office');
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await axios.patch(`${API}/api/admin/alerts/read-all`, {}, { headers });
    } catch (err) {
      console.log(err);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <header className="app-header">
      <button className="icon-btn header-hamburger" aria-label="Toggle navigation" onClick={onToggleNav}>
        <MenuIcon />
      </button>

      <div className="header-logo">
        NV<span>Go</span> {ROLE_LABELS[admin.role] || 'Admin'}
      </div>

      <form className="header-search" onSubmit={handleSearchSubmit}>
        <SearchIcon className="header-search-icon" />
        <input
          type="text"
          placeholder="Search reports, users, news..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </form>

      <div className="header-actions">
        <div className="header-popover-wrap" ref={notifRef}>
          <button
            className="icon-btn"
            aria-label="Notifications"
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); ensureNotificationPermission(); }}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="header-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="header-popover notif-popover">
              <div className="notif-popover-header">
                <div className="popover-title">Notifications</div>
                {unreadCount > 0 && (
                  <button
                    className="notif-mark-all"
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              {notifPermission === 'denied' && (
                <div className="notif-permission-hint">
                  Desktop alerts are blocked for this site. Enable notifications in your browser's
                  site settings to get an alert when this tab isn't focused.
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="notif-empty">No notifications yet</div>
              ) : (
                <div className="notif-list">
                  {notifications.map(item => (
                    <button
                      key={`${item.type}-${item.id}`}
                      className={`notif-item${item.is_read ? '' : ' notif-item-unread'}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <span className={`notif-dot notif-dot-${item.type}${item.is_read ? ' notif-dot-hidden' : ''}`} />
                      <span className="notif-item-body">
                        <span className="notif-item-title">{item.title}</span>
                        {item.detail && <span className="notif-item-detail">{item.detail}</span>}
                      </span>
                      <span className="notif-item-time">{timeAgo(item.created_at)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-popover-wrap" ref={profileRef}>
          <button
            className="profile-btn"
            aria-label="Account menu"
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
          >
            <span className="profile-avatar">{initials}</span>
            <ChevronDownIcon className="profile-chevron" />
          </button>
          {profileOpen && (
            <div className="header-popover profile-popover">
              <div className="profile-popover-info">
                <div className="profile-popover-name">{displayName}</div>
                <div className="profile-popover-email">{admin.email || ''}</div>
              </div>
              <button className="popover-item" onClick={() => { setProfileOpen(false); navigate(profilePath); }}>
                <UserIcon /> {isOfficeRole ? 'Account settings' : 'View profile'}
              </button>
              <button className="popover-item popover-item-danger" onClick={handleLogout}>
                <LogoutIcon /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
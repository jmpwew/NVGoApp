import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../constants/colors';
import { IcBack, IcBell, IcAlert, IcCheck, IcInfo, IcTrash } from '../constants/icons';
import api_url from '../utils/api';



const TYPE = {
  alert:{ icon: <IcAlert/>,  bg: '#FFFBE6', border: C.yellowDk, dot: C.yellowDk },
  update:{ icon: <IcCheck/>, bg: C.greenLt, border: C.green, dot: C.green  },
  info: { icon: <IcInfo/>,bg: C.skyBg, border: C.skyDk,dot: C.skyDk  },
  report:{ icon: <IcBell c={C.skyDk}/>, bg: C.skyBg, border: C.skyDk, dot: C.skyDk },
};

// timestamp
function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// notification
function NotifCard({ item, onOpen, onDelete }) {
  const cfg = TYPE[item.type] ?? TYPE.info;
  return (
    <TouchableOpacity
      style={[s.card, { borderLeftColor: cfg.border, backgroundColor: item.is_read ? C.card : cfg.bg }]}
      onPress={() => onOpen(item)}
      activeOpacity={0.82}
    >
      {!item.is_read && <View style={[s.unreadDot, { backgroundColor: cfg.dot }]}/>}

      <View style={[s.iconWrap, { backgroundColor: cfg.bg, borderColor: cfg.border + '40' }]}>
        {cfg.icon}
      </View>

      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={[s.cardTitle, !item.is_read && { color: C.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={s.cardTime}>{formatTime(item.created_at)}</Text>
        </View>
        <Text style={s.cardMsg} numberOfLines={2}>{item.body}</Text>
      </View>

      <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item.id)} hitSlop={8}>
        <IcTrash/>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Not logged in');
        return;
      }

      const res = await fetch(`${api_url}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const data = await res.json();
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error('Notifications fetch error:', err);
      setError('Could not load notifications. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${api_url}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const openNotification = (item) => {
    if (!item.is_read) markRead(item.id);
    navigation.navigate('NotificationDetail', { notification: item });
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${api_url}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const deleteNotif = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${api_url}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const clearAll = async () => {
    const ids = notifications.map(n => n.id);
    setNotifications([]);
    try {
      const token = await AsyncStorage.getItem('token');
      await Promise.all(ids.map(id =>
        fetch(`${api_url}/api/notifications/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <IcBack/>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 34 }}/>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.greenDk} size="large"/>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.errorTxt}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              colors={[C.greenDk]}
              tintColor={C.greenDk}
            />
          }
        >
          {/* Action row */}
          {notifications.length > 0 && (
            <View style={s.actionRow}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead} activeOpacity={0.75}>
                  <Text style={s.actionLink}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={clearAll} activeOpacity={0.75} style={{ marginLeft: 'auto' }}>
                <Text style={[s.actionLink, { color: C.red }]}>Clear all</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Unread section */}
          {notifications.filter(n => !n.is_read).length > 0 && (
            <>
              <Text style={s.secLabel}>NEW</Text>
              {notifications.filter(n => !n.is_read).map(item => (
                <NotifCard key={item.id} item={item} onOpen={openNotification} onDelete={deleteNotif}/>
              ))}
            </>
          )}

          {/* Read section */}
          {notifications.filter(n => n.is_read).length > 0 && (
            <>
              <Text style={s.secLabel}>EARLIER</Text>
              {notifications.filter(n => n.is_read).map(item => (
                <NotifCard key={item.id} item={item} onOpen={openNotification} onDelete={deleteNotif}/>
              ))}
            </>
          )}

          {/* Empty state */}
          {notifications.length === 0 && (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <IcBell c={C.muted} size={38}/>
              </View>
              <Text style={s.emptyTitle}>No notifications</Text>
              <Text style={s.emptySub}>
                You're all caught up! Check back later for updates from the municipal office.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 16, paddingBottom: 48 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTxt:     { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },

  /* Header */
  header: {
    backgroundColor: C.greenDk,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  badge:        { backgroundColor: C.yellow, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt:     { fontSize: 11, fontWeight: '800', color: C.greenDk },

  /* Action row */
  actionRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  actionLink:   { fontSize: 12, fontWeight: '700', color: C.skyDk },

  /* Section label */
  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4, marginLeft: 2 },

  /* Notification card */
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: C.border,
    padding: 12,
    marginBottom: 10,
    gap: 10,
    position: 'relative',
  },
  unreadDot:    { position: 'absolute', top: 10, right: 42, width: 7, height: 7, borderRadius: 4 },
  iconWrap:     { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody:     { flex: 1 },
  cardTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle:    { fontSize: 13, fontWeight: '700', color: C.text, flex: 1, marginRight: 6 },
  cardTime:     { fontSize: 10, color: C.muted, flexShrink: 0 },
  cardMsg:      { fontSize: 12, color: C.sub, lineHeight: 17 },
  deleteBtn:    { padding: 4, alignSelf: 'center' },

  /* Empty */
  empty:        { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyIcon:    { width: 72, height: 72, borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle:   { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 8 },
  emptySub:     { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
});
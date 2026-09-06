import { useEffect, useState } from 'react';
import axios from 'axios';
import './UsersPage.css';

import { API } from '../config';
import ConfirmModal from '../components/ConfirmModal';

const STAFF_ROLES  = ['admin', 'verifier', 'police', 'bfp', 'medical'];
const OFFICE_ROLES = ['police', 'bfp', 'medical'];

const ROLES = [
  { value: 'admin',    label: 'Admin' },
  { value: 'verifier', label: 'Verifier' },
  { value: 'police',   label: 'Office - Police' },
  { value: 'bfp',      label: 'Office - BFP' },
  { value: 'medical',  label: 'Office - Medical' },
];

function badgeClass(role) {
  return OFFICE_ROLES.includes(role) ? `badge-office-${role}` : `badge-${role}`;
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  contact: '',
  address: '',
  role: 'admin',
};

export default function UsersPage() {
  const [users, setUsers]     = useState([]);
  const [tab, setTab]         = useState('users');
  const [search, setSearch]   = useState('');
  const [form, setForm]       = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  const token = localStorage.getItem('token');
  const currentAdmin = (() => {
    try { return JSON.parse(localStorage.getItem('admin') || '{}'); } catch { return {}; }
  })();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await axios.get(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const trimmed = form.name.trim();
      const [firstname, ...rest] = trimmed.split(/\s+/);
      const lastname = rest.join(' ') || firstname; 

      await axios.post(`${API}/api/admin/users`, {
        ...form,
        firstname,
        lastname,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cancelForm();
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  }

  function cancelForm() {
    setForm(emptyForm);
    setFormError('');
    setShowForm(false);
  }

  function switchTab(next) {
    setTab(next);
    setSearch('');
    cancelForm();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`${API}/api/admin/users/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: deleteReason.trim() },
      });
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteReason('');
    } catch (err) {
      console.log(err);
      setDeleteError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  }

  const appUsers  = users.filter(u => u.role === 'user');
  const staffList = users.filter(u => STAFF_ROLES.includes(u.role));
  const activeList = tab === 'users' ? appUsers : staffList;

  const filtered = activeList.filter(u =>
    `${u.firstname} ${u.lastname} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="section-header">
        <h1>Users</h1>
        {tab === 'staff' && (
          <button className="btn-green" onClick={() => setShowForm(true)}>
            + Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="users-tabs">
        <button
          className={`users-tab ${tab === 'users' ? 'active' : ''}`}
          onClick={() => switchTab('users')}
        >
          App Users <span className="users-tab-count">{appUsers.length}</span>
        </button>
        <button
          className={`users-tab ${tab === 'staff' ? 'active' : ''}`}
          onClick={() => switchTab('staff')}
        >
          Staff Accounts <span className="users-tab-count">{staffList.length}</span>
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', width: '260px', outline: 'none' }}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="7">
                {tab === 'users' ? 'No app users found.' : 'No staff accounts found.'}
              </td>
            </tr>
          ) : (
            filtered.map(u => (
              <tr key={u.id}>
                <td>{u.firstname} {u.lastname}</td>
                <td>{u.email}</td>
                <td>{u.contact || '—'}</td>
                <td>{u.address || '—'}</td>
                <td>
                  <span className={`badge ${badgeClass(u.role)}`}>{u.role}</span>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  {u.id === currentAdmin.id ? (
                    <span className="you-tag">You</span>
                  ) : (
                    <button className="btn-red" onClick={() => { setDeleteError(''); setDeleteReason(''); setDeleteTarget(u); }}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add staff account modal */}
      {showForm && (
        <div className="users-modal-overlay" onClick={cancelForm}>
          <div className="users-modal" onClick={e => e.stopPropagation()}>
            <h2>Add Staff Account</h2>
            <form onSubmit={handleAddUser}>
              {formError && <div className="error-msg">{formError}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Juan Dela Cruz"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="name@email.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters, 1 letter & 1 number"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact</label>
                  <input
                    type="text"
                    value={form.contact}
                    onChange={e => setForm({ ...form, contact: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-green" disabled={saving}>
                  {saving ? 'Creating...' : 'Add User'}
                </button>
                <button type="button" className="btn-gray" onClick={cancelForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete this user?"
        message={
          deleteError
            ? deleteError
            : deleteTarget
              ? `This will permanently delete ${deleteTarget.firstname} ${deleteTarget.lastname} (${deleteTarget.email}) and all of their reports. This action cannot be undone.`
              : ''
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        requireReason
        reasonLabel="Reason for deletion (required)"
        reasonPlaceholder="e.g. Staff member offboarded, duplicate account, requested by user..."
        reasonValue={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); setDeleteReason(''); }}
      />
    </div>
  );
}
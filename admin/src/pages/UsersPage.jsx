import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function UsersPage() {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('token');

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

  async function deleteUser(id) {
    if (!confirm('Delete this user? This will also delete their reports.')) return;
    try {
      await axios.delete(`${API}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.log(err);
      alert('Failed to delete user.');
    }
  }

  const filtered = users.filter(u =>
    `${u.firstname} ${u.lastname} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <h1>Users</h1>

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
            <th>ID</th>
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
            <tr><td colSpan="8">No users found.</td></tr>
          ) : (
            filtered.map(u => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td>{u.firstname} {u.lastname}</td>
                <td>{u.email}</td>
                <td>{u.contact || '—'}</td>
                <td>{u.address || '—'}</td>
                <td>
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn-red" onClick={() => deleteUser(u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

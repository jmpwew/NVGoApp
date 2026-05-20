import { useEffect, useState } from 'react';
import axios from 'axios';
import './ReportsPage.css';

const API = 'http://localhost:5000';

export default function ReportsPage() {
  const [reports, setReports]   = useState([]);
  const [filter, setFilter]     = useState('all');  // all | pending | resolved
  const [search, setSearch]     = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await axios.get(`${API}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function updateStatus(id, status) {
    try {
      await axios.put(`${API}/api/admin/reports/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update locally so UI refreshes without full reload
      setReports(prev =>
        prev.map(r => r.id === id ? { ...r, status } : r)
      );
    } catch (err) {
      console.log(err);
      alert('Failed to update status.');
    }
  }

  async function deleteReport(id) {
    if (!confirm('Delete this report?')) return;
    try {
      await axios.delete(`${API}/api/admin/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.log(err);
      alert('Failed to delete report.');
    }
  }

  // Filter and search
  const filtered = reports.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
                          r.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page">
      <h1>Reports</h1>

      {/* Filter bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '260px' }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
        <span style={{ fontSize: '13px', color: '#888' }}>
          {filtered.length} report(s)
        </span>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Contact</th>
            <th>Description</th>
            <th>Location Note</th>
            <th>Images</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="9">No reports found.</td></tr>
          ) : (
            filtered.map(r => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.name || '—'}</td>
                <td>{r.contact || '—'}</td>
                <td style={{ maxWidth: '200px' }}>{r.description}</td>
                <td>{r.location_note || '—'}</td>
                <td>
                  {r.images && r.images.length > 0 ? (
                    <div className="report-images">
                      {r.images.map((img, i) => (
                        <a key={i} href={`${API}/uploads/${img}`} target="_blank" rel="noreferrer">
                          <img src={`${API}/uploads/${img}`} alt="report" />
                        </a>
                      ))}
                    </div>
                  ) : '—'}
                </td>
                <td>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    {r.status === 'pending' ? (
                      <button className="btn-green" onClick={() => updateStatus(r.id, 'resolved')}>
                        Resolve
                      </button>
                    ) : (
                      <button className="btn-gray" onClick={() => updateStatus(r.id, 'pending')}>
                        Unresolve
                      </button>
                    )}
                    <button className="btn-red" onClick={() => deleteReport(r.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

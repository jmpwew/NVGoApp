import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QuarterlyChart from './QuarterlyChart';
import { REPORT_TYPE_COLORS } from '../constants/reportTypes';
import './QuarterlyLogsModal.css';

const QUARTERS = [
  { value: 1, label: 'Q1 \u2014 Jan, Feb, Mar' },
  { value: 2, label: 'Q2 \u2014 Apr, May, Jun' },
  { value: 3, label: 'Q3 \u2014 Jul, Aug, Sep' },
  { value: 4, label: 'Q4 \u2014 Oct, Nov, Dec' },
];

function currentQuarter() {
  return Math.floor(new Date().getMonth() / 3) + 1;
}

/**
 * @param {string} endpoint  
 * @param {string} buttonLabel  
 */
export default function QuarterlyLogsModal({ endpoint, buttonLabel = 'Generate Quarterly Logs' }) {
  const [open, setOpen]         = useState(false);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [quarter, setQuarter]   = useState(currentQuarter());
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState(null);
  const [error, setError]       = useState('');
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(endpoint, {
        params: { year, quarter },
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || 'Failed to generate quarterly logs.');
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setOpen(true);
    setData(null);
    setError('');
    generate();
  }

  async function saveAsPdf() {
    if (!reportRef.current || !data) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;

      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
      }

      pdf.save(`Quarterly-Logs-Q${quarter}-${year}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const years = Array.from({ length: 5 }).map((_, i) => new Date().getFullYear() - i);

  return (
    <>
      <button className="btn-green" onClick={openModal}>
        {buttonLabel}
      </button>

      {open && (
        <div className="detail-modal-overlay" onClick={() => setOpen(false)}>
          <div className="detail-modal quarterly-logs-modal" onClick={e => e.stopPropagation()}>
            <button className="map-modal-close" onClick={() => setOpen(false)}>{'\u2715'}</button>
            <h2 className="detail-modal-title">Quarterly Logs</h2>

            <div className="quarterly-controls">
              <select value={quarter} onChange={e => setQuarter(Number(e.target.value))}>
                {QUARTERS.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
              <select value={year} onChange={e => setYear(Number(e.target.value))}>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button className="btn-green" onClick={generate} disabled={loading}>
                {loading ? <><span className="spinner" /> Generating...</> : 'Generate'}
              </button>
            </div>

            {error && <div className="quarterly-error">{error}</div>}

            {loading && !data && (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Loading quarterly logs...
              </div>
            )}

            {data && (
              <>
                <div ref={reportRef}>
                <div className="metric-grid" style={{ marginTop: 4 }}>
                  <div className="metric-card">
                    <div className="metric-card-label">Total resolved reports</div>
                    <div className="metric-card-value">{data.grandTotal}</div>
                  </div>
                  <div className="metric-card accent">
                    <div className="metric-card-label">Most frequent</div>
                    <div className="metric-card-value" style={{ fontSize: 16 }}>
                      {data.mostFrequent ? `${data.mostFrequent.label} (${data.mostFrequent.count})` : '\u2014'}
                    </div>
                  </div>
                </div>

                <p className="quarterly-summary-text">{data.summaryText}</p>

                <div className="chart-section" style={{ marginTop: 4, marginBottom: 16 }}>
                  <h2 style={{ fontSize: 14 }}>{data.quarterLabel} {'\u2014'} resolved reports by type</h2>
                  <QuarterlyChart months={data.months} series={data.series} colors={REPORT_TYPE_COLORS} />
                </div>

                {data.nonEmptySeries.length > 0 && (
                  <table className="quarterly-breakdown-table">
                    <thead>
                      <tr>
                        <th>Report type</th>
                        {data.months.map(m => <th key={m}>{m}</th>)}
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.nonEmptySeries].sort((a, b) => b.total - a.total).map(s => (
                        <tr key={s.type}>
                          <td>{s.label}</td>
                          {s.counts.map((c, i) => <td key={i}>{c}</td>)}
                          <td><strong>{s.total}</strong></td>
                        </tr>
                      ))}
                      <tr className="quarterly-breakdown-total-row">
                        <td>Total</td>
                        {data.monthTotals.map((t, i) => <td key={i}>{t}</td>)}
                        <td><strong>{data.grandTotal}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {data.barangayBreakdown && data.barangayBreakdown.length > 0 && (
                  <>
                    <h2 style={{ fontSize: 14, marginTop: 18 }}>{data.quarterLabel} {'\u2014'} resolved reports by barangay</h2>
                    <table className="quarterly-breakdown-table quarterly-log-table">
                      <thead>
                        <tr>
                          <th>Barangay</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.barangayBreakdown.map(b => (
                          <tr key={b.barangay}>
                            <td>{b.barangay}</td>
                            <td><strong>{b.count}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {data.reports && data.reports.length > 0 && (
                  <>
                    <h2 style={{ fontSize: 14, marginTop: 18 }}>{data.quarterLabel} {'\u2014'} report log</h2>
                    <table className="quarterly-breakdown-table quarterly-log-table">
                      <thead>
                        <tr>
                          <th>Date verified</th>
                          <th>Report type</th>
                          <th>Barangay</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.reports.map(r => (
                          <tr key={r.id}>
                            <td>{r.verifiedAt ? new Date(r.verifiedAt).toLocaleDateString() : '\u2014'}</td>
                            <td>{r.typeLabel}</td>
                            <td>{r.barangay || '\u2014'}</td>
                            <td>
                              {r.location
                                ? r.location
                                : (r.latitude && r.longitude ? `${Number(r.latitude).toFixed(5)}, ${Number(r.longitude).toFixed(5)}` : '\u2014')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                </div>

                <div className="action-buttons detail-modal-actions">
                  <button className="btn-gray" onClick={() => window.print()}>Print</button>
                  <button className="btn-gray" onClick={saveAsPdf} disabled={exporting}>
                    {exporting ? <><span className="spinner" /> Saving...</> : 'Save as PDF'}
                  </button>
                  <button className="btn-gray" onClick={() => setOpen(false)}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
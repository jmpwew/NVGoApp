const { REPORT_TYPES, REPORT_TYPE_LABELS } = require('./reportTypes');

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Calendar quarters: Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec
function quarterMonthIndexes(quarter) {
  const startMonth = (quarter - 1) * 3; // 0-based
  return [startMonth, startMonth + 1, startMonth + 2];
}

/**
 * Builds the "Generate Quarterly Logs" report: 3-month breakdown of
 * verified reports grouped by report_type, plus a plain-language summary.
 *
 * @param {import('pg').Pool} pool
 * @param {number} year
 * @param {number} quarter  1-4
 * @param {string|null} officeRole  'police' | 'bfp' | 'medical' | null (null = all offices, Main Admin view)
 * @param {string} officeLabel  human label used in the summary sentence
 */
async function buildQuarterlyReport(pool, { year, quarter, officeRole = null, officeLabel = 'police' }) {
  const monthIdx = quarterMonthIndexes(quarter);
  const months = monthIdx.map(i => MONTH_NAMES[i]);

  const startDate = new Date(Date.UTC(year, monthIdx[0], 1));
  const endDate = new Date(Date.UTC(year, monthIdx[2] + 1, 1)); // exclusive, first day of month after quarter

  const params = [startDate, endDate];
  let officeJoin = '';
  if (officeRole) {
    officeJoin = 'JOIN report_assignments ra ON ra.report_id = r.id AND ra.office_role = $3';
    params.push(officeRole);
  }

  const result = await pool.query(
    `SELECT
       EXTRACT(MONTH FROM r.verified_at)::int AS month,
       r.report_type AS report_type,
       COUNT(DISTINCT r.id)::int AS count
     FROM reports r
     ${officeJoin}
     WHERE r.verified_at >= $1 AND r.verified_at < $2
       AND r.report_type IS NOT NULL
       AND r.status = 'resolved'
     GROUP BY month, r.report_type`,
    params
  );

  // series: one entry per report type, each with a count per month in the quarter
  const series = REPORT_TYPES.map(t => ({
    type: t.value,
    label: t.label,
    counts: [0, 0, 0],
    total: 0,
  }));
  const seriesByType = Object.fromEntries(series.map(s => [s.type, s]));

  result.rows.forEach(row => {
    const s = seriesByType[row.report_type];
    if (!s) return; // ignore unknown/legacy values
    const posInQuarter = monthIdx.indexOf(row.month - 1);
    if (posInQuarter === -1) return;
    s.counts[posInQuarter] += row.count;
    s.total += row.count;
  });

  const nonEmptySeries = series.filter(s => s.total > 0);
  const grandTotal = series.reduce((sum, s) => sum + s.total, 0);
  const monthTotals = [0, 1, 2].map(i => series.reduce((sum, s) => sum + s.counts[i], 0));

  const ranked = [...nonEmptySeries].sort((a, b) => b.total - a.total);
  const mostFrequent = ranked[0] || null;

  const quarterLabel = `${months[0]}\u2013${months[2]} ${year}`;

  let summaryText;
  if (grandTotal === 0) {
    summaryText = `In a span of 3 months (${quarterLabel}), no resolved reports were recorded ${officeRole ? `for the ${officeLabel} office` : 'across offices'}.`;
  } else {
    const breakdown = ranked.map(s => `${s.label} - ${s.total}`).join(', ');
    const destination = officeRole ? `to the ${officeLabel} office` : 'to police, BFP, and medical offices';
    summaryText =
      `In a span of 3 months (${quarterLabel}), resolved reports from users ${destination}: ` +
      `${mostFrequent.label.toLowerCase()} is the most frequent report among other reports \u2014 ${breakdown}. ` +
      `All ${grandTotal} report${grandTotal === 1 ? '' : 's'} listed here have been resolved and closed out by the concerned office(s).`;
  }

  return {
    year,
    quarter,
    months,
    quarterLabel,
    officeRole,
    grandTotal,
    monthTotals,
    series,
    nonEmptySeries,
    mostFrequent: mostFrequent ? { type: mostFrequent.type, label: mostFrequent.label, count: mostFrequent.total } : null,
    summaryText,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { buildQuarterlyReport, MONTH_NAMES };

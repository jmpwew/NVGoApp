// Grouped column chart for the Quarterly Logs report: 3 months on the
// x-axis, one small bar per report type within each month group.
// Mirrors the styling approach of UserGrowthChart.jsx.
export default function QuarterlyChart({ months, series, colors }) {
  const width   = 720;
  const height  = 280;
  const padding = { top: 20, right: 20, bottom: 46, left: 32 };
  const chartW  = width - padding.left - padding.right;
  const chartH  = height - padding.top - padding.bottom;

  const visibleSeries = series.filter(s => s.total > 0);
  const seriesToPlot = visibleSeries.length > 0 ? visibleSeries : series.slice(0, 1);

  const allCounts = seriesToPlot.flatMap(s => s.counts);
  const max = Math.max(1, ...allCounts);
  const niceMax = Math.ceil(max / 5) * 5 || 5;

  const monthCount = months.length;
  const groupSlot = chartW / monthCount;
  const groupPadding = groupSlot * 0.12;
  const groupWidth = groupSlot - groupPadding * 2;
  const barWidth = Math.min(22, groupWidth / seriesToPlot.length);
  const barsWidth = barWidth * seriesToPlot.length;

  const gridLines = 4;

  return (
    <div>
      <svg
        className="quarterly-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Grouped bar chart of report counts per month by report type"
      >
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = padding.top + (chartH / gridLines) * i;
          const value = Math.round(niceMax - (niceMax / gridLines) * i);
          return (
            <g key={i}>
              <line className="grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text className="axis-label" x={padding.left - 8} y={y + 3} textAnchor="end">{value}</text>
            </g>
          );
        })}

        {months.map((month, mi) => {
          const groupX = padding.left + groupSlot * mi + (groupSlot - barsWidth) / 2;
          return (
            <g key={mi}>
              {seriesToPlot.map((s, si) => {
                const count = s.counts[mi] || 0;
                const barH = (count / niceMax) * chartH;
                const x = groupX + barWidth * si;
                const y = padding.top + chartH - barH;
                const color = colors[series.indexOf(s) % colors.length];
                return (
                  <g key={si}>
                    {count > 0 && (
                      <text
                        className="value-label"
                        x={x + barWidth / 2}
                        y={y - 4}
                        textAnchor="middle"
                        fontSize="9"
                      >
                        {count}
                      </text>
                    )}
                    <rect
                      x={x}
                      y={y}
                      width={Math.max(barWidth - 2, 1)}
                      height={Math.max(barH, count > 0 ? 2 : 0)}
                      rx={2}
                      fill={color}
                    />
                  </g>
                );
              })}
              <text
                className="axis-label"
                x={padding.left + groupSlot * mi + groupSlot / 2}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontWeight={600}
              >
                {month}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="quarterly-chart-legend">
        {seriesToPlot.map(s => (
          <div key={s.type} className="quarterly-chart-legend-item">
            <span
              className="quarterly-chart-legend-swatch"
              style={{ backgroundColor: colors[series.indexOf(s) % colors.length] }}
            />
            {s.label} ({s.total})
          </div>
        ))}
      </div>
    </div>
  );
}

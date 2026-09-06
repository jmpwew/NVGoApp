export default function UserGrowthChart({ months, counts, label = 'Bar chart of monthly counts for the current year' }) {
  const width   = 720;
  const height  = 240;
  const padding = { top: 20, right: 20, bottom: 28, left: 32 };
  const chartW  = width - padding.left - padding.right;
  const chartH  = height - padding.top - padding.bottom;

  const max = Math.max(1, ...counts);

  const niceMax = Math.ceil(max / 5) * 5 || 5;

  const barSlot = chartW / counts.length;
  const barWidth = Math.min(32, barSlot * 0.55);

  const gridLines = 4;

  return (
    <svg
      className="user-growth-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
    >
      {/* horizontal grid lines */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = padding.top + (chartH / gridLines) * i;
        const value = Math.round(niceMax - (niceMax / gridLines) * i);
        return (
          <g key={i}>
            <line
              className="grid-line"
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
            />
            <text className="axis-label" x={padding.left - 8} y={y + 3} textAnchor="end">
              {value}
            </text>
          </g>
        );
      })}

      {/* bars */}
      {counts.map((count, i) => {
        const barH = (count / niceMax) * chartH;
        const x = padding.left + barSlot * i + (barSlot - barWidth) / 2;
        const y = padding.top + chartH - barH;
        return (
          <g key={i}>
            {count > 0 && (
              <text className="value-label" x={x + barWidth / 2} y={y - 6} textAnchor="middle">
                {count}
              </text>
            )}
            <rect
              className="bar"
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barH, count > 0 ? 2 : 0)}
              rx={3}
            />
            <text
              className="axis-label"
              x={padding.left + barSlot * i + barSlot / 2}
              y={height - 8}
              textAnchor="middle"
            >
              {months[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
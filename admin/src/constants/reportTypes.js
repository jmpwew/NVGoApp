// Keep this in sync with backend/utils/reportTypes.js
export const REPORT_TYPES = [
  { value: 'shooting_incident',    label: 'Shooting Incident' },
  { value: 'physical_injury',      label: 'Physical Injury / Assault' },
  { value: 'alarm_scandal',        label: 'Alarm and Scandal (Drunken Disturbance)' },
  { value: 'domestic_disturbance', label: 'Domestic Disturbance' },
  { value: 'theft',                label: 'Theft / Robbery' },
  { value: 'vehicular_accident',   label: 'Vehicular Accident' },
  { value: 'fire_incident',        label: 'Fire Incident' },
  { value: 'medical_emergency',    label: 'Medical Emergency' },
  { value: 'others',               label: 'Others' },
];

export const REPORT_TYPE_LABELS = Object.fromEntries(REPORT_TYPES.map(t => [t.value, t.label]));

// Distinct colors per type for the quarterly grouped-bar chart, cycling
// through the brand palette + a few extras so 9 types stay distinguishable.
export const REPORT_TYPE_COLORS = [
  '#136835', '#dc2626', '#b45309', '#1d4ed8', '#7c3aed',
  '#0891b2', '#be185d', '#4d7c0f', '#6b7280',
];

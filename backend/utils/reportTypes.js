// Fixed list of incident/report types. Set by the verifier at the moment
// they verify + turnover a report. Used to group the Quarterly Logs report.
//
// Keep this in sync with admin/src/constants/reportTypes.js (frontend copy).
const REPORT_TYPES = [
  { value: 'shooting_incident',   label: 'Shooting Incident' },
  { value: 'physical_injury',     label: 'Physical Injury / Assault' },
  { value: 'alarm_scandal',       label: 'Alarm and Scandal (Drunken Disturbance)' },
  { value: 'domestic_disturbance',label: 'Domestic Disturbance' },
  { value: 'theft',               label: 'Theft / Robbery' },
  { value: 'vehicular_accident',  label: 'Vehicular Accident' },
  { value: 'fire_incident',       label: 'Fire Incident' },
  { value: 'medical_emergency',   label: 'Medical Emergency' },
  { value: 'others',              label: 'Others' },
];

const REPORT_TYPE_VALUES = REPORT_TYPES.map(t => t.value);
const REPORT_TYPE_LABELS = Object.fromEntries(REPORT_TYPES.map(t => [t.value, t.label]));

module.exports = { REPORT_TYPES, REPORT_TYPE_VALUES, REPORT_TYPE_LABELS };

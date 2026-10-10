import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  WORK_MODE_LABELS,
  formatSalary,
  type JobApplication,
} from '@/domain/application';

// Semikolon und BOM, damit Excel in deutscher Einstellung Spalten und Umlaute richtig erkennt
const SEPARATOR = ';';
const BOM = '﻿';

const COLUMNS: { header: string; value: (application: JobApplication) => string }[] = [
  { header: 'Unternehmen', value: (a) => a.company },
  { header: 'Position', value: (a) => a.role },
  { header: 'Ort', value: (a) => a.location },
  { header: 'Arbeitsmodell', value: (a) => (a.workMode ? WORK_MODE_LABELS[a.workMode] : '') },
  { header: 'Beworben am', value: (a) => a.appliedAt },
  { header: 'Status', value: (a) => STATUS_LABELS[a.status] },
  { header: 'Priorität', value: (a) => PRIORITY_LABELS[a.priority] },
  { header: 'Quelle', value: (a) => a.source ?? '' },
  { header: 'Gehalt', value: (a) => formatSalary(a.salaryMin, a.salaryMax) ?? '' },
  { header: 'Link', value: (a) => a.jobUrl ?? '' },
  { header: 'Nächster Schritt', value: (a) => a.nextStep ?? '' },
];

function escapeCell(value: string) {
  return /[";\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function toCsv(applications: JobApplication[]) {
  const rows = [
    COLUMNS.map((column) => column.header),
    ...applications.map((application) => COLUMNS.map((column) => column.value(application))),
  ];
  return BOM + rows.map((row) => row.map(escapeCell).join(SEPARATOR)).join('\r\n');
}

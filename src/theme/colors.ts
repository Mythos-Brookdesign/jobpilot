import { Platform } from 'react-native';

import type { ApplicationStatus } from '@/domain/application';

export type ColorSchemeName = 'light' | 'dark';

export const Colors = {
  light: {
    text: '#202923',
    textSecondary: '#68736B',
    background: '#F4F6F2',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E5EAE4',
    border: '#DDE3DC',
    /** Flächen mit `onAccent` darauf (Buttons, aktive Filter) */
    accent: '#176B4A',
    onAccent: '#FFFFFF',
    /** Akzent für Text und Icons auf normalem Hintergrund */
    accentText: '#176B4A',
    accentSoft: '#E4EEE7',
    accentSoftText: '#203D2E',
    accentSoftMuted: '#52695B',
    accentSoftEyebrow: '#50715F',
    danger: '#B65345',
    overlay: 'rgba(14, 22, 17, 0.42)',
    sheetHandle: '#C7CEC8',
    /** Diagramme: eine Farbe für Größen, eine hellere Stufe für Kontext (beide ≥ 3:1 zur Fläche) */
    chartBar: '#176B4A',
    chartBarMuted: '#5F9982',
    chartGrid: '#DDE3DC',
  },
  dark: {
    text: '#F1F4EF',
    textSecondary: '#A9B3AB',
    background: '#151A17',
    backgroundElement: '#202722',
    backgroundSelected: '#303A33',
    border: '#2A332D',
    accent: '#1E7F58',
    onAccent: '#FFFFFF',
    accentText: '#6CCB9B',
    accentSoft: '#1D3328',
    accentSoftText: '#E2F1E9',
    accentSoftMuted: '#A9C4B4',
    accentSoftEyebrow: '#8FD9B0',
    danger: '#E08A7C',
    overlay: 'rgba(0, 0, 0, 0.55)',
    sheetHandle: '#46514A',
    chartBar: '#4CB07D',
    chartBarMuted: '#3C7D5B',
    chartGrid: '#2A332D',
  },
} as const;

export type ThemeColors = (typeof Colors)[ColorSchemeName];

type StatusColor = { background: string; text: string; dot: string };

// Fortschritt von kühl (gemerkt, beworben) zu warm-grün (Gespräche) und gold (Angebot);
// Endzustände gedämpft. Text erfüllt auf dem jeweiligen Hintergrund WCAG AA.
export const StatusColors: Record<ColorSchemeName, Record<ApplicationStatus, StatusColor>> = {
  light: {
    saved: { background: '#ECEEEB', text: '#56605A', dot: '#8A948D' },
    applied: { background: '#E9EFF8', text: '#45658E', dot: '#6D8EB8' },
    screening: { background: '#E6F0F2', text: '#2F6570', dot: '#4C8D99' },
    interview: { background: '#E2F1E9', text: '#286448', dot: '#3E8A63' },
    final: { background: '#DDEFE3', text: '#1F5A3D', dot: '#2E7A52' },
    offer: { background: '#FFF0D8', text: '#8A5B18', dot: '#D19037' },
    rejected: { background: '#F8E8E5', text: '#99574E', dot: '#C9786A' },
    withdrawn: { background: '#EFECEA', text: '#6B625C', dot: '#9C928B' },
  },
  dark: {
    saved: { background: '#262C28', text: '#B5BDB7', dot: '#7E8781' },
    applied: { background: '#1F2A3A', text: '#A9C2E3', dot: '#6D8EB8' },
    screening: { background: '#1C2E31', text: '#9BCFD8', dot: '#4C8D99' },
    interview: { background: '#1D3328', text: '#8FD9B0', dot: '#3E8A63' },
    final: { background: '#18392A', text: '#A6E6C2', dot: '#46A26F' },
    offer: { background: '#3A2E1A', text: '#F0C27A', dot: '#D19037' },
    rejected: { background: '#3A2523', text: '#E8A89D', dot: '#C9786A' },
    withdrawn: { background: '#2C2825', text: '#C2B8B1', dot: '#8C827B' },
  },
};

/** Hintergründe der Firmen-Avatare, gewählt nach dem ersten Buchstaben */
export const AvatarColors: Record<ColorSchemeName, { backgrounds: string[]; text: string }> = {
  light: { backgrounds: ['#E4EEE7', '#F5E9DD', '#E5EAF4', '#F2E6E8'], text: '#294237' },
  dark: { backgrounds: ['#1D3328', '#3A2E22', '#232C3A', '#382629'], text: '#E2F1E9' },
};

/** Serifenschrift für große Titel – Georgia gibt es auf Android nicht */
export const SerifFont = Platform.select({
  android: 'serif',
  web: "Georgia, 'Times New Roman', serif",
  default: 'Georgia',
});

/* ======================================================================
   SHARED REPORT TYPES
   Central place for every interface used across the dashboard so
   components, services and mock data all agree on the same shapes.
   ====================================================================== */

export type Severity = "critical" | "vhigh" | "high" | "medium";

export interface NavLink {
  id: string;
  label: string;
}

export interface StatCard {
  target: number;
  suffix: string;
  label: string;
  color: string;
}

export interface UrlRow {
  url: string;
  scope: string;
  occurrences: number;
}

export interface TimelinePoint {
  year: string;
  employees: number;
  users: number;
}

export interface Finding {
  sev: Severity;
  badge: string;
  title: string;
  desc: string;
}

export interface FilterOption {
  key: "all" | Severity;
  label: string;
}

export type DonutSegment = [string, number];

export interface PasswordBreakdownRow {
  color: string;
  label: string;
  value: number;
}

export interface PasswordDonut {
  title: string;
  segments: DonutSegment[];
  breakdown: PasswordBreakdownRow[];
}

export interface FamilyDatum {
  name: string;
  count: number;
  pct: number;
}

export interface LockedCard {
  title: string;
  teaser: string;
  redactWidths: number[];
}

export interface SpotlightStat {
  target: number;
  suffix: string;
  label: string;
}

export interface SpotlightData {
  title: string;
  badgeLabel: string;
  meta: string;
  stats: SpotlightStat[];
  urlRows: UrlRow[];
  footNote: string;
}

export interface HygieneSegment {
  /** e.g. "Premium", "Free" */
  name: string;
  pct: number;
  color: string;
}

export interface HygieneData {
  avSegments: HygieneSegment[];
  appNote: string;
}

export interface SummaryData {
  bullets: string[];
  statCards: StatCard[];
}

export interface HeroData {
  badgeText: string;
  eyebrow: string;
  companyTitle: string;
  metaIndustry: string;
  metaDate: string;
  metaTarget: string;
  description: string; // HTML
  statTarget: number;
  statSuffix: string;
  statLabel: string;
  previewNote: string; // HTML
}

export interface FindingsData {
  filters: FilterOption[];
  items: Finding[];
}

export interface TimelineData {
  points: TimelinePoint[];
}

export interface FamiliesData {
  families: FamilyDatum[];
  footNote: string;
}

export interface LockedReportsData {
  cards: LockedCard[];
}

/** Root shape returned by getReport() — mirrors the full page's data needs. */
export interface Report {
  navigation: NavLink[];
  domain: string;
  hero: HeroData;
  summary: SummaryData;
  spotlight: SpotlightData;
  timeline: TimelineData;
  findings: FindingsData;
  passwordStrength: {
    employees: PasswordDonut;
    users: PasswordDonut;
    hygiene: HygieneData;
  };
  families: FamiliesData;
  lockedReports: LockedReportsData;
}

export interface UnlockPayload {
  fullName: string;
  workEmail: string;
  companyName?: string;
  domain: string;
  pdfBlob: Blob;
}

export interface UnlockResponse {
  success: boolean;
  message: string;
  report_id: number;
}

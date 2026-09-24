/* ======================================================================
   REPORT MAPPER
   Single seam between raw HudsonRock API responses and the UI-facing
   `Report` model the Dashboard already knows how to render.

   Returns:
     - ui:  a fully-typed `Report` object — exactly what Dashboard/Hero/
            Summary/Spotlight/Timeline/Findings/PasswordStrength/etc.
            expect. `hero`, `summary`, `spotlight`, `timeline`,
            `findings`, `passwordStrength`, and `families` are populated
            from real data (or honest, documented placeholders where no
            confirmed field exists yet); LockedReports remains a
            structurally-valid empty placeholder until its own mapping
            phase lands.
     - raw: the untouched overview/discovery/assessment responses, kept
            only for debugging (e.g. console logging). Never passed to
            any component — Dashboard must never import CompleteDomainReport.

   Reveal/lock:
   `isRevealed` is threaded into every mapper that touches sensitive
   values (hero, summary, spotlight, timeline, findings,
   passwordStrength). Every one of them routes its sensitive values
   through the two helpers below instead of masking inline — see
   "Reveal / masking helpers" just below the imports.

   Map one section at a time.
   ====================================================================== */

import type { CompleteDomainReport } from "../services/domain.service";
import type { OverviewEntry, OverviewResponse } from "../types/overview";
import type { DiscoveryResponse, DiscoveryUrlEntry } from "../types/discovery";
import type { AssessmentResponse } from "../types/assessment";
import type {
  Report,
  HeroData,
  NavLink,
  SummaryData,
  StatCard,
  SpotlightData,
  SpotlightStat,
  UrlRow,
  TimelineData,
  TimelinePoint,
  FindingsData,
  Finding,
  FilterOption,
  Severity,
  PasswordDonut,
  DonutSegment,
  PasswordBreakdownRow,
  HygieneData,
  HygieneSegment,
  FamiliesData,
  FamilyDatum,
  LockedReportsData,
} from "../types/report";

/* ----------------------------------------------------------------------
   Reveal / masking helpers
   ----------------------------------------------------------------------
   Every mapper that touches a sensitive value must go through one of
   these two instead of writing its own masking logic. There are two
   because the sensitive values end up in two different type contexts
   and one helper can't honestly serve both:

   - revealValue: for a sensitive value being interpolated into an HTML
     string (a bullet, a finding's desc, a URL row, etc). When locked,
     returns a masked placeholder span sized to roughly match the real
     value — this is what actually satisfies "never rendered in the
     DOM": the real number/string is never put in the string at all.

   - revealCount: for a sensitive value assigned directly to a typed
     `number` field that an animated stat/donut component reads
     (StatCard.target, SpotlightStat.target, HeroData.statTarget,
     DonutSegment/PasswordBreakdownRow.value). Those fields are typed
     `number` by the existing Report model, so they can't hold a masked
     placeholder string without changing that model and the components
     that read it. Zeroing them out until reveal keeps the real number
     out of the DOM without touching component code — the tradeoff is
     that locked stat counters/donuts show 0 rather than a blurred
     shape. Flagging this rather than assuming it's fine — if you'd
     rather have a visually "blurred" locked stat, that needs the
     StatCard/SpotlightStat/HeroData types changed to accept a masked
     string and the counter components updated to render it, which is
     a bigger, component-touching change than this pass makes.
   ---------------------------------------------------------------------- */

/** Wraps a sensitive value for HTML-string contexts. Locked → masked
 * placeholder span (real value never enters the string). Unlocked →
 * the real value, stringified. */
export function revealValue(
  value: string | number,
  isRevealed: boolean,
): string {
  if (isRevealed) {
    return String(value);
  }

  const str = String(value);
  const maskLength = Math.min(Math.max(str.length, 3), 10);

  return `
    <a
      href="#unlock"
      class="masked-link"
      onclick="document.getElementById('unlock')?.scrollIntoView({ behavior: 'smooth' }); return false;"
      aria-label="Unlock full report"
    >
      <span class="masked-text">${"•".repeat(maskLength)}</span>
    </a>
  `;
}

/** Counterpart for typed `number` fields that feed animated counters —
 * see note above for why this can't just be revealValue(). */
export function revealCount(value: number, isRevealed: boolean): number {
  return isRevealed ? value : 0;
}

/* ----------------------------------------------------------------------
   Static navigation config
   ---------------------------------------------------------------------- */

const NAVIGATION: NavLink[] = [
  { id: "overview", label: "Overview" },
  { id: "summary", label: "Summary" },
  { id: "spotlight", label: "Spotlight" },
  { id: "timeline", label: "Timeline" },
  { id: "findings", label: "Findings" },
  { id: "password-strength", label: "Password Strength" },
  { id: "malware-families", label: "Malware" },
  { id: "locked-reports", label: "Full Report" },
];

/* ----------------------------------------------------------------------
   Discovery normalization
   ---------------------------------------------------------------------- */

export interface NormalizedDiscovery {
  employee_urls: DiscoveryUrlEntry[];
  third_party_urls: DiscoveryUrlEntry[];
  user_urls: DiscoveryUrlEntry[];
}

export function normalizeDiscovery(
  discovery: DiscoveryResponse,
): NormalizedDiscovery {
  const employee_urls: DiscoveryUrlEntry[] = [];
  const third_party_urls: DiscoveryUrlEntry[] = [];
  const user_urls: DiscoveryUrlEntry[] = [];

  for (const item of discovery.data ?? []) {
    switch (item.type) {
      case "employee":
        employee_urls.push(item);
        break;

      case "user":
        user_urls.push(item);
        break;

      case "third_party":
        third_party_urls.push(item);
        break;
    }
  }

  return {
    employee_urls,
    third_party_urls,
    user_urls,
  };
}

/** Presence-only check — AssessmentResponse's real schema isn't confirmed
 * yet, so this only tests whether the response carries any field beyond
 * `domain`, without assuming any named field exists. */
function hasAssessmentSignal(assessment: AssessmentResponse): boolean {
  return Object.keys(assessment).filter((key) => key !== "domain").length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Overview's confirmed schema has no `industry` field yet. Defensive
 * extraction — same pattern as password_strength/device_hygiene — so we
 * never fabricate an industry name if one isn't actually present. */
function extractIndustry(entry: OverviewEntry | undefined): string {
  const industry = isRecord(entry) ? entry["industry"] : undefined;

  return typeof industry === "string" && industry.trim().length > 0
    ? industry.trim()
    : "";
}

function mapHero(
  overview: OverviewResponse,
  domain: string,
  isRevealed: boolean,
): HeroData {
  const entry: OverviewEntry | undefined = overview.data[0];

  const company = entry?.domain ?? domain;
  const employees = entry?.compromised_employees ?? 0;
  const users = entry?.compromised_users ?? 0;

  // No confirmed single "compromised machines" field on Overview yet —
  // documented as employees + users until one is confirmed.
  const totalMachines = employees + users;

  // Date Generated must represent when this report is generated,
  // NOT the date of the latest compromise.
  const reportDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    badgeText: "Live monitoring · Free preview · No login required",
    eyebrow: "External Cyber Risk Assessment",
    companyTitle: company,
    metaIndustry: extractIndustry(entry),
    metaDate: reportDate,
    metaTarget: company,
    description:
      `A domain intelligence sweep of <b>${company}</b> surfaced active ` +
      `exposures — all sourced from infostealer malware logs, with zero ` +
      `access to internal ${company} systems.`,
    statTarget: revealCount(totalMachines, isRevealed),
    statSuffix: "+",
    statLabel: "Compromised Machines",
    previewNote:
      `🔍 Free instant preview generated from public infostealer ` +
      `intelligence for <b>${company}</b>. Scroll to view risk report preview and unlock full report.`,
  };
}

/* ----------------------------------------------------------------------
   Summary mapping (Overview + Discovery + Assessment → SummaryData)
   ---------------------------------------------------------------------- */

const STAT_COLORS = {
  employees: "#ff4d4f",
  users: "#faad14",
  urls: "#597ef7",
  sensitiveApps: "#13c2c2",
} as const;

function mapSummary(
  overview: OverviewResponse,
  discovery: DiscoveryResponse,
  assessment: AssessmentResponse,
  isRevealed: boolean,
): SummaryData {
  const entry: OverviewEntry | undefined = overview.data[0];

  const employeesCompromised = entry?.compromised_employees ?? 0;
  const usersCompromised = entry?.compromised_users ?? 0;
  const sensitiveAppsCount = entry?.sensitive_applications?.length ?? 0;

  const { employee_urls, third_party_urls, user_urls } =
    normalizeDiscovery(discovery);

  const employeeUrlCount = employee_urls.length;
  const thirdPartyUrlCount = third_party_urls.length;
  const userUrlCount = user_urls.length;
  const totalExposedUrls = employeeUrlCount + thirdPartyUrlCount + userUrlCount;
  const bullets: string[] = [
    `<strong>${revealValue(employeesCompromised, isRevealed)}</strong> employee credential${employeesCompromised === 1 ? "" : "s"} found circulating on stealer log marketplaces.`,

    `<strong>${revealValue(usersCompromised, isRevealed)}</strong> customer/user credential${usersCompromised === 1 ? "" : "s"} exposed alongside this domain.`,

    `<strong>${revealValue(employeeUrlCount, isRevealed)}</strong> employee-linked login URL${employeeUrlCount === 1 ? "" : "s"} discovered in breach data.`,

    `<strong>${revealValue(thirdPartyUrlCount, isRevealed)}</strong> third-party service URL${thirdPartyUrlCount === 1 ? "" : "s"} tied to this domain found exposed.`,

    `<strong>${revealValue(userUrlCount, isRevealed)}</strong> user-facing URL${userUrlCount === 1 ? "" : "s"} discovered in the same breach data.`,

    sensitiveAppsCount > 0
      ? `<strong>${revealValue(sensitiveAppsCount, isRevealed)}</strong> sensitive internal application${sensitiveAppsCount === 1 ? "" : "s"} flagged as accessed by compromised machines.`
      : `No sensitive internal applications flagged by compromised machines at this time.`,

    `Additional risk assessment signals were identified for this domain.
  <a
    href="https://styxintel.com/book-a-demo?utm_source=riskreport&utm_medium=cta&utm_campaign=book_a_demo"
    target="_blank"
    rel="noopener noreferrer"
style="color:#FF9201;font-weight:600;text-decoration:none;"
  >
    Book a call
  </a>
  with a Styx representative to discuss receiving a full report.`,
  ];

  const statCards: StatCard[] = [
    {
      target: revealCount(employeesCompromised, true),
      suffix: "+",
      label: "Compromised Employees",
      color: STAT_COLORS.employees,
    },
    {
      target: revealCount(usersCompromised, true),
      suffix: "+",
      label: "Compromised Users",
      color: STAT_COLORS.users,
    },
    {
      target: revealCount(totalExposedUrls, true),
      suffix: "+",
      label: "Exposed URLs Discovered",
      color: STAT_COLORS.urls,
    },
    {
      target: revealCount(sensitiveAppsCount, true),
      suffix: "",
      label: "Sensitive Apps Flagged",
      color: STAT_COLORS.sensitiveApps,
    },
  ];

  return { bullets, statCards };
}

/* ----------------------------------------------------------------------
   Spotlight mapping (Discovery + Assessment → SpotlightData)
   ---------------------------------------------------------------------- */

const SPOTLIGHT_MAX_ROWS = 20;

const SCOPE_LABELS = {
  employee: "Employee",
  user: "User",
  thirdParty: "Third Party",
} as const;

interface MergedUrlEntry extends DiscoveryUrlEntry {
  scope: (typeof SCOPE_LABELS)[keyof typeof SCOPE_LABELS];
}

function mergeDiscoveryUrls(discovery: DiscoveryResponse): MergedUrlEntry[] {
  const { employee_urls, third_party_urls, user_urls } =
    normalizeDiscovery(discovery);

  return [
    ...employee_urls.map((e) => ({ ...e, scope: SCOPE_LABELS.employee })),
    ...user_urls.map((e) => ({ ...e, scope: SCOPE_LABELS.user })),
    ...third_party_urls.map((e) => ({ ...e, scope: SCOPE_LABELS.thirdParty })),
  ];
}

function mostRecentUploadDate(
  entries: { last_uploaded_date?: string | null }[],
): string | null {
  let latest: string | null = null;
  for (const e of entries) {
    if (!e.last_uploaded_date) continue;
    if (!latest || e.last_uploaded_date > latest) latest = e.last_uploaded_date;
  }
  return latest;
}

function extractHost(entry: DiscoveryUrlEntry): string {
  try {
    return new URL(entry.url).hostname;
  } catch {
    return entry.domain || entry.url;
  }
}

function mapSpotlight(
  discovery: DiscoveryResponse,
  assessment: AssessmentResponse,
  isRevealed: boolean,
): SpotlightData {
  const merged = mergeDiscoveryUrls(discovery);

  const totalUrlCount = merged.length;
  const totalOccurrences = merged.reduce((sum, e) => sum + e.occurrence, 0);
  const uniqueHostCount = new Set(merged.map(extractHost)).size;

  const latestUpload = mostRecentUploadDate(merged);

  const title =
    totalUrlCount > 0
      ? `<strong>${revealValue(totalUrlCount, isRevealed)}</strong> exposed login URL${totalUrlCount === 1 ? "" : "s"} found tied to compromised machines linked to this domain.`
      : `No exposed login URLs found in stealer log data for this domain.`;

  const badgeLabel = totalUrlCount > 0 ? "Active" : "No Activity Detected";

  const meta = latestUpload
    ? `Most recent detection: <strong>${revealValue(new Date(latestUpload).toLocaleDateString(), isRevealed)}</strong>`
    : `No detection date on record.`;

  const stats: SpotlightStat[] = [
    {
      target: revealCount(totalUrlCount, isRevealed),
      suffix: "+",
      label: "Exposed URLs Found",
    },
    {
      target: revealCount(totalOccurrences, isRevealed),
      suffix: "+",
      label: "Total Detections",
    },
    {
      target: revealCount(uniqueHostCount, isRevealed),
      suffix: "",
      label: "Unique Hosts Targeted",
    },
  ];

  // NOTE: `url` becomes a masked HTML span (not a valid href) while
  // locked. Fine if Spotlight.tsx renders url as text (same
  // dangerouslySetInnerHTML convention as the bullets above) — but if it
  // renders url as a clickable link's href, this will break the link
  // while locked. Flagging since Spotlight.tsx wasn't in view.
  const urlRows: UrlRow[] = [...merged]
    .sort((a, b) => b.occurrence - a.occurrence)
    .slice(0, SPOTLIGHT_MAX_ROWS)
    .map((e) => ({
      url: revealValue(e.url, isRevealed),
      scope: e.scope,
      occurrences: revealCount(e.occurrence, isRevealed),
    }));

  const shownCount = urlRows.length;
  const footNote =
    totalUrlCount > shownCount
      ? `Showing top <strong>${revealValue(shownCount, isRevealed)}</strong> of <strong>${revealValue(totalUrlCount, isRevealed)}</strong> total URLs discovered, sourced from Styx Intelligence.`
      : `<strong>${revealValue(shownCount, isRevealed)}</strong> total URL${shownCount === 1 ? "" : "s"}  discovered, sourced from Styx Intelligence. ` +
        (hasAssessmentSignal(assessment)
          ? `Additional assessment signals are available through a meeting with a 
            <a
              href="https://styxintel.com/book-a-demo/"
              target="_blank"
              rel="noopener noreferrer"
              style="color:#FF9201;font-weight:600;text-decoration:none;"
            >
              
            </a>
          Styx representative.`
          : ``);
  return { title, badgeLabel, meta, stats, urlRows, footNote };
}

/* ----------------------------------------------------------------------
   Timeline mapping (Overview + Discovery → TimelineData)
   ---------------------------------------------------------------------- */

type TimelineBucketKind = "employees" | "users";

interface TimelineEvent {
  date: string;
  kind: TimelineBucketKind;
}

function yearOf(date: string): string | null {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return String(parsed.getFullYear());
}

function mapTimeline(
  overview: OverviewResponse,
  discovery: DiscoveryResponse,
  isRevealed: boolean,
): TimelineData {
  const entry: OverviewEntry | undefined = overview.data[0];
  const { employee_urls, user_urls } = normalizeDiscovery(discovery);

  const events: TimelineEvent[] = [];

  const addIfPresent = (
    date: string | null | undefined,
    kind: TimelineBucketKind,
  ) => {
    if (date) events.push({ date, kind });
  };

  addIfPresent(entry?.last_employee_compromised, "employees");
  addIfPresent(entry?.last_employee_uploaded, "employees");
  addIfPresent(entry?.last_user_compromised, "users");
  addIfPresent(entry?.last_user_uploaded, "users");

  for (const url of employee_urls)
    addIfPresent(url.last_uploaded_date, "employees");
  for (const url of user_urls) addIfPresent(url.last_uploaded_date, "users");

  const buckets = new Map<string, { employees: number; users: number }>();

  for (const event of events) {
    const year = yearOf(event.date);
    if (!year) continue;

    const bucket = buckets.get(year) ?? { employees: 0, users: 0 };
    bucket[event.kind] += 1;
    buckets.set(year, bucket);
  }

  // `year` itself stays unmasked — it's the chart's x-axis, not a
  // sensitive value, and masking it would break the axis. Only the
  // per-year counts (the actual sensitive numbers) are gated.
  const points: TimelinePoint[] = Array.from(buckets.entries())
    .map(([year, counts]) => ({
      year,
      employees: revealCount(counts.employees, isRevealed),
      users: revealCount(counts.users, isRevealed),
    }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  return { points };
}

/* ----------------------------------------------------------------------
   Findings mapping (Overview + Discovery + Assessment → FindingsData)
   ---------------------------------------------------------------------- */

const FINDINGS_FILTERS: FilterOption[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

const SEVERITY_THRESHOLDS = {
  employeesCritical: 10,
  usersHigh: 10,
  employeeUrlsCritical: 5,
  userUrlsHigh: 5,
} as const;

function mapFindings(
  overview: OverviewResponse,
  discovery: DiscoveryResponse,
  assessment: AssessmentResponse,
  isRevealed: boolean,
): FindingsData {
  const entry: OverviewEntry | undefined = overview.data[0];
  const { employee_urls, third_party_urls, user_urls } =
    normalizeDiscovery(discovery);

  const employeesCompromised = entry?.compromised_employees ?? 0;
  const usersCompromised = entry?.compromised_users ?? 0;
  const sensitiveApps = entry?.sensitive_applications ?? [];

  const items: Finding[] = [];

  // NOTE: severity classification below (`sev`/`badge`) still branches on
  // the *real* underlying counts — only the numbers rendered in `desc`/
  // `title` are masked. The severity badge itself isn't treated as a
  // sensitive value here (it wasn't listed in the spec's masking list),
  // just the literal counts/names.

  if (employeesCompromised > 0) {
    items.push({
      sev:
        employeesCompromised >= SEVERITY_THRESHOLDS.employeesCritical
          ? "critical"
          : "high",
      badge:
        employeesCompromised >= SEVERITY_THRESHOLDS.employeesCritical
          ? "Critical"
          : "High",
      title: "Employee credentials compromised",
      desc: `<strong>${revealValue(employeesCompromised, isRevealed)}</strong> employee credential${employeesCompromised === 1 ? "" : "s"} tied to this domain found on stealer log marketplaces.`,
    });
  }

  const employeeUrlCount = employee_urls.length;
  if (employeeUrlCount > 0) {
    items.push({
      sev:
        employeeUrlCount >= SEVERITY_THRESHOLDS.employeeUrlsCritical
          ? "critical"
          : "high",
      badge:
        employeeUrlCount >= SEVERITY_THRESHOLDS.employeeUrlsCritical
          ? "Critical"
          : "High",
      title: "Internal login portals exposed",
      desc: `<strong>${revealValue(employeeUrlCount, isRevealed)}</strong> employee-linked login URL${employeeUrlCount === 1 ? "" : "s"} discovered in breach data, indicating direct exposure of internal systems.`,
    });
  }

  for (const app of sensitiveApps) {
    const sev: Severity = app.sensitivity === "high" ? "high" : "medium";
    const severityLabel = sev === "high" ? "High" : "Medium";

    items.push({
      sev,
      badge: severityLabel,
      title: `Sensitive application flagged: ${revealValue(app.keyword, isRevealed)}`,
      desc: `Compromised machines linked to this domain were seen accessing "${revealValue(app.keyword, isRevealed)}", flagged as ${severityLabel} sensitivity.`,
    });
  }

  const userUrlCount = user_urls.length;
  if (userUrlCount > 0) {
    items.push({
      sev: userUrlCount >= SEVERITY_THRESHOLDS.userUrlsHigh ? "high" : "medium",
      badge:
        userUrlCount >= SEVERITY_THRESHOLDS.userUrlsHigh ? "High" : "Medium",
      title: "User-facing login URLs exposed",
      desc: `<strong>${revealValue(userUrlCount, isRevealed)}</strong> user-facing URL${userUrlCount === 1 ? "" : "s"} discovered in the same breach data, potentially affecting customers.`,
    });
  }

  if (usersCompromised > 0) {
    items.push({
      sev:
        usersCompromised >= SEVERITY_THRESHOLDS.usersHigh ? "high" : "medium",
      badge:
        usersCompromised >= SEVERITY_THRESHOLDS.usersHigh ? "High" : "Medium",
      title: "Customer/user credentials compromised",
      desc: `<strong>${revealValue(usersCompromised, isRevealed)}</strong> user credential${usersCompromised === 1 ? "" : "s"} exposed alongside this domain.`,
    });
  }

  const thirdPartyCount = third_party_urls.length;
  if (thirdPartyCount > 0) {
    items.push({
      sev: "medium",
      badge: "Medium",
      title: "Third-party services targeted",
      desc: `<strong>${revealValue(thirdPartyCount, isRevealed)}</strong> third-party service URL${thirdPartyCount === 1 ? "" : "s"} tied to this domain found in stealer log data.`,
    });
  }

  if (hasAssessmentSignal(assessment)) {
    items.push({
      sev: "medium",
      badge: "Medium",
      title: "Additional assessment signals identified",
      desc: `Further risk assessment data is available for this domain.
<a
  href="https://styxintel.com/book-a-demo?utm_source=riskreport&utm_medium=cta&utm_campaign=book_a_demo"
  target="_blank"
  rel="noopener noreferrer"
  style="color:#FF9201;font-weight:600;text-decoration:none;"
>
  Book a call
</a>
to discuss accessing a full report.`,
    });
  }

  return { filters: FINDINGS_FILTERS, items };
}

/* ----------------------------------------------------------------------
   Password Strength mapping (Overview + Assessment → passwordStrength)
   ---------------------------------------------------------------------- */

interface HopedForPasswordBucket {
  weak?: number;
  medium?: number;
  strong?: number;
}
interface HopedForAvSegment {
  name?: string;
  pct?: number;
  color?: string;
}

function extractPasswordBucket(
  assessment: AssessmentResponse,
  scope: "employees" | "users",
): HopedForPasswordBucket | null {
  const root = (assessment as Record<string, unknown>).password_strength;
  if (!isRecord(root)) return null;

  const bucket = root[scope];
  if (!isRecord(bucket)) return null;

  const weak = typeof bucket.weak === "number" ? bucket.weak : undefined;
  const medium = typeof bucket.medium === "number" ? bucket.medium : undefined;
  const strong = typeof bucket.strong === "number" ? bucket.strong : undefined;

  if (weak === undefined && medium === undefined && strong === undefined) {
    return null;
  }
  return { weak, medium, strong };
}

const PASSWORD_BUCKET_COLORS = {
  weak: "#ff4d4f",
  medium: "#faad14",
  strong: "#52c41a",
} as const;

function buildPasswordDonut(
  title: string,
  bucket: HopedForPasswordBucket | null,
  isRevealed: boolean,
): PasswordDonut {
  if (!bucket) {
    return { title, segments: [], breakdown: [] };
  }

  const weak = bucket.weak ?? 0;
  const medium = bucket.medium ?? 0;
  const strong = bucket.strong ?? 0;

  // NOTE: zeroing weak/medium/strong pre-reveal means the donut renders
  // empty/flat until unlock (same tradeoff as the stat cards — see the
  // revealCount doc comment above). If you'd rather show a "locked"
  // placeholder ring, that needs PasswordStrength.tsx to render one
  // itself when isRevealed is false, which is a component change.
  const segments: DonutSegment[] = [
    ["Weak", revealCount(weak, isRevealed)],
    ["Medium", revealCount(medium, isRevealed)],
    ["Strong", revealCount(strong, isRevealed)],
  ];

  const breakdown: PasswordBreakdownRow[] = [
    {
      color: PASSWORD_BUCKET_COLORS.weak,
      label: "Weak",
      value: revealCount(weak, isRevealed),
    },
    {
      color: PASSWORD_BUCKET_COLORS.medium,
      label: "Medium",
      value: revealCount(medium, isRevealed),
    },
    {
      color: PASSWORD_BUCKET_COLORS.strong,
      label: "Strong",
      value: revealCount(strong, isRevealed),
    },
  ];

  return { title, segments, breakdown };
}

function extractAvSegments(
  assessment: AssessmentResponse,
): HygieneSegment[] | null {
  const root = (assessment as Record<string, unknown>).device_hygiene;
  if (!isRecord(root)) return null;

  const av = root.av;
  if (!Array.isArray(av)) return null;

  const segments: HygieneSegment[] = [];
  for (const raw of av as HopedForAvSegment[]) {
    if (
      typeof raw?.name === "string" &&
      typeof raw?.pct === "number" &&
      typeof raw?.color === "string"
    ) {
      segments.push({ name: raw.name, pct: raw.pct, color: raw.color });
    }
  }
  return segments.length > 0 ? segments : null;
}

function buildAppNote(overview: OverviewResponse, isRevealed: boolean): string {
  const entry: OverviewEntry | undefined = overview.data[0];
  const apps = entry?.sensitive_applications ?? [];

  if (apps.length === 0) {
    return "No sensitive application infections detected on compromised machines linked to this domain.";
  }

  const list = apps
    .map(
      (app) => `${revealValue(app.keyword, isRevealed)} (${app.sensitivity})`,
    )
    .join(", ");

  return `<strong>${revealValue(apps.length, isRevealed)}</strong> sensitive application${apps.length === 1 ? "" : "s"} flagged as accessed by compromised machines: ${list}.`;
}

function mapPasswordStrength(
  overview: OverviewResponse,
  assessment: AssessmentResponse,
  isRevealed: boolean,
): { employees: PasswordDonut; users: PasswordDonut; hygiene: HygieneData } {
  const employeeBucket = extractPasswordBucket(assessment, "employees");
  const userBucket = extractPasswordBucket(assessment, "users");
  const avSegments = extractAvSegments(assessment);

  return {
    employees: buildPasswordDonut(
      "Employee Passwords",
      employeeBucket,
      isRevealed,
    ),
    users: buildPasswordDonut("User Passwords", userBucket, isRevealed),
    hygiene: {
      // `pct` is masked too — "Percentages" was explicitly in the spec's
      // PasswordStrength masking list. `name`/`color` aren't sensitive.
      avSegments: (avSegments ?? []).map((seg) => ({
        ...seg,
        pct: revealCount(seg.pct, isRevealed),
      })),
      appNote: buildAppNote(overview, isRevealed),
    },
  };
}

/* ----------------------------------------------------------------------
   Malware Families mapping (Overview + Discovery + Assessment → FamiliesData)

   HudsonRock's confirmed Overview/Discovery schemas carry NO malware
   family field anywhere (no "redline", "raccoon", "vidar", etc. — those
   would be fabricated if hardcoded). AssessmentResponse's real schema is
   still unconfirmed (`{ domain; [key: string]: unknown }`), so this
   follows the exact same defensive-extraction pattern already used for
   password_strength / device_hygiene above:

     1. If Assessment ever exposes a confirmed `malware_families` array
        (`{ name: string; count: number }[]`), use it — real data, no
        change needed anywhere else in this file.
     2. Until then, fall back to categories that ARE backed by confirmed
        fields: the three Discovery URL groups (employee/user/third-party)
        plus Overview's sensitive_applications[]. These are exposure
        categories, not malware family names — the footnote says so
        explicitly rather than implying attribution HudsonRock never gave.

   No malware name is ever invented. If there's no data to categorize,
   families is returned empty (same "documented placeholder" pattern as
   the password donuts) instead of rendering a fake chart.

   NOT part of this reveal pass: the spec's masking list (items 6–11)
   names Summary, Spotlight, Findings, Timeline, PasswordStrength, and
   Hero specifically — Malware Families isn't in it, so it's left
   exactly as it was, un-gated by isRevealed. Say the word if it should
   be masked too.
   ---------------------------------------------------------------------- */

interface HopedForMalwareFamilyEntry {
  name?: string;
  count?: number;
}

/** Defensively reads `assessment.malware_families` if present — an array
 * of { name, count }. Returns null (not []) when missing/malformed, and
 * drops any entry that isn't a well-formed, positive-count record. */
function extractMalwareFamilies(
  assessment: AssessmentResponse,
): { name: string; count: number }[] | null {
  const raw = (assessment as Record<string, unknown>).malware_families;
  if (!Array.isArray(raw)) return null;

  const families: { name: string; count: number }[] = [];
  for (const item of raw as HopedForMalwareFamilyEntry[]) {
    if (
      typeof item?.name === "string" &&
      item.name.trim().length > 0 &&
      typeof item?.count === "number" &&
      item.count > 0
    ) {
      families.push({ name: item.name, count: item.count });
    }
  }
  return families.length > 0 ? families : null;
}

/**
 * Fallback used only when Assessment carries no confirmed malware-family
 * field. Derives honest, non-fabricated categories from data already
 * confirmed and used elsewhere in this mapper: the three normalized
 * Discovery URL groups and Overview's sensitive_applications[]. A group
 * with zero entries is omitted rather than shown as a 0-count row.
 */
function deriveExposureCategories(
  overview: OverviewResponse,
  discovery: DiscoveryResponse,
): { name: string; count: number }[] {
  const entry: OverviewEntry | undefined = overview.data[0];
  const { employee_urls, third_party_urls, user_urls } =
    normalizeDiscovery(discovery);
  const sensitiveApps = entry?.sensitive_applications ?? [];

  const categories: { name: string; count: number }[] = [];

  if (employee_urls.length > 0) {
    categories.push({
      name: "Employee Portal Exposure",
      count: employee_urls.length,
    });
  }
  if (user_urls.length > 0) {
    categories.push({
      name: "User-Facing Exposure",
      count: user_urls.length,
    });
  }
  if (third_party_urls.length > 0) {
    categories.push({
      name: "Third-Party Service Exposure",
      count: third_party_urls.length,
    });
  }
  if (sensitiveApps.length > 0) {
    categories.push({
      name: "Sensitive Application Access",
      count: sensitiveApps.length,
    });
  }

  return categories;
}

/**
 * Largest-remainder rounding: converts raw counts into integer
 * percentages that always sum to exactly 100 (plain Math.round per item
 * can drift a point or two off 100 with 3+ buckets). `counts` must be
 * non-empty with a positive sum — callers guard the zero-total case
 * before calling this.
 */
function largestRemainderPercentages(counts: number[]): number[] {
  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return counts.map(() => 0);

  const raw = counts.map((c) => (c / total) * 100);
  const floors = raw.map(Math.floor);
  let remainder = 100 - floors.reduce((sum, f) => sum + f, 0);

  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    result[order[k].i] += 1;
  }
  return result;
}

/**
 * Builds the exact FamiliesData shape MalwareFamilies.tsx expects. All
 * counting, sorting, and percentage math happens here — the component
 * only renders `{ name, count, pct }` rows plus a footnote, unchanged.
 */
function mapMalwareFamilies(
  overview: OverviewResponse,
  discovery: DiscoveryResponse,
  assessment: AssessmentResponse,
): FamiliesData {
  const realFamilies = extractMalwareFamilies(assessment);
  const usingRealMalwareData = realFamilies !== null;
  const source = realFamilies ?? deriveExposureCategories(overview, discovery);

  if (source.length === 0) {
    return {
      families: [],
      footNote:
        "No malware family or exposure category data available for this domain.",
    };
  }

  const sorted = [...source].sort((a, b) => b.count - a.count);
  const counts = sorted.map((s) => s.count);
  const pcts = largestRemainderPercentages(counts);
  const totalCount = counts.reduce((sum, c) => sum + c, 0);

  const families: FamilyDatum[] = sorted.map((s, i) => ({
    name: s.name,
    count: s.count,
    pct: pcts[i],
  }));

  const footNote = usingRealMalwareData
    ? `Malware family distribution based on ${totalCount} detection${totalCount === 1 ? "" : "s"} across compromised machines linked to this domain, sourced from HudsonRock Cybercrime Intelligence.`
    : `No malware family attribution is currently available from Styx Intelligence for this domain. The breakdown above reflects the distribution of discovered exposure categories (employee, user, third-party, and sensitive-application access) rather than named malware families.`;

  return { families, footNote };
}

/* ----------------------------------------------------------------------
   Empty placeholders for sections not yet mapped
   ---------------------------------------------------------------------- */

function emptyLockedReports(): LockedReportsData {
  return { cards: [] };
}

/* ----------------------------------------------------------------------
   Complete report mapper
   ---------------------------------------------------------------------- */

export interface MapperResult {
  ui: Report;
  raw: CompleteDomainReport;
}

// SCOPE NOTE: masking is live for Summary only, for now. Hero, Spotlight,
// Timeline, Findings, and PasswordStrength are all already wired to take
// isRevealed (signatures unchanged), but are called with `true` below so
// they render unmasked regardless of actual reveal state — flip each
// one back to `isRevealed` when told which section to turn on next.
export function mapCompleteReport(
  raw: CompleteDomainReport,
  domain: string,
  isRevealed: boolean,
): MapperResult {
  const ui: Report = {
    navigation: NAVIGATION,

    domain: raw.overview.data[0]?.domain ?? domain,

    hero: mapHero(raw.overview, domain, true),
    summary: mapSummary(
      raw.overview,
      raw.discovery,
      raw.assessment,
      isRevealed,
    ),
    spotlight: mapSpotlight(raw.discovery, raw.assessment, true),
    timeline: mapTimeline(raw.overview, raw.discovery, true),
    findings: mapFindings(
      raw.overview,
      raw.discovery,
      raw.assessment,
      isRevealed,
    ),
    passwordStrength: mapPasswordStrength(raw.overview, raw.assessment, true),
    families: mapMalwareFamilies(raw.overview, raw.discovery, raw.assessment),
    lockedReports: emptyLockedReports(),
  };

  return { ui, raw };
}

export type MappedDomainReport = ReturnType<typeof mapCompleteReport>;

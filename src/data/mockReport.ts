import type { Report, NavLink, FilterOption } from "../types/report";

/* ======================================================================
   MOCK REPORT DATA
   Every static value the dashboard renders lives here. Nothing in the
   component tree hardcodes content — everything arrives via props, and
   this file is the thing that gets swapped out for a real API response.
   ====================================================================== */

export const NAV_LINKS: NavLink[] = [
  { id: "overview", label: "Overview" },
  { id: "findings", label: "Findings" },
  { id: "timeline", label: "Timeline" },
  { id: "families", label: "Malware" },
  { id: "unlock", label: "Unlock Report" },
];

export const FILTERS: FilterOption[] = [
  { key: "all", label: "All (7)" },
  { key: "critical", label: "Critical (2)" },
  { key: "vhigh", label: "V.High (2)" },
  { key: "high", label: "High (2)" },
  { key: "medium", label: "Medium (1)" },
];

export const mockReport: Report = {
  navigation: NAV_LINKS,

  hero: {
    headline: "Externall Cyber Risk Assessment",
    title: "ATB Financial",
    metaCompany: "Financial Services",
    metaDate: "7 July 2026",
    metaTarget: "atb.com",
    description:
      "A domain intelligence sweep of <strong>atb.com</strong> surfaced active exposures — all sourced from infostealer malware logs, with zero access to internal ATB systems.",
    statTarget: 1186,
    statSuffix: "+",
    statLabel: "Compromised Machines",
    previewNote:
      "🔍 Free instant preview generated from public infostealer intelligence for <strong>atb.com</strong>. Scroll to unlock the full assessment.",
  },

  summary: {
    bullets: [
      "<strong>1,186+ compromised machines</strong> tied to atb.com — 3+ employees and 1,183+ customers/users with credentials exposed",
      "<strong>939 infostealer log hits</strong> against identity.auth.atb.com/login — ATB's primary online banking authentication endpoint",
      "<strong>24+ third-party credentials</strong> compromised, alongside <strong>103+ compromised assets</strong> linked to the ATB domain",
      "<strong>57% of monitored customer passwords</strong> (1,811+ analysed) rated Weak or Too Weak — just 33% rated Strong",
      "<strong>3 employees compromised</strong> with exposure flagged on the <strong>sso</strong> application — a potential foothold into enterprise single sign-on",
      "<strong>8 distinct infostealer families</strong> at play — Generic Stealer, Lumma, RedLine, Raccoon and others — consistent with ongoing, not one-off, exposure",
      "<strong>Live session cookies</strong> for Google, LinkedIn, PayPal &amp; Zoom found on the same infected machines — account-takeover risk extends beyond ATB's own perimeter",
    ],
    statCards: [
      {
        target: 1186,
        suffix: "+",
        label: "Compromised machines",
        color: "#EA447B",
      },
      {
        target: 3,
        suffix: "+",
        label: "Compromised employees",
        color: "#25E47B",
      },
      {
        target: 1183,
        suffix: "+",
        label: "Compromised users",
        color: "#3A4CA9",
      },
      {
        target: 24,
        suffix: "+",
        label: "3rd-party credentials",
        color: "#E38065",
      },
      {
        target: 103,
        suffix: "+",
        label: "Compromised assets",
        color: "#288AE2",
      },
    ],
  },

  spotlight: {
    title:
      "1,183+ customers/users compromised — online banking &amp; shop portals targeted",
    badgeLabel: "Active Infostealer",
    meta: "Source: Styx Intelligence Cavalier (via Styx Intelligence) &nbsp;·&nbsp; Scope: 3+ employees, 1,183+ users, 24+ third-party credentials &nbsp;·&nbsp; Timeline: active since 2022, 166+ new machines already in 2026",
    stats: [
      { target: 1183, suffix: "+", label: "Compromised users" },
      { target: 939, suffix: "", label: "Hits on login endpoint" },
      { target: 3, suffix: "+", label: "Employees compromised" },
    ],
    urlRows: [
      {
        url: "https://identity.auth.atb.com/login",
        scope: "User",
        occurrences: 939,
      },
      { url: "https://shop.atb.com/sign-up", scope: "User", occurrences: 333 },
      {
        url: "https://login.atb.com/as/authorization.oauth2",
        scope: "User",
        occurrences: 184,
      },
      { url: "https://get.atb.com/login", scope: "User", occurrences: 121 },
      { url: "https://shop.atb.com", scope: "User", occurrences: 121 },
      {
        url: "https://identity.atb.com/app/.../sso/saml",
        scope: "Employee",
        occurrences: 2,
      },
    ],
    footNote:
      "Showing top-occurrence URLs only. Full URL breakdown — including identity.auth.atb.com, shop.atb.com/login and login.atb.com/idp/SSO.saml2 — available on request. Click a column header to sort.",
  },

  timeline: {
    points: [
      { year: "2022", employees: 0, users: 143 },
      { year: "2023", employees: 0, users: 327 },
      { year: "2024", employees: 3, users: 198 },
      { year: "2025", employees: 0, users: 211 },
      { year: "2026 (YTD)", employees: 0, users: 166 },
    ],
  },

  findings: {
    filters: FILTERS,
    items: [
      {
        sev: "critical",
        badge: "Critical",
        title:
          "939 infostealer log hits against ATB's core online banking login endpoint",
        desc: "identity.auth.atb.com/login is the single most-targeted URL in the dataset — harvested credentials here give direct access to customer online banking sessions.",
      },
      {
        sev: "critical",
        badge: "Critical",
        title: "1,183+ customers/users with infostealer-exposed credentials",
        desc: "Credentials span online banking (identity.auth.atb.com, login.atb.com) and shop.atb.com — a large, active pool of exploitable customer accounts.",
      },
      {
        sev: "vhigh",
        badge: "V.High",
        title: "3 employees compromised, with exposure on the sso application",
        desc: "Infected employee machines carried access tied to identity.atb.com's VMware Workspace ONE / SSO SAML flow — a plausible pivot point into internal enterprise systems.",
      },
      {
        sev: "vhigh",
        badge: "V.High",
        title: "24+ third-party credentials compromised on infected devices",
        desc: "Credentials for services outside atb.com were harvested from the same machines — raising credential-reuse and lateral-access risk into ATB-connected systems.",
      },
      {
        sev: "high",
        badge: "High",
        title: "57% of monitored customer passwords rated Weak or Too Weak",
        desc: "Across 1,811+ analysed passwords: 9% Too Weak, 48% Weak, 10% Medium, only 33% Strong — a large share of accounts are trivially brute-forceable.",
      },
      {
        sev: "high",
        badge: "High",
        title: "8 distinct infostealer families driving the compromise",
        desc: "Generic Stealer (32.3%), Lumma (25.1%) and RedLine (20.6%) account for the majority — broad commodity malware exposure rather than a single contained incident.",
      },
      {
        sev: "medium",
        badge: "Medium",
        title:
          "Live third-party session cookies found on infected atb.com machines",
        desc: "Session cookies for google.com (140+), hp.com (38+), live.com (26+), linkedin.com (24+), facebook.com (24+), paypal.com (22+) and zoom.us (20+) were also captured — exposure isn't contained to ATB systems.",
      },
    ],
  },

  passwordStrength: {
    employees: {
      title: "Password Strength — Employees (3+)",
      segments: [
        ["#ff4d4d", 33],
        ["#f5a623", 0.001],
        ["#2997f6", 0.001],
        ["#22c55e", 66.998],
      ],
      breakdown: [
        { color: "var(--critical)", label: "Too Weak", value: 33 },
        { color: "var(--high)", label: "Weak", value: 0 },
        { color: "var(--medium)", label: "Medium", value: 0 },
        { color: "var(--good)", label: "Strong", value: 67 },
      ],
    },
    users: {
      title: "Password Strength — Users (1,811+)",
      segments: [
        ["#ff4d4d", 9],
        ["#f5a623", 48],
        ["#2997f6", 10],
        ["#22c55e", 33],
      ],
      breakdown: [
        { color: "var(--critical)", label: "Too Weak", value: 9 },
        { color: "var(--high)", label: "Weak", value: 48 },
        { color: "var(--medium)", label: "Medium", value: 10 },
        { color: "var(--good)", label: "Strong", value: 33 },
      ],
    },
    hygiene: {
      avSegments: [
        { name: "Premium", pct: 50, color: "var(--good)" },
        { name: "Free", pct: 50, color: "var(--high)" },
      ],
      appNote:
        "Compromised employee credentials tagged against <strong>sso</strong> — despite half of employees running premium AV, infostealer malware still reached SSO-adjacent credentials.",
    },
  },

  families: {
    families: [
      { name: "Generic Stealer", count: 375, pct: 32.3 },
      { name: "Lumma", count: 292, pct: 25.1 },
      { name: "RedLine", count: 239, pct: 20.6 },
      { name: "Raccoon", count: 113, pct: 9.7 },
      { name: "Acreed", count: 53, pct: 4.6 },
      { name: "Vidar", count: 36, pct: 3.1 },
      { name: "Azorult", count: 34, pct: 2.9 },
      { name: "StealC", count: 20, pct: 1.7 },
    ],
    footNote:
      "Generic Stealer, Lumma and RedLine together account for ≈78% of identified compromises — the three most prolific commodity infostealer families in circulation today.",
  },

  lockedReports: {
    cards: [
      {
        title: "Overall Cyber Risk Score",
        teaser:
          "ATB Fiinancial's composite risk score, benchmarked against financial-services peers and calculated across 50+ signal categories — delivered in your emailed report.",
        redactWidths: [90, 70],
      },
      {
        title: "TLS/SSL Certificate Health",
        teaser:
          "Full inventory of expired, self-signed and misconfigured certificates across every discovered atb.com subdomain — delivered in your emailed report.",
        redactWidths: [85, 60, 75],
      },
      {
        title: "Third-Party Data Breach Exposure",
        teaser:
          "Complete breach history for atb.com email addresses — source, date, severity and record counts — delivered in your emailed report.",
        redactWidths: [92, 80, 65],
      },
      {
        title: "Brand Impersonation & Lookalike Domains",
        teaser:
          "All typosquats, fake social accounts and phishing infrastructure impersonating the ATB brand, ranked by severity — delivered in your emailed report.",
        redactWidths: [70, 95, 55],
      },
      {
        title: "DNS & Email Authentication (SPF/DKIM/DMARC)",
        teaser:
          "SPF, DKIM and DMARC configuration status across every atb.com mail-sending domain — delivered in your emailed report.",
        redactWidths: [60, 60],
      },
      {
        title: "Malware & Exploit Blocklist Status",
        teaser:
          "Any ATB-linked infrastructure currently flagged on active threat intelligence blocklists, with IP and hostname detail — delivered in your emailed report.",
        redactWidths: [80, 50, 68],
      },
    ],
  },
};

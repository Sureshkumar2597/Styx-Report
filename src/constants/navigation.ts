import type { NavLink } from "../types/report";

/**
 * Section ids used for both the topbar links and the scroll-spy
 * IntersectionObserver — kept in one place so they can't drift apart.
 */
export const SCROLLSPY_SECTION_IDS: string[] = [
  "overview",
  "findings",
  "timeline",
  "families",
  "unlock",
];

export const DEFAULT_ACTIVE_SECTION: NavLink["id"] = "overview";

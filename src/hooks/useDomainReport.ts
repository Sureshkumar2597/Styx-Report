/* ======================================================================
   USE DOMAIN REPORT
   Fetches overview + discovery + assessment together via
   getCompleteReport() (parallel under the hood, single AbortSignal,
   cached 5 min per domain+endpoint), then maps the raw responses into
   a single `report` object ({ ui, raw }) via the report mapper.

   Definitions (spec named these fields without defining them, so
   stating the assumption explicitly — flag if this isn't what you meant):
   - isLoaded: the current fetch cycle has finished (success OR error).
   - hasData: all three sub-responses came back successfully.
   - isEmpty: hasData is true, but overview has no entries and none of
     discovery's three URL groups have entries either.

   Reveal/lock:
   `isRevealed` comes from RevealContext (the single source of truth) and
   is passed straight into mapCompleteReport(). It's in the `report`
   memo's dependency array, so flipping isRevealed re-runs the mapper
   against the same cached `data` — no refetch, no page reload.
   ====================================================================== */

import { useMemo } from "react";
import { useAsyncDomainQuery } from "./internal/useAsyncDomainQuery";
import { getCompleteReport } from "../services/domain.service";
import type { CompleteDomainReport } from "../services/domain.service";
import {
  mapCompleteReport,
  normalizeDiscovery,
} from "../mappers/report.mapper";
import type { MappedDomainReport } from "../mappers/report.mapper";
import type { ApiError } from "../types/api";
import { useReveal } from "../context/RevealContext";

export interface UseDomainReportResult {
  loading: boolean;
  error: ApiError | null;
  report: MappedDomainReport | null;
  hasData: boolean;
  isEmpty: boolean;
  isLoaded: boolean;
  lastUpdated: number | null;
  refresh: () => void;
}

export function useDomainReport(domain: string | null): UseDomainReportResult {
  const { data, loading, error, lastUpdated, refetch } =
    useAsyncDomainQuery<CompleteDomainReport>(domain, getCompleteReport);

  const { isRevealed } = useReveal();

  const hasData =
    data !== null &&
    data.overview !== null &&
    data.discovery !== null &&
    data.assessment !== null;

  // Depends on `data` directly (the single source of truth) rather than
  // three derived consts, so the memo can never go stale if overview/
  // discovery/assessment ever stop resolving in lockstep. Discovery's
  // three URL groups are read via normalizeDiscovery() since the real
  // API nests them inside `discovery.data`, not as flat top-level
  // properties — see report.mapper.ts for the shape mismatch this fixes.
  const isEmpty = useMemo(() => {
    if (!data) return false;
    const { overview, discovery, assessment } = data;
    if (!overview || !discovery || !assessment) return false;
    const { employee_urls, third_party_urls, user_urls } =
      normalizeDiscovery(discovery);
    return (
      overview.data.length === 0 &&
      employee_urls.length === 0 &&
      third_party_urls.length === 0 &&
      user_urls.length === 0
    );
  }, [data]);

  const isLoaded = !loading && (hasData || error !== null);

  // Lightweight combine — no cloning, no recompute unless `data`,
  // `domain`, or `isRevealed` actually changes. Rebuilding the mapped UI
  // on an isRevealed flip is exactly the "no refetch" reveal: same
  // cached raw `data`, mapCompleteReport just re-runs with the new flag.
  const report = useMemo<MappedDomainReport | null>(() => {
    if (!data || !domain) return null;
    return mapCompleteReport(data, domain, isRevealed);
  }, [data, domain, isRevealed]);

  return {
    loading,
    error,
    report,
    hasData,
    isEmpty,
    isLoaded,
    lastUpdated,
    refresh: refetch,
  };
}

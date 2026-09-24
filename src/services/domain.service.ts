/* ======================================================================
   DOMAIN SERVICE
   HudsonRock search-by-domain methods. getCompleteReport fans out
   overview/discovery/assessment in parallel via Promise.all — never
   sequentially.
   ====================================================================== */

import { hudsonRockRequest } from "./api";
import { HUDSONROCK_ENDPOINTS } from "./endpoints";
import type { OverviewResponse } from "../types/overview";
import type { DiscoveryResponse } from "../types/discovery";
import type { AssessmentResponse } from "../types/assessment";

export interface CompleteDomainReport {
  overview: OverviewResponse;
  discovery: DiscoveryResponse;
  assessment: AssessmentResponse;
}

export async function getOverview(
  domain: string,
  signal?: AbortSignal,
): Promise<OverviewResponse> {
  return hudsonRockRequest<OverviewResponse>({
    url: HUDSONROCK_ENDPOINTS.OVERVIEW,
    method: "POST",
    data: { domains: [domain] },
    signal,
  });
}

export async function getDiscovery(
  domain: string,
  signal?: AbortSignal,
): Promise<DiscoveryResponse> {
  return hudsonRockRequest<DiscoveryResponse>({
    url: HUDSONROCK_ENDPOINTS.DISCOVERY,
    method: "POST",
    data: { domains: [domain] },
    signal,
  });
}

export async function getAssessment(
  domain: string,
  signal?: AbortSignal,
): Promise<AssessmentResponse> {
  return hudsonRockRequest<AssessmentResponse>({
    url: HUDSONROCK_ENDPOINTS.ASSESSMENT,
    method: "POST",
    data: { domain },
    signal,
  });
}

/** Fetches overview, discovery, and assessment in parallel. */
export async function getCompleteReport(
  domain: string,
  signal?: AbortSignal,
): Promise<CompleteDomainReport> {
  const [overview, discovery, assessment] = await Promise.all([
    getOverview(domain, signal),
    getDiscovery(domain, signal),
    getAssessment(domain, signal),
  ]);

  return { overview, discovery, assessment };
}

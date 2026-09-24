import { mockReport } from "../data/mockReport";
import type {
  Report,
  TimelineData,
  FindingsData,
  UnlockPayload,
  UnlockResponse,
} from "../types/report";

/* ======================================================================
   REPORT SERVICE
   Every method currently resolves from mock data. Swap the body of
   each function for an `apiRequest(...)` call once the real backend
   exists — the calling components never need to change since they
   only depend on the returned shape (see types/report.ts).
   ====================================================================== */

/** Fetch the full report payload. */
export async function getReport(): Promise<Report> {
  // return apiRequest<Report>("/report");
  return Promise.resolve(mockReport);
}

/** Fetch just the compromise timeline. */
export async function getTimeline(): Promise<TimelineData> {
  // return apiRequest<TimelineData>("/report/timeline");
  return Promise.resolve(mockReport.timeline);
}

/** Fetch just the findings list + filters. */
export async function getFindings(): Promise<FindingsData> {
  // return apiRequest<FindingsData>("/report/findings");
  return Promise.resolve(mockReport.findings);
}

/**
 * Submit the unlock form.
 *
 * Placeholder only — deliberately has no dedicated `/report/unlock`
 * endpoint call yet. HubSpot lead capture (via hubspot.service.ts) is
 * what actually gates the unlock; this function exists so the
 * PDF-generation/email backend can be wired in later without
 * touching useUnlockFlow.ts.
 *
 * The backend is responsible for creating the report record and
 * returning its `report_id`. That id is then passed along to
 * submitLeadToHubSpot() purely so it can be forwarded to the
 * existing WordPress `/wp-json/styx/v1/hubspot-status` endpoint for
 * status tracking — it is never sent to HubSpot's Forms API.
 */
export async function unlockReport(
  payload: UnlockPayload,
): Promise<UnlockResponse> {
  // return apiRequest<UnlockResponse>("/report/unlock", { method: "POST", body: payload });
  return Promise.resolve({
    success: true,
    message: `Unlock request received for ${payload.workEmail}`,
    report_id: Math.floor(Math.random() * 100000), // mock id until real backend exists
  });
}

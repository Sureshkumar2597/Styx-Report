/**
 * HubSpot lead-submission service.
 *
 * All HubSpot Forms API logic lives here — no React component ever
 * calls `fetch` against HubSpot directly. This module exposes a
 * single Promise-based function that always resolves (never throws),
 * so callers can branch on `result.success` without try/catch.
 *
 * The only WordPress-side call this module makes is a best-effort
 * ping to the existing `/wp-json/styx/v1/hubspot-status` endpoint —
 * there is deliberately no report-specific endpoint and no report_id.
 * That endpoint is a single, global "HubSpot Integration" status
 * record (HubSpot Sent / Last Status / Last Submitted / Last Error),
 * not per-report tracking.
 */

import {
  hubspotConfig,
  isHubSpotConfigComplete,
  getHubSpotMissingConfig,
} from "../config/hubspot.config";

export interface HubSpotLeadPayload {
  fullName: string;
  workEmail: string;
  /**
   * Required: the HubSpot form's "lastname" field is mandatory.
   * Kept as a required (not optional) property on purpose so that any
   * call site omitting it fails at compile time rather than at
   * submission time against HubSpot's validation.
   */
  lastName: string;
  reportDomain: string;
}

export interface HubSpotSubmitResult {
  success: boolean;
  /** User-friendly error message, present only when success is false. */
  error?: string;
}

type WpStatusState = "submitting" | "success" | "failed";

const isDev = Boolean(import.meta.env?.DEV);

/**
 * Structured, dev-only console logging. Kept quiet in production
 * builds per the "avoid excessive logging in production" requirement.
 */
function log(message: string, extra?: unknown) {
  if (!isDev) return;
  if (extra !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`[HubSpot] ${message}`, extra);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[HubSpot] ${message}`);
  }
}

/**
 * Best-effort, non-blocking ping to the WordPress plugin's existing
 * `hubspot-status` endpoint so the "HubSpot Integration" admin
 * dashboard can show the last submission's state/time/error without
 * anyone checking browser logs. Entirely optional: if
 * `wpStatusEndpoint` isn't configured, or the ping itself fails, this
 * is silently skipped — it must never affect the outcome of the
 * actual HubSpot submission.
 *
 * Payload maps 1:1 to the four fields the plugin already tracks:
 * HubSpot Sent, Last Status, Last Submitted, Last Error.
 */
export function pingWordPressStatus(
  state: WpStatusState,
  reportId?: number,
  error?: string,
) {
  return fetch(hubspotConfig.wpStatusEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      state,
      report_id: reportId,
      error: error ?? "",
    }),
  });
}

/**
 * Builds the HubSpot Forms API `fields` array.
 *
 * Only firstname / lastname / email are ever sent — company is no
 * longer part of the HubSpot form, so it is intentionally omitted
 * here even if it exists elsewhere in the app's state.
 *
 * `lastname` is a required field on the HubSpot side. The UI already
 * requires the user to fill it in, but we still guard here: if the
 * trimmed value is empty for any reason, we send a single "." rather
 * than an empty string, so HubSpot's required-field validation can
 * never reject the submission over a missing/blank last name.
 */
function buildFormFields(payload: HubSpotLeadPayload) {
  const { fieldMapping } = hubspotConfig;

  const parts = payload.fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? "";

  const lastNameValue = payload.lastName.trim() || ".";

  const fields = [
    {
      name: fieldMapping.firstName,
      value: firstName,
    },
    {
      name: fieldMapping.lastName,
      value: lastNameValue,
    },
    {
      name: fieldMapping.email,
      value: payload.workEmail,
    },
    {
      name: fieldMapping.domainRiskReport,
      value: payload.reportDomain,
    },
  ];

  return fields;
}

/**
 * Submit a lead to HubSpot's Forms API v3.
 *
 * Resolves to `{ success: true }` on a confirmed HubSpot success
 * response, or `{ success: false, error }` for validation, network,
 * timeout, or unexpected-response failures. Never throws.
 */
export async function submitLeadToHubSpot(
  payload: HubSpotLeadPayload,
  options: { timeoutMs?: number } = {},
): Promise<HubSpotSubmitResult> {
  const { timeoutMs = 10000 } = options;

  if (!isHubSpotConfigComplete()) {
    const missing = getHubSpotMissingConfig();
    const error = `HubSpot configuration incomplete (missing: ${missing.join(", ")}). Contact support if this persists.`;

    console.error("HubSpot config missing:", missing);

    log("Submission failed:", error);
    return { success: false, error };
  }

  log("Submitting lead...");
  pingWordPressStatus("submitting");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fields = buildFormFields(payload);

    const requestBody = {
      fields,
      context: {
        pageUri: typeof window !== "undefined" ? window.location.href : "",
        pageName: typeof document !== "undefined" ? document.title : "",
      },
    };

    const response = await fetch(hubspotConfig.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    });

    clearTimeout(timer);

    const responseText = await response.text();

    let responseJson: any = null;

    try {
      responseJson = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.warn("Response is not valid JSON.");
    }

    if (!response.ok) {
      let message = `HubSpot rejected the submission (status ${response.status}).`;

      if (
        responseJson &&
        typeof responseJson.message === "string" &&
        responseJson.message
      ) {
        message = responseJson.message;
      }

      if (responseJson?.errors) {
        console.error("Validation Errors:");
        console.table(responseJson.errors);
      }

      pingWordPressStatus("failed", undefined, message);

      return {
        success: false,
        error: message,
      };
    }

    pingWordPressStatus("success");

    return {
      success: true,
    };
  } catch (err) {
    clearTimeout(timer);

    const isAbort = err instanceof DOMException && err.name === "AbortError";

    const message = isAbort
      ? "The request timed out. Please check your connection and try again."
      : "We couldn't reach HubSpot. Please check your connection and try again.";

    pingWordPressStatus("failed", undefined, message);

    return {
      success: false,
      error: message,
    };
  } finally {
  }
}

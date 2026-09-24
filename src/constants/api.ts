/* ======================================================================
   API CONSTANTS
   Single source of truth for timeout, retry, cache, header names, and
   endpoint paths used by the HudsonRock client. Nothing outside this
   file should contain a raw path string, header name, or tuning number
   as a literal.
   ====================================================================== */

export const API_TIMEOUT_MS = 15_000;

export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const MAX_RETRY_ATTEMPTS = 2;
export const RETRY_BASE_DELAY_MS = 300;
export const RETRYABLE_STATUS_CODES = [429, 502, 503, 504] as const;

export const API_HEADERS = {
  CONTENT_TYPE: "Content-Type",
  API_KEY: "api-key",
} as const;

export const CONTENT_TYPE_JSON = "application/json";

export const HUDSONROCK_ENDPOINTS = {
  OVERVIEW: "/json/v3/search-by-domain/overview",
  DISCOVERY: "/json/v3/search-by-domain/discovery",
  ASSESSMENT: "/json/v3/search-by-domain/assessment",
} as const;

export type HudsonRockEndpoint =
  (typeof HUDSONROCK_ENDPOINTS)[keyof typeof HUDSONROCK_ENDPOINTS];

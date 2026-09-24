/* ======================================================================
   API CLIENT (placeholder)
   Thin wrapper around fetch. Nothing here talks to a real backend yet —
   swap the base URL and uncomment the fetch calls once an endpoint
   exists. Every report.service.ts method should route through here so
   there's a single place to add auth headers, retries, error handling.
   ====================================================================== */

const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "/api";

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Generic request helper. Currently unused by the mock services, but
 * this is the seam where real network calls will plug in.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers } = options;

  // Placeholder — no live backend yet. Left here so the shape of a real
  // call is obvious once an endpoint is ready:
  //
  // const res = await fetch(`${BASE_URL}${path}`, {
  //   method,
  //   headers: { "Content-Type": "application/json", ...headers },
  //   body: body ? JSON.stringify(body) : undefined,
  // });
  // if (!res.ok) throw new Error(`API error ${res.status}`);
  // return (await res.json()) as T;

  throw new Error(
    `apiRequest("${path}") called before a live backend was configured. ` +
      `Base URL: ${BASE_URL}, method: ${method}, body: ${JSON.stringify(body)}`,
  );
}

/* ======================================================================
   HUDSONROCK CLIENT
   Axios instance dedicated to the HudsonRock domain-search API. Kept
   separate from apiRequest() above since that helper serves the
   existing mock report.service.ts and shouldn't change behavior.
   ====================================================================== */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import {
  API_HEADERS,
  API_TIMEOUT_MS,
  CACHE_TTL_MS,
  CONTENT_TYPE_JSON,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  RETRYABLE_STATUS_CODES,
} from "../constants/api";
import type { ApiError } from "../types/api";

const HUDSONROCK_BASE_URL = import.meta.env?.VITE_HUDSONROCK_BASE_URL ?? "";
const HUDSONROCK_API_KEY = import.meta.env?.VITE_HUDSONROCK_API_KEY ?? "";

/** Warns (without ever logging the key itself) if required env vars are missing. */
function validateHudsonRockEnv(): void {
  if (!HUDSONROCK_BASE_URL) {
    console.error("[HudsonRock] VITE_HUDSONROCK_BASE_URL is not set.");
  }
  if (!HUDSONROCK_API_KEY) {
    console.error("[HudsonRock] VITE_HUDSONROCK_API_KEY is not set.");
  }
}
validateHudsonRockEnv();

export const hudsonRockClient: AxiosInstance = axios.create({
  baseURL: HUDSONROCK_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

hudsonRockClient.interceptors.request.use((config) => {
  config.headers.set(API_HEADERS.CONTENT_TYPE, CONTENT_TYPE_JSON);
  config.headers.set(API_HEADERS.API_KEY, HUDSONROCK_API_KEY);
  return config;
});

/** Maps any thrown value from an axios call into a single ApiError shape. */
function normalizeHudsonRockError(error: unknown): ApiError {
  if (
    axios.isCancel(error) ||
    (axios.isAxiosError(error) && error.code === "ERR_CANCELED")
  ) {
    return { kind: "aborted", message: "Request was aborted.", cause: error };
  }

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return { kind: "timeout", message: "Request timed out.", cause: error };
    }

    if (!error.response) {
      return {
        kind: "network_error",
        message: "Network error — no response received.",
        cause: error,
      };
    }

    const status = error.response.status;
    switch (status) {
      case 400:
        return {
          kind: "bad_request",
          message: "Bad request.",
          status,
          cause: error,
        };
      case 401:
        return {
          kind: "unauthorized",
          message: "Unauthorized — invalid or missing API key.",
          status,
          cause: error,
        };
      case 403:
        return {
          kind: "forbidden",
          message: "Forbidden.",
          status,
          cause: error,
        };
      case 404:
        return {
          kind: "not_found",
          message: "Resource not found.",
          status,
          cause: error,
        };
      case 429:
        return {
          kind: "rate_limited",
          message: "Rate limited — too many requests.",
          status,
          cause: error,
        };
      case 500:
        return {
          kind: "server_error",
          message: "Server error.",
          status,
          cause: error,
        };
      case 502:
        return {
          kind: "bad_gateway",
          message: "Bad gateway.",
          status,
          cause: error,
        };
      case 503:
        return {
          kind: "service_unavailable",
          message: "Service unavailable.",
          status,
          cause: error,
        };
      case 504:
        return {
          kind: "gateway_timeout",
          message: "Gateway timeout.",
          status,
          cause: error,
        };
      default:
        return {
          kind: "unknown",
          message: `Unexpected status ${status}.`,
          status,
          cause: error,
        };
    }
  }

  return {
    kind: "unknown",
    message: error instanceof Error ? error.message : "Unknown error.",
    cause: error,
  };
}

hudsonRockClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeHudsonRockError(error)),
);

const RETRYABLE_STATUS_SET = new Set<number>(RETRYABLE_STATUS_CODES);

/** Retries transient failures with exponential backoff. Never retries an aborted request. */
async function requestWithRetry<T>(
  config: AxiosRequestConfig,
  attempt = 0,
): Promise<AxiosResponse<T>> {
  try {
    return await hudsonRockClient.request<T>(config);
  } catch (error) {
    const apiError = error as ApiError;
    const isAborted =
      apiError.kind === "aborted" || config.signal?.aborted === true;

    const isRetryable =
      !isAborted &&
      attempt < MAX_RETRY_ATTEMPTS &&
      (apiError.kind === "network_error" ||
        apiError.kind === "timeout" ||
        (apiError.status !== undefined &&
          RETRYABLE_STATUS_SET.has(apiError.status)));

    if (!isRetryable) throw error;

    const delayMs = RETRY_BASE_DELAY_MS * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return requestWithRetry<T>(config, attempt + 1);
  }
}

/* ----------------------------------------------------------------------
   In-memory cache + request deduplication
   ---------------------------------------------------------------------- */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T, ttlMs: number): void {
  responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Ensures concurrent calls with the same key share one in-flight request. */
function dedupeRequest<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = factory().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

export interface HudsonRockRequestOptions {
  /** When provided, enables caching + deduplication for this request. */
  cacheKey?: string;
  cacheTtlMs?: number;
}

/**
 * Reusable request helper for all HudsonRock endpoints. Applies retry,
 * then optional cache + dedup when a cacheKey is provided. Errors
 * thrown from here are always already-normalized ApiError objects,
 * thanks to the response interceptor above.
 */
export async function hudsonRockRequest<T>(
  config: AxiosRequestConfig,
  options: HudsonRockRequestOptions = {},
): Promise<T> {
  const { cacheKey, cacheTtlMs = CACHE_TTL_MS } = options;

  if (cacheKey) {
    const cached = getCached<T>(cacheKey);
    if (cached !== undefined) return cached;
  }

  const executeRequest = async (): Promise<T> => {
    const response = await requestWithRetry<T>(config);

    if (response.data === undefined || response.data === null) {
      throw {
        kind: "invalid_response",
        message: "Response payload was empty or malformed.",
      } satisfies ApiError;
    }

    if (cacheKey) setCached(cacheKey, response.data, cacheTtlMs);
    return response.data;
  };

  return cacheKey ? dedupeRequest(cacheKey, executeRequest) : executeRequest();
}

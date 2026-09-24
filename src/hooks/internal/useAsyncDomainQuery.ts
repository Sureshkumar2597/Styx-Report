/* ======================================================================
   ASYNC DOMAIN QUERY (internal)
   Shared state machine backing useOverview/useDiscovery/useAssessment/
   useDomainReport. Aborts the in-flight request whenever the domain
   changes or the component unmounts. Tracks lastUpdated so consumers
   can show "data as of" info without each hook reimplementing it.

   HARDENING ADDED (browser-side abuse / duplicate-request protection):
   - sessionStorage cache per (fetcher, domain): 5 min for success,
     30s for errors (prevents retry spam on a failing domain).
   - In-flight request dedup: concurrent calls for the same
     (fetcher, domain) join the same Promise instead of firing a
     second network request. This also satisfies "ignore duplicate
     refresh() calls while one is already running."
   - 10s domain cooldown: the same domain can never hit the API twice
     within 10s, regardless of cache state or forced refresh.
   - 15s hard timeout: requests auto-abort if they hang. This abort is
     tagged and re-surfaced as ApiError.kind === "timeout" (rather than
     the generic "aborted" an AbortController normally produces), so it
     maps to the Timeout UI instead of being silently swallowed.
   - Single retry, network failures only (never 4xx, never aborted).
   - Domain format validation before any network call.
   - Expired cache entries are purged opportunistically on each run().

   None of this changes the exported `Fetcher<T>` type, the
   `AsyncDomainQueryResult<T>` interface, or the hook's call signature
   — existing consumers (useDomainReport, etc.) require no changes.
   ====================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "../../types/api";

type Fetcher<T> = (domain: string, signal: AbortSignal) => Promise<T>;

export interface AsyncDomainQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  lastUpdated: number | null;
  refetch: () => void;
}

/* ----------------------------------------------------------------------
   Module-level state — intentionally shared across every hook instance
   (and every remount) in the tab, not per-component. This is what makes
   dedup and cooldown work even if two components ask for the same
   domain at the same time, or a component unmounts/remounts quickly.
   ---------------------------------------------------------------------- */

const CACHE_KEY_PREFIX = "async_domain_query_cache";
const SUCCESS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ERROR_CACHE_TTL_MS = 30 * 1000; // 30 seconds
const COOLDOWN_MS = 10 * 1000; // 10 seconds
const REQUEST_TIMEOUT_MS = 15 * 1000; // 15 seconds — per spec, surfaces as "timeout"

// domain format check — deliberately independent of whatever useDomain()
// does upstream; this hook should never trust the caller blindly.
const DOMAIN_PATTERN =
  /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))+$/;

// key: `${namespace}:${domain}` -> in-flight promise for that request
const pendingRequests = new Map<string, Promise<unknown>>();
// key: `${namespace}:${domain}` -> timestamp of the last request start
const lastRequestTimestamps = new Map<string, number>();

interface SuccessCacheEntry<T> {
  status: "success";
  timestamp: number;
  ttl: number;
  data: T;
}

interface ErrorCacheEntry {
  status: "error";
  timestamp: number;
  ttl: number;
  error: ApiError;
}

type CacheEntry<T> = SuccessCacheEntry<T> | ErrorCacheEntry;

function isValidDomainFormat(value: string): boolean {
  if (!value || value.length > 253) return false;
  return DOMAIN_PATTERN.test(value);
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && !!window.sessionStorage;
}

function getCacheStorageKey(namespace: string, domain: string): string {
  return `${CACHE_KEY_PREFIX}:${namespace}:${domain}`;
}

function readCache<T>(key: string): CacheEntry<T> | null {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (typeof parsed !== "object" || parsed === null) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    const age = Date.now() - parsed.timestamp;
    if (age > parsed.ttl) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch (err) {
    console.debug(
      "[useAsyncDomainQuery] failed to read cache entry, discarding",
      key,
      err,
    );
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function writeCache<T>(key: string, entry: CacheEntry<T>): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    console.debug(
      "[useAsyncDomainQuery] failed to write cache entry",
      key,
      err,
    );
  }
}

/** Opportunistic cleanup — removes expired entries so sessionStorage
 * doesn't accumulate stale domain reports across a long session. */
function purgeExpiredCache(): void {
  if (!canUseSessionStorage()) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (!key || !key.startsWith(CACHE_KEY_PREFIX)) continue;
      const raw = window.sessionStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as { timestamp?: number; ttl?: number };
        const timestamp = parsed.timestamp ?? 0;
        const ttl = parsed.ttl ?? 0;
        if (Date.now() - timestamp > ttl) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.debug(
        "[useAsyncDomainQuery] purged expired cache entries",
        keysToRemove.length,
      );
    }
  } catch (err) {
    console.debug("[useAsyncDomainQuery] cache purge failed", err);
  }
}

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" && err !== null && "kind" in err && "message" in err
  );
}

function normalizeError(err: unknown): ApiError {
  if (isApiError(err)) return err;
  if (err instanceof DOMException && err.name === "AbortError") {
    return { kind: "aborted", message: "Request aborted" };
  }
  if (err instanceof Error) {
    return { kind: "unknown", message: err.message, cause: err };
  }
  return { kind: "unknown", message: "Unknown error", cause: err };
}

/** Only real network failures are retried. 4xx, timeouts, and aborts
 * are never retried — retrying those either can't succeed (4xx) or
 * just wastes another full timeout window (timeout/abort). */
function isRetryableError(err: ApiError): boolean {
  if (err.kind === "aborted") return false;
  if (err.status !== undefined && err.status >= 400 && err.status < 500) {
    return false;
  }
  return err.kind === "network_error";
}

async function fetchWithRetry<T>(
  domain: string,
  signal: AbortSignal,
  fetcher: Fetcher<T>,
): Promise<T> {
  try {
    return await fetcher(domain, signal);
  } catch (rawErr) {
    const apiErr = normalizeError(rawErr);
    if (
      signal.aborted ||
      apiErr.kind === "aborted" ||
      !isRetryableError(apiErr)
    ) {
      throw apiErr;
    }
    console.debug(
      "[useAsyncDomainQuery] network failure, retrying once",
      domain,
      apiErr,
    );
    try {
      return await fetcher(domain, signal);
    } catch (retryErr) {
      throw normalizeError(retryErr);
    }
  }
}

export function useAsyncDomainQuery<T>(
  domain: string | null,
  fetcher: Fetcher<T>,
): AsyncDomainQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const applyCacheEntry = useCallback((entry: CacheEntry<T>) => {
    if (entry.status === "success") {
      setData(entry.data);
      setError(null);
    } else {
      setError(entry.error);
      setData(null);
    }
    setLastUpdated(entry.timestamp);
    setLoading(false);
  }, []);

  const startFetch = useCallback(
    (targetDomain: string, cacheKey: string, pendingKey: string) => {
      // Abort whatever this instance was previously waiting on.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Set only when the 15s hard timeout below fires, so this abort
      // can be distinguished from an abort caused by unmount, domain
      // change, or a manual refresh superseding this request. Only the
      // hard-timeout case should surface as ApiError.kind === "timeout".
      let timedOut = false;

      const timeoutId = setTimeout(() => {
        console.debug(
          "[useAsyncDomainQuery] request exceeded 15s, aborting",
          targetDomain,
        );
        timedOut = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      setLoading(true);
      setError(null);
      lastRequestTimestamps.set(pendingKey, Date.now());

      const requestPromise = fetchWithRetry(
        targetDomain,
        controller.signal,
        fetcher,
      )
        .then((result) => {
          writeCache<T>(cacheKey, {
            status: "success",
            timestamp: Date.now(),
            ttl: SUCCESS_CACHE_TTL_MS,
            data: result,
          });
          return result;
        })
        .catch((rawErr: unknown) => {
          let apiErr = normalizeError(rawErr);

          // The hard timeout aborts the request via the same
          // AbortController used for unmount/domain-change cleanup —
          // without this, a hung request would surface as the generic
          // "aborted" kind (unmapped, falls to api_error) instead of
          // the "timeout" kind the Timeout UI expects.
          if (timedOut) {
            apiErr = {
              kind: "timeout",
              message: "Request timed out after 15 seconds.",
              status: apiErr.status,
              cause: apiErr.cause ?? apiErr,
            };
          }

          if (apiErr.kind !== "aborted") {
            writeCache<T>(cacheKey, {
              status: "error",
              timestamp: Date.now(),
              ttl: ERROR_CACHE_TTL_MS,
              error: apiErr,
            });
          }
          throw apiErr;
        })
        .finally(() => {
          clearTimeout(timeoutId);
          pendingRequests.delete(pendingKey);
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
        });

      // Published synchronously (before any await resolves) so any
      // other run() call in the same tick sees it immediately — this
      // is what makes dedup/loading-lock race-proof.
      pendingRequests.set(pendingKey, requestPromise);

      requestPromise
        .then((result) => {
          // A timeout also sets controller.signal.aborted — don't
          // drop the result path silently in that case (it will have
          // thrown already, so this only matters for the .catch below,
          // kept here for symmetry).
          if (controller.signal.aborted && !timedOut) return;
          setData(result);
          setLastUpdated(Date.now());
          setLoading(false);
        })
        .catch((apiErr: ApiError) => {
          // Only skip updating state for "real" aborts (unmount /
          // domain change / superseded refresh) — a timeout-induced
          // abort must still reach the UI as an error.
          if (controller.signal.aborted && !timedOut) return;
          setError(apiErr);
          setLoading(false);
        });
    },
    [fetcher],
  );

  const run = useCallback(
    (targetDomain: string, options?: { forceRefresh?: boolean }) => {
      if (!isValidDomainFormat(targetDomain)) {
        abortRef.current?.abort();
        setLoading(false);
        setData(null);
        setLastUpdated(null);
        setError({
          kind: "bad_request",
          message: `Invalid domain format: ${targetDomain}`,
        });
        console.debug(
          "[useAsyncDomainQuery] rejected invalid domain",
          targetDomain,
        );
        return;
      }

      purgeExpiredCache();

      const namespace = fetcher.name || "anonymous";
      const pendingKey = `${namespace}:${targetDomain}`;
      const cacheKey = getCacheStorageKey(namespace, targetDomain);

      // Dedup — also covers "ignore duplicate refresh() while one is
      // already running", since a manual refresh for a domain that's
      // already fetching joins the same in-flight promise below.
      const existingPending = pendingRequests.get(pendingKey);
      if (existingPending) {
        console.debug(
          "[useAsyncDomainQuery] joining in-flight request",
          targetDomain,
        );
        setLoading(true);
        (existingPending as Promise<T>)
          .then((result) => {
            setData(result);
            setLastUpdated(Date.now());
            setError(null);
            setLoading(false);
          })
          .catch((apiErr: ApiError) => {
            setError(apiErr);
            setLoading(false);
          });
        return;
      }

      // Cooldown — absolute floor, never call the API twice for the
      // same domain inside this window, even on a forced refresh.
      const lastRequestAt = lastRequestTimestamps.get(pendingKey);
      if (
        lastRequestAt !== undefined &&
        Date.now() - lastRequestAt < COOLDOWN_MS
      ) {
        const cached = readCache<T>(cacheKey);
        if (cached) {
          console.debug(
            "[useAsyncDomainQuery] cooldown active, serving cached result",
            targetDomain,
          );
          applyCacheEntry(cached);
        } else {
          console.debug(
            "[useAsyncDomainQuery] cooldown active, no cache yet, skipping request",
            targetDomain,
          );
        }
        return;
      }

      // Cache — skipped only for an explicit forced refresh.
      if (!options?.forceRefresh) {
        const cached = readCache<T>(cacheKey);
        if (cached) {
          console.debug("[useAsyncDomainQuery] cache hit", targetDomain);
          applyCacheEntry(cached);
          return;
        }
      }

      startFetch(targetDomain, cacheKey, pendingKey);
    },
    [fetcher, startFetch, applyCacheEntry],
  );

  useEffect(() => {
    if (!domain) {
      abortRef.current?.abort();
      setData(null);
      setError(null);
      setLoading(false);
      setLastUpdated(null);
      return;
    }

    run(domain, { forceRefresh: false });

    return () => {
      abortRef.current?.abort();
    };
  }, [domain, run]);

  const refetch = useCallback(() => {
    if (domain) run(domain, { forceRefresh: true });
  }, [domain, run]);

  return { data, loading, error, lastUpdated, refetch };
}

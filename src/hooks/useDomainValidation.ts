/* ======================================================================
   USE DOMAIN VALIDATION
   Confirms a (format-valid) domain actually exists, using Google's free
   DNS-over-HTTPS API. Kept entirely separate from useDomain() (which
   only parses/normalizes/regex-validates the URL param) — this hook's
   single responsibility is: does this domain resolve, according to
   Google, right now.

   IMPORTANT DISTINCTION (this is the whole point of this hook):
   - Google says the domain doesn't resolve (NXDOMAIN / empty Answer)
     -> the domain has been PROVEN invalid -> domainExists: false.
   - The validation call itself fails (network error, 5s timeout, a
     non-2xx from dns.google) -> the domain has NOT been proven
     anything -> domainExists stays null, validationError is set.
   A caller must never treat "the validator broke" the same as "the
   domain doesn't exist" — those produce different UI (API Error vs.
   Invalid Domain).

   CACHE: TTL-based, in-memory only (existence checks are cheap and
   don't need to survive a reload):
   - confirmed-exists  -> cached 5 minutes
   - confirmed-missing -> cached 1 minute
   - a validation FAILURE is never cached — a transient DNS-API outage
     must not be remembered as a verdict.

   TIMEOUT: 5 seconds. Exceeding it cancels the request and is reported
   as a validationError (kind: "timeout"), not as domainExists: false.
   ====================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";

export type ValidationErrorKind =
  | "network_error"
  | "timeout"
  | "server_error"
  | "unknown";

export interface ValidationError {
  kind: ValidationErrorKind;
  message: string;
}

export type ValidationSource = "cache" | "network";

export interface UseDomainValidationResult {
  /** True while a Google lookup for the current domain is in flight. */
  isValidating: boolean;
  /**
   * true  -> Google confirmed the domain resolves.
   * false -> Google confirmed the domain does NOT resolve (proven invalid).
   * null  -> not yet known (still validating, or the last attempt failed
   *          without producing a verdict — see validationError).
   */
  domainExists: boolean | null;
  /** Set when the validation call itself failed (not a verdict). */
  validationError: ValidationError | null;
  validationSource: ValidationSource | null;
  /** Re-runs the Google check for the current domain, bypassing cache. */
  retryValidation: () => void;
}

const GOOGLE_DNS_ENDPOINT = "https://dns.google/resolve";
const VALIDATION_TIMEOUT_MS = 5 * 1000; // 5 seconds
const EXISTS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MISSING_CACHE_TTL_MS = 60 * 1000; // 1 minute — negative lookups are never permanent

interface CacheEntry {
  exists: boolean;
  expiresAt: number;
}

// Module-level, shared across hook instances/remounts in the tab —
// same rationale as the HudsonRock caches: avoid re-validating the
// same domain repeatedly within its TTL window.
const validationCache = new Map<string, CacheEntry>();

function getCachedExistence(domain: string): boolean | null {
  const entry = validationCache.get(domain);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    validationCache.delete(domain);
    return null;
  }
  return entry.exists;
}

function setCachedExistence(domain: string, exists: boolean): void {
  const ttl = exists ? EXISTS_CACHE_TTL_MS : MISSING_CACHE_TTL_MS;
  validationCache.set(domain, { exists, expiresAt: Date.now() + ttl });
}

interface GoogleDohResponse {
  Status?: number;
  Answer?: unknown[];
}

interface GoogleValidationOutcome {
  exists: boolean | null;
  error: ValidationError | null;
}

/** Performs the actual Google DoH lookup. Resolves to either a verdict
 * (exists: true/false, error: null) or a failure (exists: null, error:
 * set) — and rethrows only on an aborted signal, so the caller can tell
 * "our own 5s timeout fired" apart from every other failure mode. */
async function queryGoogleDns(
  domain: string,
  signal: AbortSignal,
): Promise<GoogleValidationOutcome> {
  try {
    const url = `${GOOGLE_DNS_ENDPOINT}?name=${encodeURIComponent(domain)}&type=A`;
    const res = await fetch(url, {
      signal,
      headers: { accept: "application/dns-json" },
    });

    if (!res.ok) {
      return {
        exists: null,
        error: {
          kind: "server_error",
          message: `Google DNS validation returned HTTP ${res.status}.`,
        },
      };
    }

    const data = (await res.json()) as GoogleDohResponse;

    if (typeof data.Status !== "number") {
      return {
        exists: null,
        error: {
          kind: "unknown",
          message: "Google DNS validation returned a malformed response.",
        },
      };
    }

    // Status 0 === NOERROR per the DNS-over-HTTPS JSON API spec. A
    // non-empty Answer array means at least one A record came back —
    // i.e. the domain genuinely resolves. Any other status (e.g. 3 =
    // NXDOMAIN) or an empty Answer means Google has POSITIVELY
    // confirmed the domain does not exist — a real verdict, not a
    // failure.
    const exists =
      data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0;

    return { exists, error: null };
  } catch (err) {
    if (signal.aborted) {
      // Rethrow so the caller — which set a `timedOut` flag right
      // before calling controller.abort() — can distinguish "our own
      // 5s timeout" from any other abort reason.
      throw err;
    }
    return {
      exists: null,
      error: {
        kind: "network_error",
        message: err instanceof Error ? err.message : "Network error.",
      },
    };
  }
}

export function useDomainValidation(
  domain: string | null,
): UseDomainValidationResult {
  const [isValidating, setIsValidating] = useState(false);
  const [domainExists, setDomainExists] = useState<boolean | null>(null);
  const [validationError, setValidationError] =
    useState<ValidationError | null>(null);
  const [validationSource, setValidationSource] =
    useState<ValidationSource | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const startValidation = useCallback(
    (targetDomain: string, options?: { forceRefresh?: boolean }) => {
      if (!options?.forceRefresh) {
        const cached = getCachedExistence(targetDomain);
        if (cached !== null) {
          setIsValidating(false);
          setDomainExists(cached);
          setValidationError(null);
          setValidationSource("cache");
          return;
        }
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Set only when this call's own 5s timeout fires, so it can be
      // told apart from an abort caused by domain change / unmount /
      // a forced retry superseding this request.
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, VALIDATION_TIMEOUT_MS);

      setIsValidating(true);
      setValidationError(null);

      queryGoogleDns(targetDomain, controller.signal)
        .then((outcome) => {
          if (controller.signal.aborted) return;
          clearTimeout(timeoutId);
          setIsValidating(false);
          setValidationSource("network");

          if (outcome.error) {
            // The validator failed — NOT a verdict. Never set
            // domainExists: false here.
            setDomainExists(null);
            setValidationError(outcome.error);
            return;
          }

          setDomainExists(outcome.exists);
          setValidationError(null);
          if (outcome.exists !== null) {
            setCachedExistence(targetDomain, outcome.exists);
          }
        })
        .catch(() => {
          clearTimeout(timeoutId);
          if (!timedOut) {
            // Superseded by a domain change / unmount / new retry —
            // that newer run owns the state update, not this one.
            return;
          }
          setIsValidating(false);
          setDomainExists(null);
          setValidationError({
            kind: "timeout",
            message: "Domain validation timed out after 5 seconds.",
          });
          setValidationSource("network");
        });
    },
    [],
  );

  useEffect(() => {
    if (!domain) {
      abortRef.current?.abort();
      setIsValidating(false);
      setDomainExists(null);
      setValidationError(null);
      setValidationSource(null);
      return;
    }

    startValidation(domain, { forceRefresh: false });

    return () => {
      abortRef.current?.abort();
    };
  }, [domain, startValidation]);

  const retryValidation = useCallback(() => {
    if (domain) startValidation(domain, { forceRefresh: true });
  }, [domain, startValidation]);

  return {
    isValidating,
    domainExists,
    validationError,
    validationSource,
    retryValidation,
  };
}

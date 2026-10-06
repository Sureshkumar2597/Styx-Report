/* ======================================================================
   USE DOMAIN VALIDATION

   Confirms that a format-valid domain exists using Google's
   DNS-over-HTTPS API.

   IMPORTANT DISTINCTION:

   - DNS Status 0 (NOERROR)
       -> The domain exists.
       -> Even if Answer is empty, the domain may simply have no A record.

   - DNS Status 3 (NXDOMAIN)
       -> The domain does not exist.
       -> domainExists = false.

   - DNS API/network/timeout/server failure
       -> We cannot determine whether the domain exists.
       -> domainExists = null
       -> validationError is set.

   This keeps:
     "domain does not exist"
   separate from:
     "domain validation service failed"

   CACHE:
   - confirmed exists  -> 5 minutes
   - confirmed missing -> 1 minute
   - validation errors -> never cached

   TIMEOUT:
   - 5 seconds
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
  /**
   * True while a Google DNS lookup is in progress.
   */
  isValidating: boolean;

  /**
   * true  -> DNS confirmed the domain exists.
   * false -> DNS confirmed the domain does not exist.
   * null  -> validation has not produced a verdict yet.
   */
  domainExists: boolean | null;

  /**
   * Set only when the validation request itself failed.
   */
  validationError: ValidationError | null;

  /**
   * Whether the result came from cache or the network.
   */
  validationSource: ValidationSource | null;

  /**
   * Re-run validation while bypassing the cache.
   */
  retryValidation: () => void;
}

const GOOGLE_DNS_ENDPOINT = "https://dns.google/resolve";

const VALIDATION_TIMEOUT_MS = 5 * 1000; // 5 seconds

const EXISTS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const MISSING_CACHE_TTL_MS = 60 * 1000; // 1 minute

interface CacheEntry {
  exists: boolean;
  expiresAt: number;
}

// Module-level cache so repeated validations for the same domain
// don't unnecessarily hit Google DNS.
const validationCache = new Map<string, CacheEntry>();

function getCachedExistence(domain: string): boolean | null {
  const entry = validationCache.get(domain);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    validationCache.delete(domain);
    return null;
  }

  return entry.exists;
}

function setCachedExistence(domain: string, exists: boolean): void {
  const ttl = exists ? EXISTS_CACHE_TTL_MS : MISSING_CACHE_TTL_MS;

  validationCache.set(domain, {
    exists,
    expiresAt: Date.now() + ttl,
  });
}

interface GoogleDohResponse {
  /**
   * DNS response code.
   *
   * 0 = NOERROR
   * 1 = FORMERR
   * 2 = SERVFAIL
   * 3 = NXDOMAIN
   * 4 = NOTIMP
   * 5 = REFUSED
   */
  Status?: number;

  /**
   * DNS answer records.
   *
   * This can legitimately be empty even when Status === 0.
   */
  Answer?: unknown[];

  /**
   * Optional authority section.
   */
  Authority?: unknown[];
}

interface GoogleValidationOutcome {
  exists: boolean | null;
  error: ValidationError | null;
}

/**
 * Performs the actual Google DNS lookup.
 *
 * IMPORTANT:
 *
 * We intentionally do NOT require Answer.length > 0.
 *
 * Example:
 *
 *   Status: 0
 *   Answer: []
 *
 * does NOT mean the domain doesn't exist.
 *
 * It can mean the domain exists but does not have an A record.
 *
 * We only treat Status === 3 (NXDOMAIN) as a confirmed
 * non-existent domain.
 */
async function queryGoogleDns(
  domain: string,
  signal: AbortSignal,
): Promise<GoogleValidationOutcome> {
  try {
    const url =
      `${GOOGLE_DNS_ENDPOINT}` +
      `?name=${encodeURIComponent(domain)}` +
      `&type=A`;

    const res = await fetch(url, {
      signal,
      headers: {
        accept: "application/dns-json",
      },
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

    console.log("[Domain Validation] DNS response:", {
      domain,
      status: data.Status,
      answer: data.Answer,
      authority: data.Authority,
    });

    if (typeof data.Status !== "number") {
      return {
        exists: null,
        error: {
          kind: "unknown",
          message: "Google DNS validation returned a malformed response.",
        },
      };
    }

    /*
     * DNS Status 0 = NOERROR.
     *
     * This means the DNS server successfully processed the query.
     *
     * IMPORTANT:
     *
     * We do NOT check Answer.length here.
     *
     * A valid domain can have:
     *
     *   Status: 0
     *   Answer: []
     *
     * because it may not have an A record.
     */
    if (data.Status === 0) {
      return {
        exists: true,
        error: null,
      };
    }

    /*
     * DNS Status 3 = NXDOMAIN.
     *
     * This is the explicit DNS indication that the queried
     * domain name does not exist.
     */
    if (data.Status === 3) {
      return {
        exists: false,
        error: null,
      };
    }

    /*
     * Other DNS errors such as:
     *
     *   1 = FORMERR
     *   2 = SERVFAIL
     *   4 = NOTIMP
     *   5 = REFUSED
     *
     * are NOT proof that the domain doesn't exist.
     *
     * Therefore we treat them as validation failures.
     */
    return {
      exists: null,
      error: {
        kind: "server_error",
        message: `Google DNS validation returned DNS status ${data.Status}.`,
      },
    };
  } catch (err) {
    /*
     * AbortController is also used for:
     * - timeout
     * - domain change
     * - component unmount
     * - forced retry
     *
     * The caller handles timeout separately.
     */
    if (signal.aborted) {
      throw err;
    }

    return {
      exists: null,
      error: {
        kind: "network_error",
        message:
          err instanceof Error
            ? err.message
            : "Network error while validating the domain.",
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
    (
      targetDomain: string,
      options?: {
        forceRefresh?: boolean;
      },
    ) => {
      /*
       * Use cached result unless explicitly forcing
       * a fresh validation.
       */
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

      /*
       * Cancel any previous validation request.
       */
      abortRef.current?.abort();

      const controller = new AbortController();

      abortRef.current = controller;

      /*
       * Used to distinguish our own timeout from:
       * - unmount
       * - domain change
       * - retry
       */
      let timedOut = false;

      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, VALIDATION_TIMEOUT_MS);

      /*
       * Start validation state.
       */
      setIsValidating(true);

      setValidationError(null);

      queryGoogleDns(targetDomain, controller.signal)
        .then((outcome) => {
          /*
           * If this request was cancelled because another
           * validation replaced it, don't update state.
           */
          if (controller.signal.aborted) {
            return;
          }

          clearTimeout(timeoutId);

          setIsValidating(false);

          setValidationSource("network");

          /*
           * The DNS validation itself failed.
           *
           * This is NOT the same as:
           * domainExists === false
           */
          if (outcome.error) {
            setDomainExists(null);

            setValidationError(outcome.error);

            return;
          }

          /*
           * We now have a genuine DNS verdict.
           *
           * true  -> domain exists
           * false -> domain is NXDOMAIN
           */
          setDomainExists(outcome.exists);

          setValidationError(null);

          /*
           * Cache only actual verdicts.
           */
          if (outcome.exists !== null) {
            setCachedExistence(targetDomain, outcome.exists);
          }
        })
        .catch(() => {
          clearTimeout(timeoutId);

          /*
           * If this was cancelled by:
           * - domain change
           * - component unmount
           * - another validation request
           *
           * don't overwrite the newer request's state.
           */
          if (!timedOut) {
            return;
          }

          /*
           * Our own 5-second timeout fired.
           */
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
    /*
     * No domain means there is nothing to validate.
     */
    if (!domain) {
      abortRef.current?.abort();

      setIsValidating(false);

      setDomainExists(null);

      setValidationError(null);

      setValidationSource(null);

      return;
    }

    /*
     * Validate the current domain.
     */
    startValidation(domain, {
      forceRefresh: false,
    });

    /*
     * Cancel validation when the domain changes
     * or the component unmounts.
     */
    return () => {
      abortRef.current?.abort();
    };
  }, [domain, startValidation]);

  const retryValidation = useCallback(() => {
    if (!domain) {
      return;
    }

    /*
     * Force a fresh Google DNS request.
     * Cached results are intentionally bypassed.
     */
    startValidation(domain, {
      forceRefresh: true,
    });
  }, [domain, startValidation]);

  return {
    isValidating,
    domainExists,
    validationError,
    validationSource,
    retryValidation,
  };
}

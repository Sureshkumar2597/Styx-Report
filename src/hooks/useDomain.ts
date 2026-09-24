/* ======================================================================
   USE DOMAIN
   Single responsibility: read ?domain= from the URL, normalize it, and
   run the existing regex-based format check. Nothing else — no network
   calls, no caching, no existence verdicts. Whether the domain actually
   resolves is a separate concern, handled by useDomainValidation().
   ====================================================================== */

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { validateDomain } from "../utils/domain";

export interface UseDomainResult {
  domain: string | null;
  rawDomain: string | null;
  /** True only if the string is well-formed per the regex check.
   * Says nothing about whether the domain actually exists. */
  isFormatValid: boolean;
  error?: string;
}

export function useDomain(): UseDomainResult {
  const [searchParams] = useSearchParams();
  const rawDomain = searchParams.get("domain");

  return useMemo(() => {
    if (!rawDomain) {
      return {
        domain: null,
        rawDomain: null,
        isFormatValid: false,
        error: "No domain provided in URL.",
      };
    }

    const result = validateDomain(rawDomain);
    return {
      domain: result.isValid ? result.normalizedDomain : null,
      rawDomain,
      isFormatValid: result.isValid,
      error: result.error,
    };
  }, [rawDomain]);
}

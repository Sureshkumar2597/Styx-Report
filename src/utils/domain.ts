/* ======================================================================
   DOMAIN VALIDATION
   Whitelists domain-shaped strings (letters, digits, hyphens, dots)
   and rejects anything else — including URL schemes like http:// or
   javascript:, and embedded whitespace — before a value from the URL
   is ever sent to the API.
   ====================================================================== */

const DOMAIN_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/;
const SCHEME_PREFIX_REGEX = /^[a-z][a-z0-9+.-]*:/i;
const WHITESPACE_REGEX = /\s/;

export interface DomainValidationResult {
  isValid: boolean;
  normalizedDomain: string;
  error?: string;
}

/** Trims and lowercases a raw domain string. */
export function normalizeDomain(rawDomain: string): string {
  return rawDomain.trim().toLowerCase();
}

/** Validates a domain against the HudsonRock API's expected format. */
export function validateDomain(rawDomain: string): DomainValidationResult {
  const normalized = normalizeDomain(rawDomain);

  if (!normalized) {
    return {
      isValid: false,
      normalizedDomain: "",
      error: "Domain is required.",
    };
  }

  if (WHITESPACE_REGEX.test(normalized)) {
    return {
      isValid: false,
      normalizedDomain: normalized,
      error: "Domain must not contain whitespace.",
    };
  }

  if (SCHEME_PREFIX_REGEX.test(normalized)) {
    return {
      isValid: false,
      normalizedDomain: normalized,
      error:
        "Domain must not include a URL scheme (e.g. http://, javascript:).",
    };
  }

  if (!DOMAIN_REGEX.test(normalized)) {
    return {
      isValid: false,
      normalizedDomain: normalized,
      error: "Domain format is invalid.",
    };
  }

  return { isValid: true, normalizedDomain: normalized };
}

export function extractEmailDomain(email: string): string {
  if (!email) return "";
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1 || atIndex === trimmed.length - 1) return "";
  return trimmed.slice(atIndex + 1);
}

export function isMatchingCompanyDomain(
  email: string,
  companyDomain: string,
): boolean {
  if (!email || !companyDomain) return false;

  const emailDomain = extractEmailDomain(email);
  const normalizedCompanyDomain = companyDomain.trim().toLowerCase();

  if (!emailDomain || !normalizedCompanyDomain) return false;

  // Master domain bypass: allow internal team to access any report
  if (emailDomain === "bicsom.co" || emailDomain === "styxintel.com") {
    return true;
  }

  return (
    emailDomain === normalizedCompanyDomain ||
    emailDomain.endsWith(`.${normalizedCompanyDomain}`)
  );
}

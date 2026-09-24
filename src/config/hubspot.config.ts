/**
 * Central HubSpot configuration.
 *
 * All values are read from Vite env vars so the same build can point
 * at different HubSpot portals/forms per environment without a code
 * change. `wpStatusEndpoint` is the *existing* WordPress plugin
 * endpoint that updates the "HubSpot Integration" admin dashboard —
 * intentionally the only endpoint this integration talks to besides
 * HubSpot itself.
 */

export interface HubSpotFieldMapping {
  firstName: string;
  lastName: string;
  email: string;
  domainRiskReport: string;
  company?: string;
}

export interface HubSpotConfig {
  /** HubSpot Forms API v3 submission URL for this portal/form. */
  apiEndpoint: string;
  /** Maps our payload keys to the HubSpot internal field names. */
  fieldMapping: HubSpotFieldMapping;
  /**
   * Existing WP plugin endpoint (POST /wp-json/styx/v1/hubspot-status)
   * that updates: HubSpot Sent, Last Status, Last Submitted, Last Error.
   * No report_id — this is a single, global integration-status record,
   * not per-report tracking.
   */
  wpStatusEndpoint: string;
}

export const hubspotConfig: HubSpotConfig = {
  apiEndpoint: import.meta.env.VITE_HUBSPOT_FORMS_ENDPOINT ?? "",
  fieldMapping: {
    firstName: import.meta.env.VITE_HUBSPOT_FIELD_FIRSTNAME ?? "firstname",
    lastName: import.meta.env.VITE_HUBSPOT_FIELD_LASTNAME ?? "lastname",
    email: import.meta.env.VITE_HUBSPOT_FIELD_EMAIL ?? "email",
    // TEMPORARY placeholder ("domain_risk_report") until we have HubSpot
    // access and can confirm the actual internal property name for the
    // "Domain (Risk Report)" field. Once known, either set
    // VITE_HUBSPOT_FIELD_DOMAIN_RISK_REPORT or replace the fallback below.
    domainRiskReport: "domain",
    // company: import.meta.env.VITE_HUBSPOT_FIELD_COMPANY ?? "company",
  },
  wpStatusEndpoint:
    import.meta.env.VITE_WP_HUBSPOT_STATUS_ENDPOINT ??
    "/wp-json/styx/v1/hubspot-status",
};

export function isHubSpotConfigComplete(): boolean {
  return Boolean(
    hubspotConfig.apiEndpoint &&
    hubspotConfig.fieldMapping.firstName &&
    hubspotConfig.fieldMapping.lastName &&
    hubspotConfig.fieldMapping.email,
  );
}

export function getHubSpotMissingConfig(): string[] {
  const missing: string[] = [];
  if (!hubspotConfig.apiEndpoint) missing.push("apiEndpoint");
  if (!hubspotConfig.fieldMapping.firstName)
    missing.push("fieldMapping.firstName");
  if (!hubspotConfig.fieldMapping.lastName)
    missing.push("fieldMapping.lastName");
  if (!hubspotConfig.fieldMapping.email) missing.push("fieldMapping.email");
  return missing;
}

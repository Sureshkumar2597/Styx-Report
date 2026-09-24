/* ======================================================================
   OVERVIEW RESPONSE TYPES
   Mirrors the confirmed HudsonRock search-by-domain/overview schema
   exactly. Do not add fields that aren't in the confirmed response.
   ====================================================================== */

export interface SensitiveApplication {
  keyword: string;
  sensitivity: string;
}

export interface OverviewEntry {
  _id: string;
  domain: string;
  compromised_employees: number;
  compromised_users: number;
  last_employee_compromised: string | null;
  last_user_compromised: string | null;
  last_employee_uploaded: string | null;
  last_user_uploaded: string | null;
  company_size: string | null;
  industry: string | null;
  country: string | null;
  region: string | null;
  sensitive_applications: SensitiveApplication[];
  fortinet: unknown | null;
}

export interface OverviewResponse {
  data: OverviewEntry[];
  nextCursor: string | null;
}

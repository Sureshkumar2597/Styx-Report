/* ======================================================================
   ASSESSMENT RESPONSE TYPES (PLACEHOLDER)
   TODO: The assessment endpoint's real response schema is not yet
   available. Replace the fields below once it's documented — this is
   the ONLY file that needs to change. domain.service.ts, useAssessment,
   and useDomainReport all reference AssessmentResponse by name only,
   so nothing downstream breaks when this is filled in.
   ====================================================================== */

export interface AssessmentResponse {
  domain: string;
  // TODO: replace with real assessment fields once the schema is confirmed.
  [key: string]: unknown;
}

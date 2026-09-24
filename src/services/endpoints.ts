/* ======================================================================
   HUDSONROCK ENDPOINTS
   Re-exported from constants/api.ts so domain.service.ts (and anything
   else that only needs endpoint paths) doesn't have to reach into the
   constants file directly. Keeps constants/api.ts as the single owner
   of the literal strings.
   ====================================================================== */

export { HUDSONROCK_ENDPOINTS } from "../constants/api";
export type { HudsonRockEndpoint } from "../constants/api";

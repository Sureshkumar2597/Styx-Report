/* ======================================================================
   SHARED API TYPES
   Generic error/response shapes used by the HudsonRock client. Every
   thrown error from api.ts / domain.service.ts conforms to ApiError so
   calling code (hooks, components) never has to branch on axios vs.
   fetch vs. native error shapes.
   ====================================================================== */

export type ApiErrorKind =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "server_error"
  | "bad_gateway"
  | "service_unavailable"
  | "gateway_timeout"
  | "timeout"
  | "aborted"
  | "network_error"
  | "invalid_response"
  | "unknown";

export interface ApiError {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  cause?: unknown;
}

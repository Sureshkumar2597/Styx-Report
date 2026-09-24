/* ======================================================================
   DISCOVERY RESPONSE TYPES
   Corrected to match the confirmed HudsonRock search-by-domain/discovery
   schema: the three URL groups are NOT top-level siblings. The API
   wraps them inside a `data` array, where each element is a
   single-key object holding one group (order not guaranteed, and a
   group may be absent entirely if it has no results).

   last_uploaded_date is optional — some entries omit the field rather
   than sending it as null.
   ====================================================================== */

export interface DiscoveryUrlEntry {
  _id: string;
  url: string;
  domain: string;
  type: "employee" | "user" | "third_party";
  occurrence: number;
  last_uploaded_date?: string | null;
}

export interface DiscoveryResponse {
  data: DiscoveryUrlEntry[];
  nextCursor: string | null;
}
/** A single element of `data` — holds exactly one of the three groups. */
export interface DiscoveryGroup {
  employee_urls?: DiscoveryUrlEntry[];
  third_party_urls?: DiscoveryUrlEntry[];
  user_urls?: DiscoveryUrlEntry[];
}

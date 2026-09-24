import { useAsyncDomainQuery } from "./internal/useAsyncDomainQuery";
import { getDiscovery } from "../services/domain.service";
import type { DiscoveryResponse } from "../types/discovery";
import type { ApiError } from "../types/api";

export interface UseDiscoveryResult {
  discovery: DiscoveryResponse | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useDiscovery(domain: string | null): UseDiscoveryResult {
  const { data, loading, error, refetch } =
    useAsyncDomainQuery<DiscoveryResponse>(domain, getDiscovery);
  return { discovery: data, loading, error, refetch };
}

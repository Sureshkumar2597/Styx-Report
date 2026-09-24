import { useAsyncDomainQuery } from "./internal/useAsyncDomainQuery";
import { getOverview } from "../services/domain.service";
import type { OverviewResponse } from "../types/overview";
import type { ApiError } from "../types/api";

export interface UseOverviewResult {
  overview: OverviewResponse | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useOverview(domain: string | null): UseOverviewResult {
  const { data, loading, error, refetch } =
    useAsyncDomainQuery<OverviewResponse>(domain, getOverview);
  return { overview: data, loading, error, refetch };
}

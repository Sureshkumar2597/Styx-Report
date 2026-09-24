import { useAsyncDomainQuery } from "./internal/useAsyncDomainQuery";
import { getAssessment } from "../services/domain.service";
import type { AssessmentResponse } from "../types/assessment";
import type { ApiError } from "../types/api";

export interface UseAssessmentResult {
  assessment: AssessmentResponse | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useAssessment(domain: string | null): UseAssessmentResult {
  const { data, loading, error, refetch } =
    useAsyncDomainQuery<AssessmentResponse>(domain, getAssessment);
  return { assessment: data, loading, error, refetch };
}

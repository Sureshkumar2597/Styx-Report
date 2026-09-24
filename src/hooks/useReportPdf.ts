import { useEffect, useRef, useState, useCallback } from "react";
import { generateReportPdf, type GenerateReportPdfOptions } from "../utils/pdf";
import { waitForRenderSettled } from "../utils/waitForRender";

interface UseReportPdfArgs {
  reportUnlocked: boolean;
  domain: string;
  options?: GenerateReportPdfOptions;
  enabled?: boolean;
  /**
   * Called once the Blob has been generated successfully. This is where
   * delivery (upload, download, whatever) happens — the hook itself is
   * delivery-agnostic. If this throws/rejects, the error surfaces on
   * `error`, but `lastBlob` is preserved so the caller can retry the
   * delivery step via `retryDelivery()` without regenerating the PDF.
   */
  onComplete?: (blob: Blob) => void | Promise<void>;
}

interface UseReportPdfResult {
  portalTarget: HTMLDivElement | null;
  isGenerating: boolean;
  lastBlob: Blob | null;
  error: Error | null;
  /** Re-runs onComplete with the already-generated blob. No-op if there's no blob yet. */
  retryDelivery: () => void;
}

export function useReportPdf({
  reportUnlocked,
  domain,
  options,
  enabled = true,
  onComplete,
}: UseReportPdfArgs): UseReportPdfResult {
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const hasExportedRef = useRef(false);
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);

  // Always call the latest onComplete without re-running the generation
  // effect just because the callback identity changed.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Step 1+2: create the off-screen container once unlocked. UNCHANGED.
  useEffect(() => {
    if (!enabled || !reportUnlocked || hasExportedRef.current) return;

    const container = document.createElement("div");
    container.setAttribute("aria-hidden", "true");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "-99999px";
    container.style.pointerEvents = "none";
    container.style.width = "900px";
    document.body.appendChild(container);

    containerElRef.current = container;
    setIsGenerating(true);
    setPortalTarget(container);

    return () => {
      if (containerElRef.current === container) {
        container.remove();
        containerElRef.current = null;
      }
    };
  }, [enabled, reportUnlocked]);

  // Step 3-6: render → settle → snapshot → hand off to onComplete → clean up.
  useEffect(() => {
    if (!portalTarget) return;

    let cancelled = false;

    (async () => {
      try {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        if (cancelled) return;

        await waitForRenderSettled(portalTarget);
        if (cancelled) return;

        const blob = await generateReportPdf(portalTarget, options);
        if (cancelled) return;

        setLastBlob(blob);
        lastBlobRef.current = blob;
        hasExportedRef.current = true;
        setError(null);

        // Generation is done and considered successful regardless of what
        // happens next — delivery failures are handled separately below.
        await onCompleteRef.current?.(blob);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Only allow a full regenerate if we never got a blob at all.
          // If we have a blob and onComplete (upload) failed, keep
          // hasExportedRef true — retryDelivery() will resend the
          // existing blob instead of re-rendering/re-snapshotting.
          if (!lastBlobRef.current) {
            hasExportedRef.current = false;
          }
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
          portalTarget.remove();
          containerElRef.current = null;
          setPortalTarget(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [portalTarget, domain, options]);

  const retryDelivery = useCallback(() => {
    const blob = lastBlobRef.current;
    if (!blob) return;
    setError(null);
    Promise.resolve(onCompleteRef.current?.(blob)).catch((err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
    });
  }, []);

  return { portalTarget, isGenerating, lastBlob, error, retryDelivery };
}

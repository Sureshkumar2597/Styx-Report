import { memo } from "react";

/**
 * Purely decorative — no state, no timers, no props. Every motion here
 * is a CSS keyframe (transform/opacity only) so it costs nothing on the
 * JS thread and stays on the GPU compositor. Node positions/delays live
 * in loading.css (.ldg-node-1..8) rather than inline styles.
 */
function LoadingBackgroundImpl() {
  return (
    <div className="ldg-bg" aria-hidden="true">
      <div className="ldg-bg-grid" />
      <div className="ldg-bg-scanline" />
      <span className="ldg-node ldg-node-1" />
      <span className="ldg-node is-blue ldg-node-2" />
      <span className="ldg-node ldg-node-3" />
      <span className="ldg-node is-blue ldg-node-4" />
      <span className="ldg-node ldg-node-5" />
      <span className="ldg-node ldg-node-6" />
      <span className="ldg-node is-blue ldg-node-7" />
      <span className="ldg-node ldg-node-8" />
    </div>
  );
}

export const LoadingBackground = memo(LoadingBackgroundImpl);

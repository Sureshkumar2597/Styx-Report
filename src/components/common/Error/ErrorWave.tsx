import React, { memo, useEffect, useRef } from "react";

export interface ErrorWaveProps {
  onAnimationComplete?: () => void;
  isTravelling?: boolean;
  className?: string;
}

const WAVE_PATH_D =
  "M0,50 C60,20 100,80 160,50 C220,20 260,80 320,50 C380,20 420,80 480,50 C510,35 535,45 560,50";

function ErrorWaveBase({
  onAnimationComplete,
  isTravelling = false,
  className,
}: ErrorWaveProps): JSX.Element {
  const pathRef = useRef<SVGPathElement | null>(null);
  const lanternRef = useRef<SVGCircleElement | null>(null);
  const pulseRef = useRef<SVGCircleElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const path = pathRef.current;
    const lantern = lanternRef.current;
    const pulse = pulseRef.current;

    if (!path || !lantern || !pulse) return;

    const pathLength = path.getTotalLength();

    const setPositionAt = (progress: number) => {
      const point = path.getPointAtLength(progress * pathLength);
      lantern.setAttribute("cx", String(point.x));
      lantern.setAttribute("cy", String(point.y));
      pulse.setAttribute("cx", String(point.x));
      pulse.setAttribute("cy", String(point.y));
    };

    if (!isTravelling) {
      setPositionAt(0);
      return;
    }

    const duration = 1600;
    let startTimestamp: number | null = null;

    const animate = (now: number) => {
      if (startTimestamp === null) startTimestamp = now;
      const elapsed = now - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      setPositionAt(easedProgress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTravelling, onAnimationComplete]);

  return (
    <div className={`river-wrap ${className ?? ""}`}>
      <svg
        className="river-svg"
        viewBox="0 0 560 90"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path id="riverPath" ref={pathRef} d={WAVE_PATH_D} />
        <path id="riverPathFlow" d={WAVE_PATH_D} />
        <circle id="lanternPulse" ref={pulseRef} cx="20" cy="50" r="5" />
        <circle id="lantern" ref={lanternRef} cx="20" cy="50" r="5" />
      </svg>
    </div>
  );
}

export const ErrorWave = memo(ErrorWaveBase);

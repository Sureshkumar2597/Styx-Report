import type { ReactNode, ClipboardEvent, MouseEvent } from "react";
import "./BlurText.css";
import { useReveal } from "../../../context/RevealContext";

export interface BlurTextProps {
  children: ReactNode;
  revealed?: boolean;
  className?: string;
  onClick?: () => void;
}

export function BlurText({
  children,
  revealed,
  className = "",
  onClick,
}: BlurTextProps) {
  const { isRevealed, requestReveal } = useReveal();

  const effectiveRevealed = revealed ?? isRevealed;

  const handleClick = () => {
    if (!effectiveRevealed) {
      requestReveal();
    }

    onClick?.();
  };

  const prevent = (
    e: ClipboardEvent<HTMLSpanElement> | MouseEvent<HTMLSpanElement>,
  ) => {
    if (!effectiveRevealed) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <span
      className={`blur-text ${effectiveRevealed ? "revealed" : ""} ${className}`}
      onClick={handleClick}
      onCopy={prevent}
      onCut={prevent}
      onContextMenu={prevent}
      draggable={false}
    >
      {children}
    </span>
  );
}

export default BlurText;

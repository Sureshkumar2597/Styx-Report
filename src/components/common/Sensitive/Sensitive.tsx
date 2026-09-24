import type { ReactNode } from "react";
import { useReveal } from "../../../context/RevealContext";
import "./Sensitive.css";

interface SensitiveProps {
  children: ReactNode;
  className?: string;
}

export default function Sensitive({
  children,
  className = "",
}: SensitiveProps) {
  const { isRevealed, requestReveal } = useReveal();

  return (
    <span
      className={`sensitive ${isRevealed ? "revealed" : ""} ${className}`}
      onClick={!isRevealed ? requestReveal : undefined}
    >
      {children}
    </span>
  );
}

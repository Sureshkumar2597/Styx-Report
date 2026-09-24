import { useEffect } from "react";
import { useReveal } from "../context/RevealContext";

export default function SensitiveProvider() {
  const { isRevealed } = useReveal();

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".sensitive");

    elements.forEach((el) => {
      el.classList.toggle("revealed", isRevealed);

      if (!isRevealed) {
        el.setAttribute("draggable", "false");
      }
    });

    const prevent = (e: Event) => {
      if (isRevealed) return;

      const target = e.target as HTMLElement | null;

      if (target?.closest(".sensitive")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("copy", prevent, true);
    document.addEventListener("cut", prevent, true);
    document.addEventListener("contextmenu", prevent, true);
    document.addEventListener("dragstart", prevent, true);
    document.addEventListener("selectstart", prevent, true);

    return () => {
      document.removeEventListener("copy", prevent, true);
      document.removeEventListener("cut", prevent, true);
      document.removeEventListener("contextmenu", prevent, true);
      document.removeEventListener("dragstart", prevent, true);
      document.removeEventListener("selectstart", prevent, true);
    };
  }, [isRevealed]);

  return null;
}

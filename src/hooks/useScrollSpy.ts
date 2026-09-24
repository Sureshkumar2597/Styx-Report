import { useEffect, useState } from "react";

/**
 * Watches a list of section ids and reports whichever one is currently
 * "active" per the same rootMargin heuristic the original App.tsx used.
 */
export function useScrollSpy(
  sectionIds: string[],
  initial: string = sectionIds[0],
): string {
  const [activeSection, setActiveSection] = useState<string>(initial);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );

    sections.forEach((s) => spy.observe(s));
    return () => spy.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return activeSection;
}

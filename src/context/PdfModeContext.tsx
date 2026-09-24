import { createContext, useContext, type ReactNode } from "react";

/**
 * Lets any existing report component ask "am I currently being
 * rendered for PDF export?" without needing a `pdfMode` prop threaded
 * through every layer. Components that don't check this render
 * exactly as they do today — this is purely additive/opt-in.
 *
 * Usage inside an existing component, when you're ready:
 *   const isPdf = usePdfMode();
 *   if (isPdf) { // skip animation, hover state, etc. }
 */
const PdfModeContext = createContext(false);

export function PdfModeProvider({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <PdfModeContext.Provider value={active}>{children}</PdfModeContext.Provider>
  );
}

export function usePdfMode(): boolean {
  return useContext(PdfModeContext);
}

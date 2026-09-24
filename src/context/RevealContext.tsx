import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface RevealContextValue {
  /** Global reveal state — true once verification succeeds. */
  isRevealed: boolean;
  /** Marks all masked content as revealed, app-wide. */
  reveal: () => void;
  /** Called by masked components when clicked; scrolls to the
   *  registered verification target instead of unlocking directly. */
  requestReveal: () => void;
  /** Lets the verification flow register how "scroll to me" should
   *  behave, without RevealContext knowing about that component. */
  registerScrollTarget: (fn: () => void) => void;
}

const RevealContext = createContext<RevealContextValue | undefined>(undefined);

export function RevealProvider({ children }: { children: ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const scrollTargetRef = useRef<(() => void) | null>(null);

  const reveal = useCallback(() => setIsRevealed(true), []);

  const registerScrollTarget = useCallback((fn: () => void) => {
    scrollTargetRef.current = fn;
  }, []);

  const requestReveal = useCallback(() => {
    scrollTargetRef.current?.();
  }, []);

  return (
    <RevealContext.Provider
      value={{ isRevealed, reveal, requestReveal, registerScrollTarget }}
    >
      {children}
    </RevealContext.Provider>
  );
}

export function useReveal(): RevealContextValue {
  const ctx = useContext(RevealContext);

  if (!ctx) {
    throw new Error("useReveal must be used within a RevealProvider");
  }

  return ctx;
}

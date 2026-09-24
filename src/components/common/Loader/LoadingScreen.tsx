import { LoadingHero } from "./LoadingHero";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { SCAN_MESSAGES } from "./LoadingMessages";
import { useScanSequence } from "./useScanSequence";

interface LoadingScreenProps {
  domain: string;
}

export function LoadingScreen({ domain }: LoadingScreenProps) {
  const { messageIndex } = useScanSequence(SCAN_MESSAGES.length);

  return (
    <div className="ldg-root">
      <LoadingHero domain={domain} messageIndex={messageIndex} />
      <LoadingSkeleton />
    </div>
  );
}

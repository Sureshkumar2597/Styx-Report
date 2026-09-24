import { useRef, useState, type FormEvent } from "react";
import { unlockReport } from "../services/report.service";
import { submitLeadToHubSpot } from "../services/hubspot.service";
import { useReveal } from "../context/RevealContext";
import { pushDataLayerEvent } from "../utils/dataLayer";

/**
 * Encapsulates everything related to the "unlock full report" flow:
 * the form fields/validation, the HubSpot lead submission gating the
 * unlock, the staggered card-unlock animation trigger, and the
 * scroll-to-unlock-section behavior used by both the topbar CTA and
 * the locked cards. Keeping this in one hook means App.tsx only wires
 * refs/handlers to components — no business logic lives there.
 *
 * Flow:
 * validate
 * -> submit to HubSpot
 * -> on success, fire data-layer event once
 * -> unlock + continue the existing PDF/animation flow
 * -> on failure, show an error, keep every entered value,
 *    and let the person retry.
 */
export function useUnlockFlow(lockedCardCount: number, reportDomain: string) {
  const [reportUnlocked, setReportUnlocked] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const { reveal } = useReveal();

  const [emailErr, setEmailErr] = useState(false);

  const [fullName, setFullName] = useState("");

  const [workEmail, setWorkEmail] = useState("");

  const [lastName, setLastName] = useState("");

  const [successName, setSuccessName] = useState("");

  const [successEmail, setSuccessEmail] = useState("");

  const [unlockedCards, setUnlockedCards] = useState<boolean[]>(() =>
    Array.from({ length: lockedCardCount }, () => false),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const unlockSectionRef = useRef<HTMLElement>(null);

  const unlockBoxRef = useRef<HTMLDivElement>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  /**
   * Prevent risk_report_full_report_submit from
   * being pushed more than once.
   */
  const fullReportSubmitFiredRef = useRef(false);

  const goToUnlock = () => {
    unlockSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    const box = unlockBoxRef.current;

    if (box) {
      box.classList.remove("attn");

      void box.offsetWidth;

      box.classList.add("attn");
    }
  };

  const completeUnlock = (name: string, email: string) => {
    reveal();

    setSuccessName(name ? ", " + name.split(" ")[0] : "");

    setSuccessEmail(email);

    setShowSuccess(true);
    setReportUnlocked(true);

    Array.from({
      length: lockedCardCount,
    }).forEach((_, i) => {
      setTimeout(() => {
        setUnlockedCards((prev) => {
          const copy = [...prev];

          copy[i] = true;

          return copy;
        });
      }, i * 140);
    });

    document.getElementById("classified")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const name = fullName.trim();
    const email = workEmail.trim();

    if (!email || email.indexOf("@") === -1) {
      setEmailErr(true);

      emailInputRef.current?.focus();

      return;
    }

    setEmailErr(false);
    setSubmitError(null);
    setIsSubmitting(true);

    const result = await submitLeadToHubSpot({
      fullName: name,
      workEmail: email,
      lastName: lastName.trim(),
      reportDomain,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(
        result.error || "We couldn't submit your request. Please try again.",
      );

      return;
    }

    if (!fullReportSubmitFiredRef.current) {
      pushDataLayerEvent("risk_report_full_report_submit", "get-full-report");

      fullReportSubmitFiredRef.current = true;
    }

    completeUnlock(name, email);
  };

  return {
    unlockSectionRef,
    unlockBoxRef,
    emailInputRef,

    reportUnlocked,
    showSuccess,

    emailErr,

    fullName,
    setFullName,

    lastName,
    setLastName,

    workEmail,
    setWorkEmail,

    successName,
    successEmail,

    unlockedCards,

    goToUnlock,
    handleSubmit,

    isSubmitting,
    submitError,
  };
}

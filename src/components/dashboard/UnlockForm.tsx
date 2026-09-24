import { forwardRef, type FormEvent, useState, type Ref } from "react";
import { Section } from "../layout/Section";
import { isMatchingCompanyDomain } from "../../utils/domain";
import "./UnlockForm.css";

interface UnlockFormProps {
  unlockBoxRef: Ref<HTMLDivElement>;
  emailInputRef: Ref<HTMLInputElement>;
  emailErr: boolean;
  fullName: string;
  onFullNameChange: (v: string) => void;
  workEmail: string;
  onWorkEmailChange: (v: string) => void;
  lastName: string;
  onLastNameChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  reportDomain: string; // the domain the report was opened for
  // HubSpot submission state, sourced from useUnlockFlow.
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Derives a human-readable company name out of a raw domain string.
 *   atb.com          -> "Atb"
 *   apple.com        -> "Apple"
 *   my-company.co.uk -> "My Company"
 */
function getCompanyNameFromDomain(domain: string): string {
  if (!domain) return "";
  let d = domain.trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.split(/[/?#]/)[0];
  const firstLabel = d.split(".")[0];
  const words = firstLabel.split(/[-_]+/).filter(Boolean);
  if (words.length === 0) return domain;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export const UnlockForm = forwardRef<HTMLElement, UnlockFormProps>(
  function UnlockForm(
    {
      unlockBoxRef,
      emailInputRef,
      emailErr,
      fullName,
      onFullNameChange,
      workEmail,
      onWorkEmailChange,
      lastName,
      onLastNameChange,
      onSubmit,
      reportDomain,
      isSubmitting,
      submitError,
    },
    sectionRef,
  ) {
    // Local, component-owned state for the domain-mismatch message.
    // Kept separate from the `emailErr` prop, which the parent already
    // owns for its own validation, so neither side stomps on the other.
    const [domainError, setDomainError] = useState(false);

    const brandName = getCompanyNameFromDomain(reportDomain);

    // Clear the domain error as soon as the user edits the email,
    // without touching the parent's own onChange contract.
    const handleWorkEmailChange = (v: string) => {
      if (domainError) setDomainError(false);
      onWorkEmailChange(v);
    };

    // Gate submission on domain match before calling the parent's
    // onSubmit. If invalid: block submit, show message, refocus email,
    // and leave every field's value untouched.
    const handleSubmit = (e: FormEvent) => {
      if (isSubmitting) {
        e.preventDefault();
        return;
      }

      const valid = isMatchingCompanyDomain(workEmail, reportDomain);

      if (!valid) {
        e.preventDefault();
        setDomainError(true);

        if (
          emailInputRef &&
          typeof emailInputRef !== "function" &&
          emailInputRef.current
        ) {
          emailInputRef.current.focus();
        }
        return;
      }

      setDomainError(false);
      onSubmit(e);
    };

    return (
      <Section id="unlock" ref={sectionRef}>
        <div className="unlock-box ulf-box" id="unlockBox" ref={unlockBoxRef}>
          <div id="formState" className="ulf-form-state">
            <h3 className="unlock-title ulf-title">
              Unlock the Complete {brandName} Report
            </h3>
            <p className="unlock-sub ulf-sub">
              Get the complete cybersecurity assessment for{" "}
              <strong>{brandName}</strong>.
            </p>

            <form id="unlockForm" className="ulf-form" onSubmit={handleSubmit}>
              <div className="ulf-field">
                <input
                  type="text"
                  id="fullName"
                  placeholder="Full name"
                  required
                  className="ulf-input"
                  value={fullName}
                  onChange={(e) => onFullNameChange(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="ulf-field">
                <input
                  type="email"
                  id="workEmail"
                  placeholder="Work email"
                  required
                  className={`ulf-input ${
                    emailErr || domainError ? "ulf-input-err" : ""
                  }`}
                  ref={emailInputRef}
                  value={workEmail}
                  onChange={(e) => handleWorkEmailChange(e.target.value)}
                  disabled={isSubmitting}
                />
                {domainError && (
                  <p className="ulf-error-text" id="workEmailDomainError">
                    Please enter a work email that belongs to {reportDomain}.
                  </p>
                )}
              </div>

              <div className="ulf-field">
                <input
                  type="text"
                  id="lastName"
                  placeholder="Last name"
                  required
                  className="ulf-input"
                  value={lastName}
                  onChange={(e) => onLastNameChange(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {submitError && (
                <p className="ulf-error-text" id="hubspotSubmitError">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                className="ulf-submit-btn"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Unlock Full Report →"}
              </button>
            </form>

            <p className="form-note ulf-note">
              No spam. One email with your complete assessment. Unsubscribe
              anytime.
            </p>
          </div>
        </div>
      </Section>
    );
  },
);

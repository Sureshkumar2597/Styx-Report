import { useState, type FormEvent, type Ref } from "react";
import { isMatchingCompanyDomain } from "../../utils/domain";
import "./UnlockForm.css";

export interface UnlockFormFieldsProps {
  fullName: string;
  onFullNameChange: (v: string) => void;
  workEmail: string;
  onWorkEmailChange: (v: string) => void;
  lastName: string;
  onLastNameChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  reportDomain: string; // the domain the report was opened for
  emailInputRef: Ref<HTMLInputElement>;
  emailErr: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  /** Optional override for the submit button's resting label. */
  submitLabel?: string;
  /** Optional extra class applied to the <form> element for layout tweaks. */
  className?: string;
}

/**
 * Derives a human-readable company name out of a raw domain string.
 *   atb.com          -> "Atb"
 *   apple.com        -> "Apple"
 *   my-company.co.uk -> "My Company"
 *
 * Shared by every surface that renders the unlock form (UnlockForm,
 * FullAssessment) so the derivation logic lives in exactly one place.
 */
export function getCompanyNameFromDomain(domain: string): string {
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

/**
 * The single source of truth for the unlock form's markup.
 *
 * Owns only presentation-adjacent, non-business-critical state (the
 * "this email doesn't match the report's domain" message) exactly as
 * `UnlockForm` used to. All actual business logic — HubSpot submission,
 * loading state, submit errors, parent-owned field state and refs — is
 * still fully owned by the caller (`useUnlockFlow`) and passed in as
 * props, completely unchanged.
 *
 * Rendered by both `UnlockForm.tsx` and `FullAssessment.tsx` so neither
 * one duplicates this JSX.
 */
export function UnlockFormFields({
  fullName,
  onFullNameChange,
  workEmail,
  onWorkEmailChange,
  lastName,
  onLastNameChange,
  onSubmit,
  reportDomain,
  emailInputRef,
  emailErr,
  isSubmitting,
  submitError,
  submitLabel = "Unlock Full Report →",
  className = "",
}: UnlockFormFieldsProps) {
  // Local, component-owned state for the domain-mismatch message.
  // Kept separate from the `emailErr` prop, which the parent already
  // owns for its own validation, so neither side stomps on the other.
  const [domainError, setDomainError] = useState(false);

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
    <>
      <form
        id="unlockForm"
        className={`ulf-form ${className}`.trim()}
        onSubmit={handleSubmit}
      >
        {/* First Name */}
        <div className={`ulf-field ${fullName ? "has-value" : ""}`}>
          <input
            type="text"
            id="fullName"
            required
            className="ulf-input"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            disabled={isSubmitting}
          />
          <label htmlFor="fullName" className="ulf-label">
            First name
          </label>
        </div>

        {/* Last Name */}
        <div className={`ulf-field ${lastName ? "has-value" : ""}`}>
          <input
            type="text"
            id="lastName"
            required
            className="ulf-input"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            disabled={isSubmitting}
          />
          <label htmlFor="lastName" className="ulf-label">
            Last name
          </label>
        </div>

        {/* Work Email */}
        <div className={`ulf-field ${workEmail ? "has-value" : ""}`}>
          <input
            type="email"
            id="workEmail"
            required
            className={`ulf-input ${
              emailErr || domainError ? "ulf-input-err" : ""
            }`}
            ref={emailInputRef}
            value={workEmail}
            onChange={(e) => handleWorkEmailChange(e.target.value)}
            disabled={isSubmitting}
          />
          <label htmlFor="workEmail" className="ulf-label">
            Work email
          </label>

          {domainError && (
            <p className="ulf-error-text" id="workEmailDomainError">
              Please enter a work email that belongs to {reportDomain}.
            </p>
          )}
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
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      </form>

      <p className="form-note ulf-note">
        No spam. One email with your complete assessment. Unsubscribe anytime.
      </p>
    </>
  );
}

export default UnlockFormFields;

import { forwardRef, type FormEvent, type Ref } from "react";
import { Section } from "../layout/Section";
import { UnlockFormFields, getCompanyNameFromDomain } from "./UnlockFormFields";
import PdfCover from "../pdf/PdfCover";
import "./FullAssessment.css";
import "./UnlockForm.css";

interface FullAssessmentProps {
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
  reportDomain: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heroData?: any;
  isSubmitting: boolean;
  submitError: string | null;
}

export const FullAssessment = forwardRef<HTMLElement, FullAssessmentProps>(
  function FullAssessment(
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
      heroData,
      isSubmitting,
      submitError,
    },
    sectionRef,
  ) {
    const brandName = getCompanyNameFromDomain(reportDomain) || "your";

    // Static fallback data so the background renders instantly without crashing
    const staticHeroData = {
      companyTitle: brandName,
      metaIndustry: "Industry",
      metaDate: new Date().getFullYear().toString(),
      description:
        "Comprehensive analysis of external attack surface and digital risk exposure.",
    };

    // Use real data if available, otherwise use static fallback
    const coverData = heroData || staticHeroData;

    return (
      <Section id="unlock" className="fa-section" ref={sectionRef}>
        <div className="fa-wrap">
          <div className="fa-panel-head">
            <div>
              <h2 className="fa-section-title">Unlock the Full Report</h2>
            </div>
          </div>

          <div className="fa-teaser-wrap">
            {/* Visual preview of the actual PDF Cover */}
            <div className="fa-pdf-cover-preview" aria-hidden="true">
              <PdfCover data={coverData} domain={reportDomain} />
            </div>

            <div className="fa-teaser-overlay">
              <div
                className="fa-unlock-card ulf-box"
                id="unlockBox"
                ref={unlockBoxRef}
              >
                <div id="formState" className="ulf-form-state">
                  <div className="fa-unlock-card-eyebrow">
                    🔒 Full report locked
                  </div>
                  <h3 className="fa-unlock-card-title">
                    Unlock the Complete {brandName} Report
                  </h3>

                  <UnlockFormFields
                    fullName={fullName}
                    onFullNameChange={onFullNameChange}
                    workEmail={workEmail}
                    onWorkEmailChange={onWorkEmailChange}
                    lastName={lastName}
                    onLastNameChange={onLastNameChange}
                    onSubmit={onSubmit}
                    reportDomain={reportDomain}
                    emailInputRef={emailInputRef}
                    emailErr={emailErr}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    );
  },
);

export default FullAssessment;

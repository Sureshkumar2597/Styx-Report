import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useDomain } from "../../hooks/useDomain";
import { useDomainValidation } from "../../hooks/useDomainValidation";
import { useDomainReport } from "../../hooks/useDomainReport";
import { useScrollSpy } from "../../hooks/useScrollSpy";
import { useUnlockFlow } from "../../hooks/useUnlockFlow";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import {
  SCROLLSPY_SECTION_IDS,
  DEFAULT_ACTIVE_SECTION,
} from "../../constants/navigation";
import type { Report } from "../../types/report";
import type { ApiError } from "../../types/api";

import { pushDataLayerEvent } from "../../utils/dataLayer";

import { Topbar } from "../layout/Topbar";
import { Hero } from "../layout/Hero";
import { Cta } from "../layout/Cta";
import { Footer } from "../layout/Footer";
import { Summary } from "../dashboard/Summary";
import { Spotlight } from "../dashboard/Spotlight";
import { Timeline } from "../dashboard/Timeline";
import { Findings } from "../dashboard/Findings";
import { PasswordStrength } from "../dashboard/PasswordStrength";
import { MalwareFamilies } from "../dashboard/MalwareFamilies";
import { LockedReports } from "../dashboard/LockedReports";
import { ThankYouPage } from "../dashboard/ThankYouPage";
import { LoadingScreen } from "../common/Loader/LoadingScreen";
import FullAssessment from "../dashboard/FullAssessment";
import SensitiveProvider from "../../context/SensitiveProvider";
import { ErrorPage, type ErrorType } from "../common/Error/ErrorPage";
import { useReportPdf } from "../../hooks/useReportPdf";
import { ReportPdf } from "../pdf/ReportPdf";
import { createPortal } from "react-dom";
import { pingWordPressStatus } from "../../services/hubspot.service";
import { uploadReport } from "../../services/reportUpload.service";

type UploadStatus = "idle" | "uploading" | "success" | "error";

function mapApiErrorToErrorType(kind: ApiError["kind"]): ErrorType {
  switch (kind) {
    case "bad_request":
      return "invalid_domain";
    case "network_error":
      return "offline";
    case "timeout":
      return "timeout";
    case "not_found":
      return "no_data";
    case "invalid_response":
    case "unauthorized":
    case "forbidden":
    case "rate_limited":
    case "server_error":
    case "bad_gateway":
    case "service_unavailable":
    case "gateway_timeout":
    case "unknown":
    case "aborted":
    default:
      return "api_error";
  }
}

function Dashboard({ report }: { report: Report }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const activeSection = useScrollSpy(
    SCROLLSPY_SECTION_IDS,
    DEFAULT_ACTIVE_SECTION,
  );

  const unlock = useUnlockFlow(
    report.lockedReports.cards.length,
    report.domain,
  );

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  const deliverPdf = async (blob: Blob) => {
    setUploadStatus("uploading");
    setUploadErrorMsg(null);

    try {
      const names = unlock.fullName.trim().split(/\s+/);

      const uploadResult = await uploadReport({
        pdf: blob,
        domain: report.domain,
        firstName: names.shift() ?? "",
        lastName: unlock.lastName.trim(),
        workEmail: unlock.workEmail,
      });

      pingWordPressStatus("success", uploadResult.report_id);

      setUploadStatus("success");
    } catch (err) {
      setUploadStatus("error");

      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";

      setUploadErrorMsg(message);

      pingWordPressStatus("failed", undefined, message);

      throw err;
    }
  };

  const pdfExport = useReportPdf({
    reportUnlocked: unlock.reportUnlocked,
    domain: report.domain,
    onComplete: deliverPdf,
  });

  const handleRetryUpload = () => {
    pdfExport.retryDelivery();
  };

  const showThankYou = unlock.showSuccess;

  return (
    <>
      <Topbar
        navLinks={report.navigation}
        activeSection={activeSection}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        onNavLinkClick={() => setMenuOpen(false)}
        reportUnlocked={unlock.reportUnlocked}
        onUnlockClick={unlock.goToUnlock}
      />

      <SensitiveProvider />

      {showThankYou ? (
        <ThankYouPage
          email={unlock.successEmail}
          status={
            uploadStatus === "success"
              ? "success"
              : uploadStatus === "error"
                ? "error"
                : "uploading"
          }
          onRetry={handleRetryUpload}
        />
      ) : (
        <>
          <Hero data={report.hero} domain={report.domain} />
          <Summary data={report.summary} />
          <Spotlight data={report.spotlight} />
          <Timeline data={report.timeline} domain={report.domain} />
          <Findings data={report.findings} />
          <MalwareFamilies data={report.families} domain={report.domain} />

          <FullAssessment
            ref={unlock.unlockSectionRef}
            unlockBoxRef={unlock.unlockBoxRef}
            emailInputRef={unlock.emailInputRef}
            emailErr={unlock.emailErr}
            fullName={unlock.fullName}
            onFullNameChange={unlock.setFullName}
            workEmail={unlock.workEmail}
            onWorkEmailChange={unlock.setWorkEmail}
            lastName={unlock.lastName}
            onLastNameChange={unlock.setLastName}
            onSubmit={unlock.handleSubmit}
            reportDomain={report.domain}
            isSubmitting={unlock.isSubmitting}
            submitError={unlock.submitError}
          />

          {/* <Cta /> */}
        </>
      )}

      <Footer />

      {pdfExport.portalTarget &&
        createPortal(<ReportPdf report={report} />, pdfExport.portalTarget)}
    </>
  );
}

export function ReportPage() {
  const { isOnline } = useNetworkStatus();

  const { domain, isFormatValid } = useDomain();

  const validationDomain = isOnline && isFormatValid ? domain : null;

  const {
    isValidating: isValidatingDomain,
    domainExists,
    validationError,
    retryValidation,
  } = useDomainValidation(validationDomain);

  const hudsonRockDomain = isOnline && domainExists === true ? domain : null;

  const { loading, error, report, hasData, isEmpty, isLoaded, refresh } =
    useDomainReport(hudsonRockDomain);

  const [, setSearchParams] = useSearchParams();

  const [pendingFreshFetch, setPendingFreshFetch] = useState(false);

  const wasOnlineRef = useRef(isOnline);

  const reportGeneratedDomainRef = useRef<string | null>(null);

  useEffect(() => {
    const justCameBackOnline = !wasOnlineRef.current && isOnline;

    wasOnlineRef.current = isOnline;

    if (justCameBackOnline && domain) {
      setPendingFreshFetch(true);
      retryValidation();
    }
  }, [isOnline, domain, retryValidation]);

  useEffect(() => {
    if (pendingFreshFetch && domainExists === true) {
      refresh();
      setPendingFreshFetch(false);
    }
  }, [pendingFreshFetch, domainExists, refresh]);

  const handleOfflineRetry = useCallback(() => {
    if (!isOnline) return;

    if (domain) {
      setPendingFreshFetch(true);
      retryValidation();
    }
  }, [isOnline, domain, retryValidation]);

  useEffect(() => {
    (window as Window & { __REPORT_READY__?: boolean }).__REPORT_READY__ =
      false;
  }, [domain, loading]);

  useEffect(() => {
    if (!domain || !isLoaded || !hasData || !report || error) {
      return;
    }

    if (reportGeneratedDomainRef.current === domain) {
      return;
    }

    pushDataLayerEvent("risk_report_generated", "domain-entry");

    reportGeneratedDomainRef.current = domain;
  }, [domain, isLoaded, hasData, report, error]);

  const handleScanAnother = (newDomain?: string) => {
    if (!newDomain) return;

    setSearchParams({
      domain: newDomain,
    });
  };

  if (!isOnline) {
    return <ErrorPage initialType="offline" onRetry={handleOfflineRetry} />;
  }

  if (!isFormatValid) {
    return (
      <ErrorPage
        initialType="invalid_domain"
        onScanAnother={handleScanAnother}
      />
    );
  }

  if (isValidatingDomain) {
    return <LoadingScreen key="validating" domain={domain ?? undefined} />;
  }

  if (validationError) {
    return <ErrorPage initialType="api_error" onRetry={retryValidation} />;
  }

  if (domainExists === false) {
    return (
      <ErrorPage
        initialType="invalid_domain"
        onScanAnother={handleScanAnother}
      />
    );
  }

  if (error) {
    return (
      <ErrorPage
        initialType={mapApiErrorToErrorType(error.kind)}
        onRetry={refresh}
        onScanAnother={handleScanAnother}
      />
    );
  }

  if (isEmpty) {
    return (
      <ErrorPage initialType="no_data" onScanAnother={handleScanAnother} />
    );
  }

  const showLoading = (loading && !isLoaded) || !hasData || !report;

  return (
    <AnimatePresence mode="wait">
      {showLoading ? (
        <LoadingScreen key="loading" domain={domain} />
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.45,
            ease: "easeOut",
          }}
        >
          <Dashboard report={report!.ui} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

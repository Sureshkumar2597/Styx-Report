// src/components/pdf/ReportPdf.tsx
/* ======================================================================
   REPORT PDF

   Page 1 - PDF Cover
   Page 2 - Summary
   Page 3 - Spotlight
   Page 4 - Findings
   Page 5 - Timeline
   Page 6 - Malware Families
   ====================================================================== */

import type { ReactNode } from "react";
import type { Report } from "../../types/report";

import { PdfModeProvider } from "../../context/PdfModeContext";

import PdfCover from "./PdfCover";
import { Summary } from "../dashboard/Summary";
import { Spotlight } from "../dashboard/Spotlight";
import { Findings } from "../dashboard/Findings";
import { Timeline } from "../dashboard/Timeline";
import { MalwareFamilies } from "../dashboard/MalwareFamilies";

import { PdfPage } from "./PdfPage";
import { PdfHeaderBanner } from "./PdfHeaderBanner";

import "./pdf-print.css";

interface ReportPdfProps {
  report: Report;
}

interface PdfPageDef {
  content: ReactNode;
  bleedTop?: boolean;
  centerContent?: boolean;
  header?: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

export function ReportPdf({ report }: ReportPdfProps) {
  const pages: PdfPageDef[] = [
    // -----------------------------------------------------------------
    // Page 1 - PDF Cover
    // -----------------------------------------------------------------
    {
      content: <PdfCover data={report.hero} domain={report.domain} />,
      bleedTop: true,
      hideHeader: true,
      hideFooter: true,
    },

    // -----------------------------------------------------------------
    // Page 2 - Summary
    // -----------------------------------------------------------------
    {
      content: <Summary data={report.summary} />,
      header: <PdfHeaderBanner title="External Cyber Risk Assessment" />,
    },

    // -----------------------------------------------------------------
    // Page 3 - Spotlight
    // -----------------------------------------------------------------
    {
      content: (
        <Spotlight
          data={report.spotlight}
          domain={report.domain}
          isPdf={true}
        />
      ),
      header: <PdfHeaderBanner title="External Cyber Risk Assessment" />,
    },

    // -----------------------------------------------------------------
    // Page 4 - Findings
    // -----------------------------------------------------------------
    {
      content: <Findings data={report.findings} domain={report.domain} />,
      header: <PdfHeaderBanner title="External Cyber Risk Assessment" />,
    },

    // -----------------------------------------------------------------
    // Page 5 - Timeline
    // -----------------------------------------------------------------
    {
      content: <Timeline data={report.timeline} domain={report.domain} />,
      header: <PdfHeaderBanner title="External Cyber Risk Assessment" />,
    },

    // -----------------------------------------------------------------
    // Page 6 - Malware Families
    // -----------------------------------------------------------------
    {
      content: (
        <MalwareFamilies data={report.families} domain={report.domain} />
      ),
      header: <PdfHeaderBanner title="External Cyber Risk Assessment" />,
    },
  ];

  return (
    <PdfModeProvider active>
      <div className="report-pdf-root" id="report-pdf-root">
        {pages.map((page, index) => (
          <PdfPage
            key={`pdf-page-${index + 1}`}
            pageNumber={index + 1}
            totalPages={pages.length}
            bleedTop={page.bleedTop}
            centerContent={page.centerContent}
            header={page.header}
            hideHeader={page.hideHeader}
            hideFooter={page.hideFooter}
          >
            {page.content}
          </PdfPage>
        ))}
      </div>
    </PdfModeProvider>
  );
}

export default ReportPdf;

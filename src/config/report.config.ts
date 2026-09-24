/**
 * Central report-endpoint configuration.
 *
 * Mirrors hubspot.config.ts: the endpoint is read from a Vite env var
 * so the same build can point at different WP installs per
 * environment without a code change. This is the *existing*
 * WordPress plugin endpoint that persists the report + PDF and hands
 * back report_id — no new endpoint is introduced.
 */

interface ReportConfig {
  apiEndpoint: string;
}

export const reportConfig: ReportConfig = {
  apiEndpoint:
    import.meta.env.VITE_REPORT_API_ENDPOINT ||
    "https://riskreport.styxintel.com/wp-json/styx/v1/report",
};

export function isReportConfigComplete(): boolean {
  return Boolean(reportConfig.apiEndpoint);
}

/* ======================================================================
   REPORT UPLOAD SERVICE
   Owns the entire "send generated PDF + lead info to WordPress" step.
   Knows nothing about React, hooks, or the unlock flow — just takes a
   Blob + metadata and returns a Promise. Throws on any failure so the
   caller can decide how to surface/retry it.
   ====================================================================== */

const UPLOAD_ENDPOINT =
  "https://riskreport.styxintel.com/wp-json/styx/v1/report";

export interface UploadReportPayload {
  pdf: Blob;
  domain: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  companyName?: string;
}

export interface UploadReportResult {
  success: boolean;
  [key: string]: unknown;
}

function buildReportFilename(domain: string): string {
  return `${domain.replace(/\./g, "-")}-report.pdf`;
}

/**
 * POSTs the PDF + lead metadata to the Styx Report Manager WordPress
 * plugin as multipart/form-data. Resolves with the parsed JSON body on
 * HTTP 2xx, throws an Error otherwise (network failure, non-2xx status,
 * or a plugin-reported error message).
 */
export async function uploadReport({
  pdf,
  domain,
  firstName,
  lastName,
  workEmail,
}: UploadReportPayload): Promise<UploadReportResult> {
  const formData = new FormData();
  formData.append("pdf", pdf, buildReportFilename(domain));
  formData.append("domain", domain);
  formData.append("first_name", firstName);
  formData.append("last_name", lastName);
  formData.append("email", workEmail);

  let response: Response;
  try {
    response = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    throw new Error(
      `Network error while uploading report: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch (err) {
    console.log("Failed to parse upload response", err);
  }

  if (!response.ok) {
    const pluginMessage =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : null;
    throw new Error(
      pluginMessage ?? `Upload failed with status ${response.status}`,
    );
  }

  return (data as UploadReportResult) ?? { success: true };
}

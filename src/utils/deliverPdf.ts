/* ======================================================================
   Delivery step, kept entirely separate from generation. Phase 1 only
   downloads. Phase 2 will add uploadPdf() here and swap the call in
   useReportPdf.ts — generateReportPdf() never has to change.
   ====================================================================== */

export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * PHASE 2 STUB — not called yet. Left here so the shape is obvious:
 * same Blob in, POST as FormData to your WordPress plugin endpoint,
 * plugin handles save PDF / save lead / sync HubSpot.
 */
// export async function uploadPdf(
//   blob: Blob,
//   meta: { domain: string; fullName: string; workEmail: string; companyName?: string },
// ): Promise<void> {
//   const formData = new FormData();
//   formData.append("file", blob, `${meta.domain.replace(/\./g, "-")}-report.pdf`);
//   formData.append("domain", meta.domain);
//   formData.append("fullName", meta.fullName);
//   formData.append("workEmail", meta.workEmail);
//   if (meta.companyName) formData.append("companyName", meta.companyName);
//
//   const res = await fetch("/wp-json/styx/v1/report-pdf", { method: "POST", body: formData });
//   if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
// }

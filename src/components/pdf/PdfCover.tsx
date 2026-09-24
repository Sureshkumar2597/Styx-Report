import HexTop from "../../assets/images/hexagon-top.svg";
import HexBottom from "../../assets/images/hexagon-bottom.svg";
import PdfFooter from "./PdfFooter";
import type { HeroData } from "../../types/report";

interface PdfCoverProps {
  data: HeroData;
  domain: string;
  pageNumber?: number;
  totalPages: number;
}

function getCompanyName(companyTitle?: string) {
  if (!companyTitle) {
    return "";
  }

  return companyTitle
    .split(".")[0]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getValidGeneratedDate(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return "";
  }

  // Known invalid/default dates should never appear on the report.
  if (rawValue.includes("1969-12-31") || rawValue.includes("1970-01-01")) {
    return "";
  }

  let parsedDate: Date;

  // Support numeric Unix timestamps if metaDate is provided that way.
  if (/^\d+$/.test(rawValue)) {
    const numericValue = Number(rawValue);

    // Ignore zero / invalid epoch values.
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return "";
    }

    // Handle both seconds and milliseconds.
    parsedDate = new Date(
      numericValue < 10000000000 ? numericValue * 1000 : numericValue,
    );
  } else {
    parsedDate = new Date(rawValue);
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  // Do not allow epoch/default dates through.
  if (parsedDate.getFullYear() <= 1970) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getValidIndustry(value?: string) {
  if (!value) {
    return "";
  }

  const industry = value.trim();

  if (
    !industry ||
    ["not found", "n/a", "na", "none", "unknown", "-"].includes(
      industry.toLowerCase(),
    )
  ) {
    return "";
  }

  return industry;
}

export default function PdfCover({
  data,
  domain,
  pageNumber = 1,
  totalPages,
}: PdfCoverProps) {
  const companyName = getCompanyName(data.companyTitle);
  const industry = getValidIndustry(data.metaIndustry);
  const generatedDate = getValidGeneratedDate(data.metaDate);
  const targetDomain = domain?.trim() || "";

  const metaItems: string[] = [];

  if (industry) {
    metaItems.push(`Industry: ${industry}`);
  }

  if (generatedDate) {
    metaItems.push(`Date Generated: ${generatedDate}`);
  }

  if (targetDomain) {
    metaItems.push(`Target domain: ${targetDomain}`);
  }

  return (
    <section className="pdf-cover">
      <img src={HexTop} className="pdf-cover-top" alt="" />

      <img src={HexBottom} className="pdf-cover-bottom" alt="" />

      {/* Styx logo - direct hosted URL */}
      <img
        src="https://riskreport.styxintel.com/wp-content/uploads/2023/03/Styx-logo-1.png"
        className="pdf-cover-logo pdf-cover-logo-top-right"
        alt="Styx Intelligence"
      />

      <div className="pdf-cover-panel">
        <h2 className="pdf-cover-title">
          External Cyber
          <br />
          Risk Assessment
        </h2>

        {companyName && <div className="pdf-cover-company">{companyName}</div>}

        {metaItems.length > 0 && (
          <div className="pdf-cover-meta">
            {metaItems.map((item, index) => (
              <span key={item}>
                {index > 0 && " • "}
                {item}
              </span>
            ))}
          </div>
        )}

        {data.description && (
          <p
            className="pdf-cover-description"
            dangerouslySetInnerHTML={{
              __html: data.description,
            }}
          />
        )}
      </div>

      {/* PDF footer */}
      <PdfFooter pageNumber={pageNumber} totalPages={totalPages} />
    </section>
  );
}

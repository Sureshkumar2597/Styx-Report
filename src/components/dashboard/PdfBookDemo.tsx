import { usePdfMode } from "../../context/PdfModeContext";
import demoBg from "../../assets/images/demo-bg.png";

export function PdfBookDemo() {
  const isPdf = usePdfMode();

  if (!isPdf) return null;

  return (
    <a
      href="https://styxintel.com/book-a-demo?utm_source=riskreport&utm_medium=cta&utm_campaign=book_a_demo"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        marginTop: 32,
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          minHeight: 240,
          borderRadius: 20,
          overflow: "hidden",
          backgroundImage: `url('https://riskreport.styxintel.com/wp-content/uploads/2026/08/demo-bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 60px",
          boxSizing: "border-box",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <h2
            style={{
              margin: 0,
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Let’s walk through these findings together.
          </h2>

          <p
            style={{
              marginTop: 24,
              color: "rgba(255,255,255,.9)",
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            On a short call, we'll cover what we found and how Styx closes the
            gaps. Plus, we can provide a full risk report covering your brand
            impersonation exposure, DNS/email spoofing risk, certificate
            weaknesses across your infrastructure and more.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 20,
              minWidth: 180,
              height: 56,
              padding: "0 32px",
              borderRadius: 999,
              background: "#FF9800",
              color: "#111827",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Book a Call
          </div>
        </div>
      </div>
    </a>
  );
}

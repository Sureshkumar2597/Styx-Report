const GTM_ID = "GTM-MGQML3JC";

export function initGTM(): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];

  const existingScript = document.querySelector(
    `script[src*="googletagmanager.com/gtm.js"]`,
  );

  if (existingScript) return;

  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  const script = document.createElement("script");

  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

  document.head.appendChild(script);
}

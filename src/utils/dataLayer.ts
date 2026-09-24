type DataLayerEvent = {
  event: string;
  form_name: string;
  page_location: string;
  page_path: string;
};

declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
  }
}

export function pushDataLayerEvent(event: string, formName: string): void {
  window.dataLayer = window.dataLayer || [];

  window.dataLayer.push({
    event,
    form_name: formName,
    page_location: window.location.href,
    page_path: window.location.pathname,
  });
}

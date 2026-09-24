import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Mount point id. Must match STYX_DASHBOARD_ROOT_ID in
 * styx-dashboard.php (includes/shortcode.php output).
 */
const ROOT_ELEMENT_ID = 'styx-root';

/**
 * Global config object injected by WordPress via wp_localize_script().
 * See includes/enqueue.php -> styx_dashboard_register_and_enqueue().
 */
export interface StyxDashboardConfig {
  restUrl: string;
  nonce: string;
  ajaxUrl: string;
  version: string;
}

declare global {
  interface Window {
    StyxDashboardConfig?: StyxDashboardConfig;
  }
}

function bootstrap(): void {
  const container = document.getElementById(ROOT_ELEMENT_ID);

  // The shortcode may not be present on every page. Bail out quietly
  // instead of throwing, since this script could theoretically be
  // cached/loaded on a page where the shortcode was later removed.
  if (!container) {
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App config={window.StyxDashboardConfig} />
    </React.StrictMode>
  );
}

bootstrap();

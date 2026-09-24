import React from 'react';
import type { StyxDashboardConfig } from './main';

export interface AppProps {
  config?: StyxDashboardConfig;
}

/**
 * Root application component for the Styx Dashboard.
 *
 * This is intentionally minimal. Future work (per the project roadmap)
 * will layer in:
 *  - React Router for client-side routing
 *  - TanStack Query for data fetching against REST endpoints
 *  - Chart components
 *  - Multiple API integrations, using `config.restUrl` / `config.nonce`
 *    for authenticated requests back to WordPress.
 */
function App({ config }: AppProps): React.JSX.Element {
  const hasConfig = Boolean(config);

  return (
    <div className="styx-dashboard">
      <header className="styx-dashboard__header">
        <h1>Styx Dashboard</h1>
      </header>

      <main className="styx-dashboard__content">
        {hasConfig ? (
          <p>
            Connected to WordPress REST API at{' '}
            <code>{config?.restUrl}</code>
          </p>
        ) : (
          <p>Running without WordPress configuration (standalone dev mode).</p>
        )}
      </main>
    </div>
  );
}

export default App;

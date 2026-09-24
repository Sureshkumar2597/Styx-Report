# Styx Dashboard

A single-site WordPress plugin that loads a React (Vite + TypeScript) application
inside WordPress via the `[styx_dashboard]` shortcode.

This plugin is **not** built for distribution on WordPress.org. It is a custom,
single-purpose plugin built exclusively for the Styx website.

---

## 1. Architecture

```
WordPress
    ↓
Plugin (styx-dashboard)
    ↓
React (Vite + TypeScript) — build/assets
```

The plugin is completely **theme-independent**. It does not enqueue any theme
hooks, does not rely on theme templates, and does not touch `functions.php`.
Switching from Hello Elementor to Astra (or any other theme) has zero effect
on the plugin's behavior, because:

- Assets are enqueued via `wp_enqueue_scripts`, a WordPress core hook, not a
  theme hook.
- The shortcode output is a single `<div id="styx-root"></div>` with no
  theme-specific markup or classes.
- All app styling is scoped under `.styx-dashboard` in the React app's own
  CSS bundle.

---

## 2. Folder Structure

```
styx-dashboard/
    styx-dashboard.php       # Plugin bootstrap: headers, constants, includes
    uninstall.php            # Cleanup on plugin deletion
    README.md
    build/
        assets/              # Compiled JS/CSS copied from react/dist/assets
    includes/
        enqueue.php          # Conditional asset loading + cache busting
        shortcode.php        # [styx_dashboard] shortcode registration/render
        helpers.php          # Asset discovery + shared utility functions
    react/
        index.html
        package.json
        vite.config.ts
        tsconfig.json
        src/
            main.tsx
            App.tsx
            index.css
```

---

## 3. Requirements

- WordPress 6.0+
- PHP 7.4+
- Node.js 18+ (for building the React app; not required on the production server)

---

## 4. Development Workflow

The React app can be developed independently of WordPress using Vite's dev server.

```bash
cd react
npm install
npm run dev
```

This starts a local dev server (typically `http://localhost:5173`) with hot
module reload. `window.StyxDashboardConfig` will be `undefined` in this mode
(no WordPress backing it), and `App.tsx` handles that gracefully by showing
a "standalone dev mode" message.

To test against a real WordPress REST API while developing, you can
temporarily stub `window.StyxDashboardConfig` in `main.tsx` or via the
browser console.

---

## 5. Production Build Workflow

1. Build the React app:

   ```bash
   cd react
   npm install
   npm run build
   ```

   This produces `react/dist/assets/` containing hashed files such as:

   ```
   index-ABCD123.js
   index-EFGH123.css
   ```

2. Copy the contents of `react/dist/assets/` into the plugin's `build/assets/`
   directory, **replacing** old files:

   ```bash
   rm -rf ../build/assets/*
   cp -r dist/assets/* ../build/assets/
   ```

3. Do **not** rename any files. The plugin automatically detects the current
   `*.js` and `*.css` files in `build/assets/` via `glob()` — no manual
   filename configuration is ever required.

4. Deploy the entire `styx-dashboard/` plugin folder (including the refreshed
   `build/assets/`) to the WordPress site's `wp-content/plugins/` directory.

---

## 6. Deployment Instructions

1. Zip the `styx-dashboard/` folder (excluding `react/node_modules` and
   `react/dist` — only `build/assets` is needed on the server).
2. Upload via **Plugins → Add New → Upload Plugin**, or deploy via SFTP/SSH to
   `wp-content/plugins/styx-dashboard/`.
3. Activate **Styx Dashboard** from the Plugins screen.
4. Add the shortcode `[styx_dashboard]` to any page or post.
5. Visit that page — the React app will mount into `#styx-root`.

If the build files are missing at deploy time, logged-in administrators will
see an admin notice: **"React build files not found"**. The site will not
fatal error, and the shortcode will render nothing for regular visitors.

---

## 7. How Asset Loading Works

- `includes/helpers.php` → `styx_dashboard_find_build_asset( $extension )`
  scans `build/assets/*.{js,css}` using `glob()` and picks the most recently
  modified match. No filenames are ever hardcoded.
- `includes/enqueue.php` hooks into `wp_enqueue_scripts` and only registers/
  enqueues the JS and CSS **when the current singular post/page contains the
  `[styx_dashboard]` shortcode** (checked via `has_shortcode()`). Assets never
  load site-wide.
- `filemtime()` on the discovered asset file is used as the version string
  passed to `wp_enqueue_script()` / `wp_enqueue_style()`, so browsers/CDNs
  bust their cache automatically on every new build — no manual version bump
  needed.
- The script tag is filtered to include `type="module"`, since Vite outputs
  native ES modules.

---

## 8. Extending the Plugin (Roadmap)

The plugin is structured so the following can be added without refactoring:

| Feature                  | Where it goes                                              |
|---------------------------|-------------------------------------------------------------|
| Admin Settings (API URL/Key) | New `includes/admin-settings.php`, registered via `admin_menu` + Settings API, values read via `get_option()` and injected through the `styx_dashboard_localized_data` filter in `enqueue.php` |
| REST Endpoints            | New `includes/rest-api.php`, registered via `rest_api_init`, prefixed `styx_dashboard_rest_` |
| Custom Post Types          | New `includes/cpt.php`, registered via `init`, prefixed `styx_dashboard_register_cpt_` |
| AJAX handlers              | New `includes/ajax.php`, hooked via `wp_ajax_*` / `wp_ajax_nopriv_*` |
| React Router                | Add `react-router-dom` to `react/package.json`, wrap `<App />` in `App.tsx` |
| TanStack Query              | Add `@tanstack/react-query` to `react/package.json`, wrap with `QueryClientProvider` in `main.tsx` |
| Charts                       | Add a charting library (e.g. `recharts`) as a React dependency |
| Multiple API integrations    | Extend `styx_dashboard_localized_data` filter in `enqueue.php` to expose additional endpoint config to `window.StyxDashboardConfig` |

All future PHP functions **must** use the `styx_dashboard_` prefix and live in
their own file under `includes/`. No anonymous functions/closures should be
passed to `add_action`/`add_filter` — always use named functions for
consistency and easier debugging.

---

## 9. Coding Standards

- WordPress PHP Coding Standards followed throughout.
- All dynamic output is escaped (`esc_html()`, `esc_attr()`, `esc_url_raw()`).
- All hooked functions are named (no anonymous closures), prefixed
  `styx_dashboard_`.
- Each file has a single responsibility (helpers, enqueue, shortcode).
- No direct file access is possible in any PHP file (`ABSPATH` / `WP_UNINSTALL_PLUGIN` guards).

---

## 10. Uninstall Behavior

`uninstall.php` runs only when the plugin is **deleted** (not deactivated)
from the Plugins screen. As of v1.0.0 the plugin stores no options or
database tables, so there is nothing to remove. The file is kept in place,
structured and ready, for when future versions add persisted settings.

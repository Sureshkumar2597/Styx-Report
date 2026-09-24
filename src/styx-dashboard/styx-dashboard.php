<?php
/**
 * Plugin Name:       Styx Dashboard
 * Plugin URI:        https://styx.local
 * Description:       Loads the Styx React (Vite + TypeScript) dashboard application inside WordPress via the [styx_dashboard] shortcode. Built exclusively for the Styx website. Theme-independent.
 * Version:           1.0.0
 * Author:            BiCSoM Team
 * Author URI:        https://bicsom.com
 * License:           Proprietary
 * Text Domain:       styx-dashboard
 * Requires at least: 6.0
 * Requires PHP:      7.4
 *
 * @package Styx_Dashboard
 */

// Block direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * -----------------------------------------------------------------------
 * Core plugin constants.
 * These are the single source of truth for paths/urls/version used
 * throughout the plugin. Never hardcode paths elsewhere.
 * -----------------------------------------------------------------------
 */
define( 'STYX_DASHBOARD_VERSION', '1.0.0' );
define( 'STYX_DASHBOARD_FILE', __FILE__ );
define( 'STYX_DASHBOARD_DIR', plugin_dir_path( __FILE__ ) );
define( 'STYX_DASHBOARD_URL', plugin_dir_url( __FILE__ ) );
define( 'STYX_DASHBOARD_BUILD_DIR', STYX_DASHBOARD_DIR . 'build/assets/' );
define( 'STYX_DASHBOARD_BUILD_URL', STYX_DASHBOARD_URL . 'build/assets/' );
define( 'STYX_DASHBOARD_SHORTCODE_TAG', 'styx_dashboard' );
define( 'STYX_DASHBOARD_ROOT_ID', 'styx-root' );

/**
 * -----------------------------------------------------------------------
 * Load plugin includes.
 * Each file is responsible for a single concern. This keeps the plugin
 * easy to extend later (admin settings, REST endpoints, CPTs, etc.)
 * without turning this bootstrap file into a dumping ground.
 * -----------------------------------------------------------------------
 */
require_once STYX_DASHBOARD_DIR . 'includes/helpers.php';
require_once STYX_DASHBOARD_DIR . 'includes/enqueue.php';
require_once STYX_DASHBOARD_DIR . 'includes/shortcode.php';

/**
 * Runs on plugin activation.
 *
 * Currently a no-op placeholder, kept in place so future versions
 * can add activation logic (e.g. flushing rewrite rules for future
 * REST endpoints or CPTs) without needing to restructure the plugin.
 *
 * @return void
 */
function styx_dashboard_activate() {
	// Reserved for future use (e.g. flush_rewrite_rules(), default options, etc.).
}
register_activation_hook( STYX_DASHBOARD_FILE, 'styx_dashboard_activate' );

/**
 * Runs on plugin deactivation.
 *
 * Currently a no-op placeholder. Deactivation should NOT delete data;
 * that responsibility belongs to uninstall.php only.
 *
 * @return void
 */
function styx_dashboard_deactivate() {
	// Reserved for future use.
}
register_deactivation_hook( STYX_DASHBOARD_FILE, 'styx_dashboard_deactivate' );

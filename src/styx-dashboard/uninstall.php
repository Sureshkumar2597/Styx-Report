<?php
/**
 * Uninstall handler for Styx Dashboard.
 *
 * WordPress executes this file only when the plugin is deleted from
 * the Plugins screen (not on simple deactivation). It is responsible
 * for removing any data the plugin has stored.
 *
 * As of v1.0.0 the plugin stores no options, no custom post types,
 * and no custom database tables, so there is nothing to clean up yet.
 * This file is intentionally kept in place, structured and ready, so
 * that when future versions add wp_options entries (e.g. API URL,
 * API key) or custom tables, cleanup logic can be added here without
 * needing to create this file from scratch under time pressure.
 *
 * @package Styx_Dashboard
 */

// If uninstall is not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Remove plugin options.
 *
 * Placeholder for future use. Example (uncomment when options exist):
 *
 * delete_option( 'styx_dashboard_api_url' );
 * delete_option( 'styx_dashboard_api_key' );
 */
function styx_dashboard_uninstall_cleanup() {
	// Reserved for future option/table cleanup.
}
styx_dashboard_uninstall_cleanup();

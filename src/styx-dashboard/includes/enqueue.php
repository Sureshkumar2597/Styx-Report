<?php
/**
 * Asset enqueue logic for Styx Dashboard.
 *
 * Handles conditional, theme-independent loading of the compiled
 * React (Vite) build. Assets are only enqueued on pages/posts that
 * actually contain the [styx_dashboard] shortcode, never globally.
 *
 * @package Styx_Dashboard
 */

// Block direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Conditionally enqueue the React build's JS and CSS.
 *
 * Hooked into wp_enqueue_scripts. Bails out early (no-op) unless the
 * current singular post/page contains the shortcode, so the assets
 * never load site-wide.
 *
 * @return void
 */
function styx_dashboard_enqueue_assets() {
	if ( ! styx_dashboard_current_post_has_shortcode() ) {
		return;
	}

	styx_dashboard_register_and_enqueue();
}
add_action( 'wp_enqueue_scripts', 'styx_dashboard_enqueue_assets' );

/**
 * Registers and enqueues the JS/CSS build assets found in build/assets.
 *
 * Uses filemtime() for cache busting so browsers always fetch a fresh
 * copy after a new production build is deployed, without needing to
 * bump a version number manually.
 *
 * If the build is missing, no scripts/styles are enqueued and an
 * admin notice is shown instead (see styx_dashboard_missing_build_notice()).
 *
 * @return void
 */
function styx_dashboard_register_and_enqueue() {
	$js_path  = styx_dashboard_find_build_asset( 'js' );
	$css_path = styx_dashboard_find_build_asset( 'css' );

	if ( null === $js_path || null === $css_path ) {
		add_action( 'admin_notices', 'styx_dashboard_missing_build_notice' );
		return;
	}

	$js_url  = styx_dashboard_get_asset_url( $js_path );
	$css_url = styx_dashboard_get_asset_url( $css_path );

	$js_version  = filemtime( $js_path );
	$css_version = filemtime( $css_path );

	wp_register_style(
		'styx-dashboard-app',
		$css_url,
		array(),
		$css_version
	);

	wp_register_script(
		'styx-dashboard-app',
		$js_url,
		array(),
		$js_version,
		true
	);

	// Vite builds ES modules; mark the script accordingly so it loads
	// with type="module" and behaves correctly in the browser.
	add_filter(
		'script_loader_tag',
		'styx_dashboard_add_module_type_to_script',
		10,
		2
	);

	/**
	 * Filterable data passed from PHP to the React app via a global
	 * JS object. This is the designated extension point for future
	 * settings such as REST API URL / API key.
	 *
	 * @param array $data Data exposed to the React app.
	 */
	$localized_data = apply_filters(
		'styx_dashboard_localized_data',
		array(
			'restUrl' => esc_url_raw( rest_url() ),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
			'ajaxUrl' => esc_url_raw( admin_url( 'admin-ajax.php' ) ),
			'version' => STYX_DASHBOARD_VERSION,
		)
	);

	wp_localize_script( 'styx-dashboard-app', 'StyxDashboardConfig', $localized_data );

	wp_enqueue_style( 'styx-dashboard-app' );
	wp_enqueue_script( 'styx-dashboard-app' );
}

/**
 * Adds type="module" to the Styx Dashboard script tag.
 *
 * Required because Vite outputs native ES modules.
 *
 * @param string $tag    The original <script> tag markup.
 * @param string $handle Registered script handle.
 * @return string Modified script tag markup.
 */
function styx_dashboard_add_module_type_to_script( $tag, $handle ) {
	if ( 'styx-dashboard-app' !== $handle ) {
		return $tag;
	}

	if ( false !== strpos( $tag, 'type=' ) ) {
		return $tag;
	}

	return str_replace( ' src=', ' type="module" src=', $tag );
}

/**
 * Displays an admin notice when the compiled React build is missing,
 * instead of allowing a fatal error or a broken page for site visitors.
 *
 * @return void
 */
function styx_dashboard_missing_build_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	printf(
		'<div class="notice notice-error"><p>%s</p></div>',
		esc_html__( 'Styx Dashboard: React build files not found. Please run "npm run build" in the react/ directory and copy react/dist/assets into build/assets.', 'styx-dashboard' )
	);
}

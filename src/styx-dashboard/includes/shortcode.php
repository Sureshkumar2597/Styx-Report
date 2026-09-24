<?php
/**
 * Shortcode registration for Styx Dashboard.
 *
 * Registers [styx_dashboard], which outputs the mount point div that
 * the React (Vite) application attaches itself to.
 *
 * @package Styx_Dashboard
 */

// Block direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the [styx_dashboard] shortcode.
 *
 * @return void
 */
function styx_dashboard_register_shortcode() {
	add_shortcode( STYX_DASHBOARD_SHORTCODE_TAG, 'styx_dashboard_render_shortcode' );
}
add_action( 'init', 'styx_dashboard_register_shortcode' );

/**
 * Render callback for the [styx_dashboard] shortcode.
 *
 * Outputs the React mount point. If the build is missing, a safe,
 * escaped fallback message is shown to admins only; regular visitors
 * simply see nothing rendered rather than a broken page.
 *
 * @param array  $atts    Shortcode attributes (unused currently, reserved for future use).
 * @param string $content Shortcode enclosed content (unused).
 * @return string HTML markup for the shortcode output.
 */
function styx_dashboard_render_shortcode( $atts = array(), $content = null ) {
	// Reserved for future shortcode attributes, e.g. [styx_dashboard view="reports"].
	$atts = shortcode_atts( array(), $atts, STYX_DASHBOARD_SHORTCODE_TAG );

	if ( ! styx_dashboard_build_exists() ) {
		if ( current_user_can( 'manage_options' ) ) {
			return sprintf(
				'<div class="styx-dashboard-error">%s</div>',
				esc_html__( 'React build files not found.', 'styx-dashboard' )
			);
		}

		return '';
	}

	return sprintf(
		'<div id="%s"></div>',
		esc_attr( STYX_DASHBOARD_ROOT_ID )
	);
}

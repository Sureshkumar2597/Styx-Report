<?php
/**
 * Helper functions for Styx Dashboard.
 *
 * Contains reusable, side-effect-free utility functions used across
 * the plugin (asset discovery, path/url resolution, etc.).
 *
 * @package Styx_Dashboard
 */

// Block direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Find the first built asset file matching an extension inside the
 * build/assets directory, without relying on a hardcoded filename.
 *
 * Vite outputs hashed filenames such as:
 *   index-ABCD123.js
 *   index-EFGH123.css
 *
 * This function scans the build directory and returns the newest
 * matching file (by modification time), so the plugin keeps working
 * automatically after every `npm run build` + copy, regardless of
 * the generated hash.
 *
 * @param string $extension File extension to search for, e.g. 'js' or 'css'.
 * @return string|null Absolute filesystem path to the asset, or null if none found.
 */
function styx_dashboard_find_build_asset( $extension ) {
	$extension = ltrim( (string) $extension, '.' );

	if ( ! is_dir( STYX_DASHBOARD_BUILD_DIR ) ) {
		return null;
	}

	$pattern = STYX_DASHBOARD_BUILD_DIR . '*.' . $extension;
	$files   = glob( $pattern );

	if ( empty( $files ) ) {
		return null;
	}

	// If multiple files match (e.g. leftover files from previous builds),
	// pick the most recently modified one so a fresh build always wins.
	usort(
		$files,
		function ( $a, $b ) {
			return filemtime( $b ) - filemtime( $a );
		}
	);

	return $files[0];
}

/**
 * Get the public URL for a build asset given its absolute filesystem path.
 *
 * @param string $absolute_path Absolute path returned by styx_dashboard_find_build_asset().
 * @return string Public URL to the asset.
 */
function styx_dashboard_get_asset_url( $absolute_path ) {
	$filename = basename( $absolute_path );
	return STYX_DASHBOARD_BUILD_URL . $filename;
}

/**
 * Determine whether the compiled React build (JS + CSS) is present.
 *
 * @return bool True if both the JS and CSS build files exist.
 */
function styx_dashboard_build_exists() {
	$js  = styx_dashboard_find_build_asset( 'js' );
	$css = styx_dashboard_find_build_asset( 'css' );

	return ( null !== $js && null !== $css );
}

/**
 * Check whether the current request is for a singular post/page whose
 * content contains the Styx Dashboard shortcode.
 *
 * Used to conditionally enqueue assets so they never load globally.
 *
 * @return bool
 */
function styx_dashboard_current_post_has_shortcode() {
	if ( ! is_singular() ) {
		return false;
	}

	global $post;

	if ( ! $post instanceof WP_Post ) {
		return false;
	}

	return has_shortcode( $post->post_content, STYX_DASHBOARD_SHORTCODE_TAG );
}

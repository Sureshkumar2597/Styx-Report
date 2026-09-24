import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite config for the Styx Dashboard React app.
 *
 * Output goes to react/dist. Per the deployment workflow, the
 * contents of react/dist/assets are manually copied into
 * build/assets in the WordPress plugin after every production build.
 *
 * base: './' ensures generated asset URLs are relative, since the
 * plugin serves these files from its own build/assets directory via
 * PHP-generated URLs (wp_enqueue_script/style), not from Vite's dev
 * server path assumptions.
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Keep Vite's default hashed naming (index-[hash].js/.css).
        // The WordPress plugin auto-detects files by extension via
        // glob(), so no filename coordination is required here.
        entryFileNames: 'assets/index-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/index-[hash][extname]',
      },
    },
  },
});

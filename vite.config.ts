import { defineConfig, type ProxyOptions } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The running OMERO.web stack (omero-docker). Dev-only: `vite dev` forwards the
// OMERO routes below so this page is same-origin with OMERO, as in production.
const OMERO = 'http://localhost:4080';

/**
 * Proxy options for one OMERO.web route (a fresh object per route).
 *
 * @returns Options that forward to OMERO, keep its redirects on the dev origin,
 *   and present OMERO's own origin so Django's CSRF origin check passes.
 */
function toOmero(): ProxyOptions {
  return {
    target: OMERO,
    changeOrigin: true,          // Host: localhost:4080
    autoRewrite: true,           // absolute redirects stay on the dev origin
    headers: { origin: OMERO },  // Django compares Origin with the Host it sees
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // Scan only the real entry; otherwise every .html in the tree is crawled,
  // including the graphify-out/graph.html artifacts.
  optimizeDeps: { entries: ['index.html'] },
  server: {
    proxy: {
      // The landing plugin's JSON endpoints only: /omero_crm_landing_page/
      // itself falls through to this dev app (e.g. after a login redirect).
      '^/omero_crm_landing_page/(search|portal)/': toOmero(),
      // Pages and data the app links to or embeds (gate, importer, login,
      // Quick View iviewer + its JSON API and static assets, thumbnails).
      '/omero_download_gate': toOmero(),
      '/omero_webimport': toOmero(),
      '/webclient': toOmero(),
      '/webgateway': toOmero(),
      '/iviewer': toOmero(),
      '/api': toOmero(),
      '/static': toOmero(),
    },
    fs: { strict: true },
    middlewareMode: false,
    // Unknown HTML routes fall back to index.html via Vite's default appType 'spa'.
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'static/[name]-[hash][extname]',
        chunkFileNames: 'static/[name]-[hash].js',
        entryFileNames: 'static/[name]-[hash].js',
      },
    },
  },
});

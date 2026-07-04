// Central asset URL resolver for every static file under public/assets/.
//
// This H5 gets opened in several very different contexts and each one resolves
// URLs differently. A single helper keeps every asset reference correct:
//   - Vite dev server (root-hosted)                -> /assets/...
//   - Vercel / web hosting (query-param routing)    -> ./assets/... (relative)
//   - Packaged / offline build opened via file://   -> anchored to index.html
//   - Packaged build served from a sub-directory     -> anchored, not "/assets"
//
// The trap we are avoiding: a leading-slash absolute path ("/assets/x.png")
// points at the filesystem / webview / domain ROOT, which is wrong the moment
// the app is packaged into a folder or opened from file://. In a production
// build every Vite chunk AND the copied public/assets/* live under the same
// output "assets/" directory, so in prod we anchor to the running module's URL
// (import.meta.url) instead of guessing the root.

// In prod, import.meta.url === <deploy-root>/assets/<chunk>.js, so "./" is the
// assets directory itself. In dev this value is unused (we take the DEV branch).
const PROD_ASSET_DIR = new URL("./", import.meta.url).href;

/**
 * Resolve a path that lives under public/assets/ to a URL that loads correctly
 * in dev, on the web, and inside a packaged/offline build.
 *
 * Accepts inputs with or without a leading "assets/" or "/", e.g.
 *   assetUrl("tidy/apple.png")
 *   assetUrl("/assets/tidy/apple.png")
 *   assetUrl("assets/skins/mint.png")
 */
export function assetUrl(path) {
  const clean = String(path).replace(/^\/+/, "").replace(/^assets\//, "");
  if (import.meta.env.DEV) {
    return `${import.meta.env.BASE_URL}assets/${clean}`;
  }
  return new URL(clean, PROD_ASSET_DIR).href;
}

// Convenience roots for the common asset folders.
export const TIDY_BASE = assetUrl("tidy/");
export const SKINS_BASE = assetUrl("skins/");

// Cross-platform replacement for rebuild_web.sh.
//
// `npm run build` used to call `./rebuild_web.sh`, which silently fails on
// Windows (npm runs scripts via cmd.exe, where `./foo.sh` is not
// executable) - so the compiled index.html/static never got copied into
// the Django package and OMERO.web served a broken/empty landing page.
// This Node script does the same copy and runs identically on
// Windows/macOS/Linux.

import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const pkg = join(root, "omero_crm_landing_page");
const templates = join(pkg, "templates");
const staticDir = join(pkg, "static");

if (!existsSync(join(dist, "index.html"))) {
  console.error(
    "deploy-web: dist/index.html not found - run `vite build` first."
  );
  process.exit(1);
}

console.log("Cleaning package template/static folders...");
rmSync(templates, { recursive: true, force: true });
rmSync(staticDir, { recursive: true, force: true });
mkdirSync(templates, { recursive: true });
mkdirSync(staticDir, { recursive: true });

console.log("Deploying built resources into the Django package...");
cpSync(join(dist, "index.html"), join(templates, "index.html"));
cpSync(join(dist, "static"), staticDir, { recursive: true });

console.log("deploy-web: done.");

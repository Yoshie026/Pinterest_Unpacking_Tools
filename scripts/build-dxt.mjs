#!/usr/bin/env node
/**
 * Build the Claude Desktop Extension package (.dxt).
 *
 * A .dxt is just a zip with manifest.json at the root + the runtime files
 * the MCP server needs. This script:
 *
 *   1. Verifies dist/server.js exists (run `npm run build` first if not)
 *   2. Stages a clean install of production-only deps in build/dxt/
 *   3. Copies dist/, manifest.json, package.json, README.md
 *   4. Zips into pinterest-mcp.dxt at the project root
 *
 * Output: ./pinterest-mcp.dxt
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STAGE = path.join(ROOT, "build", "dxt");
const OUT = path.join(ROOT, "pinterest-mcp.dxt");

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

async function main() {
  // 1. Sanity check — must have built first.
  if (!fs.existsSync(path.join(ROOT, "dist", "server.js"))) {
    console.error("dist/server.js not found. Run `npm run build` first.");
    process.exit(1);
  }

  // 2. Clean stage dir.
  await fsp.rm(STAGE, { recursive: true, force: true });
  await fsp.rm(OUT, { force: true });
  await fsp.mkdir(STAGE, { recursive: true });

  // 3. Copy files into stage.
  for (const entry of ["manifest.json", "package.json", "package-lock.json", "README.md"]) {
    if (fs.existsSync(path.join(ROOT, entry))) {
      await fsp.cp(path.join(ROOT, entry), path.join(STAGE, entry));
    }
  }
  await fsp.cp(path.join(ROOT, "dist"), path.join(STAGE, "dist"), { recursive: true });

  // 4. Install production-only deps inside stage. We use `npm ci --omit=dev`
  //    so the bundle has the exact deps from package-lock without devDeps.
  run("npm ci --omit=dev --ignore-scripts=false", { cwd: STAGE });

  // 5. Zip stage → .dxt. -X drops extended attrs that confuse some unzippers.
  run(`cd "${STAGE}" && zip -rXq "${OUT}" .`);

  const stats = await fsp.stat(OUT);
  const mb = (stats.size / 1024 / 1024).toFixed(1);
  console.log(`\n✓ Built ${path.relative(ROOT, OUT)} (${mb} MB)`);
  console.log(`Install: double-click in Finder, or drag onto Claude Desktop.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

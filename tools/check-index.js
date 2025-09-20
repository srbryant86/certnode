#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const manifest = require("./repo-manifest.json");
const allowEmpty = process.env.ALLOW_EMPTY === "1";

const missing = [];
const empty = [];
for (const f of manifest.required) {
  const p = path.resolve(process.cwd(), f);
  if (!fs.existsSync(p)) missing.push(f);
  else if (!allowEmpty && fs.statSync(p).size === 0) empty.push(f);
}
if (missing.length || empty.length) {
  console.error("❌ Repo check failed.");
  if (missing.length) console.error("Missing:\n" + missing.map(s => "  - " + s).join("\n"));
  if (empty.length) console.error("\nEmpty:\n" + empty.map(s => "  - " + s).join("\n"));
  process.exit(1);
} else {
  console.log("✅ Repo check passed.");
}
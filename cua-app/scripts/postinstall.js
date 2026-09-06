#!/usr/bin/env node
// Recreates the @tailwindcss symlink inside cua-app/node_modules after every
// `npm install`.  In this npm-workspaces monorepo the package is hoisted to
// the repo root, but Turbopack's PostCSS loader resolves from cua-app/ — the
// symlink bridges the gap without duplicating the install.
const { symlinkSync, existsSync, mkdirSync, lstatSync } = require("fs");
const path = require("path");

const nmDir = path.resolve(__dirname, "node_modules");
const link  = path.join(nmDir, "@tailwindcss");

// Use a RELATIVE target so the symlink works regardless of absolute path
const relTarget = "../../node_modules/@tailwindcss";

mkdirSync(nmDir, { recursive: true });

if (existsSync(link) || (function(){ try { lstatSync(link); return true; } catch(_){ return false; } }())) {
  console.log("postinstall: node_modules/@tailwindcss already present");
} else {
  symlinkSync(relTarget, link, "junction");
  console.log("postinstall: created node_modules/@tailwindcss → " + relTarget);
}

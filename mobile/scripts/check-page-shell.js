#!/usr/bin/env node
/**
 * Layout contract enforcement: every tab screen must use PageShell as root.
 * Run before commit or in CI. Exits 1 if any (tabs)/*.tsx (except _layout) lacks PageShell.
 * @see docs/FRONTEND_REFACTOR_STRATEGY.md § Screen root convention
 */
const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '..', 'app', '(tabs)');
if (!fs.existsSync(tabsDir)) {
  console.error('(tabs) directory not found');
  process.exit(1);
}

const files = fs.readdirSync(tabsDir).filter((f) => f.endsWith('.tsx') && f !== '_layout.tsx');
let failed = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(tabsDir, file), 'utf8');
  if (!content.includes('<PageShell') && !content.includes('<PageShell>')) {
    failed.push(file);
  }
}

if (failed.length > 0) {
  console.error('Layout contract: these tab screens must root with <PageShell>:', failed.join(', '));
  process.exit(1);
}
console.log('Layout contract OK: all tab screens use PageShell');

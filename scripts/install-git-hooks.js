const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const sourceHook = path.join(repoRoot, 'githooks', 'pre-commit');
const targetDir = path.join(repoRoot, '.git', 'hooks');
const targetHook = path.join(targetDir, 'pre-commit');

if (!fs.existsSync(path.join(repoRoot, '.git'))) {
  console.error('No .git directory found. Skipping hook install.');
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourceHook, targetHook);
fs.chmodSync(targetHook, 0o755);

console.log('Installed git pre-commit hook:', targetHook);


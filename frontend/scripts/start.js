#!/usr/bin/env node
// Wrapper invoked by supervisor (yarn expo start --tunnel --port 3000).
// We ignore those args and start Next.js dev server on port 3000.
const { spawn } = require('child_process');

const child = spawn(
  'npx',
  ['next', 'dev', '-p', '3000', '-H', '0.0.0.0'],
  { stdio: 'inherit', shell: false, cwd: __dirname + '/..' }
);

child.on('exit', (code) => process.exit(code));

process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));

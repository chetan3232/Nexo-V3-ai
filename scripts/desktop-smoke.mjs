import fs from 'node:fs';

const required = ['dist/index.html', 'electron/main.cjs', 'electron/preload.cjs'];
const missing = required.filter((file) => !fs.existsSync(file));

if (missing.length) {
  console.error(`Missing desktop build files: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Desktop build files are present.');

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const name = '@devlsh/logger';
const version = '3.0.1';
const scratch = mkdtempSync(join(tmpdir(), 'logger-package-'));
console.log(`Package evidence: ${scratch}`);
execFileSync('pnpm', ['pack', '--pack-destination', scratch], { cwd: root, stdio: 'inherit' });
const archives = readdirSync(scratch).filter((file) => file.endsWith('.tgz'));
assert.equal(archives.length, 1);
const archive = join(scratch, archives[0]);
const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n').sort();
assert.deepEqual(
  entries,
  [
    'package/COPYING',
    'package/README.md',
    'package/dist/index.cjs',
    'package/dist/index.cjs.map',
    'package/dist/index.d.ts',
    'package/dist/index.esm.js',
    'package/dist/index.esm.js.map',
    'package/dist/index.esm.min.js',
    'package/dist/index.esm.min.js.map',
    'package/package.json',
  ].sort(),
);
writeFileSync(
  join(scratch, 'package.json'),
  JSON.stringify({
    private: true,
    type: 'module',
    packageManager: 'pnpm@10.12.4',
    dependencies: { [name]: `file:${archive}` },
  }),
);
execFileSync('pnpm', ['install', '--offline', '--ignore-scripts', '--ignore-workspace', '--no-lockfile'], { cwd: scratch, stdio: 'inherit' });
const installed = join(scratch, 'node_modules', name);
const metadata = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
assert.equal(metadata.name, name);
assert.equal(metadata.version, version);
assert.equal(metadata.license, 'GPL-3.0-only');
assert.equal(metadata.homepage, 'https://github.com/devlsh/logger');
assert.equal(metadata.bugs.url, 'https://github.com/devlsh/logger/issues');
assert.equal(metadata.repository.url, 'git+https://github.com/devlsh/logger.git');
assert.equal(readFileSync(join(installed, 'COPYING'), 'utf8'), readFileSync(join(root, 'COPYING'), 'utf8'));
assert.match(readFileSync(join(installed, 'COPYING'), 'utf8'), /GNU GENERAL PUBLIC LICENSE/);
const behavior = `
const logger = api.createLogger({ name: 'consumer', styles: false });
logger.log('visible message');
logger.setDisabled(true);
logger.log('disabled message');
logger.setDisabled(false);
logger.log('resumed message');
`;
writeFileSync(
  join(scratch, 'consumer.cjs'),
  `const assert = require('node:assert/strict');
const api = require('${name}');
assert.ok(require.resolve('${name}').endsWith('/dist/index.cjs'));
${behavior}`,
);
writeFileSync(
  join(scratch, 'consumer.mjs'),
  `import assert from 'node:assert/strict';
import * as api from '${name}';
assert.ok(import.meta.resolve('${name}').endsWith('/dist/index.esm.js'));
${behavior}`,
);
writeFileSync(
  join(scratch, 'consumer.mts'),
  `import { createLogger, type Logger } from '${name}';
const logger: Logger = createLogger({ name: 'consumer', styles: false });
logger.log('visible message');
logger.setDisabled(true);
export { logger };
`,
);
writeFileSync(
  join(scratch, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: { strict: true, noEmit: true, target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', skipLibCheck: false },
    files: ['consumer.mts'],
  }),
);
for (const consumer of ['consumer.cjs', 'consumer.mjs']) {
  const output = execFileSync(process.execPath, [consumer], { cwd: scratch, encoding: 'utf8' });
  assert.match(output, /\[consumer\] visible message @ /);
  assert.match(output, /\[consumer\] resumed message @ /);
  assert.doesNotMatch(output, /disabled message/);
}
execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', join(scratch, 'tsconfig.json')], { cwd: scratch, stdio: 'inherit' });
console.log(`Verified ${name}@${version}: packed files, metadata, license, CJS, ESM, declarations and public behavior.`);

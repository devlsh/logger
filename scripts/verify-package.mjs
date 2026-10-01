import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const proveConsumerTimeout = process.argv[2] === '--prove-consumer-timeout';
assert.deepEqual(process.argv.slice(2), proveConsumerTimeout ? ['--prove-consumer-timeout'] : []);
const pnpmTimeout = 300000;
const compilerTimeout = 60000;
const consumerTimeout = 10000;
const cli = process.env.npm_execpath;
assert.ok(cli, 'Run through pnpm dlx --package=pnpm@7.33.7 pnpm test:package');
const pnpm = (args, cwd) => execFileSync(process.execPath, [cli, ...args], {
  cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: pnpmTimeout,
  killSignal: 'SIGKILL',
});
assert.equal(pnpm(['--version'], root).trim(), '7.33.7');
const scratch = mkdtempSync(join(tmpdir(), 'logger-package-'));
console.log(`Package evidence: ${scratch}`);

try {
  pnpm(['pack', '--pack-destination', scratch], root);
  const archives = readdirSync(scratch).filter(name => name.endsWith('.tgz'));
  assert.equal(archives.length, 1);
  writeFileSync(join(scratch, 'package.json'), JSON.stringify({
    private: true,
    type: 'module',
    dependencies: { [manifest.name]: `file:${join(scratch, archives[0])}` },
  }, null, 2));
  pnpm(['install', '--ignore-scripts'], scratch);
  const installed = join(scratch, 'node_modules', manifest.name);
  const packed = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
  assert.equal(packed.name, '@devlsh/logger');
  assert.equal(packed.version, '1.1.0');
  assert.equal(packed.main, './build/index.mjs');
  assert.equal(packed.types, './build/index.d.ts');
  assert.equal(packed.license, 'GPL-3.0-only');
  assert.equal(readFileSync(join(installed, 'LICENSE'), 'utf8'), readFileSync(join(root, 'LICENSE'), 'utf8'));
  assert.equal(createHash('sha256').update(readFileSync(join(installed, packed.main))).digest('hex'),
    'd6b38072a3839a36a764914de89cfa99452be0e66adcacad1de0eac719a55cb4',
    'Packed runtime must remain byte-identical to immutable @evilkiwi/logger@1.1.0');

  writeFileSync(join(scratch, 'consumer.ts'), `
import {
  createLogger, useLogger, group, groupCollapsed, groupEnd,
  debug, log, info, error, print, setNamespace, setStyled,
  namespace, styled, PrintLevel,
} from '@devlsh/logger';
import type {
  Logger, LoggerOptions, Namespace, PrintOptions, LoggerFunction,
} from '@devlsh/logger';

const options: LoggerOptions = { name: 'INSTANCE', color: '#123456' };
const scope: Namespace = { name: 'NAMESPACE', color: '#654321' };
const logger: Logger = createLogger(options);
const shared: Omit<Logger, 'useLogger'> = useLogger();
const local: Omit<Logger, 'useLogger'> = logger.useLogger();
const fn: LoggerFunction = logger.log;
const disabled: boolean = logger.disabled;
const currentScope: Namespace = namespace;
const currentStyle: boolean = styled;
const payload: PrintOptions = { level: PrintLevel.Log, message: 'DIRECT', args: ['ARG'] };
void [disabled, currentScope, currentStyle, PrintLevel.Store];
setNamespace(scope);
setStyled(false);
fn('VISIBLE', 'ARG');
logger.setDisabled(true);
logger.log('HIDDEN');
local.info('HIDDEN');
logger.group('HIDDEN', () => log('HIDDEN'), true, PrintLevel.Info, options);
logger.groupCollapsed('HIDDEN', () => log('HIDDEN'));
logger.setDisabled(false);
logger.info('REENABLED');
local.debug('LOCAL');
logger.error('LOCAL_ERROR');
logger.group('GROUP', () => logger.log('CHILD'), true, PrintLevel.Info, options);
logger.groupCollapsed('COLLAPSED', () => logger.info('NESTED'));
logger.group('MANUAL');
logger.groupEnd();
shared.log('SHARED');
group('GLOBAL_GROUP', () => info('GLOBAL_CHILD'), false, PrintLevel.Debug, options);
groupCollapsed('GLOBAL_COLLAPSED');
groupEnd();
debug('GLOBAL_DEBUG');
log('GLOBAL_LOG');
info('GLOBAL_INFO');
error('GLOBAL_ERROR');
print(payload);
setStyled(true);
logger.debug('STYLED');
setNamespace({ name: '' });
setStyled(false);
logger.log('RESET');
${proveConsumerTimeout ? "console.log('DEADLINE_FIXTURE_READY'); setInterval(() => {}, 1000);" : ''}
`);
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'),
    '--strict', '--skipLibCheck', 'false', '--module', 'es2022',
    '--moduleResolution', 'node', '--target', 'es2022', 'consumer.ts',
  ], { cwd: scratch, stdio: 'pipe', timeout: compilerTimeout, killSignal: 'SIGKILL' });
  const runtime = spawnSync(process.execPath, ['consumer.js'], {
    cwd: scratch, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    timeout: consumerTimeout,
    killSignal: 'SIGKILL',
  });
  const { stdout, stderr } = runtime;
  writeFileSync(join(scratch, 'stdout.txt'), stdout);
  writeFileSync(join(scratch, 'stderr.txt'), stderr);
  if (runtime.error) throw Object.assign(runtime.error, {
    stdout, stderr, signal: runtime.signal, timeout: consumerTimeout,
  });
  assert.equal(runtime.status, 0, stderr);
  assert.match(stderr, /\[NAMESPACE\] \[INSTANCE\] LOCAL_ERROR/);
  assert.match(stderr, /\[NAMESPACE\] GLOBAL_ERROR/);
  assert.doesNotMatch(stderr, /HIDDEN/);
  assert.doesNotMatch(stdout, /HIDDEN/);
  for (const marker of [
    'VISIBLE', 'ARG', 'REENABLED', 'LOCAL', 'GROUP', 'CHILD', 'COLLAPSED',
    'NESTED', 'MANUAL', 'SHARED', 'GLOBAL_GROUP', 'GLOBAL_CHILD',
    'GLOBAL_COLLAPSED', 'GLOBAL_DEBUG', 'GLOBAL_LOG', 'GLOBAL_INFO', 'DIRECT',
    'STYLED', 'RESET',
  ]) assert.match(stdout, new RegExp(marker));
  assert.match(stdout, /\[NAMESPACE\] \[INSTANCE\] REENABLED @ \d{2}:\d{2}:\d{2}\.\d+/);
  assert.match(stdout, /\[NAMESPACE\] \[INSTANCE\] GROUP/);
  assert.match(stdout, /\[NAMESPACE\] VISIBLE/);
  assert.match(stdout, /\[NAMESPACE\] \[INSTANCE\] STYLED/);
  assert.doesNotMatch(stdout.split('\n').find(line => line.includes('RESET')) ?? '', /NAMESPACE/);
  console.log('Packed ESM consumer, strict declarations, and native console behavior passed.');
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
}

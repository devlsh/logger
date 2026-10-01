<div align="center">
  <a href="https://www.npmjs.com/package/@devlsh/logger" target="_blank">
    <img src="https://img.shields.io/npm/v/@devlsh/logger/legacy?style=flat-square" alt="NPM" />
  </a>
  <a href="https://discord.gg/3S6AKZ2GR9" target="_blank">
    <img src="https://img.shields.io/discord/1000565079789535324?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
  </a>
  <img src="https://img.shields.io/npm/l/@devlsh/logger?style=flat-square" alt="GPL-3.0-only" />
  <h3>Pretty-print utility logger for JS/TS</h3>
</div>

`@devlsh/logger` 1.1.0 preserves the legacy `@evilkiwi/logger` API with repaired declaration imports. It provides a small interface on top of the existing `console` API and includes things such as:

- Automatic code highlighting via \`template literal\` syntax
- High-precision timestamps
- Namespacing and Instanced Loggers
- Enable/disable logging at runtime

## Installation

Install this legacy version explicitly, rather than the current major version:

```bash
yarn add @devlsh/logger@1.1.0

# or

npm install @devlsh/logger@1.1.0
```

## Usage

By default, `@devlsh/logger` exports traditional logging methods using a shared logger instance. For example:

```typescript
import { debug, error } from '@devlsh/logger';

try {
  await something();
  debug('success!');
} catch (e) {
  error('failure!', e);
}
```

However, if you'd like to add namespaces and use multiple logger instances within your application, you can instead instantiate a new Logger:

```typescript
import { createLogger } from '@devlsh/logger';

const loggerA = createLogger({
  name: 'module-a',
  color: '#FF0000',
});
const loggerB = createLogger({
  name: 'module-b',
  color: '#00FF00',
});

loggerA.debug('hello world A!');
loggerA.error('hello world B!');
```

You can also set a global namespace for all Logger instances created via your App. This can be useful if your console displays output from multiple systems, for example an Electron App or when using iFrames.

```typescript
import { setNamespace } from '@devlsh/logger';

setNamespace({
  name: 'website',
  color: '#0000FF',
});
```

This will be pre-pended to all logging that passes through `@devlsh/logger`, regardless of whether it was instanced.

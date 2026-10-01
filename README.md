<div align="center">
  <a href="https://www.npmjs.com/package/@devlsh/logger" target="_blank">
    <img src="https://img.shields.io/npm/v/@devlsh/logger?style=flat-square" alt="NPM" />
  </a>
  <img src="https://img.shields.io/npm/l/@devlsh/logger?style=flat-square" alt="GPL-3.0-only" />
  <h3>Pretty-print utility logger for browsers.</h3>
</div>

`@devlsh/logger` provides a small interface on top of the existing `console` browser API, adding:

- Automatic code highlighting via \`template literal\` syntax.
- Instanced and side-effect-free loggers.
- Enable/disable logging at runtime.
- High-precision timestamps.
- Customizeable CSS styling.
- Zero-dependencies.

## Installation

```bash
npm install @devlsh/logger
```

## Usage

See the [example folder](https://github.com/devlsh/logger/tree/main/example) for a working example.

```typescript
import { createLogger } from '@devlsh/logger';

const logger = createLogger({
  // Optional - a prefix to prepend to all messages from this logger.
  name: 'my-logger',

  // Optional - a color to use for the `name` prefix, can be a hex string or a number (i.e. 0xff0000).
  color: '#FF0000',

  // Optional - a set of CSS styles to use for the logger, or `false` to disable styling. Will default to baked-in styles.
  styles: false,
});

logger.debug('hello world!');
```

### Customizing Styles

The `styles` option when creating a logger can be used to customize the CSS styles used for the logger, or to disable styling entirely (useful for environments like Capacitor, where the styling floods things like Xcode debugger).

```typescript
import { createLogger, styles } from '@devlsh/logger';

const logger = createLogger({
  styles: {
    // Override the base styles.
    base: ['font-size: 20px;', 'font-weight: bold;', 'font-family: \'Comic Sans\';'],

    // Customize the code styling, including the baked-in styles.
    code: [...styles.code, 'font-size: 10px;', 'font-style: italic;'],
  },
});
```

### Supported Methods

The logger attempts to emulate the `console` API as closely as possible - if there's anything missing that you'd like to see, please open an issue or PR!

- `debug`
- `log`
- `info`
- `warn`
- `error`
- `group`
- `groupCollapsed`
- `groupEnd`

### Grouping

The `group` and `groupCollapsed` methods are used to group messages together, and can be used to create collapsible sections in the console. `@devlsh/logger` supports these methods as intended (via calling `groupEnd`) - but also provides an optional context closure, which will automatically call `groupEnd`.

```typescript
import { createLogger } from '@devlsh/logger';

const logger = createLogger();

logger.group('hello world', () => {
  logger.info('nested info message');
  logger.debug('nested debug message');
});

// or

logger.group('hello world 2');
logger.info('nested info message');
logger.debug('nested debug message');
logger.groupEnd();
```

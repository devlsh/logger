<template>
  <h1>Open Devtools!</h1>
</template>

<script lang="ts" setup>
import { createLogger, styles } from '@devlsh/logger';

const logger1 = createLogger({
  name: 'logger1',
  color: '#FF0000',
});
const logger2 = createLogger({
  name: 'logger2',
});
const logger3 = createLogger({
  styles: false,
});
const logger4 = createLogger({
  name: 'logger4',
  color: 0x00ff00,
  styles: {
    base: ['font-size: 20px;', 'font-weight: bold;', "font-family: 'Comic Sans';"],
    code: [...styles.code, 'font-size: 10px;', 'font-style: italic;'],
  },
});

logger1.debug('debug message');
logger2.info('info message');
logger3.log('log message');
logger1.warn('warn message');
logger2.info(`code \`${'highlighting'}\` syntax`);
logger1.error('random error');
logger2.groupCollapsed('collapsed group', () => {
  logger2.info('nested info message');
  logger2.debug('nested debug message');
});
logger1.group('regular group', () => {
  logger1.info('nested info message');
  logger1.debug('nested debug message');
});
logger1.debug('attaching regular primitives/complex types', 1, 'hello', true, null, { hello: 'world' });
logger4.debug('custom `css` styles');
</script>

import type { Logger, LoggerOptions, Namespace, PrintOptions } from '../types';
import { timestamp } from '../helpers';
import { PrintLevel } from '../types';
import { base, code } from './styles';

export let namespace: Namespace = { name: '' };
export let styled = true;

export const setNamespace = (newNamespace: Namespace) => namespace = newNamespace;
export const setStyled = (isStyled: boolean) => styled = isStyled;

export const print = (opts: PrintOptions) => {
  const localStyle = `${base} ${opts.color ? opts.color : ''}`;
  const styles: string[] = [localStyle];
  const level = opts.call ?? `${opts.level}`;
  const startStyle = styled ? '%c' : '';
  const codeRegex = /(`([^`]*)`)+/g;
  let text = opts.message;
  let namespacePrefix = '';
  let loggerPrefix = '';

  if (opts.prefix && opts.prefix.name) {
    loggerPrefix = `${startStyle}[${opts.prefix.name}] `;
    styles.unshift(opts.prefix.color ? `color: ${opts.prefix.color};` : localStyle);
  }

  if (namespace.name.length > 0) {
    namespacePrefix = `${startStyle}[${namespace.name}] `;
    styles.unshift(namespace.color ? `color: ${namespace.color};` : localStyle);
  }

  text = `${namespacePrefix}${loggerPrefix}${startStyle}${text} @ ${timestamp()}`;

  const total = (text.match(codeRegex) ?? []).length;

  for (let i = 0; i < total; i++) {
    styles.push(code, localStyle);
  }

  text = text.replace(codeRegex, `${startStyle}$2${startStyle}`);

  (console as any)[level](text, ...(styled ? styles : []), ...(opts.args ?? []));
};

export const createLogger = (options: LoggerOptions = {}): Logger => {
  const setDisabled = (isDisabled: boolean) => disabled = isDisabled;
  let disabled = false;

  const group = (message: string, context?: () => void, collapsed = false, level?: PrintLevel, prefix?: LoggerOptions) => {
    if (disabled) {
      return;
    }

    print({
      level: level ?? PrintLevel.Log,
      message,
      prefix,
      call: collapsed ? 'groupCollapsed' : 'group',
    });

    if (context) {
      context();
      groupEnd();
    }
  };

  const groupCollapsed = (message: string, context?: () => void) => {
    if (disabled) {
      return;
    }

    group(message, context, true, undefined, options);
  };

  const groupEnd = () => {
    if (disabled) {
      return;
    }

    console.groupEnd();
  };

  const debug = (message: string, ...args: unknown[]) => {
    if (disabled) {
      return;
    }

    print({
      level: PrintLevel.Debug,
      prefix: options,
      message,
      args,
    });
  };

  const log = (message: string, ...args: unknown[]) => {
    if (disabled) {
      return;
    }

    print({
      level: PrintLevel.Log,
      message,
      args,
    });
  };

  const info = (message: string, ...args: unknown[]) => {
    if (disabled) {
      return;
    }

    print({
      level: PrintLevel.Info,
      prefix: options,
      message,
      args,
    });
  };

  const error = (message: string, ...args: unknown[]) => {
    if (disabled) {
      return;
    }

    print({
      level: PrintLevel.Error,
      prefix: options,
      message,
      args,
      color: '#FFFFFF',
    });
  };

  const logger: Omit<Logger, 'useLogger'> = {
    group,
    groupCollapsed,
    groupEnd,
    debug,
    log,
    info,
    error,
    setDisabled,
    disabled,
  };

  function useLogger() {
    return logger;
  }

  return {
    ...logger,
    useLogger,
  };
};

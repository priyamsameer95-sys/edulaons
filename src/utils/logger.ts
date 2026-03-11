/**
 * Centralized logging utility
 * Provides consistent logging with environment-based control
 */

const IS_DEV = import.meta.env.DEV;

export const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (...args: any[]) => {
    // Always log for debugging (temporarily)
    console.log(...args);
  },
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (...args: any[]) => {
    if (IS_DEV) console.warn(...args);
  },
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (...args: any[]) => {
    if (IS_DEV) console.debug(...args);
  },
  
  group: (label: string) => {
    if (IS_DEV) console.group(label);
  },
  
  groupEnd: () => {
    if (IS_DEV) console.groupEnd();
  },
} as const;

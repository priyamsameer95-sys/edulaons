/**
 * Centralized logging utility
 * Provides consistent logging with environment-based control
 */

const IS_DEV = import.meta.env.DEV;

export const logger = {
  info: (...args: any[]) => {
    if (IS_DEV) console.log(...args);
  },
  
  warn: (...args: any[]) => {
    if (IS_DEV) console.warn(...args);
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
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

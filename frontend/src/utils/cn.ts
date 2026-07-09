import { clsx, type ClassValue } from 'clsx';

/**
 * Combines conditional class names. Thin wrapper around clsx so call
 * sites don't need to import clsx directly everywhere.
 *
 *   cn('btn', isActive && 'btn-active', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

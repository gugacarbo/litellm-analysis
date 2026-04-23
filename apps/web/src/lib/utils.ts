import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a color string to uppercase hex format (#RRGGBB or #RRGGBBAA).
 * Returns empty string for invalid input.
 */
export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (!match) return '';
  return `#${match[1].toUpperCase()}`;
}

/**
 * Utility functions for formatting numbers, dates, and text in the BookShelf application.
 */

/**
 * Formats large review / reader counts into clean compact strings (e.g. 5.4M, 570K, 12K, 850).
 */
export function formatCompactNumber(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return '0';
  if (num === 0) return '0';
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

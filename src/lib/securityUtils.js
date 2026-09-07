/**
 * Security & Sanitization Utilities
 */

/**
 * Sanitize plain text strings by trimming and stripping HTML tags
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .trim();
}

/**
 * Validate and sanitize URLs (prevent javascript: or data: exploits)
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch (e) {
    // If not a valid absolute URL, check if it's a relative path starting with '/'
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }
  }
  return '';
}

/**
 * Sanitize and validate email format
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(clean) ? clean : '';
}

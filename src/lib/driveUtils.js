// Utility to convert Google Drive share links and image URLs to embeddable display URLs

/**
 * Extract Google Drive File ID from various link formats:
 * - https://drive.google.com/file/d/1A2B3C4D.../view?usp=sharing
 * - https://drive.google.com/open?id=1A2B3C4D...
 * - https://drive.google.com/uc?id=1A2B3C4D...
 * - https://drive.google.com/thumbnail?id=1A2B3C4D...
 */
export function extractGoogleDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /d/FILE_ID/
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (matchD && matchD[1]) return matchD[1];

  // Pattern 2: id=FILE_ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (matchId && matchId[1]) return matchId[1];

  return null;
}

/**
 * Format any link into a direct displayable image URL.
 * Supports Google Drive links, direct image URLs, and data URLs.
 */
export function formatImageDisplayUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    // lh3.googleusercontent.com/d/ID is Google's direct CDN proxy for Drive files
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  return trimmed;
}

/**
 * Check if a URL is a Google Drive link
 */
export function isGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /drive\.google\.com/.test(url);
}

/**
 * In-App Browser Utilities for ICIT Workspace
 * Detects embedded WebViews (LINE, Facebook, Messenger, Instagram, etc.)
 * and provides automatic breakout / seamless navigation to native system browsers (Chrome / Safari).
 */

/**
 * Check if the current browser environment is an In-App Browser (WebView)
 */
export function isInAppBrowser() {
  if (typeof window === 'undefined' || !navigator?.userAgent) return false;
  const ua = navigator.userAgent || '';
  
  // LINE app
  if (/Line\//i.test(ua)) return true;

  // Facebook & Messenger
  if (/FBAN|FBAV|FB_IAB|FBSS/i.test(ua)) return true;

  // Instagram
  if (/Instagram/i.test(ua)) return true;

  // Twitter / X
  if (/Twitter/i.test(ua)) return true;

  // WeChat / MicroMessenger
  if (/MicroMessenger/i.test(ua)) return true;

  // TikTok / ByteDance
  if (/musical_ly|BytedanceWebview/i.test(ua)) return true;

  // Android WebView indicators
  if (/\bwv\b/i.test(ua) || (/\bVersion\/[0-9.]+/i.test(ua) && /\bChrome\/[0-9.]+/i.test(ua) && !/\bChrome\/[.0-9]+ Mobile/i.test(ua))) {
    return true;
  }

  return false;
}

/**
 * Detect specifically if user is inside the LINE In-App Browser
 */
export function isLineBrowser() {
  if (typeof window === 'undefined' || !navigator?.userAgent) return false;
  return /Line\//i.test(navigator.userAgent || '');
}

/**
 * Detect Android OS
 */
export function isAndroid() {
  if (typeof window === 'undefined' || !navigator?.userAgent) return false;
  return /Android/i.test(navigator.userAgent || '');
}

/**
 * Detect iOS (iPhone / iPad / iPod)
 */
export function isIOS() {
  if (typeof window === 'undefined' || !navigator?.userAgent) return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Helper to append openExternalBrowser=1 to any URL string
 * Preserves existing hash, query parameters, and origin.
 */
export function appendOpenExternalBrowser(urlStr) {
  if (!urlStr) return '';
  try {
    const isRelative = urlStr.startsWith('/');
    const dummyBase = 'https://icitworkspace.internal';
    const parsed = new URL(urlStr, dummyBase);

    if (!parsed.searchParams.has('openExternalBrowser')) {
      parsed.searchParams.set('openExternalBrowser', '1');
    }

    if (isRelative) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
    return parsed.toString();
  } catch {
    if (urlStr.includes('openExternalBrowser=1')) return urlStr;
    const hashSplit = urlStr.split('#');
    const base = hashSplit[0];
    const hash = hashSplit[1] ? `#${hashSplit[1]}` : '';
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}openExternalBrowser=1${hash}`;
  }
}

/**
 * Navigate to external browser automatically
 * 1. LINE: appending ?openExternalBrowser=1 causes LINE to invoke external Safari/Chrome
 * 2. Android (FB / IG / generic): launch Google Chrome directly via intent://
 * 3. iOS: trigger navigation or fallback to openExternalBrowser=1
 */
export function navigateToExternalBrowser(targetUrl) {
  if (typeof window === 'undefined') return false;
  const currentUrl = targetUrl || window.location.href;

  // 1. In LINE app (both iOS and Android)
  if (isLineBrowser()) {
    const urlWithParam = appendOpenExternalBrowser(currentUrl);
    window.location.href = urlWithParam;
    return true;
  }

  // 2. On Android devices in other in-app browsers (Facebook, Instagram, etc.)
  if (isAndroid()) {
    try {
      const parsed = new URL(currentUrl);
      const hostPath = parsed.host + parsed.pathname + parsed.search + parsed.hash;
      const intentUrl = `intent://${hostPath}#Intent;scheme=https;package=com.android.chrome;end;`;
      window.location.href = intentUrl;
      return true;
    } catch {
      // Fallback below
    }
  }

  // 3. Fallback / iOS in Facebook or Instagram
  const urlWithParam = appendOpenExternalBrowser(currentUrl);
  window.location.href = urlWithParam;
  return true;
}

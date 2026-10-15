/**
 * Geo-based Language Detection
 * 
 * Automatically detects user's location by IP and sets appropriate language:
 * - China (CN), Taiwan (TW) → Chinese (zh)
 * - Japan (JP) → Japanese (ja)
 * - Other regions → English (en)
 */

import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './i18n';

const SESSION_KEY = 'geoLanguageDetected';

// Storage can throw (private mode, blocked site data); treat that as "no value".
function safeGet<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

function hasStoredPreference(): boolean {
  const stored = safeGet(() => localStorage.getItem(LANGUAGE_STORAGE_KEY));
  return !!stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored);
}

let resolveLanguageReady: () => void = () => {};
/**
 * Resolves once the initial language has been settled (stored preference, URL prefix or geo-detection).
 * Routes without a language prefix wait for this before redirecting to /:lang/..., so they don't lock in
 * the English default before detection finishes.
 */
export const languageReady = new Promise<void>((resolve) => {
  resolveLanguageReady = resolve;
});
export const markLanguageReady = () => resolveLanguageReady();

/** Language prefix of a path such as /zh/blog/xxx, or null when the path has none. */
export function getUrlLanguage(pathname: string): (typeof SUPPORTED_LANGUAGES)[number] | null {
  const match = pathname.match(/^\/(en|zh|ja)(\/|$)/);
  return match ? (match[1] as (typeof SUPPORTED_LANGUAGES)[number]) : null;
}

interface GeoResponse {
  country_code?: string;
  country?: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  'CN': 'zh', // China (Mainland)
  'TW': 'zh', // Taiwan
  'HK': 'zh', // Hong Kong
  'MO': 'zh', // Macau
  'SG': 'zh', // Singapore (has Chinese speakers)
  'JP': 'ja', // Japan
};

/**
 * Fetch user's country code based on IP address
 * Uses free ipapi.co API (no API key required, 1000 requests/day limit)
 */
async function fetchCountryCode(): Promise<string | null> {
  try {
    // Try primary API: ipapi.co (simple and reliable)
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    
    if (response.ok) {
      const data: GeoResponse = await response.json();
      return data.country_code || null;
    }
  } catch (error) {
    console.warn('[GeoLanguage] Primary API failed:', error);
  }

  // Note: ip-api.com's free tier is HTTP-only, which browsers block as mixed content on HTTPS pages,
  // so there is no secondary provider here.

  return null;
}

/**
 * Detect and set appropriate language based on user's IP location
 * @returns Detected language code or null if detection failed
 */
export async function detectAndSetLanguage(): Promise<string | null> {
  // If user has manually set a language (stored in localStorage), respect that
  if (hasStoredPreference()) {
    return null; // Don't override user preference (already applied by i18n init)
  }

  // Check if we've already detected geo language in this session
  const sessionGeoLang = safeGet(() => sessionStorage.getItem(SESSION_KEY));
  if (sessionGeoLang) {
    // Re-apply on reload: i18n starts in English, so returning null here would drop the detected language
    return sessionGeoLang;
  }

  try {
    const countryCode = await fetchCountryCode();

    // The user may have switched language manually while the request was in flight
    if (hasStoredPreference()) return null;

    if (countryCode) {
      const detectedLanguage = LANGUAGE_MAP[countryCode] || 'en';
      
      // Mark as detected in this session to avoid repeated API calls
      safeGet(() => sessionStorage.setItem(SESSION_KEY, detectedLanguage));
      
      return detectedLanguage;
    }
  } catch (error) {
    console.warn('[GeoLanguage] Failed to detect language:', error);
  }

  // Default to English if detection fails
  safeGet(() => sessionStorage.setItem(SESSION_KEY, 'en'));
  return 'en';
}

/**
 * Check if user is from China/Taiwan/Japan for specific features
 */
export async function isFromCJKRegion(): Promise<boolean> {
  const storedLanguage = safeGet(() => localStorage.getItem(LANGUAGE_STORAGE_KEY));
  if (['zh', 'ja'].includes(storedLanguage || '')) {
    return true;
  }

  try {
    const countryCode = await fetchCountryCode();
    return countryCode ? ['CN', 'TW', 'HK', 'MO', 'JP'].includes(countryCode) : false;
  } catch {
    return false;
  }
}


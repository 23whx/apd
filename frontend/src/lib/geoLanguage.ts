/**
 * Geo-based Language Detection
 * 
 * Automatically detects user's location by IP and sets appropriate language:
 * - China (CN), Taiwan (TW) → Chinese (zh)
 * - Japan (JP) → Japanese (ja)
 * - Other regions → English (en)
 */

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
      console.log('[GeoLanguage] Detected country:', data.country_code, data.country);
      return data.country_code || null;
    }
  } catch (error) {
    console.warn('[GeoLanguage] Primary API failed:', error);
  }

  // Fallback: Try ip-api.com (free, no API key, 45 requests/minute)
  try {
    const response = await fetch('http://ip-api.com/json/', {
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data: { countryCode?: string; country?: string } = await response.json();
      console.log('[GeoLanguage] Detected country (fallback):', data.countryCode, data.country);
      return data.countryCode || null;
    }
  } catch (error) {
    console.warn('[GeoLanguage] Fallback API failed:', error);
  }

  return null;
}

/**
 * Detect and set appropriate language based on user's IP location
 * @returns Detected language code or null if detection failed
 */
export async function detectAndSetLanguage(): Promise<string | null> {
  // If user has manually set a language (stored in localStorage), respect that
  const storedLanguage = localStorage.getItem('i18nextLng');
  if (storedLanguage && ['en', 'zh', 'ja'].includes(storedLanguage)) {
    console.log('[GeoLanguage] Using stored language preference:', storedLanguage);
    return null; // Don't override user preference
  }

  // Check if we've already detected geo language in this session
  const sessionGeoLang = sessionStorage.getItem('geoLanguageDetected');
  if (sessionGeoLang) {
    console.log('[GeoLanguage] Already detected in this session:', sessionGeoLang);
    return null; // Already detected
  }

  try {
    const countryCode = await fetchCountryCode();
    
    if (countryCode) {
      const detectedLanguage = LANGUAGE_MAP[countryCode] || 'en';
      
      // Mark as detected in this session to avoid repeated API calls
      sessionStorage.setItem('geoLanguageDetected', detectedLanguage);
      
      console.log('[GeoLanguage] Setting language based on location:', detectedLanguage);
      return detectedLanguage;
    }
  } catch (error) {
    console.warn('[GeoLanguage] Failed to detect language:', error);
  }

  // Default to English if detection fails
  sessionStorage.setItem('geoLanguageDetected', 'en');
  return 'en';
}

/**
 * Check if user is from China/Taiwan/Japan for specific features
 */
export async function isFromCJKRegion(): Promise<boolean> {
  const storedLanguage = localStorage.getItem('i18nextLng');
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


import api from './api';

export const ALLOWED_EVENT_TYPES = [
  'page_view',
  'section_view',
  'scroll_depth',
  'project_view',
  'project_github_click',
  'project_live_click',
  'certificate_view',
  'resume_view',
  'resume_download_request',
  'resume_download_approved',
  'resume_download_completed',
  'github_click',
  'linkedin_click',
  'email_click',
  'contact_form_start',
  'contact_form_submit'
];

const SESSION_STORAGE_KEY = 'saumya_portfolio_sid';

/**
 * Generate or retrieve an anonymous session identifier.
 * Uses cryptographically strong random UUID where available.
 * Absolutely NO personally identifiable information (PII) is included or inferred.
 */
export function getSessionId() {
  if (typeof window === 'undefined') {
    return 'ssr-anonymous-session';
  }

  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = localStorage.getItem(SESSION_STORAGE_KEY);
    }
    if (sid && sid.length >= 10 && sid.length <= 128) {
      return sid;
    }

    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      sid = window.crypto.randomUUID();
    } else {
      sid = 'sid-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now().toString(36);
    }

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
      localStorage.setItem(SESSION_STORAGE_KEY, sid);
    } catch {
      // Storage access may fail in incognito/restricted mode — fallback gracefully
    }

    return sid;
  } catch {
    return 'anon-' + Date.now();
  }
}

/**
 * Simple, privacy-friendly technical classification.
 * No invasive fingerprinting, no hardware serials, no canvas probing.
 */
export function getTechnicalContext() {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'unknown',
      browser: 'unknown',
      operatingSystem: 'unknown',
      screenWidth: 1920,
      screenHeight: 1080,
      referrer: '',
      source: 'direct'
    };
  }

  const ua = navigator.userAgent || '';

  // 1. Device Type
  let deviceType = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    deviceType = 'mobile';
  }

  // 2. Browser
  let browser = 'Other';
  if (/edg([ea]|ios)?\/([0-9.]+)/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr\/([0-9.]+)/i.test(ua)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  }

  // 3. Operating System
  let operatingSystem = 'Other';
  if (/windows/i.test(ua)) operatingSystem = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) operatingSystem = 'macOS';
  else if (/android/i.test(ua)) operatingSystem = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) operatingSystem = 'iOS';
  else if (/linux/i.test(ua)) operatingSystem = 'Linux';

  // 4. Referrer & Source Classification
  const referrer = document.referrer ? document.referrer.slice(0, 500) : '';
  let source = 'direct';

  if (referrer) {
    try {
      const refHost = new URL(referrer).hostname.toLowerCase();
      const currentHost = window.location.hostname.toLowerCase();

      if (refHost === currentHost) {
        source = 'internal';
      } else if (
        /google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\.|baidu\.|yandex\./.test(refHost)
      ) {
        source = 'search';
      } else if (
        /github\.com|linkedin\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|reddit\.com|t\.co/.test(
          refHost
        )
      ) {
        source = 'social';
      } else {
        source = 'referral';
      }
    } catch {
      source = 'referral';
    }
  }

  // 5. Safe UTM Parameter Preservation
  let utmMetadata = {};
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    if (utmSource) utmMetadata.utm_source = utmSource.slice(0, 100);
    if (utmMedium) utmMetadata.utm_medium = utmMedium.slice(0, 100);
    if (utmCampaign) utmMetadata.utm_campaign = utmCampaign.slice(0, 100);
  } catch {
    // URL parsing notice ignored
  }

  return {
    deviceType,
    browser,
    operatingSystem,
    screenWidth: window.innerWidth || window.screen?.width || null,
    screenHeight: window.innerHeight || window.screen?.height || null,
    referrer,
    source,
    utmMetadata
  };
}

/**
 * Core event tracking method.
 * Guaranteed to be non-blocking and fail-silent: failure must NEVER disrupt user interaction.
 */
export async function trackEvent(eventType, eventData = {}) {
  try {
    if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
      console.warn(`[Analytics] Ignored unregistered event type: ${eventType}`);
      return null;
    }

    const sessionId = getSessionId();
    const technical = getTechnicalContext();
    const page = eventData.page || (typeof window !== 'undefined' ? window.location.pathname : '/');

    // Combine metadata safely
    const metadata = {
      ...(technical.utmMetadata && Object.keys(technical.utmMetadata).length > 0
        ? { utm: technical.utmMetadata }
        : {}),
      ...(eventData.metadata || {})
    };

    const payload = {
      eventType,
      sessionId,
      page,
      section: eventData.section || null,
      metadata,
      deviceType: technical.deviceType,
      browser: technical.browser,
      operatingSystem: technical.operatingSystem,
      screenWidth: technical.screenWidth,
      screenHeight: technical.screenHeight,
      referrer: technical.referrer,
      source: technical.source
    };

    const res = await api.post('/analytics/events', payload);
    return res?.data || null;
  } catch (err) {
    // Fail silently — never bubble analytics errors to visitor UI
    return null;
  }
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

export const analyticsService = {
  getSessionId,
  trackEvent,

  trackPageView(page, metadata = {}) {
    return trackEvent('page_view', { page, metadata });
  },

  trackSectionView(section, metadata = {}) {
    return trackEvent('section_view', { section, metadata });
  },

  trackScrollDepth(percentage) {
    return trackEvent('scroll_depth', { metadata: { percentage } });
  },

  trackProjectView(projectId, projectTitle) {
    return trackEvent('project_view', {
      section: 'projects',
      metadata: { projectId: String(projectId), projectTitle: String(projectTitle || '') }
    });
  },

  trackProjectGithubClick(projectId, projectTitle) {
    return trackEvent('project_github_click', {
      section: 'projects',
      metadata: { projectId: String(projectId), projectTitle: String(projectTitle || '') }
    });
  },

  trackProjectLiveClick(projectId, projectTitle) {
    return trackEvent('project_live_click', {
      section: 'projects',
      metadata: { projectId: String(projectId), projectTitle: String(projectTitle || '') }
    });
  },

  trackCertificateView(certId, certName) {
    return trackEvent('certificate_view', {
      section: 'certifications',
      metadata: { certId: String(certId), certName: String(certName || '') }
    });
  },

  trackResumeView() {
    return trackEvent('resume_view', { page: '/resume', section: 'resume' });
  },

  trackResumeDownloadRequest(requestId) {
    return trackEvent('resume_download_request', {
      page: '/resume',
      section: 'resume',
      metadata: { requestId: String(requestId) }
    });
  },

  trackResumeDownloadCompleted(requestId) {
    return trackEvent('resume_download_completed', {
      page: window?.location?.pathname || '/resume/download',
      section: 'resume',
      metadata: { requestId: requestId ? String(requestId) : undefined }
    });
  },

  trackLinkClick(linkType, metadata = {}) {
    if (['github_click', 'linkedin_click', 'email_click'].includes(linkType)) {
      return trackEvent(linkType, { metadata });
    }
  },

  trackContactFormStart() {
    return trackEvent('contact_form_start', { section: 'contact' });
  },

  trackContactFormSubmit() {
    return trackEvent('contact_form_submit', { section: 'contact' });
  }
};

export default analyticsService;

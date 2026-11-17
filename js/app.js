/**
 * js/app.js
 * ------------------------------------------------------------
 * '어두운 밤숲과 5개의 촛불' 메인 애플리케이션 컨트롤러
 * - 한글 PDF encodeURI(NFC) 안전한 경로 연결
 * - 반딧불이 & 촛불 불티 Canvas 파티클 + 밤숲 패럴랙스
 * - 5구 촛대 점화 상태 머신 + 통합/단일 뷰 전환 + 사운드 연동
 * - 유튜브 URL 파싱 + 시네마 라이트박스 (오디오 자동 덕킹)
 * - 촛불 E-Book 전용 리더기 (진행률 0~100%, 90% 완독 트래킹, 테마/서체/크기)
 * - 유입 출처(?utm_source, ?ref) 보존 & 13종 커스텀 이벤트 트래킹
 */

(function () {
  'use strict';

  const DATA = window.PORTFOLIO_DATA;
  const NOVELS = Array.isArray(window.NOVELS_DATA) ? window.NOVELS_DATA : [];
  const QA_BOOK = window.QA_WORKBOOK_DATA || null;
  const SOUND = window.ForestSoundEngine;

  if (!DATA) {
    console.error('[Portfolio] PORTFOLIO_DATA가 로드되지 않았습니다.');
    return;
  }

  // ---- Safe Storage & Path Utilities (file:// 호환) ----
  const memoryStorage = {};

  function safeSessionGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null;
    }
  }

  function safeSessionSet(key, val) {
    memoryStorage[key] = String(val);
    try {
      window.sessionStorage.setItem(key, String(val));
    } catch (e) {
      // file:// 또는 프라이빗 모드 fallback 무시
    }
  }

  function encodeAssetPath(rawPath, preserveNormalization) {
    if (!rawPath) return '#';
    const target =
      !preserveNormalization && typeof rawPath.normalize === 'function'
        ? rawPath.normalize('NFC')
        : rawPath;
    return encodeURI(target);
  }

  function renderSafeLocalImg(rawPath, altText, className) {
    if (!rawPath) return '';
    const str = String(rawPath);
    const nfdSrc = encodeURI(typeof str.normalize === 'function' ? str.normalize('NFD') : str);
    const nfcSrc = encodeURI(typeof str.normalize === 'function' ? str.normalize('NFC') : str);
    return (
      '<img class="' +
      escapeHtml(className || '') +
      '" src="' +
      nfdSrc +
      '" data-fallback-src="' +
      nfcSrc +
      '" alt="' +
      escapeHtml(altText || '') +
      '" loading="lazy" onerror="if(this.dataset.fallbackSrc&&this.getAttribute(\'src\')!==this.dataset.fallbackSrc){this.setAttribute(\'src\',this.dataset.fallbackSrc);}else{this.onerror=null;if(this.parentElement)this.parentElement.classList.add(\'is-img-fallback\');}">'
    );
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (/^(https?:\/\/|mailto:|#)/i.test(trimmed)) {
      return trimmed;
    }
    return encodeAssetPath(trimmed);
  }

  function extractYouTubeId(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    const patterns = [
      /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    for (let i = 0; i < patterns.length; i++) {
      const m = trimmed.match(patterns[i]);
      if (m && m[1]) return m[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    return '';
  }

  function getFallbackVideoThumbSvg(title) {
    const label = escapeHtml((title || 'Cinema Preview').slice(0, 26));
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#0B111C"/><stop offset="100%" stop-color="#1B1411"/>' +
      '</linearGradient></defs>' +
      '<rect width="640" height="360" fill="url(#g)"/>' +
      '<circle cx="320" cy="180" r="90" fill="#F59E0B" opacity="0.12"/>' +
      '<text x="320" y="290" text-anchor="middle" fill="#C59B5F" font-family="sans-serif" font-size="18">' +
      label +
      '</text></svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function legacyCopySync(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.width = '1px';
      ta.style.height = '1px';
      ta.style.opacity = '0.001';
      document.body.appendChild(ta);
      ta.focus({ preventScroll: true });
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return Boolean(ok);
    } catch (err) {
      return false;
    }
  }

  function copyTextSafe(text) {
    // file:// 환경에서는 사용자 제스처 컨텍스트를 유지하기 위해 동기 복사 우선 시도
    if (window.location.protocol === 'file:' || !window.isSecureContext) {
      if (legacyCopySync(text)) {
        return Promise.resolve();
      }
    }
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).catch(function () {
        if (legacyCopySync(text)) return Promise.resolve();
        return Promise.reject(new Error('copy failed'));
      });
    }
    return legacyCopySync(text) ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  // ---- Safe LocalStorage & Visitor Telemetry ----
  const ATTRIBUTION_KEY = 'portfolio_attribution';
  const IGNORE_TRACKING_KEY = 'portfolio_ignore_tracking';
  const VISITOR_ID_KEY = 'portfolio_visitor_id';
  const SESSION_ID_KEY = 'portfolio_session_id';
  const LOCAL_MIRROR_KEY = 'portfolio_local_telemetry_v1';
  const TRACKED_EVENTS_LOG = [];
  window.__PORTFOLIO_TRACKED_EVENTS = TRACKED_EVENTS_LOG;

  function safeLocalGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null;
    }
  }

  function safeLocalSet(key, val) {
    memoryStorage[key] = String(val);
    try {
      window.localStorage.setItem(key, String(val));
    } catch (e) {
      // file:// 또는 프라이빗 모드 fallback 무시
    }
  }

  function safeLocalRemove(key) {
    delete memoryStorage[key];
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  }

  function generateRandomId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return prefix + '_' + window.crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    }
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function getOrCreateVisitorId() {
    let vid = safeLocalGet(VISITOR_ID_KEY);
    if (!vid) {
      vid = generateRandomId('v');
      safeLocalSet(VISITOR_ID_KEY, vid);
    }
    return vid;
  }

  function getOrCreateSessionId() {
    let sid = safeSessionGet(SESSION_ID_KEY);
    if (!sid) {
      sid = generateRandomId('s');
      safeSessionSet(SESSION_ID_KEY, sid);
    }
    return sid;
  }

  function isTrackingIgnored() {
    return safeLocalGet(IGNORE_TRACKING_KEY) === 'true';
  }

  function applyIgnoreQueryFlag() {
    const params = new URLSearchParams(window.location.search || '');
    const flag = params.get('ignore_me');
    if (flag === '1' || flag === 'true') {
      safeLocalSet(IGNORE_TRACKING_KEY, 'true');
      showToast('내 기기 제외가 활성화되었습니다. 이 브라우저의 방문은 기록되지 않습니다.');
    } else if (flag === '0' || flag === 'false') {
      safeLocalRemove(IGNORE_TRACKING_KEY);
      showToast('내 기기 제외가 해제되었습니다.');
    }
  }

  function detectClientEnv() {
    const ua = navigator.userAgent || '';
    let deviceType = 'Desktop';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
      deviceType = 'Tablet';
    } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
      deviceType = 'Mobile';
    }

    let os = 'Other OS';
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Browser';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/Whale\//i.test(ua)) browser = 'Whale';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung';
    else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

    const w = window.screen && window.screen.width ? window.screen.width : window.innerWidth;
    const h = window.screen && window.screen.height ? window.screen.height : window.innerHeight;
    return {
      deviceType: deviceType,
      osBrowser: os + ' · ' + browser,
      screenSize: w + '×' + h
    };
  }

  function captureAttribution() {
    let saved = {};
    try {
      const prevRaw = safeSessionGet(ATTRIBUTION_KEY);
      if (prevRaw) saved = JSON.parse(prevRaw) || {};
    } catch (e) {
      saved = {};
    }

    const params = new URLSearchParams(window.location.search || '');
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'];
    let changed = false;
    keys.forEach(function (k) {
      const val = params.get(k);
      if (val) {
        saved[k] = val;
        changed = true;
      }
    });

    if (!saved.referrer && document.referrer) {
      saved.referrer = document.referrer;
      changed = true;
    }

    if (changed) {
      safeSessionSet(ATTRIBUTION_KEY, JSON.stringify(saved));
    }
    return saved;
  }

  const attribution = captureAttribution();
  const clientEnv = detectClientEnv();

  const telemetry = {
    visitorId: getOrCreateVisitorId(),
    sessionId: getOrCreateSessionId(),
    startedAt: new Date().toISOString(),
    startedMs: Date.now(),
    maxResumePct: 0,
    currentResumeMaxPct: 0,
    resumeOpenedAtMs: 0,
    maxCoverPct: 0,
    currentCoverMaxPct: 0,
    coverOpenedAtMs: 0,
    currentNovelMaxPct: 0,
    novelOpenedAtMs: 0,
    openedResume: 0,
    openedCover: 0,
    openedQa: 0,
    queue: [],
    flushTimer: null,
    lastLeaveSentMs: 0
  };

  function getLogApiUrl() {
    if (typeof window.__PORTFOLIO_LOG_API_OVERRIDE__ === 'string' && window.__PORTFOLIO_LOG_API_OVERRIDE__.trim()) {
      return window.__PORTFOLIO_LOG_API_OVERRIDE__.trim().replace(/\/+$/, '');
    }
    const cfg = DATA.analyticsConfig || {};
    return cfg.logApiUrl && typeof cfg.logApiUrl === 'string' ? cfg.logApiUrl.trim().replace(/\/+$/, '') : '';
  }

  function formatEventLabel(eventName, params) {
    const p = params || {};
    switch (eventName) {
      case 'page_view':
        return '포트폴리오 사이트 진입';
      case 'ignite_candle':
        return '촛불 점화: ' + (p.candle_title || '제' + (p.candle_id || '') + '초');
      case 'light_all_candles':
        return '5개 모든 촛불 켜기';
      case 'open_resume':
        return '공식 웹 이력서 열람 (' + (p.source || 'direct') + ')';
      case 'complete_resume_read':
        return '공식 이력서 90%+ 완독';
      case 'close_resume':
        return '공식 이력서 닫기 (진행률 ' + (p.max_progress_percent || 0) + '%, ' + (p.read_sec || 0) + '초)';
      case 'open_cover_letter':
        return '자기소개서 열람 (' + (p.source || 'direct') + ')';
      case 'complete_cover_letter_read':
        return '자기소개서 90%+ 완독';
      case 'close_cover_letter':
        return '자기소개서 닫기 (진행률 ' + (p.max_progress_percent || 0) + '%, ' + (p.read_sec || 0) + '초)';
      case 'open_qa_portfolio':
        if (String(p.source || '').indexOf('xlsx') !== -1) return 'QA 원본 Excel 다운로드';
        return 'QA 산출물 뷰어 열람 (' + (p.sheet || 'view') + ')';
      case 'switch_qa_sheet':
        return 'QA 시트 탭 전환: ' + (p.sheet || '');
      case 'play_video':
        return '영상 재생: ' + (p.video_title || p.youtube_id || '');
      case 'read_novel':
        return '창작 원고 읽기: ' + (p.novel_title || '');
      case 'complete_novel_read':
        return '창작 원고 완독: ' + (p.novel_title || '');
      case 'close_novel':
        return '창작 원고 닫기: ' + (p.novel_title || '') + ' (' + (p.max_progress_percent || 0) + '%)';
      case 'copy_contact_email':
        return '이메일 주소 복사';
      case 'click_linkedin_profile':
        return 'LinkedIn 프로필 클릭';
      case 'click_app_landing':
        return '상용 앱 사이트 이동: ' + (p.app_name || '');
      case 'click_app_store':
        return 'App Store 이동: ' + (p.app_name || '');
      case 'visit_youtube_channel':
        return 'YouTube 채널 방문';
      case 'toggle_ambient_sound':
        return '밤숲 사운드 ' + (p.enabled ? 'On' : 'Off');
      case 'page_leave':
        return '사이트 이탈 (체류 ' + (p.duration_sec || 0) + '초)';
      default:
        return eventName;
    }
  }

  function buildSessionSnapshot(nowIso) {
    const litArr = typeof state !== 'undefined' && state.litCandles ? Array.from(state.litCandles).sort(function (a, b) { return a - b; }) : [];
    const durationSec = Math.max(0, Math.round((Date.now() - telemetry.startedMs) / 1000));
    return {
      session_id: telemetry.sessionId,
      visitor_id: telemetry.visitorId,
      started_at: telemetry.startedAt,
      last_seen_at: nowIso || new Date().toISOString(),
      duration_sec: durationSec,
      ref_tag: attribution.ref || '',
      utm_source: attribution.utm_source || '',
      utm_medium: attribution.utm_medium || '',
      utm_campaign: attribution.utm_campaign || '',
      referrer: attribution.referrer || '',
      device_type: clientEnv.deviceType,
      os_browser: clientEnv.osBrowser,
      screen_size: clientEnv.screenSize,
      country: 'LOCAL',
      max_resume_pct: telemetry.maxResumePct,
      max_cover_pct: telemetry.maxCoverPct,
      opened_resume: telemetry.openedResume,
      opened_cover: telemetry.openedCover,
      opened_qa: telemetry.openedQa,
      lit_candles: litArr
    };
  }

  function saveEventToLocalMirror(sessionSnap, eventEntry) {
    const cfg = DATA.analyticsConfig || {};
    if (cfg.enableLocalMirror === false) return;
    try {
      const raw = safeLocalGet(LOCAL_MIRROR_KEY);
      const store = raw ? JSON.parse(raw) : { sessions: [], eventsBySession: {} };
      if (!Array.isArray(store.sessions)) store.sessions = [];
      if (!store.eventsBySession || typeof store.eventsBySession !== 'object') store.eventsBySession = {};

      let existing = store.sessions.find(function (s) {
        return s.session_id === sessionSnap.session_id;
      });
      if (!existing) {
        existing = Object.assign({}, sessionSnap, {
          lit_candles: JSON.stringify(sessionSnap.lit_candles || []),
          event_count: 0,
          memo: '',
          is_starred: 0
        });
        store.sessions.unshift(existing);
      } else {
        existing.last_seen_at = sessionSnap.last_seen_at;
        existing.duration_sec = Math.max(existing.duration_sec || 0, sessionSnap.duration_sec || 0);
        existing.max_resume_pct = Math.max(existing.max_resume_pct || 0, sessionSnap.max_resume_pct || 0);
        existing.max_cover_pct = Math.max(existing.max_cover_pct || 0, sessionSnap.max_cover_pct || 0);
        existing.opened_resume = Math.max(existing.opened_resume || 0, sessionSnap.opened_resume || 0);
        existing.opened_cover = Math.max(existing.opened_cover || 0, sessionSnap.opened_cover || 0);
        existing.opened_qa = Math.max(existing.opened_qa || 0, sessionSnap.opened_qa || 0);
        existing.lit_candles = JSON.stringify(sessionSnap.lit_candles || []);
      }

      const evList = store.eventsBySession[sessionSnap.session_id] || [];
      evList.push({
        id: evList.length + 1,
        session_id: sessionSnap.session_id,
        created_at: eventEntry.created_at,
        event_name: eventEntry.event_name,
        event_label: eventEntry.event_label,
        meta_json: JSON.stringify(eventEntry.meta || {})
      });
      store.eventsBySession[sessionSnap.session_id] = evList;
      existing.event_count = evList.length;

      // 최근 100개 세션만 유지
      if (store.sessions.length > 100) {
        const removed = store.sessions.slice(100);
        store.sessions = store.sessions.slice(0, 100);
        removed.forEach(function (r) {
          delete store.eventsBySession[r.session_id];
        });
      }

      safeLocalSet(LOCAL_MIRROR_KEY, JSON.stringify(store));
    } catch (e) {
      // localStorage 저장 실패는 무시
    }
  }

  function flushTelemetryQueue(useBeacon) {
    if (telemetry.flushTimer) {
      clearTimeout(telemetry.flushTimer);
      telemetry.flushTimer = null;
    }
    const apiUrl = getLogApiUrl();
    if (!apiUrl || isTrackingIgnored() || telemetry.queue.length === 0) {
      return;
    }

    const eventsBatch = telemetry.queue.splice(0, 25);
    const bodyStr = JSON.stringify({
      session: buildSessionSnapshot(),
      events: eventsBatch
    });
    const endpoint = apiUrl + '/api/collect';

    if (useBeacon && navigator && typeof navigator.sendBeacon === 'function') {
      try {
        const sent = navigator.sendBeacon(endpoint, bodyStr);
        if (sent) return;
      } catch (e) {
        // fallback to fetch below
      }
    }

    if (typeof window.fetch === 'function') {
      try {
        window
          .fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: bodyStr,
            keepalive: true
          })
          .catch(function () {
            // 텔레메트리 전송 실패는 사용자 경험에 영향을 주지 않도록 조용히 무시
          });
      } catch (e) {
        // ignore
      }
    }
  }

  window.__PORTFOLIO_FLUSH_LOGS__ = function () {
    flushTelemetryQueue(false);
  };

  function initAnalyticsProviders() {
    const cfg = DATA.analyticsConfig || {};
    if (cfg.gaMeasurementId && typeof cfg.gaMeasurementId === 'string' && cfg.gaMeasurementId.trim()) {
      const gaId = cfg.gaMeasurementId.trim();
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId, { anonymize_ip: true });

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
      document.head.appendChild(script);
    }

    if (cfg.cloudflareToken && typeof cfg.cloudflareToken === 'string' && cfg.cloudflareToken.trim()) {
      const cfScript = document.createElement('script');
      cfScript.defer = true;
      cfScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      cfScript.setAttribute('data-cf-beacon', JSON.stringify({ token: cfg.cloudflareToken.trim() }));
      document.head.appendChild(cfScript);
    }
  }

  function trackEvent(eventName, eventParams) {
    const payload = Object.assign({}, attribution, eventParams || {});
    const nowIso = new Date().toISOString();
    const record = {
      event: eventName,
      params: payload,
      timestamp: nowIso
    };
    TRACKED_EVENTS_LOG.push(record);

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }

    if (DATA.analyticsConfig && DATA.analyticsConfig.debugMode) {
      console.info('[Analytics Event]', eventName, payload);
    }

    if (isTrackingIgnored()) return;

    if (eventName === 'open_resume') telemetry.openedResume = 1;
    else if (eventName === 'open_cover_letter') telemetry.openedCover = 1;
    else if (eventName === 'open_qa_portfolio') telemetry.openedQa = 1;

    const eventEntry = {
      created_at: nowIso,
      event_name: eventName,
      event_label: formatEventLabel(eventName, eventParams || {}),
      meta: eventParams || {}
    };

    const snap = buildSessionSnapshot(nowIso);
    saveEventToLocalMirror(snap, eventEntry);

    if (getLogApiUrl()) {
      telemetry.queue.push(eventEntry);
      if (eventName === 'page_leave') {
        flushTelemetryQueue(true);
      } else if (telemetry.queue.length >= 8) {
        flushTelemetryQueue(false);
      } else if (!telemetry.flushTimer) {
        telemetry.flushTimer = setTimeout(function () {
          flushTelemetryQueue(false);
        }, 700);
      }
    }
  }

  // ---- Application State ----
  const state = {
    litCandles: new Set(),
    activeCandleId: null,
    viewMode: 'single', // 'single' | 'all'
    completedNovels: new Set(),
    activeNovelId: null,
    readerFontSize: 17,
    readerFont: 'serif',
    readerTheme: 'parchment',
    lastTriggerEl: null,
    lightAllTimers: [],
    qaSheet: 'test-cases',
    qaSearch: '',
    qaCategory: 'ALL',
    qaStatus: 'ALL',
    clFontSize: 16,
    clTheme: 'dark',
    clActiveSection: '',
    clTocLockUntil: 0,
    coverLetterCompleted: false,
    clRendered: false,
    rmFontSize: 16,
    rmTheme: 'dark',
    rmActiveSection: '',
    rmTocLockUntil: 0,
    resumeCompleted: false,
    rmRendered: false
  };

  // ---- DOM References ----
  const dom = {
    body: document.body,
    forestStage: document.getElementById('forest-stage'),
    forestCanvas: document.getElementById('forest-canvas'),
    candelabraShelf: document.getElementById('candelabra-shelf'),
    litCountNumber: document.getElementById('lit-count-number'),
    litSoundHint: document.getElementById('lit-sound-hint'),

    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    soundToggleLabel: document.getElementById('sound-toggle-label'),
    soundVolumeSlider: document.getElementById('sound-volume-slider'),
    soundVolumeValue: document.getElementById('sound-volume-value'),
    soundGuideTooltip: document.getElementById('sound-guide-tooltip'),

    lightAllBtn: document.getElementById('light-all-btn'),
    navResumeBtn: document.getElementById('nav-resume-btn'),
    navCoverBtn: document.getElementById('nav-cover-btn'),
    navLinkedinLink: document.getElementById('nav-linkedin-link'),
    footerResumeBtn: document.getElementById('footer-resume-btn'),
    footerCoverBtn: document.getElementById('footer-cover-btn'),
    footerLinkedinLink: document.getElementById('footer-linkedin-link'),

    showcaseContainer: document.getElementById('showcase-container'),
    showcaseEmptyState: document.getElementById('showcase-empty-state'),
    showcaseWorkspace: document.getElementById('showcase-workspace'),
    modeCandlePills: document.getElementById('mode-candle-pills'),
    viewModeBadge: document.getElementById('view-mode-badge'),
    toggleViewModeBtn: document.getElementById('toggle-view-mode-btn'),
    showcasePanels: document.getElementById('showcase-panels'),
    emptyIgniteFirstBtn: document.getElementById('empty-ignite-first-btn'),
    emptyLightAllBtn: document.getElementById('empty-light-all-btn'),

    videoLightbox: document.getElementById('video-lightbox'),
    lightboxTitle: document.getElementById('lightbox-title'),
    lightboxBadge: document.getElementById('lightbox-badge'),
    lightboxIframe: document.getElementById('lightbox-iframe'),
    lightboxExternalLink: document.getElementById('lightbox-external-link'),
    lightboxCloseBtn: document.getElementById('lightbox-close-btn'),

    ebookModal: document.getElementById('ebook-modal'),
    ebookProgressBar: document.getElementById('ebook-progress-bar'),
    ebookProgressText: document.getElementById('ebook-progress-text'),
    ebookCategoryBadge: document.getElementById('ebook-category-badge'),
    ebookTitle: document.getElementById('ebook-title'),
    ebookStats: document.getElementById('ebook-stats'),
    ebookScrollBody: document.getElementById('ebook-scroll-body'),
    ebookManuscript: document.getElementById('ebook-manuscript'),
    manuscriptGenre: document.getElementById('manuscript-genre'),
    manuscriptTitle: document.getElementById('manuscript-title'),
    manuscriptLogline: document.getElementById('manuscript-logline'),
    ebookContent: document.getElementById('ebook-content'),
    ebookFontDec: document.getElementById('ebook-font-dec'),
    ebookFontInc: document.getElementById('ebook-font-inc'),
    ebookFontSizeLabel: document.getElementById('ebook-font-size-label'),
    ebookFontSerif: document.getElementById('ebook-font-serif'),
    ebookFontSans: document.getElementById('ebook-font-sans'),
    ebookCloseBtn: document.getElementById('ebook-close-btn'),

    qaModal: document.getElementById('qa-workbook-modal'),
    qaModalDownloadLink: document.getElementById('qa-modal-download-link'),
    qaModalCloseBtn: document.getElementById('qa-modal-close-btn'),
    qaTabsBar: document.getElementById('qa-tabs-bar'),
    qaFilterBar: document.getElementById('qa-filter-bar'),
    qaSearchInput: document.getElementById('qa-search-input'),
    qaCategoryFilter: document.getElementById('qa-category-filter'),
    qaStatusPills: document.getElementById('qa-status-pills'),
    qaVisibleCount: document.getElementById('qa-visible-count'),
    qaModalBody: document.getElementById('qa-modal-body'),

    clModal: document.getElementById('cover-letter-modal'),
    clProgressBar: document.getElementById('cl-progress-bar'),
    clProgressText: document.getElementById('cl-progress-text'),
    clModalBadge: document.getElementById('cl-modal-badge'),
    clModalTitle: document.getElementById('cl-modal-title'),
    clModalSubtitle: document.getElementById('cl-modal-subtitle'),
    clFontDec: document.getElementById('cl-font-dec'),
    clFontInc: document.getElementById('cl-font-inc'),
    clFontSizeLabel: document.getElementById('cl-font-size-label'),
    clModalCloseBtn: document.getElementById('cl-modal-close-btn'),
    clTocBar: document.getElementById('cl-toc-bar'),
    clModalBody: document.getElementById('cl-modal-body'),

    rmModal: document.getElementById('resume-modal'),
    rmProgressBar: document.getElementById('rm-progress-bar'),
    rmProgressText: document.getElementById('rm-progress-text'),
    rmModalBadge: document.getElementById('rm-modal-badge'),
    rmModalTitle: document.getElementById('rm-modal-title'),
    rmModalSubtitle: document.getElementById('rm-modal-subtitle'),
    rmFontDec: document.getElementById('rm-font-dec'),
    rmFontInc: document.getElementById('rm-font-inc'),
    rmFontSizeLabel: document.getElementById('rm-font-size-label'),
    rmModalCloseBtn: document.getElementById('rm-modal-close-btn'),
    rmTocBar: document.getElementById('rm-toc-bar'),
    rmModalBody: document.getElementById('rm-modal-body'),

    toastContainer: document.getElementById('toast-container')
  };

  // ---- Toast Notification ----
  function showToast(message) {
    if (!dom.toastContainer) return;
    const item = document.createElement('div');
    item.className = 'toast-item';
    item.textContent = message;
    dom.toastContainer.appendChild(item);
    setTimeout(function () {
      item.style.opacity = '0';
      item.style.transition = 'opacity 0.25s ease';
      setTimeout(function () {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 260);
    }, 2400);
  }

  // ---- Profile & Document Hydration ----
  function hydrateChrome() {
    const p = DATA.profile;

    const setText = function (id, txt) {
      const el = document.getElementById(id);
      if (el && txt) el.textContent = txt;
    };

    setText('nav-profile-name', p.name);
    setText('nav-profile-tagline', p.tagline);
    setText('stage-eyebrow', p.eyebrow);
    setText('stage-headline', p.headline);
    setText('stage-subheadline', p.subHeadline);
    setText('footer-name', p.name);
    setText('footer-tagline', p.tagline);

    [dom.navResumeBtn, dom.footerResumeBtn].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        openResumeModal(btn.id);
      });
    });

    [dom.navCoverBtn, dom.footerCoverBtn].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        openCoverLetterModal(btn.id);
      });
    });

    if (p.linkedinUrl) {
      const liUrl = sanitizeUrl(p.linkedinUrl);
      [dom.navLinkedinLink, dom.footerLinkedinLink].forEach(function (link) {
        if (!link) return;
        link.href = liUrl;
        link.addEventListener('click', function () {
          if (SOUND) SOUND.playSoftClick();
          trackEvent('click_linkedin_profile', { source: link.id, url: liUrl });
        });
      });
    }
  }

  // ---- Sound Bar Controls ----
  function syncSoundUi() {
    if (!SOUND || !dom.soundToggleBtn) return;
    const st = SOUND.getState();
    dom.soundToggleBtn.setAttribute('aria-pressed', st.isEnabled ? 'true' : 'false');
    dom.soundToggleBtn.classList.toggle('is-on', st.isEnabled);
    dom.soundToggleBtn.classList.toggle('is-ducked', st.ducked);

    if (dom.soundToggleLabel) {
      dom.soundToggleLabel.textContent = st.isEnabled ? '밤숲 소리 On' : '밤숲 소리 Off';
    }
    if (dom.litSoundHint) {
      if (!st.isEnabled) {
        dom.litSoundHint.textContent = '· 사운드 Off';
      } else if (st.ducked) {
        dom.litSoundHint.textContent = '· 일시 음소거';
      } else {
        dom.litSoundHint.textContent =
          st.litCount === 0
            ? '· 밤숲 바람 재생 중'
            : '· 바람 + 타닥거림 ' + st.litCount + '단계';
      }
    }
  }

  function initSoundControls() {
    const defaultPct = Math.round((DATA.siteConfig.defaultVolume || 0.45) * 100);
    if (dom.soundVolumeSlider) {
      dom.soundVolumeSlider.value = String(defaultPct);
    }
    if (dom.soundVolumeValue) {
      dom.soundVolumeValue.textContent = defaultPct + '%';
    }

    // 첫 접속 4초간 안내 툴팁 노출 후 페이드아웃
    if (dom.soundGuideTooltip) {
      setTimeout(function () {
        dom.soundGuideTooltip.classList.add('is-hidden');
      }, 4000);
    }

    if (dom.soundToggleBtn && SOUND) {
      dom.soundToggleBtn.addEventListener('click', function () {
        if (dom.soundGuideTooltip) {
          dom.soundGuideTooltip.classList.add('is-hidden');
        }
        const enabled = SOUND.toggle();
        if (enabled) {
          SOUND.setLitCount(state.litCandles.size);
          SOUND.playSoftClick();
        }
        syncSoundUi();
        trackEvent('toggle_ambient_sound', {
          enabled: enabled,
          volume: Math.round(SOUND.getState().userVolume * 100)
        });
      });
    }

    if (dom.soundVolumeSlider && SOUND) {
      dom.soundVolumeSlider.addEventListener('input', function (e) {
        const pct = Number(e.target.value) || 0;
        if (dom.soundVolumeValue) {
          dom.soundVolumeValue.textContent = pct + '%';
        }
        SOUND.setVolume(pct / 100);
      });
    }

    document.addEventListener('visibilitychange', function () {
      if (!SOUND) return;
      SOUND.setDuck('tab-hidden', Boolean(document.hidden));
      syncSoundUi();
    });

    syncSoundUi();
  }

  // ---- Build 5 Candles & Quick Pills ----
  function renderCandles() {
    if (!dom.candelabraShelf) return;
    dom.candelabraShelf.innerHTML = '';

    DATA.candlesMeta.forEach(function (meta, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'candle-item';
      btn.setAttribute('data-candle-id', String(meta.id));
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('aria-label', meta.numeral + ' ' + meta.title + ' - ' + meta.tooltip);

      btn.innerHTML =
        '<span class="candle-tooltip" role="tooltip">' +
        escapeHtml(meta.tooltip) +
        '</span>' +
        '<span class="candle-flame-rig" aria-hidden="true">' +
        '<span class="flame-halo"></span>' +
        '<span class="flame-layers">' +
        '<span class="flame-outer"></span>' +
        '<span class="flame-inner"></span>' +
        '<span class="flame-core"></span>' +
        '</span>' +
        '</span>' +
        '<span class="candle-wick-wrap" aria-hidden="true">' +
        '<span class="wick-ember"></span>' +
        '<span class="wick-stem"></span>' +
        '</span>' +
        '<span class="candle-wax" aria-hidden="true"></span>' +
        '<span class="brass-holder" aria-hidden="true">' +
        '<span class="brass-cup"></span>' +
        '<span class="brass-stem"></span>' +
        '<span class="brass-base"></span>' +
        '</span>' +
        '<span class="brass-plaque">' +
        '<span class="plaque-num">' +
        escapeHtml(meta.numeral) +
        '</span>' +
        '<span class="plaque-title">' +
        escapeHtml(meta.title) +
        '</span>' +
        '<span class="plaque-sub">' +
        escapeHtml(meta.subtitle) +
        '</span>' +
        '</span>';

      const pan = ((meta.id - 3) / 2) * 0.52;

      btn.addEventListener('mouseenter', function () {
        if (!state.litCandles.has(meta.id) && SOUND) {
          SOUND.playEmberHover(pan);
        }
      });

      btn.addEventListener('click', function () {
        handleCandleSelect(meta.id);
      });

      btn.addEventListener('keydown', function (e) {
        const allBtns = Array.from(dom.candelabraShelf.querySelectorAll('.candle-item'));
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          allBtns[(idx + 1) % allBtns.length].focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          allBtns[(idx - 1 + allBtns.length) % allBtns.length].focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          allBtns[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          allBtns[allBtns.length - 1].focus();
        }
      });

      dom.candelabraShelf.appendChild(btn);
    });
  }

  function syncCandleVisuals() {
    const litCount = state.litCandles.size;
    dom.body.setAttribute('data-lit-count', String(litCount));
    if (dom.forestStage) {
      dom.forestStage.setAttribute('data-lit-count', String(litCount));
    }
    if (dom.litCountNumber) {
      dom.litCountNumber.textContent = String(litCount);
    }

    if (dom.candelabraShelf) {
      const items = dom.candelabraShelf.querySelectorAll('.candle-item');
      items.forEach(function (btn) {
        const id = Number(btn.getAttribute('data-candle-id'));
        const isLit = state.litCandles.has(id);
        const isFocused = state.activeCandleId === id;
        btn.classList.toggle('is-lit', isLit);
        btn.classList.toggle('is-focused', isFocused);
        btn.setAttribute('aria-selected', isFocused ? 'true' : 'false');
      });
    }

    if (dom.lightAllBtn) {
      const allLit = litCount === 5;
      dom.lightAllBtn.classList.toggle('is-all-lit', allLit);
      dom.lightAllBtn.innerHTML = allLit
        ? '5개의 촛불 모두 켜짐 <span aria-hidden="true">✦</span>'
        : '모든 촛불 켜기 <span aria-hidden="true">✦</span>';
    }

    syncSoundUi();
  }

  // ---- Showcase Rendering Helpers ----
  function getAppIconSvg(type) {
    if (type === 'posepik') {
      return (
        '<svg viewBox="0 0 44 44" width="38" height="38" fill="none" aria-hidden="true">' +
        '<rect x="6" y="10" width="32" height="24" rx="7" stroke="#FBBF24" stroke-width="2.2"/>' +
        '<circle cx="22" cy="22" r="6.5" stroke="#FFFDF5" stroke-width="2"/>' +
        '<circle cx="22" cy="18.2" r="2.1" fill="#FBBF24"/>' +
        '<path d="M17.5 26.2C18.5 23.8 25.5 23.8 26.5 26.2" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="32.5" cy="15.2" r="1.6" fill="#F59E0B"/>' +
        '</svg>'
      );
    }
    return (
      '<svg viewBox="0 0 44 44" width="38" height="38" fill="none" aria-hidden="true">' +
      '<rect x="9" y="12" width="20" height="24" rx="4" fill="rgba(56,189,248,0.16)" stroke="#38BDF8" stroke-width="2"/>' +
      '<rect x="15" y="8" width="20" height="24" rx="4" fill="#101A2B" stroke="#FBBF24" stroke-width="2"/>' +
      '<path d="M25 14L26.5 18.2L30.5 19.7L26.5 21.2L25 25.4L23.5 21.2L19.5 19.7L23.5 18.2L25 14Z" fill="#FFFDF5"/>' +
      '</svg>'
    );
  }

  function renderPanel1Html() {
    const p = DATA.profile;
    const li = DATA.linkedinProfile;
    const linkedinHref = sanitizeUrl(p.linkedinUrl);

    const highlightsHtml = p.highlights
      .map(function (h) {
        return (
          '<div class="highlight-card">' +
          '<span class="highlight-label">' +
          escapeHtml(h.label) +
          '</span>' +
          '<strong class="highlight-value">' +
          escapeHtml(h.value) +
          '</strong>' +
          '<p class="highlight-detail">' +
          escapeHtml(h.detail) +
          '</p>' +
          '</div>'
        );
      })
      .join('');

    const keywordsHtml = p.keywords
      .map(function (tag) {
        return '<span class="tech-tag">' + escapeHtml(tag) + '</span>';
      })
      .join('');

    let careerSnapshotHtml = '';
    if (li) {
      const expHtml = (li.experiences || [])
        .map(function (exp) {
          return (
            '<div class="career-timeline-item">' +
            '<div class="career-item-head">' +
            '<span class="career-period mono-num">' +
            escapeHtml(exp.period) +
            '</span>' +
            '<strong class="career-org">' +
            escapeHtml(exp.org) +
            '</strong>' +
            '</div>' +
            '<h5 class="career-role">' +
            escapeHtml(exp.role) +
            '</h5>' +
            '<p class="career-desc">' +
            escapeHtml(exp.desc) +
            '</p>' +
            '</div>'
          );
        })
        .join('');

      const eduHtml = (li.education || [])
        .map(function (item) {
          return '<li>' + escapeHtml(item) + '</li>';
        })
        .join('');

      const certHtml = (li.certifications || [])
        .map(function (item) {
          return '<li>' + escapeHtml(item) + '</li>';
        })
        .join('');

      careerSnapshotHtml =
        '<div class="linkedin-resume-section">' +
        '<div class="linkedin-section-head">' +
        '<div>' +
        '<span class="mono-badge">' +
        escapeHtml(li.badge || 'CAREER & LINKEDIN SNAPSHOT') +
        '</span>' +
        '<h3 class="linkedin-section-title">' +
        escapeHtml(li.headline) +
        '</h3>' +
        '</div>' +
        (p.linkedinUrl
          ? '<a class="btn-brass-solid" href="' +
            linkedinHref +
            '" target="_blank" rel="noopener" data-linkedin-link="true">LinkedIn 프로필 바로가기 ↗</a>'
          : '') +
        '</div>' +
        '<p class="linkedin-about-copy">' +
        escapeHtml(li.about) +
        '</p>' +
        '<div class="career-bento-grid">' +
        '<div class="career-block">' +
        '<h4 class="career-block-title">주요 경력 및 프로덕트 타임라인</h4>' +
        '<div class="career-timeline">' +
        expHtml +
        '</div>' +
        '</div>' +
        '<div class="career-side-stack">' +
        '<div class="career-block">' +
        '<h4 class="career-block-title">교육 · 훈련 이수</h4>' +
        '<ul class="career-bullet-list">' +
        eduHtml +
        '</ul>' +
        '</div>' +
        '<div class="career-block">' +
        '<h4 class="career-block-title">보유 자격증</h4>' +
        '<ul class="career-bullet-list">' +
        certHtml +
        '</ul>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    }

    const cupPhotoHtml = p.cardProfilePhoto
      ? '<div class="profile-cup-frame">' +
        renderSafeLocalImg(p.cardProfilePhoto, p.name + ' 커피잔 라떼아트 프로필 사진', 'profile-cup-img') +
        '</div>'
      : '';

    return (
      '<div class="profile-grid">' +
      '<div class="profile-summary-box">' +
      '<div class="profile-hero-head">' +
      cupPhotoHtml +
      '<div class="profile-hero-titles">' +
      '<div class="profile-name-row">' +
      '<h3>' +
      escapeHtml(p.name) +
      '</h3>' +
      '<span>' +
      escapeHtml(p.englishName) +
      ' · ' +
      escapeHtml(p.tagline) +
      '</span>' +
      '</div>' +
      '<p class="profile-hero-caption">따뜻한 시선으로 일상의 문제를 포착하고 프로덕트로 빚어냅니다.</p>' +
      '</div>' +
      '</div>' +
      '<p class="profile-bio">' +
      escapeHtml(p.summary) +
      '</p>' +
      '<div class="tag-list">' +
      keywordsHtml +
      '</div>' +
      '<div class="highlights-grid">' +
      highlightsHtml +
      '</div>' +
      '</div>' +
      '<div class="credentials-column">' +
      '<div class="doc-card">' +
      '<div class="doc-card-head">' +
      '<h4 class="doc-card-title">연락처 &amp; LinkedIn</h4>' +
      '<span class="mono-badge">CONTACT</span>' +
      '</div>' +
      '<p class="doc-card-sub">이메일을 원클릭 복사하거나 LinkedIn 프로필을 바로 열람할 수 있습니다.</p>' +
      '<div class="email-copy-row">' +
      '<span class="email-value">' +
      escapeHtml(p.email) +
      '</span>' +
      '<button type="button" class="btn-brass-solid" data-copy-email="' +
      escapeHtml(p.email) +
      '">이메일 복사</button>' +
      '</div>' +
      (p.linkedinUrl
        ? '<a class="btn-brass-outline" href="' +
          linkedinHref +
          '" target="_blank" rel="noopener" data-linkedin-link="true">LinkedIn (' +
          escapeHtml(p.linkedinLabel || 'younghwen') +
          ') ↗</a>'
        : '') +
      '</div>' +
      '<div class="doc-card">' +
      '<div class="doc-card-head">' +
      '<h4 class="doc-card-title">공식 이력서 (웹 열람)</h4>' +
      '<span class="mono-badge">RESUME</span>' +
      '</div>' +
      '<p class="doc-card-sub">인적 프로필, 4년+ 실무 및 상용 iOS 경력, 학력·대외활동, 직업훈련 10건, 자격증 7종을 웹에서 바로 확인합니다.</p>' +
      '<button type="button" class="btn-brass-solid" data-open-resume="candle_1_panel">이력서 바로 보기 ✦</button>' +
      '</div>' +
      '<div class="doc-card">' +
      '<div class="doc-card-head">' +
      '<h4 class="doc-card-title">자기소개서 (웹 열람)</h4>' +
      '<span class="mono-badge">COVER LETTER</span>' +
      '</div>' +
      '<p class="doc-card-sub">성격·가치관, 4년+ 실무 및 상용 iOS 앱 기술서, 지원동기를 사이트 내 전용 리더로 바로 읽습니다.</p>' +
      '<button type="button" class="btn-brass-solid" data-open-cover-letter="candle_1_panel">자기소개서 바로 읽기 ✦</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      careerSnapshotHtml
    );
  }

  function renderPanel2Html() {
    const cards = DATA.iosApps
      .map(function (app, idx) {
        const badgeList = app.badges || app.statusBadges || [];
        const badges = badgeList
          .map(function (b, bIdx) {
            const cls = bIdx === 0 ? 'status-badge-live' : 'status-badge-platform';
            return '<span class="' + cls + '">' + escapeHtml(b) + '</span>';
          })
          .join('');

        const tagList = app.techTags || app.tags || [];
        const tags = tagList
          .map(function (t) {
            return '<span class="tech-tag">' + escapeHtml(t) + '</span>';
          })
          .join('');

        const highlightList = app.highlights || [];
        const highlightsHtml = highlightList
          .map(function (item) {
            return (
              '<div class="app-highlight-item">' +
              '<span class="app-highlight-label">' +
              escapeHtml(item.label) +
              '</span>' +
              '<strong class="app-highlight-title">' +
              escapeHtml(item.title) +
              '</strong>' +
              '<p class="app-highlight-desc">' +
              escapeHtml(item.desc) +
              '</p>' +
              '</div>'
            );
          })
          .join('');

        const accBodyId = 'acc-ios-' + app.id + '-' + idx;
        const analyticsAppName = app.analyticsName || app.name;
        const landingHref = sanitizeUrl(app.landingUrl || app.websiteUrl);
        const landingText = app.landingLabel || '공식 웹사이트';
        const hasAppStore = Boolean(app.appStoreUrl && app.appStoreUrl.trim());
        const demoYtId = extractYouTubeId(app.demoVideoUrl);

        const appStoreBtnHtml = hasAppStore
          ? '<a class="btn-brass-outline" href="' +
            sanitizeUrl(app.appStoreUrl) +
            '" target="_blank" rel="noopener" data-app-store="' +
            escapeHtml(analyticsAppName) +
            '">' +
            'App Store에서 보기 ↗</a>'
          : '';

        const demoBtnHtml = demoYtId
          ? '<button type="button" class="btn-brass-solid" data-play-video="' +
            escapeHtml(app.demoVideoUrl) +
            '" data-video-title="' +
            escapeHtml(app.demoVideoTitle || app.name + ' 시연 영상') +
            '" data-video-section="ios_app_demo">' +
            escapeHtml(app.demoVideoLabel || '시연 영상 재생 ▶') +
            '</button>'
          : '';

        return (
          '<article class="app-card">' +
          '<div class="app-card-top">' +
          '<div class="ios-icon-frame is-' +
          escapeHtml(app.iconType || app.id) +
          '">' +
          getAppIconSvg(app.iconType || app.id) +
          '</div>' +
          '<div class="app-title-meta">' +
          '<div class="app-badges">' +
          badges +
          '</div>' +
          '<h3 class="app-name">' +
          escapeHtml(app.name) +
          '</h3>' +
          '<p class="app-category">' +
          escapeHtml(app.subtitle || app.categoryLabel) +
          '</p>' +
          '</div>' +
          '</div>' +
          '<p class="app-oneliner">' +
          escapeHtml(app.summary || app.oneLiner) +
          '</p>' +
          '<div class="tag-list">' +
          tags +
          '</div>' +
          '<div class="accordion-wrap">' +
          '<button type="button" class="accordion-trigger" aria-expanded="false" aria-controls="' +
          accBodyId +
          '">' +
          '<span>개발 아키텍처 · 실기기 QA · 운영 성과 보기</span>' +
          '<span class="accordion-chevron" aria-hidden="true">▼</span>' +
          '</button>' +
          '<div class="accordion-body" id="' +
          accBodyId +
          '" hidden>' +
          '<div class="app-highlights-stack">' +
          highlightsHtml +
          '</div>' +
          '</div>' +
          '</div>' +
          '<div class="app-cta-group">' +
          '<a class="btn-brass-solid" href="' +
          landingHref +
          '" target="_blank" rel="noopener" data-app-landing="' +
          escapeHtml(analyticsAppName) +
          '">' +
          escapeHtml(landingText) +
          ' ↗</a>' +
          appStoreBtnHtml +
          demoBtnHtml +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    return '<div class="apps-bento-grid">' + cards + '</div>';
  }

  function renderPanel3Html() {
    const fv = DATA.featuredVideo;
    const qa = DATA.qaPortfolio;
    const fvId = extractYouTubeId(fv.youtubeUrl);
    const fvThumb = fvId
      ? 'https://i.ytimg.com/vi/' + fvId + '/hqdefault.jpg'
      : getFallbackVideoThumbSvg(fv.title);
    const fvFallback = getFallbackVideoThumbSvg(fv.title);

    const summaryHtml = fv.summaryLines
      .map(function (s) {
        return (
          '<div class="summary-line-item">' +
          '<strong>' +
          escapeHtml(s.label) +
          '</strong>' +
          '<span>' +
          escapeHtml(s.text) +
          '</span>' +
          '</div>'
        );
      })
      .join('');

    const metricsHtml = qa.metrics
      .map(function (m) {
        return (
          '<div class="qa-metric-box">' +
          '<span class="qa-metric-label">' +
          escapeHtml(m.label) +
          '</span>' +
          '<span class="qa-metric-value">' +
          escapeHtml(m.value) +
          '</span>' +
          '</div>'
        );
      })
      .join('');

    const qaDetailsHtml = qa.summaryDetails
      .map(function (d) {
        return '<li>' + escapeHtml(d) + '</li>';
      })
      .join('');

    const xlsxHref = QA_BOOK && QA_BOOK.fileName ? encodeAssetPath(QA_BOOK.fileName, true) : '';
    const openQaViewerBtnHtml = QA_BOOK
      ? '<button type="button" class="btn-brass-solid" data-open-qa-workbook="test-cases">' +
        'QA 문서 웹에서 바로 보기 (3시트 · 219 TC) ↗</button>'
      : '';
    const downloadXlsxBtnHtml =
      xlsxHref && xlsxHref !== '#'
        ? '<a class="btn-brass-outline" href="' +
          xlsxHref +
          '" download data-qa-download="true">원본 Excel (.xlsx) 다운로드 ⬇</a>'
        : '';
    const driveBtnHtml =
      qa.driveUrl && qa.driveUrl.trim()
        ? '<a class="btn-ghost-sm" href="' +
          sanitizeUrl(qa.driveUrl) +
          '" target="_blank" rel="noopener" data-qa-drive="true">' +
          'Google Drive ↗</a>'
        : '';

    const guma = qa.gumaProject;
    const gumaYtId = guma ? extractYouTubeId(guma.demoVideoUrl) : '';
    const gumaThumb = gumaYtId
      ? 'https://i.ytimg.com/vi/' + gumaYtId + '/hqdefault.jpg'
      : guma
      ? getFallbackVideoThumbSvg(guma.demoTitle)
      : '';
    const gumaFallback = guma ? getFallbackVideoThumbSvg(guma.demoTitle) : '';
    const gumaRolesHtml =
      guma && Array.isArray(guma.myRoles)
        ? guma.myRoles
            .map(function (r) {
              return (
                '<div class="guma-role-card">' +
                '<span class="mono-badge">' +
                escapeHtml(r.badge) +
                '</span>' +
                '<h5>' +
                escapeHtml(r.title) +
                '</h5>' +
                '<p>' +
                escapeHtml(r.desc) +
                '</p>' +
                '</div>'
              );
            })
            .join('')
        : '';

    const gumaHtml = guma
      ? '<div class="guma-project-wrap">' +
        '<div class="guma-role-header">' +
        '<span class="mono-badge">' +
        escapeHtml(guma.badge) +
        '</span>' +
        '<h4>이준영 프로젝트 담당 역할 &amp; 결과물 시연</h4>' +
        '</div>' +
        '<div class="guma-role-grid">' +
        gumaRolesHtml +
        '</div>' +
        (gumaYtId
          ? '<div class="qa-demo-card guma-demo-card">' +
            '<button type="button" class="video-thumb-btn" data-play-video="' +
            escapeHtml(guma.demoVideoUrl) +
            '" data-video-title="' +
            escapeHtml(guma.demoTitle) +
            '" data-video-section="qa_guma_demo" aria-label="구마야 산책가자 시연 영상 재생">' +
            '<img class="video-thumb-img" src="' +
            gumaThumb +
            '" alt="' +
            escapeHtml(guma.demoTitle) +
            ' 썸네일" loading="lazy" onerror="this.onerror=null;this.src=\'' +
            gumaFallback +
            '\';">' +
            '<span class="video-play-halo" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
            '</span>' +
            (guma.demoDuration
              ? '<span class="video-duration-pill">' + escapeHtml(guma.demoDuration) + '</span>'
              : '') +
            '</button>' +
            '<div class="qa-demo-info">' +
            '<span class="mono-badge">PROJECT RESULT DEMO</span>' +
            '<h4>' +
            escapeHtml(guma.demoTitle) +
            '</h4>' +
            '<p class="qa-demo-desc">' +
            escapeHtml(guma.demoDesc) +
            '</p>' +
            '<div class="qa-demo-actions">' +
            '<button type="button" class="btn-brass-solid" data-play-video="' +
            escapeHtml(guma.demoVideoUrl) +
            '" data-video-title="' +
            escapeHtml(guma.demoTitle) +
            '" data-video-section="qa_guma_demo">결과물 시연 영상 보기 ▶</button>' +
            '<button type="button" class="btn-brass-outline" data-open-qa-workbook="report">테스트 결과 보고서 보기 ↗</button>' +
            '</div>' +
            '</div>' +
            '</div>'
          : '') +
        '</div>'
      : '';

    const autoDemo = qa.automationDemo;
    const autoYtId = autoDemo ? extractYouTubeId(autoDemo.youtubeUrl) : '';
    const autoThumb = autoYtId
      ? 'https://i.ytimg.com/vi/' + autoYtId + '/hqdefault.jpg'
      : autoDemo
      ? getFallbackVideoThumbSvg(autoDemo.title)
      : '';
    const autoFallback = autoDemo ? getFallbackVideoThumbSvg(autoDemo.title) : '';
    const autoTagsHtml =
      autoDemo && Array.isArray(autoDemo.techTags)
        ? autoDemo.techTags
            .map(function (t) {
              return '<span class="tech-tag">' + escapeHtml(t) + '</span>';
            })
            .join('')
        : '';

    const autoDemoCardHtml = autoDemo
      ? '<div class="qa-demo-card">' +
        '<button type="button" class="video-thumb-btn" data-play-video="' +
        escapeHtml(autoDemo.youtubeUrl) +
        '" data-video-title="' +
        escapeHtml(autoDemo.title) +
        '" data-video-section="qa_automation_demo" aria-label="스마트폰 테스트 자동화 시연 영상 재생: ' +
        escapeHtml(autoDemo.title) +
        '">' +
        '<img class="video-thumb-img" src="' +
        autoThumb +
        '" alt="' +
        escapeHtml(autoDemo.title) +
        ' 썸네일" loading="lazy" onerror="this.onerror=null;this.src=\'' +
        autoFallback +
        '\';">' +
        '<span class="video-play-halo" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        '</span>' +
        (autoDemo.duration
          ? '<span class="video-duration-pill">' + escapeHtml(autoDemo.duration) + '</span>'
          : '') +
        '</button>' +
        '<div class="qa-demo-info">' +
        '<span class="mono-badge">' +
        escapeHtml(autoDemo.badge) +
        '</span>' +
        '<h4>' +
        escapeHtml(autoDemo.title) +
        '</h4>' +
        '<p class="qa-demo-desc">' +
        escapeHtml(autoDemo.description) +
        '</p>' +
        '<div class="tag-list">' +
        autoTagsHtml +
        '</div>' +
        '<div class="qa-demo-actions">' +
        '<button type="button" class="btn-brass-solid" data-play-video="' +
        escapeHtml(autoDemo.youtubeUrl) +
        '" data-video-title="' +
        escapeHtml(autoDemo.title) +
        '" data-video-section="qa_automation_demo">시연 영상 재생 ▶</button>' +
        '</div>' +
        '</div>' +
        '</div>'
      : '';

    return (
      '<div class="vision-qa-stack">' +
      '<div class="featured-video-card">' +
      '<button type="button" class="video-thumb-btn" data-play-video="' +
      escapeHtml(fv.youtubeUrl) +
      '" data-video-title="' +
      escapeHtml(fv.title) +
      '" data-video-section="featured_portfolio" aria-label="대표 포트폴리오 영상 재생: ' +
      escapeHtml(fv.title) +
      '">' +
      '<img class="video-thumb-img" src="' +
      fvThumb +
      '" alt="' +
      escapeHtml(fv.title) +
      ' 썸네일" loading="lazy" onerror="this.onerror=null;this.src=\'' +
      fvFallback +
      '\';">' +
      '<span class="video-play-halo" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
      '</span>' +
      (fv.duration
        ? '<span class="video-duration-pill">' + escapeHtml(fv.duration) + '</span>'
        : '') +
      '</button>' +
      '<div class="featured-video-info">' +
      '<span class="mono-badge">' +
      escapeHtml(fv.badge) +
      '</span>' +
      '<h3>' +
      escapeHtml(fv.title) +
      '</h3>' +
      '<div class="summary-3line">' +
      summaryHtml +
      '</div>' +
      '<button type="button" class="btn-brass-solid" data-play-video="' +
      escapeHtml(fv.youtubeUrl) +
      '" data-video-title="' +
      escapeHtml(fv.title) +
      '" data-video-section="featured_portfolio">시네마 모드로 영상 보기 ▶</button>' +
      '</div>' +
      '</div>' +
      '<div class="qa-card">' +
      '<div class="qa-header-row">' +
      '<div>' +
      '<span class="mono-badge">' +
      escapeHtml(qa.badge) +
      '</span>' +
      '<h3>' +
      escapeHtml(qa.title) +
      '</h3>' +
      '<p class="qa-subtitle">' +
      escapeHtml(qa.subtitle) +
      '</p>' +
      '</div>' +
      '<div class="qa-header-actions">' +
      openQaViewerBtnHtml +
      downloadXlsxBtnHtml +
      driveBtnHtml +
      '</div>' +
      '</div>' +
      '<div class="qa-metrics-grid">' +
      metricsHtml +
      '</div>' +
      gumaHtml +
      autoDemoCardHtml +
      '<div class="accordion-wrap" style="margin-bottom:0">' +
      '<button type="button" class="accordion-trigger" aria-expanded="false" aria-controls="acc-qa-summary">' +
      '<span>검증 요약 상세 보기</span>' +
      '<span class="accordion-chevron" aria-hidden="true">▼</span>' +
      '</button>' +
      '<div class="accordion-body" id="acc-qa-summary" hidden>' +
      '<ul class="detail-list">' +
      qaDetailsHtml +
      '</ul>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function renderPanel4Html() {
    const ch = DATA.youtubeChannel;
    const cardsHtml = DATA.videoArchive
      .map(function (v) {
        const ytId = extractYouTubeId(v.youtubeUrl);
        const thumbUrl = ytId
          ? 'https://i.ytimg.com/vi/' + ytId + '/hqdefault.jpg'
          : getFallbackVideoThumbSvg(v.title);
        const fallback = getFallbackVideoThumbSvg(v.title);

        const tags = v.tags
          .map(function (t) {
            return '<span class="tech-tag">' + escapeHtml(t) + '</span>';
          })
          .join('');

        return (
          '<article class="archive-card">' +
          '<button type="button" class="video-thumb-btn" data-play-video="' +
          escapeHtml(v.youtubeUrl) +
          '" data-video-title="' +
          escapeHtml(v.title) +
          '" data-video-section="youtube_archive" aria-label="영상 재생: ' +
          escapeHtml(v.title) +
          '">' +
          '<img class="video-thumb-img" src="' +
          thumbUrl +
          '" alt="' +
          escapeHtml(v.title) +
          ' 썸네일" loading="lazy" onerror="this.onerror=null;this.src=\'' +
          fallback +
          '\';">' +
          '<span class="video-play-halo" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
          '</span>' +
          (v.duration
            ? '<span class="video-duration-pill">' + escapeHtml(v.duration) + '</span>'
            : '') +
          '</button>' +
          '<div class="archive-card-body">' +
          '<h3 class="archive-card-title">' +
          escapeHtml(v.title) +
          '</h3>' +
          '<p class="archive-card-goal">' +
          escapeHtml(v.goal) +
          '</p>' +
          '<div class="tag-list">' +
          tags +
          '</div>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    return (
      '<div class="yt-banner-card">' +
      '<div class="yt-banner-copy">' +
      '<span class="mono-badge">' +
      escapeHtml(ch.badge) +
      '</span>' +
      '<h3>' +
      escapeHtml(ch.name) +
      '</h3>' +
      '<p>' +
      escapeHtml(ch.description) +
      '</p>' +
      '<p class="yt-direction">' +
      escapeHtml(ch.direction) +
      '</p>' +
      '</div>' +
      '<a class="btn-brass-solid" href="' +
      sanitizeUrl(ch.channelUrl) +
      '" target="_blank" rel="noopener" data-visit-yt="true">' +
      '유튜브 채널 방문하기 ↗</a>' +
      '</div>' +
      '<div class="video-archive-grid">' +
      cardsHtml +
      '</div>'
    );
  }

  function getNovelStats(novel) {
    const cleanChars = String(novel.content || '').replace(/\s+/g, '').length;
    const estMinutes = Math.max(1, Math.round(cleanChars / 500));
    return { cleanChars: cleanChars, estMinutes: estMinutes };
  }

  function renderPanel5Html() {
    const cards = NOVELS.map(function (novel) {
      const stats = getNovelStats(novel);
      const teaser =
        novel.firstSentence ||
        String(novel.content || '')
          .split('\n')
          .find(function (line) {
            return line.trim().length > 10 && !line.trim().startsWith('[');
          }) ||
        '';

      return (
        '<article class="novel-card">' +
        '<div class="novel-card-meta">' +
        '<div class="novel-meta-left">' +
        '<span class="novel-cat-badge">[' +
        escapeHtml(novel.category) +
        ']</span>' +
        '<span class="novel-genre">' +
        escapeHtml(novel.genre) +
        '</span>' +
        '</div>' +
        '<span class="novel-read-time">약 ' +
        stats.estMinutes +
        '분 읽기</span>' +
        '</div>' +
        '<h3 class="novel-card-title">' +
        escapeHtml(novel.title) +
        '</h3>' +
        '<p class="novel-logline">' +
        escapeHtml(novel.logline) +
        '</p>' +
        '<div class="novel-teaser-box">' +
        '<span class="novel-teaser-label">FIRST SENTENCE TEASER</span>' +
        '<p class="novel-teaser-quote">“' +
        escapeHtml(teaser) +
        '”</p>' +
        '</div>' +
        '<div class="novel-card-footer">' +
        '<span class="novel-char-count">' +
        stats.cleanChars.toLocaleString('ko-KR') +
        '자 (공백 제외)</span>' +
        '<button type="button" class="btn-brass-solid" data-open-novel="' +
        escapeHtml(novel.id) +
        '">촛불 리더기로 읽기 ↗</button>' +
        '</div>' +
        '</article>'
      );
    }).join('');

    return '<div class="novels-grid">' + cards + '</div>';
  }

  function renderPanelBodyHtml(candleId) {
    switch (candleId) {
      case 1:
        return renderPanel1Html();
      case 2:
        return renderPanel2Html();
      case 3:
        return renderPanel3Html();
      case 4:
        return renderPanel4Html();
      case 5:
        return renderPanel5Html();
      default:
        return '';
    }
  }

  function renderShowcase() {
    if (!dom.showcaseWorkspace || !dom.showcasePanels) return;

    const hasLit = state.litCandles.size > 0;
    if (!hasLit) {
      dom.showcaseEmptyState.hidden = false;
      dom.showcaseWorkspace.hidden = true;
      return;
    }

    dom.showcaseEmptyState.hidden = true;
    dom.showcaseWorkspace.hidden = false;

    // 상단 모드 바 업데이트
    if (dom.viewModeBadge) {
      dom.viewModeBadge.textContent =
        state.viewMode === 'all' ? '5개 전체 통합 보기' : '단일 촛불 집중 보기';
    }
    if (dom.toggleViewModeBtn) {
      dom.toggleViewModeBtn.textContent =
        state.viewMode === 'all' ? '선택한 촛불만 보기' : '5개 전체 통합 보기';
    }

    if (dom.modeCandlePills) {
      dom.modeCandlePills.innerHTML = DATA.candlesMeta
        .map(function (meta) {
          const isLit = state.litCandles.has(meta.id);
          const isActive = state.activeCandleId === meta.id;
          return (
            '<button type="button" class="mode-pill' +
            (isLit ? ' is-lit' : '') +
            (isActive ? ' is-active' : '') +
            '" data-pill-candle="' +
            meta.id +
            '">' +
            '<span class="pill-dot" aria-hidden="true"></span>' +
            '<span>' +
            escapeHtml(meta.numeral) +
            ' ' +
            escapeHtml(meta.title) +
            '</span>' +
            '</button>'
          );
        })
        .join('');
    }

    const idsToRender =
      state.viewMode === 'all'
        ? DATA.candlesMeta.map(function (m) {
            return m.id;
          })
        : [state.activeCandleId || 1];

    dom.showcasePanels.innerHTML = idsToRender
      .map(function (id) {
        const meta = DATA.candlesMeta.find(function (m) {
          return m.id === id;
        });
        if (!meta) return '';
        return (
          '<section class="showcase-panel" id="panel-candle-' +
          id +
          '" aria-labelledby="panel-title-' +
          id +
          '">' +
          '<header class="panel-header">' +
          '<div>' +
          '<p class="panel-eyebrow">' +
          escapeHtml(meta.panelEyebrow) +
          '</p>' +
          '<h2 class="panel-title" id="panel-title-' +
          id +
          '">' +
          escapeHtml(meta.panelTitle) +
          '</h2>' +
          '</div>' +
          '<span class="mono-badge">' +
          escapeHtml(meta.numeral) +
          ' · ' +
          escapeHtml(meta.subtitle) +
          '</span>' +
          '</header>' +
          renderPanelBodyHtml(id) +
          '</section>'
        );
      })
      .join('');
  }

  // ---- Candle Ignition & Mode Transitions ----
  function handleCandleSelect(candleId) {
    const meta = DATA.candlesMeta.find(function (m) {
      return m.id === candleId;
    });
    if (!meta) return;

    const pan = ((candleId - 3) / 2) * 0.52;
    const wasLit = state.litCandles.has(candleId);

    if (!wasLit) {
      state.litCandles.add(candleId);
      if (SOUND) {
        SOUND.setLitCount(state.litCandles.size);
        SOUND.playCandleIgnite(pan, candleId);
      }
      trackEvent('ignite_candle', {
        candle_id: candleId,
        candle_title: meta.title,
        lit_count: state.litCandles.size
      });
    } else {
      if (SOUND) {
        SOUND.playCandleFocus(pan);
      }
    }

    state.activeCandleId = candleId;
    if (state.viewMode !== 'all') {
      state.viewMode = 'single';
    }

    syncCandleVisuals();
    renderShowcase();

    if (state.viewMode === 'all') {
      const targetPanel = document.getElementById('panel-candle-' + candleId);
      if (targetPanel) {
        targetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (dom.showcaseContainer) {
      const rect = dom.showcaseContainer.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.68) {
        dom.showcaseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function clearLightAllTimers() {
    state.lightAllTimers.forEach(function (t) {
      clearTimeout(t);
    });
    state.lightAllTimers = [];
  }

  function lightAllCandles() {
    clearLightAllTimers();
    const unlitIds = [];
    DATA.candlesMeta.forEach(function (meta) {
      if (!state.litCandles.has(meta.id)) {
        unlitIds.push(meta.id);
      }
    });

    if (SOUND) {
      SOUND.playLightAll(unlitIds.length ? unlitIds : [1, 2, 3, 4, 5]);
    }

    state.viewMode = 'all';
    if (!state.activeCandleId) {
      state.activeCandleId = 1;
    }

    if (unlitIds.length === 0) {
      syncCandleVisuals();
      renderShowcase();
      trackEvent('light_all_candles', { newly_lit: 0 });
      return;
    }

    // 110ms 시차로 순차 점화
    unlitIds.forEach(function (id, idx) {
      const timerId = setTimeout(function () {
        state.litCandles.add(id);
        if (SOUND) {
          SOUND.setLitCount(state.litCandles.size);
        }
        syncCandleVisuals();
        if (idx === unlitIds.length - 1) {
          renderShowcase();
        }
      }, idx * 110);
      state.lightAllTimers.push(timerId);
    });

    // 패널은 즉시 준비해 스크롤 탐색이 가능하도록 렌더링
    renderShowcase();
    trackEvent('light_all_candles', { newly_lit: unlitIds.length });

    if (dom.showcaseContainer) {
      const rect = dom.showcaseContainer.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.72) {
        dom.showcaseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // ---- Cinema Video Lightbox (Auto-Ducking) ----
  function openVideoLightbox(youtubeUrl, title, sourceSection) {
    const ytId = extractYouTubeId(youtubeUrl);
    if (!ytId) {
      showToast('유효한 유튜브 영상 링크를 확인해 주세요.');
      return;
    }

    state.lastTriggerEl = document.activeElement;

    if (SOUND) {
      SOUND.playSoftClick();
      SOUND.setDuck('video-modal', true);
    }
    syncSoundUi();

    if (dom.lightboxTitle) dom.lightboxTitle.textContent = title || '포트폴리오 영상';
    if (dom.lightboxBadge) {
      dom.lightboxBadge.textContent =
        sourceSection === 'ios_app_demo'
          ? 'IOS APP DEMO'
          : sourceSection === 'qa_guma_demo'
          ? 'AI APP RESULT DEMO'
          : sourceSection === 'qa_automation_demo'
          ? 'QA TEST AUTOMATION'
          : sourceSection === 'youtube_archive'
          ? 'YOUTUBE ARCHIVE'
          : 'FEATURED SHOWREEL';
    }
    if (dom.lightboxExternalLink) {
      dom.lightboxExternalLink.href = 'https://www.youtube.com/watch?v=' + ytId;
    }
    if (dom.lightboxIframe) {
      dom.lightboxIframe.src =
        'https://www.youtube-nocookie.com/embed/' + ytId + '?autoplay=1&rel=0';
    }

    dom.videoLightbox.hidden = false;
    dom.body.classList.add('modal-open');

    if (dom.lightboxCloseBtn) {
      dom.lightboxCloseBtn.focus();
    }

    trackEvent('play_video', {
      video_title: title || '',
      youtube_id: ytId,
      source_section: sourceSection || 'unknown'
    });
  }

  function syncModalBodyLock() {
    const anyOpen =
      (dom.videoLightbox && !dom.videoLightbox.hidden) ||
      (dom.ebookModal && !dom.ebookModal.hidden) ||
      (dom.qaModal && !dom.qaModal.hidden) ||
      (dom.rmModal && !dom.rmModal.hidden) ||
      (dom.clModal && !dom.clModal.hidden);
    dom.body.classList.toggle('modal-open', Boolean(anyOpen));
  }

  function closeVideoLightbox() {
    if (!dom.videoLightbox || dom.videoLightbox.hidden) return;
    if (dom.lightboxIframe) {
      dom.lightboxIframe.src = '';
    }
    dom.videoLightbox.hidden = true;
    syncModalBodyLock();

    if (SOUND) {
      SOUND.setDuck('video-modal', false);
      SOUND.playSoftClick();
    }
    syncSoundUi();

    if (state.lastTriggerEl && typeof state.lastTriggerEl.focus === 'function') {
      state.lastTriggerEl.focus();
    }
  }

  // ---- Candle E-Book Reader ----
  function formatManuscriptHtml(rawText) {
    const paragraphs = String(rawText || '')
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/);

    return paragraphs
      .map(function (block) {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (trimmed === '---') {
          return '<hr class="manuscript-rule">';
        }
        const isSectionHeader =
          /^\[[^\]]+\]$/.test(trimmed) ||
          (/^#/.test(trimmed) && trimmed.length < 48);
        if (isSectionHeader) {
          return (
            '<p class="manuscript-section-heading">' +
            escapeHtml(trimmed) +
            '</p>'
          );
        }
        return '<p>' + escapeHtml(trimmed).replace(/\n/g, '<br>') + '</p>';
      })
      .join('');
  }

  function applyReaderPreferences() {
    if (!dom.ebookModal || !dom.ebookManuscript) return;
    dom.ebookModal.setAttribute('data-reader-theme', state.readerTheme);
    dom.ebookModal.setAttribute('data-reader-font', state.readerFont);
    dom.ebookManuscript.style.fontSize = state.readerFontSize + 'px';
    if (dom.ebookFontSizeLabel) {
      dom.ebookFontSizeLabel.textContent = state.readerFontSize + 'px';
    }
    if (dom.ebookFontSerif) {
      dom.ebookFontSerif.classList.toggle('is-active', state.readerFont === 'serif');
    }
    if (dom.ebookFontSans) {
      dom.ebookFontSans.classList.toggle('is-active', state.readerFont === 'sans');
    }
    dom.ebookModal.querySelectorAll('.reader-theme-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-theme') === state.readerTheme);
    });
  }

  function updateReaderScrollProgress() {
    if (!dom.ebookScrollBody || !state.activeNovelId) return;
    const el = dom.ebookScrollBody;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct =
      scrollable <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((el.scrollTop / scrollable) * 100)));

    if (dom.ebookProgressBar) dom.ebookProgressBar.style.width = pct + '%';
    if (dom.ebookProgressText) dom.ebookProgressText.textContent = pct + '%';
    if (pct > telemetry.currentNovelMaxPct) telemetry.currentNovelMaxPct = pct;

    if (pct >= 90 && !state.completedNovels.has(state.activeNovelId)) {
      state.completedNovels.add(state.activeNovelId);
      const novel = NOVELS.find(function (n) {
        return n.id === state.activeNovelId;
      });
      trackEvent('complete_novel_read', {
        novel_id: state.activeNovelId,
        novel_title: novel ? novel.title : '',
        progress_percent: pct
      });
    }
  }

  function openNovelReader(novelId) {
    const novel = NOVELS.find(function (n) {
      return n.id === novelId;
    });
    if (!novel) return;

    state.lastTriggerEl = document.activeElement;
    state.activeNovelId = novel.id;
    telemetry.currentNovelMaxPct = 0;
    telemetry.novelOpenedAtMs = Date.now();

    if (SOUND) {
      SOUND.playPaperRustle();
    }

    const stats = getNovelStats(novel);
    if (dom.ebookCategoryBadge) dom.ebookCategoryBadge.textContent = novel.category;
    if (dom.ebookTitle) dom.ebookTitle.textContent = novel.title;
    if (dom.ebookStats) {
      dom.ebookStats.textContent =
        stats.cleanChars.toLocaleString('ko-KR') + '자 · 약 ' + stats.estMinutes + '분 소요';
    }
    if (dom.manuscriptGenre) dom.manuscriptGenre.textContent = novel.category + ' · ' + novel.genre;
    if (dom.manuscriptTitle) dom.manuscriptTitle.textContent = novel.title;
    if (dom.manuscriptLogline) dom.manuscriptLogline.textContent = novel.logline;
    if (dom.ebookContent) dom.ebookContent.innerHTML = formatManuscriptHtml(novel.content);

    applyReaderPreferences();
    dom.ebookModal.hidden = false;
    dom.body.classList.add('modal-open');

    if (dom.ebookScrollBody) {
      dom.ebookScrollBody.scrollTop = 0;
      updateReaderScrollProgress();
      dom.ebookScrollBody.focus();
    }

    trackEvent('read_novel', {
      novel_id: novel.id,
      novel_title: novel.title,
      category: novel.category
    });
  }

  function closeNovelReader() {
    if (!dom.ebookModal || dom.ebookModal.hidden) return;
    if (SOUND) {
      SOUND.playPaperRustle();
    }
    const closingNovelId = state.activeNovelId;
    const closingNovel = NOVELS.find(function (n) {
      return n.id === closingNovelId;
    });
    if (closingNovelId) {
      trackEvent('close_novel', {
        novel_id: closingNovelId,
        novel_title: closingNovel ? closingNovel.title : '',
        max_progress_percent: telemetry.currentNovelMaxPct
      });
    }
    dom.ebookModal.hidden = true;
    state.activeNovelId = null;
    syncModalBodyLock();

    if (state.lastTriggerEl && typeof state.lastTriggerEl.focus === 'function') {
      state.lastTriggerEl.focus();
    }
  }

  // ---- QA Deliverable 3-Sheet Web Viewer ----
  function syncQaControlsForSheet() {
    if (!QA_BOOK || !dom.qaFilterBar) return;
    const sheet = state.qaSheet;

    if (dom.qaTabsBar) {
      dom.qaTabsBar.querySelectorAll('.qa-sheet-tab').forEach(function (tab) {
        const active = tab.getAttribute('data-qa-sheet') === sheet;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    if (sheet === 'report') {
      dom.qaFilterBar.hidden = true;
      return;
    }

    dom.qaFilterBar.hidden = false;

    if (dom.qaCategoryFilter) {
      if (sheet === 'test-cases') {
        const majors = [];
        QA_BOOK.testCases.forEach(function (tc) {
          if (tc.major && majors.indexOf(tc.major) === -1) majors.push(tc.major);
        });
        dom.qaCategoryFilter.hidden = false;
        dom.qaCategoryFilter.innerHTML =
          '<option value="ALL">전체 대분류 (' + majors.length + ')</option>' +
          majors
            .map(function (m) {
              return '<option value="' + escapeHtml(m) + '">' + escapeHtml(m) + '</option>';
            })
            .join('');
        dom.qaCategoryFilter.value =
          majors.indexOf(state.qaCategory) !== -1 ? state.qaCategory : 'ALL';
      } else {
        dom.qaCategoryFilter.hidden = true;
      }
    }

    if (dom.qaStatusPills) {
      const options =
        sheet === 'test-cases'
          ? [
              { val: 'ALL', label: '전체' },
              { val: 'PASS', label: 'PASS' },
              { val: 'FAIL', label: 'FAIL' }
            ]
          : [
              { val: 'ALL', label: '전체' },
              { val: 'Major', label: 'Major' },
              { val: 'Minor', label: 'Minor' },
              { val: 'Trivial', label: 'Trivial' }
            ];
      dom.qaStatusPills.innerHTML = options
        .map(function (opt) {
          const isActive = state.qaStatus === opt.val;
          return (
            '<button type="button" class="qa-filter-pill' +
            (isActive ? ' is-active' : '') +
            '" data-qa-status="' +
            escapeHtml(opt.val) +
            '">' +
            escapeHtml(opt.label) +
            '</button>'
          );
        })
        .join('');
    }
  }

  function renderQaWorkbookBody() {
    if (!QA_BOOK || !dom.qaModalBody) return;
    const q = state.qaSearch.trim().toLowerCase();

    if (state.qaSheet === 'test-cases') {
      const rows = QA_BOOK.testCases.filter(function (tc) {
        if (state.qaCategory !== 'ALL' && tc.major !== state.qaCategory) return false;
        if (state.qaStatus !== 'ALL' && tc.result !== state.qaStatus) return false;
        if (q) {
          const hay = (
            tc.id +
            ' ' +
            tc.major +
            ' ' +
            tc.middle +
            ' ' +
            tc.minor +
            ' ' +
            tc.title +
            ' ' +
            tc.steps +
            ' ' +
            tc.expected +
            ' ' +
            tc.actual
          ).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });

      if (dom.qaVisibleCount) {
        dom.qaVisibleCount.textContent = rows.length + ' / ' + QA_BOOK.testCases.length + '건';
      }

      if (!rows.length) {
        dom.qaModalBody.innerHTML =
          '<p class="qa-empty-msg">검색 조건에 일치하는 테스트케이스가 없습니다.</p>';
        return;
      }

      const bodyRows = rows
        .map(function (tc) {
          const resCls = tc.result === 'PASS' ? 'qa-badge-pass' : 'qa-badge-fail';
          return (
            '<tr>' +
            '<td class="mono-num qa-col-id">' +
            escapeHtml(tc.id) +
            '</td>' +
            '<td class="qa-col-cat"><strong>' +
            escapeHtml(tc.major) +
            '</strong><span>' +
            escapeHtml(tc.middle) +
            ' · ' +
            escapeHtml(tc.minor) +
            '</span></td>' +
            '<td class="qa-col-title">' +
            escapeHtml(tc.title) +
            '</td>' +
            '<td>' +
            escapeHtml(tc.steps) +
            '</td>' +
            '<td>' +
            escapeHtml(tc.expected) +
            '</td>' +
            '<td>' +
            escapeHtml(tc.actual) +
            '</td>' +
            '<td class="qa-col-status"><span class="' +
            resCls +
            '">' +
            escapeHtml(tc.result) +
            '</span></td>' +
            '<td class="mono-num qa-col-date">' +
            escapeHtml(tc.date) +
            '</td>' +
            '</tr>'
          );
        })
        .join('');

      dom.qaModalBody.innerHTML =
        '<div class="qa-table-wrap">' +
        '<table class="qa-table">' +
        '<thead><tr>' +
        '<th>TC-ID</th><th>분류 (대/중/소)</th><th>테스트 제목</th><th>테스트 절차</th><th>기대결과</th><th>실제 결과</th><th>결과</th><th>수행일</th>' +
        '</tr></thead>' +
        '<tbody>' +
        bodyRows +
        '</tbody></table></div>';
      return;
    }

    if (state.qaSheet === 'defects') {
      const rows = QA_BOOK.defects.filter(function (df) {
        if (state.qaStatus !== 'ALL' && df.severity !== state.qaStatus) return false;
        if (q) {
          const hay = (
            df.id +
            ' ' +
            df.severity +
            ' ' +
            df.title +
            ' ' +
            df.detail +
            ' ' +
            df.note
          ).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });

      if (dom.qaVisibleCount) {
        dom.qaVisibleCount.textContent = rows.length + ' / ' + QA_BOOK.defects.length + '건';
      }

      if (!rows.length) {
        dom.qaModalBody.innerHTML =
          '<p class="qa-empty-msg">검색 조건에 일치하는 결함 항목이 없습니다.</p>';
        return;
      }

      const bodyRows = rows
        .map(function (df) {
          const sevCls =
            df.severity === 'Major'
              ? 'qa-sev-major'
              : df.severity === 'Minor'
              ? 'qa-sev-minor'
              : 'qa-sev-trivial';
          return (
            '<tr>' +
            '<td class="mono-num qa-col-id">' +
            escapeHtml(df.id) +
            '</td>' +
            '<td class="qa-col-status"><span class="' +
            sevCls +
            '">' +
            escapeHtml(df.severity) +
            '</span></td>' +
            '<td class="qa-col-freq">' +
            escapeHtml(df.frequency) +
            '</td>' +
            '<td class="qa-col-title">' +
            escapeHtml(df.title) +
            '</td>' +
            '<td>' +
            escapeHtml(df.detail || '-') +
            '</td>' +
            '<td>' +
            escapeHtml(df.note || '-') +
            '</td>' +
            '<td class="mono-num qa-col-date">' +
            escapeHtml(df.date) +
            '</td>' +
            '</tr>'
          );
        })
        .join('');

      dom.qaModalBody.innerHTML =
        '<div class="qa-table-wrap">' +
        '<table class="qa-table">' +
        '<thead><tr>' +
        '<th>결함ID</th><th>심각도</th><th>재현빈도</th><th>결함 제목</th><th>상세 내용</th><th>조치/비고</th><th>식별일</th>' +
        '</tr></thead>' +
        '<tbody>' +
        bodyRows +
        '</tbody></table></div>';
      return;
    }

    // Sheet 3: 테스트 결과 보고서
    const r = QA_BOOK.report;
    const conclusionsHtml = (r.conclusions || [])
      .map(function (line) {
        return '<li>' + escapeHtml(line) + '</li>';
      })
      .join('');

    dom.qaModalBody.innerHTML =
      '<div class="qa-report-wrap">' +
      '<div class="qa-report-overview">' +
      '<div><span>테스트 대상</span><strong>' +
      escapeHtml(r.overview.target) +
      '</strong></div>' +
      '<div><span>목적</span><strong>' +
      escapeHtml(r.overview.purpose) +
      '</strong></div>' +
      '<div><span>작성자 / 팀</span><strong>' +
      escapeHtml(r.overview.author) +
      ' (' +
      escapeHtml(r.overview.organization) +
      ')</strong></div>' +
      '<div><span>수행 기준일</span><strong class="mono-num">' +
      escapeHtml(r.overview.date) +
      '</strong></div>' +
      '</div>' +
      '<div class="qa-report-kpis">' +
      '<div class="qa-kpi-card"><span>총 설계 TC 수</span><strong class="mono-num">' +
      r.initialSummary.totalTc +
      '건</strong><p>미실행 0건 · 100% 수행</p></div>' +
      '<div class="qa-kpi-card"><span>1차 수행 PASS율</span><strong class="mono-num">' +
      escapeHtml(r.initialSummary.passRate) +
      '</strong><p>PASS ' +
      r.initialSummary.pass +
      ' · FAIL ' +
      r.initialSummary.fail +
      '</p></div>' +
      '<div class="qa-kpi-card is-accent"><span>보완 후 최종 PASS율</span><strong class="mono-num">' +
      escapeHtml(r.followUpResults.finalPassRate) +
      '</strong><p>PASS ' +
      r.followUpResults.finalPass +
      ' · 잔여 ' +
      r.followUpResults.finalFail +
      '</p></div>' +
      '<div class="qa-kpi-card"><span>식별 결함 총계</span><strong class="mono-num">' +
      r.defectMetrics.totalBugs +
      '건</strong><p>Critical 0 · Major ' +
      r.defectMetrics.major +
      ' · Minor ' +
      r.defectMetrics.minor +
      ' · Trivial ' +
      r.defectMetrics.trivial +
      '</p></div>' +
      '</div>' +
      '<div class="qa-report-grid">' +
      '<div class="qa-report-box">' +
      '<h4>심각도별 결함 분포 (Defect Metrics)</h4>' +
      '<ul class="qa-breakdown-list">' +
      '<li><span>Critical (치명적)</span><strong class="mono-num">0건</strong></li>' +
      '<li><span>Major (주요)</span><strong class="mono-num">' +
      r.defectMetrics.major +
      '건</strong></li>' +
      '<li><span>Minor (경미)</span><strong class="mono-num">' +
      r.defectMetrics.minor +
      '건</strong></li>' +
      '<li><span>Trivial (사소)</span><strong class="mono-num">' +
      r.defectMetrics.trivial +
      '건</strong></li>' +
      '</ul>' +
      '</div>' +
      '<div class="qa-report-box">' +
      '<h4>결함 보완 · 유지 검토 결과</h4>' +
      '<ul class="qa-breakdown-list">' +
      '<li><span>기능 수정 반영 (Fixed)</span><strong class="mono-num">' +
      r.followUpResults.fixed +
      '건</strong></li>' +
      '<li><span>수정 불필요 판정</span><strong class="mono-num">' +
      r.followUpResults.noFixNeeded +
      '건</strong></li>' +
      '<li><span>추후 고도화 검토</span><strong class="mono-num">' +
      r.followUpResults.deferred +
      '건</strong></li>' +
      '</ul>' +
      '</div>' +
      '</div>' +
      '<div class="qa-report-box">' +
      '<h4>종합 의견 및 결론 (Conclusion)</h4>' +
      '<ul class="detail-list">' +
      conclusionsHtml +
      '</ul>' +
      '</div>' +
      '</div>';
  }

  function openQaWorkbookModal(initialSheet) {
    if (!QA_BOOK || !dom.qaModal) return;
    state.lastTriggerEl = document.activeElement;
    state.qaSheet = initialSheet || 'test-cases';
    state.qaSearch = '';
    state.qaCategory = 'ALL';
    state.qaStatus = 'ALL';

    if (dom.qaSearchInput) dom.qaSearchInput.value = '';
    if (dom.qaModalDownloadLink) {
      dom.qaModalDownloadLink.href = encodeAssetPath(QA_BOOK.fileName, true);
    }

    syncQaControlsForSheet();
    renderQaWorkbookBody();

    dom.qaModal.hidden = false;
    syncModalBodyLock();

    if (SOUND) SOUND.playPaperRustle();
    if (dom.qaModalBody) {
      dom.qaModalBody.scrollTop = 0;
    }
    if (dom.qaModalCloseBtn) {
      dom.qaModalCloseBtn.focus();
    }

    trackEvent('open_qa_portfolio', {
      source: 'web_workbook_viewer',
      sheet: state.qaSheet,
      tc_count: QA_BOOK.testCases.length
    });
  }

  function closeQaWorkbookModal() {
    if (!dom.qaModal || dom.qaModal.hidden) return;
    if (SOUND) SOUND.playSoftClick();
    dom.qaModal.hidden = true;
    syncModalBodyLock();
    if (state.lastTriggerEl && typeof state.lastTriggerEl.focus === 'function') {
      state.lastTriggerEl.focus();
    }
  }

  // ---- Cover Letter Dedicated Web Reader Modal ----
  function renderCoverLetterModal() {
    const cl = DATA.coverLetter;
    if (!cl || !dom.clModal || state.clRendered) return;

    if (dom.clModalBadge) dom.clModalBadge.textContent = cl.badge || 'COVER LETTER';
    if (dom.clModalTitle) dom.clModalTitle.textContent = cl.title || '이준영 자기소개서';
    if (dom.clModalSubtitle) dom.clModalSubtitle.textContent = cl.subtitle || '';

    const sections = Array.isArray(cl.sections) ? cl.sections : [];

    if (dom.clTocBar) {
      dom.clTocBar.innerHTML = sections
        .map(function (sec, idx) {
          return (
            '<button type="button" class="cl-toc-pill' +
            (idx === 0 ? ' is-active' : '') +
            '" data-cl-jump="' +
            escapeHtml(sec.id) +
            '">' +
            '<span class="cl-toc-num">' +
            escapeHtml(sec.num) +
            '</span>' +
            '<span>' +
            escapeHtml(sec.tabLabel || sec.title) +
            '</span>' +
            '</button>'
          );
        })
        .join('');
    }

    const highlightsHtml = (cl.highlights || [])
      .map(function (h) {
        return (
          '<div class="cl-highlight-item">' +
          '<span>' +
          escapeHtml(h.label) +
          '</span>' +
          '<strong>' +
          escapeHtml(h.value) +
          '</strong>' +
          '</div>'
        );
      })
      .join('');

    const sectionsHtml = sections
      .map(function (sec) {
        let bodyHtml = '';
        if (Array.isArray(sec.paragraphs) && sec.paragraphs.length) {
          bodyHtml +=
            '<div class="cl-paragraphs">' +
            sec.paragraphs
              .map(function (p) {
                return '<p>' + escapeHtml(p) + '</p>';
              })
              .join('') +
            '</div>';
        }
        if (Array.isArray(sec.careerItems) && sec.careerItems.length) {
          bodyHtml +=
            '<div class="cl-career-stack">' +
            sec.careerItems
              .map(function (item) {
                const tasksHtml = (item.tasks || [])
                  .map(function (t) {
                    return '<li>' + escapeHtml(t) + '</li>';
                  })
                  .join('');
                return (
                  '<div class="cl-career-card">' +
                  '<div class="cl-career-card-top">' +
                  '<span class="cl-career-period mono-num">' +
                  escapeHtml(item.period) +
                  '</span>' +
                  '<strong class="cl-career-org">' +
                  escapeHtml(item.org) +
                  '</strong>' +
                  '</div>' +
                  '<h4 class="cl-career-role">' +
                  escapeHtml(item.role) +
                  '</h4>' +
                  (item.companyDesc
                    ? '<p class="cl-career-company-desc">' +
                      escapeHtml(item.companyDesc) +
                      '</p>'
                    : '') +
                  '<ul class="cl-career-tasks">' +
                  tasksHtml +
                  '</ul>' +
                  '</div>'
                );
              })
              .join('') +
            '</div>';
        }

        return (
          '<section class="cl-chapter-section" id="cl-sec-' +
          escapeHtml(sec.id) +
          '" data-cl-section="' +
          escapeHtml(sec.id) +
          '">' +
          '<header class="cl-chapter-head">' +
          '<span class="cl-chapter-num">' +
          escapeHtml(sec.num) +
          '</span>' +
          '<h3 class="cl-chapter-title">' +
          escapeHtml(sec.title) +
          '</h3>' +
          '</header>' +
          (sec.lead ? '<p class="cl-chapter-lead">' + escapeHtml(sec.lead) + '</p>' : '') +
          bodyHtml +
          '</section>'
        );
      })
      .join('');

    const qaBtnHtml = QA_BOOK
      ? '<button type="button" class="cl-action-solid" data-cl-open-qa="test-cases">QA 219 TC 산출물 뷰어 열기 ↗</button>'
      : '';
    const autoBtnHtml =
      DATA.qaPortfolio && DATA.qaPortfolio.automationDemo && DATA.qaPortfolio.automationDemo.youtubeUrl
        ? '<button type="button" class="cl-action-outline" data-cl-play-auto="true">Appium 자동화 시연 영상 보기 ▶</button>'
        : '';
    const resumeBtnHtml = DATA.resumeData
      ? '<button type="button" class="cl-action-outline" data-cl-open-resume="true">공식 웹 이력서 보기 ✦</button>'
      : '';

    const relatedHtml =
      '<div class="cl-related-card">' +
      '<div class="cl-related-head">' +
      '<strong>포트폴리오 근거 산출물 바로가기</strong>' +
      '<span>자기소개서에서 언급한 QA 테스트케이스, 모바일 테스트 자동화 시연 영상 및 공식 이력서를 바로 확인할 수 있습니다.</span>' +
      '</div>' +
      '<div class="cl-related-actions">' +
      qaBtnHtml +
      autoBtnHtml +
      resumeBtnHtml +
      '</div>' +
      '</div>';

    if (dom.clModalBody) {
      dom.clModalBody.innerHTML =
        '<article class="cl-reader-article">' +
        (highlightsHtml ? '<div class="cl-highlights-strip">' + highlightsHtml + '</div>' : '') +
        sectionsHtml +
        relatedHtml +
        '</article>';
    }

    state.clActiveSection = sections.length ? sections[0].id : '';
    state.clRendered = true;
  }

  function applyCoverLetterPreferences() {
    if (!dom.clModal) return;
    dom.clModal.setAttribute('data-cl-theme', state.clTheme);
    dom.clModal.style.setProperty('--cl-font-size', state.clFontSize + 'px');
    if (dom.clFontSizeLabel) {
      dom.clFontSizeLabel.textContent = state.clFontSize + 'px';
    }
    dom.clModal.querySelectorAll('[data-cl-theme-btn]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-cl-theme-btn') === state.clTheme);
    });
  }

  function setActiveCoverLetterToc(sectionId) {
    if (!sectionId || !dom.clTocBar) return;
    state.clActiveSection = sectionId;
    dom.clTocBar.querySelectorAll('[data-cl-jump]').forEach(function (pill) {
      pill.classList.toggle('is-active', pill.getAttribute('data-cl-jump') === sectionId);
    });
  }

  function updateCoverLetterScroll() {
    if (!dom.clModalBody || !dom.clModal || dom.clModal.hidden) return;
    const el = dom.clModalBody;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct =
      scrollable <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((el.scrollTop / scrollable) * 100)));

    if (dom.clProgressBar) dom.clProgressBar.style.width = pct + '%';
    if (dom.clProgressText) dom.clProgressText.textContent = pct + '%';
    if (pct > telemetry.currentCoverMaxPct) telemetry.currentCoverMaxPct = pct;
    if (pct > telemetry.maxCoverPct) telemetry.maxCoverPct = pct;

    const sections = el.querySelectorAll('.cl-chapter-section');
    if (sections.length && Date.now() > state.clTocLockUntil) {
      const containerTop = el.getBoundingClientRect().top;
      let currentId = sections[0].getAttribute('data-cl-section') || '';
      sections.forEach(function (sec) {
        const relTop = sec.getBoundingClientRect().top - containerTop;
        if (relTop <= 110) {
          currentId = sec.getAttribute('data-cl-section') || currentId;
        }
      });
      if (scrollable > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
        currentId = sections[sections.length - 1].getAttribute('data-cl-section') || currentId;
      }
      if (currentId && currentId !== state.clActiveSection) {
        setActiveCoverLetterToc(currentId);
      }
    }

    if (pct >= 90 && !state.coverLetterCompleted) {
      state.coverLetterCompleted = true;
      trackEvent('complete_cover_letter_read', { progress_percent: pct });
    }
  }

  function openCoverLetterModal(source, sectionId) {
    if (!DATA.coverLetter || !dom.clModal) return;
    renderCoverLetterModal();
    state.lastTriggerEl = document.activeElement;
    telemetry.currentCoverMaxPct = 0;
    telemetry.coverOpenedAtMs = Date.now();

    applyCoverLetterPreferences();
    dom.clModal.hidden = false;
    syncModalBodyLock();

    if (SOUND) SOUND.playPaperRustle();

    if (dom.clModalBody) {
      if (sectionId) {
        const target = document.getElementById('cl-sec-' + sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
          setActiveCoverLetterToc(sectionId);
        } else {
          dom.clModalBody.scrollTop = 0;
        }
      } else {
        dom.clModalBody.scrollTop = 0;
        const firstSection =
          DATA.coverLetter.sections && DATA.coverLetter.sections[0] ? DATA.coverLetter.sections[0].id : '';
        if (firstSection) setActiveCoverLetterToc(firstSection);
      }
      updateCoverLetterScroll();
      dom.clModalBody.focus();
    }

    trackEvent('open_cover_letter', { source: source || 'unknown' });
  }

  function closeCoverLetterModal(skipFocusRestore) {
    if (!dom.clModal || dom.clModal.hidden) return;
    if (SOUND) SOUND.playSoftClick();
    const readSec = telemetry.coverOpenedAtMs
      ? Math.max(0, Math.round((Date.now() - telemetry.coverOpenedAtMs) / 1000))
      : 0;
    trackEvent('close_cover_letter', {
      max_progress_percent: telemetry.currentCoverMaxPct,
      read_sec: readSec
    });
    dom.clModal.hidden = true;
    syncModalBodyLock();
    if (!skipFocusRestore && state.lastTriggerEl && typeof state.lastTriggerEl.focus === 'function') {
      state.lastTriggerEl.focus();
    }
  }

  // ---- Official Web Resume Modal ----
  function renderResumeModal() {
    const rm = DATA.resumeData;
    if (!rm || !dom.rmModal || state.rmRendered) return;

    if (dom.rmModalBadge) dom.rmModalBadge.textContent = rm.badge || 'OFFICIAL WEB RESUME';
    if (dom.rmModalTitle) dom.rmModalTitle.textContent = rm.title || '이준영 공식 이력서';
    if (dom.rmModalSubtitle) dom.rmModalSubtitle.textContent = rm.subtitle || '';

    const sections = Array.isArray(rm.sections) ? rm.sections : [];

    if (dom.rmTocBar) {
      dom.rmTocBar.innerHTML = sections
        .map(function (sec, idx) {
          return (
            '<button type="button" class="cl-toc-pill' +
            (idx === 0 ? ' is-active' : '') +
            '" data-rm-jump="' +
            escapeHtml(sec.id) +
            '">' +
            '<span class="cl-toc-num">' +
            escapeHtml(sec.num) +
            '</span>' +
            '<span>' +
            escapeHtml(sec.tabLabel || sec.title) +
            '</span>' +
            '</button>'
          );
        })
        .join('');
    }

    const h = rm.header || {};
    const photoHtml = h.photo
      ? '<div class="rm-photo-frame">' +
        renderSafeLocalImg(h.photo, (h.name || '이준영') + ' 프로필 증명사진', 'rm-photo-img') +
        '</div>'
      : '';

    const linksHtml = (h.links || [])
      .map(function (lk) {
        return (
          '<a class="rm-contact-chip" href="' +
          sanitizeUrl(lk.url) +
          '" target="_blank" rel="noopener">' +
          escapeHtml(lk.label) +
          ' ↗</a>'
        );
      })
      .join('');

    const profileHeaderHtml =
      '<div class="rm-profile-card">' +
      photoHtml +
      '<div class="rm-profile-info">' +
      '<div class="rm-profile-name-row">' +
      '<h3>' +
      escapeHtml(h.name) +
      '</h3>' +
      '<span>' +
      escapeHtml(h.englishName) +
      '</span>' +
      '</div>' +
      '<p class="rm-profile-role">' +
      escapeHtml(h.role) +
      '</p>' +
      '<div class="rm-contact-grid">' +
      (h.email
        ? '<div class="rm-contact-chip rm-email-chip">' +
          '<span>' +
          escapeHtml(h.email) +
          '</span>' +
          '<button type="button" class="rm-copy-btn" data-copy-email="' +
          escapeHtml(h.email) +
          '">복사</button>' +
          '</div>'
        : '') +
      (h.linkedinUrl
        ? '<a class="rm-contact-chip" href="' +
          sanitizeUrl(h.linkedinUrl) +
          '" target="_blank" rel="noopener">LinkedIn (' +
          escapeHtml(h.linkedinLabel || 'younghwen') +
          ') ↗</a>'
        : '') +
      linksHtml +
      '</div>' +
      '</div>' +
      '</div>';

    const kpisHtml =
      Array.isArray(h.metrics) && h.metrics.length
        ? '<div class="rm-kpis-grid">' +
          h.metrics
            .map(function (m) {
              return (
                '<div class="cl-highlight-item">' +
                '<span>' +
                escapeHtml(m.label) +
                '</span>' +
                '<strong>' +
                escapeHtml(m.value) +
                '</strong>' +
                '</div>'
              );
            })
            .join('') +
          '</div>'
        : '';

    const sec1Meta = sections[0] || { id: 'career', num: '01', title: '경력사항 및 상용 프로덕트' };
    const careersHtml = (rm.careers || [])
      .map(function (c) {
        const isFeatured = c.category === '상용 프로덕트' || c.category === 'AI · QA 프로젝트';
        return (
          '<div class="cl-career-card">' +
          '<div class="cl-career-card-top">' +
          '<span class="rm-career-cat' +
          (isFeatured ? ' is-featured' : '') +
          '">' +
          escapeHtml(c.category) +
          '</span>' +
          '<span class="cl-career-period mono-num">' +
          escapeHtml(c.period) +
          '</span>' +
          '<strong class="cl-career-org">' +
          escapeHtml(c.org) +
          '</strong>' +
          '</div>' +
          '<h4 class="cl-career-role">' +
          escapeHtml(c.position) +
          '</h4>' +
          '<p class="rm-career-duties">' +
          escapeHtml(c.duties) +
          '</p>' +
          (c.stack ? '<div class="rm-stack-line">' + escapeHtml(c.stack) + '</div>' : '') +
          '</div>'
        );
      })
      .join('');

    const sec2Meta = sections[1] || { id: 'education', num: '02', title: '학력사항 및 주요 대외·연구 활동' };
    const eduHtml = (rm.education || [])
      .map(function (ed) {
        return (
          '<div class="rm-edu-card">' +
          '<div class="rm-edu-main">' +
          '<span class="cl-career-period mono-num">' +
          escapeHtml(ed.period) +
          '</span>' +
          '<h4>' +
          escapeHtml(ed.school) +
          '</h4>' +
          '<p>' +
          escapeHtml(ed.major) +
          '</p>' +
          '</div>' +
          '<div class="rm-edu-meta">' +
          '<span>' +
          escapeHtml(ed.degree) +
          '</span>' +
          '<strong>학점 ' +
          escapeHtml(ed.gpa) +
          '</strong>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    const actHtml = (rm.activities || [])
      .map(function (act) {
        return (
          '<div class="cl-career-card">' +
          '<div class="cl-career-card-top">' +
          '<span class="rm-career-cat">' +
          escapeHtml(act.type) +
          '</span>' +
          '<span class="cl-career-period mono-num">' +
          escapeHtml(act.period) +
          '</span>' +
          '<strong class="cl-career-org">' +
          escapeHtml(act.org) +
          '</strong>' +
          '</div>' +
          '<h4 class="cl-career-role">' +
          escapeHtml(act.role) +
          '</h4>' +
          '<p class="rm-career-duties" style="margin-bottom:0">' +
          escapeHtml(act.desc) +
          '</p>' +
          '</div>'
        );
      })
      .join('');

    const sec3Meta = sections[2] || { id: 'training', num: '03', title: '직업훈련 및 전문교육 이수이력' };
    const trainingsHtml = (rm.trainings || [])
      .map(function (tr) {
        return (
          '<div class="rm-training-item">' +
          '<div class="rm-training-meta">' +
          '<span class="rm-training-period mono-num">' +
          escapeHtml(tr.period) +
          '</span>' +
          '<span class="rm-training-org">' +
          escapeHtml(tr.org) +
          '</span>' +
          '</div>' +
          '<div class="rm-training-body">' +
          '<strong>' +
          escapeHtml(tr.course) +
          '</strong>' +
          '<p>' +
          escapeHtml(tr.detail) +
          '</p>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    const sec4Meta = sections[3] || { id: 'certifications', num: '04', title: '보유 자격면허 및 핵심 기술 역량' };
    const certsHtml = (rm.certifications || [])
      .map(function (cert) {
        return (
          '<div class="rm-cert-card">' +
          '<div>' +
          '<strong>' +
          escapeHtml(cert.name) +
          '</strong>' +
          '<span>' +
          escapeHtml(cert.issuer) +
          '</span>' +
          '</div>' +
          '<span class="rm-cert-date mono-num">' +
          escapeHtml(cert.date) +
          '</span>' +
          '</div>'
        );
      })
      .join('');

    const skillsHtml = (rm.skillGroups || [])
      .map(function (sg) {
        return (
          '<div class="rm-skill-card">' +
          '<h4>' +
          escapeHtml(sg.group) +
          '</h4>' +
          '<p>' +
          escapeHtml(sg.items) +
          '</p>' +
          '</div>'
        );
      })
      .join('');

    const coverBtnHtml = DATA.coverLetter
      ? '<button type="button" class="cl-action-solid" data-rm-open-cover="true">자기소개서 이어 읽기 ✦</button>'
      : '';
    const qaBtnHtml = QA_BOOK
      ? '<button type="button" class="cl-action-outline" data-rm-open-qa="test-cases">QA 219 TC 산출물 뷰어 열기 ↗</button>'
      : '';

    const relatedHtml =
      '<div class="cl-related-card">' +
      '<div class="cl-related-head">' +
      '<strong>연계 문서 및 검증 산출물</strong>' +
      '<span>이력서와 이어지는 자기소개서 스토리 및 구마야 산책가자 219 TC QA 산출물을 바로 확인할 수 있습니다.</span>' +
      '</div>' +
      '<div class="cl-related-actions">' +
      coverBtnHtml +
      qaBtnHtml +
      '</div>' +
      '</div>';

    const sectionsHtml =
      '<section class="cl-chapter-section" id="rm-sec-' +
      escapeHtml(sec1Meta.id) +
      '" data-rm-section="' +
      escapeHtml(sec1Meta.id) +
      '">' +
      '<header class="cl-chapter-head">' +
      '<span class="cl-chapter-num">' +
      escapeHtml(sec1Meta.num) +
      '</span>' +
      '<h3 class="cl-chapter-title">' +
      escapeHtml(sec1Meta.title) +
      '</h3>' +
      '</header>' +
      '<div class="cl-career-stack">' +
      careersHtml +
      '</div>' +
      '</section>' +
      '<section class="cl-chapter-section" id="rm-sec-' +
      escapeHtml(sec2Meta.id) +
      '" data-rm-section="' +
      escapeHtml(sec2Meta.id) +
      '">' +
      '<header class="cl-chapter-head">' +
      '<span class="cl-chapter-num">' +
      escapeHtml(sec2Meta.num) +
      '</span>' +
      '<h3 class="cl-chapter-title">' +
      escapeHtml(sec2Meta.title) +
      '</h3>' +
      '</header>' +
      eduHtml +
      '<div class="rm-activity-list">' +
      actHtml +
      '</div>' +
      '</section>' +
      '<section class="cl-chapter-section" id="rm-sec-' +
      escapeHtml(sec3Meta.id) +
      '" data-rm-section="' +
      escapeHtml(sec3Meta.id) +
      '">' +
      '<header class="cl-chapter-head">' +
      '<span class="cl-chapter-num">' +
      escapeHtml(sec3Meta.num) +
      '</span>' +
      '<h3 class="cl-chapter-title">' +
      escapeHtml(sec3Meta.title) +
      '</h3>' +
      '</header>' +
      '<div class="rm-training-list">' +
      trainingsHtml +
      '</div>' +
      '</section>' +
      '<section class="cl-chapter-section" id="rm-sec-' +
      escapeHtml(sec4Meta.id) +
      '" data-rm-section="' +
      escapeHtml(sec4Meta.id) +
      '">' +
      '<header class="cl-chapter-head">' +
      '<span class="cl-chapter-num">' +
      escapeHtml(sec4Meta.num) +
      '</span>' +
      '<h3 class="cl-chapter-title">' +
      escapeHtml(sec4Meta.title) +
      '</h3>' +
      '</header>' +
      '<div class="rm-cert-grid">' +
      certsHtml +
      '</div>' +
      '<div class="rm-skill-grid">' +
      skillsHtml +
      '</div>' +
      '</section>';

    if (dom.rmModalBody) {
      dom.rmModalBody.innerHTML =
        '<article class="cl-reader-article rm-reader-article">' +
        profileHeaderHtml +
        kpisHtml +
        sectionsHtml +
        relatedHtml +
        '</article>';
    }

    state.rmActiveSection = sections.length ? sections[0].id : '';
    state.rmRendered = true;
  }

  function applyResumePreferences() {
    if (!dom.rmModal) return;
    dom.rmModal.setAttribute('data-cl-theme', state.rmTheme);
    dom.rmModal.style.setProperty('--cl-font-size', state.rmFontSize + 'px');
    if (dom.rmFontSizeLabel) {
      dom.rmFontSizeLabel.textContent = state.rmFontSize + 'px';
    }
    dom.rmModal.querySelectorAll('[data-rm-theme-btn]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-rm-theme-btn') === state.rmTheme);
    });
  }

  function setActiveResumeToc(sectionId) {
    if (!sectionId || !dom.rmTocBar) return;
    state.rmActiveSection = sectionId;
    dom.rmTocBar.querySelectorAll('[data-rm-jump]').forEach(function (pill) {
      pill.classList.toggle('is-active', pill.getAttribute('data-rm-jump') === sectionId);
    });
  }

  function updateResumeScroll() {
    if (!dom.rmModalBody || !dom.rmModal || dom.rmModal.hidden) return;
    const el = dom.rmModalBody;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct =
      scrollable <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((el.scrollTop / scrollable) * 100)));

    if (dom.rmProgressBar) dom.rmProgressBar.style.width = pct + '%';
    if (dom.rmProgressText) dom.rmProgressText.textContent = pct + '%';
    if (pct > telemetry.currentResumeMaxPct) telemetry.currentResumeMaxPct = pct;
    if (pct > telemetry.maxResumePct) telemetry.maxResumePct = pct;

    const sections = el.querySelectorAll('.cl-chapter-section');
    if (sections.length && Date.now() > state.rmTocLockUntil) {
      const containerTop = el.getBoundingClientRect().top;
      let currentId = sections[0].getAttribute('data-rm-section') || '';
      sections.forEach(function (sec) {
        const relTop = sec.getBoundingClientRect().top - containerTop;
        if (relTop <= 110) {
          currentId = sec.getAttribute('data-rm-section') || currentId;
        }
      });
      if (scrollable > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
        currentId = sections[sections.length - 1].getAttribute('data-rm-section') || currentId;
      }
      if (currentId && currentId !== state.rmActiveSection) {
        setActiveResumeToc(currentId);
      }
    }

    if (pct >= 90 && !state.resumeCompleted) {
      state.resumeCompleted = true;
      trackEvent('complete_resume_read', { progress_percent: pct });
    }
  }

  function openResumeModal(source, sectionId) {
    if (!DATA.resumeData || !dom.rmModal) return;
    renderResumeModal();
    state.lastTriggerEl = document.activeElement;
    telemetry.currentResumeMaxPct = 0;
    telemetry.resumeOpenedAtMs = Date.now();

    applyResumePreferences();
    dom.rmModal.hidden = false;
    syncModalBodyLock();

    if (SOUND) SOUND.playPaperRustle();

    if (dom.rmModalBody) {
      if (sectionId) {
        const target = document.getElementById('rm-sec-' + sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
          setActiveResumeToc(sectionId);
        } else {
          dom.rmModalBody.scrollTop = 0;
        }
      } else {
        dom.rmModalBody.scrollTop = 0;
        const firstSection =
          DATA.resumeData.sections && DATA.resumeData.sections[0] ? DATA.resumeData.sections[0].id : '';
        if (firstSection) setActiveResumeToc(firstSection);
      }
      updateResumeScroll();
      dom.rmModalBody.focus();
    }

    trackEvent('open_resume', { source: source || 'unknown' });
  }

  function closeResumeModal(skipFocusRestore) {
    if (!dom.rmModal || dom.rmModal.hidden) return;
    if (SOUND) SOUND.playSoftClick();
    const readSec = telemetry.resumeOpenedAtMs
      ? Math.max(0, Math.round((Date.now() - telemetry.resumeOpenedAtMs) / 1000))
      : 0;
    trackEvent('close_resume', {
      max_progress_percent: telemetry.currentResumeMaxPct,
      read_sec: readSec
    });
    dom.rmModal.hidden = true;
    syncModalBodyLock();
    if (!skipFocusRestore && state.lastTriggerEl && typeof state.lastTriggerEl.focus === 'function') {
      state.lastTriggerEl.focus();
    }
  }

  function initModalsAndDelegation() {
    // 라이트박스 닫기
    if (dom.videoLightbox) {
      dom.videoLightbox.addEventListener('click', function (e) {
        if (e.target && e.target.getAttribute('data-close-lightbox') === 'true') {
          closeVideoLightbox();
        }
      });
    }
    if (dom.lightboxCloseBtn) {
      dom.lightboxCloseBtn.addEventListener('click', closeVideoLightbox);
    }

    // E-Book 컨트롤
    if (dom.ebookCloseBtn) {
      dom.ebookCloseBtn.addEventListener('click', closeNovelReader);
    }
    if (dom.ebookScrollBody) {
      dom.ebookScrollBody.addEventListener('scroll', updateReaderScrollProgress, { passive: true });
    }
    if (dom.ebookFontDec) {
      dom.ebookFontDec.addEventListener('click', function () {
        state.readerFontSize = Math.max(15, state.readerFontSize - 1);
        applyReaderPreferences();
        if (SOUND) SOUND.playSoftClick();
      });
    }
    if (dom.ebookFontInc) {
      dom.ebookFontInc.addEventListener('click', function () {
        state.readerFontSize = Math.min(23, state.readerFontSize + 1);
        applyReaderPreferences();
        if (SOUND) SOUND.playSoftClick();
      });
    }
    if (dom.ebookFontSerif) {
      dom.ebookFontSerif.addEventListener('click', function () {
        state.readerFont = 'serif';
        applyReaderPreferences();
        if (SOUND) SOUND.playPaperRustle();
      });
    }
    if (dom.ebookFontSans) {
      dom.ebookFontSans.addEventListener('click', function () {
        state.readerFont = 'sans';
        applyReaderPreferences();
        if (SOUND) SOUND.playPaperRustle();
      });
    }
    if (dom.ebookModal) {
      dom.ebookModal.querySelectorAll('.reader-theme-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.readerTheme = btn.getAttribute('data-theme') || 'parchment';
          applyReaderPreferences();
          if (SOUND) SOUND.playPaperRustle();
        });
      });
    }

    // QA 문서 뷰어 모달 컨트롤
    if (dom.qaModal) {
      dom.qaModal.addEventListener('click', function (e) {
        if (e.target && e.target.getAttribute('data-close-qa-modal') === 'true') {
          closeQaWorkbookModal();
        }
      });
    }
    if (dom.qaModalCloseBtn) {
      dom.qaModalCloseBtn.addEventListener('click', closeQaWorkbookModal);
    }
    if (dom.qaModalDownloadLink) {
      dom.qaModalDownloadLink.addEventListener('click', function () {
        if (SOUND) SOUND.playSoftClick();
        trackEvent('open_qa_portfolio', { source: 'xlsx_download_modal' });
      });
    }
    if (dom.qaTabsBar) {
      dom.qaTabsBar.addEventListener('click', function (e) {
        const tabBtn = e.target.closest('[data-qa-sheet]');
        if (!tabBtn) return;
        state.qaSheet = tabBtn.getAttribute('data-qa-sheet') || 'test-cases';
        state.qaStatus = 'ALL';
        state.qaCategory = 'ALL';
        syncQaControlsForSheet();
        renderQaWorkbookBody();
        if (dom.qaModalBody) dom.qaModalBody.scrollTop = 0;
        if (SOUND) SOUND.playPaperRustle();
        trackEvent('switch_qa_sheet', { sheet: state.qaSheet });
      });
    }
    if (dom.qaSearchInput) {
      dom.qaSearchInput.addEventListener('input', function (e) {
        state.qaSearch = e.target.value || '';
        renderQaWorkbookBody();
      });
    }
    if (dom.qaCategoryFilter) {
      dom.qaCategoryFilter.addEventListener('change', function (e) {
        state.qaCategory = e.target.value || 'ALL';
        renderQaWorkbookBody();
        if (SOUND) SOUND.playSoftClick();
      });
    }
    if (dom.qaStatusPills) {
      dom.qaStatusPills.addEventListener('click', function (e) {
        const pill = e.target.closest('[data-qa-status]');
        if (!pill) return;
        state.qaStatus = pill.getAttribute('data-qa-status') || 'ALL';
        syncQaControlsForSheet();
        renderQaWorkbookBody();
        if (SOUND) SOUND.playSoftClick();
      });
    }

    // 자기소개서 전용 웹 리더 모달 컨트롤
    if (dom.clModal) {
      dom.clModal.addEventListener('click', function (e) {
        if (e.target && e.target.getAttribute('data-close-cl-modal') === 'true') {
          closeCoverLetterModal();
        }
      });
      dom.clModal.querySelectorAll('[data-cl-theme-btn]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.clTheme = btn.getAttribute('data-cl-theme-btn') || 'dark';
          applyCoverLetterPreferences();
          if (SOUND) SOUND.playPaperRustle();
        });
      });
    }
    if (dom.clModalCloseBtn) {
      dom.clModalCloseBtn.addEventListener('click', function () {
        closeCoverLetterModal();
      });
    }
    if (dom.clFontDec) {
      dom.clFontDec.addEventListener('click', function () {
        state.clFontSize = Math.max(14, state.clFontSize - 1);
        applyCoverLetterPreferences();
        if (SOUND) SOUND.playSoftClick();
      });
    }
    if (dom.clFontInc) {
      dom.clFontInc.addEventListener('click', function () {
        state.clFontSize = Math.min(21, state.clFontSize + 1);
        applyCoverLetterPreferences();
        if (SOUND) SOUND.playSoftClick();
      });
    }
    if (dom.clTocBar) {
      dom.clTocBar.addEventListener('click', function (e) {
        const pill = e.target.closest('[data-cl-jump]');
        if (!pill) return;
        const secId = pill.getAttribute('data-cl-jump');
        const target = secId ? document.getElementById('cl-sec-' + secId) : null;
        if (target) {
          state.clTocLockUntil = Date.now() + 800;
          setActiveCoverLetterToc(secId);
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (SOUND) SOUND.playPaperRustle();
        }
      });
    }
    if (dom.clModalBody) {
      dom.clModalBody.addEventListener('wheel', function () { state.clTocLockUntil = 0; }, { passive: true });
      dom.clModalBody.addEventListener('touchstart', function () { state.clTocLockUntil = 0; }, { passive: true });
      dom.clModalBody.addEventListener('scroll', updateCoverLetterScroll, { passive: true });
      dom.clModalBody.addEventListener('click', function (e) {
        const qaBtn = e.target.closest('[data-cl-open-qa]');
        if (qaBtn) {
          const sheet = qaBtn.getAttribute('data-cl-open-qa') || 'test-cases';
          const preservedTrigger = state.lastTriggerEl;
          closeCoverLetterModal(true);
          openQaWorkbookModal(sheet);
          if (preservedTrigger) state.lastTriggerEl = preservedTrigger;
          return;
        }
        const autoBtn = e.target.closest('[data-cl-play-auto]');
        if (autoBtn && DATA.qaPortfolio && DATA.qaPortfolio.automationDemo) {
          const auto = DATA.qaPortfolio.automationDemo;
          const preservedTrigger = state.lastTriggerEl;
          closeCoverLetterModal(true);
          openVideoLightbox(auto.youtubeUrl, auto.title, 'qa_automation_demo');
          if (preservedTrigger) state.lastTriggerEl = preservedTrigger;
          return;
        }
        const openResumeBtn = e.target.closest('[data-cl-open-resume]');
        if (openResumeBtn) {
          const preservedTrigger = state.lastTriggerEl;
          closeCoverLetterModal(true);
          openResumeModal('cover_letter_modal');
          if (preservedTrigger) state.lastTriggerEl = preservedTrigger;
          return;
        }
      });
    }

    // 공식 웹 이력서 모달 컨트롤
    if (dom.rmModal) {
      dom.rmModal.addEventListener('click', function (e) {
        if (e.target && e.target.getAttribute('data-close-rm-modal') === 'true') {
          closeResumeModal();
        }
      });
      dom.rmModal.querySelectorAll('[data-rm-theme-btn]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.rmTheme = btn.getAttribute('data-rm-theme-btn') || 'dark';
          applyResumePreferences();
          if (SOUND) SOUND.playPaperRustle();
        });
      });
    }
    if (dom.rmModalCloseBtn) {
      dom.rmModalCloseBtn.addEventListener('click', function () {
        closeResumeModal();
      });
    }
    if (dom.rmFontDec) {
      dom.rmFontDec.addEventListener('click', function () {
        state.rmFontSize = Math.max(14, state.rmFontSize - 1);
        applyResumePreferences();
        if (SOUND) SOUND.playSoftClick();
      });
    }
    if (dom.rmFontInc) {
      dom.rmFontInc.addEventListener('click', function () {
        state.rmFontSize = Math.min(21, state.rmFontSize + 1);
        applyResumePreferences();
        if (SOUND) SOUND.playSoftClick();
      });
    }
    if (dom.rmTocBar) {
      dom.rmTocBar.addEventListener('click', function (e) {
        const pill = e.target.closest('[data-rm-jump]');
        if (!pill) return;
        const secId = pill.getAttribute('data-rm-jump');
        const target = secId ? document.getElementById('rm-sec-' + secId) : null;
        if (target) {
          state.rmTocLockUntil = Date.now() + 800;
          setActiveResumeToc(secId);
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (SOUND) SOUND.playPaperRustle();
        }
      });
    }
    if (dom.rmModalBody) {
      dom.rmModalBody.addEventListener('wheel', function () { state.rmTocLockUntil = 0; }, { passive: true });
      dom.rmModalBody.addEventListener('touchstart', function () { state.rmTocLockUntil = 0; }, { passive: true });
      dom.rmModalBody.addEventListener('scroll', updateResumeScroll, { passive: true });
      dom.rmModalBody.addEventListener('click', function (e) {
        const copyBtn = e.target.closest('[data-copy-email]');
        if (copyBtn) {
          const email = copyBtn.getAttribute('data-copy-email');
          if (SOUND) SOUND.playSoftClick();
          copyTextSafe(email)
            .then(function () {
              showToast('이메일이 클립보드에 복사되었습니다: ' + email);
              trackEvent('copy_contact_email', { email: email, source: 'resume_modal' });
            })
            .catch(function () {
              showToast('복사에 실패했습니다. 직접 선택해 복사해 주세요.');
            });
          return;
        }
        const coverBtn = e.target.closest('[data-rm-open-cover]');
        if (coverBtn) {
          const preservedTrigger = state.lastTriggerEl;
          closeResumeModal(true);
          openCoverLetterModal('resume_modal');
          if (preservedTrigger) state.lastTriggerEl = preservedTrigger;
          return;
        }
        const qaBtn = e.target.closest('[data-rm-open-qa]');
        if (qaBtn) {
          const sheet = qaBtn.getAttribute('data-rm-open-qa') || 'test-cases';
          const preservedTrigger = state.lastTriggerEl;
          closeResumeModal(true);
          openQaWorkbookModal(sheet);
          if (preservedTrigger) state.lastTriggerEl = preservedTrigger;
        }
      });
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (dom.videoLightbox && !dom.videoLightbox.hidden) {
        closeVideoLightbox();
      } else if (dom.qaModal && !dom.qaModal.hidden) {
        closeQaWorkbookModal();
      } else if (dom.rmModal && !dom.rmModal.hidden) {
        closeResumeModal();
      } else if (dom.clModal && !dom.clModal.hidden) {
        closeCoverLetterModal();
      } else if (dom.ebookModal && !dom.ebookModal.hidden) {
        closeNovelReader();
      }
    });

    // 상단/빈 상태 액션 버튼
    if (dom.lightAllBtn) {
      dom.lightAllBtn.addEventListener('click', lightAllCandles);
    }
    if (dom.emptyLightAllBtn) {
      dom.emptyLightAllBtn.addEventListener('click', lightAllCandles);
    }
    if (dom.emptyIgniteFirstBtn) {
      dom.emptyIgniteFirstBtn.addEventListener('click', function () {
        handleCandleSelect(1);
      });
    }
    if (dom.toggleViewModeBtn) {
      dom.toggleViewModeBtn.addEventListener('click', function () {
        if (SOUND) SOUND.playSoftClick();
        if (state.viewMode === 'all') {
          state.viewMode = 'single';
          if (!state.activeCandleId) state.activeCandleId = 1;
          syncCandleVisuals();
          renderShowcase();
        } else {
          lightAllCandles();
        }
      });
    }

    // 쇼케이스 내부 이벤트 위임 (아코디언, 복사, 앱 링크, QA 링크, 영상, 소설, 모드 필)
    if (dom.showcaseContainer) {
      dom.showcaseContainer.addEventListener('click', function (e) {
        const pillBtn = e.target.closest('[data-pill-candle]');
        if (pillBtn) {
          const cid = Number(pillBtn.getAttribute('data-pill-candle'));
          handleCandleSelect(cid);
          return;
        }

        const accBtn = e.target.closest('.accordion-trigger');
        if (accBtn) {
          const targetId = accBtn.getAttribute('aria-controls');
          const bodyEl = targetId ? document.getElementById(targetId) : null;
          if (bodyEl) {
            const expanded = accBtn.getAttribute('aria-expanded') === 'true';
            accBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            bodyEl.hidden = expanded;
            if (SOUND) SOUND.playSoftClick();
          }
          return;
        }

        const copyBtn = e.target.closest('[data-copy-email]');
        if (copyBtn) {
          const email = copyBtn.getAttribute('data-copy-email');
          if (SOUND) SOUND.playSoftClick();
          copyTextSafe(email)
            .then(function () {
              showToast('이메일이 클립보드에 복사되었습니다: ' + email);
              trackEvent('copy_contact_email', { email: email });
            })
            .catch(function () {
              showToast('복사에 실패했습니다. 직접 선택해 복사해 주세요.');
            });
          return;
        }

        const videoBtn = e.target.closest('[data-play-video]');
        if (videoBtn) {
          openVideoLightbox(
            videoBtn.getAttribute('data-play-video'),
            videoBtn.getAttribute('data-video-title'),
            videoBtn.getAttribute('data-video-section')
          );
          return;
        }

        const novelBtn = e.target.closest('[data-open-novel]');
        if (novelBtn) {
          openNovelReader(novelBtn.getAttribute('data-open-novel'));
          return;
        }

        const appLanding = e.target.closest('[data-app-landing]');
        if (appLanding) {
          if (SOUND) SOUND.playSoftClick();
          trackEvent('click_app_landing', {
            app_name: appLanding.getAttribute('data-app-landing'),
            url: appLanding.getAttribute('href')
          });
          return;
        }

        const appStore = e.target.closest('[data-app-store]');
        if (appStore) {
          if (SOUND) SOUND.playSoftClick();
          trackEvent('click_app_store', {
            app_name: appStore.getAttribute('data-app-store'),
            url: appStore.getAttribute('href')
          });
          return;
        }

        const qaWorkbookBtn = e.target.closest('[data-open-qa-workbook]');
        if (qaWorkbookBtn) {
          openQaWorkbookModal(qaWorkbookBtn.getAttribute('data-open-qa-workbook'));
          return;
        }

        const qaDownloadLink = e.target.closest('[data-qa-download]');
        if (qaDownloadLink) {
          if (SOUND) SOUND.playSoftClick();
          trackEvent('open_qa_portfolio', { source: 'xlsx_download_panel' });
          return;
        }

        const qaLink = e.target.closest('[data-qa-drive]');
        if (qaLink) {
          if (SOUND) SOUND.playSoftClick();
          trackEvent('open_qa_portfolio', { url: qaLink.getAttribute('href') });
          return;
        }

        const ytLink = e.target.closest('[data-visit-yt]');
        if (ytLink) {
          if (SOUND) SOUND.playSoftClick();
          trackEvent('visit_youtube_channel', { url: ytLink.getAttribute('href') });
          return;
        }

        const resumeBtn = e.target.closest('[data-open-resume]');
        if (resumeBtn) {
          openResumeModal(resumeBtn.getAttribute('data-open-resume') || 'candle_1_panel');
          return;
        }

        const coverLetterBtn = e.target.closest('[data-open-cover-letter]');
        if (coverLetterBtn) {
          openCoverLetterModal(coverLetterBtn.getAttribute('data-open-cover-letter') || 'candle_1_panel');
          return;
        }

        const linkedinLink = e.target.closest('[data-linkedin-link]');
        if (linkedinLink) {
          if (SOUND) SOUND.playSoftClick();
          trackEvent('click_linkedin_profile', {
            source: 'candle_1_panel',
            url: linkedinLink.getAttribute('href')
          });
        }
      });
    }
  }

  // ---- Canvas Firefly & Rising Ember Renderer + Parallax ----
  function initForestAtmosphere() {
    const canvas = dom.forestCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const fireflies = Array.from({ length: 34 }, function () {
      return {
        x: Math.random(),
        y: 0.08 + Math.random() * 0.78,
        r: 1.0 + Math.random() * 1.9,
        vx: (Math.random() - 0.5) * 0.00018,
        vy: (Math.random() - 0.5) * 0.00012,
        phase: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.025,
        hue: Math.random() > 0.35 ? '251, 191, 36' : '245, 158, 11'
      };
    });

    const embers = [];

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(300, Math.floor(rect.width));
      height = Math.max(300, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function maybeSpawnEmber() {
      const litIds = Array.from(state.litCandles);
      if (litIds.length === 0 || embers.length > 42) return;
      if (Math.random() > 0.06 * litIds.length) return;

      const pickedId = litIds[Math.floor(Math.random() * litIds.length)];
      const candleBtn = dom.candelabraShelf
        ? dom.candelabraShelf.querySelector('[data-candle-id="' + pickedId + '"]')
        : null;

      let spawnX = width * (0.2 + (pickedId - 1) * 0.15);
      let spawnY = height * 0.65;
      if (candleBtn) {
        const stageRect = canvas.getBoundingClientRect();
        const cRect = candleBtn.getBoundingClientRect();
        spawnX = cRect.left - stageRect.left + cRect.width / 2 + (Math.random() - 0.5) * 10;
        spawnY = cRect.top - stageRect.top + 36;
      }

      embers.push({
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -(0.45 + Math.random() * 0.9),
        life: 1,
        decay: 0.01 + Math.random() * 0.012,
        r: 1.0 + Math.random() * 1.5
      });
    }

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);

      // 반딧불이 렌더링
      for (let i = 0; i < fireflies.length; i++) {
        const f = fireflies[i];
        f.x += f.vx;
        f.y += f.vy;
        f.phase += f.speed;

        if (f.x < -0.02) f.x = 1.02;
        if (f.x > 1.02) f.x = -0.02;
        if (f.y < 0.05) f.y = 0.84;
        if (f.y > 0.86) f.y = 0.06;

        const px = f.x * width;
        const py = f.y * height;
        const alpha = 0.22 + 0.55 * (0.5 + 0.5 * Math.sin(f.phase));

        const grad = ctx.createRadialGradient(px, py, 0, px, py, f.r * 5.2);
        grad.addColorStop(0, 'rgba(' + f.hue + ', ' + alpha + ')');
        grad.addColorStop(1, 'rgba(' + f.hue + ', 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, f.r * 5.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 켜진 촛불 상승 불티 렌더링
      maybeSpawnEmber();
      for (let j = embers.length - 1; j >= 0; j--) {
        const em = embers[j];
        em.x += em.vx + Math.sin(em.y * 0.04) * 0.18;
        em.y += em.vy;
        em.life -= em.decay;

        if (em.life <= 0) {
          embers.splice(j, 1);
          continue;
        }

        ctx.fillStyle = 'rgba(251, 191, 36, ' + (em.life * 0.85).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.r * em.life, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        window.requestAnimationFrame(drawFrame);
      }
    }

    resize();
    window.addEventListener('resize', resize);
    drawFrame();

    // 마우스 미세 패럴랙스 (모션 감소 설정 시 비활성화)
    if (!prefersReducedMotion && dom.forestStage) {
      const far = dom.forestStage.querySelector('.forest-layer-far');
      const mid = dom.forestStage.querySelector('.forest-layer-mid');
      const near = dom.forestStage.querySelector('.forest-layer-near');

      dom.forestStage.addEventListener('mousemove', function (e) {
        const rect = dom.forestStage.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        if (far) far.style.transform = 'translate3d(' + (-nx * 8).toFixed(1) + 'px,' + (-ny * 4).toFixed(1) + 'px,0)';
        if (mid) mid.style.transform = 'translate3d(' + (-nx * 14).toFixed(1) + 'px,' + (-ny * 6).toFixed(1) + 'px,0)';
        if (near) near.style.transform = 'translate3d(' + (-nx * 22).toFixed(1) + 'px,' + (-ny * 8).toFixed(1) + 'px,0)';
      });
    }
  }

  // ---- Expose minimal debug hook for inspection ----
  window.__PORTFOLIO_STATE__ = function () {
    return {
      litCandles: Array.from(state.litCandles),
      litCount: state.litCandles.size,
      activeCandleId: state.activeCandleId,
      viewMode: state.viewMode,
      completedNovels: Array.from(state.completedNovels),
      attribution: attribution,
      sound: SOUND ? SOUND.getState() : null
    };
  };

  // ---- Boot ----
  initAnalyticsProviders();
  applyIgnoreQueryFlag();
  hydrateChrome();
  renderCandles();
  initSoundControls();
  initModalsAndDelegation();
  syncCandleVisuals();
  renderShowcase();
  initForestAtmosphere();

  trackEvent('page_view', { path: window.location.pathname || '/' });

  function handlePageExitBeacon() {
    const now = Date.now();
    if (now - telemetry.lastLeaveSentMs < 3000) return;
    telemetry.lastLeaveSentMs = now;
    const durationSec = Math.max(0, Math.round((now - telemetry.startedMs) / 1000));
    trackEvent('page_leave', { duration_sec: durationSec });
  }

  window.addEventListener('pagehide', handlePageExitBeacon);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      handlePageExitBeacon();
    }
  });
})();

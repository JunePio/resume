/**
 * js/admin.js
 * ------------------------------------------------------------
 * 방문 로그 관리 콘솔 (원격 Cloudflare Worker D1 + 로컬 브라우저 미러 통합 지원)
 * - 관리자 토큰 기반 원격 세션 목록/상세 타임라인 조회, 메모·별표, 선택/전체 삭제
 * - 지원처별 ?ref= 추적 링크 생성기 & 회사별 유입 필터
 * - 내 기기 접속 기록 제외 스위치 (localStorage 연동)
 * - CSV(UTF-8 BOM) 및 JSON 백업 다운로드
 */

(function () {
  'use strict';

  const DATA = window.PORTFOLIO_DATA || {};
  const IGNORE_TRACKING_KEY = 'portfolio_ignore_tracking';
  const LOCAL_MIRROR_KEY = 'portfolio_local_telemetry_v1';
  const ADMIN_API_URL_KEY = 'portfolio_admin_api_url';
  const ADMIN_TOKEN_LOCAL_KEY = 'portfolio_admin_token';
  const ADMIN_TOKEN_SESSION_KEY = 'portfolio_admin_token_sess';

  const state = {
    mode: 'local', // 'remote' | 'local'
    apiUrl: '',
    token: '',
    days: 'all',
    ref: 'ALL',
    activity: 'all',
    search: '',
    sessions: [],
    refBreakdown: [],
    summary: null,
    selectedIds: new Set(),
    expandedIds: new Set(),
    eventsCache: {}
  };

  const dom = {
    modeBadge: document.getElementById('admin-mode-badge'),
    ignoreToggle: document.getElementById('ignore-device-toggle'),
    toggleAuthBtn: document.getElementById('toggle-auth-panel-btn'),
    refreshBtn: document.getElementById('refresh-btn'),

    authPanel: document.getElementById('auth-panel'),
    authForm: document.getElementById('auth-form'),
    apiUrlInput: document.getElementById('api-url-input'),
    adminTokenInput: document.getElementById('admin-token-input'),
    rememberTokenChk: document.getElementById('remember-token-chk'),
    useLocalBtn: document.getElementById('use-local-btn'),
    authStatusMsg: document.getElementById('auth-status-msg'),

    kpiSessions: document.getElementById('kpi-sessions'),
    kpiVisitors: document.getElementById('kpi-visitors'),
    kpiResume: document.getElementById('kpi-resume'),
    kpiResumeSub: document.getElementById('kpi-resume-sub'),
    kpiCover: document.getElementById('kpi-cover'),
    kpiCoverSub: document.getElementById('kpi-cover-sub'),
    kpiQa: document.getElementById('kpi-qa'),
    kpiDuration: document.getElementById('kpi-duration'),

    refBaseUrl: document.getElementById('ref-base-url'),
    refCodeInput: document.getElementById('ref-code-input'),
    refUtmInput: document.getElementById('ref-utm-input'),
    refPreviewUrl: document.getElementById('ref-preview-url'),
    refCopyBtn: document.getElementById('ref-copy-btn'),
    refChipsBar: document.getElementById('ref-chips-bar'),

    filterDays: document.getElementById('filter-days'),
    filterActivity: document.getElementById('filter-activity'),
    filterSearch: document.getElementById('filter-search'),
    selectAllChk: document.getElementById('select-all-chk'),
    deleteSelectedBtn: document.getElementById('delete-selected-btn'),
    deleteAllBtn: document.getElementById('delete-all-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    exportJsonBtn: document.getElementById('export-json-btn'),

    sessionsCountLabel: document.getElementById('sessions-count-label'),
    sessionsList: document.getElementById('sessions-list'),
    toastContainer: document.getElementById('admin-toast-container')
  };

  function safeLocalGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeLocalSet(key, val) {
    try {
      window.localStorage.setItem(key, String(val));
    } catch {}
  }

  function safeLocalRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(msg) {
    if (!dom.toastContainer) return;
    const item = document.createElement('div');
    item.className = 'toast-item';
    item.textContent = msg;
    dom.toastContainer.appendChild(item);
    setTimeout(function () {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 2400);
  }

  function copyTextSafe(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0.001';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function formatDuration(sec) {
    const s = Math.max(0, Math.round(Number(sec) || 0));
    if (s < 60) return s + '초';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m + '분 ' + rem + '초';
  }

  function formatDateTimeKst(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return iso;
    }
  }

  function formatTimeOnly(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return iso;
    }
  }

  function parseLitCandles(raw) {
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // ---- Local Mirror Adapter ----
  function readLocalStore() {
    try {
      const raw = safeLocalGet(LOCAL_MIRROR_KEY);
      const parsed = raw ? JSON.parse(raw) : { sessions: [], eventsBySession: {} };
      return {
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        eventsBySession:
          parsed.eventsBySession && typeof parsed.eventsBySession === 'object' ? parsed.eventsBySession : {}
      };
    } catch {
      return { sessions: [], eventsBySession: {} };
    }
  }

  function writeLocalStore(store) {
    safeLocalSet(LOCAL_MIRROR_KEY, JSON.stringify(store));
  }

  function queryLocalSessions() {
    const store = readLocalStore();
    let dateFiltered = store.sessions.slice();
    if (state.days !== 'all') {
      const daysNum = Number(state.days) || 7;
      const threshold = Date.now() - daysNum * 86400 * 1000;
      dateFiltered = dateFiltered.filter(function (s) {
        return new Date(s.started_at).getTime() >= threshold;
      });
    }

    const refMap = {};
    dateFiltered.forEach(function (s) {
      const key = s.ref_tag || '';
      refMap[key] = (refMap[key] || 0) + 1;
    });
    const refBreakdown = Object.keys(refMap)
      .map(function (k) {
        return { ref_tag: k, count: refMap[k] };
      })
      .sort(function (a, b) {
        return b.count - a.count;
      });

    let rows = dateFiltered.filter(function (s) {
      if (state.ref !== 'ALL') {
        if (state.ref === '__NONE__' && s.ref_tag) return false;
        if (state.ref !== '__NONE__' && s.ref_tag !== state.ref) return false;
      }
      if (state.activity === 'resume' && !s.opened_resume) return false;
      if (state.activity === 'cover' && !s.opened_cover) return false;
      if (state.activity === 'qa' && !s.opened_qa) return false;
      if (state.activity === 'starred' && !s.is_starred) return false;
      if (state.search.trim()) {
        const q = state.search.trim().toLowerCase();
        const hay = [s.ref_tag, s.referrer, s.memo, s.os_browser, s.session_id, s.utm_source]
          .join(' ')
          .toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    const visitorSet = new Set();
    let resumeCnt = 0;
    let resumePctSum = 0;
    let coverCnt = 0;
    let coverPctSum = 0;
    let qaCnt = 0;
    let durSum = 0;
    rows.forEach(function (s) {
      visitorSet.add(s.visitor_id);
      if (s.opened_resume) {
        resumeCnt += 1;
        resumePctSum += Number(s.max_resume_pct || 0);
      }
      if (s.opened_cover) {
        coverCnt += 1;
        coverPctSum += Number(s.max_cover_pct || 0);
      }
      if (s.opened_qa) qaCnt += 1;
      durSum += Number(s.duration_sec || 0);
    });

    return {
      ok: true,
      summary: {
        total_sessions: rows.length,
        unique_visitors: visitorSet.size,
        resume_sessions: resumeCnt,
        avg_resume_pct: resumeCnt ? Math.round(resumePctSum / resumeCnt) : 0,
        cover_sessions: coverCnt,
        avg_cover_pct: coverCnt ? Math.round(coverPctSum / coverCnt) : 0,
        qa_sessions: qaCnt,
        avg_duration_sec: rows.length ? Math.round(durSum / rows.length) : 0
      },
      ref_breakdown: refBreakdown,
      sessions: rows
    };
  }

  // ---- Remote API Adapter ----
  async function apiRequest(path, options) {
    const baseUrl = state.apiUrl.replace(/\/+$/, '');
    const opts = Object.assign({}, options || {});
    opts.headers = Object.assign(
      {
        Authorization: 'Bearer ' + state.token
      },
      opts.headers || {}
    );
    const res = await fetch(baseUrl + path, opts);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = { ok: false, error: 'Invalid response' };
    }
    if (!res.ok || !data || data.ok === false) {
      const err = new Error((data && data.error) || 'HTTP ' + res.status);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function loadDashboard() {
    setAuthStatus('', false);
    if (state.mode === 'remote') {
      if (!state.apiUrl || !state.token) {
        dom.authPanel.hidden = false;
        setAuthStatus('원격 Worker URL과 관리자 토큰을 입력해 연결해 주세요.', true);
        return;
      }
      try {
        const params = new URLSearchParams();
        params.set('days', state.days);
        if (state.ref !== 'ALL') params.set('ref', state.ref);
        if (state.activity !== 'all') params.set('filter', state.activity);
        if (state.search.trim()) params.set('q', state.search.trim());

        const data = await apiRequest('/api/admin/sessions?' + params.toString());
        state.sessions = data.sessions || [];
        state.refBreakdown = data.ref_breakdown || [];
        state.summary = data.summary || {};
        dom.authPanel.hidden = true;
        renderDashboard();
      } catch (err) {
        dom.authPanel.hidden = false;
        setAuthStatus('원격 DB 조회 실패: ' + err.message, true);
      }
      return;
    }

    const localData = queryLocalSessions();
    state.sessions = localData.sessions;
    state.refBreakdown = localData.ref_breakdown;
    state.summary = localData.summary;
    renderDashboard();
  }

  async function fetchSessionEvents(sessionId) {
    if (state.mode === 'remote') {
      const data = await apiRequest('/api/admin/sessions/' + encodeURIComponent(sessionId));
      state.eventsCache[sessionId] = data.events || [];
      return state.eventsCache[sessionId];
    }
    const store = readLocalStore();
    state.eventsCache[sessionId] = store.eventsBySession[sessionId] || [];
    return state.eventsCache[sessionId];
  }

  async function updateSessionMeta(sessionId, patch) {
    if (state.mode === 'remote') {
      await apiRequest('/api/admin/sessions/' + encodeURIComponent(sessionId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      return;
    }
    const store = readLocalStore();
    const target = store.sessions.find(function (s) {
      return s.session_id === sessionId;
    });
    if (target) {
      if (Object.prototype.hasOwnProperty.call(patch, 'memo')) target.memo = patch.memo;
      if (Object.prototype.hasOwnProperty.call(patch, 'is_starred')) {
        target.is_starred = patch.is_starred ? 1 : 0;
      }
      writeLocalStore(store);
    }
  }

  async function deleteSessions(sessionIds, deleteAll) {
    if (state.mode === 'remote') {
      await apiRequest('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteAll ? { delete_all: true } : { session_ids: sessionIds })
      });
      return;
    }
    const store = readLocalStore();
    if (deleteAll) {
      writeLocalStore({ sessions: [], eventsBySession: {} });
      return;
    }
    const idSet = new Set(sessionIds);
    store.sessions = store.sessions.filter(function (s) {
      return !idSet.has(s.session_id);
    });
    sessionIds.forEach(function (id) {
      delete store.eventsBySession[id];
    });
    writeLocalStore(store);
  }

  async function fetchExportData() {
    if (state.mode === 'remote') {
      return await apiRequest('/api/admin/export');
    }
    const store = readLocalStore();
    const allEvents = [];
    Object.keys(store.eventsBySession).forEach(function (sid) {
      (store.eventsBySession[sid] || []).forEach(function (ev) {
        allEvents.push(ev);
      });
    });
    return {
      ok: true,
      exported_at: new Date().toISOString(),
      sessions: store.sessions,
      events: allEvents
    };
  }

  // ---- Renderers ----
  function syncModeBadge() {
    if (!dom.modeBadge) return;
    if (state.mode === 'remote') {
      dom.modeBadge.textContent = '원격 Cloudflare D1';
      dom.modeBadge.className = 'mode-pill is-remote';
    } else {
      dom.modeBadge.textContent = '로컬 미리보기';
      dom.modeBadge.className = 'mode-pill is-local';
    }
  }

  function setAuthStatus(msg, isErr) {
    if (!dom.authStatusMsg) return;
    dom.authStatusMsg.textContent = msg || '';
    dom.authStatusMsg.classList.toggle('is-error', Boolean(isErr));
  }

  function renderSummary() {
    const sm = state.summary || {};
    if (dom.kpiSessions) dom.kpiSessions.textContent = String(sm.total_sessions || 0);
    if (dom.kpiVisitors) dom.kpiVisitors.textContent = String(sm.unique_visitors || 0);
    if (dom.kpiResume) dom.kpiResume.textContent = (sm.resume_sessions || 0) + '건';
    if (dom.kpiResumeSub) dom.kpiResumeSub.textContent = '평균 진행률 ' + (sm.avg_resume_pct || 0) + '%';
    if (dom.kpiCover) dom.kpiCover.textContent = (sm.cover_sessions || 0) + '건';
    if (dom.kpiCoverSub) dom.kpiCoverSub.textContent = '평균 진행률 ' + (sm.avg_cover_pct || 0) + '%';
    if (dom.kpiQa) dom.kpiQa.textContent = (sm.qa_sessions || 0) + '건';
    if (dom.kpiDuration) dom.kpiDuration.textContent = formatDuration(sm.avg_duration_sec || 0);
  }

  function renderRefChips() {
    if (!dom.refChipsBar) return;
    const total = state.refBreakdown.reduce(function (acc, item) {
      return acc + Number(item.count || 0);
    }, 0);

    const chips = [
      '<button type="button" class="ref-chip-btn' +
        (state.ref === 'ALL' ? ' is-active' : '') +
        '" data-ref-chip="ALL">전체 (' +
        total +
        ')</button>'
    ];

    state.refBreakdown.forEach(function (item) {
      const val = item.ref_tag ? item.ref_tag : '__NONE__';
      const label = item.ref_tag ? item.ref_tag : '직접/미지정';
      chips.push(
        '<button type="button" class="ref-chip-btn' +
          (state.ref === val ? ' is-active' : '') +
          '" data-ref-chip="' +
          escapeHtml(val) +
          '">' +
          escapeHtml(label) +
          ' (' +
          item.count +
          ')</button>'
      );
    });

    dom.refChipsBar.innerHTML = chips.join('');
  }

  function syncSelectionUi() {
    const count = state.selectedIds.size;
    if (dom.deleteSelectedBtn) {
      dom.deleteSelectedBtn.disabled = count === 0;
      dom.deleteSelectedBtn.textContent = '선택 삭제 (' + count + ')';
    }
    if (dom.selectAllChk) {
      const allChecked =
        state.sessions.length > 0 &&
        state.sessions.every(function (s) {
          return state.selectedIds.has(s.session_id);
        });
      dom.selectAllChk.checked = allChecked;
    }
  }

  function renderTimelineHtml(events) {
    if (!events || !events.length) {
      return '<p class="timeline-meta">기록된 상세 이벤트가 없습니다.</p>';
    }
    return (
      '<ul class="timeline-list">' +
      events
        .map(function (ev) {
          let metaDisplay = '';
          try {
            const parsed = JSON.parse(ev.meta_json || '{}');
            const keys = Object.keys(parsed);
            if (keys.length) {
              metaDisplay = keys
                .map(function (k) {
                  return k + ': ' + parsed[k];
                })
                .join(' · ');
            }
          } catch {}
          return (
            '<li class="timeline-item">' +
            '<span class="timeline-time">' +
            escapeHtml(formatTimeOnly(ev.created_at)) +
            '</span>' +
            '<div>' +
            '<span class="timeline-label">' +
            escapeHtml(ev.event_label || ev.event_name) +
            '</span>' +
            (metaDisplay ? '<span class="timeline-meta">' + escapeHtml(metaDisplay) + '</span>' : '') +
            '</div>' +
            '</li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  function renderSessionsList() {
    if (dom.sessionsCountLabel) {
      dom.sessionsCountLabel.textContent = state.sessions.length + '건 표시';
    }
    if (!dom.sessionsList) return;

    if (!state.sessions.length) {
      dom.sessionsList.innerHTML =
        '<div class="empty-state">조건에 해당하는 방문 기록이 없습니다. 포트폴리오 페이지를 열어 탐색하면 실시간으로 기록됩니다.</div>';
      syncSelectionUi();
      return;
    }

    dom.sessionsList.innerHTML = state.sessions
      .map(function (s) {
        const candles = parseLitCandles(s.lit_candles);
        const isChecked = state.selectedIds.has(s.session_id);
        const isExpanded = state.expandedIds.has(s.session_id);
        const cachedEvents = state.eventsCache[s.session_id];

        return (
          '<article class="session-card' +
          (s.is_starred ? ' is-starred' : '') +
          '" data-session-id="' +
          escapeHtml(s.session_id) +
          '">' +
          '<div class="session-top-row">' +
          '<div class="session-left">' +
          '<input type="checkbox" class="session-chk" data-select-session="' +
          escapeHtml(s.session_id) +
          '"' +
          (isChecked ? ' checked' : '') +
          ' aria-label="세션 선택">' +
          '<button type="button" class="star-btn' +
          (s.is_starred ? ' is-on' : '') +
          '" data-toggle-star="' +
          escapeHtml(s.session_id) +
          '" aria-label="중요 표시 토글">' +
          (s.is_starred ? '★' : '☆') +
          '</button>' +
          '<div class="session-meta-stack">' +
          '<div class="session-badges-line">' +
          '<span class="session-time mono-num">' +
          escapeHtml(formatDateTimeKst(s.started_at)) +
          '</span>' +
          '<span class="tag-pill mono-num">체류 ' +
          escapeHtml(formatDuration(s.duration_sec)) +
          '</span>' +
          (s.ref_tag
            ? '<span class="tag-pill is-ref">ref=' + escapeHtml(s.ref_tag) + '</span>'
            : '<span class="tag-pill">직접 유입</span>') +
          (s.utm_source ? '<span class="tag-pill">utm=' + escapeHtml(s.utm_source) + '</span>' : '') +
          (s.opened_resume
            ? '<span class="tag-pill is-progress">이력서 ' + (s.max_resume_pct || 0) + '%</span>'
            : '') +
          (s.opened_cover
            ? '<span class="tag-pill is-progress">자소서 ' + (s.max_cover_pct || 0) + '%</span>'
            : '') +
          (s.opened_qa ? '<span class="tag-pill is-progress">QA 뷰어</span>' : '') +
          (candles.length ? '<span class="tag-pill">촛불 ' + escapeHtml(candles.join(',')) + '</span>' : '') +
          '</div>' +
          '<div class="session-env-line">' +
          escapeHtml(s.device_type || '-') +
          ' · ' +
          escapeHtml(s.os_browser || '-') +
          (s.screen_size ? ' (' + escapeHtml(s.screen_size) + ')' : '') +
          (s.country ? ' · ' + escapeHtml(s.country) : '') +
          (s.referrer ? ' · 이전 경로: ' + escapeHtml(s.referrer) : '') +
          ' · 이벤트 ' +
          (s.event_count || 0) +
          '건' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<div class="session-right-actions">' +
          '<button type="button" class="btn-outline-sm" data-toggle-timeline="' +
          escapeHtml(s.session_id) +
          '">' +
          (isExpanded ? '타임라인 접기 ▲' : '상세 타임라인 보기 ▼') +
          '</button>' +
          '</div>' +
          '</div>' +
          '<div class="session-memo-row">' +
          '<input type="text" class="memo-input" data-memo-input="' +
          escapeHtml(s.session_id) +
          '" value="' +
          escapeHtml(s.memo || '') +
          '" placeholder="예: 네이버 HR 담당자 1차 열람 (메모 입력 후 저장)">' +
          '<button type="button" class="btn-ghost-sm" data-save-memo="' +
          escapeHtml(s.session_id) +
          '">메모 저장</button>' +
          '</div>' +
          '<div class="timeline-drawer" data-timeline-box="' +
          escapeHtml(s.session_id) +
          '"' +
          (isExpanded ? '' : ' hidden') +
          '>' +
          (isExpanded
            ? cachedEvents
              ? renderTimelineHtml(cachedEvents)
              : '<p class="timeline-meta">불러오는 중...</p>'
            : '') +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    syncSelectionUi();
  }

  function renderDashboard() {
    syncModeBadge();
    renderSummary();
    renderRefChips();
    renderSessionsList();
  }

  // ---- Ref Link Builder ----
  function updateRefPreview() {
    if (!dom.refPreviewUrl) return;
    let base = (dom.refBaseUrl && dom.refBaseUrl.value.trim()) || '';
    if (!base) {
      base = window.location.href.replace(/admin\.html.*$/, 'index.html');
    }
    try {
      const u = new URL(base);
      const refCode = dom.refCodeInput ? dom.refCodeInput.value.trim() : '';
      const utm = dom.refUtmInput ? dom.refUtmInput.value.trim() : '';
      if (refCode) u.searchParams.set('ref', refCode);
      if (utm) u.searchParams.set('utm_source', utm);
      dom.refPreviewUrl.textContent = u.toString();
    } catch {
      const refCode = dom.refCodeInput ? dom.refCodeInput.value.trim() : '';
      const utm = dom.refUtmInput ? dom.refUtmInput.value.trim() : '';
      const params = [];
      if (refCode) params.push('ref=' + encodeURIComponent(refCode));
      if (utm) params.push('utm_source=' + encodeURIComponent(utm));
      dom.refPreviewUrl.textContent = base + (params.length ? (base.indexOf('?') === -1 ? '?' : '&') + params.join('&') : '');
    }
  }

  // ---- CSV & JSON Export ----
  function csvCell(val) {
    const str = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
    return '"' + str + '"';
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  async function handleExportCsv() {
    try {
      const data = await fetchExportData();
      const header = [
        'session_id',
        'started_at',
        'duration_sec',
        'ref_tag',
        'utm_source',
        'referrer',
        'device_type',
        'os_browser',
        'country',
        'opened_resume',
        'max_resume_pct',
        'opened_cover',
        'max_cover_pct',
        'opened_qa',
        'lit_candles',
        'event_count',
        'is_starred',
        'memo'
      ];
      const lines = [header.join(',')];
      (data.sessions || []).forEach(function (s) {
        lines.push(
          [
            s.session_id,
            s.started_at,
            s.duration_sec,
            s.ref_tag,
            s.utm_source,
            s.referrer,
            s.device_type,
            s.os_browser,
            s.country,
            s.opened_resume,
            s.max_resume_pct,
            s.opened_cover,
            s.max_cover_pct,
            s.opened_qa,
            s.lit_candles,
            s.event_count,
            s.is_starred,
            s.memo
          ]
            .map(csvCell)
            .join(',')
        );
      });
      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile('portfolio-visitor-logs-' + stamp + '.csv', '\uFEFF' + lines.join('\r\n'), 'text/csv;charset=utf-8');
      showToast('CSV 파일이 다운로드되었습니다.');
    } catch (err) {
      showToast('CSV 내보내기 실패: ' + err.message);
    }
  }

  async function handleExportJson() {
    try {
      const data = await fetchExportData();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile(
        'portfolio-visitor-logs-' + stamp + '.json',
        JSON.stringify(data, null, 2),
        'application/json;charset=utf-8'
      );
      showToast('JSON 백업 파일이 다운로드되었습니다.');
    } catch (err) {
      showToast('JSON 내보내기 실패: ' + err.message);
    }
  }

  // ---- Init & Events ----
  function init() {
    if (dom.ignoreToggle) {
      dom.ignoreToggle.checked = safeLocalGet(IGNORE_TRACKING_KEY) === 'true';
      dom.ignoreToggle.addEventListener('change', function () {
        if (dom.ignoreToggle.checked) {
          safeLocalSet(IGNORE_TRACKING_KEY, 'true');
          showToast('내 기기 접속 기록 제외가 켜졌습니다.');
        } else {
          safeLocalRemove(IGNORE_TRACKING_KEY);
          showToast('내 기기 접속 기록 제외가 꺼졌습니다.');
        }
      });
    }

    const defaultApiUrl =
      safeLocalGet(ADMIN_API_URL_KEY) ||
      (DATA.analyticsConfig && DATA.analyticsConfig.logApiUrl ? String(DATA.analyticsConfig.logApiUrl).trim() : '');
    let savedToken = '';
    try {
      savedToken = window.sessionStorage.getItem(ADMIN_TOKEN_SESSION_KEY) || '';
    } catch {}
    if (!savedToken) {
      savedToken = safeLocalGet(ADMIN_TOKEN_LOCAL_KEY) || '';
      if (savedToken && dom.rememberTokenChk) dom.rememberTokenChk.checked = true;
    }

    if (dom.apiUrlInput && defaultApiUrl) dom.apiUrlInput.value = defaultApiUrl;
    if (dom.adminTokenInput && savedToken) dom.adminTokenInput.value = savedToken;

    if (defaultApiUrl && savedToken) {
      state.mode = 'remote';
      state.apiUrl = defaultApiUrl;
      state.token = savedToken;
      if (dom.authPanel) dom.authPanel.hidden = true;
    } else {
      state.mode = 'local';
      if (dom.authPanel) dom.authPanel.hidden = Boolean(defaultApiUrl);
    }

    if (dom.refBaseUrl) {
      const guessedBase =
        window.location.protocol === 'file:'
          ? window.location.href.replace(/admin\.html.*$/, 'index.html')
          : window.location.origin + window.location.pathname.replace(/admin\.html.*$/, '');
      dom.refBaseUrl.value = guessedBase;
      updateRefPreview();
    }

    if (dom.toggleAuthBtn) {
      dom.toggleAuthBtn.addEventListener('click', function () {
        if (dom.authPanel) dom.authPanel.hidden = !dom.authPanel.hidden;
      });
    }

    if (dom.refreshBtn) {
      dom.refreshBtn.addEventListener('click', function () {
        loadDashboard();
        showToast('로그 목록을 새로고침했습니다.');
      });
    }

    if (dom.authForm) {
      dom.authForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const url = dom.apiUrlInput ? dom.apiUrlInput.value.trim().replace(/\/+$/, '') : '';
        const tok = dom.adminTokenInput ? dom.adminTokenInput.value.trim() : '';
        if (!url || !tok) {
          setAuthStatus('Worker URL과 관리자 토큰을 모두 입력해 주세요.', true);
          return;
        }
        state.mode = 'remote';
        state.apiUrl = url;
        state.token = tok;
        safeLocalSet(ADMIN_API_URL_KEY, url);
        try {
          window.sessionStorage.setItem(ADMIN_TOKEN_SESSION_KEY, tok);
        } catch {}
        if (dom.rememberTokenChk && dom.rememberTokenChk.checked) {
          safeLocalSet(ADMIN_TOKEN_LOCAL_KEY, tok);
        } else {
          safeLocalRemove(ADMIN_TOKEN_LOCAL_KEY);
        }
        loadDashboard();
      });
    }

    if (dom.useLocalBtn) {
      dom.useLocalBtn.addEventListener('click', function () {
        state.mode = 'local';
        if (dom.authPanel) dom.authPanel.hidden = true;
        loadDashboard();
        showToast('로컬 브라우저 미러 모드로 전환했습니다.');
      });
    }

    [dom.refBaseUrl, dom.refCodeInput, dom.refUtmInput].forEach(function (inp) {
      if (inp) inp.addEventListener('input', updateRefPreview);
    });

    if (dom.refCopyBtn) {
      dom.refCopyBtn.addEventListener('click', function () {
        const txt = dom.refPreviewUrl ? dom.refPreviewUrl.textContent : '';
        copyTextSafe(txt)
          .then(function () {
            showToast('지원처 추적 링크가 복사되었습니다.');
          })
          .catch(function () {
            showToast('복사에 실패했습니다. 직접 선택해 복사해 주세요.');
          });
      });
    }

    if (dom.refChipsBar) {
      dom.refChipsBar.addEventListener('click', function (e) {
        const chip = e.target.closest('[data-ref-chip]');
        if (!chip) return;
        state.ref = chip.getAttribute('data-ref-chip') || 'ALL';
        loadDashboard();
      });
    }

    if (dom.filterDays) {
      dom.filterDays.addEventListener('change', function () {
        state.days = dom.filterDays.value || 'all';
        loadDashboard();
      });
    }
    if (dom.filterActivity) {
      dom.filterActivity.addEventListener('change', function () {
        state.activity = dom.filterActivity.value || 'all';
        loadDashboard();
      });
    }
    if (dom.filterSearch) {
      let searchTimer = null;
      dom.filterSearch.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          state.search = dom.filterSearch.value || '';
          loadDashboard();
        }, 200);
      });
    }

    if (dom.selectAllChk) {
      dom.selectAllChk.addEventListener('change', function () {
        if (dom.selectAllChk.checked) {
          state.sessions.forEach(function (s) {
            state.selectedIds.add(s.session_id);
          });
        } else {
          state.selectedIds.clear();
        }
        renderSessionsList();
      });
    }

    if (dom.deleteSelectedBtn) {
      dom.deleteSelectedBtn.addEventListener('click', async function () {
        const ids = Array.from(state.selectedIds);
        if (!ids.length) return;
        if (!window.confirm('선택한 ' + ids.length + '개의 방문 세션을 삭제할까요?')) return;
        try {
          await deleteSessions(ids, false);
          state.selectedIds.clear();
          showToast(ids.length + '개 세션을 삭제했습니다.');
          loadDashboard();
        } catch (err) {
          showToast('삭제 실패: ' + err.message);
        }
      });
    }

    if (dom.deleteAllBtn) {
      dom.deleteAllBtn.addEventListener('click', async function () {
        if (!window.confirm('저장된 모든 방문 로그를 영구 삭제하시겠습니까?')) return;
        try {
          await deleteSessions([], true);
          state.selectedIds.clear();
          state.expandedIds.clear();
          state.eventsCache = {};
          showToast('모든 방문 로그를 초기화했습니다.');
          loadDashboard();
        } catch (err) {
          showToast('초기화 실패: ' + err.message);
        }
      });
    }

    if (dom.exportCsvBtn) dom.exportCsvBtn.addEventListener('click', handleExportCsv);
    if (dom.exportJsonBtn) dom.exportJsonBtn.addEventListener('click', handleExportJson);

    if (dom.sessionsList) {
      dom.sessionsList.addEventListener('change', function (e) {
        const chk = e.target.closest('[data-select-session]');
        if (!chk) return;
        const sid = chk.getAttribute('data-select-session');
        if (chk.checked) state.selectedIds.add(sid);
        else state.selectedIds.delete(sid);
        syncSelectionUi();
      });

      dom.sessionsList.addEventListener('click', async function (e) {
        const starBtn = e.target.closest('[data-toggle-star]');
        if (starBtn) {
          const sid = starBtn.getAttribute('data-toggle-star');
          const s = state.sessions.find(function (item) {
            return item.session_id === sid;
          });
          if (!s) return;
          const nextStar = s.is_starred ? 0 : 1;
          try {
            await updateSessionMeta(sid, { is_starred: nextStar });
            s.is_starred = nextStar;
            renderSessionsList();
          } catch (err) {
            showToast('별표 변경 실패: ' + err.message);
          }
          return;
        }

        const saveBtn = e.target.closest('[data-save-memo]');
        if (saveBtn) {
          const sid = saveBtn.getAttribute('data-save-memo');
          const input = dom.sessionsList.querySelector('[data-memo-input="' + sid + '"]');
          const memoVal = input ? input.value.trim() : '';
          try {
            await updateSessionMeta(sid, { memo: memoVal });
            const s = state.sessions.find(function (item) {
              return item.session_id === sid;
            });
            if (s) s.memo = memoVal;
            showToast('메모가 저장되었습니다.');
          } catch (err) {
            showToast('메모 저장 실패: ' + err.message);
          }
          return;
        }

        const toggleBtn = e.target.closest('[data-toggle-timeline]');
        if (toggleBtn) {
          const sid = toggleBtn.getAttribute('data-toggle-timeline');
          if (state.expandedIds.has(sid)) {
            state.expandedIds.delete(sid);
            renderSessionsList();
          } else {
            state.expandedIds.add(sid);
            renderSessionsList();
            if (!state.eventsCache[sid]) {
              try {
                await fetchSessionEvents(sid);
                renderSessionsList();
              } catch (err) {
                showToast('타임라인 불러오기 실패: ' + err.message);
              }
            }
          }
        }
      });
    }

    loadDashboard();
  }

  init();
})();

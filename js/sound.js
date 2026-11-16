/**
 * js/sound.js
 * ------------------------------------------------------------
 * Web Audio API 프로시저럴 사운드 엔진 (외부 오디오 파일 0개)
 * 1) 밤숲 바람 레이어 (Brown Noise + LPF + 듀얼 초저주파 LFO 호흡)
 * 2) 촛불·모닥불 타닥거림 5단계 연동 레이어 (140Hz 온기 + 1.2~2.6kHz 마이크로 크래클)
 * 3) 인터랙션 효과음 6종 (심지 호버, 점화, 전체 점화, 초 전환, 책장 넘김, 클릭음)
 * 4) 350ms Gain 램핑 & Smart Auto-Ducking (영상 재생 / 탭 숨김 대응)
 */

(function () {
  'use strict';

  const RAMP_SECONDS = 0.35; // 350ms 팝 노이즈 방지 페이드
  const HEARTH_GAIN_BY_LIT = [0.0, 0.06, 0.11, 0.17, 0.23, 0.30];
  const CRACKLE_TIERS = [
    { prob: 0.0, maxBurst: 0, master: 0.0, emberChance: 0.0 },
    { prob: 0.14, maxBurst: 1, master: 0.26, emberChance: 0.0 },
    { prob: 0.25, maxBurst: 1, master: 0.42, emberChance: 0.10 },
    { prob: 0.38, maxBurst: 2, master: 0.58, emberChance: 0.20 },
    { prob: 0.50, maxBurst: 2, master: 0.76, emberChance: 0.26 },
    { prob: 0.64, maxBurst: 3, master: 0.94, emberChance: 0.32 }
  ];

  class ForestSoundEngine {
    constructor() {
      const defaultVol =
        window.PORTFOLIO_DATA &&
        window.PORTFOLIO_DATA.siteConfig &&
        typeof window.PORTFOLIO_DATA.siteConfig.defaultVolume === 'number'
          ? window.PORTFOLIO_DATA.siteConfig.defaultVolume
          : 0.45;

      this.ctx = null;
      this.isEnabled = false; // 초기 접속 시 반드시 Muted(Off)
      this.userVolume = Math.max(0, Math.min(1, defaultVol));
      this.litCount = 0; // 0 ~ 5
      this.igniteCount = 0; // 촛불 점화 사운드 누적 재생 횟수
      this.duckReasons = new Set();

      this.brownBuffer = null;
      this.noiseBuffer = null;
      this.crispWhiteBuffer = null;

      this.ambientMasterGain = null;
      this.sfxMasterGain = null;
      this.candleSfxGain = null;
      this.candleAnalyser = null;
      this.windFilter = null;
      this.windBreathGain = null;
      this.hearthGain = null;
      this.crackleMasterGain = null;

      this.crackleTimerId = null;
      this.lastHoverAt = 0;
      this._lightAllTimers = [];
      this._startedLoops = false;
    }

    _ensureContext() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(function () {});
        }
        return true;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return false;
      }

      const ctx = new AudioCtx();
      this.ctx = ctx;
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(function () {});
      }

      this.brownBuffer = this._createSeamlessBrownBuffer(ctx, 4.0);
      this.noiseBuffer = this._createSoftNoiseBuffer(ctx, 1.5);
      this.crispWhiteBuffer = this._createCrispWhiteBuffer(ctx, 1.5);

      this._buildGraph(ctx);
      return true;
    }

    _createSeamlessBrownBuffer(ctx, seconds) {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * seconds);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0;
      let sum = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.022 * white) / 1.022;
        data[i] = lastOut;
        sum += lastOut;
      }

      // DC 오프셋 제거 및 피크 정규화
      const mean = sum / length;
      let maxAbs = 0.0001;
      for (let i = 0; i < length; i++) {
        data[i] -= mean;
        const abs = Math.abs(data[i]);
        if (abs > maxAbs) maxAbs = abs;
      }
      const norm = 0.38 / maxAbs;
      for (let i = 0; i < length; i++) {
        data[i] *= norm;
      }

      // 루프 이음새 0.25초 크로스페이드 처리
      const fadeLen = Math.min(Math.floor(sampleRate * 0.25), Math.floor(length / 4));
      for (let i = 0; i < fadeLen; i++) {
        const t = i / fadeLen;
        const tailIdx = length - fadeLen + i;
        const blended = data[i] * Math.sin(t * Math.PI * 0.5) + data[tailIdx] * Math.cos(t * Math.PI * 0.5);
        data[i] = blended;
      }

      return buffer;
    }

    _createSoftNoiseBuffer(ctx, seconds) {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * seconds);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      // 약간 부드러운 핑크 성향 셰이핑 (b0..b2 Paul Kellet 경량 근사)
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.14;
      }
      return buffer;
    }

    _createCrispWhiteBuffer(ctx, seconds) {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * seconds);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.92;
      }
      return buffer;
    }

    _buildGraph(ctx) {
      // 마스터 앰비언트, 일반 SFX & 독립 촛불 점화 SFX 버스
      this.ambientMasterGain = ctx.createGain();
      this.ambientMasterGain.gain.setValueAtTime(0, ctx.currentTime);
      this.ambientMasterGain.connect(ctx.destination);

      this.sfxMasterGain = ctx.createGain();
      this.sfxMasterGain.gain.setValueAtTime(this._effectiveSfxVolume(), ctx.currentTime);
      this.sfxMasterGain.connect(ctx.destination);

      this.candleSfxGain = ctx.createGain();
      this.candleSfxGain.gain.setValueAtTime(this._effectiveCandleSfxVolume(), ctx.currentTime);
      if (typeof ctx.createAnalyser === 'function') {
        this.candleAnalyser = ctx.createAnalyser();
        this.candleAnalyser.fftSize = 1024;
        this.candleSfxGain.connect(this.candleAnalyser);
        this.candleAnalyser.connect(ctx.destination);
      } else {
        this.candleSfxGain.connect(ctx.destination);
      }

      // 1) 밤숲 바람 베이스 레이어
      const windSource = ctx.createBufferSource();
      windSource.buffer = this.brownBuffer;
      windSource.loop = true;

      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.setValueAtTime(340, ctx.currentTime);
      this.windFilter.Q.setValueAtTime(0.65, ctx.currentTime);

      this.windBreathGain = ctx.createGain();
      this.windBreathGain.gain.setValueAtTime(0.30, ctx.currentTime);

      // LFO 1: 바람 주파수 변조 (250Hz ~ 430Hz)
      const lfoFreq = ctx.createOscillator();
      lfoFreq.type = 'sine';
      lfoFreq.frequency.setValueAtTime(0.095, ctx.currentTime);
      const lfoFreqDepth = ctx.createGain();
      lfoFreqDepth.gain.setValueAtTime(90, ctx.currentTime);
      lfoFreq.connect(lfoFreqDepth);
      lfoFreqDepth.connect(this.windFilter.frequency);

      // LFO 2: 밤공기 호흡 볼륨 변조
      const lfoBreath = ctx.createOscillator();
      lfoBreath.type = 'sine';
      lfoBreath.frequency.setValueAtTime(0.125, ctx.currentTime);
      const lfoBreathDepth = ctx.createGain();
      lfoBreathDepth.gain.setValueAtTime(0.075, ctx.currentTime);
      lfoBreath.connect(lfoBreathDepth);
      lfoBreathDepth.connect(this.windBreathGain.gain);

      windSource.connect(this.windFilter);
      this.windFilter.connect(this.windBreathGain);
      this.windBreathGain.connect(this.ambientMasterGain);

      // 2) 모닥불·촛불 따뜻한 저역 온기 레이어 (140Hz Low-Pass)
      const hearthSource = ctx.createBufferSource();
      hearthSource.buffer = this.brownBuffer;
      hearthSource.loop = true;
      hearthSource.playbackRate.setValueAtTime(0.86, ctx.currentTime);

      const hearthFilter = ctx.createBiquadFilter();
      hearthFilter.type = 'lowpass';
      hearthFilter.frequency.setValueAtTime(140, ctx.currentTime);
      hearthFilter.Q.setValueAtTime(0.8, ctx.currentTime);

      this.hearthGain = ctx.createGain();
      this.hearthGain.gain.setValueAtTime(HEARTH_GAIN_BY_LIT[this.litCount], ctx.currentTime);

      hearthSource.connect(hearthFilter);
      hearthFilter.connect(this.hearthGain);
      this.hearthGain.connect(this.ambientMasterGain);

      // 3) 크래클 전용 서브 마스터
      this.crackleMasterGain = ctx.createGain();
      this.crackleMasterGain.gain.setValueAtTime(CRACKLE_TIERS[this.litCount].master, ctx.currentTime);
      this.crackleMasterGain.connect(this.ambientMasterGain);

      if (!this._startedLoops) {
        windSource.start(0);
        hearthSource.start(0, 1.4);
        lfoFreq.start(0);
        lfoBreath.start(0);
        this._startedLoops = true;
      }

      this._startCrackleScheduler();
    }

    _startCrackleScheduler() {
      if (this.crackleTimerId) {
        clearInterval(this.crackleTimerId);
      }
      this.crackleTimerId = setInterval(() => {
        if (!this.ctx || !this.isEnabled || this.isDucked() || this.litCount <= 0) {
          return;
        }
        const tier = CRACKLE_TIERS[this.litCount];
        if (!tier || Math.random() > tier.prob) {
          return;
        }
        const burstCount = 1 + Math.floor(Math.random() * tier.maxBurst);
        for (let i = 0; i < burstCount; i++) {
          const offset = i * (0.015 + Math.random() * 0.055);
          this._spawnMicroCrackle(offset, tier.emberChance);
        }
      }, 120);
    }

    _spawnMicroCrackle(delaySec, emberChance) {
      const ctx = this.ctx;
      if (!ctx || !this.noiseBuffer || !this.crackleMasterGain) return;

      const startAt = ctx.currentTime + delaySec;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const isWarmPop = Math.random() < emberChance;
      const centerFreq = isWarmPop
        ? 680 + Math.random() * 320
        : 1200 + Math.random() * 1400;
      filter.frequency.setValueAtTime(centerFreq, startAt);
      filter.Q.setValueAtTime(isWarmPop ? 2.2 : 2.0 + Math.random() * 1.8, startAt);

      const env = ctx.createGain();
      const peak = isWarmPop
        ? 0.08 + Math.random() * 0.06
        : 0.045 + Math.random() * 0.075;
      const decay = isWarmPop
        ? 0.032 + Math.random() * 0.02
        : 0.012 + Math.random() * 0.022;

      env.gain.setValueAtTime(0.0001, startAt);
      env.gain.linearRampToValueAtTime(peak, startAt + 0.0025);
      env.gain.exponentialRampToValueAtTime(0.0001, startAt + decay);

      src.connect(filter);
      filter.connect(env);

      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.55, startAt);
        env.connect(panner);
        panner.connect(this.crackleMasterGain);
      } else {
        env.connect(this.crackleMasterGain);
      }

      const maxOffset = Math.max(0.05, this.noiseBuffer.duration - 0.1);
      src.start(startAt, Math.random() * maxOffset, decay + 0.02);
    }

    _rampGain(param, targetValue, durationSec) {
      if (!this.ctx || !param) return;
      const now = this.ctx.currentTime;
      const dur = typeof durationSec === 'number' ? durationSec : RAMP_SECONDS;
      try {
        if (typeof param.cancelAndHoldAtTime === 'function') {
          param.cancelAndHoldAtTime(now);
        } else {
          param.cancelScheduledValues(now);
          param.setValueAtTime(param.value, now);
        }
      } catch (e) {
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
      }
      param.linearRampToValueAtTime(Math.max(0, targetValue), now + dur);
    }

    _effectiveAmbientVolume() {
      if (!this.isEnabled || this.isDucked()) return 0;
      // 45% 슬라이더 기준 편안한 앰비언트 게인 스케일링
      return this.userVolume * 0.85;
    }

    _effectiveSfxVolume() {
      if (!this.isEnabled || this.isDucked()) return 0;
      return Math.max(0.18, this.userVolume * 0.9);
    }

    _effectiveCandleSfxVolume() {
      if (this.isDucked() || this.userVolume <= 0) return 0;
      return Math.min(1.0, Math.max(0.35, this.userVolume * 1.25));
    }

    _syncMasterGains() {
      if (!this.ctx) return;
      this._rampGain(this.ambientMasterGain.gain, this._effectiveAmbientVolume(), RAMP_SECONDS);
      this._rampGain(this.sfxMasterGain.gain, this._effectiveSfxVolume(), 0.2);
      if (this.candleSfxGain) {
        this._rampGain(this.candleSfxGain.gain, this._effectiveCandleSfxVolume(), 0.15);
      }
    }

    // ---- Public Controls ----

    isDucked() {
      return this.duckReasons.size > 0;
    }

    enable() {
      if (!this._ensureContext()) {
        this.isEnabled = true;
        return false;
      }
      this.isEnabled = true;
      this._syncMasterGains();
      return true;
    }

    disable() {
      this.isEnabled = false;
      this._clearLightAllTimers();
      if (this.ctx) {
        this._syncMasterGains();
      }
    }

    toggle() {
      if (this.isEnabled) {
        this.disable();
      } else {
        this.enable();
      }
      return this.isEnabled;
    }

    setVolume(vol01) {
      this.userVolume = Math.max(0, Math.min(1, Number(vol01) || 0));
      this._syncMasterGains();
    }

    setLitCount(count) {
      const clamped = Math.max(0, Math.min(5, Math.round(Number(count) || 0)));
      this.litCount = clamped;
      if (!this.ctx) return;

      const targetHearth = HEARTH_GAIN_BY_LIT[clamped];
      const targetCrackle = CRACKLE_TIERS[clamped].master;
      this._rampGain(this.hearthGain.gain, targetHearth, RAMP_SECONDS);
      this._rampGain(this.crackleMasterGain.gain, targetCrackle, RAMP_SECONDS);
    }

    setDuck(reason, shouldDuck) {
      if (!reason) return;
      const before = this.isDucked();
      if (shouldDuck) {
        this.duckReasons.add(reason);
      } else {
        this.duckReasons.delete(reason);
      }
      const after = this.isDucked();
      if (before !== after && this.ctx) {
        this._syncMasterGains();
      }
    }

    getState() {
      return {
        isEnabled: this.isEnabled,
        userVolume: this.userVolume,
        litCount: this.litCount,
        igniteCount: this.igniteCount,
        crackleTier: this.litCount,
        ducked: this.isDucked(),
        duckReasons: Array.from(this.duckReasons),
        audioState: this.ctx ? this.ctx.state : 'uninitialized'
      };
    }

    getCandleWaveformPeak() {
      if (!this.candleAnalyser) return 0;
      const len = this.candleAnalyser.fftSize;
      const buf = new Float32Array(len);
      if (typeof this.candleAnalyser.getFloatTimeDomainData === 'function') {
        this.candleAnalyser.getFloatTimeDomainData(buf);
      } else {
        const bytes = new Uint8Array(len);
        this.candleAnalyser.getByteTimeDomainData(bytes);
        for (let i = 0; i < len; i++) {
          buf[i] = (bytes[i] - 128) / 128;
        }
      }
      let maxAbs = 0;
      for (let i = 0; i < len; i++) {
        const a = Math.abs(buf[i]);
        if (a > maxAbs) maxAbs = a;
      }
      return Number(maxAbs.toFixed(4));
    }

    // ---- Procedural SFX ----

    _canPlaySfx() {
      return Boolean(this.isEnabled && !this.isDucked() && this._ensureContext());
    }

    _canPlayCandleSfx() {
      if (this.isDucked() || this.userVolume <= 0) return false;
      if (!this._ensureContext()) return false;
      if (this.candleSfxGain) {
        const target = this._effectiveCandleSfxVolume();
        if (this.candleSfxGain.gain.value < target * 0.5) {
          this.candleSfxGain.gain.setValueAtTime(target, this.ctx.currentTime);
        }
      }
      return true;
    }

    _connectWithPan(node, pan, startAt, targetBus) {
      const bus = targetBus || this.sfxMasterGain;
      if (!bus) return;
      if (typeof this.ctx.createStereoPanner === 'function' && typeof pan === 'number') {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), startAt);
        node.connect(panner);
        panner.connect(bus);
      } else {
        node.connect(bus);
      }
    }

    // 1. 심지 호버 (250ms 쿨다운)
    playEmberHover(pan) {
      if (!this._canPlaySfx()) return;
      const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (nowMs - this.lastHoverAt < 250) return;
      this.lastHoverAt = nowMs;

      const ctx = this.ctx;
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2150, now);
      filter.Q.setValueAtTime(3.2, now);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.075, now + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

      src.connect(filter);
      filter.connect(env);
      this._connectWithPan(env, pan || 0, now);
      src.start(now, Math.random() * 0.4, 0.06);
    }

    // 2. 촛불 점화: 성냥/부싯돌 마찰("치익") -> 불꽃 Whoosh("확") -> 심지 지글거림 & 타닥거림 (총 ~0.52s)
    playCandleIgnite(pan, candleId) {
      if (!this._canPlayCandleSfx()) return;
      this.igniteCount += 1;

      const ctx = this.ctx;
      const startAt = ctx.currentTime + 0.015; // 첫 클릭 Wake-up 시 어택 손실 방지용 15ms 룩어헤드
      const p = typeof pan === 'number' ? pan : 0;
      const cid = typeof candleId === 'number' && candleId >= 1 && candleId <= 5 ? candleId : 3;
      const timbreScale = 0.93 + ((cid - 1) / 4) * 0.14;
      const bus = this.candleSfxGain || this.sfxMasterGain;

      // Layer 1: 성냥/부싯돌 스파크 & 이중 그레인 마찰음 (0 ~ 75ms)
      const sparkSrc = ctx.createBufferSource();
      sparkSrc.buffer = this.crispWhiteBuffer || this.noiseBuffer;
      const sparkHp = ctx.createBiquadFilter();
      sparkHp.type = 'highpass';
      sparkHp.frequency.setValueAtTime(2200 * timbreScale, startAt);
      const sparkEnv = ctx.createGain();
      sparkEnv.gain.setValueAtTime(0.0001, startAt);
      sparkEnv.gain.linearRampToValueAtTime(0.36, startAt + 0.004);
      sparkEnv.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.022);
      sparkSrc.connect(sparkHp);
      sparkHp.connect(sparkEnv);
      this._connectWithPan(sparkEnv, p, startAt, bus);
      sparkSrc.start(startAt, Math.random() * 0.5, 0.03);

      [
        { delay: 0.002, peak: 0.40, dur: 0.038, f0: 1500, f1: 3100 },
        { delay: 0.026, peak: 0.34, dur: 0.044, f0: 2100, f1: 3600 }
      ].forEach((grain) => {
        const gAt = startAt + grain.delay;
        const gSrc = ctx.createBufferSource();
        gSrc.buffer = this.crispWhiteBuffer || this.noiseBuffer;
        const gFilter = ctx.createBiquadFilter();
        gFilter.type = 'bandpass';
        gFilter.frequency.setValueAtTime(grain.f0 * timbreScale, gAt);
        gFilter.frequency.linearRampToValueAtTime(grain.f1 * timbreScale, gAt + grain.dur);
        gFilter.Q.setValueAtTime(1.75, gAt);
        const gEnv = ctx.createGain();
        gEnv.gain.setValueAtTime(0.0001, gAt);
        gEnv.gain.linearRampToValueAtTime(grain.peak, gAt + 0.006);
        gEnv.gain.exponentialRampToValueAtTime(0.0001, gAt + grain.dur);
        gSrc.connect(gFilter);
        gFilter.connect(gEnv);
        this._connectWithPan(gEnv, p, gAt, bus);
        gSrc.start(gAt, Math.random() * 0.6, grain.dur + 0.02);
      });

      // Layer 2: 불꽃 점화 Whoosh (45 ~ 460ms, 에어 스윕 + 중저역 바디)
      const whooshAt = startAt + 0.045;
      const airSrc = ctx.createBufferSource();
      airSrc.buffer = this.crispWhiteBuffer || this.noiseBuffer;
      const airFilter = ctx.createBiquadFilter();
      airFilter.type = 'bandpass';
      airFilter.frequency.setValueAtTime(260 * timbreScale, whooshAt);
      airFilter.frequency.exponentialRampToValueAtTime(860 * timbreScale, whooshAt + 0.11);
      airFilter.frequency.exponentialRampToValueAtTime(250 * timbreScale, whooshAt + 0.40);
      airFilter.Q.setValueAtTime(1.35, whooshAt);
      const airEnv = ctx.createGain();
      airEnv.gain.setValueAtTime(0.0001, whooshAt);
      airEnv.gain.linearRampToValueAtTime(0.56, whooshAt + 0.065);
      airEnv.gain.exponentialRampToValueAtTime(0.0001, whooshAt + 0.41);
      airSrc.connect(airFilter);
      airFilter.connect(airEnv);
      this._connectWithPan(airEnv, p, whooshAt, bus);
      airSrc.start(whooshAt, Math.random() * 0.5, 0.43);

      const bodySrc = ctx.createBufferSource();
      bodySrc.buffer = this.brownBuffer;
      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.setValueAtTime(420 * timbreScale, whooshAt);
      bodyFilter.Q.setValueAtTime(0.9, whooshAt);
      const bodyEnv = ctx.createGain();
      bodyEnv.gain.setValueAtTime(0.0001, whooshAt);
      bodyEnv.gain.linearRampToValueAtTime(0.65, whooshAt + 0.07);
      bodyEnv.gain.exponentialRampToValueAtTime(0.0001, whooshAt + 0.415);
      bodySrc.connect(bodyFilter);
      bodyFilter.connect(bodyEnv);
      this._connectWithPan(bodyEnv, p, whooshAt, bus);
      bodySrc.start(whooshAt, Math.random() * 1.4, 0.44);

      // Layer 3: 심지 지글거림 & 밀랍 타닥거림 (75 ~ 500ms)
      const wickAt = startAt + 0.075;
      const wickSrc = ctx.createBufferSource();
      wickSrc.buffer = this.noiseBuffer;
      const wickFilter = ctx.createBiquadFilter();
      wickFilter.type = 'bandpass';
      wickFilter.frequency.setValueAtTime(3300 * timbreScale, wickAt);
      wickFilter.Q.setValueAtTime(2.4, wickAt);
      const wickEnv = ctx.createGain();
      wickEnv.gain.setValueAtTime(0.0001, wickAt);
      wickEnv.gain.linearRampToValueAtTime(0.13, wickAt + 0.06);
      wickEnv.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.48);
      wickSrc.connect(wickFilter);
      wickFilter.connect(wickEnv);
      this._connectWithPan(wickEnv, p, wickAt, bus);
      wickSrc.start(wickAt, Math.random() * 0.5, 0.43);

      [0.085, 0.175, 0.285, 0.405].forEach((offset, idx) => {
        const popAt = startAt + offset + Math.random() * 0.022;
        const popSrc = ctx.createBufferSource();
        popSrc.buffer = this.crispWhiteBuffer || this.noiseBuffer;
        const popFilter = ctx.createBiquadFilter();
        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime((1900 + Math.random() * 2300) * timbreScale, popAt);
        popFilter.Q.setValueAtTime(2.5, popAt);
        const popEnv = ctx.createGain();
        const peak = 0.24 + (idx % 2 === 0 ? 0.08 : 0.03) + Math.random() * 0.03;
        const decay = 0.018 + Math.random() * 0.014;
        popEnv.gain.setValueAtTime(0.0001, popAt);
        popEnv.gain.linearRampToValueAtTime(peak, popAt + 0.0025);
        popEnv.gain.exponentialRampToValueAtTime(0.0001, popAt + decay);
        popSrc.connect(popFilter);
        popFilter.connect(popEnv);
        const popPan = Math.max(-0.9, Math.min(0.9, p + (Math.random() - 0.5) * 0.18));
        this._connectWithPan(popEnv, popPan, popAt, bus);
        popSrc.start(popAt, Math.random() * 0.8, decay + 0.02);
      });
    }

    // 3. 전체 촛불 켜기: 130ms 간격 순차 점화
    _clearLightAllTimers() {
      this._lightAllTimers.forEach(function (id) {
        clearTimeout(id);
      });
      this._lightAllTimers = [];
    }

    playLightAll(candleIndicesToIgnite) {
      if (!this._canPlayCandleSfx()) return;
      this._clearLightAllTimers();
      const targets =
        Array.isArray(candleIndicesToIgnite) && candleIndicesToIgnite.length
          ? candleIndicesToIgnite
          : [1, 2, 3, 4, 5];

      targets.forEach((candleId, idx) => {
        const pan = ((candleId - 3) / 2) * 0.52;
        const timerId = setTimeout(() => {
          this.playCandleIgnite(pan, candleId);
        }, idx * 130);
        this._lightAllTimers.push(timerId);
      });
    }

    // 4. 이미 켜진 초 전환: 불꽃 일렁임 + 미세 타닥 + 은은한 황동 공명음
    playCandleFocus(pan) {
      if (!this._canPlayCandleSfx()) return;
      const ctx = this.ctx;
      const now = ctx.currentTime + 0.01;
      const p = typeof pan === 'number' ? pan : 0;
      const bus = this.candleSfxGain || this.sfxMasterGain;

      // 부드러운 불꽃 일렁임
      const breezeSrc = ctx.createBufferSource();
      breezeSrc.buffer = this.brownBuffer;
      const breezeFilter = ctx.createBiquadFilter();
      breezeFilter.type = 'lowpass';
      breezeFilter.frequency.setValueAtTime(380, now);
      const breezeEnv = ctx.createGain();
      breezeEnv.gain.setValueAtTime(0.0001, now);
      breezeEnv.gain.linearRampToValueAtTime(0.22, now + 0.045);
      breezeEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      breezeSrc.connect(breezeFilter);
      breezeFilter.connect(breezeEnv);
      this._connectWithPan(breezeEnv, p, now, bus);
      breezeSrc.start(now, Math.random() * 1.5, 0.26);

      // 심지 미세 타닥
      const popSrc = ctx.createBufferSource();
      popSrc.buffer = this.crispWhiteBuffer || this.noiseBuffer;
      const popFilter = ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.setValueAtTime(2400, now + 0.03);
      popFilter.Q.setValueAtTime(2.4, now + 0.03);
      const popEnv = ctx.createGain();
      popEnv.gain.setValueAtTime(0.0001, now + 0.03);
      popEnv.gain.linearRampToValueAtTime(0.12, now + 0.034);
      popEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      popSrc.connect(popFilter);
      popFilter.connect(popEnv);
      this._connectWithPan(popEnv, p, now + 0.03, bus);
      popSrc.start(now + 0.03, Math.random() * 0.5, 0.04);

      // 엔틱 황동 배음
      [528, 792].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(i === 0 ? 0.024 : 0.012, now + 0.02);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        osc.connect(env);
        this._connectWithPan(env, p, now, bus);
        osc.start(now);
        osc.stop(now + 0.44);
      });
    }

    // 5. 소설 리더기 오픈 및 책장 넘김
    playPaperRustle() {
      if (!this._canPlaySfx()) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(680, now);
      filter.frequency.linearRampToValueAtTime(1520, now + 0.08);
      filter.frequency.linearRampToValueAtTime(840, now + 0.19);
      filter.Q.setValueAtTime(1.5, now);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.095, now + 0.045);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

      src.connect(filter);
      filter.connect(env);
      this._connectWithPan(env, 0, now);
      src.start(now, Math.random() * 0.5, 0.22);
    }

    // 6. 아코디언 토글·앱 카드·이메일 복사 클릭음
    playSoftClick() {
      if (!this._canPlaySfx()) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(98, now + 0.024);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.055, now + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

      osc.connect(env);
      this._connectWithPan(env, 0, now);
      osc.start(now);
      osc.stop(now + 0.032);
    }
  }

  window.ForestSoundEngine = new ForestSoundEngine();
})();

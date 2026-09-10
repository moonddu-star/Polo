/* 고양이와 스프 · 폴로대회 랜딩 — plain JS, no framework and no runtime.
   Ported off dc-runtime because the host serves only html+css+js and its CSP
   forbids 'unsafe-eval', which the runtime needed to compile the template. */
(function () {
'use strict';

const T = {
  originEyebrow: '이야기의 시작', originQuote: '“아빠, 고양이 키워도 돼?”', originNote: '고양이와 스프는\n한 아이의 이 질문에서 시작되었습니다.',
  meowText: '야옹 ~',
  brandName: '고양이와 스프',
  loadingLabel: '이야기를 불러오는 중...',
  loadingVoice: '아빠! 고양이 키워도 돼?',
  heroEyebrow: '잠들기 전에 읽는 이야기',
  heroHeadline: '밤하늘에서 스프 냄새가 나요',
  voice1: '아빠.',
  voice2: '아빠, 이 고양이 이름은 뭐야?',
  voice3a: '아빠.',
  voice3b: '고마워.',
  heroTag: '별에서 온 고양이들의 아주 작은 스프 가게.',
  scrollHint: '아래로 스크롤해 이야기를 시작하세요',
  eventLine1: '\'고양이와 스프\'와 함께하는',
  eventLine2: '제2회 제주 폴로연맹 회장배 폴로대회',
  aboutTitle: '고양이와 스프는?',
  aboutP1: '전세계 8000만 유저에게 사랑받고 있는\n힐링 방치형 모바일 게임입니다.',
  aboutP2: '보글보글 스프를 요리하는 귀여운 고양이들의\n숲 속 일상을 지금 확인해보세요!',
  moreStory: '더 많은 이야기가 궁금하신가요?',
  moreHint: '아래로 스크롤 해보세요.',
  btnTop: 'TOP',
  pageTitle: '고양이와 스프 · 제2회 제주폴로연맹회장배 폴로대회',
  pageDesc: '제2회 제주폴로연맹회장배 폴로대회와 함께하는 고양이와 스프. 전세계 8000만 유저에게 사랑받는 힐링 방치형 모바일 게임.',
  storyEyebrow: '첫 번째 밤,\n하늘로 오른 작은 불빛',
  beat1: '어느 밤, 낡은 천문대에서\n작은 불빛 여러 개를\n하늘로 쏘아 올렸어요.',
  beat2: '그 빛은 별들 사이를 지나\n고양이 별에 닿았어요.\n호기심 많은 별고양이 키키가 살고 있었죠.',
  beat3: '키키는 별빛의 리본을 타고\n구름을 지나\n잠든 숲으로 내려왔답니다.',
  catStar: '고양이 별',
  s3Eyebrow: '두 번째 밤,\n보글보글 끓는 냄비',
  s3Main: '숲 속에서 키키가 발견한 건,\n모닥불 위에서 보글보글 끓는\n스프 한 냄비.',
  stirHint: '냄비 위에 마우스를 올려 스프를 저어 보세요',
  clickMe: '키키를 눌러 보세요',
  inter1: '키키는 스프가 눋지 않도록\n조심조심 냄비를 저었어요.\n그날 밤부터 키키는\n숲의 요리사가 되었답니다.',
  s4Eyebrow: '세 번째 밤,\n향기를 따라온 손님들',
  s4Main: '스프의 김을 타고\n은은한 빛이 피어오르자,\n하나둘 별고양이들이\n향기를 따라 내려왔어요.',
  tapHint: '카드를 눌러 고양이를 만나 보세요',
  guitarMain: '어디선가 한 고양이는 기타를 치고\n노래를 부르기 시작해요.\n사랑의 노래를.',
  inter2: '밤이 깊도록 스프는 보글보글 끓고,\n고양이들은 모닥불 곁에서\n그르렁 그르렁...\n숲은 어느새 작은 마을이 되었어요.',
  trailerMain: '별빛 숲의 하루를 영상으로 만나 보세요.',
  lblBreed: '품종', lblBirthday: '생일', lblFood: '좋아하는 음식',
  navStory: '이야기', navUpdate: '업데이트', navCoupon: '쿠폰 코드', navRecipe: '마법의 레시피', navSocial: '소셜', navCats: '고양이들', navDownload: '다운로드', navMenu: '메뉴', navClose: '닫기',
  btnGoogle: 'Google Play에서 받기', btnApple: 'App Store에서 받기', btnCoupon: '쿠폰 코드 입력',
  bgmOn: '배경음 켜기', bgmOff: '배경음 끄기'
};

class CatsSoupPage {
  state = { sound: this.readSoundPreference(), flipped: {} };

  constructor(props) {
    this.props = props || {};
    this.refs2 = {};
    this.stars = [];
    this.fireflies = [];
    this.shooters = [];
    this.magicShots = [];
    this.glowT = 0;
    this.dayAlpha = 0;
    this.stirring = false;
    this.lastSteam = 0;
    this.audio = null;
  }

  readSoundPreference() {
    if (window.__csSoundOn !== undefined) return window.__csSoundOn;
    window.__csSoundOn = true;
    return true;
  }

  // the element belongs to window, not to the markup, so nothing that rebuilds
  // the page can detach it mid-playback
  getAudio() {
    // one shared element per page — a second init must never spawn a second track
    // adopt an element left behind by an earlier init instead of adding another
    if (!window.__csBgm) {
      const prior = document.getElementById('cs-bgm');
      if (prior) window.__csBgm = prior;
    }
    if (!window.__csBgm) {
      const a = document.createElement('audio');
      a.src = 'assets/bgm.mp3';
      a.id = 'cs-bgm';
      a.loop = true;
      a.preload = 'metadata';
      a.volume = 0;
      a.playsInline = true;
      a.setAttribute('playsinline', '');
      a.setAttribute('webkit-playsinline', '');
      document.body.appendChild(a);
      window.__csBgm = a;
    }
    // losing the element from the document silently freezes playback
    if (!window.__csBgm.isConnected) document.body.appendChild(window.__csBgm);
    this._bgm = window.__csBgm;
    return this._bgm;
  }

  getGuitar() {
    if (!window.__csGuitar) {
      const prior = document.getElementById('cs-guitar');
      if (prior) window.__csGuitar = prior;
    }
    if (!window.__csGuitar) {
      const a = document.createElement('audio');
      a.src = 'assets/guitar.mp3';
      a.id = 'cs-guitar';
      a.loop = true;
      a.preload = 'metadata';
      a.volume = 0;
      a.playsInline = true;
      a.setAttribute('playsinline', '');
      a.setAttribute('webkit-playsinline', '');
      document.body.appendChild(a);
      window.__csGuitar = a;
    }
    if (!window.__csGuitar.isConnected) document.body.appendChild(window.__csGuitar);
    this._guitar = window.__csGuitar;
    if (!this._guitar._csEndedBound) {
      this._guitar._csEndedBound = true;
      this._guitar.addEventListener('ended', () => {
        if (this._guitar.loop) return;
        this._guitarDone = true;
        this.stopTrack(this._guitar);
        // zoning only runs on scroll, so bring the BGM back without waiting for one
        if (this._loaderGone && this.soundEnabled()) this.updateAudioZones(window.innerHeight);
      });
    }
    return this._guitar;
  }

  soundEnabled() {
    return window.__csSoundOn !== undefined ? window.__csSoundOn : this.state.sound;
  }

  audioMixerTrack(el) {
    const mixer = window.__csMediaMixer;
    if (!mixer || !el) return null;
    return el === window.__csGuitar ? mixer.guitar : (el === window.__csBgm ? mixer.bgm : null);
  }

  trackLevel(track) {
    if (!track) return 0;
    const now = track.ctx.currentTime;
    if (track._until > now && track._until > track._at) {
      const p = Math.max(0, Math.min(1, (now - track._at) / (track._until - track._at)));
      return track._from + (track._to - track._from) * p;
    }
    return track._to !== undefined ? track._to : track.gain.gain.value;
  }

  setTrackLevel(el, level) {
    const track = this.audioMixerTrack(el);
    if (!track) return false;
    const gain = track.gain.gain;
    const now = track.ctx.currentTime;
    level = Math.max(0, Math.min(1, level));
    try {
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(level, now);
    } catch (e) {
      gain.value = level;
    }
    track._from = track._to = level;
    track._at = track._until = now;
    return true;
  }

  // The mixer is global because MediaElementSourceNodes can only be created once
  // for each singleton element. Safe to retry from any input handler: routing is
  // only taken over once the context is actually running.
  ensureMediaMixer() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const bgm = this.getAudio();
    const guitar = this.getGuitar();
    if (window.__csMediaMixer) {
      const mixer = window.__csMediaMixer;
      const reconnect = (el, name) => {
        if (mixer[name]) return;
        if (el._csMixerTrack) {
          mixer[name] = el._csMixerTrack;
          return;
        }
        const source = mixer.ctx.createMediaElementSource(el);
        const gain = mixer.ctx.createGain();
        // Creating a MediaElementSource reroutes an already-audible element
        // immediately. Seed its gain from the old output so activation itself
        // never creates a dip or a jump.
        gain.gain.value = (!el.paused && !el.muted) ? el.volume : 0;
        source.connect(gain);
        gain.connect(mixer.ctx.destination);
        mixer[name] = el._csMixerTrack = {
          ctx: mixer.ctx, source: source, gain: gain,
          _from: gain.gain.value, _to: gain.gain.value,
          _at: mixer.ctx.currentTime, _until: mixer.ctx.currentTime
        };
      };
      try {
        reconnect(bgm, 'bgm');
        reconnect(guitar, 'guitar');
      } catch (e) {}
      if (mixer.bgm && mixer.guitar) {
        this.adoptMixerLevels();
        return mixer;
      }
      return null;
    }
    // A successful volume-property assignment does not prove that Safari
    // applies it to audible output (notably iPad desktop mode). Prefer one
    // dependable GainNode path whenever Web Audio is available.
    if (!Ctx) return null;
    try {
      const ctx = window.__csAudioCtx || (window.__csAudioCtx = new Ctx());
      // A MediaElementSource silences its element while the context is
      // suspended, so wait for a running context before taking over routing.
      if (ctx.state !== 'running') {
        if (ctx.resume && !this._ctxResuming) {
          this._ctxResuming = true;
          const retry = () => {
            this._ctxResuming = false;
            if (ctx.state === 'running') this.ensureMediaMixer();
          };
          ctx.resume().then(retry, retry);
        }
        return null;
      }
      const mixer = { ctx: ctx, bgm: null, guitar: null };
      window.__csMediaMixer = mixer;
      const connect = (el, name) => {
        if (el._csMixerTrack) return el._csMixerTrack;
        const source = ctx.createMediaElementSource(el);
        const gain = ctx.createGain();
        gain.gain.value = (!el.paused && !el.muted) ? el.volume : 0;
        source.connect(gain);
        gain.connect(ctx.destination);
        el._csMixerTrack = {
          ctx: ctx, source: source, gain: gain,
          _from: gain.gain.value, _to: gain.gain.value,
          _at: ctx.currentTime, _until: ctx.currentTime
        };
        mixer[name] = el._csMixerTrack;
        return el._csMixerTrack;
      };
      mixer.bgm = connect(bgm, 'bgm');
      mixer.guitar = connect(guitar, 'guitar');
      this.adoptMixerLevels();
      return mixer;
    } catch (e) {
      // Keep any successfully-created nodes global so remounts never duplicate them.
      return window.__csMediaMixer && window.__csMediaMixer.bgm && window.__csMediaMixer.guitar
        ? window.__csMediaMixer
        : null;
    }
  }

  // GainNodes own level from here on, so media elements stay at unity. A
  // volume-property fade still in flight would multiply against the gain;
  // retire it and let the next zoning pass re-ramp through the mixer.
  adoptMixerLevels() {
    const mixer = window.__csMediaMixer;
    if (!mixer || mixer._adopted) return;
    mixer._adopted = true;
    clearInterval(this._bRamp); clearTimeout(this._bRamp); this._bRamp = null;
    clearInterval(this._gRamp); clearTimeout(this._gRamp); this._gRamp = null;
    this._t_bRamp = undefined;
    this._t_gRamp = undefined;
    for (const el of [window.__csBgm, window.__csGuitar]) {
      if (!el) continue;
      try { el.volume = 1; } catch (e) {}
    }
  }

  stopTrack(el) {
    if (!el) return;
    const key = (el === window.__csGuitar) ? '_gRamp' : '_bRamp';
    clearInterval(this[key]);
    clearTimeout(this[key]);
    this[key] = null;
    this['_t' + key] = 0;
    this.setTrackLevel(el, 0);
    el.pause();
    if (!this.audioMixerTrack(el)) el.volume = 0;
    el.muted = true;
  }

  // iOS (and some Android WebViews) ignore HTMLAudioElement.volume, so fades never silence BGM
  audioVolumeWorks(el) {
    if (this._volOk !== undefined) return this._volOk;
    if (!el) return false;
    const prev = el.volume;
    try {
      el.volume = 0.31;
      this._volOk = Math.abs(el.volume - 0.31) < 0.02;
    } catch (e) {
      this._volOk = false;
    }
    try { el.volume = prev; } catch (e) {}
    return this._volOk;
  }

  reducedMotion() {
    return false;
  }

  compactUi() {
    return window.matchMedia('(max-width: 720px), (max-height: 540px) and (hover: none)').matches;
  }

  hamburgerUi() {
    return this.compactUi() || document.documentElement.classList.contains('cs-hamburger');
  }

  scheduleNavMode() {
    if (this._navModeRaf) return;
    this._navModeRaf = requestAnimationFrame(() => {
      this._navModeRaf = 0;
      this.updateNavMode();
    });
  }

  setHamburger(on) {
    on = !!on;
    const was = !!this._hamburgerOn;
    document.documentElement.classList.toggle('cs-hamburger', on);
    this._hamburgerOn = on;
    if (on) this.closeSocial();
    if (was && !on) this.closeMenu();
  }

  measureDesktopNavWidth(nav) {
    const probe = nav.cloneNode(true);
    probe.removeAttribute('id');
    probe.className = 'cs-nav-probe';
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:var(--cs-nav-gap, 18px);font-size:var(--cs-nav-size, 20px);font-family:var(--cs-cjk, "Gowun Batang"), "Gowun Batang", serif;letter-spacing:var(--cs-track, 0px);font-weight:var(--cs-weight, 700);white-space:nowrap;flex-wrap:nowrap;position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;margin:0;padding:0;width:max-content;max-width:none;height:auto;background:transparent;';
    document.body.appendChild(probe);
    try {
      return probe.getBoundingClientRect().width;
    } finally {
      probe.remove();
    }
  }

  navCollides() {
    const topbar = this.refs2.topbar;
    const nav = this.refs2.nav;
    if (!topbar || !nav) return false;
    const left = topbar.querySelector('.cs-topbar-left');
    const leftRight = left ? left.getBoundingClientRect().right : topbar.getBoundingClientRect().left + 72;
    const gap = 28;
    const hamburger = document.documentElement.classList.contains('cs-hamburger');
    const extra = hamburger ? 16 : 0;
    let navLeft;
    if (hamburger) {
      const width = this.measureDesktopNavWidth(nav);
      if (!(width > 0)) return true;
      navLeft = topbar.getBoundingClientRect().right - 36 - width;
    } else {
      const links = nav.querySelectorAll(':scope > a, :scope > .cs-social-wrap');
      const first = links[0];
      const last = links[links.length - 1];
      if (first && last && last.offsetTop > first.offsetTop + 4) return true;
      const rect = nav.getBoundingClientRect();
      navLeft = rect.width > 0 ? rect.left : (last || nav).getBoundingClientRect().left;
    }
    return leftRight + gap + extra > navLeft;
  }

  updateNavMode() {
    this.setHamburger(true);
  }

  hardAudioCut() {
    const el = window.__csBgm || window.__csGuitar;
    return !this.audioMixerTrack(el) && !this.audioVolumeWorks(el);
  }

  silenceAll() {
    clearInterval(this._bRamp); clearTimeout(this._bRamp); this._bRamp = null; this._t_bRamp = 0;
    clearInterval(this._gRamp); clearTimeout(this._gRamp); this._gRamp = null; this._t_gRamp = 0;
    for (const a of [window.__csBgm, window.__csGuitar]) {
      if (!a) continue;
      this.setTrackLevel(a, 0);
      a.pause();
      if (!this.audioMixerTrack(a)) a.volume = 0;
      a.muted = true;
    }
  }

  muteForVideo() {
    this._videoMute = true;
    this._soundOn = false;
    window.__csSoundOn = false;
    document.documentElement.classList.add('cs-sound-off');
    if (this.refs2.soundBtn) {
      this.refs2.soundBtn.classList.add('is-off');
      this.refs2.soundBtn.title = '♪ 배경음 켜기';
      this.refs2.soundBtn.setAttribute('aria-label', this.refs2.soundBtn.title);
    }
    clearInterval(this._bRamp); this._bRamp = null; this._t_bRamp = undefined;
    clearInterval(this._gRamp); this._gRamp = null; this._t_gRamp = undefined;
    this.silenceAll();
    if (this.state.sound) this.setState({ sound: false });
  }

  unlockAudio() {
    // A touch that pans the page never counts as activation, so a reader who only
    // scrolls would never reach the mixer — and the mixer is the sole fade path on
    // platforms that ignore volume. Try for it before the activation gate.
    const mixer = this.ensureMediaMixer();
    if (mixer && mixer.ctx.resume) mixer.ctx.resume().catch(() => {});
    // iOS: play+pause inside the tap so later scroll can start each track.
    // Do not interrupt a track which autoplay has already made audible.
    if (navigator.userActivation && !navigator.userActivation.isActive) return false;
    for (const el of [this.getAudio(), this.getGuitar()]) {
      if (!el.paused) continue;
      el.muted = true;
      const track = this.audioMixerTrack(el);
      if (track && this.trackLevel(track) < 0.005) this.setTrackLevel(el, 0);
      else if (!track) el.volume = 0;
      const p = el.play();
      el.pause();
      try { el.currentTime = 0; } catch (e) {}
      if (p && p.catch) p.catch(() => {});
    }
    return true;
  }

  toggleSoundNow() {
    const now = Date.now();
    if (this._soundTapAt && now - this._soundTapAt < 400) return;
    this._soundTapAt = now;
    const on = !this.soundEnabled();
    this._soundOn = on;
    window.__csSoundOn = on;
    document.documentElement.classList.toggle('cs-sound-off', !on);
    if (this.refs2.soundBtn) {
      this.refs2.soundBtn.classList.toggle('is-off', !on);
      this.refs2.soundBtn.title = on ? '♪ 배경음 끄기' : '♪ 배경음 켜기';
      this.refs2.soundBtn.setAttribute('aria-label', this.refs2.soundBtn.title);
    }
    clearInterval(this._fade);
    clearInterval(this._bRamp); this._bRamp = null; this._t_bRamp = undefined;
    clearInterval(this._gRamp); this._gRamp = null; this._t_gRamp = undefined;
    if (on && !this._audioUnlocked) {
      this._audioUnlocked = this.unlockAudio();
    }
    if (on && window.__csMediaMixer && window.__csMediaMixer.ctx.resume) {
      window.__csMediaMixer.ctx.resume().catch(() => {});
    }
    if (!this._loaderGone) {
      this.silenceAll();
      this.setState({ sound: on });
      return;
    }
    if (on) {
      this._restoreSoundLevel = true;
      this.updateAudioZones(window.innerHeight);
    }
    else this.silenceAll();
    this.setState({ sound: on });
  }

  closeSocial() {
    const wrap = this.refs2.socialWrap;
    if (!wrap) return;
    wrap.classList.remove('is-open');
    const btn = this.refs2.socialNav || wrap.querySelector('.cs-nav-social');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  toggleSocialNow(e) {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    if (this.hamburgerUi()) return;
    const wrap = this.refs2.socialWrap;
    if (!wrap) return;
    const open = !wrap.classList.contains('is-open');
    wrap.classList.toggle('is-open', open);
    const btn = this.refs2.socialNav || wrap.querySelector('.cs-nav-social');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!this._socialDocBound) {
      this._socialDocBound = true;
      document.addEventListener('pointerdown', (ev) => {
        const w = this.refs2.socialWrap;
        if (!w || !w.classList.contains('is-open')) return;
        if (w.contains(ev.target)) return;
        this.closeSocial();
      });
    }
  }

  closeMenu() {
    this.closeSocial();
    if (!this._menuOpen && !(this.refs2.nav && this.refs2.nav.classList.contains('is-open'))) return;
    this._menuOpen = false;
    if (this.refs2.menuBtn) {
      this.refs2.menuBtn.classList.remove('is-open');
      this.refs2.menuBtn.setAttribute('aria-expanded', 'false');
      const pack = this.menuCopy();
      this.refs2.menuBtn.setAttribute('aria-label', pack.navMenu);
      this.refs2.menuBtn.setAttribute('title', pack.navMenu);
    }
    if (this.refs2.nav) this.refs2.nav.classList.remove('is-open');
    if (this.refs2.menuScrim) this.refs2.menuScrim.classList.remove('is-open');
    if (this.refs2.topbar) this.refs2.topbar.classList.remove('is-menu-open');
    document.documentElement.classList.remove('cs-menu-lock');
    document.body.classList.remove('cs-menu-lock');
  }

  menuCopy() {
    return this._T || { navMenu: '??', navClose: '??' };
  }

  toggleMenuNow() {
    const now = Date.now();
    if (this._menuTapAt && now - this._menuTapAt < 280) return;
    this._menuTapAt = now;
    const open = !this._menuOpen;
    this._menuOpen = open;
    if (this.refs2.menuBtn) {
      this.refs2.menuBtn.classList.toggle('is-open', open);
      this.refs2.menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      const pack = this.menuCopy();
      const label = open ? pack.navClose : pack.navMenu;
      this.refs2.menuBtn.setAttribute('aria-label', label);
      this.refs2.menuBtn.setAttribute('title', label);
    }
    if (this.refs2.nav) this.refs2.nav.classList.toggle('is-open', open);
    if (this.refs2.menuScrim) this.refs2.menuScrim.classList.toggle('is-open', open);
    if (this.refs2.topbar) this.refs2.topbar.classList.toggle('is-menu-open', open);
    document.documentElement.classList.toggle('cs-menu-lock', open);
    document.body.classList.toggle('cs-menu-lock', open);
    if (!this._menuEscBound) {
      this._menuEscBound = true;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { this.closeSocial(); this.closeMenu(); }
      });
      window.addEventListener('resize', () => {
        if (!this.hamburgerUi()) this.closeMenu();
      });
    }
  }

  jumpToStory(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.closeMenu();
    // The prologue that opens the story, a screen above the first beat. The
    // menu promises the start of the story, and the first night is already
    // one scene into it.
    const start = document.getElementById('story-start');
    if (!start) return;
    window.scrollTo(0, this.clampStop(this.centreOf(start)));
    this.updateScroll();
  }

  goTopNow(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.closeMenu();
    // hold off the settle glide, or it grabs the page on the way up
    this._settling = true;
    clearTimeout(this._settleTimer);
    clearTimeout(this._settleClear);
    this._settleClear = setTimeout(() => { this._settling = false; }, 1200);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  playTrailer() {
    this.muteForVideo();
    const host = this.refs2.trailerBox;
    const p = this.refs2.trailerPoster;
    if (!host || host.querySelector('.cs-ytplayer')) return;
    if (p) p.style.display = 'none';
    const stage = document.createElement('div');
    stage.className = 'cs-ytplayer';
    stage.style.cssText = 'position:absolute;inset:0;';
    const holder = document.createElement('div');
    stage.appendChild(holder);
    host.appendChild(stage);
    // Browsers refuse unmuted autoplay inside an iframe, which left the
    // player parked on its own play button waiting for a second tap.
    // Start muted so playback is always allowed, then lift the mute once
    // it is actually rolling.
    const withSound = (pl) => {
      if (this._trailerUnmuted) return;
      this._trailerUnmuted = true;
      try { pl.unMute(); pl.setVolume(100); } catch (e) {}
    };
    this.ensureYtApi(() => {
      if (!window.YT || !window.YT.Player) return false;
      this.trailerPlayer = new window.YT.Player(holder, {
        videoId: 'Y7GAFRahuNc',
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, mute: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => { e.target.playVideo(); },
          onStateChange: (e) => { if (e.data === 1) withSound(e.target); }
        }
      });
      return true;
    });
  }

  // Where a full-height section reads centred, and the rounding every stop
  // goes through. The menu jump borrows both so it can only ever land on a
  // position the settle would also have chosen.
  centreOf(el) {
    const r = el.getBoundingClientRect();
    return window.scrollY + r.top + r.height / 2 - window.innerHeight / 2;
  }

  clampStop(y) {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.round(Math.max(0, Math.min(max, y)));
  }

  // Each beat reads centred in its own slice of the pinned travel. The settle
  // and the menu jump both aim at these, so they are worked out in one place
  // and cannot drift apart.
  storyStops() {
    const story = this.refs2.scene2 || document.getElementById('story');
    if (!story) return [];
    const top = window.scrollY + story.getBoundingClientRect().top;
    const travel = Math.max(1, story.offsetHeight - window.innerHeight);
    return [0.10, 0.46, 0.79].map((p) => top + p * travel);
  }

  // Scroll positions where a moment reads centred on a phone screen.
  // CSS scroll-snap cannot do this: it fights the sticky story scrubbing and
  // leaves the 2700px story stretch with no stops at all.
  settleTargets() {
    const h = window.innerHeight;
    const max = Math.max(0, document.documentElement.scrollHeight - h);
    const out = [];
    const push = (y) => {
      const v = this.clampStop(y);
      if (out.indexOf(v) < 0) out.push(v);
    };
    const story = this.refs2.scene2 || document.getElementById('story');
    this.storyStops().forEach(push);
    const secs = document.querySelectorAll('section[data-screen-label]');
    for (let i = 0; i < secs.length; i++) {
      const sec = secs[i];
      if (sec === story || sec.classList.contains('cs-landing')) continue;
      const r = sec.getBoundingClientRect();
      if (r.height < h * 0.4) continue;
      push(this.centreOf(sec));
    }
    // The last screen holds the trailer, the store buttons and the footer at
    // once. There is nothing to centre down there, and settling only fights
    // the reader who is reaching for a badge or scrubbing the video, so the
    // whole final screen is left unassisted.
    return out.filter((y) => max - y > h * 0.5);
  }

  settleScroll() {
    const h = window.innerHeight;
    const y = window.scrollY;
    if (this._touching || this._settling) return;
    if (!this.compactUi() || !this._loaderGone || this._menuOpen) return;
    // leave the hero alone so the TOP button never gets pulled back down
    if (y < h * 0.6) return;
    // Settle onward only. Stops sit about a screen apart, so the nearest one
    // to a reader who paused mid-gap is the scene behind them: taking it drags
    // them back where they came from, and a small scroll never reaches the
    // halfway line needed to escape. Looking only ahead turns that same pause
    // into a lift towards the scene they were heading for.
    const dir = this._scrollDir || 1;
    let best = null;
    const targets = this.settleTargets();
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (dir > 0 ? t < y : t > y) continue;
      if (best === null || Math.abs(t - y) < Math.abs(best - y)) best = t;
    }
    if (best === null) return;
    // Only a run-up in front of each stop, not half the gap: looking one way
    // removed the need to cover the whole distance between two scenes. A pause
    // further back than this is left exactly where the reader put it, because
    // hauling them a third of a screen is what reads as the page grabbing them.
    const delta = Math.abs(best - y);
    if (delta < 6 || delta > h * 0.16) return;
    this.glideTo(best);
  }

  // A hand-rolled glide, because the browser's smooth scroll covers a few
  // hundred pixels fast enough to read as a yank. This leaves from rest and
  // arrives at rest, and any touch or wheel abandons it mid-way.
  glideTo(to) {
    const from = window.scrollY;
    const dist = Math.abs(to - from);
    if (dist < 6) return;
    // slow enough that the fastest frame stays near a gentle scroll's speed,
    // which is what keeps even the longest pull from feeling like a tug
    const ms = Math.min(1100, 420 + dist * 1.5);
    const start = performance.now();
    this._settling = true;
    cancelAnimationFrame(this._settleRaf);
    const step = (now) => {
      if (!this._settling) return;
      const t = Math.min(1, (now - start) / ms);
      // smootherstep: no kick at the start, no thud at the end
      const e = t * t * t * (t * (t * 6 - 15) + 10);
      window.scrollTo(0, from + (to - from) * e);
      if (t < 1) this._settleRaf = requestAnimationFrame(step);
      else this._settling = false;
    };
    this._settleRaf = requestAnimationFrame(step);
  }

  cancelSettle() {
    this._settling = false;
    cancelAnimationFrame(this._settleRaf);
    clearTimeout(this._settleTimer);
  }

  scheduleSettle() {
    clearTimeout(this._settleTimer);
    if (this._touching) return;
    // Wait out a real pause before moving anything. Firing on the heels of the
    // last scroll event makes the page feel like it is snatching the scroll
    // away mid-gesture.
    // A glide in flight drives its own scroll events; look again once it lands.
    this._settleTimer = setTimeout(() => this.settleScroll(), this._settling ? 320 : 240);
  }

  componentDidUpdate() { this.applyCjkFont(); }

  // fade the BGM out as the trailer section comes into view, back in when leaving
  watchTrailerFade(el) {
    if (!el || this._trailerObs) return;
    const ramp = (target) => {
      clearInterval(this._bgmRamp);
      const a = this._bgm;
      if (!a) return;
      this._bgmRamp = setInterval(() => {
        const v = a.volume;
        const next = v + (target > v ? 0.03 : -0.03);
        if ((target > v && next >= target) || (target < v && next <= target)) {
          a.volume = target;
          clearInterval(this._bgmRamp);
          if (target === 0) a.pause();
        } else {
          if (target > 0 && a.paused) a.play().catch(() => {});
          a.volume = Math.max(0, Math.min(1, next));
        }
      }, 70);
    };
    this._trailerObs = true; // zoning handled in updateAudioZones
  }

  // swap the BGM for the guitar track while this section is on screen
  watchGuitar(el) {
    // zoning is rect-driven in updateAudioZones; nothing to observe here
    if (el) this._guitarObs = true;
  }

  // rect-driven audio zoning (IntersectionObserver never fires in this host)
  updateAudioZones(h, geometry) {
    if (!this._loaderGone) {
      this.silenceAll();
      return;
    }
    this._zonesLive = true;
    if (!this.soundEnabled() || this._yielded) {
      this.silenceAll();
      return;
    }
    if (this._videoMute) {
      const tr = this.refs2.trailerSection;
      if (tr) {
        const r = geometry && geometry.trailerRect ? geometry.trailerRect : tr.getBoundingClientRect();
        if (r.bottom < 0 || r.top > h) this._videoMute = false;
      }
      if (this._videoMute) {
        this.silenceAll();
        return;
      }
    }
    const g = this.getGuitar();
    const b = this.getAudio();
    const gs = this.refs2.guitarSection;
    const guitarEnabled = geometry && geometry.guitarEnabled !== undefined
      ? geometry.guitarEnabled
      : !!(gs && !gs.hidden && getComputedStyle(gs).display !== 'none');
    if (!guitarEnabled) {
      this._guitarPageY = null;
      this._guitarReached = false;
    }
    const guitarRect = geometry && geometry.guitarRect
      ? geometry.guitarRect
      : (guitarEnabled ? gs.getBoundingClientRect() : null);
    if (guitarEnabled && guitarRect) this._guitarPageY = window.scrollY + guitarRect.top;
    const guitarTop = guitarEnabled
      ? guitarRect.top
      : (this._guitarPageY != null ? this._guitarPageY - window.scrollY : Infinity);
    if (guitarTop < h * 0.45) this._guitarReached = true;
    const wantGuitar = this._guitarReached ? guitarTop < h * 0.55 : guitarTop < h * 0.45;
    // The guitar is a one-shot per visit. Once it has run its course this is just
    // another BGM scene; muting both tracks would leave the reader in dead air.
    const guitarActive = wantGuitar && !this._guitarDone;
    const active = guitarActive ? g : b;

    const now = Date.now();
    if (!this._wdAt || now - this._wdAt > 1200) {
      this._wdAt = now;
      for (const a of (window.__csAllAudio || [])) {
        if (a !== window.__csBgm && a !== window.__csGuitar && !a.paused) { a.pause(); a.volume = 0; }
      }
      for (const a of [window.__csBgm, window.__csGuitar]) {
        if (!a) continue;
        const key = a === g ? '_gRamp' : '_bRamp';
        const fadingOut = this['_t' + key] === 0 && this[key];
        if (a !== active) {
          // Let the outgoing track start and finish its ramp before the watchdog pauses it.
          // This also covers the first frame of a crossfade, before ramp() has created
          // the interval and marked the track as fading out.
          const crossfadeOutgoing = (guitarActive && a === b) || (!guitarActive && a === g);
          const tr = this.audioMixerTrack(a);
          // Protection lasts only while the fade is still audible; once it lands
          // the stop is free to run again as a safety net.
          const audible = !a.paused && (tr ? this.trackLevel(tr) : a.volume) > 0.0005;
          if ((fadingOut || crossfadeOutgoing) && audible && !this.hardAudioCut()) continue;
          this.stopTrack(a);
          continue;
        }
        if (a.paused) continue;
        if (a._wdT === a.currentTime) {
          if (!a.isConnected) document.body.appendChild(a);
          a.muted = false;
          a.play().catch(() => {});
        }
        a._wdT = a.currentTime;
      }
    }

    const ramp = (audio, target) => {
      const key = audio === g ? '_gRamp' : '_bRamp';
      // long enough that the handover reads as a dissolve rather than a swap
      const duration = 1.8;
      const track = this.audioMixerTrack(audio);
      if (target > 0 && this._restoreSoundLevel) {
        this._restoreSoundLevel = false;
        clearInterval(this[key]);
        clearTimeout(this[key]);
        this[key] = null;
        this['_t' + key] = target;
        if (track) this.setTrackLevel(audio, target);
        else {
          try { audio.volume = target; } catch (e) {}
        }
        audio.muted = false;
        if (audio.paused) audio.play().catch(() => {});
        return;
      }
      if (track) {
        if (this['_t' + key] === target && this[key]) return;
        const gain = track.gain.gain;
        const settled = Math.abs(this.trackLevel(track) - target) < 0.005 &&
          (target > 0 ? !audio.paused : audio.paused);
        if (this['_t' + key] === target && settled) return;
        this['_t' + key] = target;
        clearTimeout(this[key]);
        const now = track.ctx.currentTime;
        const current = Math.max(0, Math.min(1, this.trackLevel(track)));
        try {
          gain.cancelScheduledValues(now);
          gain.setValueAtTime(current, now);
          gain.linearRampToValueAtTime(target, now + duration);
        } catch (e) {
          gain.value = target;
        }
        track._from = current;
        track._to = target;
        track._at = now;
        track._until = now + duration;
        if (target > 0) {
          try { audio.volume = 1; } catch (e) {}
          audio.muted = false;
          if (audio.paused) audio.play().catch(() => {});
        }
        const finish = () => {
          // AudioContext time stops while suspended. Finalizing by wall-clock
          // time would pause the media before its gain automation can run.
          if (this['_t' + key] !== target) return;
          const remaining = track._until - track.ctx.currentTime;
          if (remaining > 0.015) {
            this[key] = setTimeout(finish, Math.max(30, Math.min(200, remaining * 1000)));
            return;
          }
          this[key] = null;
          this.setTrackLevel(audio, target);
          if (target === 0) {
            audio.pause();
            audio.muted = true;
          }
        };
        this[key] = setTimeout(finish, duration * 1000 + 30);
        return;
      }
      if (this.hardAudioCut()) {
        if (target <= 0) {
          this.stopTrack(audio);
          return;
        }
        this['_t' + key] = target;
        clearInterval(this[key]);
        this[key] = null;
        audio.muted = false;
        if (audio.paused) audio.play().catch(() => {});
        try { audio.volume = target; } catch (e) {}
        return;
      }
      if (this['_t' + key] === target && this[key]) return;
      const settled = audio.volume === target && (target > 0 ? !audio.paused : audio.paused);
      if (this['_t' + key] === target && settled) return;
      this['_t' + key] = target;
      const from = audio.volume;
      const started = performance.now();
      clearInterval(this[key]);
      this[key] = setInterval(() => {
        const p = Math.max(0, Math.min(1, (performance.now() - started) / (duration * 1000)));
        const next = from + (target - from) * p;
        if (p >= 1) {
          audio.volume = target;
          clearInterval(this[key]);
          this[key] = null;
          if (target === 0) { audio.pause(); audio.muted = true; }
        } else {
          if (target > 0) {
            audio.muted = false;
            if (audio.paused) audio.play().catch(() => {});
          }
          audio.volume = Math.max(0, Math.min(1, next));
          // volume property stuck (iOS): stop pretending to fade
          if (Math.abs(audio.volume - next) > 0.02) {
            this._volOk = false;
            this.stopTrack(audio);
          }
        }
      }, 50);
    };

    if (guitarActive) {
      ramp(b, 0);
      g.loop = false;
      if (!this._guitarPlayed) {
        this._guitarPlayed = true;
        this._guitarDone = false;
        try { g.currentTime = 0; } catch (e) {}
        if (this.audioMixerTrack(g)) this.setTrackLevel(g, 0);
        else g.volume = 0;
      }
      if (g.paused) {
        if (!this._gRamp && !this.hardAudioCut() && !this.audioMixerTrack(g)) g.volume = 0;
        g.muted = false;
        g.play().catch(() => { this._guitarPlayed = false; });
      }
      ramp(g, 0.5);
      return;
    }
    ramp(g, 0);
    ramp(b, 0.25);
  }

  // hard rule: nothing plays once the guitar scene is fully above the viewport
  enforceSilenceBelow() {
    // volume ownership lives entirely in updateAudioZones
    if (false) {
    }
  }

  watchCatOther(el) {
    if (!el || this._catOtherObs) return;
    this._catOtherObs = true; // rect-driven in updateScroll
  }

  ensureFont(name) {
    this._fonts = this._fonts || new Set();
    if (this._fonts.has(name)) return;
    this._fonts.add(name);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + name.replace(/ /g, '+') + ':wght@400;700&display=swap';
    document.head.appendChild(link);
  }

  applyCjkFont() {
    const p = this.props;
    const picked = p.fontKr ?? 'Gowun Batang';
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'ko';
    document.documentElement.style.setProperty('--cs-dir', 'ltr');
    document.documentElement.style.setProperty('--cs-weight', '700');
    this._meowText = (this._T && this._T.meowText) || '?? ~';
    this.ensureFont(picked);
    document.documentElement.style.setProperty('--cs-cjk', "'" + picked + "'");
    document.documentElement.style.setProperty('--cs-nav-size', '20px');
    document.documentElement.style.setProperty('--cs-nav-gap', '18px');
    document.documentElement.style.setProperty('--cs-track', (p.trackKr ?? -1) + 'px');
    document.documentElement.style.setProperty('--cs-lead', String(p.leadingKr ?? 1.4));
    document.documentElement.style.setProperty('--cs-jp-kern', 'auto');
    document.documentElement.style.setProperty('--cs-jp-palt', 'normal');
    document.documentElement.style.setProperty('--cs-wb', 'keep-all');
    this.scheduleNavMode();
  }




  ref2(name) { return (el) => { this.refs2[name] = el; }; }

  // own star field for the loader/language gate so it is fully opaque
  startLoaderStars(cv) {
    if (!cv || this._loaderStars) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const size = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; };
    size();
    const mobile = this.compactUi();
    const stars = Array.from({ length: mobile ? 28 : 70 }, () => ({
      x: Math.random(), y: Math.random(),
      r: (Math.random() * (mobile ? 1.0 : 1.3) + 0.35) * dpr,
      ph: Math.random() * Math.PI * 2,
      sp: 0.6 + Math.random() * 1.4
    }));
    const draw = (t) => {
      if (this._loaderGone && this._loaderStarsStop) return;
      if (document.hidden) {
        this._loaderStars = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#e9edff';
      for (const s of stars) {
        const a = (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t / 1000 * s.sp + s.ph))) * (mobile ? 0.45 : 1);
        ctx.globalAlpha = a;
        const rr = s.r;
        ctx.fillRect(s.x * cv.width - rr, s.y * cv.height - rr, rr * 2, rr * 2);
      }
      this._loaderStars = requestAnimationFrame(draw);
    };
    if (this.reducedMotion()) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#e9edff';
      ctx.globalAlpha = this.compactUi() ? 0.32 : 0.55;
      for (const s of stars) {
        const rr = s.r;
        ctx.fillRect(s.x * cv.width - rr, s.y * cv.height - rr, rr * 2, rr * 2);
      }
      ctx.globalAlpha = 1;
      return;
    }
    this._loaderStars = requestAnimationFrame(draw);
    this._loaderResize = () => size();
    window.addEventListener('resize', this._loaderResize);
  }

  ref(name) {
    if (!this._refFns) this._refFns = {};
    if (!this._refFns[name]) this._refFns[name] = (el) => { this.refs2[name] = el; };
    return this._refFns[name];
  }

  invalidateRevealGeometry() {
    for (const el of (this._reveals || [])) {
      delete el._csPageTop;
      delete el._csHeight;
    }
  }

  loadAssets() {
    this._loadStart = Date.now();
    const urls = [
      'assets/cat_star.webp', 'assets/cats_polo.webp',
      'assets/bi_neowiz2.webp?v=061', 'assets/logo_kr_trim.webp',
      'assets/googleplay.webp', 'assets/appstore.webp'
    ];
    let loaded = 0;
    const bump = () => {
      loaded++;
      const bar = this.refs2.loaderBar;
      if (bar) bar.style.width = Math.round((loaded / urls.length) * 100) + '%';
      if (loaded >= urls.length) {
        this.invalidateRevealGeometry();
        this.hideLoader();
      }
    };
    urls.forEach((u) => {
      const img = new Image();
      img.onload = bump; img.onerror = bump;
      img.src = u;
    });
    // safety timeout so a slow/blocked asset never traps the user on the loader
    setTimeout(() => this.hideLoader(), 20000);
  }

  hideLoader() {
    if (this._hideQueued) return;
    this._hideQueued = true;
    requestAnimationFrame(() => {
      const el = this.refs2.loader;
      if (!el) return;
      this._loaderStarsStop = true;
      cancelAnimationFrame(this._loaderStars);
      const loaderStar = el.querySelector('.cs-loader-star');
      if (loaderStar) loaderStar.style.animation = 'none';
      el.style.opacity = '0';
      setTimeout(() => {
        el.style.display = 'none';
        this._loaderGone = true;
        if (this._loaderResize) window.removeEventListener('resize', this._loaderResize);
        // Audio is intentionally created only after critical visual assets unblock the page.
        this.getAudio();
        this.getGuitar();
        if (this.soundEnabled()) {
          this._pendingBgm = false;
          this._t_bRamp = undefined;
          this._t_gRamp = undefined;
          this.updateAudioZones(window.innerHeight);
        } else {
          this.silenceAll();
        }
      }, this.reducedMotion() ? 0 : 850);
    });
  }

  // a remount must silence whatever the previous instance left running
  killStrayAudio() {
    const patch = () => {
      if (window.__csAudioPatched) return;
      window.__csAudioPatched = true;
      window.__csAllAudio = window.__csAllAudio || [];
      const proto = window.HTMLMediaElement.prototype;
      const origPlay = proto.play;
      proto.play = function () {
        if (window.__csAllAudio.indexOf(this) < 0) window.__csAllAudio.push(this);
        // never let a stale element from an earlier mount start again
        if (window.__csBgm && this !== window.__csBgm && this !== window.__csGuitar) {
          const src = this.currentSrc || this.src || '';
          if (src.indexOf('bgm.mp3') >= 0 || src.indexOf('guitar.mp3') >= 0) {
            this.volume = 0;
            return Promise.resolve();
          }
        }
        return origPlay.apply(this, arguments);
      };
    };
    patch();
    // only one page instance in this browser may hold the audio
    if (!window.__csChan && 'BroadcastChannel' in window) {
      window.__csId = window.__csId || Math.random().toString(36).slice(2);
      window.__csChan = new BroadcastChannel('cs-audio');
      window.__csChan.onmessage = (e) => {
        if (!e.data || e.data.id === window.__csId) return;
        for (const a of [window.__csBgm, window.__csGuitar]) {
          if (!a) continue;
          this.setTrackLevel(a, 0);
          if (!a.paused) a.pause();
          if (!this.audioMixerTrack(a)) a.volume = 0;
          a.muted = true;
        }
        this._yielded = true;
      };
      window.__csChan.postMessage({ id: window.__csId, claim: true });
    }
    // a duplicate <audio id="cs-bgm"> from an earlier mount would play a second copy
    for (const id of ['cs-bgm', 'cs-guitar']) {
      const keep = id === 'cs-bgm' ? window.__csBgm : window.__csGuitar;
      if (!keep) continue; // nothing adopted yet — never delete the only element
      for (const el of document.querySelectorAll('audio#' + id)) {
        if (el !== keep) { el.pause(); el.remove(); }
      }
    }
    for (const a of (window.__csAllAudio || [])) {
      if (a !== window.__csBgm && a !== window.__csGuitar) { a.pause(); a.volume = 0; }
    }
  }

  componentDidMount() {
    // every load starts the story from the top, never where the reader left off
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const toTop = () => window.scrollTo(0, 0);
    toTop();
    requestAnimationFrame(toTop);
    setTimeout(toTop, 120);
    window.addEventListener('beforeunload', toTop);
    this.killStrayAudio();
    this.applyCjkFont();
    this.updateNavMode();
    const density = Math.min(1, this.props.particleDensity ?? 1);
    const mobileSky = this.compactUi();
    const skyMul = mobileSky ? 0.28 : 1;
    for (let i = 0; i < Math.round(90 * density * skyMul); i++) {
      this.stars.push({ x: Math.random(), y: Math.random() * 0.9, r: Math.random() * (mobileSky ? 1.1 : 1.6) + 0.35, p: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 1.5 });
    }
    for (let i = 0; i < Math.round(14 * density * (mobileSky ? 0.4 : 1)); i++) {
      this.fireflies.push({ x: Math.random(), y: 0.45 + Math.random() * 0.5, vx: (Math.random() - .5) * .0006, vy: (Math.random() - .5) * .0004, p: Math.random() * Math.PI * 2 });
    }
    this.onScroll = () => {
      // Remember which way the reader is going. A glide drives its own scroll
      // events, so ignore those or the settle reads its own move as intent.
      const y = window.scrollY;
      if (!this._settling && this._lastY != null && y !== this._lastY) {
        const d = y - this._lastY;
        const dir = d > 0 ? 1 : -1;
        if (dir === this._scrollDir) this._dirRun = 0;
        else {
          // Glancing back is not a decision to go back. Turning on the first
          // event that points the other way let a 25px look-up haul the reader
          // a hundred pixels onto the screen behind them, so the reversal has
          // to be committed to before the settle starts aiming that way.
          this._dirRun = (this._dirRun || 0) + Math.abs(d);
          if (this._dirRun >= 60) {
            this._scrollDir = dir;
            this._dirRun = 0;
          }
        }
      }
      this._lastY = y;
      this.scheduleSettle();
      if (this._scrollRaf) return;
      this._scrollRaf = requestAnimationFrame(() => {
        this._scrollRaf = 0;
        this.updateScroll();
      });
    };
    // a finger on the glass always wins over the settle glide
    this.onTouchStart = () => {
      this._touching = true;
      this.cancelSettle();
    };
    this.onTouchEnd = () => {
      this._touching = false;
      this.scheduleSettle();
    };
    this.onWheel = () => this.cancelSettle();
    this.onMove = (e) => { this.mx = e.clientX; this.my = e.clientY; };
    this.onResize = () => {
      this._balloonEl = null;
      this.invalidateRevealGeometry();
      this.sizeCanvas();
      this.updateScroll();
      this.scheduleNavMode();
    };
    window.addEventListener('scroll', this.onScroll, { passive: true, capture: true });
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
    window.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('mousemove', this.onMove, { passive: true });
    window.addEventListener('resize', this.onResize);
    this.sizeCanvas();
    this._reveals = Array.from(document.getElementsByClassName('cs-reveal'));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        this.invalidateRevealGeometry();
        this.updateScroll();
      });
    }
    const guitarSection = this.refs2.guitarSection;
    this._guitarEnabled = !!(guitarSection && !guitarSection.hidden && getComputedStyle(guitarSection).display !== 'none');
    this.updateScroll();
    this.loadAssets();
    // BGM starts on; browsers block autoplay, so retry on first interaction
    const startBgm = (e) => {
      if (e && e.isTrusted) {
        // The mixer is the only fade path where volume is ignored, and a
        // suspended context can need more than one attempt before it runs.
        if (this._loaderGone) this.ensureMediaMixer();
        // Scrolling never grants activation, so do not spend play probes on it.
        if (!this._audioUnlocked && e.type !== 'scroll') this._audioUnlocked = this.unlockAudio();
      }
      // stay silent until the loader has finished and the hero is showing
      if (!this._loaderGone || this._pendingBgm) return;
      if (!this.soundEnabled()) return;
      this.updateAudioZones(window.innerHeight);
      // Keep listening until the mixer exists: it is the only fade path that
      // works where HTMLMediaElement.volume is ignored.
      if (!this.audioMixerTrack(window.__csBgm)) return;
      window.removeEventListener('pointerdown', startBgm);
      window.removeEventListener('touchstart', startBgm);
      window.removeEventListener('keydown', startBgm);
      window.removeEventListener('scroll', startBgm, { capture: true });
    };
    this._startBgm = startBgm;
    startBgm();
    window.addEventListener('pointerdown', startBgm);
    window.addEventListener('touchstart', startBgm, { passive: true });
    window.addEventListener('keydown', startBgm);
    window.addEventListener('scroll', startBgm, { passive: true, capture: true });
    let last = 0;
    const loop = (t) => {
      if (document.hidden || this.reducedMotion()) { this.rafId = 0; return; }
      this.rafId = requestAnimationFrame(loop);
      const idle = this.dayAlpha > 0.92 && !this.magicShots.length && !this.shooters.length;
      if (t - last < (idle ? 80 : 33)) return;
      last = t;
      this.draw(t / 1000);
    };
    this._canvasLoop = loop;
    this._onVis = () => {
      if (document.hidden) {
        this.shooters.length = 0;
        return;
      }
      if (!document.hidden && !this.reducedMotion() && !this.rafId) this.rafId = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', this._onVis);
    this._startDecorativeTimers = () => {
      if (this.reducedMotion()) return;
      if (!this.steamTimer) {
        this.steamTimer = setInterval(() => {
          if (document.hidden || this.reducedMotion()) return;
          this.spawnSteam(false);
          this.spawnSteam(false, 2);
        }, 900);
      }
      if (!this.shootTimer) {
        this.shootTimer = setInterval(() => {
          if (document.hidden || this.reducedMotion() || this.shooters.length) return;
          if (this.dayAlpha < 0.6 && Math.random() < 0.75) {
            this.shooters.push({
              x: Math.random() * 0.8 + 0.1,
              y: Math.random() * 0.35,
              life: 0,
              dx: 0.28 + Math.random() * 0.15,
              dy: 0.12 + Math.random() * 0.08
            });
          }
          // a shooter lives 1.4s, so ticking every 1.5s keeps them one at a time
        }, 1500);
      }
    };
    if (!this.reducedMotion()) {
      this.rafId = requestAnimationFrame(loop);
      this._startDecorativeTimers();
    }
    this.beatTimes = null;
    this._beatIdx = -1;
    // video slots: show only when the file exists & can play
    const wire = (name, onShow) => {
      const v = this.refs2[name];
      if (!v) return;
      const src = v.getAttribute('data-video-src');
      if (!src) return;
      fetch(src, { method: 'HEAD' }).then(r => {
        if (!r.ok) return;
        v.addEventListener('canplay', () => { onShow(v); }, { once: true });
        v.src = src;
      }).catch(() => {});
    };

    this._onMeowClick = (e) => {
      const el = e.target && e.target.closest && e.target.closest('.cs-meowcat');
      if (!el) return;
      e.stopPropagation();
      this.playMeow(el);
    };
    document.addEventListener('click', this._onMeowClick, true);
  }

  componentWillUnmount() {
    for (const a of [window.__csBgm, window.__csGuitar]) {
      if (a) {
        this.setTrackLevel(a, 0);
        a.pause();
        if (!this.audioMixerTrack(a)) a.volume = 0;
        a.muted = true;
      }
    }
    clearInterval(this._bRamp); clearInterval(this._gRamp);
    cancelAnimationFrame(this.rafId);
    if (this._scrollRaf) cancelAnimationFrame(this._scrollRaf);
    if (this._onVis) document.removeEventListener('visibilitychange', this._onVis);
    if (this.ytPlayer && this.ytPlayer.destroy) try { this.ytPlayer.destroy(); } catch (e) {}
    if (this.trailerPlayer && this.trailerPlayer.destroy) try { this.trailerPlayer.destroy(); } catch (e) {}
    clearInterval(this.steamTimer);
    clearInterval(this.shootTimer);
    clearTimeout(this._cookLoop);
    this.cancelSettle();
    clearTimeout(this._settleClear);
    window.removeEventListener('scroll', this.onScroll, { capture: true });
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchcancel', this.onTouchEnd);
    window.removeEventListener('wheel', this.onWheel);
    if (this._startBgm) {
      window.removeEventListener('pointerdown', this._startBgm);
      window.removeEventListener('touchstart', this._startBgm);
      window.removeEventListener('keydown', this._startBgm);
      window.removeEventListener('scroll', this._startBgm, { capture: true });
    }
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('resize', this.onResize);
    if (this._onMeowClick) document.removeEventListener('click', this._onMeowClick, true);
    if (this.audio) { try { this.audio.ctx.close(); } catch (e) {} }
  }

  sizeCanvas() {
    const c = this.refs2.canvas;
    if (!c) return;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    this._dpr = dpr;
    c.width = Math.floor(window.innerWidth * dpr);
    c.height = Math.floor(window.innerHeight * dpr);
    this._ctx = c.getContext('2d', { alpha: true, desynchronized: true });
  }

  progressOf(el, span) {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const h = window.innerHeight;
    return Math.max(0, Math.min(1, (h - r.top) / (span || (r.height + h))));
  }

  updateScroll() {
    const h = window.innerHeight;
    const scrollY = window.scrollY;
    const s2 = this.refs2.scene2;
    const cf = this.refs2.catFall;
    if (cf && (!this._balloonEl || this._balloonEl.parentNode !== cf)) {
      this._balloonEl = cf.querySelector('img[src*="balloon"]');
    }
    const balloon = this._balloonEl;
    const reveals = this._reveals || (this._reveals = Array.from(document.getElementsByClassName('cs-reveal')));
    const co = this.refs2.catOther;
    const footer = this.refs2.footer;
    const s3 = this.refs2.scene3;
    const guitarSection = this.refs2.guitarSection;
    const trailerSection = this.refs2.trailerSection;

    // Read all layout-dependent values together before any style/class writes.
    const geometry = {
      s2Rect: s2 ? s2.getBoundingClientRect() : null,
      catWidth: cf ? (cf.offsetWidth || 190) : 0,
      catHeight: cf ? (cf.offsetHeight || 250) : 0,
      balloonHeight: balloon ? balloon.offsetHeight : 0,
      revealRects: new Array(reveals.length),
      catOtherRect: co && !this._coFlew ? co.getBoundingClientRect() : null,
      footerRect: footer ? footer.getBoundingClientRect() : null,
      scene3Rect: s3 ? s3.getBoundingClientRect() : null,
      guitarEnabled: this._guitarEnabled !== undefined
        ? this._guitarEnabled
        : !!(guitarSection && !guitarSection.hidden && getComputedStyle(guitarSection).display !== 'none'),
      guitarRect: null,
      trailerRect: this._videoMute && trailerSection ? trailerSection.getBoundingClientRect() : null
    };
    for (let i = 0; i < reveals.length; i++) {
      geometry.revealRects[i] = reveals[i].getBoundingClientRect();
    }
    if (geometry.guitarEnabled) geometry.guitarRect = guitarSection.getBoundingClientRect();

    // scene 2: cat falls through sticky viewport
    if (s2 && cf) {
      const r = geometry.s2Rect;
      const p = Math.max(0, Math.min(1, -r.top / (r.height - h)));
      const cw = geometry.catWidth, ch = geometry.catHeight;
      const pad = this.compactUi() ? 14 : 24;
      // keep the cat fully inside the sticky viewport at every scroll position
      // room above for the balloon bunch she holds, measured not guessed
      let head = balloon ? geometry.balloonHeight * 0.82 : 220;
      // narrow screens: the rig reads much larger against the viewport, so scale it down
      let rigScale = window.innerWidth <= 480 ? 0.62 : this.compactUi() ? 0.74 : 1;
      // short viewports: shrink the rig until the descent keeps a usable travel distance
      const minTravel = h * 0.34;
      const travelAt = (s) => (h - pad - ch * s) - (pad + head * s);
      if (travelAt(rigScale) < minTravel) {
        rigScale = Math.min(rigScale, Math.max(0.4, (h - 2 * pad - minTravel) / (ch + head)));
      }
      cf.style.transformOrigin = '50% 100%';
      head *= rigScale;
      const yTop = pad + head;
      const yBot = Math.max(yTop + 1, h - ch * rigScale - pad);
      // she only starts her descent after beat2 (room + motorcycle) has left
      const pf = Math.max(0, Math.min(1, (p - 0.66) / 0.24));
      const fall = pf * pf * (3 - 2 * pf);
      const y = yTop + fall * (yBot - yTop);
      // fall straight down along the right edge, clear of the centered copy
      const halfW = window.innerWidth / 2;
      const x = Math.max(0, halfW - cw / 2 - Math.max(pad, window.innerWidth * 0.16));
      const rot = Math.sin(fall * Math.PI) * 3.5;
      cf.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg) scale(' + rigScale + ')';
      // fade in on arrival, fade out once she has landed
      const fadeIn = Math.min(1, pf / 0.16);
      const fadeOut = Math.min(1, Math.max(0, (1 - pf) / 0.14));
      cf.style.opacity = String(Math.min(fadeIn, fadeOut));
      // each beat rides the scroll: enter from below, leave upward
      const win = (el, a, b) => {
        if (!el) return;
        const fade = Math.min(0.06, (b - a) * 0.28);
        let o = 0;
        if (p > a && p < b) {
          const inn = Math.min(1, (p - a) / fade);
          const out = Math.min(1, (b - p) / fade);
          const t = Math.min(inn, out);
          o = t * t * (3 - 2 * t);
        }
        el.style.opacity = String(o);
        el.style.pointerEvents = o > 0.08 ? 'auto' : 'none';
        const span = Math.max(0.001, b - a);
        const t = Math.max(0, Math.min(1, (p - a) / span));
        const travel = h * 0.58;
        el.style.transform = 'translateY(' + ((0.5 - t) * travel) + 'px)';
      };
      win(this.refs2.beat1, -0.02, 0.22);
      win(this.refs2.beat2, 0.30, 0.62);
      win(this.refs2.beat3, 0.66, 0.92);
      // kiki plays her own timed entrance once beat2 comes into view
      if (this.refs2.kikiStar && !this._kikiFlew && p > 0.36) {
        this._kikiFlew = true;
        const el = this.refs2.kikiStar;
        el.style.transition = 'opacity 2.2s ease, transform 2.8s cubic-bezier(.34,0,.5,1)';
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateX(0) rotate(0deg)';
        });
      }
      // beat visuals
      if (this.refs2.moon) {
        const o = Math.max(0, 1 - Math.abs(p - 0.22) / 0.3);
        this.refs2.moon.style.opacity = String(o * 0.9);
        this.refs2.moon.style.transform = 'translateY(' + ((p - 0.22) * -120) + 'px)';
      }

      if (this.refs2.clouds) {
        // the forest has to be waiting below before Kiki arrives, so it rises
        // ahead of beat3 (0.66) and is fully there by where the reader settles
        const raw = Math.max(0, Math.min(1, (p - 0.54) / 0.20));
        const fadeIn = raw * raw * (3 - 2 * raw);
        const exit = Math.max(0, Math.min(1, (p - 0.9) / 0.1));
        const exitEase = exit * exit * (3 - 2 * exit);
        const fadeOut = 1 - exitEase;
        const o = fadeIn * fadeOut;
        this.refs2.clouds.style.opacity = String(o * 0.95);
        this.refs2.clouds.style.transform = 'translateY(' + (((1 - fadeIn) * 10) - exitEase * 18) + 'vh)';
      }
    }
    // gentle fade-up reveals, driven from live rects on scroll only
    // fade in as copy enters, fade out as it leaves so adjacent scenes do not stack
    for (let i = 0; i < reveals.length; i++) {
      const el = reveals[i];
      const r = geometry.revealRects[i];
      if (r.bottom < -h || r.top > h * 2) {
        if (el._csO !== 0) { el._csO = 0; el.style.opacity = '0'; }
        if (el._csY !== 16) { el._csY = 16; el.style.transform = 'translateY(16px)'; }
        continue;
      }
      const inn = Math.max(0, Math.min(1, (h * 0.86 - r.top) / (h * 0.26)));
      const out = Math.max(0, Math.min(1, (r.bottom - h * 0.14) / (h * 0.26)));
      const t = Math.min(inn, out);
      const o = t * t * (3 - 2 * t);
      const op = Math.round(o * 100) / 100;
      const ty = ((1 - o) * 16) | 0;
      if (el._csO !== op) { el._csO = op; el.style.opacity = String(op); }
      if (el._csY !== ty) { el._csY = ty; el.style.transform = 'translateY(' + ty + 'px)'; }
    }
    // cloud cat + audience cats (rect-driven; IO does not fire in this host)
    if (co && !this._coFlew) {
      const r = geometry.catOtherRect;
      if (r.top < h * 0.82 && r.bottom > 0) {
        this._coFlew = true;
        co.style.opacity = '1';
        co.style.transform = 'translate(0, 0) rotate(0deg)';
        setTimeout(() => {
          const c = this.refs2.catsSurround;
          if (c) { c.style.opacity = '.9'; c.style.transform = 'translateY(0)'; }
        }, 4200);
      }
    }
    this.updateAudioZones(h, geometry);
    if (this.refs2.topBtn) {
      const beforeFooter = !geometry.footerRect || geometry.footerRect.top >= h;
      this.refs2.topBtn.classList.toggle('is-on', scrollY > 360 && beforeFooter);
    }
    if (s3) {
      const r3 = geometry.scene3Rect;
      this._s3Vis = Math.max(0, Math.min(1, (h - r3.top) / h)) * Math.max(0, Math.min(1, r3.bottom / h));
    } else {
      this._s3Vis = 0;
    }
    // scene 5 dawn (removed for the polo event page)
    this.dayAlpha = 0;
    if (this.refs2.dayBg) this.refs2.dayBg.style.opacity = '0';
  }

  draw(t) {
    const c = this.refs2.canvas;
    if (!c) return;
    const ctx = this._ctx || c.getContext('2d');
    const w = c.width, h = c.height;
    const night = 1 - this.dayAlpha;
    const idleSky = night <= 0.02 && !this.magicShots.length && !this.shooters.length;
    if (idleSky) {
      if (!this._canvasCleared) {
        ctx.clearRect(0, 0, w, h);
        this._canvasCleared = true;
      }
      return;
    }
    this._canvasCleared = false;
    ctx.clearRect(0, 0, w, h);
    const dpr = this._dpr || Math.min(1.5, devicePixelRatio || 1);
    const heroVisible = window.scrollY < window.innerHeight * 0.9;
    const mx = (this.mx || -9999) * dpr, my = (this.my || -9999) * dpr;
    const px = heroVisible ? ((this.mx || window.innerWidth / 2) / window.innerWidth - 0.5) : 0;
    const py = heroVisible ? ((this.my || window.innerHeight / 2) / window.innerHeight - 0.5) : 0;
    const mobileDim = this.compactUi() ? 0.4 : 1;
    const nearR2 = (170 * dpr) * (170 * dpr);
    if (night > 0.02) {
      ctx.fillStyle = '#e9edff';
      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i];
        const a = (0.42 + 0.48 * Math.abs(Math.sin(s.p))) * night * mobileDim;
        const ox = heroVisible ? -px * s.s * 18 * dpr : 0;
        const oy = heroVisible ? -py * s.s * 12 * dpr : 0;
        const sx = s.x * w + ox, sy = s.y * h + oy;
        let boost = 1;
        if (heroVisible && this.mx) {
          const dx = sx - mx, dy = sy - my;
          if (dx * dx + dy * dy < nearR2) boost = 1.6;
        }
        ctx.globalAlpha = Math.min(1, a * boost);
        const rr = s.r * dpr * boost;
        ctx.fillRect(sx - rr, sy - rr, rr * 2, rr * 2);
      }
      const logo = this.refs2.logoHero;
      let logoTx = 0, logoTy = 0, logoReady = false;
      if (this.magicShots.length && logo) {
        const lr = logo.getBoundingClientRect();
        logoTx = (lr.left + lr.width / 2) * dpr;
        logoTy = (lr.top + lr.height / 2) * dpr;
        logoReady = true;
      }
      for (let i = this.magicShots.length - 1; i >= 0; i--) {
        const m = this.magicShots[i];
        m.life += 0.025;
        if (m.life >= 1) {
          this.magicShots.splice(i, 1);
          this.glowT = t;
          continue;
        }
        const tx = logoReady ? logoTx : m.tx;
        const ty = logoReady ? logoTy : m.ty;
        const e = 1 - Math.pow(1 - m.life, 3);
        const cx = m.x + (tx - m.x) * e;
        const cy = m.y + (ty - m.y) * e - Math.sin(m.life * Math.PI) * 80 * dpr;
        ctx.globalAlpha = 0.9 * night;
        ctx.fillStyle = '#8fd6ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3 * dpr, 0, 7);
        ctx.fill();
        for (let k = 1; k <= 3; k++) {
          const e2 = 1 - Math.pow(1 - Math.max(0, m.life - k * 0.04), 3);
          const hx = m.x + (tx - m.x) * e2;
          const hy = m.y + (ty - m.y) * e2 - Math.sin(Math.max(0, m.life - k * 0.04) * Math.PI) * 80 * dpr;
          ctx.globalAlpha = (0.5 - k * 0.1) * night;
          ctx.fillRect(hx - dpr, hy - dpr, 2 * dpr, 2 * dpr);
        }
      }
      if (logo) {
        const dt = t - this.glowT;
        if (this.glowT > 0 && dt < 1.4) {
          const g = Math.sin(Math.min(1, dt / 1.4) * Math.PI);
          logo.style.filter = 'drop-shadow(0 6px 22px rgba(0,0,0,.45)) drop-shadow(0 0 ' + (26 * g) + 'px rgba(90,180,255,' + (0.85 * g) + '))';
        } else if (this.glowT > 0 && dt < 1.6) {
          logo.style.filter = 'drop-shadow(0 6px 22px rgba(0,0,0,.45))';
          this.glowT = 0;
        }
      }
      for (let i = this.shooters.length - 1; i >= 0; i--) {
        const sh = this.shooters[i];
        if (sh.lastT == null) sh.lastT = t;
        const step = Math.min(0.1, Math.max(0, t - sh.lastT));
        sh.lastT = t;
        sh.life += step / 1.4;
        if (sh.life > 1) { this.shooters.splice(i, 1); continue; }
        const x = (sh.x + sh.dx * sh.life) * w, y = (sh.y + sh.dy * sh.life) * h;
        const vx = sh.dx * w, vy = sh.dy * h;
        const vl = Math.max(1, Math.hypot(vx, vy));
        const ux = vx / vl, uy = vy / vl;
        const tail = Math.min(130 * dpr, vl * 0.38);
        const tx = x - vx / vl * tail, ty = y - vy / vl * tail;
        const alpha = night * Math.sin(sh.life * Math.PI);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.18;
        ctx.lineWidth = 0.55 * dpr;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x - ux * tail * 0.48, y - uy * tail * 0.48);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.42;
        ctx.lineWidth = 0.82 * dpr;
        ctx.beginPath();
        ctx.moveTo(x - ux * tail * 0.52, y - uy * tail * 0.52);
        ctx.lineTo(x - ux * tail * 0.18, y - uy * tail * 0.18);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.82;
        ctx.lineWidth = 1.05 * dpr;
        ctx.beginPath();
        ctx.moveTo(x - ux * tail * 0.2, y - uy * tail * 0.2);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        ctx.arc(x, y, 1.55 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const vis = this._s3Vis || 0;
      if (vis > 0.05) {
        ctx.fillStyle = '#d9f79a';
        const ffDim = this.compactUi() ? 0.45 : 1;
        for (let i = 0; i < this.fireflies.length; i++) {
          const f = this.fireflies[i];
          f.x += f.vx + Math.sin(t * 0.7 + f.p) * 0.0004;
          f.y += f.vy + Math.cos(t * 0.5 + f.p) * 0.0003;
          if (f.x < 0) f.x = 1; if (f.x > 1) f.x = 0;
          if (f.y < 0.3) f.y = 0.95; if (f.y > 1) f.y = 0.35;
          const a = (0.25 + 0.75 * Math.abs(Math.sin(t * 1.4 + f.p * 3))) * vis * night * ffDim;
          ctx.globalAlpha = a;
          const fx = f.x * w, fy = f.y * h, fr = 2 * dpr;
          ctx.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // load the IFrame API once, then run build() as soon as it is available
  ensureYtApi(build) {
    if (build()) return;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) try { prev(); } catch (e) {} build(); };
    if (!document.querySelector('script[data-yt-api]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.setAttribute('data-yt-api', '1');
      document.head.appendChild(tag);
    }
  }

  initTrailer() {
    const mount = this.refs2.ytStage;
    if (!mount) return;
    const holder = document.createElement('div');
    mount.appendChild(holder);
    this.ensureYtApi(() => {
      if (!window.YT || !window.YT.Player) return false;
      this.ytPlayer = new window.YT.Player(holder, {
        videoId: 'Y7GAFRahuNc',
        playerVars: { autoplay: 1, mute: 1, controls: 0, loop: 1, playlist: 'Y7GAFRahuNc', modestbranding: 1, playsinline: 1, rel: 0, disablekb: 1, fs: 0 },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
            this.ytReady = true;
            if (this.refs2.ytStage) this.refs2.ytStage.style.opacity = '0.45';
            if (this.refs2.ytStageWrap) this.refs2.ytStageWrap.style.opacity = '1';
          }
        }
      });
      return true;
    });
  }

  // a speech bubble that pops right where the cat was tapped
  popMeow(e) {
    const host = e && e.currentTarget;
    if (!host) return;
    const r = host.getBoundingClientRect();
    const b = document.createElement('div');
    b.textContent = this._meowText || '야옹 ~';
    b.style.cssText = 'position:fixed;left:' + (r.left + r.width * 0.62) + 'px;top:' + (r.top + r.height * 0.18) +
      'px;transform:translate(-50%,-50%);padding:7px 14px;background:#f3efe2;color:#2c2418;' +
      'font-family:var(--cs-cjk, "Gowun Batang"), "Gowun Batang", serif;font-weight:700;font-size:15px;' +
      'border-radius:14px 14px 14px 3px;box-shadow:0 4px 14px rgba(0,0,0,.25);pointer-events:none;z-index:60;' +
      'opacity:0;animation:csMeowPop 1.5s ease-out forwards;';
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1600);
  }

  playMeow(host) {
    const now = performance.now();
    if (this._meowAt && now - this._meowAt < 220) return;
    this._meowAt = now;
    this.popMeow({ currentTarget: host });
    if (!this.soundEnabled() || this._yielded) return;
    try {
      const a = this.ensureAudio();
      if (a.ctx.resume) a.ctx.resume();
      const t0 = a.ctx.currentTime;
      const o = a.ctx.createOscillator();
      const o2 = a.ctx.createOscillator();
      const g = a.ctx.createGain();
      o.type = 'sine';
      o2.type = 'triangle';
      o.frequency.setValueAtTime(620, t0);
      o.frequency.linearRampToValueAtTime(920, t0 + 0.12);
      o.frequency.linearRampToValueAtTime(480, t0 + 0.42);
      o2.frequency.setValueAtTime(310, t0);
      o2.frequency.linearRampToValueAtTime(460, t0 + 0.12);
      o2.frequency.linearRampToValueAtTime(240, t0 + 0.42);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.14, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.52);
      o.connect(g);
      o2.connect(g);
      g.connect(a.ctx.destination);
      o.start(t0);
      o2.start(t0);
      o.stop(t0 + 0.55);
      o2.stop(t0 + 0.55);
    } catch (err) {}
  }

  spawnSteam(strong, which) {
    if (this.reducedMotion()) return;
    const box = which === 2 ? this.refs2.steam2 : this.refs2.steam;
    if (!box) return;
    const r = box.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    if (box.childElementCount > 6) return;
    const d = document.createElement('div');
    const size = strong ? 34 + Math.random() * 26 : 22 + Math.random() * 18;
    d.style.cssText = 'position:absolute;bottom:0;left:' + (Math.random() * 100) + '%;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:radial-gradient(circle, rgba(255,252,240,' + (strong ? .7 : .45) + ') 0%, rgba(255,252,240,0) 70%);animation:csSteam ' + (2.2 + Math.random()) + 's ease-out forwards;';
    box.appendChild(d);
    setTimeout(() => d.remove(), 3400);
  }

  ensureAudio() {
    if (this.audio) return this.audio;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 700;
    filt.connect(master);
    master.connect(ctx.destination);
    const freqs = [130.8, 196, 261.6, 329.6];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.016;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07 + i * 0.03;
      const lg = ctx.createGain();
      lg.gain.value = 0.01;
      lfo.connect(lg);
      lg.connect(g.gain);
      o.connect(g);
      g.connect(filt);
      o.start();
      lfo.start();
    });
    this.audio = { ctx, master };
    return this.audio;
  }

  hidePrologue() {
    clearTimeout(this._proHide);
    const el = this.refs2 && this.refs2.prologue;
    if (!el || el._gone) return;
    el._gone = true;
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; }, 1600);
  }

  startCookLoop() {
    if (this.reducedMotion() || this._cookLoop || !this.refs2.cookFrame) return;
    let on = false;
    const tick = () => {
      if (this.reducedMotion()) {
        this._cookLoop = null;
        return;
      }
      const img = this.refs2.cookFrame;
      if (!img) {
        this._cookLoop = null;
        return;
      }
      on = !on;
      img.style.opacity = on ? '1' : '0';
      const a = this.refs2.cookFrame1;
      if (a) a.style.opacity = on ? '0' : '1';
      this._cookLoop = setTimeout(tick, on ? 800 : 2200);
    };
    this._cookLoop = setTimeout(tick, 2200);
  }

  // The runtime called every ref on every render, which is how the sound and
  // menu buttons kept their label and open state current. Here they run once at
  // mount and syncUi re-runs the five that mirror state.
  refCallbacks() {
    return {
      catOther: (el) => { this.refs2.catOther = el; if (el) requestAnimationFrame(() => this.watchCatOther(el)); },
      catsSurround: this.ref('catsSurround'),
      guitarSection2: (el) => { this.refs2.guitarSection2 = el; },
      guitarSection: (el) => { this.refs2.guitarSection = el; if (el) requestAnimationFrame(() => this.watchGuitar(el)); },
      topBtn: (el) => {
        this.refs2.topBtn = el;
        if (!el || el._csTopBound) return;
        el._csTopBound = true;
        el.addEventListener('click', (e) => this.goTopNow(e));
      },
      footer: this.ref('footer'),
      loader: this.ref2('loader'),
      loaderStars: (el) => { this.refs2.loaderStars = el; if (el) requestAnimationFrame(() => this.startLoaderStars(el)); },
      loaderBar: this.ref2('loaderBar'),
      bgm: this.ref('bgm'),
      soundBtn: (el) => {
        this.refs2.soundBtn = el;
        if (!el) return;
        const on = this.soundEnabled();
        el.classList.toggle('is-off', !on);
        el.title = on ? '♪ ' + T.bgmOff : '♪ ' + T.bgmOn;
        el.setAttribute('aria-label', el.title);
        if (el._csSoundBound) return;
        el._csSoundBound = true;
        el.addEventListener('pointerup', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleSoundNow();
        }, { passive: false });
      },
      menuBtn: (el) => {
        this.refs2.menuBtn = el;
        if (!el) return;
        el.classList.toggle('is-open', !!this._menuOpen);
        el.setAttribute('aria-expanded', this._menuOpen ? 'true' : 'false');
        el.title = this._menuOpen ? T.navClose : T.navMenu;
        el.setAttribute('aria-label', el.title);
        if (el._csMenuBound) return;
        el._csMenuBound = true;
        el.addEventListener('pointerup', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleMenuNow();
        }, { passive: false });
      },
      socialWrap: (el) => { this.refs2.socialWrap = el; },
      socialNav: (el) => {
        this.refs2.socialNav = el;
        if (!el || el._csSocialBound) return;
        el._csSocialBound = true;
        el.addEventListener('click', (e) => this.toggleSocialNow(e));
      },
      nav: (el) => {
        this.refs2.nav = el;
        if (!el) return;
        el.classList.toggle('is-open', !!this._menuOpen);
        this.scheduleNavMode();
        if (el._csNavBound) return;
        el._csNavBound = true;
        el.addEventListener('click', (e) => {
          if (e.target === el) { this.closeMenu(); return; }
          // Every link used to close the menu through its own onClick. A host
          // that strips on* attributes left them open, so the menu delegates
          // instead. The social entry only opens its submenu, so it stays put.
          const a = e.target.closest && e.target.closest('a');
          if (a && el.contains(a) && !a.classList.contains('cs-nav-social')) this.closeMenu();
        });
      },
      menuScrim: (el) => {
        this.refs2.menuScrim = el;
        if (!el) return;
        el.classList.toggle('is-open', !!this._menuOpen);
        if (el._csScrimBound) return;
        el._csScrimBound = true;
        el.addEventListener('click', () => this.closeMenu());
      },
      topbar: (el) => {
        this.refs2.topbar = el;
        if (el) el.classList.toggle('is-menu-open', !!this._menuOpen);
      },
      trailerSection: (el) => { this.refs2.trailerSection = el; if (el) requestAnimationFrame(() => this.watchTrailerFade(el)); },
      trailerBox: (el) => {
        this.refs2.trailerBox = el;
        if (!el || el._csTrailerBound) return;
        el._csTrailerBound = true;
        el.addEventListener('click', () => this.playTrailer());
      },
      trailerPoster: this.ref('trailerPoster'),
      storyNav: (el) => {
        if (!el || el._csStoryBound) return;
        el._csStoryBound = true;
        el.addEventListener('click', (e) => this.jumpToStory(e));
      },
      dayBg: this.ref('dayBg'),
      canvas: this.ref('canvas'),
      scene2: this.ref('scene2'),
      scene3: this.ref('scene3'),
      scene5: this.ref('scene5'),
      catFall: this.ref('catFall'),
      beat1: this.ref('beat1'),
      beat2: this.ref('beat2'),
      kikiStar: this.ref('kikiStar'),
      beat3: this.ref('beat3'),
      clouds: this.ref('clouds'),
      potArea: this.ref('potArea'),
      ladle: this.ref('ladle'),
      steam: this.ref('steam'),
      steam2: this.ref('steam2'),
      soupRipple: this.ref('soupRipple'),
      tiltCat: (el) => {
        this.refs2.tiltCat = el;
        if (!el || el._csStirBound) return;
        el._csStirBound = true;
        el.addEventListener('touchstart', () => { this.stirring = true; }, { passive: true });
        el.addEventListener('touchmove', (e) => {
          const t = e.touches && e.touches[0];
          if (!t) return;
          const now = performance.now();
          if (now - this.lastSteam > 160) {
            this.lastSteam = now;
            this.spawnSteam(true);
          }
        }, { passive: true });
        el.addEventListener('touchend', () => { this.stirring = false; }, { passive: true });
      },
      cookFrame1: this.ref('cookFrame1'),
      cookFrame: (el) => {
        this.refs2.cookFrame = el;
        if (el) this.startCookLoop();
      },
      meowBubble: this.ref('meowBubble')
    };
  }

  bindRefs() {
    this._refMap = this.refCallbacks();
    const nodes = document.querySelectorAll('[data-ref]');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const fn = this._refMap[el.getAttribute('data-ref')];
      if (fn) fn(el);
    }
  }

  // stands in for a re-render: only the refs that read state need re-running
  syncUi() {
    const stateful = ['soundBtn', 'menuBtn', 'nav', 'menuScrim', 'topbar'];
    for (let i = 0; i < stateful.length; i++) {
      const el = this.refs2[stateful[i]];
      const fn = this._refMap && this._refMap[stateful[i]];
      if (el && fn) fn(el);
    }
    this.componentDidUpdate();
  }

  setState(patch) {
    if (typeof patch === 'function') patch = patch(this.state);
    Object.assign(this.state, patch);
    this.syncUi();
  }

  // Korean is the source language. A second language means a sibling of T and
  // a choice of dictionary here; the markup already carries the keys.
  applyText() {
    let nodes = document.querySelectorAll('[data-i18n]');
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].textContent = T[nodes[i].getAttribute('data-i18n')] || '';
    }
    // these carry markup after their text, so only the leading text node moves
    nodes = document.querySelectorAll('[data-i18n-first]');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const val = T[el.getAttribute('data-i18n-first')] || '';
      const first = el.firstChild;
      if (first && first.nodeType === 3) first.nodeValue = val;
      else el.insertBefore(document.createTextNode(val), el.firstChild);
    }
    const attrs = [['data-i18n-alt', 'alt'], ['data-i18n-title', 'title'], ['data-i18n-aria', 'aria-label']];
    for (let a = 0; a < attrs.length; a++) {
      nodes = document.querySelectorAll('[' + attrs[a][0] + ']');
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].setAttribute(attrs[a][1], T[nodes[i].getAttribute(attrs[a][0])] || '');
      }
    }
  }

  mount() {
    this._T = T;
    this._meowText = T.meowText || '야옹 ~';
    this.applyText();
    this.bindRefs();
    this.componentDidMount();
  }
}

const app = new CatsSoupPage({ particleDensity: 2, fontKr: 'Gowun Batang', trackKr: -1, leadingKr: 1.4 });
window.__csApp = app;

function boot() { app.mount(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();

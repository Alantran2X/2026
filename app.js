const FUT_MS = new Date("2026-02-17T00:00:00+07:00").getTime();
const UNLOCK_KEY = "hny2026_unlocked_v1";
let lastSeconds = null;
let lastMode = "";
let x;

let trustedBaseMs = null;
let trustedPerfBase = null;
let trustedConfidence = null;
let syncingClock = false;

function setTrustedBase(ms, confidence) {
  trustedBaseMs = ms;
  trustedPerfBase = performance.now();
  trustedConfidence = confidence || null;
}

function trustedNowMs() {
  if (trustedBaseMs == null || trustedPerfBase == null) return null;
  return trustedBaseMs + (performance.now() - trustedPerfBase);
}

function markUnlocked() {
  try { localStorage.setItem(UNLOCK_KEY, "1"); } catch (_) {}
}

function hasUnlockedFlag() {
  try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch (_) { return false; }
}

function isTrustedEnoughToUnlock() {
  const c = String(trustedConfidence || "").toLowerCase();
  return c && c !== "low";
}

function isUnlockedByTrustedTime() {
  const now = trustedNowMs();
  return isTrustedEnoughToUnlock() && Number.isFinite(now) && now >= FUT_MS;
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function getNowFromTimeNow() {
  const data = await fetchJsonWithTimeout(
    "https://time.now/developer/api/timezone/Asia/Ho_Chi_Minh",
    2500
  );
  const sec = Number(data && data.unixtime);
  return Number.isFinite(sec) ? sec * 1000 : null;
}

async function syncTrustedClock() {
  if (syncingClock) return;
  syncingClock = true;
  try {
    try {
      const data = await fetchJsonWithTimeout("/api/now", 2500);
      const ms = Number(data && data.now);
      const confidence = String((data && data.confidence) || "").toLowerCase();
      if (Number.isFinite(ms) && confidence && confidence !== "low") {
        setTrustedBase(ms, confidence);
        return;
      }
    } catch (_) {}
    try {
      const ms2 = await getNowFromTimeNow();
      if (Number.isFinite(ms2)) {
        setTrustedBase(ms2, "external");
        return;
      }
    } catch (_) {}
    try {
      const data2 = await fetchJsonWithTimeout("/api/now", 2500);
      const ms3 = Number(data2 && data2.now);
      const confidence2 = String((data2 && data2.confidence) || "").toLowerCase();
      if (Number.isFinite(ms3)) {
        setTrustedBase(ms3, confidence2 || "low");
      }
    } catch (_) {}
  } finally {
    syncingClock = false;
  }
}


function applyModeClass(mode) {
  if (mode !== lastMode) {
    document.body.classList.remove("mode-hms", "mode-ms", "mode-s", "mode-all");
    if (mode) document.body.classList.add(mode);
    lastMode = mode;
  }
}

function showBoxes(showDays, showHours, showMinutes, showSeconds) {
  document.getElementById("daysBox").style.display = showDays ? "" : "none";
  document.getElementById("hoursBox").style.display = showHours ? "" : "none";
  document.getElementById("minutesBox").style.display = showMinutes ? "" : "none";
  document.getElementById("secondsBox").style.display = showSeconds ? "" : "none";
}

function setNumbers(days, hours, minutes, seconds) {
  document.getElementById("days").innerText = days;
  document.getElementById("hours").innerText = hours;
  document.getElementById("minutes").innerText = minutes;
  document.getElementById("seconds").innerText = seconds;
}

function goIntro() {
  if (x) clearInterval(x);
  markUnlocked();
  sessionStorage.setItem("fromIndex", "1");
  window.location.href = "intro.html?from=index";
}

function stime() {

  if (hasUnlockedFlag()) {
    goIntro();
    return;
  }

  if (isUnlockedByTrustedTime()) {
    goIntro();
    return;
  }


  const nowTrusted = trustedNowMs();
  const now = Number.isFinite(nowTrusted) ? nowTrusted : Date.now(); 
  let D = FUT_MS - now;
  if (!Number.isFinite(D)) D = 0;
  if (D < 0) D = 0;

  const totalSeconds = Math.floor(D / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  if (seconds !== lastSeconds) {
    setNumbers(days, hours, minutes, seconds);
    lastSeconds = seconds;
  }


  if (D <= 60 * 1000) {
    showBoxes(false, false, false, true);
    applyModeClass("mode-s");
  } else if (D <= 60 * 60 * 1000) {
    showBoxes(false, false, true, true);
    applyModeClass("mode-ms");
  } else if (D <= 24 * 60 * 60 * 1000) {
    showBoxes(false, true, true, true);
    applyModeClass("mode-hms");
  } else {
    showBoxes(true, true, true, true);
    applyModeClass("mode-all");
  }
}


syncTrustedClock();
setInterval(syncTrustedClock, 60 * 1000);

stime();
x = setInterval(stime, 200);


const PLAYLIST = [
  { title: "Playlist 1", src: "music/tet01.mp3" },
  { title: "Playlist 2", src: "music/tet02.mp3" },
  { title: "Playlist 3", src: "music/tet03.mp3" },
];
const EFFECT_FRAME_COUNT = 20;
const EFFECT_LOOP_MS = 2650;
let trackIndex = 0;
let isPlaying = false;

function initMusicPlayer() {
  const audio = document.getElementById("player");
  const titleEl = document.getElementById("musicTitle");
  const btnPlayPause = document.getElementById("btnPlayPause");
  const btnStop = document.getElementById("btnStop");
  const btnNext = document.getElementById("btnNext");
  const btnPrev = document.getElementById("btnPrev");
  const progress = document.getElementById("progress");
  const curTimeEl = document.getElementById("curTime");
  const durTimeEl = document.getElementById("durTime");

  function fmtTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "00:00:00";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return (
      String(h).padStart(2, "0") + ":" +
      String(m).padStart(2, "0") + ":" +
      String(s).padStart(2, "0")
    );
  }

  let isSeeking = false;
  audio.addEventListener("loadedmetadata", () => {
    if (durTimeEl) durTimeEl.textContent = fmtTime(audio.duration);
    if (curTimeEl) curTimeEl.textContent = fmtTime(audio.currentTime);
    if (progress) progress.value = 0;
  });

  audio.addEventListener("timeupdate", () => {
    if (!progress || isSeeking) return;
    const d = audio.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    progress.value = (audio.currentTime / d) * 100;
    if (curTimeEl) curTimeEl.textContent = fmtTime(audio.currentTime);
  });

  if (progress) {
    progress.addEventListener("input", () => {
      isSeeking = true;
      const d = audio.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      const t = (progress.value / 100) * d;
      if (curTimeEl) curTimeEl.textContent = fmtTime(t);
    });
    progress.addEventListener("change", () => {
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) {
        audio.currentTime = (progress.value / 100) * d;
      }
      isSeeking = false;
    });
  }

  if (!audio || !btnPlayPause || !btnStop || !btnNext || !btnPrev) return;

  function loadTrack(i) {
    trackIndex = (i + PLAYLIST.length) % PLAYLIST.length;
    audio.src = PLAYLIST[trackIndex].src;
    titleEl.textContent = PLAYLIST[trackIndex].title || PLAYLIST[trackIndex].src;
    if (progress) progress.value = 0;
    if (curTimeEl) curTimeEl.textContent = "0:00";
    if (durTimeEl) durTimeEl.textContent = "0:00";
  }

  async function play() {
    try {
      await audio.play();
      isPlaying = true;
      btnPlayPause.textContent = "⏸";
    } catch (e) {
      isPlaying = false;
      btnPlayPause.textContent = "▶";
    }
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    btnPlayPause.textContent = "▶";
  }

  function stop() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    btnPlayPause.textContent = "▶";
  }

  function next() {
    loadTrack(trackIndex + 1);
    if (isPlaying) play();
  }

  function prev() {
    loadTrack(trackIndex - 1);
    if (isPlaying) play();
  }

  btnPlayPause.addEventListener("click", () => {
    if (!PLAYLIST.length) return;
    if (!audio.src) loadTrack(trackIndex);
    if (audio.paused) play();
    else pause();
  });

  btnStop.addEventListener("click", () => stop());
  btnNext.addEventListener("click", () => next());
  btnPrev.addEventListener("click", () => prev());

  audio.addEventListener("ended", () => {
    next();
  });

  if (PLAYLIST.length) loadTrack(0);
}

function initAmazingEffectFallback() {
  const canvas = document.getElementById("effectCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { desynchronized: true });
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  if (typeof ctx.imageSmoothingQuality === "string") {
    ctx.imageSmoothingQuality = "medium";
  }

  const frameUrls = Array.from(
    { length: EFFECT_FRAME_COUNT },
    (_, i) => `Effect/amazingfeature/image/a${i}.png`
  );
  const MASK_THRESHOLD_LOW = 0.14;
  const MASK_THRESHOLD_HIGH = 0.74;
  const MASK_LUMA_LOW = 0.1;
  const MASK_LUMA_HIGH = 0.58;
  const EFFECT_INTENSITY = 1;
  const EXTRA_PASS_ALPHA = 0.56;
  const EXTRA_PASS_SCALE = 1;
  const FRAME_BLEND_WINDOW = 0.18;

  const cw = canvas.width;
  const ch = canvas.height;

  function clamp01(v) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function buildMaskedFrame(img) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return null;
    const off = document.createElement("canvas");
    off.width = img.naturalWidth;
    off.height = img.naturalHeight;
    const offCtx = off.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return null;

    offCtx.drawImage(img, 0, 0);
    const id = offCtx.getImageData(0, 0, off.width, off.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255;
      const g = d[i + 1] / 255;
      const b = d[i + 2] / 255;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      const brightAlpha = smoothstep(MASK_THRESHOLD_LOW, MASK_THRESHOLD_HIGH, mx);
      const lumaAlpha = smoothstep(MASK_LUMA_LOW, MASK_LUMA_HIGH, luma);
      const satFactor = smoothstep(0.03, 0.45, sat);
      const sparkBoost = smoothstep(0.72, 1, mx) * 0.5;

      let a = brightAlpha * (0.72 + 0.28 * satFactor);
      a = Math.max(a, lumaAlpha * 0.72);
      a = clamp01(a * 1.04 + sparkBoost);
      d[i + 3] = Math.round(255 * a);
    }

    offCtx.putImageData(id, 0, 0);
    return off;
  }

  function createFittedCanvas(source, scaleMult) {
    if (!source) return null;
    const sw = source.width || source.naturalWidth;
    const sh = source.height || source.naturalHeight;
    if (!sw || !sh) return null;

    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    const outCtx = out.getContext("2d");
    if (!outCtx) return null;
    outCtx.imageSmoothingEnabled = true;
    if (typeof outCtx.imageSmoothingQuality === "string") {
      outCtx.imageSmoothingQuality = "medium";
    }

    const scale = Math.max(cw / sw, ch / sh) * scaleMult;
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (cw - dw) * 0.5;
    const dy = (ch - dh) * 0.5;
    outCtx.drawImage(source, dx, dy, dw, dh);
    return out;
  }

  function drawPrepared(source, alpha) {
    if (!source || alpha <= 0) return;
    ctx.globalAlpha = alpha * EFFECT_INTENSITY;
    ctx.drawImage(source, 0, 0);
  }

  Promise.all(frameUrls.map((src) => loadImage(src))).then((images) => {
    const frames = images.map((img) => buildMaskedFrame(img));
    if (!frames.some(Boolean)) return;
    const baseFrames = frames.map((frame) => createFittedCanvas(frame, 1));
    const extraFrames = frames.map((frame) => createFittedCanvas(frame, EXTRA_PASS_SCALE));

    const startTs = performance.now();

    function tick(now) {
      const t = ((now - startTs) % EFFECT_LOOP_MS) / EFFECT_LOOP_MS;
      const f = t * baseFrames.length;
      const i0 = Math.floor(f) % baseFrames.length;
      const i1 = (i0 + 1) % baseFrames.length;
      const x = f - Math.floor(f);
      let a0 = 1;
      let a1 = 0;
      if (x > 1 - FRAME_BLEND_WINDOW) {
        const m = (x - (1 - FRAME_BLEND_WINDOW)) / FRAME_BLEND_WINDOW;
        a0 = 1 - m;
        a1 = m;
      }

      ctx.clearRect(0, 0, cw, ch);
      drawPrepared(baseFrames[i0], a0);
      drawPrepared(baseFrames[i1], a1);
      drawPrepared(extraFrames[i0], a0 * EXTRA_PASS_ALPHA);
      drawPrepared(extraFrames[i1], a1 * EXTRA_PASS_ALPHA);
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initMusicPlayer();
  initAmazingEffectFallback();
});

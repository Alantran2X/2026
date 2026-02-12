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


const AUDIO_LIBRARY = {
  music: [
    { title: "Playlist 1", src: "music/tet01.mp3" },
    { title: "Playlist 2", src: "music/tet02.mp3" },
    { title: "Playlist 3", src: "music/tet03.mp3" },
  ],
  podcast: [
    { title: "Podcast 1", src: "music/HSK7-9CHẤT LƯỢNG GIẤC NGỦ睡眠质量 - PODCAST CHINESE.mp3" },
    { title: "Podcast 2", src: "music/HSK7-9CHỈ CẦN DŨNG CẢM MỘT CHÚT, CHÚNG TA SẼ LÀM ĐƯỢC只要勇敢一点咱就能行- PODCAST CHINESE.mp3" },
    { title: "Podcast 3", src: "music/HSK7-9CON NHÀ NGƯỜI TA别人家的孩子- PODCAST CHINESE.mp3" },
    { title: "Podcast 4", src: "music/HSK7-9CUỘC SỐNG THƯỜNG NHẬT LẠI KHIẾN TÔI NGỘ RA ĐIỀU GÌ-日常生活让我又悟出了点啥- AN KHẢ HY - TIẾNG TRUNG.mp3" },
    { title: "Podcast 5", src: "music/HSK7-9ĐÚNG NGƯỜI SAI THỜI ĐIỂM-错的时间对的人谈一谈爱情的时机- AN KHẢ HY - PODCAST TIẾNG TRUNG.mp3" },
    { title: "Podcast 6", src: "music/HSK7-9ĐỪNG NÓI BẢN THÂN KHÔNG XỨNG ĐÁNG NỮA 别再说自己不配了- PODCAST CHINESE.mp3" },
    { title: "Podcast 7", src: "music/HSK7-9GIẢ SỬ SUỐT CUỘC ĐỜI NÀY BẠN CHỈ CÓ THỂ... BẠN SẼ CHỌN GÌ-假如这辈子只能 … 你会怎么选-PODCAST CHINESE.mp3" },
    { title: "Podcast 8", src: "music/HSK7-9HỌC CÁCH TỰ QUAN TÂM CHĂM SÓC BẢN THÂN 学会自我关怀- PODCAST CHINESE.mp3" },
    { title: "Podcast 9", src: "music/HSK7-9KHI BẠN MẤT NGỦ, ĐẾM CỪU KHÔNG CÓ TÁC DỤNG GÌ冷知识失眠的时候数羊是么有用的- PODCAST CHINESE.mp3" },
    { title: "Podcast 10", src: "music/HSK7-9KHI NHẮC ĐẾN 'NGƯỜI BẠN THÂN NHẤT', BẠN SẼ NGHĨ ĐẾN AI-说起最好的朋友你会想起谁- PODCAST CHINESE.mp3" },
    { title: "Podcast 11", src: "music/HSK7-9KHÔNG GHÉT ĐI LÀM, KHÔNG SỢ ĐI HỌC  LÀM SAO ĐỂ CÓ THỂ-不讨厌上班不害怕上学怎么做到- AN KHẢ HY.mp3" },
    { title: "Podcast 12", src: "music/HSK7-9KO NGỪNG LÀM MỚI BẢN THÂN, CUỘC ĐỜI SẼ MÃI CÓ CÂU CHUYỆN ĐỂ KỂ保持自我更新人生就永远有新故事可讲-AN KHẢ HY.mp3" },
    { title: "Podcast 13", src: "music/HSK7-9LÀM THẾ NÀO ĐỂ BẢN THÂN NGỪNG SUY NGHĨ QUÁ NHIỀU 如何让自己不要想太多- PODCAST CHINESE.mp3" },
    { title: "Podcast 14", src: "music/HSK7-9LƯU DIỆC PHI - -CÂU CHUYỆN HOA HỒNG-刘亦菲 -玫瑰的故事- AN KHẢ HY - NGHE TIẾNG TRUNG THỤ ĐỘNG.mp3" },
    { title: "Podcast 15", src: "music/HSK7-9NẾU KHÔNG THỬ, THÌ BẠN SẼ KHÔNG BIẾT CUỘC SỐNG TUYỆT VỜI ĐẾN THẾ NÀO!不去试试你永远不知道生活如此哇塞!.m4a" },
    { title: "Podcast 16", src: "music/HSK7-9NHÌN LẠI MỘT NĂM- DÙ BÌNH DỊ NHƯNG VÔ CÙNG HÀI LÒNG回顾一年平凡却非常满意-CHINESE PODCAST -AN KHẢ HY.mp3" },
    { title: "Podcast 17", src: "music/HSK7-9TẠI SAO ĐÔI KHI CHÚNG TA CẢM THẤY CĂNG THẲNG VÀ LO LẮNG我们有时候为什么会感到紧张- PODCAST CHINESE.mp3" },
    { title: "Podcast 18", src: "music/HSK7-9TǍNG PÍNG LÀ GÌ- CUỘC SỐNG KHÔNG LÀM VIỆC SẼ NHƯ THẾ NÀO什么是躺平不工作的生活会怎么样 PODCAST CHINESE.mp3" },
    { title: "Podcast 19", src: "music/HSK7-9THẾ NÀO LÀ TÔN TRỌNG- ...什么是尊重尊重在所有关系中处于什么位置- AN KHẢ HY - PODCAST TIẾNG TRUNG.mp3" },
    { title: "Podcast 20", src: "music/HSK7-9TÌM VIỆC, CÁCH VIẾT CV ...找工作简历怎么写... 幽默) - PODCAST CHINESE.mp3" },
    { title: "Podcast 21", src: "music/HSK7-9TÔI MUỐN NUÔI DƯỠNG LẠI BẢN THÂN我想重新养育自己- CHINESE PODCAST -AN KHẢ HY - LUYỆN NGHE THỤ ĐỘNG.mp3" },
    { title: "Podcast 22", src: "music/HSK7-9TỪ NGƯỜI YÊU ĐẾN VỢ CHỒNG, PHẢI VƯỢT QUA BAO NHIÊU THỬ THÁCH-从恋人到夫妻要过多少坎儿PODCAST CHINESE.mp3" },
    { title: "Podcast 23", src: "music/HSK7-9VỀ NHÀ ĂN TẾT, CHÚNG TA THÍCH ĐIỀU GÌ- SỢ ĐIỀU GÌ-回家过年我们爱什么怕什么- AN KHẢ HY.mp3" },
  ],
};
const EFFECT_FRAME_COUNT = 20;
const EFFECT_LOOP_MS = 2650;
let activeKind = "music";
const trackIndexByKind = { music: 0, podcast: 0 };
let isPlaying = false;

function initMusicPlayer() {
  const audio = document.getElementById("player");
  const titleEl = document.getElementById("musicTitle");
  const btnPlayPause = document.getElementById("btnPlayPause");
  const btnStop = document.getElementById("btnStop");
  const btnNext = document.getElementById("btnNext");
  const btnPrev = document.getElementById("btnPrev");
  const btnTypeMusic = document.getElementById("btnTypeMusic");
  const btnTypePodcast = document.getElementById("btnTypePodcast");
  const progress = document.getElementById("progress");
  const curTimeEl = document.getElementById("curTime");
  const durTimeEl = document.getElementById("durTime");
  const speedControl = document.querySelector(".speed-control");
  const btnSpeed = document.getElementById("btnSpeed");
  const speedMenu = document.getElementById("speedMenu");
  const speedOptions = Array.from(document.querySelectorAll(".speed-option"));

  if (!audio || !titleEl || !btnPlayPause || !btnStop || !btnNext || !btnPrev) return;

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

  function getActiveList() {
    const list = AUDIO_LIBRARY[activeKind];
    return Array.isArray(list) ? list : [];
  }

  function updateKindButtons() {
    if (btnTypeMusic) btnTypeMusic.classList.toggle("is-active", activeKind === "music");
    if (btnTypePodcast) btnTypePodcast.classList.toggle("is-active", activeKind === "podcast");
  }

  function emptyLabelByKind(kind) {
    return kind === "podcast" ? "No podcast tracks" : "No music tracks";
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

  function formatRate(rate) {
    return Number(rate).toFixed(2).replace(/\.?0+$/, "");
  }

  function closeSpeedMenu() {
    if (!speedMenu || !btnSpeed) return;
    speedMenu.hidden = true;
    btnSpeed.setAttribute("aria-expanded", "false");
  }

  let currentPlaybackRate = 1;
  function setPlaybackRate(rate) {
    if (!Number.isFinite(rate) || rate <= 0) return;
    currentPlaybackRate = rate;
    audio.playbackRate = rate;
    if (btnSpeed) btnSpeed.textContent = `Speed ${formatRate(rate)}x`;
    speedOptions.forEach((opt) => {
      const optRate = Number(opt.dataset.rate);
      const active = Number.isFinite(optRate) && Math.abs(optRate - rate) < 0.001;
      opt.classList.toggle("is-active", active);
    });
  }

  setPlaybackRate(1);

  if (btnSpeed && speedMenu && speedControl && speedOptions.length) {
    btnSpeed.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = speedMenu.hidden;
      speedMenu.hidden = !speedMenu.hidden;
      btnSpeed.setAttribute("aria-expanded", String(willOpen));
    });

    speedOptions.forEach((opt) => {
      opt.addEventListener("click", () => {
        const rate = Number(opt.dataset.rate);
        setPlaybackRate(rate);
        closeSpeedMenu();
      });
    });

    document.addEventListener("click", (e) => {
      if (!speedControl.contains(e.target)) closeSpeedMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSpeedMenu();
    });
  }

  function loadTrack(i) {
    const list = getActiveList();
    if (!list.length) {
      audio.removeAttribute("src");
      audio.load();
      titleEl.textContent = emptyLabelByKind(activeKind);
      if (progress) progress.value = 0;
      if (curTimeEl) curTimeEl.textContent = "0:00";
      if (durTimeEl) durTimeEl.textContent = "0:00";
      return false;
    }
    const idx = (i + list.length) % list.length;
    trackIndexByKind[activeKind] = idx;
    audio.src = list[idx].src;
    audio.playbackRate = currentPlaybackRate;
    titleEl.textContent = list[idx].title || list[idx].src;
    if (progress) progress.value = 0;
    if (curTimeEl) curTimeEl.textContent = "0:00";
    if (durTimeEl) durTimeEl.textContent = "0:00";
    return true;
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
    try { audio.currentTime = 0; } catch (_) {}
    isPlaying = false;
    btnPlayPause.textContent = "▶";
  }

  function next() {
    const list = getActiveList();
    if (!list.length) return;
    loadTrack((trackIndexByKind[activeKind] || 0) + 1);
    if (isPlaying) play();
  }

  function prev() {
    const list = getActiveList();
    if (!list.length) return;
    loadTrack((trackIndexByKind[activeKind] || 0) - 1);
    if (isPlaying) play();
  }

  function switchKind(kind) {
    if (!AUDIO_LIBRARY[kind] || kind === activeKind) return;
    const shouldResume = isPlaying && !audio.paused;
    activeKind = kind;
    updateKindButtons();
    const loaded = loadTrack(trackIndexByKind[activeKind] || 0);
    if (loaded && shouldResume) play();
    if (!loaded) stop();
  }

  btnPlayPause.addEventListener("click", () => {
    const list = getActiveList();
    if (!list.length) return;
    if (!audio.src) loadTrack(trackIndexByKind[activeKind] || 0);
    if (audio.paused) play();
    else pause();
  });

  btnStop.addEventListener("click", () => stop());
  btnNext.addEventListener("click", () => next());
  btnPrev.addEventListener("click", () => prev());
  if (btnTypeMusic) btnTypeMusic.addEventListener("click", () => switchKind("music"));
  if (btnTypePodcast) btnTypePodcast.addEventListener("click", () => switchKind("podcast"));

  audio.addEventListener("ended", () => {
    next();
  });

  updateKindButtons();
  loadTrack(trackIndexByKind[activeKind] || 0);
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

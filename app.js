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

window.addEventListener("DOMContentLoaded", initMusicPlayer);
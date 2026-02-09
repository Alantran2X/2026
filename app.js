var fut = new Date("2026-02-17T00:00:00+07:00").getTime();
let lastSeconds = null;
let lastMode = "";
let x;
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
function stime() {
  var now = Date.now();
  var D = fut - now;
  if (D <= 0) {
    if (x) clearInterval(x);
    sessionStorage.setItem("fromIndex", "1");
    window.location.href = "intro.html?from=index";
    return;
  }

  var totalSeconds = Math.floor(D / 1000);
  var days = Math.floor(totalSeconds / (60 * 60 * 24));
  var hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  var minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  var seconds = totalSeconds % 60;
  if (seconds !== lastSeconds) {
    setNumbers(days, hours, minutes, seconds);
    lastSeconds = seconds;
  }
  // mode theo D (tự ẩn/hiện)
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
stime();
x = setInterval(stime, 200);
// ===== MUSIC PLAYER (Countdown page) =====
const PLAYLIST = [
  { title: "Playlist 1", src: "music/Tet 01.mp3" },
  { title: "Playlist 2", src: "music/Tet 02.mp3" },
  { title: "Playlist 3", src: "music/Tet 03.mp3" },
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
    // Lưu ý: nhiều trình duyệt chỉ cho play khi có tương tác người dùng (click)
    try {
      await audio.play();
      isPlaying = true;
      btnPlayPause.textContent = "⏸";
    } catch (e) {
      // bị chặn autoplay -> giữ icon play
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
    if (audio.paused) play(); else pause();
  });
  btnStop.addEventListener("click", () => stop());
  btnNext.addEventListener("click", () => next());
  btnPrev.addEventListener("click", () => prev());
  audio.addEventListener("ended", () => {
    // tự chuyển bài khi hết
    next();
  });
  // tải bài đầu (chưa phát)
  if (PLAYLIST.length) loadTrack(0);
}
window.addEventListener("DOMContentLoaded", initMusicPlayer);
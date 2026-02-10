function median(arr) {
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
}

async function fetchWithTimeout(url, opts, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function nowFromDateHeader(url) {
  const res = await fetchWithTimeout(
    url,
    { method: "GET", cache: "no-store", redirect: "follow" },
    2500
  );
  if (!res.ok) throw new Error("date header http " + res.status);
  const dateStr = res.headers.get("date");
  const ms = Date.parse(dateStr || "");
  if (!Number.isFinite(ms)) throw new Error("date header missing/parse failed");
  return ms;
}

async function nowFromTimeApiIO() {
  const res = await fetchWithTimeout(
    "https://timeapi.io/api/Time/current/zone?timeZone=Asia/Ho_Chi_Minh",
    { cache: "no-store" },
    2500
  );
  if (!res.ok) throw new Error("timeapi http " + res.status);
  const data = await res.json();
  const dt = String((data && (data.dateTime || data.dateTimeUtc)) || "");
  const ms = Date.parse(dt);
  if (!Number.isFinite(ms)) throw new Error("timeapi parse failed");
  return ms;
}

async function nowFromTimeNow() {
  const res = await fetchWithTimeout(
    "https://time.now/developer/api/timezone/Asia/Ho_Chi_Minh",
    { cache: "no-store" },
    2500
  );
  if (!res.ok) throw new Error("time.now http " + res.status);
  const data = await res.json();
  const sec = Number(data && data.unixtime);
  if (!Number.isFinite(sec)) throw new Error("time.now unixtime missing");
  return sec * 1000;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const sources = [];
  const add = (name, ms) => {
    if (Number.isFinite(ms)) sources.push({ name, ms });
  };

  const tasks = [
    ["google_date", () => nowFromDateHeader("https://www.google.com/generate_204")],
    ["cloudflare_date", () => nowFromDateHeader("https://www.cloudflare.com/")],
    ["microsoft_date", () => nowFromDateHeader("https://www.microsoft.com/")],
    ["apple_date", () => nowFromDateHeader("https://www.apple.com/")],
    ["timeapi_io", nowFromTimeApiIO],
    ["time_now_api", nowFromTimeNow],
  ];

  await Promise.allSettled(
    tasks.map(async ([name, fn]) => {
      try {
        const ms = await fn();
        add(name, ms);
      } catch (_) { }
    })
  );

  let chosenMs;
  let confidence;

  if (sources.length >= 2) {
    chosenMs = median(sources.map((s) => s.ms));
    const arr = sources.map((s) => s.ms);
    const spread = Math.max(...arr) - Math.min(...arr);
    confidence = spread <= 5000 ? "high" : "medium";
  } else if (sources.length === 1) {
    chosenMs = sources[0].ms;
    confidence = "medium";
  } else {
    chosenMs = Date.now();
    confidence = "low";
    add("vercel_clock", chosenMs);
  }

  res.status(200).json({
    ok: true,
    now: chosenMs,
    confidence,
    sources,
  });
};
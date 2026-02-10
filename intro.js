
(() => {
    const FUT_MS = new Date("2026-02-17T00:00:00+07:00").getTime();
    const UNLOCK_KEY = "hny2026_unlocked_v1";

    document.documentElement.style.visibility = "hidden";

    function setVisible() {
        document.documentElement.style.visibility = "";
    }

    function markUnlocked() {
        try { localStorage.setItem(UNLOCK_KEY, "1"); } catch (_) { }
    }

    function hasUnlockedFlag() {
        try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch (_) { return false; }
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

    async function gate() {
        if (hasUnlockedFlag()) {
            setVisible();
            return;
        }

        try {
            const data = await fetchJsonWithTimeout("/api/now", 2500);
            const now = Number(data && data.now);
            const confidence = String((data && data.confidence) || "").toLowerCase();

            if (Number.isFinite(now) && confidence && confidence !== "low") {
                if (now >= FUT_MS) {
                    markUnlocked();
                    setVisible();
                    return;
                }
                window.location.replace("index.html");
                return;
            }
        } catch (_) { }

        try {
            const now2 = await getNowFromTimeNow();
            if (Number.isFinite(now2)) {
                if (now2 >= FUT_MS) {
                    markUnlocked();
                    setVisible();
                    return;
                }
                window.location.replace("index.html");
                return;
            }
        } catch (_) { }

        window.location.replace("index.html");
    }

    gate();
})();
document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const baseW = parseFloat(getComputedStyle(root).getPropertyValue("--base-w")) || 1920;
    const baseH = parseFloat(getComputedStyle(root).getPropertyValue("--base-h")) || 919;
    const stage = document.querySelector(".stage");
    const inner = document.querySelector(".stage-inner");
    const designW = parseFloat(getComputedStyle(root).getPropertyValue("--design-w")) || 1920;
    const designH = parseFloat(getComputedStyle(root).getPropertyValue("--design-h")) || 919;
    const designEl = document.querySelector(".design") || inner;



    function getViewport() {
        const vv = window.visualViewport;
        if (vv) {
            return { vw: vv.width * vv.scale, vh: vv.height * vv.scale };
        }
        return { vw: window.innerWidth, vh: window.innerHeight };
    }
    function updateScale() {
        const { vw, vh } = getViewport();
        const s = Math.min(vw / baseW, vh / baseH);
        root.style.setProperty("--scale", String(s));
    }
    function updateLetterbox() {
        if (!stage || !inner) return;
        const r = inner.getBoundingClientRect();

        stage.style.setProperty("--lb-left", Math.max(0, r.left) + "px");
        stage.style.setProperty("--lb-top", Math.max(0, r.top) + "px");
        stage.style.setProperty("--lb-right", Math.max(0, window.innerWidth - r.right) + "px");
        stage.style.setProperty("--lb-bottom", Math.max(0, window.innerHeight - r.bottom) + "px");
    }

    window.addEventListener("resize", () => {
        updateScale();
        requestAnimationFrame(updateLetterbox);
    }, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", () => {
            updateScale();
            requestAnimationFrame(updateLetterbox);
        }, { passive: true });
    }

    updateScale();
    requestAnimationFrame(updateLetterbox);

    const btn = document.querySelector(".slider1 .box-button .button > button");
    if (btn) {
        btn.addEventListener("click", () => {
            const list = [
                ".flower-img:nth-child(1)",
                ".flower-img:nth-child(2)",
                ".flower-img:nth-child(3)",
                ".flower-img:nth-child(4)",
                ".flower-img:nth-child(5)",
                ".flower-img:nth-child(6)",
                ".circle",
                ".box-slider_img1",
                ".cat",
                ".box-number",
                ".slider1 .box-button",
                ".slider2 .rhombus:nth-child(1)",
                ".slider2 .rhombus:nth-child(2)",
                ".slider2 .rhombus-img",
                ".slider2 .mail",
            ];

            list.forEach((sel) => {
                const el = document.querySelector(sel);
                if (el) el.classList.toggle("active");
            });
        });
    }

    const mailBtn = document.querySelector(".slider2 .mail button");
    const cloverBtn = document.querySelector(".slider2 .mail .heart");
    const slider3 = document.querySelector(".slider3");
    const closeX = document.querySelector(".slider3 .fa-xmark");

    if (mailBtn && slider3) {
        mailBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            slider3.classList.add("active");
        });
    }
    if (cloverBtn) {
        cloverBtn.addEventListener("click", (e) => e.stopPropagation());
    }
    const mailWrap = document.querySelector(".slider2 .mail");
    if (mailWrap) {
        mailWrap.addEventListener("click", (e) => e.stopPropagation());
    }
    if (closeX && slider3) {
        closeX.addEventListener("click", () => slider3.classList.remove("active"));
    }

    const canvas = document.getElementById("fireworks");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    function resizeCanvas() {
        canvas.width = Math.floor(designW * DPR);
        canvas.height = Math.floor(designH * DPR);
        canvas.style.width = designW + "px";
        canvas.style.height = designH + "px";
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener("resize", resizeCanvas, { passive: true });
    resizeCanvas();

    const particles = [];
    const rockets = [];
    const COLORS = ["#FFD54A", "#FF4D4D", "#22C55E", "#60A5FA", "#F472B6"];

    const rand = (min, max) => Math.random() * (max - min) + min;
    const choice = (arr) => arr[(Math.random() * arr.length) | 0];

    function spawnRocket() {
        const x = rand(80, designW - 80);
        const y = designH + 10;
        const targetY = rand(designH * 0.08, designH * 0.22);
        rockets.push({
            x, y,
            vx: rand(-0.45, 0.45),
            vy: rand(-12.5, -10.0),
            targetY,
            color: choice(COLORS),
        });
    }

    function explode(x, y, color) {
        const count = designW < 1100 ? 90 : 150;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + rand(-0.05, 0.05);
            const speed = rand(3.5, 7.5);
            particles.push({
                x, y,
                px: x, py: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: rand(120, 200),
                age: 0,
                color,
                size: rand(1.6, 3.2),
            });
        }
    }

    let last = performance.now();
    let spawnAcc = 0;

    function tick(now) {
        const dt = Math.min(33, now - last);
        last = now;

        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(0, 0, designW, designH);

        spawnAcc += dt;
        const spawnEvery = designW < 1100 ? 1100 : 900;
        if (spawnAcc > spawnEvery) {
            spawnAcc = 0;
            spawnRocket();
            if (Math.random() < 0.28) spawnRocket();
        }

        ctx.globalCompositeOperation = "source-over";
        for (let i = rockets.length - 1; i >= 0; i--) {
            const r = rockets[i];
            r.x += r.vx;
            r.y += r.vy;
            r.vy += 0.07;

            ctx.fillStyle = r.color;
            ctx.beginPath();
            ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
            ctx.fill();

            if (r.y <= r.targetY || r.vy >= 0) {
                explode(r.x, r.y, r.color);
                rockets.splice(i, 1);
            }
        }

        ctx.globalCompositeOperation = "lighter";
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age += 1;
            p.px = p.x; p.py = p.y;
            p.x += p.vx; p.y += p.vy;

            p.vy += 0.055;
            p.vx *= 0.99;
            p.vy *= 0.99;

            const t = 1 - p.age / p.life;
            if (t <= 0) { particles.splice(i, 1); continue; }

            ctx.globalAlpha = Math.max(0, t);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * 1.8;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p.px, p.py);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        requestAnimationFrame(tick);
    }

    function clickBoom(e) {
        if (!designEl) return;

        const r = designEl.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;

        const x = (e.clientX - r.left) / r.width * designW;
        const y = (e.clientY - r.top) / r.height * designH;

        if (x < 0 || x > designW || y < 0 || y > designH) return;

        explode(x, y, choice(COLORS));
    }
    window.addEventListener("pointerdown", clickBoom, { passive: true });
    requestAnimationFrame(tick);
});
/* ==========================================================
   taller.js — Comportamiento de las páginas de talleres
   - Efecto temático del hero (según data-fx)
   - Texto animado, contadores, scroll, animaciones de entrada
   - Imagen del taller y galería (slider) editables desde el Panel de Administración
   - "Explora otros talleres"
   - Modo claro / oscuro
   ========================================================== */
(function () {
  "use strict";

  const body = document.body;
  const KEY = body.dataset.taller;
  const MEDIA = window.PCB_MEDIA || { talleres: [], sections: { tallerPrefix: "taller-" } };
  const esc = (window.PCB_UTILS && window.PCB_UTILS.esc) || ((s) => String(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const $ = (id) => document.getElementById(id);

  /* ---------- Tema ---------- */
  function initTheme() {
    const toggle = $("theme-toggle");
    const icon = $("theme-icon");
    const apply = (dark) => {
      body.classList.toggle("dark-mode", dark);
      if (icon) {
        icon.classList.toggle("fa-sun", dark);
        icon.classList.toggle("fa-moon", !dark);
      }
    };
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) { /* sin almacenamiento */ }
    apply(saved === "dark");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const dark = !body.classList.contains("dark-mode");
      apply(dark);
      try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) { /* sin almacenamiento */ }
    });
  }

  /* ---------- Efectos temáticos ---------- */
  const FX = {
    circuit(el) {
      const W = 1200, H = 800;
      const paths = [
        "M0 120 H260 L320 180 H520 L560 140 H760",
        "M0 420 H140 L200 360 H420 L470 410 H640 L700 470 H900",
        "M1200 220 H980 L930 270 H760 L720 230 H600",
        "M1200 620 H1040 L990 570 H820 L780 620 H560 L520 660 H380",
        "M300 800 V690 L350 640 V520 L400 470",
        "M880 0 V110 L930 160 V300",
        "M60 800 V700 L120 640 H240",
        "M1100 800 V720 L1050 670 H960"
      ];
      let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">`;
      paths.forEach((d, i) => {
        svg += `<path class="trace" d="${d}"/>`;
        svg += `<path class="pulse" d="${d}" style="animation-delay:${(i * 0.7).toFixed(1)}s;animation-duration:${(4 + (i % 3)).toFixed(1)}s"/>`;
      });
      // Nodos (puntos de soldadura) en los extremos de las pistas
      [[760, 140], [900, 470], [600, 230], [380, 660], [400, 470], [930, 300], [240, 640], [960, 670]]
        .forEach(([x, y]) => { svg += `<circle class="node" cx="${x}" cy="${y}" r="5"/>`; });
      svg += "</svg>";
      el.innerHTML = svg;
      // Columnas de código binario
      const cols = window.innerWidth < 700 ? 6 : 14;
      for (let i = 0; i < cols; i++) {
        const s = document.createElement("span");
        s.className = "fx-bin";
        let txt = "";
        for (let j = 0; j < 26; j++) txt += Math.random() > 0.5 ? "1" : "0";
        s.textContent = txt;
        s.style.left = rand(0, 100) + "%";
        s.style.animationDuration = rand(9, 18) + "s";
        s.style.animationDelay = -rand(0, 18) + "s";
        s.style.opacity = rand(0.4, 1).toFixed(2);
        el.appendChild(s);
      }
    },

    chart(el) {
      const bars = document.createElement("div");
      bars.className = "bars";
      const n = window.innerWidth < 700 ? 12 : 22;
      for (let i = 0; i < n; i++) {
        const b = document.createElement("span");
        b.className = "bar";
        b.style.height = (20 + (i / n) * 70 + rand(-10, 10)) + "%";
        b.style.animationDelay = (i * 0.12).toFixed(2) + "s";
        bars.appendChild(b);
      }
      el.appendChild(bars);
      el.insertAdjacentHTML("beforeend",
        '<svg viewBox="0 0 1200 500" preserveAspectRatio="none">' +
        '<polyline class="trend" points="0,460 150,400 260,430 380,330 500,360 640,240 760,280 900,150 1020,180 1200,40"/></svg>');
      const symbols = ["$", "%", "↑", "★", "$", "%"];
      const count = window.innerWidth < 700 ? 6 : 12;
      for (let i = 0; i < count; i++) {
        const s = document.createElement("span");
        s.className = "fx-symbol";
        s.textContent = symbols[i % symbols.length];
        s.style.left = rand(0, 100) + "%";
        s.style.fontSize = rand(18, 42) + "px";
        s.style.animationDuration = rand(10, 18) + "s";
        s.style.animationDelay = -rand(0, 18) + "s";
        el.appendChild(s);
      }
    },

    ecg(el) {
      // Trazo de electrocardiograma repetido
      let d = "M0 80";
      for (let x = 0; x < 2400; x += 300) {
        d += ` L${x + 90} 80 L${x + 110} 70 L${x + 125} 80 L${x + 140} 80 L${x + 152} 98 L${x + 165} 10 L${x + 180} 140 L${x + 192} 80 L${x + 215} 80 L${x + 240} 60 L${x + 262} 80 L${x + 300} 80`;
      }
      ["l1", "l2"].forEach((cls) => {
        el.insertAdjacentHTML("beforeend",
          `<svg class="${cls}" viewBox="0 0 2400 160" preserveAspectRatio="none">` +
          `<path class="base" d="M0 80 H2400"/><path class="beat" d="${d}"/></svg>`);
      });
      const count = window.innerWidth < 700 ? 4 : 8;
      for (let i = 0; i < count; i++) {
        const c = document.createElement("i");
        c.className = "fas " + (i % 2 ? "fa-heart-pulse" : "fa-plus") + " fx-cross";
        c.style.left = rand(2, 96) + "%";
        c.style.top = rand(5, 90) + "%";
        c.style.fontSize = rand(14, 34) + "px";
        c.style.animationDelay = -rand(0, 2.4) + "s";
        el.appendChild(c);
      }
    },

    sparkle(el) {
      const sparks = window.innerWidth < 700 ? 14 : 30;
      for (let i = 0; i < sparks; i++) {
        const s = document.createElement("span");
        s.className = "fx-spark" + (i % 3 === 0 ? " alt" : "");
        const size = rand(8, 20);
        s.style.width = s.style.height = size + "px";
        s.style.left = rand(0, 100) + "%";
        s.style.top = rand(0, 100) + "%";
        s.style.animationDuration = rand(2.5, 5) + "s";
        s.style.animationDelay = -rand(0, 5) + "s";
        el.appendChild(s);
      }
      const bubbles = window.innerWidth < 700 ? 6 : 12;
      for (let i = 0; i < bubbles; i++) {
        const b = document.createElement("span");
        b.className = "fx-bubble";
        const size = rand(16, 60);
        b.style.width = b.style.height = size + "px";
        b.style.left = rand(0, 100) + "%";
        b.style.animationDuration = rand(12, 22) + "s";
        b.style.animationDelay = -rand(0, 22) + "s";
        el.appendChild(b);
      }
    },

    steam(el) {
      const wisps = window.innerWidth < 700 ? 4 : 8;
      for (let i = 0; i < wisps; i++) {
        const s = document.createElement("span");
        s.className = "fx-steam";
        s.style.left = rand(0, 95) + "%";
        s.style.animationDuration = rand(7, 12) + "s";
        s.style.animationDelay = -rand(0, 12) + "s";
        el.appendChild(s);
      }
      const embers = window.innerWidth < 700 ? 14 : 30;
      for (let i = 0; i < embers; i++) {
        const e = document.createElement("span");
        e.className = "fx-ember";
        const size = rand(3, 6);
        e.style.width = e.style.height = size + "px";
        e.style.left = rand(0, 100) + "%";
        e.style.animationDuration = rand(6, 14) + "s";
        e.style.animationDelay = -rand(0, 14) + "s";
        el.appendChild(e);
      }
    },

    growth(el) {
      el.insertAdjacentHTML("beforeend", '<span class="fx-sun"></span>');
      const icons = ["fa-leaf", "fa-seedling", "fa-wheat-awn", "fa-leaf"];
      const leaves = window.innerWidth < 700 ? 8 : 16;
      for (let i = 0; i < leaves; i++) {
        const l = document.createElement("i");
        l.className = "fas " + icons[i % icons.length] + " fx-leaf";
        l.style.left = rand(0, 100) + "%";
        l.style.fontSize = rand(14, 34) + "px";
        l.style.animationDuration = rand(12, 22) + "s";
        l.style.animationDelay = -rand(0, 22) + "s";
        el.appendChild(l);
      }
      const seeds = window.innerWidth < 700 ? 10 : 22;
      for (let i = 0; i < seeds; i++) {
        const s = document.createElement("span");
        s.className = "fx-seed";
        s.style.left = rand(0, 100) + "%";
        s.style.animationDuration = rand(8, 16) + "s";
        s.style.animationDelay = -rand(0, 16) + "s";
        el.appendChild(s);
      }
    },

    radar(el) {
      el.insertAdjacentHTML("beforeend", '<span class="fx-siren"></span><span class="fx-radar"></span><span class="fx-radar r2"></span>');
      const radar = el.querySelector(".fx-radar");
      for (let i = 0; i < 6; i++) {
        const b = document.createElement("span");
        b.className = "fx-blip";
        const ang = rand(0, Math.PI * 2);
        const r = rand(15, 45);
        b.style.left = (50 + Math.cos(ang) * r) + "%";
        b.style.top = (50 + Math.sin(ang) * r) + "%";
        b.style.animationDelay = -rand(0, 2) + "s";
        radar.appendChild(b);
      }
    }
  };

  function initFx() {
    const el = document.querySelector(".t-fx");
    if (!el || reduceMotion) return;
    const type = el.dataset.fx;
    if (FX[type]) {
      el.classList.add("fx-" + type);
      FX[type](el);
    }
  }

  /* ---------- Texto animado ---------- */
  function initTyping() {
    const host = document.querySelector("[data-words]");
    const out = host && host.querySelector(".t-typed");
    if (!out) return;
    const words = host.dataset.words.split("|").map((w) => w.trim()).filter(Boolean);
    if (!words.length) return;
    if (reduceMotion) { out.textContent = words.join(" · "); return; }

    let w = 0, c = 0, deleting = false;
    (function tick() {
      const word = words[w];
      c += deleting ? -1 : 1;
      out.textContent = word.slice(0, c);
      let delay = deleting ? 45 : 95;
      if (!deleting && c === word.length) { deleting = true; delay = 1500; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    })();
  }

  /* ---------- Contadores ---------- */
  function initCounters() {
    const els = document.querySelectorAll("[data-count]");
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (reduceMotion || !isFinite(target)) return;
      const t0 = performance.now();
      const dur = 1400;
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = v.toLocaleString("en-US") + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    };
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Scroll, navbar, entrada ---------- */
  function initScrollUi() {
    const nav = $("main-nav");
    const bar = $("scroll-progress");
    const top = $("to-top");
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (nav) nav.classList.toggle("is-scrolled", y > 30);
      if (bar) bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
      if (top) top.classList.toggle("is-visible", y > 600);
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      els.forEach((el) => io.observe(el));
    }

    // Cerrar el menú móvil al tocar un enlace
    const collapse = $("navbarNav");
    if (collapse && window.bootstrap) {
      collapse.querySelectorAll(".nav-link:not(.dropdown-toggle), .dropdown-item").forEach((a) => {
        a.addEventListener("click", () => {
          if (collapse.classList.contains("show")) window.bootstrap.Collapse.getOrCreateInstance(collapse).hide();
        });
      });
    }
  }

  /* ---------- Imagen del taller ---------- */
  function setImage(src) {
    if (!src) return;
    const img = $("taller-img");
    const blur = $("taller-blur");
    const bg = $("taller-bg");
    const safe = String(src).replace(/"/g, "%22");
    if (blur) blur.style.backgroundImage = `url("${safe}")`;
    if (bg) bg.style.backgroundImage = `url("${safe}")`;
    if (img && img.getAttribute("src") !== src) {
      img.classList.add("is-loading");
      img.onload = () => img.classList.remove("is-loading");
      img.onerror = () => img.classList.remove("is-loading");
      img.src = src;
    }
  }

  /* ---------- Galería del taller (slider) ---------- */
  const Gallery = (function () {
    const DUR = 5000;
    const root = document.querySelector(".t-gal");
    const stage = $("gal-stage");
    const slidesBox = $("gal-slides");
    const thumbsBox = $("gal-thumbs");
    const countEl = $("gal-count");
    const captionEl = $("gal-caption");
    const progress = $("gal-progress");
    const pauseBtn = $("gal-pause");
    const fullBtn = $("gal-full");
    let items = [];
    let idx = 0;
    let timer = null;
    let paused = false;   // pausa elegida por el usuario
    let held = false;     // pausa temporal (mouse encima / foco)
    let inView = false;

    const thumbOf = (src) => (/\/web\/\d+\.webp$/.test(src) ? src.replace(/\.webp$/, "-thumb.webp") : src);
    const pad = (n) => String(n).padStart(2, "0");
    const cssUrl = (s) => `url("${String(s).replace(/"/g, "%22")}")`;

    function loadSlide(i) {
      const fig = slidesBox.children[i];
      if (!fig || fig.dataset.loaded) return;
      fig.dataset.loaded = "1";
      const src = items[i].src;
      fig.querySelector(".t-frame-blur").style.backgroundImage = cssUrl(src);
      fig.querySelector("img").src = src;
    }

    function render(list) {
      if (!stage) return;
      items = list.slice();
      idx = 0;
      stop();
      if (!items.length) {
        slidesBox.innerHTML = '<div class="t-gal-empty">Pronto añadiremos fotos de este taller.</div>';
        thumbsBox.innerHTML = "";
        countEl.textContent = "00 / 00";
        captionEl.textContent = "";
        return;
      }
      slidesBox.innerHTML = items.map((it, i) => `
        <figure class="t-gal-slide" aria-roledescription="diapositiva" aria-label="${i + 1} de ${items.length}">
          <div class="t-frame-blur" aria-hidden="true"></div>
          <img alt="${esc(it.title || "Foto del taller " + (i + 1))}" draggable="false">
        </figure>`).join("");
      thumbsBox.innerHTML = items.map((it, i) => `
        <button class="t-gal-thumb" type="button" data-i="${i}" aria-label="Ver foto ${i + 1}">
          <img src="${esc(thumbOf(it.src))}" alt="" loading="lazy">
        </button>`).join("");
      thumbsBox.querySelectorAll(".t-gal-thumb").forEach((b) =>
        b.addEventListener("click", () => go(+b.dataset.i)));
      const multi = items.length > 1;
      [$("gal-prev"), $("gal-next"), pauseBtn].forEach((b) => { if (b) b.hidden = !multi; });
      thumbsBox.hidden = !multi;
      show(0);
    }

    function show(i) {
      const n = items.length;
      if (!n) return;
      idx = (i + n) % n;
      [...slidesBox.children].forEach((s, j) => s.classList.toggle("is-active", j === idx));
      loadSlide(idx);
      loadSlide((idx + 1) % n);
      loadSlide((idx - 1 + n) % n);
      const thumbs = thumbsBox.querySelectorAll(".t-gal-thumb");
      thumbs.forEach((t, j) => {
        t.classList.toggle("is-active", j === idx);
        if (j === idx) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current");
      });
      const active = thumbs[idx];
      if (active) {
        const left = active.offsetLeft - (thumbsBox.clientWidth - active.clientWidth) / 2;
        thumbsBox.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
      }
      countEl.textContent = `${pad(idx + 1)} / ${pad(n)}`;
      captionEl.textContent = items[idx].title || "";
      restart();
    }

    function go(i) { show(i); }
    const next = () => show(idx + 1);
    const prev = () => show(idx - 1);

    function stop() {
      clearTimeout(timer);
      timer = null;
      if (progress) progress.classList.remove("is-running");
    }

    function restart() {
      stop();
      if (paused || !inView || items.length < 2 || document.hidden) return;
      if (progress) {
        progress.style.setProperty("--dur", DUR + "ms");
        void progress.offsetWidth; // reinicia la animación
        progress.classList.add("is-running");
      }
      if (!held) timer = setTimeout(next, DUR);
    }

    function setHeld(v) {
      held = v;
      if (root) root.classList.toggle("is-held", v);
      if (v) { clearTimeout(timer); timer = null; } else restart();
    }

    function setPaused(v) {
      paused = v;
      if (pauseBtn) {
        pauseBtn.innerHTML = `<i class="fas ${v ? "fa-play" : "fa-pause"}"></i>`;
        pauseBtn.setAttribute("aria-label", v ? "Reanudar presentación" : "Pausar presentación");
      }
      restart();
    }

    function init(list) {
      if (!stage) return;
      $("gal-prev").addEventListener("click", prev);
      $("gal-next").addEventListener("click", next);
      pauseBtn.addEventListener("click", () => setPaused(!paused));

      stage.addEventListener("mouseenter", () => setHeld(true));
      stage.addEventListener("mouseleave", () => setHeld(false));
      stage.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); next(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
        else if (e.key === " " && e.target === stage) { e.preventDefault(); setPaused(!paused); }
      });

      // Deslizar con el dedo / arrastrar con el mouse
      let x0 = null, y0 = 0;
      stage.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button")) return;
        x0 = e.clientX; y0 = e.clientY;
      });
      stage.addEventListener("pointerup", (e) => {
        if (x0 === null) return;
        const dx = e.clientX - x0, dy = e.clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
      });
      stage.addEventListener("pointercancel", () => { x0 = null; });

      // Pantalla completa
      const canFull = stage.requestFullscreen || stage.webkitRequestFullscreen;
      if (!canFull) fullBtn.hidden = true;
      fullBtn.addEventListener("click", () => {
        const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
        if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else canFull.call(stage);
      });
      const onFs = () => {
        const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
        fullBtn.innerHTML = `<i class="fas ${on ? "fa-compress" : "fa-expand"}"></i>`;
        fullBtn.setAttribute("aria-label", on ? "Salir de pantalla completa" : "Pantalla completa");
        if (on) stage.focus();
      };
      document.addEventListener("fullscreenchange", onFs);
      document.addEventListener("webkitfullscreenchange", onFs);

      // Solo avanza cuando está a la vista y la pestaña está activa
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((en) => { inView = en[0].isIntersecting; restart(); }, { threshold: 0.35 }).observe(stage);
      } else { inView = true; }
      document.addEventListener("visibilitychange", restart);

      if (reduceMotion) paused = true;
      render(list);
      if (reduceMotion) setPaused(true);
    }

    return { init, render };
  })();

  function defaultGallery() {
    const list = (MEDIA.galerias && MEDIA.galerias[KEY]) || [];
    return list.map((src) => ({ src, title: "" }));
  }

  /* ---------- Contenido del Panel de Administración ---------- */
  async function loadAdminMedia() {
    if (typeof supabaseClient === "undefined" || !supabaseClient || !KEY) return;
    const heroSection = (MEDIA.sections.tallerPrefix || "taller-") + KEY;
    try {
      const { data, error } = await supabaseClient
        .from("gallery_images")
        .select("section, image_url, title, created_at")
        .in("section", [heroSection, KEY])
        .eq("is_visible", true)
        .order("created_at", { ascending: true });
      if (error) { console.warn("Contenido del admin no disponible:", error.message); return; }
      if (!data || !data.length) return;

      // Imagen principal del hero: la más reciente
      const heroRows = data.filter((r) => r.section === heroSection);
      if (heroRows.length) setImage(heroRows[heroRows.length - 1].image_url);

      // Galería: si el admin tiene fotos visibles, se muestran solo esas
      const galRows = data.filter((r) => r.section === KEY);
      if (galRows.length) Gallery.render(galRows.map((r) => ({ src: r.image_url, title: r.title === "Imagen local" ? "" : (r.title || "") })));
    } catch (e) {
      console.warn("Contenido del admin no disponible:", e);
    }
  }

  /* ---------- Otros talleres ---------- */
  function renderMore() {
    const grid = $("more-talleres");
    if (!grid) return;
    const list = MEDIA.talleres.filter((t) => t.key !== KEY);
    grid.innerHTML = list.map((t) => {
      const thumb = /\.webp$/.test(t.src) ? t.src.replace(/\.webp$/, "-thumb.webp") : t.src;
      return `<a class="t-more-card" href="${esc(t.href)}" data-reveal>
          <img src="${esc(thumb)}" alt="" loading="lazy">
          <span class="t-more-info">
            <i class="fas ${esc(t.icon)}"></i>
            <strong>${esc(t.name)}</strong>
            <i class="fas fa-arrow-right"></i>
          </span>
        </a>`;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderMore();
    initFx();
    initTyping();
    initCounters();
    initScrollUi();
    Gallery.init(defaultGallery());
    loadAdminMedia();
  });
})();

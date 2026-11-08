/* ==========================================================
   home.js — Slider del hero, talleres vocacionales, videos,
   animaciones de scroll. Usa window.PCB_MEDIA (media-config.js)
   y, si existe, el contenido subido desde el panel admin
   (tabla gallery_images en Supabase).
   ========================================================== */
(function () {
  "use strict";

  const MEDIA = window.PCB_MEDIA;
  const U = window.PCB_UTILS;
  const esc = U.esc;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const EN = (document.documentElement.lang || "").slice(0, 2) === "en";
  const L = (es, en) => (EN ? en : es);

  /* ---------- Slider genérico (crossfade + autoplay + swipe) ---------- */
  function createSlider(opts) {
    // opts: { count, interval, onChange(i, prev), root, autoplay }
    let index = 0;
    let timer = null;
    let paused = false;
    let hoverPaused = false;
    const s = {
      get index() { return index; },
      go(i) {
        if (!opts.count()) return;
        const prev = index;
        index = (i + opts.count()) % opts.count();
        opts.onChange(index, prev);
        s.restart();
      },
      next() { s.go(index + 1); },
      prev() { s.go(index - 1); },
      restart() {
        clearTimeout(timer);
        if (paused || hoverPaused || opts.count() < 2) return;
        timer = setTimeout(s.next, opts.interval);
      },
      setPaused(p) { paused = p; s.restart(); },
      get paused() { return paused; }
    };

    if (opts.root) {
      opts.root.addEventListener("mouseenter", () => { hoverPaused = true; clearTimeout(timer); opts.onHover && opts.onHover(true); });
      opts.root.addEventListener("mouseleave", () => {
        hoverPaused = false;
        opts.onHover && opts.onHover(false);
        if (!paused) s.go(index); // reinicia temporizador y barra de progreso juntos
      });
      opts.root.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { s.next(); e.preventDefault(); }
        if (e.key === "ArrowLeft") { s.prev(); e.preventDefault(); }
      });
      let x0 = null, y0 = null;
      opts.root.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      opts.root.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        const dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? s.next() : s.prev());
        x0 = null;
      });
    }
    // Pausar cuando la pestaña no está visible
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearTimeout(timer); else s.restart();
    });
    return s;
  }

  /* =========================================================
     HERO
     ========================================================= */
  const HERO_INTERVAL = 5500;
  let heroItems = MEDIA.hero.slice();
  let hero = null;

  function renderHero() {
    const slides = $("hero-slides");
    const bg = $("hero-bg");
    const bars = $("hero-bars");

    slides.innerHTML = heroItems.map((it, i) => `
      <figure class="x-slide${i === 0 ? " is-active" : ""}" aria-hidden="${i !== 0}">
        <div class="x-slide-blur" style="background-image:url('${esc(it.src)}')"></div>
        <img src="${esc(it.src)}" alt="${esc(it.title || "Casa Abierta PCB")}" ${i > 1 ? 'loading="lazy"' : ""} decoding="async">
      </figure>`).join("");

    bg.innerHTML = heroItems.map((it, i) =>
      `<div class="x-hero-bg-layer${i === 0 ? " is-active" : ""}" style="background-image:url('${esc(it.src)}')"></div>`
    ).join("");

    bars.innerHTML = heroItems.map((it, i) =>
      `<button type="button" class="x-bar${i === 0 ? " is-active" : ""}" data-i="${i}" aria-label="${L("Ir a la foto", "Go to photo")} ${i + 1}"><span></span></button>`
    ).join("");
    bars.style.setProperty("--dur", HERO_INTERVAL + "ms");

    updateHeroMeta(0);
  }

  function updateHeroMeta(i) {
    const n = heroItems.length;
    $("hero-count").textContent = String(i + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
    $("hero-caption").textContent = heroItems[i] ? (heroItems[i].title || "") : "";
  }

  function initHero() {
    renderHero();
    const root = $("hero-slider");

    hero = createSlider({
      root,
      interval: HERO_INTERVAL,
      count: () => heroItems.length,
      onHover: (h) => $("hero-bars").classList.toggle("is-held", h),
      onChange(i, prev) {
        const slides = $("hero-slides").children;
        const layers = $("hero-bg").children;
        const bars = $("hero-bars").children;
        [slides, layers].forEach((col) => {
          if (col[prev]) col[prev].classList.remove("is-active");
          if (col[i]) col[i].classList.add("is-active");
        });
        Array.from(slides).forEach((el, k) => el.setAttribute("aria-hidden", k !== i));
        Array.from(bars).forEach((b, k) => {
          b.classList.toggle("is-done", k < i);
          b.classList.remove("is-active");
        });
        // reiniciar animación de la barra activa
        if (bars[i]) { void bars[i].offsetWidth; bars[i].classList.add("is-active"); }
        updateHeroMeta(i);
      }
    });

    $("hero-next").addEventListener("click", hero.next);
    $("hero-prev").addEventListener("click", hero.prev);
    $("hero-bars").addEventListener("click", (e) => {
      const b = e.target.closest(".x-bar");
      if (b) hero.go(+b.dataset.i);
    });
    $("hero-pause").addEventListener("click", function () {
      hero.setPaused(!hero.paused);
      this.innerHTML = hero.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
      this.setAttribute("aria-label", hero.paused ? L("Reanudar presentación", "Resume slideshow") : L("Pausar presentación", "Pause slideshow"));
      $("hero-bars").classList.toggle("is-held", hero.paused);
    });

    if (reduceMotion) hero.setPaused(true); else hero.restart();
  }

  function replaceHero(items) {
    heroItems = items;
    renderHero();
    hero.go(0);
  }

  /* =========================================================
     TICKER
     ========================================================= */
  function renderTicker() {
    const one = MEDIA.talleres.map((t) =>
      `<span class="x-ticker-item"><i class="fas ${t.icon}"></i>${esc(t.name)}</span><span class="x-ticker-sep">✦</span>`
    ).join("");
    $("ticker-track").innerHTML = one + one + one + one;
  }

  /* =========================================================
     TALLERES
     ========================================================= */
  const TALLER_INTERVAL = 7000;
  let talleres = MEDIA.talleres.map((t) => Object.assign({}, t));
  let taller = null;

  function renderTalleres() {
    $("taller-slides").innerHTML = talleres.map((t, i) => `
      <a class="x-taller-slide${i === 0 ? " is-active" : ""}" href="${esc(t.href)}" aria-label="${L("Ver taller de", "View workshop:")} ${esc(t.name)}" tabindex="${i === 0 ? 0 : -1}">
        <div class="x-slide-blur" style="background-image:url('${esc(t.src)}')"></div>
        <img src="${esc(t.src)}" alt="${esc(t.name)}" loading="lazy" decoding="async">
      </a>`).join("");

    $("taller-tabs").innerHTML = talleres.map((t, i) => `
      <button type="button" role="tab" class="x-tab${i === 0 ? " is-active" : ""}" data-i="${i}" aria-selected="${i === 0}">
        <i class="fas ${t.icon}"></i>
        <span>${esc(t.name)}</span>
        <span class="x-tab-progress"></span>
      </button>`).join("");
    $("taller-tabs").style.setProperty("--dur", TALLER_INTERVAL + "ms");
    updateTallerInfo(taller ? taller.index : 0);
  }

  function updateTallerInfo(i) {
    const t = talleres[i];
    if (!t) return;
    $("taller-num").textContent = String(i + 1).padStart(2, "0") + " / " + String(talleres.length).padStart(2, "0");
    $("taller-name").textContent = t.name;
    $("taller-tagline").textContent = t.tagline || "";
    $("taller-link").href = t.href;
  }

  function initTalleres() {
    renderTalleres();
    const stage = $("taller-stage");
    taller = createSlider({
      root: stage,
      interval: TALLER_INTERVAL,
      count: () => talleres.length,
      onHover: (h) => $("taller-tabs").classList.toggle("is-held", h),
      onChange(i, prev) {
        const slides = $("taller-slides").children;
        const tabs = $("taller-tabs").children;
        if (slides[prev]) { slides[prev].classList.remove("is-active"); slides[prev].tabIndex = -1; }
        if (slides[i]) { slides[i].classList.add("is-active"); slides[i].tabIndex = 0; }
        Array.from(tabs).forEach((b, k) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", k === i);
        });
        if (tabs[i]) {
          void tabs[i].offsetWidth;
          tabs[i].classList.add("is-active");
          // mantener visible la pestaña activa en móvil
          const wrap = $("taller-tabs");
          const left = tabs[i].offsetLeft - wrap.clientWidth / 2 + tabs[i].clientWidth / 2;
          wrap.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
        }
        updateTallerInfo(i);
      }
    });

    $("taller-next").addEventListener("click", taller.next);
    $("taller-prev").addEventListener("click", taller.prev);
    $("taller-tabs").addEventListener("click", (e) => {
      const b = e.target.closest(".x-tab");
      if (b) taller.go(+b.dataset.i);
    });

    // Solo avanzar cuando la sección está en pantalla
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => taller.setPaused(!en.isIntersecting || reduceMotion));
    }, { threshold: 0.35 });
    io.observe(stage);
  }

  /* =========================================================
     VIDEOS (reels + reproductor)
     ========================================================= */
  let videos = MEDIA.videos.slice();
  let playerIndex = 0;
  const isTouch = window.matchMedia("(hover: none)").matches;

  function fmtTime(sec) {
    if (!isFinite(sec)) return "";
    sec = Math.round(sec);
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }

  function renderReels() {
    const wrap = $("reels");
    wrap.innerHTML = videos.map((v, i) => {
      const yt = U.youtubeId(v.src);
      const media = yt
        ? `<img src="https://img.youtube.com/vi/${yt}/hqdefault.jpg" alt="" loading="lazy">`
        : `<video src="${esc(v.src)}#t=0.5" muted loop playsinline preload="metadata"></video>`;
      return `
        <button type="button" class="x-reel" data-i="${i}" aria-label="${L("Reproducir video", "Play video")}: ${esc(v.title || "Video")}">
          <div class="x-reel-media">${media}</div>
          <div class="x-reel-shade"></div>
          <span class="x-reel-badge">${yt ? '<i class="fab fa-youtube"></i> YouTube' : '<i class="fas fa-film"></i> Reel'}</span>
          <span class="x-reel-time" data-time></span>
          <span class="x-reel-play"><i class="fas fa-play"></i></span>
          <div class="x-reel-info">
            <strong>${esc(v.title || "Video")}</strong>
            ${v.date ? `<small><i class="far fa-calendar me-1"></i>${esc(v.date)}</small>` : ""}
          </div>
        </button>`;
    }).join("");

    wrap.classList.toggle("is-few", videos.length <= 3);

    wrap.querySelectorAll(".x-reel").forEach((card) => {
      const vid = card.querySelector("video");
      if (vid) {
        vid.addEventListener("loadedmetadata", () => {
          card.querySelector("[data-time]").textContent = fmtTime(vid.duration);
        });
        if (!isTouch) {
          card.addEventListener("mouseenter", () => { vid.play().catch(() => {}); });
          card.addEventListener("mouseleave", () => { vid.pause(); });
        }
      }
      card.addEventListener("click", () => openPlayer(+card.dataset.i));
    });

    // En pantallas táctiles: previsualizar el video que está en pantalla
    if (isTouch && "IntersectionObserver" in window && !reduceMotion) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          const v = en.target.querySelector("video");
          if (!v) return;
          if (en.intersectionRatio > 0.75) v.play().catch(() => {}); else v.pause();
        });
      }, { threshold: [0, 0.75, 1] });
      wrap.querySelectorAll(".x-reel").forEach((c) => io.observe(c));
    }

    updateReelNav();
  }

  function updateReelNav() {
    const wrap = $("reels");
    const overflow = wrap.scrollWidth > wrap.clientWidth + 4;
    $("reels-prev").hidden = !overflow || wrap.scrollLeft < 8;
    $("reels-next").hidden = !overflow || wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 8;
  }

  function scrollReels(dir) {
    const wrap = $("reels");
    const card = wrap.querySelector(".x-reel");
    const step = card ? card.getBoundingClientRect().width + 20 : 300;
    wrap.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  function openPlayer(i) {
    playerIndex = (i + videos.length) % videos.length;
    const v = videos[playerIndex];
    const yt = U.youtubeId(v.src);
    const media = $("player-media");

    // pausar previsualizaciones
    document.querySelectorAll(".x-reel video").forEach((x) => x.pause());

    media.innerHTML = yt
      ? `<iframe src="https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&playsinline=1" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : `<video src="${esc(v.src)}" controls autoplay playsinline></video>`;
    media.classList.toggle("is-yt", !!yt);
    $("player-title").textContent = v.title || "Video";
    $("player-meta").textContent = (v.date ? v.date + " · " : "") + (playerIndex + 1) + L(" de ", " of ") + videos.length;
    $("player-prev").hidden = $("player-next").hidden = videos.length < 2;

    const p = $("player");
    if (p.hidden) {
      p.hidden = false;
      document.body.classList.add("x-noscroll");
      requestAnimationFrame(() => p.classList.add("is-open"));
      p.querySelector(".x-player-close").focus();
    }
  }

  function closePlayer() {
    const p = $("player");
    p.classList.remove("is-open");
    $("player-media").innerHTML = "";
    document.body.classList.remove("x-noscroll");
    setTimeout(() => { p.hidden = true; }, 250);
    const card = document.querySelector('.x-reel[data-i="' + playerIndex + '"]');
    if (card) card.focus();
  }

  function initVideos() {
    renderReels();
    $("reels").addEventListener("scroll", updateReelNav, { passive: true });
    window.addEventListener("resize", updateReelNav);
    $("reels-prev").addEventListener("click", () => scrollReels(-1));
    $("reels-next").addEventListener("click", () => scrollReels(1));

    $("player").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closePlayer(); });
    $("player-prev").addEventListener("click", () => openPlayer(playerIndex - 1));
    $("player-next").addEventListener("click", () => openPlayer(playerIndex + 1));
    document.addEventListener("keydown", (e) => {
      if ($("player").hidden) return;
      if (e.key === "Escape") closePlayer();
      if (e.key === "ArrowRight") openPlayer(playerIndex + 1);
      if (e.key === "ArrowLeft") openPlayer(playerIndex - 1);
    });
    // Deslizar en el reproductor
    let x0 = null;
    const box = $("player").querySelector(".x-player-box");
    box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", (e) => {
      if (x0 === null || videos.length < 2) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) openPlayer(playerIndex + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* =========================================================
     CONTENIDO DEL ADMIN (Supabase)
     ========================================================= */
  async function loadAdminMedia() {
    if (typeof supabaseClient === "undefined" || !supabaseClient) return;
    const S = MEDIA.sections;
    const sections = [S.hero, S.videos].concat(MEDIA.talleres.map((t) => S.tallerPrefix + t.key));

    try {
      const { data, error } = await supabaseClient
        .from("gallery_images")
        .select("id, section, image_url, title, is_visible, created_at")
        .in("section", sections)
        .eq("is_visible", true)
        .order("created_at", { ascending: true });

      if (error) { console.warn("Contenido del admin no disponible:", error.message); return; }
      if (!data || !data.length) return;

      // Hero
      const heroRows = data.filter((r) => r.section === S.hero);
      if (heroRows.length) replaceHero(heroRows.map((r) => ({ src: r.image_url, title: r.title || "" })));

      // Talleres (la imagen más reciente de cada taller)
      let changed = false;
      talleres.forEach((t) => {
        const rows = data.filter((r) => r.section === S.tallerPrefix + t.key);
        if (rows.length) {
          const last = rows[rows.length - 1];
          t.src = last.image_url;
          if (last.title) t.tagline = last.title;
          changed = true;
        }
      });
      if (changed) renderTalleres();

      // Videos
      const vidRows = data.filter((r) => r.section === S.videos);
      if (vidRows.length) {
        videos = vidRows.map((r) => {
          let title = r.title || "Video";
          let date = "";
          const parts = title.split("|");
          if (parts.length > 1) { title = parts[0].trim(); date = parts.slice(1).join("|").trim(); }
          return { src: r.image_url, title, date };
        });
        renderReels();
      }
    } catch (err) {
      console.warn("Error cargando contenido del admin:", err);
    }
  }

  /* =========================================================
     UI: navbar, progreso de scroll, revelado, volver arriba
     ========================================================= */
  function initUI() {
    const nav = $("main-nav");
    const bar = $("scroll-progress");
    const top = $("to-top");
    let ticking = false;

    function onScroll() {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      nav.classList.toggle("is-scrolled", y > 30);
      bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
      top.classList.toggle("is-visible", y > 700);
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    // Cerrar menú móvil al tocar un enlace
    document.querySelectorAll("#navbarNav .nav-link:not(.dropdown-toggle), #navbarNav .dropdown-item").forEach((a) => {
      a.addEventListener("click", () => {
        const c = document.getElementById("navbarNav");
        if (c.classList.contains("show") && window.bootstrap) bootstrap.Collapse.getOrCreateInstance(c).hide();
      });
    });

    // Animaciones de entrada
    const els = document.querySelectorAll("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      els.forEach((el) => io.observe(el));
    }
  }

  /* ---------- Cuenta regresiva (Próximas Casas Abiertas) ---------- */
  function initCountdown() {
    const box = document.getElementById("casa-countdown");
    if (!box) return;
    const target = new Date(box.dataset.target).getTime();
    if (!isFinite(target)) return;
    const els = {};
    box.querySelectorAll("[data-cd]").forEach((el) => { els[el.dataset.cd] = el; });
    const done = box.querySelector(".x-cd-done");
    const pad = (n) => String(n).padStart(2, "0");
    let timer = null;

    function set(key, val) {
      const el = els[key];
      if (!el || el.textContent === val) return;
      el.textContent = val;
      el.classList.remove("is-tick");
      void el.offsetWidth;
      el.classList.add("is-tick");
    }

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        box.classList.add("is-done");
        if (done) done.hidden = false;
        clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      set("d", pad(Math.floor(s / 86400)));
      set("h", pad(Math.floor((s % 86400) / 3600)));
      set("m", pad(Math.floor((s % 3600) / 60)));
      set("s", pad(s % 60));
    }

    tick();
    timer = setInterval(tick, 1000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCountdown();
    initUI();
    initHero();
    renderTicker();
    initTalleres();
    initVideos();
    loadAdminMedia();
  });
})();

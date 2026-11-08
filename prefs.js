/* ==========================================================
   prefs.js — Pop-up de bienvenida (tema + idioma)
   - La primera vez que alguien abre el sitio aparece un pop-up
     para escoger modo claro / oscuro y Español / English.
   - Se puede volver a abrir con el botón ES / EN del menú.
   - Páginas en español: archivo.html · en inglés: archivo-en.html
   Se carga en el <head> para redirigir antes de pintar la página.
   ========================================================== */
(function () {
  "use strict";

  var K_LANG = "pcb-lang";
  var K_DONE = "pcb-welcome";
  var K_THEME = "theme";

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }

  var pageLang = (document.documentElement.lang || "es").slice(0, 2) === "en" ? "en" : "es";

  // URL de la misma página en el otro idioma
  function urlFor(lang) {
    var path = location.pathname;
    var file = path.split("/").pop() || "index.html";
    var dir = path.slice(0, path.length - (path.split("/").pop() || "").length);
    var base = file.replace(/-en\.html$/i, ".html");
    var target = lang === "en" ? base.replace(/\.html$/i, "-en.html") : base;
    return dir + target + location.search + location.hash;
  }

  // Si la persona ya escogió otro idioma, ir directo a esa versión
  var savedLang = get(K_LANG);
  if (savedLang && savedLang !== pageLang && /^(es|en)$/.test(savedLang)) {
    location.replace(urlFor(savedLang));
    return;
  }

  var T = {
    es: {
      kicker: "Casa Abierta PCB 2026",
      title: "¡Bienvenido a la Pablo!",
      lead: "Personaliza tu experiencia antes de entrar. Puedes cambiarlo cuando quieras.",
      theme: "Tema",
      light: "Claro", lightSub: "Brillante y limpio",
      dark: "Oscuro", darkSub: "Futurista y neón",
      lang: "Idioma",
      es: "Español", esSub: "Puerto Rico",
      en: "English", enSub: "United States",
      go: "Entrar al sitio",
      note: "Cambia estas opciones en el menú con el botón",
      aria: "Preferencias del sitio",
      btn: "Idioma y tema"
    },
    en: {
      kicker: "Casa Abierta PCB 2026",
      title: "Welcome to La Pablo!",
      lead: "Personalize your experience before you enter. You can change it anytime.",
      theme: "Theme",
      light: "Light", lightSub: "Bright and clean",
      dark: "Dark", darkSub: "Futuristic neon",
      lang: "Language",
      es: "Español", esSub: "Puerto Rico",
      en: "English", enSub: "United States",
      go: "Enter the site",
      note: "Change these options in the menu with the button",
      aria: "Site preferences",
      btn: "Language and theme"
    }
  };

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = { lang: pageLang, dark: false };
  var root = null;
  var lastFocus = null;

  /* ---------- Tema ---------- */
  function applyTheme(dark) {
    document.body.classList.toggle("dark-mode", dark);
    var icon = document.getElementById("theme-icon");
    if (icon) {
      icon.classList.toggle("fa-sun", dark);
      icon.classList.toggle("fa-moon", !dark);
    }
    set(K_THEME, dark ? "dark" : "light");
  }

  /* ---------- Efecto "decodificar" texto ---------- */
  var GLYPHS = "!<>-_\\/[]{}=+*^?#01ABCDEFXYZ";
  function decode(el, text) {
    if (reduceMotion) { el.textContent = text; return; }
    var from = el.textContent, len = Math.max(from.length, text.length), frame = 0, total = 18;
    clearInterval(el._pp);
    el._pp = setInterval(function () {
      frame++;
      var out = "";
      for (var i = 0; i < len; i++) {
        var reveal = (i / len) * total * 0.8;
        if (frame >= reveal + 4) out += text[i] || "";
        else if (frame >= reveal) out += text[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        else out += from[i] || "";
      }
      el.textContent = out;
      if (frame >= total + 4) { clearInterval(el._pp); el.textContent = text; }
    }, 30);
  }

  function setTexts(animate) {
    var t = T[state.lang];
    root.querySelectorAll("[data-t]").forEach(function (el) {
      var txt = t[el.getAttribute("data-t")];
      if (animate && el.classList.contains("pp-decode")) decode(el, txt); else el.textContent = txt;
    });
    root.querySelector(".pp-card").setAttribute("aria-label", t.aria);
    root.setAttribute("lang", state.lang);
  }

  function markPressed() {
    root.querySelectorAll("[data-theme]").forEach(function (b) {
      b.setAttribute("aria-pressed", String((b.dataset.theme === "dark") === state.dark));
    });
    root.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang));
    });
  }

  function wave(btn, e) {
    var r = btn.getBoundingClientRect();
    var w = document.createElement("span");
    w.className = "pp-wave";
    w.style.left = ((e && e.clientX ? e.clientX : r.left + r.width / 2) - r.left) + "px";
    w.style.top = ((e && e.clientY ? e.clientY : r.top + r.height / 2) - r.top) + "px";
    btn.appendChild(w);
    setTimeout(function () { w.remove(); }, 650);
  }

  function themeWipe(dark, e, btn) {
    if (reduceMotion) { applyTheme(dark); return; }
    var r = btn.getBoundingClientRect();
    var x = e && e.clientX ? e.clientX : r.left + r.width / 2;
    var y = e && e.clientY ? e.clientY : r.top + r.height / 2;
    var w = document.createElement("div");
    w.className = "pp-wipe " + (dark ? "to-dark" : "to-light");
    w.style.setProperty("--x", x + "px");
    w.style.setProperty("--y", y + "px");
    document.body.appendChild(w);
    setTimeout(function () { applyTheme(dark); }, 320);
    setTimeout(function () { w.remove(); }, 750);
  }

  function particles() {
    var n = window.innerWidth < 700 ? 14 : 28, html = "";
    for (var i = 0; i < n; i++) {
      html += '<span style="left:' + (Math.random() * 100).toFixed(1) + "%;animation-duration:" +
        (6 + Math.random() * 8).toFixed(1) + "s;animation-delay:-" + (Math.random() * 10).toFixed(1) + 's"></span>';
    }
    return html;
  }

  function build() {
    root = document.createElement("div");
    root.className = "pp-root";
    root.hidden = true;
    root.innerHTML =
      '<div class="pp-backdrop"><div class="pp-particles" aria-hidden="true">' + particles() + "</div></div>" +
      '<div class="pp-card" role="dialog" aria-modal="true" aria-labelledby="pp-title">' +
        '<div class="pp-inner pp-stagger">' +
          '<div class="pp-logo" aria-hidden="true"><span class="pp-ring"></span><span class="pp-ring r2"></span><span class="pp-ring r3"></span>' +
            '<img src="LOGO6.png" alt=""></div>' +
          '<div><div class="pp-kicker" data-t="kicker"></div>' +
            '<h2 class="pp-title pp-decode" id="pp-title" data-t="title"></h2>' +
            '<p class="pp-lead" data-t="lead"></p></div>' +
          '<fieldset class="pp-group"><legend class="pp-label"><i class="fas fa-circle-half-stroke"></i><span data-t="theme"></span></legend>' +
            '<div class="pp-options">' +
              '<button type="button" class="pp-opt" data-theme="light"><span class="pp-ico"><i class="fas fa-sun"></i></span>' +
                '<span><strong data-t="light" class="pp-decode"></strong><small data-t="lightSub"></small></span><span class="pp-check"><i class="fas fa-check"></i></span></button>' +
              '<button type="button" class="pp-opt" data-theme="dark"><span class="pp-ico"><i class="fas fa-moon"></i></span>' +
                '<span><strong data-t="dark" class="pp-decode"></strong><small data-t="darkSub"></small></span><span class="pp-check"><i class="fas fa-check"></i></span></button>' +
            "</div></fieldset>" +
          '<fieldset class="pp-group"><legend class="pp-label"><i class="fas fa-language"></i><span data-t="lang"></span></legend>' +
            '<div class="pp-options">' +
              '<button type="button" class="pp-opt" data-lang="es" lang="es"><span class="pp-ico pp-flag" aria-hidden="true">ES</span>' +
                '<span><strong data-t="es"></strong><small data-t="esSub"></small></span><span class="pp-check"><i class="fas fa-check"></i></span></button>' +
              '<button type="button" class="pp-opt" data-lang="en" lang="en"><span class="pp-ico pp-flag" aria-hidden="true">EN</span>' +
                '<span><strong data-t="en"></strong><small data-t="enSub"></small></span><span class="pp-check"><i class="fas fa-check"></i></span></button>' +
            "</div></fieldset>" +
          '<button type="button" class="pp-go"><span data-t="go" class="pp-decode"></span><i class="fas fa-arrow-right"></i></button>' +
          '<p class="pp-note"><span data-t="note"></span> <i class="fas fa-globe"></i> ES / EN</p>' +
        "</div>" +
      "</div>";
    document.body.appendChild(root);

    root.querySelectorAll("[data-theme]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        var dark = b.dataset.theme === "dark";
        wave(b, e);
        if (dark !== state.dark) { state.dark = dark; themeWipe(dark, e, b); }
        markPressed();
      });
    });
    root.querySelectorAll("[data-lang]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        wave(b, e);
        if (b.dataset.lang !== state.lang) { state.lang = b.dataset.lang; setTexts(true); }
        markPressed();
      });
    });
    root.querySelector(".pp-go").addEventListener("click", confirm);
    root.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); confirm(); }
      if (e.key === "Tab") { // mantener el foco dentro del pop-up
        var f = root.querySelectorAll("button");
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function open() {
    if (!root) build();
    state.lang = pageLang;
    state.dark = document.body.classList.contains("dark-mode");
    setTexts(false);
    markPressed();
    lastFocus = document.activeElement;
    root.hidden = false;
    root.classList.remove("is-closing", "is-open");
    document.body.classList.add("x-noscroll");
    void root.offsetWidth;
    root.classList.add("is-open");
    setTimeout(function () {
      var sel = root.querySelector('.pp-opt[aria-pressed="true"]');
      (sel || root.querySelector(".pp-go")).focus({ preventScroll: true });
    }, reduceMotion ? 0 : 700);
  }

  function confirm() {
    set(K_DONE, "1");
    set(K_LANG, state.lang);
    applyTheme(state.dark);
    if (state.lang !== pageLang) {
      root.classList.add("is-closing");
      setTimeout(function () { location.href = urlFor(state.lang); }, reduceMotion ? 0 : 450);
      return;
    }
    root.classList.remove("is-open");
    root.classList.add("is-closing");
    document.body.classList.remove("x-noscroll");
    setTimeout(function () {
      root.hidden = true;
      root.classList.remove("is-closing");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 700);
  }

  /* ---------- Botón ES / EN en el menú ---------- */
  function addNavButton() {
    var themeBtn = document.getElementById("theme-toggle");
    var li = themeBtn && themeBtn.closest("li");
    if (!li) return;
    var item = document.createElement("li");
    item.className = "nav-item";
    item.innerHTML = '<button class="nav-link x-lang-btn" type="button" aria-label="' + T[pageLang].btn +
      '" title="' + T[pageLang].btn + '"><i class="fas fa-globe"></i>' + (pageLang === "en" ? "EN" : "ES") + "</button>";
    li.parentNode.insertBefore(item, li);
    item.querySelector("button").addEventListener("click", function () {
      var c = document.getElementById("navbarNav");
      if (c && c.classList.contains("show") && window.bootstrap) window.bootstrap.Collapse.getOrCreateInstance(c).hide();
      open();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    addNavButton();
    if (!get(K_DONE)) setTimeout(open, reduceMotion ? 0 : 500);
  });

  window.PCB_PREFS = { open: open, urlFor: urlFor, lang: pageLang };
})();

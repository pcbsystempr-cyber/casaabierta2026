/* ==========================================================
   admin-media.js — Administración del contenido visual de la
   página principal (slider, talleres, videos) + editor de
   imágenes. Usa la tabla gallery_images de Supabase:
     section    → "hero" | "taller-<clave>" | "videos"
     image_url  → imagen en base64 / URL, o URL del video
     title      → título (en videos: "Título | fecha")
     is_visible → mostrar u ocultar
   Requiere: supabaseClient (admin-panel.html) y media-config.js
   ========================================================== */
(function () {
  "use strict";

  const MEDIA = window.PCB_MEDIA;
  const U = window.PCB_UTILS;
  const esc = U.esc;
  const S = MEDIA.sections;
  const TABLE = "gallery_images";
  const STORAGE_BUCKET = "galeria";
  const MAX_DATAURL = 1400000; // ~1 MB de imagen por registro
  const $ = (id) => document.getElementById(id);

  /* ---------------- Supabase helpers ---------------- */
  async function fetchRows(section) {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select("*")
      .eq("section", section)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function insertRow(row) {
    const { error } = await supabaseClient.from(TABLE).insert([Object.assign({ is_visible: true }, row)]);
    if (error) throw error;
  }

  async function updateRow(id, changes) {
    const { error } = await supabaseClient.from(TABLE).update(changes).eq("id", id);
    if (error) throw error;
  }

  async function deleteRow(id) {
    const { error } = await supabaseClient.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  }

  function fail(msg, err) {
    console.error(msg, err || "");
    alert(msg + (err && err.message ? "\n\nDetalle: " + err.message : ""));
  }

  function pickFile(accept) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept || "image/*";
      input.onchange = () => resolve(input.files[0] || null);
      input.click();
    });
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function imageFromFile(file, title, onSave) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Selecciona un archivo de imagen válido."); return; }
    if (file.size > 25 * 1024 * 1024) { alert("La imagen es demasiado grande (máximo 25 MB)."); return; }
    const src = await fileToDataURL(file);
    Editor.open({ src, title: title || file.name.replace(/\.[^.]+$/, ""), onSave });
  }

  /* =========================================================
     EDITOR DE IMÁGENES
     ========================================================= */
  const Editor = (function () {
    const st = {};
    let base = null;      // canvas con la imagen (máx 2400 px)
    let rotated = null;   // canvas con rotación/volteo aplicados
    let onSave = null;
    let pending = false;

    const el = (id) => document.getElementById(id);

    function reset() {
      Object.assign(st, { rot: 0, flip: false, aspect: "orig", zoom: 1, px: 0, py: 0, b: 100, c: 100, s: 100 });
      el("ed-aspect").value = "orig";
      ["zoom", "px", "py", "b", "c", "s"].forEach((k) => { el("ed-" + k).value = st[k]; });
      buildRotated();
      draw();
    }

    function buildRotated() {
      if (!base) return;
      const swap = st.rot === 90 || st.rot === 270;
      const c = document.createElement("canvas");
      c.width = swap ? base.height : base.width;
      c.height = swap ? base.width : base.height;
      const ctx = c.getContext("2d");
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(st.rot * Math.PI / 180);
      ctx.scale(st.flip ? -1 : 1, 1);
      ctx.drawImage(base, -base.width / 2, -base.height / 2);
      rotated = c;
    }

    function crop() {
      const sw = rotated.width, sh = rotated.height;
      const ar = st.aspect === "orig" ? sw / sh : parseFloat(st.aspect);
      let cw, ch;
      if (sw / sh > ar) { ch = sh; cw = sh * ar; } else { cw = sw; ch = sw / ar; }
      cw /= st.zoom; ch /= st.zoom;
      const cx = ((sw - cw) / 2) * (1 + st.px);
      const cy = ((sh - ch) / 2) * (1 + st.py);
      return { cx, cy, cw, ch };
    }

    function render(canvas, maxW) {
      const { cx, cy, cw, ch } = crop();
      const W = Math.round(Math.min(maxW, cw));
      const H = Math.round(W * ch / cw);
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.filter = `brightness(${st.b}%) contrast(${st.c}%) saturate(${st.s}%)`;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(rotated, cx, cy, cw, ch, 0, 0, W, H);
      ctx.filter = "none";
      return { W, H };
    }

    function draw() {
      if (pending || !rotated) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const { W, H } = render(el("ed-canvas"), 1100);
        const full = crop();
        const outW = Math.round(Math.min(1920, full.cw));
        el("ed-size").textContent = "Resultado: " + outW + " × " + Math.round(outW * full.ch / full.cw) + " px";
        el("ed-zoom-v").textContent = Math.round(st.zoom * 100) + "%";
        el("ed-b-v").textContent = st.b + "%";
        el("ed-c-v").textContent = st.c + "%";
        el("ed-s-v").textContent = st.s + "%";
        void W; void H;
      });
    }

    function exportDataURL() {
      const out = document.createElement("canvas");
      let maxW = 1920;
      let q = 0.88;
      let url;
      for (let tries = 0; tries < 12; tries++) {
        render(out, maxW);
        url = out.toDataURL("image/jpeg", q);
        if (url.length <= MAX_DATAURL) break;
        if (q > 0.62) q -= 0.08; else { maxW = Math.round(maxW * 0.82); q = 0.82; }
      }
      return url;
    }

    function close() {
      el("img-editor").hidden = true;
      base = rotated = null;
      onSave = null;
    }

    function open(opts) {
      onSave = opts.onSave;
      el("ed-title").value = opts.title || "";
      // Colocar el editor dentro del modal abierto para que Bootstrap no le robe el foco
      const host = document.querySelector(".modal.show") || document.body;
      if (el("img-editor").parentElement !== host) host.appendChild(el("img-editor"));
      el("img-editor").hidden = false;
      el("ed-loading").hidden = false;

      const img = new Image();
      if (/^https?:/i.test(opts.src) && !opts.src.startsWith(location.origin)) img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
        base = document.createElement("canvas");
        base.width = Math.round(img.naturalWidth * scale);
        base.height = Math.round(img.naturalHeight * scale);
        base.getContext("2d").drawImage(img, 0, 0, base.width, base.height);
        el("ed-loading").hidden = true;
        reset();
      };
      img.onerror = () => {
        el("ed-loading").hidden = true;
        alert("No se pudo cargar la imagen para editarla.");
        close();
      };
      img.src = opts.src;
    }

    async function save() {
      if (!rotated || !onSave) return;
      let dataUrl;
      try {
        dataUrl = exportDataURL();
      } catch (err) {
        fail("El navegador bloqueó la edición de esta imagen. Abre el panel desde el servidor del sitio (no como archivo local) e intenta de nuevo.", err);
        return;
      }
      const btn = el("ed-save");
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando…';
      try {
        await onSave(dataUrl, el("ed-title").value.trim());
        close();
      } catch (err) {
        fail("No se pudo guardar la imagen.", err);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
      }
    }

    function init() {
      el("ed-close").addEventListener("click", close);
      el("ed-cancel").addEventListener("click", close);
      el("ed-reset").addEventListener("click", reset);
      el("ed-save").addEventListener("click", save);
      el("img-editor").addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); close(); }
      });

      document.querySelectorAll("[data-ed]").forEach((b) => b.addEventListener("click", () => {
        const a = b.dataset.ed;
        if (a === "rotl") st.rot = (st.rot + 270) % 360;
        if (a === "rotr") st.rot = (st.rot + 90) % 360;
        if (a === "flip") st.flip = !st.flip;
        buildRotated();
        draw();
      }));

      el("ed-aspect").addEventListener("change", (e) => { st.aspect = e.target.value; st.px = st.py = 0; el("ed-px").value = el("ed-py").value = 0; draw(); });
      ["zoom", "px", "py", "b", "c", "s"].forEach((k) => {
        el("ed-" + k).addEventListener("input", (e) => { st[k] = parseFloat(e.target.value); draw(); });
      });
      document.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
        const [bb, cc, ss] = b.dataset.preset.split(",").map(Number);
        st.b = bb; st.c = cc; st.s = ss;
        el("ed-b").value = bb; el("ed-c").value = cc; el("ed-s").value = ss;
        draw();
      }));
    }

    return { open, init };
  })();

  window.PCBEditor = Editor;

  /* =========================================================
     SLIDER PRINCIPAL (HERO)
     ========================================================= */
  async function renderHeroAdmin() {
    const box = $("hero-admin");
    box.innerHTML = '<p class="text-muted text-center">Cargando…</p>';
    let rows;
    try { rows = await fetchRows(S.hero); } catch (err) {
      box.innerHTML = '<p class="text-danger text-center">Error cargando las imágenes del slider.</p>';
      console.error(err); return;
    }

    let html = "";
    if (!rows.length) {
      html += `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          Ahora mismo el sitio muestra las <strong>${MEDIA.hero.length} imágenes predeterminadas</strong> (carpeta galeria/2026).
          Si agregas tu propia foto, el slider mostrará <strong>solo</strong> tus fotos.
          Para conservar las predeterminadas y poder editarlas, impórtalas primero.
          <div class="adm-defaults-strip mt-3">${MEDIA.hero.map((h) => `<img src="${esc(h.src.replace(".webp", "-thumb.webp"))}" alt="${esc(h.title)}" title="${esc(h.title)}">`).join("")}</div>
          <button class="btn btn-sm btn-primary mt-2" id="hero-import"><i class="fas fa-file-import me-2"></i>Importar imágenes predeterminadas</button>
        </div>`;
    } else if (!rows.some((r) => r.is_visible)) {
      html += '<div class="alert alert-warning"><i class="fas fa-eye-slash me-2"></i>Todas tus fotos están ocultas, por eso el sitio muestra las imágenes predeterminadas.</div>';
    }

    html += '<div class="adm-media-grid">' + rows.map((r, i) => `
      <div class="adm-media-card${r.is_visible ? "" : " is-hidden"}">
        <div class="adm-media-thumb">
          <img src="${esc(r.image_url)}" alt="" loading="lazy">
          <span class="adm-badge">${i + 1}${r.is_visible ? "" : " · Oculta"}</span>
        </div>
        <div class="adm-media-body">
          <span class="adm-media-title">${esc(r.title || "Sin título")}</span>
          <div class="adm-actions">
            <button class="btn btn-sm btn-primary" data-act="edit" data-id="${r.id}"><i class="fas fa-sliders me-1"></i>Editar</button>
            <button class="btn btn-sm btn-outline-primary" data-act="replace" data-id="${r.id}" title="Reemplazar imagen"><i class="fas fa-arrow-right-arrow-left"></i></button>
            <button class="btn btn-sm ${r.is_visible ? "btn-outline-secondary" : "btn-success"}" data-act="toggle" data-id="${r.id}" title="${r.is_visible ? "Ocultar" : "Mostrar"}"><i class="fas ${r.is_visible ? "fa-eye-slash" : "fa-eye"}"></i></button>
            <button class="btn btn-sm btn-outline-danger" data-act="delete" data-id="${r.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>`).join("") + "</div>";

    box.innerHTML = html;

    const imp = $("hero-import");
    if (imp) imp.addEventListener("click", async () => {
      imp.disabled = true;
      imp.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Importando…';
      try {
        for (const h of MEDIA.hero) await insertRow({ section: S.hero, image_url: h.src, title: h.title });
      } catch (err) { fail("Error importando las imágenes.", err); }
      renderHeroAdmin();
    });

    box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", async () => {
      const row = rows.find((r) => String(r.id) === b.dataset.id);
      if (!row) return;
      try {
        if (b.dataset.act === "edit") {
          Editor.open({ src: row.image_url, title: row.title, onSave: async (url, title) => { await updateRow(row.id, { image_url: url, title }); renderHeroAdmin(); } });
        } else if (b.dataset.act === "replace") {
          const f = await pickFile();
          imageFromFile(f, row.title, async (url, title) => { await updateRow(row.id, { image_url: url, title }); renderHeroAdmin(); });
        } else if (b.dataset.act === "toggle") {
          await updateRow(row.id, { is_visible: !row.is_visible }); renderHeroAdmin();
        } else if (b.dataset.act === "delete") {
          if (!confirm("¿Eliminar esta foto del slider?")) return;
          await deleteRow(row.id); renderHeroAdmin();
        }
      } catch (err) { fail("No se pudo completar la acción.", err); }
    }));
  }

  /* =========================================================
     TALLERES
     ========================================================= */
  async function renderTalleresAdmin() {
    const box = $("talleres-admin");
    box.innerHTML = '<p class="text-muted text-center">Cargando…</p>';

    let all = [];
    try {
      const { data, error } = await supabaseClient
        .from(TABLE)
        .select("*")
        .like("section", S.tallerPrefix + "%")
        .order("created_at", { ascending: true });
      if (error) throw error;
      all = data || [];
    } catch (err) {
      box.innerHTML = '<p class="text-danger text-center">Error cargando las imágenes de talleres.</p>';
      console.error(err); return;
    }

    box.innerHTML = MEDIA.talleres.map((t) => {
      const rows = all.filter((r) => r.section === S.tallerPrefix + t.key);
      const custom = rows.filter((r) => r.is_visible).pop();
      const src = custom ? custom.image_url : t.src;
      const text = custom && custom.title ? custom.title : t.tagline;
      return `
        <div class="col-sm-6 col-lg-4">
          <div class="adm-media-card h-100">
            <div class="adm-media-thumb">
              <img src="${esc(src)}" alt="${esc(t.name)}" loading="lazy">
              <span class="adm-badge${custom ? " is-custom" : ""}">${custom ? "Personalizada" : "Original"}</span>
            </div>
            <div class="adm-media-body">
              <span class="adm-media-title"><i class="fas ${t.icon} me-2 text-info"></i>${esc(t.name)}</span>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" value="${esc(text)}" data-tagline="${t.key}" aria-label="Frase de ${esc(t.name)}">
                <button class="btn btn-outline-success" data-act="text" data-key="${t.key}" title="Guardar frase"><i class="fas fa-check"></i></button>
              </div>
              <div class="adm-actions">
                <button class="btn btn-sm btn-primary" data-act="change" data-key="${t.key}"><i class="fas fa-upload me-1"></i>Cambiar</button>
                <button class="btn btn-sm btn-outline-primary" data-act="edit" data-key="${t.key}"><i class="fas fa-sliders me-1"></i>Editar</button>
                ${rows.length ? `<button class="btn btn-sm btn-outline-danger" data-act="restore" data-key="${t.key}" title="Restaurar imagen original"><i class="fas fa-rotate-left me-1"></i>Original</button>` : ""}
              </div>
            </div>
          </div>
        </div>`;
    }).join("");

    async function saveTaller(key, url, title) {
      const rows = all.filter((r) => r.section === S.tallerPrefix + key);
      const custom = rows.filter((r) => r.is_visible).pop();
      if (custom) await updateRow(custom.id, { image_url: url, title });
      else await insertRow({ section: S.tallerPrefix + key, image_url: url, title });
      renderTalleresAdmin();
    }

    box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", async () => {
      const t = MEDIA.talleres.find((x) => x.key === b.dataset.key);
      const rows = all.filter((r) => r.section === S.tallerPrefix + t.key);
      const custom = rows.filter((r) => r.is_visible).pop();
      const currentText = box.querySelector(`[data-tagline="${t.key}"]`).value.trim();
      try {
        if (b.dataset.act === "change") {
          const f = await pickFile();
          imageFromFile(f, currentText, (url, title) => saveTaller(t.key, url, title));
        } else if (b.dataset.act === "edit") {
          Editor.open({ src: custom ? custom.image_url : t.src, title: currentText, onSave: (url, title) => saveTaller(t.key, url, title) });
        } else if (b.dataset.act === "text") {
          await saveTaller(t.key, custom ? custom.image_url : t.src, currentText);
        } else if (b.dataset.act === "restore") {
          if (!confirm("¿Restaurar la imagen y frase originales de " + t.name + "?")) return;
          for (const r of rows) await deleteRow(r.id);
          renderTalleresAdmin();
        }
      } catch (err) { fail("No se pudo completar la acción.", err); }
    }));
  }

  /* =========================================================
     VIDEOS
     ========================================================= */
  function splitTitle(t) {
    const p = String(t || "").split("|");
    return { title: p[0].trim(), date: p.slice(1).join("|").trim() };
  }

  function joinTitle(title, date) {
    return date ? title + " | " + date : title;
  }

  async function renderVideosAdmin() {
    const box = $("videos-admin");
    box.innerHTML = '<p class="text-muted text-center">Cargando…</p>';
    let rows;
    try { rows = await fetchRows(S.videos); } catch (err) {
      box.innerHTML = '<p class="text-danger text-center">Error cargando los videos.</p>';
      console.error(err); return;
    }

    let html = "";
    if (!rows.length) {
      html += `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          El sitio muestra los <strong>${MEDIA.videos.length} videos predeterminados</strong> de la carpeta galeria/2026.
          Si agregas un video, se mostrarán <strong>solo</strong> los videos que administres aquí.
          <div><button class="btn btn-sm btn-primary mt-2" id="videos-import"><i class="fas fa-file-import me-2"></i>Importar videos predeterminados</button></div>
        </div>`;
    }

    html += '<div class="adm-media-grid">' + rows.map((r) => {
      const yt = U.youtubeId(r.image_url);
      const t = splitTitle(r.title);
      const media = yt
        ? `<img src="https://img.youtube.com/vi/${yt}/hqdefault.jpg" alt="">`
        : `<video src="${esc(r.image_url)}#t=0.5" muted playsinline preload="metadata"></video>`;
      return `
        <div class="adm-media-card${r.is_visible ? "" : " is-hidden"}">
          <div class="adm-media-thumb is-vertical">${media}
            <span class="adm-badge">${yt ? "YouTube" : "Video"}${r.is_visible ? "" : " · Oculto"}</span>
          </div>
          <div class="adm-media-body">
            <input type="text" class="form-control form-control-sm" value="${esc(t.title)}" data-vt="${r.id}" placeholder="Título">
            <input type="text" class="form-control form-control-sm" value="${esc(t.date)}" data-vd="${r.id}" placeholder="Fecha o detalle">
            <div class="adm-actions">
              <button class="btn btn-sm btn-success" data-act="save" data-id="${r.id}"><i class="fas fa-check me-1"></i>Guardar</button>
              <button class="btn btn-sm ${r.is_visible ? "btn-outline-secondary" : "btn-success"}" data-act="toggle" data-id="${r.id}" title="${r.is_visible ? "Ocultar" : "Mostrar"}"><i class="fas ${r.is_visible ? "fa-eye-slash" : "fa-eye"}"></i></button>
              <button class="btn btn-sm btn-outline-danger" data-act="delete" data-id="${r.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>`;
    }).join("") + "</div>";

    box.innerHTML = html;

    const imp = $("videos-import");
    if (imp) imp.addEventListener("click", async () => {
      imp.disabled = true;
      try {
        for (const v of MEDIA.videos) await insertRow({ section: S.videos, image_url: v.src, title: joinTitle(v.title, v.date) });
      } catch (err) { fail("Error importando los videos.", err); }
      renderVideosAdmin();
    });

    box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", async () => {
      const row = rows.find((r) => String(r.id) === b.dataset.id);
      if (!row) return;
      try {
        if (b.dataset.act === "save") {
          const title = box.querySelector(`[data-vt="${row.id}"]`).value.trim() || "Video";
          const date = box.querySelector(`[data-vd="${row.id}"]`).value.trim();
          await updateRow(row.id, { title: joinTitle(title, date) });
          b.innerHTML = '<i class="fas fa-check-double me-1"></i>Guardado';
          setTimeout(renderVideosAdmin, 800);
        } else if (b.dataset.act === "toggle") {
          await updateRow(row.id, { is_visible: !row.is_visible }); renderVideosAdmin();
        } else if (b.dataset.act === "delete") {
          if (!confirm("¿Eliminar este video de la página principal?")) return;
          await deleteRow(row.id); renderVideosAdmin();
        }
      } catch (err) { fail("No se pudo completar la acción.", err); }
    }));
  }

  async function addVideoUrl() {
    const url = $("video-url").value.trim();
    const title = $("video-title").value.trim() || "Video";
    const date = $("video-date").value.trim();
    if (!url) { alert("Escribe el enlace del video."); return; }
    if (!U.youtubeId(url) && !/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) {
      if (!confirm("El enlace no parece ser de YouTube ni un archivo .mp4. ¿Agregarlo de todas formas?")) return;
    }
    try {
      await insertRow({ section: S.videos, image_url: url, title: joinTitle(title, date) });
      $("video-url").value = $("video-title").value = $("video-date").value = "";
      renderVideosAdmin();
    } catch (err) { fail("Error al agregar el video.", err); }
  }

  async function uploadVideo() {
    const file = $("video-file").files[0];
    if (!file) { alert("Selecciona un archivo de video."); return; }
    if (file.size > 50 * 1024 * 1024) { alert("El video pesa más de 50 MB. Súbelo a YouTube y agrega el enlace."); return; }
    const title = $("video-title").value.trim() || file.name.replace(/\.[^.]+$/, "");
    const date = $("video-date").value.trim();
    const path = "videos/" + Date.now() + "_" + file.name.replace(/[^\w.-]+/g, "_");

    $("video-progress").classList.remove("d-none");
    $("video-upload").disabled = true;
    try {
      const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      await insertRow({ section: S.videos, image_url: data.publicUrl, title: joinTitle(title, date) });
      $("video-file").value = $("video-title").value = $("video-date").value = "";
      renderVideosAdmin();
    } catch (err) {
      fail("No se pudo subir el video. Verifica que exista el bucket “galeria” en Supabase Storage (ver admin/supabase-media.sql) o usa un enlace de YouTube.", err);
    } finally {
      $("video-progress").classList.add("d-none");
      $("video-upload").disabled = false;
    }
  }

  /* =========================================================
     GALERÍAS DE TALLERES (slider "Vive el taller")
     Sección en gallery_images = clave del taller (ej: "computec")
     ========================================================= */

  // Reduce una imagen a JPEG (máx. 1600 px) que quepa en un registro
  function compressFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let max = 1600;
        let q = 0.85;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let out = "";
        for (let i = 0; i < 8; i++) {
          const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          canvas.width = Math.round(img.naturalWidth * k);
          canvas.height = Math.round(img.naturalHeight * k);
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          out = canvas.toDataURL("image/jpeg", q);
          if (out.length <= MAX_DATAURL) break;
          if (q > 0.6) q -= 0.1; else max = Math.round(max * 0.8);
        }
        resolve(out);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen " + file.name)); };
      img.src = url;
    });
  }

  function currentGalKey() {
    const sel = $("gal-taller");
    return sel ? sel.value : "";
  }

  function fillGalSelect() {
    const sel = $("gal-taller");
    if (!sel || sel.options.length) return;
    sel.innerHTML = MEDIA.talleres.map((t) => `<option value="${esc(t.key)}">${esc(t.name)}</option>`).join("");
    const upd = () => {
      const t = MEDIA.talleres.find((x) => x.key === sel.value);
      if (t) $("gal-view").href = t.href + "#galeria";
    };
    sel.addEventListener("change", () => { upd(); renderGaleriasAdmin(); });
    upd();
  }

  async function renderGaleriasAdmin() {
    fillGalSelect();
    const key = currentGalKey();
    const box = $("galerias-admin");
    if (!key || !box) return;
    const taller = MEDIA.talleres.find((t) => t.key === key) || { name: key };
    const defaults = (MEDIA.galerias && MEDIA.galerias[key]) || [];

    box.innerHTML = '<p class="text-muted text-center">Cargando…</p>';
    let rows;
    try { rows = await fetchRows(key); } catch (err) {
      box.innerHTML = '<p class="text-danger text-center">Error cargando las fotos de este taller.</p>';
      console.error(err); return;
    }
    if (currentGalKey() !== key) return; // el usuario cambió de taller mientras cargaba

    let html = "";
    if (!rows.length) {
      html += `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          La página de <strong>${esc(taller.name)}</strong> muestra ahora <strong>${defaults.length} fotos predeterminadas</strong> de su carpeta.
          Si agregas tus propias fotos, el slider mostrará <strong>solo</strong> las tuyas.
          Para conservar las predeterminadas (y poder editarlas, ordenarlas o quitarlas), impórtalas primero.
          <div class="adm-defaults-strip mt-3">${defaults.map((src) => `<img src="${esc(src.replace(/\.webp$/, "-thumb.webp"))}" alt="" loading="lazy">`).join("")}</div>
          ${defaults.length ? '<button class="btn btn-sm btn-primary mt-2" id="gal-import"><i class="fas fa-file-import me-2"></i>Importar fotos predeterminadas</button>' : ""}
        </div>`;
    } else if (!rows.some((r) => r.is_visible)) {
      html += '<div class="alert alert-warning"><i class="fas fa-eye-slash me-2"></i>Todas las fotos de este taller están ocultas, por eso la página muestra las fotos predeterminadas.</div>';
    }

    html += '<div class="adm-media-grid">' + rows.map((r, i) => `
      <div class="adm-media-card${r.is_visible ? "" : " is-hidden"}">
        <div class="adm-media-thumb">
          <img src="${esc(r.image_url)}" alt="" loading="lazy">
          <span class="adm-badge">${i + 1}${r.is_visible ? "" : " · Oculta"}</span>
        </div>
        <div class="adm-media-body">
          <input type="text" class="form-control form-control-sm" value="${esc(r.title === "Imagen local" ? "" : (r.title || ""))}" placeholder="Descripción (opcional)" data-title="${r.id}">
          <div class="adm-actions">
            <button class="btn btn-sm btn-primary" data-act="edit" data-id="${r.id}"><i class="fas fa-sliders me-1"></i>Editar</button>
            <button class="btn btn-sm btn-outline-primary" data-act="replace" data-id="${r.id}" title="Cambiar por otra foto"><i class="fas fa-arrow-right-arrow-left"></i></button>
            <button class="btn btn-sm btn-outline-secondary" data-act="left" data-id="${r.id}" title="Mover antes"${i === 0 ? " disabled" : ""}><i class="fas fa-arrow-left"></i></button>
            <button class="btn btn-sm btn-outline-secondary" data-act="right" data-id="${r.id}" title="Mover después"${i === rows.length - 1 ? " disabled" : ""}><i class="fas fa-arrow-right"></i></button>
            <button class="btn btn-sm ${r.is_visible ? "btn-outline-secondary" : "btn-success"}" data-act="toggle" data-id="${r.id}" title="${r.is_visible ? "Ocultar" : "Mostrar"}"><i class="fas ${r.is_visible ? "fa-eye-slash" : "fa-eye"}"></i></button>
            <button class="btn btn-sm btn-outline-danger" data-act="delete" data-id="${r.id}" title="Quitar"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>`).join("") + "</div>";

    box.innerHTML = html;

    const imp = $("gal-import");
    if (imp) imp.addEventListener("click", async () => {
      imp.disabled = true;
      imp.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Importando…';
      try {
        // Inserción en orden, una por una, para conservar la secuencia
        for (const src of defaults) await insertRow({ section: key, image_url: src, title: "" });
      } catch (err) { fail("Error importando las fotos.", err); }
      renderGaleriasAdmin();
    });

    // Guardar descripción al salir del campo
    box.querySelectorAll("[data-title]").forEach((inp) => inp.addEventListener("change", async () => {
      try {
        await updateRow(inp.dataset.title, { title: inp.value.trim() });
        inp.classList.add("is-valid");
        setTimeout(() => inp.classList.remove("is-valid"), 1200);
      } catch (err) { fail("No se pudo guardar la descripción.", err); }
    }));

    box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", async () => {
      const i = rows.findIndex((r) => String(r.id) === b.dataset.id);
      const row = rows[i];
      if (!row) return;
      try {
        const act = b.dataset.act;
        if (act === "edit") {
          Editor.open({ src: row.image_url, title: row.title, onSave: async (url, title) => { await updateRow(row.id, { image_url: url, title }); renderGaleriasAdmin(); } });
        } else if (act === "replace") {
          const f = await pickFile();
          imageFromFile(f, row.title, async (url, title) => { await updateRow(row.id, { image_url: url, title }); renderGaleriasAdmin(); });
        } else if (act === "left" || act === "right") {
          const other = rows[act === "left" ? i - 1 : i + 1];
          if (!other) return;
          // Intercambia las fechas de creación (definen el orden)
          let a = row.created_at, c = other.created_at;
          if (a === c) c = new Date(new Date(c).getTime() + (act === "left" ? -1000 : 1000)).toISOString();
          await updateRow(row.id, { created_at: c });
          await updateRow(other.id, { created_at: a });
          renderGaleriasAdmin();
        } else if (act === "toggle") {
          await updateRow(row.id, { is_visible: !row.is_visible }); renderGaleriasAdmin();
        } else if (act === "delete") {
          if (!confirm("¿Quitar esta foto de la galería del taller?")) return;
          await deleteRow(row.id); renderGaleriasAdmin();
        }
      } catch (err) { fail("No se pudo completar la acción.", err); }
    }));
  }

  async function addGalleryFiles(files) {
    const key = currentGalKey();
    if (!key || !files.length) return;
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) { alert("Selecciona archivos de imagen válidos."); return; }

    // Una sola foto: abrir el editor
    if (imgs.length === 1) {
      imageFromFile(imgs[0], "", async (url, title) => {
        await insertRow({ section: key, image_url: url, title });
        renderGaleriasAdmin();
      });
      return;
    }

    // Varias fotos: optimizar y subir en lote
    const wrap = $("gal-progress");
    const bar = $("gal-progress-bar");
    wrap.classList.remove("d-none");
    let ok = 0;
    const errors = [];
    for (let i = 0; i < imgs.length; i++) {
      bar.style.width = Math.round((i / imgs.length) * 100) + "%";
      bar.textContent = `Subiendo ${i + 1} de ${imgs.length}…`;
      try {
        const data = await compressFile(imgs[i]);
        await insertRow({ section: key, image_url: data, title: "" });
        ok++;
      } catch (err) {
        console.error(err);
        errors.push(imgs[i].name);
      }
    }
    bar.style.width = "100%";
    setTimeout(() => wrap.classList.add("d-none"), 600);
    if (errors.length) alert(`Se subieron ${ok} de ${imgs.length} fotos.\nNo se pudieron subir: ${errors.join(", ")}`);
    renderGaleriasAdmin();
  }

  /* =========================================================
     INIT
     ========================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    Editor.init();

    const modal = $("mediaModal");
    if (!modal) return;
    modal.addEventListener("show.bs.modal", () => { renderHeroAdmin(); });
    document.querySelector('[data-bs-target="#tab-talleres"]').addEventListener("shown.bs.tab", renderTalleresAdmin);
    document.querySelector('[data-bs-target="#tab-videos"]').addEventListener("shown.bs.tab", renderVideosAdmin);
    document.querySelector('[data-bs-target="#tab-hero"]').addEventListener("shown.bs.tab", renderHeroAdmin);
    document.querySelector('[data-bs-target="#tab-galerias"]').addEventListener("shown.bs.tab", renderGaleriasAdmin);

    $("gal-files").addEventListener("change", (e) => {
      const files = [...e.target.files];
      e.target.value = "";
      addGalleryFiles(files);
    });

    $("hero-file").addEventListener("change", async (e) => {
      const f = e.target.files[0];
      e.target.value = "";
      imageFromFile(f, "", async (url, title) => { await insertRow({ section: S.hero, image_url: url, title }); renderHeroAdmin(); });
    });

    $("video-add-url").addEventListener("click", addVideoUrl);
    $("video-upload").addEventListener("click", uploadVideo);
  });
})();

/* ==========================================================
   media-config.js
   Contenido visual predeterminado de la página principal.
   Lo usan index.html, las páginas de talleres y admin-panel.html.

   - Las imágenes optimizadas viven en galeria/2026/web/
   - Si el administrador sube imágenes/videos propios (tabla
     gallery_images en Supabase), esos reemplazan a estos.
   ========================================================== */
window.PCB_MEDIA = {
  // Secciones usadas en la tabla gallery_images
  sections: {
    hero: "hero",
    videos: "videos",
    tallerPrefix: "taller-" // ej: taller-computec
  },

  // Slider principal (hero)
  hero: [
    { src: "galeria/2026/web/casa-abierta-ia.webp", title: "Casa Abierta 2026 · Tecnología que transforma vidas" },
    { src: "galeria/2026/web/computec.webp", title: "Computec" },
    { src: "galeria/2026/web/mercadeo-deca.webp", title: "Mercadeo · DECA" },
    { src: "galeria/2026/web/enfermeria.webp", title: "Enfermería" },
    { src: "galeria/2026/web/cosmetologia.webp", title: "Cosmetología" },
    { src: "galeria/2026/web/artes-culinarias.webp", title: "Artes Culinarias" },
    { src: "galeria/2026/web/agricolas.webp", title: "Elaboración de Productos Agrícolas" },
    { src: "galeria/2026/web/seguridad-publica.webp", title: "Seguridad Pública" },
    { src: "galeria/2026/web/estudiantes-2026.webp", title: "Nuestros estudiantes en acción" }
  ],

  // Talleres vocacionales (una imagen por taller)
  talleres: [
    { key: "computec", name: "Computec", icon: "fa-laptop-code", href: "computec.html",
      src: "galeria/2026/web/computec.webp", tagline: "Repara · Programa · Diseña · Innova" },
    { key: "mercadeo", name: "Mercadeo", icon: "fa-chart-line", href: "mercadeo.html",
      src: "galeria/2026/web/mercadeo-deca.webp", tagline: "Ventas y servicios empresariales" },
    { key: "enfermeria", name: "Enfermería", icon: "fa-user-nurse", href: "enfermeria.html",
      src: "galeria/2026/web/enfermeria.webp", tagline: "El futuro es tuyo" },
    { key: "cosmetologia", name: "Cosmetología", icon: "fa-spa", href: "cosmetologia.html",
      src: "galeria/2026/web/cosmetologia.webp", tagline: "Técnicas y estilos que marcan la diferencia" },
    { key: "artes-culinarias", name: "Artes Culinarias", icon: "fa-utensils", href: "artes-culinarias.html",
      src: "galeria/2026/web/artes-culinarias.webp", tagline: "Bienvenidos a la cocina creativa" },
    { key: "elaboracion-agricolas", name: "Productos Agrícolas", icon: "fa-seedling", href: "elaboracion-agricolas.html",
      src: "galeria/2026/web/agricolas.webp", tagline: "Aprende · Cultiva · Transforma · Emprende" },
    { key: "seguridad-publica", name: "Seguridad Pública", icon: "fa-shield-halved", href: "seguridad-publica.html",
      src: "galeria/2026/web/seguridad-publica.webp", tagline: "¡Tu vocación de servicio!" }
  ],

  // Galería (slider de fotos) de cada página de taller.
  // En gallery_images la sección es la clave del taller (ej: "computec").
  // Si el admin tiene fotos visibles para un taller, se muestran SOLO esas.
  galerias: {
    "computec": [
      "galeria_computec/web/01.webp",
      "galeria_computec/web/02.webp",
      "galeria_computec/web/03.webp",
      "galeria_computec/web/04.webp",
      "galeria_computec/web/05.webp",
      "galeria_computec/web/06.webp",
      "galeria_computec/web/07.webp",
      "galeria_computec/web/08.webp",
      "galeria_computec/web/09.webp",
      "galeria_computec/web/10.webp",
      "galeria_computec/web/11.webp",
      "galeria_computec/web/12.webp",
      "galeria_computec/web/13.webp",
      "galeria_computec/web/14.webp",
      "galeria_computec/web/15.webp"
    ],
    "mercadeo": [
      "galeria_mercadeo/web/01.webp",
      "galeria_mercadeo/web/03.webp",
      "galeria_mercadeo/web/04.webp",
      "galeria_mercadeo/web/05.webp",
      "galeria_mercadeo/web/06.webp",
      "galeria_mercadeo/web/07.webp",
      "galeria_mercadeo/web/08.webp",
      "galeria_mercadeo/web/09.webp",
      "galeria_mercadeo/web/10.webp",
      "galeria_mercadeo/web/11.webp",
      "galeria_mercadeo/web/12.webp"
    ],
    "enfermeria": [
      "galeria_enfermeria/web/01.webp",
      "galeria_enfermeria/web/02.webp",
      "galeria_enfermeria/web/03.webp",
      "galeria_enfermeria/web/04.webp",
      "galeria_enfermeria/web/05.webp",
      "galeria_enfermeria/web/06.webp",
      "galeria_enfermeria/web/07.webp",
      "galeria_enfermeria/web/09.webp",
      "galeria_enfermeria/web/10.webp",
      "galeria_enfermeria/web/11.webp"
    ],
    "cosmetologia": [
      "galeria_cosmetologia/web/01.webp",
      "galeria_cosmetologia/web/03.webp",
      "galeria_cosmetologia/web/04.webp",
      "galeria_cosmetologia/web/05.webp",
      "galeria_cosmetologia/web/06.webp",
      "galeria_cosmetologia/web/07.webp",
      "galeria_cosmetologia/web/10.webp",
      "galeria_cosmetologia/web/11.webp",
      "galeria_cosmetologia/web/12.webp",
      "galeria_cosmetologia/web/13.webp",
      "galeria_cosmetologia/web/14.webp",
      "galeria_cosmetologia/web/15.webp",
      "galeria_cosmetologia/web/16.webp",
      "galeria_cosmetologia/web/17.webp",
      "galeria_cosmetologia/web/18.webp",
      "galeria_cosmetologia/web/19.webp"
    ],
    "artes-culinarias": [
      "galeria_artes_culinarias/web/02.webp",
      "galeria_artes_culinarias/web/03.webp",
      "galeria_artes_culinarias/web/04.webp",
      "galeria_artes_culinarias/web/05.webp",
      "galeria_artes_culinarias/web/06.webp",
      "galeria_artes_culinarias/web/07.webp",
      "galeria_artes_culinarias/web/08.webp",
      "galeria_artes_culinarias/web/09.webp",
      "galeria_artes_culinarias/web/10.webp",
      "galeria_artes_culinarias/web/11.webp",
      "galeria_artes_culinarias/web/12.webp",
      "galeria_artes_culinarias/web/13.webp"
    ],
    "elaboracion-agricolas": [
      "galeria_agricolas/web/02.webp",
      "galeria_agricolas/web/03.webp",
      "galeria_agricolas/web/04.webp",
      "galeria_agricolas/web/05.webp",
      "galeria_agricolas/web/06.webp",
      "galeria_agricolas/web/07.webp",
      "galeria_agricolas/web/08.webp",
      "galeria_agricolas/web/09.webp",
      "galeria_agricolas/web/10.webp",
      "galeria_agricolas/web/11.webp",
      "galeria_agricolas/web/12.webp",
      "galeria_agricolas/web/13.webp",
      "galeria_agricolas/web/14.webp",
      "galeria_agricolas/web/15.webp",
      "galeria_agricolas/web/16.webp",
      "galeria_agricolas/web/17.webp",
      "galeria_agricolas/web/18.webp",
      "galeria_agricolas/web/19.webp",
      "galeria_agricolas/web/20.webp",
      "galeria_agricolas/web/21.webp",
      "galeria_agricolas/web/22.webp",
      "galeria_agricolas/web/23.webp",
      "galeria_agricolas/web/24.webp",
      "galeria_agricolas/web/25.webp"
    ],
    "seguridad-publica": [
      "galeria_seguridad/web/01.webp",
      "galeria_seguridad/web/02.webp",
      "galeria_seguridad/web/04.webp",
      "galeria_seguridad/web/05.webp"
    ]
  },

  // Videos (formato vertical tipo reel)
  videos: [
    { src: "galeria/2026/WhatsApp%20Video%202026-11-03%20at%208.50.39%20PM.mp4", title: "Casa Abierta 2026", date: "3 nov 2026" },
    { src: "galeria/2026/WhatsApp%20Video%202026-11-04%20at%208.13.10%20PM.mp4", title: "Experiencia PCB", date: "4 nov 2026" },
    { src: "galeria/2026/WhatsApp%20Video%202025-11-26%20at%204.49.01%20PM.mp4", title: "Recuerdos Casa Abierta", date: "26 nov 2025" }
  ]
};

/* Utilidades compartidas */
window.PCB_UTILS = {
  // Devuelve el ID de YouTube si la URL es de YouTube, si no null
  youtubeId(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  },
  esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
};

/**
 * Configuración de Supabase para Casa Abierta Admin
 * =================================================
 * Reemplaza los valores con tus credenciales de Supabase
 * 
 * PASOS PARA CONFIGURAR:
 * 1. Crea un proyecto en https://supabase.com
 * 2. Copia las credenciales de tu proyecto
 * 3. Ejecuta el SQL en supabase-schema.sql en el SQL Editor
 * 4. Actualiza las credenciales abajo
 */

const SUPABASE_CONFIG = {
  // URL de tu proyecto Supabase (ejemplo: https://xxxxx.supabase.co)
  url: 'TU_SUPABASE_URL_AQUI',
  
  // Clave pública anónima (ANON KEY) - esta se usa en el cliente
  anonKey: 'TU_ANON_KEY_AQUI',
  
  // Bucket de almacenamiento para imágenes
  storageBucket: 'galeria'
};

// Inicializar cliente Supabase
let supabaseClient;

async function initSupabase() {
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return supabaseClient;
  }
  console.error('Supabase SDK no está cargado');
  return null;
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Iniciar sesión con email y contraseña
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña
 * @returns {Promise} - Usuario autenticado
 */
async function login(email, password) {
  const supabase = await initSupabase();
  if (!supabase) throw new Error('Supabase no inicializado');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (error) throw error;
  return data;
}

/**
 * Cerrar sesión
 */
async function logout() {
  const supabase = await initSupabase();
  if (!supabase) return;
  
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error al cerrar sesión:', error);
  
  // Limpiar sesión local
  localStorage.removeItem('casaAbiertaSession');
  window.location.href = 'login.html';
}

/**
 * Verificar si hay sesión activa
 */
async function checkAuth() {
  const supabase = await initSupabase();
  if (!supabase) return null;
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Proteger ruta - redirigir si no hay sesión
 */
async function protectRoute() {
  const session = await checkAuth();
  if (!session) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ============================================
// FUNCIONES DE ANUNCIOS (CRUD)
// ============================================

/**
 * Obtener todos los anuncios
 */
async function getAnnouncements() {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Crear nuevo anuncio
 */
async function createAnnouncement(announcement) {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('announcements')
    .insert([announcement])
    .select();
  
  if (error) throw error;
  return data[0];
}

/**
 * Actualizar anuncio
 */
async function updateAnnouncement(id, updates) {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('announcements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

/**
 * Eliminar anuncio
 */
async function deleteAnnouncement(id) {
  const supabase = await initSupabase();
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ============================================
// FUNCIONES DE EVENTOS (CRUD)
// ============================================

/**
 * Obtener todos los eventos
 */
async function getEvents() {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * Crear nuevo evento
 */
async function createEvent(event) {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select();
  
  if (error) throw error;
  return data[0];
}

/**
 * Actualizar evento
 */
async function updateEvent(id, updates) {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

/**
 * Eliminar evento
 */
async function deleteEvent(id) {
  const supabase = await initSupabase();
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ============================================
// FUNCIONES DE INFORMACIÓN DEL SITIO
// ============================================

/**
 * Obtener toda la información del sitio
 */
async function getSiteInfo() {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('site_info')
    .select('*');
  
  if (error) throw error;
  
  // Convertir array a objeto por key
  const info = {};
  data.forEach(item => {
    info[item.key] = item.value;
  });
  return info;
}

/**
 * Actualizar información del sitio
 */
async function updateSiteInfo(key, value) {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('site_info')
    .update({ 
      value: value, 
      updated_at: new Date().toISOString() 
    })
    .eq('key', key)
    .select();
  
  if (error) throw error;
  return data[0];
}

/**
 * Actualizar múltiples campos de información
 */
async function updateSiteInfoBulk(updates) {
  const supabase = await initSupabase();
  const now = new Date().toISOString();
  
  for (const [key, value] of Object.entries(updates)) {
    const { error } = await supabase
      .from('site_info')
      .update({ value: value, updated_at: now })
      .eq('key', key);
    
    if (error) {
      console.error(`Error actualizando ${key}:`, error);
    }
  }
  return true;
}

// ============================================
// FUNCIONES DE GALERÍA
// ============================================

/**
 * Obtener todas las imágenes de la galería
 */
async function getGallery() {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * Subir imagen al storage
 */
async function uploadImage(file, category = 'general') {
  const supabase = await initSupabase();
  const fileName = `${category}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(SUPABASE_CONFIG.storageBucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(SUPABASE_CONFIG.storageBucket)
    .getPublicUrl(fileName);
  
  return {
    path: data.path,
    url: publicUrl
  };
}

/**
 * Agregar imagen a la base de datos
 */
async function addToGallery(imageData) {
  const supabase = await initSupabase();
  const { data, error } = await supabase
    .from('gallery')
    .insert([imageData])
    .select();
  
  if (error) throw error;
  return data[0];
}

/**
 * Eliminar imagen de la galería
 */
async function deleteGalleryImage(id) {
  const supabase = await initSupabase();
  
  // Primero obtener la imagen para saber el path
  const { data: image } = await supabase
    .from('gallery')
    .select('image_path')
    .eq('id', id)
    .single();
  
  if (!image) throw new Error('Imagen no encontrada');
  
  // Eliminar de storage
  if (image.image_path) {
    await supabase.storage
      .from(SUPABASE_CONFIG.storageBucket)
      .remove([image.image_path]);
  }
  
  // Eliminar de base de datos
  const { error } = await supabase
    .from('gallery')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Mostrar notificación toast
 */
function showNotification(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Animar entrada
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Mostrar indicador de carga
 */
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="loading-spinner"></div>';
  }
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatear fecha y hora
 */
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

-- ============================================
-- ESQUEMA DE BASE DE DATOS SUPABASE
-- Proyecto: Casa Abierta Admin Dashboard
-- ============================================

-- 2. TABLA DE ANUNCIOS
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('alta', 'media', 'baja')) DEFAULT 'media',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE EVENTOS/FECHAS
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT CHECK (event_type IN ('general', 'taller', 'visita', 'otro')) DEFAULT 'general',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE INFORMACIÓN GENERAL
CREATE TABLE IF NOT EXISTS site_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE GALERÍA (solo metadatos, imágenes en Storage)
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  image_path TEXT,
  category TEXT DEFAULT 'general',
  alt_text TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Políticas para announcements
DROP POLICY IF EXISTS "admins_view_announcements" ON announcements;
CREATE POLICY "admins_view_announcements" ON announcements FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins_insert_announcements" ON announcements;
CREATE POLICY "admins_insert_announcements" ON announcements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins_update_announcements" ON announcements;
CREATE POLICY "admins_update_announcements" ON announcements FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins_delete_announcements" ON announcements;
CREATE POLICY "admins_delete_announcements" ON announcements FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para events
DROP POLICY IF EXISTS "admins_view_events" ON events;
CREATE POLICY "admins_view_events" ON events FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins_insert_events" ON events;
CREATE POLICY "admins_insert_events" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins_update_events" ON events;
CREATE POLICY "admins_update_events" ON events FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins_delete_events" ON events;
CREATE POLICY "admins_delete_events" ON events FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para site_info
DROP POLICY IF EXISTS "admins_view_site_info" ON site_info;
CREATE POLICY "admins_view_site_info" ON site_info FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins_update_site_info" ON site_info;
CREATE POLICY "admins_update_site_info" ON site_info FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para gallery
DROP POLICY IF EXISTS "public_view_gallery" ON gallery;
CREATE POLICY "public_view_gallery" ON gallery FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "admins_manage_gallery" ON gallery;
CREATE POLICY "admins_manage_gallery" ON gallery FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- STORAGE: BUCKET PARA IMÁGENES
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('galeria', 'galeria', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
DROP POLICY IF EXISTS "public_view_storage" ON storage.objects;
CREATE POLICY "public_view_storage" ON storage.objects FOR SELECT USING (bucket_id = 'galeria');

DROP POLICY IF EXISTS "admins_upload_storage" ON storage.objects;
CREATE POLICY "admins_upload_storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'galeria' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins_delete_storage" ON storage.objects;
CREATE POLICY "admins_delete_storage" ON storage.objects FOR DELETE USING (bucket_id = 'galeria' AND auth.role() = 'authenticated');

-- ============================================
-- DATOS INICIALES
-- ============================================

INSERT INTO site_info (key, value) VALUES
  ('descripcion', 'La Escuela Superior Vocacional Pablo Colón Berdecia les da la bienvenida a nuestra Casa Abierta. Explora nuestros programas técnicos y descubre tu futuro.'),
  ('ubicacion', 'Barranquitas, Puerto Rico'),
  ('telefono', '+1 787-857-2897'),
  ('email', 'info@escuelapcb.edu'),
  ('direccion', 'Carr. 156 Km 18.4, Barranquitas, PR 00794')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Contenido visual de la página principal (slider, talleres, videos)
-- Ejecutar UNA vez en Supabase → SQL Editor.
--
-- Usa la tabla existente gallery_images con estas secciones:
--   'hero'            → fotos del slider principal
--   'taller-<clave>'  → imagen de cada taller (taller-computec, taller-mercadeo, ...)
--   'videos'          → videos de "Vive la Experiencia" (title = "Título | fecha")
-- ============================================================

-- 1) Los visitantes (sin sesión) pueden VER las imágenes visibles
alter table gallery_images enable row level security;

drop policy if exists "public_read_visible_gallery_images" on gallery_images;
create policy "public_read_visible_gallery_images"
  on gallery_images for select
  using (is_visible = true);

-- 2) Los administradores (con sesión) pueden ver y administrar todo
drop policy if exists "auth_manage_gallery_images" on gallery_images;
create policy "auth_manage_gallery_images"
  on gallery_images for all
  to authenticated
  using (true)
  with check (true);

-- 3) Bucket público para subir videos desde el panel
insert into storage.buckets (id, name, public)
values ('galeria', 'galeria', true)
on conflict (id) do nothing;

drop policy if exists "public_view_storage" on storage.objects;
create policy "public_view_storage"
  on storage.objects for select
  using (bucket_id = 'galeria');

drop policy if exists "admins_upload_storage" on storage.objects;
create policy "admins_upload_storage"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'galeria');

drop policy if exists "admins_delete_storage" on storage.objects;
create policy "admins_delete_storage"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'galeria');

-- Crear bucket para imágenes de eventos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Políticas de Storage para event-images bucket

-- Permitir que cualquiera pueda VER las imágenes (bucket público)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'event-images' );

-- Permitir que usuarios autenticados SUBAN imágenes
create policy "Authenticated users can upload event images"
on storage.objects for insert
with check (
  bucket_id = 'event-images' 
  and auth.role() = 'authenticated'
);

-- Permitir que usuarios ACTUALICEN sus propias imágenes
create policy "Users can update their own event images"
on storage.objects for update
using (
  bucket_id = 'event-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'event-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuarios ELIMINEN sus propias imágenes
create policy "Users can delete their own event images"
on storage.objects for delete
using (
  bucket_id = 'event-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

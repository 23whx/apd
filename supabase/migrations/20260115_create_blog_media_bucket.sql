-- Create storage bucket for blog media (images and videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-media',
  'blog-media',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (admin/mod) to upload
CREATE POLICY "Admins can upload blog media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-media' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'mod')
  )
);

-- Allow public read access
CREATE POLICY "Public can view blog media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-media');

-- Allow admins to delete
CREATE POLICY "Admins can delete blog media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-media' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'mod')
  )
);

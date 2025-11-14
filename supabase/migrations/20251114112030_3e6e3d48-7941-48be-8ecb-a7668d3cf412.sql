-- Criar políticas RLS para o bucket maintenance-attachments
-- Permitir que usuários façam upload de seus próprios arquivos
CREATE POLICY "Users can upload their own maintenance attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários visualizem seus próprios arquivos
CREATE POLICY "Users can view their own maintenance attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários atualizem seus próprios arquivos
CREATE POLICY "Users can update their own maintenance attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários deletem seus próprios arquivos
CREATE POLICY "Users can delete their own maintenance attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
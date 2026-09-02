-- Criação do Bucket de Storage para os Prestadores
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prestadores', 
  'prestadores', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de Segurança (RLS) para os arquivos (storage.objects)

-- 1. Leitura: Qualquer pessoa pode ver as imagens (público)
CREATE POLICY "Imagens dos prestadores sao publicas"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'prestadores' );

-- 2. Inserção: Apenas usuários autenticados podem enviar arquivos
CREATE POLICY "Usuarios autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'prestadores' AND auth.role() = 'authenticated' );

-- 3. Atualização: Usuário só pode atualizar o próprio arquivo (owner)
CREATE POLICY "Usuarios podem atualizar suas imagens"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'prestadores' AND auth.uid() = owner )
  WITH CHECK ( bucket_id = 'prestadores' AND auth.role() = 'authenticated' );

-- 4. Exclusão: Usuário só pode deletar o próprio arquivo
CREATE POLICY "Usuarios podem deletar suas imagens"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'prestadores' AND auth.uid() = owner );

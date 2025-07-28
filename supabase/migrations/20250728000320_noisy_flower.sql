-- Script para debugar políticas RLS e verificar problemas de CRUD
-- Execute no Supabase SQL Editor

-- 1. Verificar se RLS está habilitado na tabela
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'delivery_products';

-- 2. Listar todas as políticas da tabela delivery_products
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'delivery_products';

-- 3. Verificar se o produto específico existe
SELECT id, name, category, is_active, created_at, updated_at 
FROM delivery_products 
WHERE id = '74ed4024-ee86-4555-9f02-8b092dbe9067';

-- 4. Contar total de produtos na tabela
SELECT COUNT(*) as total_produtos FROM delivery_products;

-- 5. Verificar últimos produtos criados
SELECT id, name, created_at 
FROM delivery_products 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Testar INSERT manual (se necessário)
-- DESCOMENTE APENAS SE QUISER CRIAR O PRODUTO MANUALMENTE:
/*
INSERT INTO delivery_products (
  id, 
  name, 
  category, 
  price, 
  description, 
  is_active,
  created_at,
  updated_at
) VALUES (
  '74ed4024-ee86-4555-9f02-8b092dbe9067',
  'AÇAÍ DE 13,99 (300G)',
  'acai',
  13.99,
  'AÇAÍ + 2 CREME + 3 MIX',
  true,
  now(),
  now()
);
*/

-- 7. Verificar usuário atual (se usando auth)
SELECT auth.uid() as current_user_id;

-- 8. Verificar se há conflitos de ID
SELECT id, name, COUNT(*) 
FROM delivery_products 
GROUP BY id, name 
HAVING COUNT(*) > 1;

-- 9. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'delivery_products'
ORDER BY ordinal_position;
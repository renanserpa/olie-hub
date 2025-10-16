# Instruções de Deploy - Reconexão Supabase

## 1. Atualizar ENV no Lovable (Preview e Production)

### Preview
Já aplicado via `.env` local:
- ✅ `NEXT_PUBLIC_SUPABASE_URL=https://qrfvdoecpmcnlpxklcsu.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`
- ✅ `VITE_APP_ENV=preview`
- ✅ `NEXT_PUBLIC_SUPABASE_ALLOWED_REF=qrfvdoecpmcnlpxklcsu`

### Production
Acesse **Lovable → Project Settings → Environment Variables** e configure:
```
NEXT_PUBLIC_SUPABASE_URL=https://qrfvdoecpmcnlpxklcsu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZnZkb2VjcG1jbmxweGtsY3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTU2OTEsImV4cCI6MjA3NjAzMTY5MX0.dpX90AmxL_JrxkYacPFkzQzhmCETDTa21Up5TdQgLLk
VITE_APP_ENV=production
NEXT_PUBLIC_SUPABASE_ALLOWED_REF=qrfvdoecpmcnlpxklcsu
```

## 2. Aplicar Migrations no Supabase qrfvdoecpmcnlpxklcsu

1. Acesse https://supabase.com/dashboard/project/qrfvdoecpmcnlpxklcsu
2. Navegue para **SQL Editor**
3. Execute **na ordem** os arquivos:
   - `db/migrations/2025-10-16_001_configs_core.sql`
   - `db/migrations/2025-10-16_002_configs_more.sql`
4. (Opcional) Execute seeds para dados de exemplo:
   - `db/seeds/2025-10-16_configs_seeds.sql`
   - `db/seeds/2025-10-16_configs_seeds_2.sql`

## 3. Verificar RLS e Roles

Garanta que o banco tenha:

### Enum de Roles:
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'producao', 'atendimento');
```

### Função has_role:
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### Criar usuário admin:
```sql
-- Substitua <user_id> pelo UUID do seu usuário
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user_id>', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;
```

## 4. Verificar Conectividade

1. Acesse a aplicação (Preview ou Production)
2. Banner no topo deve mostrar:
   - `ENV: PREVIEW • SUPABASE: qrfvdoecpmcnlpxklcsu` ✅ "Ambiente correto"
3. Acesse `/admin/diagnostics/configs` (somente admin)
4. Verifique que todos os checks estão OK (verde)

## 5. Refetch em Caso de Erro

Se alguma tela mostrar "Migrations pendentes":
1. Verifique se aplicou TODAS as migrations (passo 2)
2. Clique no botão **"Tentar novamente"** na tela
3. Ou force refresh: `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)

## 6. Migrar Dados (Opcional)

Se houver dados importantes no projeto antigo `ivhccupahlyrwqilzasa`:

1. **Exportar dados críticos:**
   - Pedidos (`orders`)
   - Contatos (`contacts`)
   - Produtos (`products`)

2. **Importar no novo projeto:**
   - Ajustar UUIDs e FKs se necessário
   - Usar ferramenta de Import/Export do Supabase ou SQL Editor

## 7. Deploy Final

1. Commit das mudanças: `git commit -am "chore: reconexão Supabase qrfvdoecpmcnlpxklcsu"`
2. Push para repositório: `git push origin main`
3. Lovable fará deploy automático (Preview e Production)
4. Verificar banner e diagnóstico após deploy

---

**Checklist Final:**
- [ ] ENV atualizadas (Preview e Production)
- [ ] Migrations aplicadas no qrfvdoecpmcnlpxklcsu
- [ ] RLS policies e roles verificadas
- [ ] Usuário admin criado
- [ ] Banner mostra ambiente correto
- [ ] Diagnóstico sem erros
- [ ] Tiny ERP desativado/oculto
- [ ] Settings reorganizado (7 seções)

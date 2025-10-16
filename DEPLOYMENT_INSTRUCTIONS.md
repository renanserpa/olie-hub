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

## 2. GitHub Actions para migrations

### Secrets necessários (já configurados)

Os workflows usam dois secrets no GitHub (`Settings → Secrets and variables → Actions`). Caso precisem ser recriados:

1. `SUPABASE_ACCESS_TOKEN`
   - Gere um access token em [Supabase → Account Settings → Access Tokens](https://supabase.com/account/tokens) com permissões de Deploy.
   - No GitHub, clique em **New repository secret**, defina o nome e cole o token.
2. `SUPABASE_DB_PASSWORD`
   - Em Supabase, acesse **Project Settings → Database** e copie a senha do usuário `postgres`.
   - Crie o secret no GitHub com este valor.

### Rodar workflows manualmente

1. Vá para **GitHub → Actions**.
2. Selecione **“Supabase — Migrate & Seed (remote)”** ou **“Supabase — Health Probe”**.
3. Clique em **Run workflow** e confirme. As migrations são aplicadas e os seeds executados de forma idempotente.

> **Observação:** não utilize a `service_role` no cliente. Ela deve ficar apenas nos secrets do CI.

## 3. Aplicar Migrations no Supabase qrfvdoecpmcnlpxklcsu

1. Acesse https://supabase.com/dashboard/project/qrfvdoecpmcnlpxklcsu
2. Navegue para **SQL Editor**
3. Execute **na ordem** os arquivos:
   - `db/migrations/2025-10-16_001_configs_core.sql`
   - `db/migrations/2025-10-16_002_configs_more.sql`
4. (Opcional) Execute seeds para dados de exemplo:
   - `db/seeds/2025-10-16_configs_seeds.sql`
   - `db/seeds/2025-10-16_configs_seeds_2.sql`

## 4. Verificar RLS e Roles

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

## 5. Verificar Conectividade

1. Acesse a aplicação (Preview ou Production)
2. Banner no topo deve mostrar:
   - `ENV: PREVIEW • SUPABASE: qrfvdoecpmcnlpxklcsu` ✅ "Ambiente correto"
3. Acesse `/admin/diagnostics/configs` (somente admin)
4. Verifique que todos os checks estão OK (verde)

## 6. Refetch em Caso de Erro

Se alguma tela mostrar "Migrations pendentes":
1. Verifique se aplicou TODAS as migrations (passo 3)
2. Clique no botão **"Tentar novamente"** na tela
3. Ou force refresh: `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)

## 7. Migrar Dados (Opcional)

Se houver dados importantes no projeto antigo `ivhccupahlyrwqilzasa`:

1. **Exportar dados críticos:**
   - Pedidos (`orders`)
   - Contatos (`contacts`)
   - Produtos (`products`)

2. **Importar no novo projeto:**
   - Ajustar UUIDs e FKs se necessário
   - Usar ferramenta de Import/Export do Supabase ou SQL Editor

## 8. Deploy Final

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

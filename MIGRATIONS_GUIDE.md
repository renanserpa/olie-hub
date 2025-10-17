# Guia de Aplicação de Migrations - Olie Hub

## ⚠️ CRÍTICO: Migrations Pendentes

O projeto possui migrations SQL que **não foram aplicadas** no Supabase. 
Sem elas, o app **não irá buildar**.

---

## 📋 Passo a Passo

### 1. Acesse o Supabase
- URL: https://supabase.com/dashboard/project/qrfvdoecpmcnlpxklcsu
- Navegue para: **SQL Editor** (menu lateral)

### 2. Aplique as Migrations (NA ORDEM)

#### Migration 1: Configs Core
- Arquivo: `db/migrations/2025-10-16_001_configs_core.sql`
- Conteúdo: Paletas, Texturas, View de Cores
- **Copie todo o conteúdo** do arquivo e execute no SQL Editor

#### Migration 2: Configs More
- Arquivo: `db/migrations/2025-10-16_002_configs_more.sql`
- Conteúdo: Materiais, Grupos, Embalagens, Vínculos, Personalização, Opções
- **Copie todo o conteúdo** do arquivo e execute no SQL Editor

### 3. (Opcional) Seeds
- Arquivo: `db/seeds/2025-10-16_configs_seeds.sql`
- Arquivo: `db/seeds/2025-10-16_configs_seeds_2.sql`
- Adiciona dados de exemplo (paletas, cores, texturas)

### 4. Verifique
- Acesse: `/admin/diagnostics/configs` (no app)
- Todos os checks devem estar **OK (verde)**

---

## ✅ Checklist Final

- [ ] Migration 1 aplicada (sem erros)
- [ ] Migration 2 aplicada (sem erros)
- [ ] Seeds aplicados (opcional)
- [ ] Diagnóstico mostra tudo OK
- [ ] Banner mostra `SUPABASE: qrfvdoecpmcnlpxklcsu`
- [ ] Build passa sem erros TypeScript

---

## 🔒 Configurar Usuário Admin

Após aplicar migrations:

1. Auth → Users → Copie seu UUID
2. SQL Editor → Execute:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU-UUID-AQUI', 'admin')
ON CONFLICT (user_id, role) 
DO UPDATE SET role = EXCLUDED.role;
```

3. Faça logout e login novamente

---

## 🆘 Troubleshooting

### Erro "relation does not exist"
- Verifique se executou as migrations na ordem correta
- Certifique-se de estar no projeto `qrfvdoecpmcnlpxklcsu`

### Erro "permission denied"
- Configure seu usuário como admin (veja seção acima)
- Faça logout e login novamente

### Types.ts desatualizado
- O Lovable Cloud regenera automaticamente após aplicar migrations
- Aguarde alguns segundos e recarregue a página

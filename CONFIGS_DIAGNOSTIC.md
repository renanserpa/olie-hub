# 📊 DIAGNÓSTICO ATUAL - MÓDULO CONFIGS

**Data**: 2025-10-15  
**Projeto**: Olie ERP  
**Database**: Supabase (PostgreSQL)

---

## 🗄️ TABELAS EXISTENTES RELACIONADAS A CONFIGS

### ✅ **Cores de Componentes** (Recém-criadas)
| Tabela | Colunas | Status | Observações |
|--------|---------|--------|-------------|
| `fabric_colors` | id, name, hex, cmyk, price_per_meter, stock_product_id, is_active | ✅ Existe | Cores de tecido com CMYK |
| `zipper_colors` | id, name, hex, cmyk, price_delta, stock_product_id, is_active | ✅ Existe | Cores de zíper |
| `lining_colors` | id, name, hex, cmyk, price_per_meter, stock_product_id, is_active | ✅ Existe | Cores de forro |
| `bias_colors` | id, name, hex, cmyk, price_per_meter, stock_product_id, is_active | ✅ Existe | Cores de viés |

### ✅ **Categorias e Status**
| Tabela | Colunas | Status | Uso |
|--------|---------|--------|-----|
| `product_categories` | id, name, type, properties (jsonb), sort_order, is_active | ✅ Existe | Categorias de produtos customizáveis |
| `order_statuses` | id, name, label, color, icon, is_system, is_active, sort_order | ✅ Existe | Status customizáveis de pedidos |
| `production_statuses` | id, name, label, color, icon, is_system, is_active, sort_order | ✅ Existe | Status customizáveis de produção |
| `shipping_statuses` | id, name, label, color, icon, is_system, is_active, sort_order | ✅ Existe | Status customizáveis de entregas |

### ✅ **Produtos e Configurações**
| Tabela | Colunas | Status | Uso |
|--------|---------|--------|-----|
| `products` | id, sku, name, category, technical_specs (jsonb), customization_options (jsonb), materials (jsonb) | ✅ Existe | Produtos base |
| `product_svg_maps` | id, product_id, svg_url, svg_mapping (jsonb) | ✅ Existe | Mapeamento SVG de peças |
| `product_configurations` | id, product_id, fabric_color_id, zipper_color_id, lining_color_id, bias_color_id, config_json | ✅ Existe | Configurações de produto |
| `config_presets` | id, product_id, name, config_json, preview_png_url, price_delta, is_active | ✅ Existe | Presets de configuração |

### ✅ **Estoque e Materiais**
| Tabela | Colunas | Status | Uso |
|--------|---------|--------|-----|
| `inventory_bom` | id, product_id, supply_product_id, color_type, color_id, quantity_per_unit, unit | ✅ Existe | Bill of Materials (BOM) |
| `inventory_movements` | id, product_id, type, quantity, reason, reference_id | ✅ Existe | Movimentações de estoque |

### ✅ **Outros**
| Tabela | Colunas | Status | Uso |
|--------|---------|--------|-----|
| `templates` | id, name, category, subject, content, variables, is_active | ✅ Existe | Templates de mensagens |
| `user_roles` | id, user_id, role (enum: admin, producao, atendimento) | ✅ Existe | RBAC implementado |

---

## 🎨 COMPONENTES/TELAS EXISTENTES

### Admin (Settings)
- ✅ `Settings.tsx` - Hub de configurações com tabs
- ✅ `CategoryManager.tsx` - CRUD de categorias de produtos
- ✅ `StatusManager.tsx` - CRUD de status (pedidos, produção, entregas)
- ✅ `ColorLibrary.tsx` - CRUD de cores (fabric, zipper, lining, bias) com HEX + CMYK
- ✅ `ImportDialog.tsx` / `ExportDialog.tsx` - Import/export de dados

### Configuradores
- ✅ `SVGUploader.tsx` - Upload e mapeamento de SVG de produtos
- ✅ `SVGColorTester.tsx` - Testador interativo de cores em SVG
- ✅ `InboxConfigurator.tsx` - Configurador para atendimento (Inbox)

### Páginas
- ✅ `ProductDetail.tsx` - Detalhe de produto com configurador
- ✅ `Inventory.tsx` - Gestão de estoque
- ✅ `Orders.tsx` - Gestão de pedidos
- ✅ `Production.tsx` - Gestão de produção

---

## 🔌 ROTAS/API EXISTENTES (Edge Functions)

| Função | Método | Uso | Status |
|--------|--------|-----|--------|
| `sandbox-cart` | POST | Gerenciar carrinho | ✅ Ativo |
| `sandbox-checkout` | POST | Processar checkout | ✅ Ativo |
| `sandbox-config` | GET/POST | Configurações sandbox | ✅ Ativo |
| `tiny-sync` | POST | Sincronizar Tiny ERP | ✅ Ativo |
| `tiny-create-order` | POST | Criar pedido no Tiny | ✅ Ativo |
| `tiny-webhooks` | POST | Webhooks do Tiny | ✅ Ativo |

---

## 📋 GAP ANALYSIS - O QUE FALTA PARA MÓDULO CONFIGS

### ❌ **Tabelas Faltantes** (para completar o módulo)

| Tabela Solicitada | Status | Ação |
|-------------------|--------|------|
| `config_color_palettes` | ❌ Não existe | 🆕 Criar nova tabela |
| ~~`config_colors`~~ | ✅ **JÁ EXISTE** (4 tabelas separadas) | ✨ Considerar consolidação ou manter separado |
| `config_fabric_textures` | ❌ Não existe | 🆕 Criar nova tabela |
| `config_basic_materials` | ⚠️ Parcial (`products` com tipo "insumo") | 🔧 Ajustar ou criar tabela dedicada |
| `config_supply_groups` | ❌ Não existe | 🆕 Criar nova tabela |
| `config_packaging_types` | ❌ Não existe | 🆕 Criar nova tabela |
| `config_bond_types` | ❌ Não existe | 🆕 Criar nova tabela (RH) |
| `config_customization_components` | ⚠️ Parcial (em `product_svg_maps.svg_mapping`) | 🔧 Criar tabela dedicada |
| `config_component_options` | ⚠️ Parcial (cores existem, falta generalizar) | 🔧 Criar tabela unificada |

### ⚠️ **Decisões Arquiteturais Necessárias**

1. **Cores**: 
   - ✅ Manter 4 tabelas separadas (`fabric_colors`, `zipper_colors`, etc.) **OU**
   - ❌ Consolidar em `config_colors` + `config_color_palettes`?
   - **Recomendação**: Manter separadas (já implementado, funcional, tipado)

2. **Materiais**:
   - Usar `products` com flag `is_supply = true` **OU**
   - Criar `config_basic_materials` dedicada?
   - **Recomendação**: Criar tabela dedicada (mais clara, sem conflito com produtos finais)

3. **Component Options**:
   - Generalizar as 4 tabelas de cores em uma única `config_component_options`?
   - **Recomendação**: Manter cores separadas + criar nova tabela para outros componentes (alças, ferragens, etiquetas)

---

## 🚀 PLANO DE IMPLEMENTAÇÃO SUGERIDO

### **FASE 1: Paletas e Texturas** (2h)
- Criar `config_color_palettes`
- Vincular cores existentes às paletas (FK opcional)
- Criar `config_fabric_textures`
- Seeds iniciais
- Telas Admin CRUD

### **FASE 2: Materiais e Grupos** (2h)
- Criar `config_basic_materials`
- Criar `config_supply_groups`
- Vincular materiais a grupos
- Seeds iniciais
- Telas Admin CRUD

### **FASE 3: Embalagens e Vínculos** (1.5h)
- Criar `config_packaging_types`
- Criar `config_bond_types`
- Seeds iniciais
- Telas Admin CRUD

### **FASE 4: Componentes de Personalização** (2h)
- Criar `config_customization_components`
- Criar `config_component_options` (generalizada)
- Migrar dados de `product_svg_maps.svg_mapping` se necessário
- Seeds iniciais
- Telas Admin CRUD

### **FASE 5: Integração e Testes** (1.5h)
- Atualizar `ProductDetail.tsx` para usar novas configs
- Atualizar `SVGColorTester.tsx` para usar paletas
- Testes de API (smoke tests)
- Verificação de integridade (FKs, constraints)

### **FASE 6: Relatório Final** (0.5h)
- Gerar README de gap atualizado
- Changelog/Release notes
- Documentação de uso

**TOTAL ESTIMADO**: ~9.5 horas

---

## ⚡ PRÓXIMOS PASSOS IMEDIATOS

1. **Decidir arquitetura de cores**: manter separadas ou consolidar?
2. **Confirmar prioridade**: começar por qual fase?
3. **Definir escopo mínimo**: implementar todas as 9 coleções ou fazer incremental?

---

## 📝 OBSERVAÇÕES TÉCNICAS

- ✅ **RBAC**: Já implementado com `has_role()` function e enum `app_role`
- ✅ **Padrões**: Tabelas usam `id UUID`, `created_at`, `updated_at`, `is_active`
- ✅ **Validações**: Zod schemas já em uso nos componentes
- ✅ **UI**: Design system consistente com Shadcn/UI
- ⚠️ **Seeds**: Precisam ser idempotentes (INSERT ... ON CONFLICT DO NOTHING)
- ⚠️ **Migrações**: Devem preservar dados existentes

---

**RECOMENDAÇÃO**: Implementar **incrementalmente** (1-2 fases por vez) para validar antes de prosseguir.

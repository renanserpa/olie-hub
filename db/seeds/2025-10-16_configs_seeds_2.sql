-- Supply Groups
INSERT INTO public.config_supply_groups (name, codigo, descricao)
VALUES ('Têxteis','TEX','Tecidos, sintéticos, malhas'),
       ('Ferragens','FER','Argolas, mosquetões e metais'),
       ('Embalagens','EMB','Caixas, sacos e acessórios de envio'),
       ('Acessórios','ACC','Complementos variados')
ON CONFLICT (codigo) DO NOTHING;

-- Basic Materials
WITH material_data AS (
  SELECT * FROM (VALUES
    ('Zíper Nylon 5 Preto','ZIP005', 'pc', 2.50, '{}'::jsonb, 'FER'),
    ('Cursor Preto','CUR001', 'pc', 1.10, '{}'::jsonb, 'FER'),
    ('Nylon 600D Preto','NYL600', 'm', 28.90, '{"gramatura":600}'::jsonb, 'TEX'),
    ('Viés 30mm Preto','VIE030', 'm', 1.80, '{"largura_mm":30}'::jsonb, 'TEX')
  ) AS v(name, codigo, unit_txt, cost_value, metadata_json, group_codigo)
)
INSERT INTO public.config_basic_materials (name, codigo, unit, default_cost, metadata, supply_group_id)
SELECT v.name,
       v.codigo,
       v.unit_txt::material_unit,
       v.cost_value,
       v.metadata_json,
       sg.id
FROM material_data v
LEFT JOIN public.config_supply_groups sg ON sg.codigo = v.group_codigo
ON CONFLICT (codigo) DO NOTHING;

-- Packaging Types
INSERT INTO public.config_packaging_types (name, codigo, dimensions_json, material, capacity, weight_limit_g)
VALUES ('Caixa Pequena','CXP','{"l":20,"w":15,"h":10}'::jsonb,'Papelão','Até 3 itens',2500),
       ('Caixa Média','CXM','{"l":35,"w":25,"h":15}'::jsonb,'Papelão reforçado','Até 6 itens',5000),
       ('Saco TNT','STNT','{"l":40,"w":5,"h":60}'::jsonb,'TNT','Mochilas leves',1200)
ON CONFLICT (codigo) DO NOTHING;

-- Bond Types
INSERT INTO public.config_bond_types (name, codigo, payroll_effects_json)
VALUES ('Contrato CLT','CLT','{"fgts":true,"inss":true}'::jsonb),
       ('Pessoa Jurídica','PJ','{"nf":true,"retencoes":true}'::jsonb),
       ('Freelancer','FREE','{"fgts":false,"inss":false}'::jsonb)
ON CONFLICT (codigo) DO NOTHING;

-- Customization Components
INSERT INTO public.config_customization_components (name, codigo, type, allowed_positions_json, max_colors, price_extra)
VALUES ('Bordado Frontal Padrão','BRD001','bordado',ARRAY['"frente"'::jsonb,'"bolso"'::jsonb],6,12.50),
       ('Gravação Laser Exclusiva','LAS001','laser',ARRAY['"frente"'::jsonb,'"lateral"'::jsonb],1,18.00),
       ('Monograma Personalizado','MON002','monograma',ARRAY['"interna"'::jsonb],3,22.00),
       ('Aplicação Patch Premium','PAT001','aplicacao',ARRAY['"frente"'::jsonb,'"costas"'::jsonb],4,15.00)
ON CONFLICT (codigo) DO NOTHING;

-- Component Options
INSERT INTO public.config_component_options (name, codigo, component_type, compatible_products_json, metadata)
VALUES ('Zíper YKK Nº5 Preto','ZIPYKK5P','ziper',ARRAY['{"produto":"mochila"}'::jsonb,'{"produto":"necessaire"}'::jsonb],'{}'::jsonb),
       ('Puxador Courvin Preto','PUXCP','cursor_puxador',ARRAY['{"produto":"mochila"}'::jsonb],'{}'::jsonb),
       ('Forro Nylon Preto','FORNP','forro',ARRAY['{"produto":"mochila"}'::jsonb,'{"produto":"bolsa"}'::jsonb],'{}'::jsonb),
       ('Tecido Externo Poliéster','TEXP','tecido_externo',ARRAY['{"produto":"mochila"}'::jsonb],'{"acabamento":"fosco"}'::jsonb),
       ('Viés Poli 30mm Preto','VIEP30','vies',ARRAY['{"produto":"mochila"}'::jsonb,'{"produto":"estojo"}'::jsonb],'{"largura_mm":30}'::jsonb),
       ('Alça Reforçada Nylon','ALCRN','alca',ARRAY['{"produto":"mochila"}'::jsonb],'{"largura_mm":25}'::jsonb),
       ('Etiqueta Olie Off-White','ETQOL','etiqueta',ARRAY['{"produto":"mochila"}'::jsonb,'{"produto":"bolsa"}'::jsonb],'{"acabamento":"bordado"}'::jsonb)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.config_color_palettes (name, descricao)
VALUES ('Olie Base','Paleta padrão Olie'),
       ('Olie Black & White','Preto/Branco'),
       ('Olie Vibrant','Cores vivas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.config_fabric_textures (name,codigo,texture_type,composition)
VALUES ('Nylon 600D Liso','NYL600L','plain','100% Nylon'),
       ('Cordura 1000D','CRD1000','plain','100% Nylon Cordura'),
       ('Xadrez Vichy','XAD001','pattern','65% Poliéster, 35% Algodão')
ON CONFLICT (codigo) DO NOTHING;

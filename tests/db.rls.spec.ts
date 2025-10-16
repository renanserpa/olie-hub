import { Client } from 'pg';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Admin (aplica migrations/seed). Em CI: postgres superuser
const DB_URL_ADMIN = process.env.DATABASE_URL!;

// Usuário sem privilégio (RLS deve aplicar)
const DB_URL_RLS =
  process.env.DATABASE_URL_RLS || 'postgresql://olie_app_user:test@localhost:5432/oliehub';

const randomCode = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

describe('RLS CONFIGS', () => {
  let admin: Client;
  let user: Client;
  let supplyGroupId: string;
  let basicMaterialId: string;

  beforeAll(async () => {
    admin = new Client({ connectionString: DB_URL_ADMIN });
    await admin.connect();

    user = new Client({ connectionString: DB_URL_RLS });
    await user.connect();

    const supplyGroupResult = await admin.query(
      `INSERT INTO public.config_supply_groups (name, codigo, descricao)
       VALUES ($1, $2, $3)
       RETURNING id;`,
      ['Grupo Teste RLS', randomCode('RLSGRP'), 'Criado para validar políticas de RLS'],
    );
    supplyGroupId = supplyGroupResult.rows[0].id;

    const materialResult = await admin.query(
      `INSERT INTO public.config_basic_materials
        (name, codigo, unit, default_cost, metadata, supply_group_id)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id;`,
      ['Material Teste RLS', randomCode('RLSMAT'), 'pc', 10, '{}', supplyGroupId],
    );
    basicMaterialId = materialResult.rows[0].id;
  });

  afterAll(async () => {
    if (basicMaterialId) {
      await admin.query('DELETE FROM public.config_basic_materials WHERE id = $1', [basicMaterialId]);
    }
    if (supplyGroupId) {
      await admin.query('DELETE FROM public.config_supply_groups WHERE id = $1', [supplyGroupId]);
    }
    await user.end();
    await admin.end();
  });

  it('SELECT paletas: usuário comum só enxerga paletas ativas', async () => {
    const res = await user.query(`SELECT name, is_active FROM public.config_color_palettes;`);
    expect(res.rows.find(r => r.is_active === false)).toBeUndefined();
  });

  it('INSERT paleta: deve ser negado para usuário comum (RLS + policy)', async () => {
    const insert = user.query(
      `INSERT INTO public.config_color_palettes (name, is_active) VALUES ('Teste RLS', true);`
    );
    await expect(insert).rejects.toBeTruthy();
  });

  describe('config_supply_groups', () => {
    it('nega INSERT para usuário sem papel de admin', async () => {
      const attempt = user.query(
        `INSERT INTO public.config_supply_groups (name, codigo)
         VALUES ('Grupo Bloqueado', 'RLS_DENY_GRP');`
      );
      await expect(attempt).rejects.toBeTruthy();
    });

    it('nega UPDATE para usuário sem papel de admin', async () => {
      const attempt = user.query(
        `UPDATE public.config_supply_groups SET descricao = 'Alterado sem permissão' WHERE id = $1;`,
        [supplyGroupId]
      );
      await expect(attempt).rejects.toBeTruthy();
    });

    it('nega DELETE para usuário sem papel de admin', async () => {
      const attempt = user.query(
        `DELETE FROM public.config_supply_groups WHERE id = $1;`,
        [supplyGroupId]
      );
      await expect(attempt).rejects.toBeTruthy();
    });
  });

  describe('config_basic_materials', () => {
    it('nega INSERT para usuário sem papel de admin', async () => {
      const attempt = user.query(
        `INSERT INTO public.config_basic_materials (name, codigo, unit)
         VALUES ('Material Bloqueado', 'RLS_DENY_MAT', 'pc');`
      );
      await expect(attempt).rejects.toBeTruthy();
    });

    it('nega UPDATE para usuário sem papel de admin', async () => {
      const attempt = user.query(
        `UPDATE public.config_basic_materials SET default_cost = 99 WHERE id = $1;`,
        [basicMaterialId]
      );
      await expect(attempt).rejects.toBeTruthy();
    });

    it('nega DELETE para usuário sem papel de admin', async () => {
      const attempt = user.query(
        `DELETE FROM public.config_basic_materials WHERE id = $1;`,
        [basicMaterialId]
      );
      await expect(attempt).rejects.toBeTruthy();
    });
  });
});

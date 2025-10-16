import { Client } from 'pg';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Admin (aplica migrations/seed). Em CI: postgres superuser
const DB_URL_ADMIN = process.env.DATABASE_URL!;

// Usuário sem privilégio (RLS deve aplicar)
const DB_URL_RLS =
  process.env.DATABASE_URL_RLS || 'postgresql://olie_app_user:test@localhost:5432/oliehub';

describe('RLS CONFIGS', () => {
  let admin: Client;
  let user: Client;

  beforeAll(async () => {
    admin = new Client({ connectionString: DB_URL_ADMIN });
    await admin.connect();

    user = new Client({ connectionString: DB_URL_RLS });
    await user.connect();
  });

  afterAll(async () => {
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
});

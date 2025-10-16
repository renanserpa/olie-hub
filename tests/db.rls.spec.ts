import { Client } from 'pg';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const DB_URL = process.env.DATABASE_URL!;

describe('RLS CONFIGS', () => {
  let pg: Client;
  beforeAll(async () => { pg = new Client({ connectionString: DB_URL }); await pg.connect(); });
  afterAll(async () => { await pg.end(); });

  it('SELECT paletas retorna apenas ativas para role não-admin', async () => {
    // Ajuste este SET ROLE ao seu modelo; pode ser substituído por sessão/JWT em PostgREST.
    try { await pg.query(`SET ROLE none_admin;`); } catch {}
    const r = await pg.query(`SELECT name, is_active FROM public.config_color_palettes;`);
    expect(r.rows.find(x => x.is_active === false)).toBeUndefined();
  });
});

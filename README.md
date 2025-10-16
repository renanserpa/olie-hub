# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/bc46e15f-1612-447b-90d7-8694cd7f25ac

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/bc46e15f-1612-447b-90d7-8694cd7f25ac) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/bc46e15f-1612-447b-90d7-8694cd7f25ac) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Security Pack CONFIGS

O módulo de configurações agora conta com tabelas de paletas de cores, texturas de tecido e políticas RLS que garantem acesso somente leitura para itens ativos e escrita restrita a administradores. As novas migrations incluem gatilhos `updated_at`, índices e uma view consolidada `public.config_all_colors` para consultar rapidamente todas as cores disponíveis no catálogo.

### CONFIGS Pack 2

O segundo pacote de configurações adiciona materiais básicos, grupos de suprimentos, embalagens, tipos de vínculos e componentes de customização com opções de componentes relacionados. Todas as tabelas seguem RLS por operação e gatilhos `updated_at`.

### Rodar local

```sh
createdb oliehub || true
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oliehub
psql "$DATABASE_URL" -f db/migrations/2025-10-16_001_configs_core.sql
psql "$DATABASE_URL" -f db/migrations/2025-10-16_002_configs_more.sql
psql "$DATABASE_URL" -f db/seeds/2025-10-16_configs_seeds.sql
psql "$DATABASE_URL" -f db/seeds/2025-10-16_configs_seeds_2.sql
npx vitest run
```

### Testes RLS (local)
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oliehub
export DATABASE_URL_RLS=postgresql://olie_app_user:test@localhost:5432/oliehub

createdb oliehub || true
psql "$DATABASE_URL" -f db/migrations/2025-10-16_001_configs_core.sql
psql "$DATABASE_URL" -f db/migrations/2025-10-16_002_configs_more.sql
psql "$DATABASE_URL" -f db/seeds/2025-10-16_configs_seeds.sql
psql "$DATABASE_URL" -f db/seeds/2025-10-16_configs_seeds_2.sql

npx vitest run
```

O usuário olie_app_user é criado na migration com permissões mínimas de leitura.

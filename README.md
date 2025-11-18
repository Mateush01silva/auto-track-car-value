# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f834b5d2-6b05-4fde-a3da-2f6760b4796a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f834b5d2-6b05-4fde-a3da-2f6760b4796a) and start prompting.

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

## Configuração do Supabase

Este projeto usa Supabase para autenticação. Para garantir que a confirmação de email funcione corretamente, você precisa configurar os redirect URLs no painel do Supabase.

### Configuração de Redirect URLs

1. Acesse o [Painel do Supabase](https://app.supabase.com)
2. Selecione seu projeto (sqnoxtuzoccjstlzekhc)
3. Navegue até **Authentication** → **URL Configuration**
4. Em **Redirect URLs**, adicione as seguintes URLs:
   - URL de produção (ex: `https://seu-dominio.com/*`)
   - URL de staging se houver (ex: `https://staging.seu-dominio.com/*`)
   - `http://localhost:3000/*` (apenas para desenvolvimento local)

### Variáveis de Ambiente

Se você estiver desenvolvendo localmente mas quiser que os emails de confirmação redirecionem para produção, defina a variável `VITE_APP_URL` no seu arquivo `.env`:

```env
VITE_APP_URL="https://seu-dominio-producao.com"
```

Se esta variável não estiver definida, o sistema usará `window.location.origin` automaticamente.

### Troubleshooting

**Problema**: Link de confirmação de email aponta para localhost

**Solução**:
1. Certifique-se de que a URL de produção está configurada nos Redirect URLs do Supabase
2. Se necessário, defina `VITE_APP_URL` no arquivo `.env` com a URL de produção
3. Para usuários que já se registraram, será necessário reenviar o email de confirmação ou criar uma nova conta

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f834b5d2-6b05-4fde-a3da-2f6760b4796a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

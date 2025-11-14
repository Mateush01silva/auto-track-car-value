# Como se tornar Admin no Lovable Cloud

Como seu projeto usa **Lovable Cloud** (não Supabase externo), siga estas instruções:

## Passo 1: Aceitar o Commit no GitHub

1. Vá para: https://github.com/Mateush01silva/auto-track-car-value/pulls
2. Procure pelo Pull Request da branch `claude/review-project-updates-01GXXyiz5AMuieMA8qzzvZQw`
3. Revise e faça **Merge** do PR
4. Aguarde o deploy automático (2-5 minutos)

**OU** se não houver PR aberto:

1. Vá para: https://github.com/Mateush01silva/auto-track-car-value/commits/claude/review-project-updates-01GXXyiz5AMuieMA8qzzvZQw
2. Verifique se o commit "Add admin flag to bypass subscription restrictions" está lá
3. Faça merge da branch para a main se necessário

## Passo 2: Aplicar a Migration no Lovable Cloud

1. Acesse o **Lovable.dev**
2. Abra seu projeto WiseDrive
3. Vá para **Cloud** → **Database** → **Tables**
4. Clique em **SQL Editor** (ou similar)
5. Execute este SQL:

```sql
-- Add is_admin column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
```

## Passo 3: Marcar-se como Admin

No mesmo **SQL Editor** do Lovable Cloud, execute:

```sql
-- Substitua 'seu@email.com' pelo email que você usa para login
UPDATE public.profiles
SET is_admin = true
WHERE email = 'seu@email.com';
```

**Verificar se funcionou:**

```sql
-- Verificar seu status de admin
SELECT email, is_admin, subscription_plan
FROM public.profiles
WHERE email = 'seu@email.com';
```

Você deve ver `is_admin: true`

## Passo 4: Fazer Logout e Login

1. Saia da sua conta no wisedrive.com.br
2. Faça login novamente
3. Pronto! Agora você tem acesso total a todas as funcionalidades

## O que você terá acesso:

✅ Veículos ilimitados
✅ Manutenções ilimitadas
✅ Gerar QR Code
✅ Exportar Excel
✅ Compartilhar links
✅ Todos os recursos Pro sem restrições

## Localização do SQL Editor no Lovable

O SQL Editor fica em uma destas localizações (depende da versão):
- **Cloud** → **Database** → **SQL Query**
- **Cloud** → **SQL Editor**
- **Database** → **Query**

## Troubleshooting

**Problema:** Não encontro o SQL Editor no Lovable
**Solução:** Vá em Cloud → Database → Tables, clique nos 3 pontinhos (...) e procure por "Run SQL" ou "Custom Query"

**Problema:** A migration já foi aplicada automaticamente
**Solução:** Ótimo! Vá direto para o Passo 3 e marque-se como admin

**Problema:** Continua não funcionando após marcar como admin
**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout e login
3. Verifique se o deploy do código foi concluído no Lovable

---

**Importante:** O Lovable Cloud pode aplicar as migrations automaticamente quando você faz deploy. Se a coluna `is_admin` já existir, pode pular o Passo 2!

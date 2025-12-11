# Correção de Problemas de Autenticação no Vybo

Este documento contém as soluções para os problemas de autenticação reportados:
1. Erro "e-mail não confirmado" ao criar nova conta
2. Login com Google não funcionando

---

## Problema 1: E-mail não confirmado

### Causa
O Supabase está configurado para **exigir confirmação de e-mail** antes de permitir login, mas o sistema estava tentando fazer login automático após o signup.

### Solução no Supabase

1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/auth/users
2. Vá em **Authentication** → **Email Templates**
3. Configure o template de confirmação de e-mail

**OU** (Recomendado para MVP/Testes):

1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/auth/providers
2. Vá em **Authentication** → **Providers** → **Email**
3. Desative a opção: **"Confirm email"**
   - Isso permite que usuários façam login imediatamente após criar conta
   - Ideal para MVP e testes
   - Em produção, você pode reativar mais tarde

---

## Problema 2: Login com Google não funciona

### Causa
O Google OAuth não está configurado no Supabase OU a URL de redirect não está autorizada.

### Solução no Supabase

**Passo 1: Configurar Google OAuth Provider**

1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/auth/providers
2. Clique em **Google** na lista de providers
3. **Ative** o Google provider (toggle ON)
4. Você precisará de:
   - **Client ID** do Google
   - **Client Secret** do Google

**Passo 2: Criar credenciais no Google Cloud Console**

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Crie um novo projeto ou selecione um existente
3. Vá em **Credentials** → **Create Credentials** → **OAuth Client ID**
4. Configure:
   - Application type: **Web application**
   - Name: **Vybo**
   - Authorized JavaScript origins:
     ```
     https://www.wisedrive.com.br
     https://sqnoxtuzoccjstlzekhc.supabase.co
     ```
   - Authorized redirect URIs:
     ```
     https://sqnoxtuzoccjstlzekhc.supabase.co/auth/v1/callback
     ```

5. Copie o **Client ID** e **Client Secret**

**Passo 3: Configurar no Supabase**

1. Volte para: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/auth/providers
2. Cole o **Client ID** e **Client Secret** nos campos apropriados
3. Clique em **Save**

**Passo 4: Verificar Redirect URLs**

1. Vá em: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/auth/url-configuration
2. Em **Redirect URLs**, adicione:
   ```
   https://www.wisedrive.com.br/*
   http://localhost:3000/* (para desenvolvimento)
   ```

---

## Verificação Rápida

### Testar criação de conta:
1. Acesse: https://www.wisedrive.com.br/login
2. Vá na aba "Criar Conta"
3. Preencha o formulário
4. Se "Confirm email" estiver desativado, o login deve ser automático ✅

### Testar login com Google:
1. Acesse: https://www.wisedrive.com.br/login
2. Clique no botão "Google"
3. Deve abrir popup do Google para seleção de conta ✅

---

## Configuração Recomendada para MVP

Para facilitar os testes e onboarding inicial:

1. ✅ **Desativar** confirmação de e-mail (pode reativar depois)
2. ✅ **Ativar** Google OAuth (facilita login para usuários)
3. ✅ **Adicionar** URLs de redirect (produção + localhost)

## SQL para Verificar Usuários

Execute no SQL Editor para ver todos os usuários:

```sql
-- Ver todos os usuários e status de confirmação
SELECT
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

Se precisar confirmar manualmente um e-mail:

```sql
-- Confirmar e-mail manualmente
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'email@exemplo.com';
```

---

## Checklist de Configuração

- [ ] Desativar confirmação de e-mail (Auth → Providers → Email)
- [ ] Criar credenciais OAuth no Google Cloud Console
- [ ] Configurar Google provider no Supabase
- [ ] Adicionar redirect URLs no Supabase
- [ ] Testar criação de nova conta
- [ ] Testar login com Google
- [ ] Confirmar manualmente e-mails pendentes (se necessário)

---

**Importante:** Após fazer as configurações no Supabase, aguarde 1-2 minutos para que as alterações sejam aplicadas.

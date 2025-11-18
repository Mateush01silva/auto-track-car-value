# Configuração SIMPLIFICADA do Google Login - WiseDrive

## ⚠️ IMPORTANTE: URLs que você vai usar

Para o WiseDrive funcionar com Google, você precisa dessas **2 URLs EXATAS**:

```
https://www.wisedrive.com.br
https://sqnoxtuzoccjstlzekhc.supabase.co/auth/v1/callback
```

A segunda URL é a **URL de callback do Supabase** - é para onde o Google manda o usuário depois de autenticar.

---

## 📋 Passo a Passo COMPLETO

### PARTE 1: Google Cloud Console

1. **Acesse:** https://console.cloud.google.com/

2. **Criar/Selecionar Projeto:**
   - Se não tem projeto: Clique em "Select a Project" → "New Project"
   - Nome: **WiseDrive**
   - Clique em **Create**

3. **Configurar OAuth Consent Screen:**
   - Menu lateral: **APIs & Services** → **OAuth consent screen**
   - Escolha: **External** (para permitir qualquer usuário do Google)
   - Clique **Create**

   **Preencha:**
   - App name: **WiseDrive**
   - User support email: **seu-email@gmail.com**
   - Developer contact: **seu-email@gmail.com**
   - Clique **Save and Continue** (3 vezes até finalizar)

4. **Criar Credenciais OAuth:**
   - Menu lateral: **APIs & Services** → **Credentials**
   - Clique **+ CREATE CREDENTIALS** → **OAuth client ID**

   **Configure:**
   - Application type: **Web application**
   - Name: **WiseDrive Web Client**

   **Authorized JavaScript origins:**
   ```
   https://www.wisedrive.com.br
   ```

   **Authorized redirect URIs** (COPIE EXATAMENTE):
   ```
   https://sqnoxtuzoccjstlzekhc.supabase.co/auth/v1/callback
   ```

   - Clique **Create**

5. **COPIE as credenciais:**
   - Um popup vai aparecer com:
     - **Client ID** (parece: 123456789-abc.apps.googleusercontent.com)
     - **Client Secret** (parece: GOCSPX-abc123def456)
   - **COPIE E GUARDE ESSES VALORES!**

---

### PARTE 2: Supabase

1. **Acesse:** https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/auth/providers

2. **Configure Google Provider:**
   - Clique em **Google** na lista
   - **Ative** o toggle (deixe verde/ON)

   **Cole os valores que você copiou:**
   - Client ID (OAuth): [COLE O CLIENT ID]
   - Client Secret (OAuth): [COLE O CLIENT SECRET]

   - Clique **Save**

3. **Configurar Redirect URLs do Site:**
   - Vá em: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/auth/url-configuration

   **Site URL:**
   ```
   https://www.wisedrive.com.br
   ```

   **Redirect URLs** (adicione essa linha):
   ```
   https://www.wisedrive.com.br/**
   ```

   - Clique **Save**

---

## ✅ Teste Final

1. Acesse: https://www.wisedrive.com.br/login
2. Clique no botão **Google**
3. Deve abrir popup do Google
4. Selecione sua conta
5. Deve redirecionar para: https://www.wisedrive.com.br/dashboard

---

## 🔧 Se NÃO funcionar:

### Erro 1: "redirect_uri_mismatch"

**Problema:** A URL de redirect não está configurada corretamente no Google.

**Solução:**
1. Volte no Google Console
2. Vá em **Credentials** → Clique no seu OAuth Client
3. Verifique se tem EXATAMENTE:
   ```
   https://sqnoxtuzoccjstlzekhc.supabase.co/auth/v1/callback
   ```
4. Se não tiver, adicione e salve

### Erro 2: Popup abre mas fecha sozinho

**Problema:** Supabase não consegue processar o callback.

**Solução:**
1. Verifique se Client ID e Secret estão corretos no Supabase
2. Verifique se o Google Provider está **ATIVADO** (toggle verde)
3. Aguarde 2-3 minutos após salvar (pode demorar para propagar)

### Erro 3: "Email não confirmado"

**Solução:**
1. Desative confirmação de email: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/auth/providers
2. Clique em **Email** → Desative **"Confirm email"**

---

## 🎯 Checklist Final

Antes de testar, confirme:

- [ ] Projeto criado no Google Cloud Console
- [ ] OAuth Consent Screen configurado
- [ ] Credenciais OAuth criadas
- [ ] JavaScript origins: `https://www.wisedrive.com.br`
- [ ] Redirect URI: `https://sqnoxtuzoccjstlzekhc.supabase.co/auth/v1/callback`
- [ ] Client ID e Secret copiados
- [ ] Google Provider ativado no Supabase
- [ ] Client ID e Secret colados no Supabase
- [ ] Site URL configurado no Supabase
- [ ] Redirect URLs configuradas no Supabase
- [ ] Aguardou 2-3 minutos após salvar

---

## 🆘 Ainda não funciona?

**Opção 1: Teste com incógnito**
- Abra aba anônima
- Teste o login com Google
- Às vezes o cache do navegador causa problemas

**Opção 2: Desative temporariamente**
Se for muito complexo, podemos desativar o login com Google temporariamente e focar apenas no login por email/senha que está funcionando.

---

## 📸 Como verificar se está correto

**No Google Console:**
- Deve ter 1 JavaScript origin
- Deve ter 1 Redirect URI (a do Supabase)

**No Supabase:**
- Google provider deve estar verde/ON
- Deve ter Client ID preenchido
- Deve ter Client Secret preenchido

---

**Dica:** Copie e cole as URLs EXATAMENTE como estão aqui. Qualquer espaço ou caractere diferente vai causar erro!

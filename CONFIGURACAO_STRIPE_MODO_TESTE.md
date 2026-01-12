# 🧪 Configuração Stripe em Modo Teste - Vybo

> **IMPORTANTE**: Este guia configura o Stripe em **MODO TESTE** para evitar cobranças reais.
> Use cartões de teste fornecidos pelo Stripe para simular pagamentos.

---

## 📦 Produtos a Criar no Stripe

Você precisa criar 3 produtos com os seguintes planos:

### 1. Vybo Oficina - Starter
- **Preço**: R$ 114,90/mês
- **Trial**: 14 dias grátis
- **Cancelamento**: 100% reembolso se cancelar
- **Limites**: 100 atendimentos/mês

### 2. Vybo Oficina - Professional
- **Preço**: R$ 219,90/mês
- **Trial**: 14 dias grátis
- **Cancelamento**: 100% reembolso se cancelar
- **Limites**: Ilimitado

### 3. Vybo Proprietário - Pro
- **Preço**: R$ 5,90/mês
- **Trial**: 30 dias grátis
- **Cancelamento**: 100% reembolso se cancelar
- **Limites**: Veículos ilimitados

---

## 🚀 PASSO 1: Acessar Stripe Dashboard em Modo Teste

1. Acesse: https://dashboard.stripe.com/test/dashboard
2. **VERIFIQUE**: No canto superior esquerdo deve aparecer **"Modo de teste"** com um toggle
3. Se não estiver em modo teste, clique no toggle para ativar

![Modo Teste](https://i.imgur.com/example.png)

---

## 🏗️ PASSO 2: Criar os 3 Produtos no Stripe

### Produto 1: Vybo Oficina - Starter

1. Acesse: https://dashboard.stripe.com/test/products
2. Clique em **"+ Adicionar produto"** (ou "+ Add product")
3. Preencha:
   ```
   Nome: Vybo Oficina - Starter
   Descrição: Plano inicial para oficinas com 100 atendimentos/mês

   Modelo de preço: Preço padrão (Standard pricing)
   Preço: 114.90 BRL
   Período de cobrança: Mensal (Monthly)

   ⚠️ IMPORTANTE - Configurar Trial:
   ✅ Marque a opção "Oferecer período de teste"
   ✅ Duração do teste: 14 dias
   ```
4. Clique em **"Salvar produto"**
5. **ANOTE O PRICE ID** (aparece abaixo do preço, formato: `price_xxxxxxxxxxxxx`)

---

### Produto 2: Vybo Oficina - Professional

1. Clique em **"+ Adicionar produto"**
2. Preencha:
   ```
   Nome: Vybo Oficina - Professional
   Descrição: Plano profissional para oficinas com atendimentos ilimitados

   Modelo de preço: Preço padrão
   Preço: 219.90 BRL
   Período de cobrança: Mensal

   ⚠️ IMPORTANTE - Configurar Trial:
   ✅ Marque a opção "Oferecer período de teste"
   ✅ Duração do teste: 14 dias
   ```
3. Clique em **"Salvar produto"**
4. **ANOTE O PRICE ID**

---

### Produto 3: Vybo Proprietário - Pro

1. Clique em **"+ Adicionar produto"**
2. Preencha:
   ```
   Nome: Vybo Proprietário - Pro
   Descrição: Plano profissional para proprietários com veículos ilimitados

   Modelo de preço: Preço padrão
   Preço: 5.90 BRL
   Período de cobrança: Mensal

   ⚠️ IMPORTANTE - Configurar Trial:
   ✅ Marque a opção "Oferecer período de teste"
   ✅ Duração do teste: 30 dias
   ```
3. Clique em **"Salvar produto"**
4. **ANOTE O PRICE ID**

---

## 🔑 PASSO 3: Obter API Keys de Teste

1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Copie as chaves:

```bash
# Publishable key (visível, começa com pk_test_)
PUBLISHABLE_KEY: pk_test_51...

# Secret key (clique em "Reveal test key", começa com sk_test_)
SECRET_KEY: sk_test_51...
```

⚠️ **NUNCA compartilhe a Secret Key publicamente!**

---

## 📝 PASSO 4: Configurar Variáveis de Ambiente Localmente

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione as seguintes variáveis:

```bash
# ====================================
# STRIPE - MODO TESTE
# ====================================

# Chaves da API Stripe (modo teste)
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_SUA_CHAVE_AQUI"
STRIPE_SECRET_KEY="sk_test_SUA_CHAVE_AQUI"

# Price IDs dos produtos (copie do Stripe Dashboard)
VITE_STRIPE_PRICE_WORKSHOP_STARTER="price_XXXX_STARTER"
VITE_STRIPE_PRICE_WORKSHOP_PROFESSIONAL="price_XXXX_PROFESSIONAL"
VITE_STRIPE_PRICE_OWNER_PRO="price_XXXX_OWNER_PRO"

# Webhook Secret (será configurado no passo 7)
STRIPE_WEBHOOK_SECRET="whsec_XXXX"
```

3. Salve o arquivo

---

## ☁️ PASSO 5: Configurar Variáveis no Supabase

As Edge Functions do Supabase precisam acessar as chaves do Stripe.

1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/secrets
2. Adicione as seguintes secrets:

```
STRIPE_SECRET_KEY = sk_test_SUA_CHAVE_AQUI
STRIPE_PUBLISHABLE_KEY = pk_test_SUA_CHAVE_AQUI
STRIPE_WEBHOOK_SECRET = (deixe em branco por enquanto, será preenchido no passo 7)
```

3. Clique em **"Save"**

---

## 🚀 PASSO 6: Deploy das Edge Functions

As Edge Functions processam checkouts e webhooks do Stripe.

### Opção A: Via Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI (se não tiver)
npm install supabase --save-dev

# 2. Login
npx supabase login

# 3. Link com seu projeto
npx supabase link --project-ref sqnoxtuzoccjstlzekhc

# 4. Deploy das funções
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-customer-portal
npx supabase functions deploy stripe-webhook
npx supabase functions deploy check-subscription
```

### Opção B: Via Dashboard do Supabase

1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/functions
2. Para cada função:
   - Clique em **"Deploy new function"**
   - Faça upload dos arquivos da pasta `supabase/functions/[nome-da-funcao]`

---

## 🔗 PASSO 7: Configurar Webhooks do Stripe

Os webhooks sincronizam assinaturas entre Stripe e Supabase.

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"+ Adicionar endpoint"** (ou "+ Add endpoint")
3. Configure:

```
Endpoint URL:
https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook

Descrição:
Webhook para sincronizar assinaturas Vybo

Eventos a escutar:
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ customer.subscription.trial_will_end
✅ invoice.payment_succeeded
✅ invoice.payment_failed
✅ checkout.session.completed
```

4. Clique em **"Adicionar endpoint"**
5. **COPIE O SIGNING SECRET** (começa com `whsec_`)
6. Adicione no Supabase:
   - Volte em: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/secrets
   - Edite `STRIPE_WEBHOOK_SECRET` e cole o valor `whsec_...`
7. Atualize também no arquivo `.env` local

---

## ✅ PASSO 8: Verificar Configuração no Código

Verifique se o arquivo `src/config/stripe.ts` está correto:

```typescript
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',

  prices: {
    workshopStarter: import.meta.env.VITE_STRIPE_PRICE_WORKSHOP_STARTER || '',
    workshopProfessional: import.meta.env.VITE_STRIPE_PRICE_WORKSHOP_PROFESSIONAL || '',
    ownerPro: import.meta.env.VITE_STRIPE_PRICE_OWNER_PRO || '',
  },

  plans: {
    workshopStarter: {
      id: 'workshop_starter',
      trialDays: 14,  // ✅ 14 dias
      price: 114.90,
      // ...
    },
    workshopProfessional: {
      id: 'workshop_professional',
      trialDays: 14,  // ✅ 14 dias
      price: 219.90,
      // ...
    },
    ownerPro: {
      id: 'owner_pro',
      trialDays: 30,  // ✅ 30 dias
      price: 5.90,
      // ...
    },
  },
};
```

---

## 🧪 PASSO 9: Testar Pagamentos com Cartões de Teste

### Cartões de Teste do Stripe

Use estes dados para simular pagamentos:

#### ✅ Pagamento Bem-Sucedido
```
Número: 4242 4242 4242 4242
Data: Qualquer data futura (ex: 12/30)
CVV: Qualquer 3 dígitos (ex: 123)
CEP: Qualquer (ex: 01310-100)
Nome: Qualquer nome
```

#### ❌ Cartão Recusado
```
Número: 4000 0000 0000 0002
```

#### ⏳ Requer Autenticação 3D Secure
```
Número: 4000 0027 6000 3184
```

#### 💳 Outros cartões de teste:
- Visa: 4242 4242 4242 4242
- Mastercard: 5555 5555 5555 4444
- Amex: 3782 822463 10005

Mais cartões: https://stripe.com/docs/testing

---

## 🎯 PASSO 10: Fluxo de Teste Completo

### Teste 1: Assinatura de Oficina Starter

1. Acesse: https://www.vybo.com.br
2. Registre-se como **Oficina**
3. No dashboard, tente criar mais de 10 atendimentos (limite free)
4. Deve aparecer modal de upgrade
5. Escolha **"Plano Starter"**
6. Clique em **"Assinar"**
7. Deve abrir Stripe Checkout
8. Use cartão de teste: `4242 4242 4242 4242`
9. Complete o pagamento
10. Verifique:
    - Redirecionamento para dashboard
    - Banner: "Você está em período de teste (14 dias restantes)"
    - Consegue criar até 100 atendimentos/mês

### Teste 2: Assinatura de Proprietário Pro

1. Acesse: https://www.vybo.com.br
2. Registre-se como **Proprietário**
3. Adicione 1 veículo (limite free)
4. Tente adicionar um segundo veículo
5. Deve aparecer modal de upgrade para **"Plano Pro"**
6. Clique em **"Assinar por R$ 5,90/mês"**
7. Use cartão de teste
8. Complete o pagamento
9. Verifique:
    - Banner: "Você está em período de teste (30 dias restantes)"
    - Consegue adicionar veículos ilimitados

### Teste 3: Gerenciamento de Assinatura

1. Após assinar, vá em **"Configurações"** ou **"Minha Assinatura"**
2. Clique em **"Gerenciar Assinatura"**
3. Deve abrir o Stripe Customer Portal
4. Teste:
   - Atualizar forma de pagamento
   - Ver próxima cobrança
   - Cancelar assinatura
   - Ver histórico de faturas

---

## 🔍 PASSO 11: Verificar Dados no Supabase

Execute estas queries para confirmar que está tudo funcionando:

```sql
-- 1. Ver todas as assinaturas criadas
SELECT
  id,
  user_id,
  plan_id,
  status,
  trial_end,
  current_period_end,
  monthly_usage
FROM subscriptions
ORDER BY created_at DESC;

-- 2. Ver detalhes de um usuário específico
SELECT
  p.email,
  p.role,
  s.plan_id,
  s.status,
  s.trial_end,
  s.stripe_customer_id
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.email = 'SEU_EMAIL@gmail.com';

-- 3. Verificar limites de uso
SELECT
  plan_id,
  monthly_usage,
  usage_reset_at,
  status
FROM subscriptions
WHERE status IN ('active', 'trialing');
```

---

## 🎨 PASSO 12: Verificar Travas de Funcionalidades

### Funcionalidades por Plano

#### 🆓 Free (Oficinas)
- ✅ 10 atendimentos/mês
- ✅ Dashboard básico
- ❌ Sem busca por placa
- ❌ Sem Oportunidades
- ❌ Sem CRM

#### 💼 Workshop Starter (R$ 114,90/mês)
- ✅ 100 atendimentos/mês
- ✅ Busca por placa
- ✅ Notificações
- ❌ Sem Oportunidades
- ❌ Sem Score de Fidelidade

#### 🚀 Workshop Professional (R$ 219,90/mês)
- ✅ Atendimentos ilimitados
- ✅ Busca por placa
- ✅ Oportunidades de Negócio
- ✅ Score de Fidelidade
- ✅ CRM Avançado
- ✅ Análises e Relatórios

#### 🆓 Free (Proprietários)
- ✅ 1 veículo
- ✅ Histórico básico
- ❌ Sem alertas inteligentes

#### ⭐ Owner Pro (R$ 5,90/mês)
- ✅ Veículos ilimitados
- ✅ Alertas inteligentes
- ✅ Relatórios profissionais
- ✅ Compartilhamento QR Code
- ✅ Suporte prioritário

### Como Verificar as Travas

Execute este script SQL para conferir se as travas estão funcionando:

```sql
-- Verificar se função de limite está funcionando
SELECT can_create_more(
  'user-id-aqui',  -- Substitua pelo ID de um usuário teste
  'workshop'        -- ou 'owner'
);

-- Resultado esperado:
-- Se no limite: { "allowed": false, "reason": "Limite atingido" }
-- Se pode criar: { "allowed": true }
```

---

## 🚨 Troubleshooting

### Erro: "Failed to send request to edge function"

**Causa**: Edge Functions não deployadas

**Solução**:
```bash
npx supabase functions deploy create-checkout-session
```

---

### Erro: "No such price: price_xxxxx"

**Causa**: Price IDs incorretos ou não configurados

**Solução**:
1. Verifique os Price IDs no Stripe: https://dashboard.stripe.com/test/products
2. Atualize o `.env`:
   ```bash
   VITE_STRIPE_PRICE_WORKSHOP_STARTER="price_CORRETO"
   ```
3. Reinicie o servidor: `npm run dev`

---

### Erro: "Invalid API Key provided"

**Causa**: STRIPE_SECRET_KEY não configurada no Supabase

**Solução**:
1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/secrets
2. Adicione: `STRIPE_SECRET_KEY = sk_test_...`
3. Redeploy das functions:
   ```bash
   npx supabase functions deploy create-checkout-session
   ```

---

### Checkout funciona mas assinatura não aparece no Supabase

**Causa**: Webhooks não configurados ou com secret incorreto

**Solução**:
1. Verifique: https://dashboard.stripe.com/test/webhooks
2. Teste o webhook clicando em "Send test webhook"
3. Veja os logs em: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/functions

---

### Trial não está sendo aplicado

**Causa**: Trial não configurado no produto do Stripe

**Solução**:
1. Acesse: https://dashboard.stripe.com/test/products
2. Clique no produto
3. Edite o preço
4. Marque "Oferecer período de teste"
5. Configure os dias (14 ou 30)

---

## 📋 Checklist Final

Antes de considerar a configuração completa, verifique:

- [ ] Stripe Dashboard em **modo teste** ativado
- [ ] 3 produtos criados no Stripe:
  - [ ] Vybo Oficina - Starter (R$ 114,90) - 14 dias trial
  - [ ] Vybo Oficina - Professional (R$ 219,90) - 14 dias trial
  - [ ] Vybo Proprietário - Pro (R$ 5,90) - 30 dias trial
- [ ] Price IDs anotados para os 3 produtos
- [ ] API Keys de teste obtidas (pk_test_ e sk_test_)
- [ ] Variáveis no `.env` local configuradas
- [ ] Variáveis no Supabase configuradas
- [ ] Edge Functions deployadas com sucesso
- [ ] Webhook configurado no Stripe
- [ ] Signing secret do webhook adicionado
- [ ] Teste com cartão 4242... funcionando
- [ ] Assinatura aparecendo no Supabase após pagamento
- [ ] Limites de plano sendo respeitados
- [ ] Trial de 14/30 dias funcionando

---

## 🎓 Política de Reembolso 100%

Para implementar o **cancelamento com 100% de reembolso**, você precisa:

### No Stripe Dashboard:

1. Acesse: https://dashboard.stripe.com/test/settings/billing/automatic
2. Configure:
   ```
   Cobranças e reembolsos:
   ✅ Permitir reembolsos até X dias após cobrança
   ✅ Reembolso automático ao cancelar durante trial
   ```

### No Customer Portal (onde clientes gerenciam assinatura):

1. Acesse: https://dashboard.stripe.com/test/settings/billing/portal
2. Configure:
   ```
   Cancelamento:
   ✅ Permitir cancelamento imediato
   ✅ Reembolso proporcional (proration)
   ✅ Oferecer reembolso total se cancelar em até 7 dias
   ```

### No Código (para automação):

Se quiser automatizar reembolsos, adicione esta lógica na Edge Function `stripe-webhook`:

```typescript
// Quando usuário cancela durante trial
if (event.type === 'customer.subscription.deleted') {
  const subscription = event.data.object;

  // Se cancelou durante trial, não cobra nada
  if (subscription.status === 'trialing') {
    // Nada a reembolsar, trial é grátis
    return;
  }

  // Se cancelou nos primeiros 14/30 dias, reembolsar 100%
  const daysSinceStart = daysBetween(
    subscription.current_period_start,
    new Date()
  );

  if (daysSinceStart <= subscription.trial_period_days) {
    // Processar reembolso 100%
    await stripe.refunds.create({
      charge: latestCharge.id,
      reason: 'requested_by_customer',
    });
  }
}
```

---

## 🔄 Como Migrar para Produção (Depois)

Quando estiver tudo testado e funcionando, migre para produção:

### 1. Criar Produtos em Modo Live

1. No Stripe Dashboard, desative "Modo de teste"
2. Crie os 3 produtos novamente (mesmos dados)
3. Anote os novos Price IDs (agora começam com `price_live_...`)

### 2. Obter API Keys de Produção

1. Acesse: https://dashboard.stripe.com/apikeys
2. Copie as chaves LIVE (começam com `pk_live_` e `sk_live_`)

### 3. Atualizar Variáveis de Ambiente

```bash
# Troque de _test_ para _live_
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
VITE_STRIPE_PRICE_WORKSHOP_STARTER="price_live_..."
# ... (atualize todos)
```

### 4. Configurar Webhook de Produção

1. Crie novo webhook em: https://dashboard.stripe.com/webhooks
2. Use a mesma URL: `https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook`
3. Copie o novo signing secret
4. Atualize `STRIPE_WEBHOOK_SECRET`

### 5. Testar com Cartão Real

⚠️ **CUIDADO**: Agora cobrará de verdade!

Use um cartão real para um teste final, depois cancele e peça reembolso.

---

## 📞 Suporte

Se tiver dúvidas ou problemas:

1. **Logs do Stripe**: https://dashboard.stripe.com/test/logs
2. **Logs Supabase**: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/logs/edge-functions
3. **Documentação Stripe**: https://stripe.com/docs
4. **Documentação Supabase**: https://supabase.com/docs

---

**Pronto! Agora você pode testar pagamentos sem medo de cobranças reais! 🎉**

Use o cartão `4242 4242 4242 4242` à vontade para simular pagamentos.

# Guia de Deploy das Edge Functions do Stripe

Este guia mostra como fazer deploy das Edge Functions do Stripe no Supabase.

## Pré-requisitos

1. Supabase CLI instalado ([Instruções de instalação](https://supabase.com/docs/guides/cli))
2. Projeto Supabase configurado
3. Stripe Secret Key configurada

## Edge Functions Criadas

### 1. create-checkout-session
Cria uma sessão de checkout do Stripe para iniciar o processo de pagamento.

**Localização:** `supabase/functions/create-checkout-session/index.ts`

### 2. create-customer-portal
Cria uma sessão do portal do cliente Stripe para gerenciar assinaturas.

**Localização:** `supabase/functions/create-customer-portal/index.ts`

## Passos para Deploy

### 1. Login no Supabase CLI

```bash
supabase login
```

### 2. Link ao projeto Supabase

```bash
supabase link --project-ref SEU_PROJECT_REF
```

> **Nota:** Você encontra o `PROJECT_REF` na URL do seu projeto Supabase Dashboard:
> `https://app.supabase.com/project/[PROJECT_REF]`

### 3. Configure as variáveis de ambiente

Você precisa configurar a `STRIPE_SECRET_KEY` no Supabase:

```bash
# Via CLI (recomendado)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# OU via Dashboard:
# 1. Acesse: Settings > Edge Functions > Add secret
# 2. Nome: STRIPE_SECRET_KEY
# 3. Valor: sua chave secreta do Stripe (começa com sk_test_ ou sk_live_)
```

### 4. Deploy das Edge Functions

```bash
# Deploy da função de checkout
supabase functions deploy create-checkout-session

# Deploy da função de portal do cliente
supabase functions deploy create-customer-portal
```

### 5. Verifique o deploy

Após o deploy, você verá as URLs das funções:

```
create-checkout-session: https://[PROJECT_REF].supabase.co/functions/v1/create-checkout-session
create-customer-portal: https://[PROJECT_REF].supabase.co/functions/v1/create-customer-portal
```

## Testando as Edge Functions

### Testar create-checkout-session

```bash
curl -i --location --request POST \
  'https://[PROJECT_REF].supabase.co/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer [ANON_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{
    "priceId": "price_xxx",
    "userId": "user-id",
    "userEmail": "user@example.com",
    "planId": "workshop_starter"
  }'
```

### Testar create-customer-portal

```bash
curl -i --location --request POST \
  'https://[PROJECT_REF].supabase.co/functions/v1/create-customer-portal' \
  --header 'Authorization: Bearer [ANON_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "user-id"
  }'
```

## Variáveis de Ambiente Necessárias

As Edge Functions já estão configuradas para usar automaticamente estas variáveis:

- `STRIPE_SECRET_KEY` - Configurada por você (passo 3)
- `SUPABASE_URL` - Automaticamente disponível
- `SUPABASE_SERVICE_ROLE_KEY` - Automaticamente disponível

## Troubleshooting

### Erro: "Missing STRIPE_SECRET_KEY"

**Solução:** Configure a secret conforme o passo 3 acima.

### Erro: "No Stripe customer found"

**Solução:** Certifique-se de que o usuário já tem um registro na tabela `subscriptions` com `stripe_customer_id`.

### Erro de CORS

**Solução:** As Edge Functions já incluem CORS headers. Se ainda tiver problemas:
1. Verifique se o origin está correto
2. Confirme que está fazendo requisições do domínio permitido

## Deploy em Produção

Quando estiver pronto para produção:

1. Substitua `STRIPE_SECRET_KEY` pela chave de produção:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   ```

2. Atualize as variáveis de ambiente do frontend:
   - `VITE_STRIPE_PUBLISHABLE_KEY` → pk_live_...
   - `VITE_STRIPE_PRICE_WORKSHOP_STARTER` → price_id de produção
   - `VITE_STRIPE_PRICE_WORKSHOP_PROFESSIONAL` → price_id de produção
   - `VITE_STRIPE_PRICE_OWNER_PRO` → price_id de produção

3. Configure webhooks do Stripe apontando para:
   ```
   https://[PROJECT_REF].supabase.co/functions/v1/stripe-webhook
   ```

## Comandos Úteis

```bash
# Ver logs das funções
supabase functions logs create-checkout-session
supabase functions logs create-customer-portal

# Listar todas as funções
supabase functions list

# Deletar uma função (se necessário)
supabase functions delete create-checkout-session

# Ver secrets configuradas
supabase secrets list
```

## Estrutura das Tabelas Necessárias

Certifique-se de que a tabela `subscriptions` existe no Supabase:

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  monthly_usage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

## Próximos Passos

Após o deploy:

1. Configure o Stripe Webhook para sincronizar status das assinaturas
2. Teste o fluxo completo de checkout
3. Verifique se os dados estão sendo salvos corretamente na tabela `subscriptions`
4. Implemente feature gating baseado em `plan_id` e `status`

## Suporte

Para mais informações:
- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentação Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Documentação Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

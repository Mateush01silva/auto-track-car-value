# 🚀 Passo a Passo: Criar Edge Function no Supabase Dashboard

## ✅ Pré-requisitos

- [x] Produtos criados no Stripe ✓
- [x] Price IDs copiados ✓
- [ ] Migração SQL executada (vamos corrigir agora)
- [ ] Edge Function criada (este guia)
- [ ] Webhook configurado no Stripe (depois)

---

## 📝 Passo 2: Rodar Migração SQL (CORRIGIDA)

### Instruções:

1. **Abra o Supabase SQL Editor**:
   - Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/sql/new

2. **Copie o SQL atualizado**:
   - Arquivo corrigido: `supabase/migrations/20251229000001_create_subscriptions_table.sql`
   - **Faça git pull** para pegar a versão corrigida (sem `p.role`)

3. **Cole e Execute**:
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em **Run** (ou Ctrl+Enter)

4. **Verifique se funcionou**:
   ```sql
   -- Deve retornar a tabela
   SELECT * FROM subscriptions LIMIT 1;

   -- Deve retornar as funções
   SELECT proname FROM pg_proc WHERE proname LIKE '%monthly_usage%';
   ```

5. **Se der erro novamente**:
   - Me mande o erro completo
   - Pode ser que precise adicionar mais correções

---

## 🔧 Passo 3: Criar Edge Function no Dashboard

### Opção: Via Supabase Dashboard (Recomendado para você)

#### 3.1. Acessar Functions

1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/functions
2. Clique em **"Deploy a new Edge Function"** ou **"Create a new function"**

#### 3.2. Criar a Function

**Nome da Function**: `stripe-webhook`

**Código** (copie o conteúdo abaixo):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Processing event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription)
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    })
  }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.user_id

  if (!userId || !subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await upsertSubscription(userId, subscription, customerId)
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (data) await upsertSubscription(data.user_id, subscription, customerId)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (data) await upsertSubscription(data.user_id, subscription, customerId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      plan_id: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function upsertSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  customerId: string
) {
  const priceId = subscription.items.data[0]?.price.id
  const planId = mapPriceIdToPlanId(priceId)

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan_id: planId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    usage_reset_at: new Date(subscription.current_period_end * 1000).toISOString(),
  }, { onConflict: 'user_id' })
}

function mapPriceIdToPlanId(priceId: string): string {
  const map: Record<string, string> = {
    [Deno.env.get('STRIPE_PRICE_WORKSHOP_STARTER') || '']: 'workshop_starter',
    [Deno.env.get('STRIPE_PRICE_WORKSHOP_PROFESSIONAL') || '']: 'workshop_professional',
    [Deno.env.get('STRIPE_PRICE_OWNER_PRO') || '']: 'owner_pro',
  }
  return map[priceId] || 'free'
}
```

#### 3.3. Configurar Variáveis de Ambiente

**ANTES de fazer deploy**, configure as variáveis:

1. Vá em: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/functions

2. Clique em **"Add new secret"** e adicione:

```
Nome: STRIPE_SECRET_KEY
Valor: sk_test_... (sua chave secreta do Stripe)

Nome: STRIPE_PRICE_WORKSHOP_STARTER
Valor: price_... (Price ID que você copiou)

Nome: STRIPE_PRICE_WORKSHOP_PROFESSIONAL
Valor: price_... (Price ID que você copiou)

Nome: STRIPE_PRICE_OWNER_PRO
Valor: price_... (Price ID que você copiou)

Nome: STRIPE_WEBHOOK_SECRET
Valor: whsec_... (você vai pegar isso no Passo 4, pode deixar vazio por enquanto)
```

#### 3.4. Fazer Deploy

1. Após colar o código e configurar variáveis, clique **"Deploy"**
2. Aguarde o deploy completar
3. Anote a URL da function que será:
   ```
   https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook
   ```

#### 3.5. Testar se Funcionou

1. Acesse a aba **"Logs"** da function
2. Faça uma requisição de teste (pode ser via Postman):
   ```
   GET https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook
   ```
3. Deve aparecer "No signature" nos logs (está funcionando!)

---

## 📌 Passo 4: Configurar Webhook no Stripe

**Agora sim!** Após criar a Edge Function, configure o webhook:

### 4.1. Criar Webhook Endpoint

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique **"+ Add endpoint"**
3. **Endpoint URL**:
   ```
   https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook
   ```

### 4.2. Selecionar Eventos

Marque estes eventos:

- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`

### 4.3. Copiar Webhook Secret

1. Após criar o endpoint, clique nele
2. Vá em **"Signing secret"**
3. Clique **"Click to reveal"**
4. **Copie o secret** (formato: `whsec_...`)

### 4.4. Adicionar Secret no Supabase

1. Volte em: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/functions
2. Edite a variável `STRIPE_WEBHOOK_SECRET`
3. Cole o valor que você copiou (`whsec_...`)
4. Salve

---

## 🧪 Passo 5: Testar Tudo Junto

### Teste com Stripe CLI (Opcional mas recomendado)

```bash
stripe listen --forward-to https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook
```

### Teste Real (Simular Pagamento)

1. Crie um checkout de teste (você vai implementar isso depois)
2. Use cartão de teste:
   ```
   Número: 4242 4242 4242 4242
   Validade: 12/25
   CVC: 123
   ```
3. Complete o pagamento
4. Verifique:
   - ✅ Logs da Edge Function (evento recebido)
   - ✅ Tabela `subscriptions` (registro criado/atualizado)
   - ✅ Trial de 14 dias aplicado

---

## ✅ Checklist Final

- [ ] Git pull para pegar SQL corrigido
- [ ] Rodar migração SQL no Supabase (sem erro de `role`)
- [ ] Verificar tabela `subscriptions` criada
- [ ] Criar Edge Function `stripe-webhook` no Dashboard
- [ ] Configurar variáveis de ambiente (exceto WEBHOOK_SECRET por enquanto)
- [ ] Deploy da function
- [ ] Criar webhook endpoint no Stripe
- [ ] Copiar webhook secret (whsec_...)
- [ ] Adicionar webhook secret nas variáveis do Supabase
- [ ] Testar com pagamento simulado

---

## 🐛 Se der erro...

**Edge Function não deploya:**
- Verifique se todas as variáveis de ambiente foram adicionadas
- Verifique se não há erros de sintaxe no código

**Webhook não funciona:**
- Verifique URL do endpoint (sem erros de digitação)
- Verifique se STRIPE_WEBHOOK_SECRET está configurado
- Veja logs da Edge Function para detalhes do erro

**Migração SQL falha:**
- Me mande o erro completo
- Posso criar versão mais simples se necessário

---

Me avise quando completar cada passo! 🚀

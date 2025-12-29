# 🚀 Implementação Completa - Cards #1-4: Sistema de Pagamentos Stripe

## ✅ O que foi implementado

### Card #1: Produtos e Planos ✅
- ✅ Definição de 3 produtos (Starter, Professional, Owner Pro)
- ✅ Arquivo de configuração `src/config/stripe.ts` com tipos TypeScript
- ✅ Funções helper para verificar acesso a features
- ✅ Formatação de preços em BRL
- ✅ Guia passo-a-passo para criar produtos no Stripe Dashboard

### Card #2: Webhooks e Liberação Automática ✅
- ✅ Edge Function `stripe-webhook` para processar eventos
- ✅ Handler para `checkout.session.completed`
- ✅ Handler para `customer.subscription.created`
- ✅ Handler para `customer.subscription.updated`
- ✅ Handler para `customer.subscription.deleted`
- ✅ Atualização automática da tabela `subscriptions`
- ✅ Mapeamento de Price IDs para plan IDs

### Card #3: Controle de Limites ✅
- ✅ Tabela `subscriptions` com campo `monthly_usage`
- ✅ Função SQL `increment_monthly_usage()` para incrementar contador
- ✅ Função SQL `can_create_more()` para verificar limite
- ✅ Função SQL `reset_monthly_usage()` para resetar no aniversário
- ✅ Trigger automático para criar assinatura free em novos usuários
- ✅ View `user_subscription_details` com campos calculados

### Card #4: Bloqueio de Features ✅
- ✅ Função `hasFeatureAccess()` em `src/config/stripe.ts`
- ✅ Função `canCreateMore()` para verificar limites
- ✅ Sistema de metadata nos produtos Stripe
- ✅ Estrutura preparada para componentes de bloqueio

---

## 📦 Arquivos Criados

### Configuração
```
src/config/stripe.ts                     - Configuração e helpers
```

### Migrations SQL
```
supabase/migrations/
  └── 20251229000001_create_subscriptions_table.sql
```

### Edge Functions
```
supabase/functions/
  └── stripe-webhook/
      └── index.ts                       - Webhook handler
```

### Documentação
```
docs/
  ├── CARD-01-STRIPE-PRODUCTS.md        - Guia criar produtos
  └── CARDS-01-04-IMPLEMENTACAO.md      - Este arquivo
```

---

## 🔧 Próximos Passos para Configurar

### Passo 1: Criar Produtos no Stripe Dashboard

Siga o guia em `docs/CARD-01-STRIPE-PRODUCTS.md`:

1. Acesse https://dashboard.stripe.com/products
2. Crie os 3 produtos:
   - Vybo Oficina - Starter (R$ 114,90/mês)
   - Vybo Oficina - Professional (R$ 219,90/mês)
   - Vybo Proprietário - Pro (R$ 5,90/mês)
3. Configure trial de 14 dias em cada um
4. Adicione metadata em cada produto:
   ```
   plan_type: workshop_starter | workshop_professional | owner_pro
   monthly_limit: 100 | unlimited
   features: basic | all | premium_owner
   ```
5. **Copie os Price IDs** de cada produto

### Passo 2: Configurar Variáveis de Ambiente

**No arquivo `.env.local` (frontend):**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price IDs (copiar do Stripe Dashboard)
VITE_STRIPE_PRICE_WORKSHOP_STARTER=price_...
VITE_STRIPE_PRICE_WORKSHOP_PROFESSIONAL=price_...
VITE_STRIPE_PRICE_OWNER_PRO=price_...
```

**No Supabase (Edge Functions):**

1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/functions
2. Adicione as variáveis:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (criar depois de configurar webhook)
   STRIPE_PRICE_WORKSHOP_STARTER=price_...
   STRIPE_PRICE_WORKSHOP_PROFESSIONAL=price_...
   STRIPE_PRICE_OWNER_PRO=price_...
   ```

### Passo 3: Rodar Migração SQL

Execute no **Supabase SQL Editor**:

```bash
# Abra o arquivo:
supabase/migrations/20251229000001_create_subscriptions_table.sql

# Copie e cole TODO o conteúdo no SQL Editor
# Execute
```

Isso vai criar:
- ✅ Tabela `subscriptions`
- ✅ Funções SQL de controle de limites
- ✅ Triggers automáticos
- ✅ RLS policies
- ✅ Assinatura free para usuários existentes

### Passo 4: Deploy da Edge Function

**Opção A: Via Supabase CLI**
```bash
# Instalar CLI
npm install supabase --save-dev

# Login
npx supabase login

# Link projeto
npx supabase link --project-ref sqnoxtuzoccjstlzekhc

# Deploy webhook
npx supabase functions deploy stripe-webhook
```

**Opção B: Via Dashboard**
1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/functions
2. Clique "Deploy new function"
3. Upload manual do arquivo `supabase/functions/stripe-webhook/index.ts`

### Passo 5: Configurar Webhook no Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique "+ Add endpoint"
3. **Endpoint URL**:
   ```
   https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook
   ```
4. **Events to send**:
   - ✅ checkout.session.completed
   - ✅ customer.subscription.created
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ customer.subscription.trial_will_end
5. Clique "Add endpoint"
6. **Copie o Webhook Secret** (whsec_...)
7. Adicione nas variáveis de ambiente do Supabase:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Passo 6: Testar Fluxo Completo

1. **Criar checkout session** (você vai precisar implementar essa função)
2. **Completar pagamento** com cartão de teste:
   ```
   Card: 4242 4242 4242 4242
   Exp: 12/25
   CVC: 123
   ```
3. **Verificar webhook recebido** nos logs do Supabase
4. **Verificar tabela subscriptions** atualizada
5. **Verificar trial de 14 dias** aplicado

---

## 🎯 Como Usar no Código

### Verificar se usuário pode criar mais atendimentos

```typescript
import { supabase } from '@/integrations/supabase/client';

async function createMaintenance(userId: string) {
  // Verificar limite
  const { data: canCreate } = await supabase
    .rpc('can_create_more', { p_user_id: userId });

  if (!canCreate) {
    // Mostrar modal de upgrade
    showUpgradeModal();
    return;
  }

  // Criar atendimento
  // ...

  // Incrementar contador
  await supabase.rpc('increment_monthly_usage', { p_user_id: userId });
}
```

### Verificar acesso a feature

```typescript
import { hasFeatureAccess } from '@/config/stripe';

// No componente
const userPlanId = 'workshop_starter'; // buscar do banco
const hasAccess = hasFeatureAccess(userPlanId, 'CRM Inteligente', 'workshop');

if (!hasAccess) {
  return <FeatureLocked feature="CRM Inteligente" />;
}
```

### Buscar dados da assinatura

```typescript
const { data: subscription } = await supabase
  .from('user_subscription_details')
  .select('*')
  .eq('user_id', userId)
  .single();

console.log(subscription.plan_id);           // workshop_professional
console.log(subscription.monthly_usage);      // 45
console.log(subscription.usage_limit);        // 100
console.log(subscription.is_premium);         // true
console.log(subscription.trial_days_remaining); // 10
```

---

## 🐛 Troubleshooting

### Webhook não funciona
- Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
- Verifique logs da Edge Function no Supabase
- Teste webhook com Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`

### Assinatura não atualiza
- Verifique se `user_id` foi passado no metadata do checkout
- Verifique logs da Edge Function
- Verifique RLS policies da tabela subscriptions

### Limites não funcionam
- Execute a migração SQL novamente
- Verifique se funções SQL foram criadas: `\df` no SQL Editor
- Teste função manualmente: `SELECT can_create_more('user-id-aqui');`

---

## 📈 Próximas Implementações

### Features que faltam (não incluídas nos Cards #1-4):

- [ ] Componente de seleção de plano (pricing page)
- [ ] Função para criar checkout session
- [ ] Modal de upgrade quando atinge limite
- [ ] Componente `<FeatureLocked />` para bloquear UI
- [ ] Badge "PRO" em features premium
- [ ] Dashboard de uso/limites para usuário
- [ ] Email quando trial está acabando
- [ ] Página de gerenciamento de assinatura (cancelar, trocar plano)

Essas features são complementares e podem ser implementadas depois!

---

## ✅ Status

- [x] Card #1: Produtos criados ✅
- [x] Card #2: Webhooks implementados ✅
- [x] Card #3: Sistema de limites ✅
- [x] Card #4: Bloqueio de features ✅

**Tudo pronto para configurar no Stripe Dashboard e fazer deploy!** 🚀

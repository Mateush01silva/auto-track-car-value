# Guia Completo de Configuração do Stripe - Vybo

## 🔴 Problema Atual

Erro ao clicar em "Comprar Plano Pro":
- **"Erro ao processar upgrade"**
- **"failed to send a request to the edge function"**

**Causa**: As Edge Functions do Supabase não foram deployadas OU as variáveis de ambiente do Stripe não estão configuradas.

---

## 📋 Passo a Passo Completo

### PARTE 1: Configurar Produtos no Stripe

1. **Acesse o Stripe Dashboard:**
   - https://dashboard.stripe.com/

2. **Criar Produto "Vybo Pro":**
   - Menu: **Products** → **+ Add Product**
   - Name: **Vybo Pro**
   - Description: **Plano profissional com recursos ilimitados**

3. **Criar Preço Mensal:**
   - Pricing model: **Standard pricing**
   - Price: **19.90 BRL**
   - Billing period: **Monthly**
   - Clique **Save product**
   - **COPIE O PRICE ID** (formato: `price_xxxxx`)

4. **Criar Preço Anual:**
   - No mesmo produto, clique **+ Add another price**
   - Price: **199.00 BRL**
   - Billing period: **Yearly**
   - Clique **Save**
   - **COPIE O PRICE ID** (formato: `price_xxxxx`)

---

### PARTE 2: Obter API Keys do Stripe

1. **Acesse:** https://dashboard.stripe.com/apikeys

2. **Copie as Chaves:**
   - **Publishable key** (começa com `pk_test_` ou `pk_live_`)
   - **Secret key** (começa com `sk_test_` ou `sk_live_`) - **Clique em "Reveal test key"**

3. **Anote os Price IDs:**
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   PRICE_ID_MONTHLY=price_...
   PRICE_ID_YEARLY=price_...
   ```

---

### PARTE 3: Deploy das Edge Functions no Supabase

**Opção A: Via Supabase CLI (Recomendado)**

1. **Instalar Supabase CLI:**
   ```bash
   npm install supabase --save-dev
   ```

2. **Login no Supabase:**
   ```bash
   npx supabase login
   ```

3. **Link com o projeto:**
   ```bash
   npx supabase link --project-ref sqnoxtuzoccjstlzekhc
   ```

4. **Deploy das functions:**
   ```bash
   npx supabase functions deploy create-checkout
   npx supabase functions deploy check-subscription
   ```

**Opção B: Via Dashboard do Supabase**

1. Acesse: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/functions
2. Clique em **Deploy new function**
3. Faça upload manual de cada função

---

### PARTE 4: Configurar Variáveis de Ambiente no Supabase

1. **Acesse:** https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/functions

2. **Adicione as seguintes variáveis:**
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. **Clique em Save**

---

### PARTE 5: Atualizar Price IDs no Código

Edite o arquivo `src/components/UpgradeDialog.tsx` linha 20-22:

```typescript
const priceId = plan === "monthly"
  ? "price_SEU_PRICE_ID_MENSAL"  // Substitua aqui
  : "price_SEU_PRICE_ID_ANUAL";   // Substitua aqui
```

---

### PARTE 6: Configurar Webhooks do Stripe (Para sincronizar assinaturas)

1. **Acesse:** https://dashboard.stripe.com/webhooks

2. **Clique em "Add endpoint"**

3. **Configure:**
   - Endpoint URL:
     ```
     https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook
     ```
   - Events to send:
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`

4. **Copie o "Signing secret"** (começa com `whsec_`)

5. **Adicione no Supabase:**
   - Volte em: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/functions
   - Adicione variável:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```

---

## 🧪 Como Testar

### Teste Básico:

1. Acesse: https://www.wisedrive.com.br/dashboard
2. Tente adicionar mais de 1 veículo OU mais de 3 manutenções
3. Deve aparecer o dialog de upgrade
4. Clique em **"Assinar Mensal"**
5. Deve abrir o Stripe Checkout em uma nova aba ✅

### Teste de Pagamento (Modo Test):

Use estes dados de teste do Stripe:
- **Cartão:** 4242 4242 4242 4242
- **Data:** Qualquer data futura
- **CVV:** Qualquer 3 dígitos
- **CEP:** Qualquer

### Verificar se funcionou:

1. Após completar pagamento no Stripe, volte para o Dashboard
2. Deve redirecionar para: `https://www.wisedrive.com.br/dashboard?checkout=success`
3. Verifique no Supabase se o usuário foi atualizado:
   ```sql
   SELECT email, subscription_plan, subscription_status
   FROM profiles
   WHERE email = 'seu-email@gmail.com';
   ```

---

## 🔧 Troubleshooting

### Erro: "Failed to send request to edge function"

**Causa**: Edge Functions não deployadas

**Solução**:
```bash
npx supabase functions deploy create-checkout
```

### Erro: "Stripe error: No such price"

**Causa**: Price IDs incorretos no código

**Solução**:
1. Verifique os Price IDs no Stripe Dashboard
2. Atualize em `src/components/UpgradeDialog.tsx`

### Erro: "Invalid API Key"

**Causa**: STRIPE_SECRET_KEY não configurada

**Solução**:
1. Copie a Secret Key do Stripe
2. Adicione em: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/functions

### Checkout abre mas não processa pagamento

**Causa**: Webhooks não configurados

**Solução**:
1. Configure webhook no Stripe
2. Adicione STRIPE_WEBHOOK_SECRET no Supabase

---

## 📝 Checklist de Verificação

- [ ] Produto criado no Stripe
- [ ] 2 preços configurados (mensal e anual)
- [ ] Price IDs copiados e atualizados no código
- [ ] API Keys obtidas do Stripe
- [ ] Edge Functions deployadas no Supabase
- [ ] Variáveis de ambiente configuradas no Supabase
- [ ] Webhooks configurados no Stripe
- [ ] Teste com cartão de teste funcionando

---

## 🚀 Alternativa Rápida: Desabilitar Pagamento Temporariamente

Se quiser focar em outras features primeiro, podemos:

1. Comentar o botão de upgrade
2. Dar acesso PRO para todos temporariamente
3. Implementar pagamento depois

Para isso, basta executar no Supabase:
```sql
-- Dar PRO para todos (temporário)
UPDATE profiles
SET subscription_plan = 'pro',
    subscription_status = 'active';
```

---

## 📖 Recursos Adicionais

- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Stripe Webhooks:** https://stripe.com/docs/webhooks

---

**Precisa de ajuda com algum passo específico?** Me avise qual parte está travando! 😊

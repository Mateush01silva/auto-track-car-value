# 🚀 Início Rápido - Stripe em Modo Teste

> **Objetivo**: Configurar pagamentos com Stripe em modo teste em 15 minutos.

---

## 📝 Resumo dos Planos

| Plano | Preço | Trial | Limite | Público |
|-------|-------|-------|--------|---------|
| **Oficina Starter** | R$ 114,90/mês | 14 dias | 100 atendimentos/mês | Oficinas pequenas |
| **Oficina Professional** | R$ 219,90/mês | 14 dias | Ilimitado | Oficinas grandes |
| **Proprietário Pro** | R$ 5,90/mês | 30 dias | Ilimitado | Donos de veículos |

**Política de cancelamento**: 100% de reembolso se cancelar durante o trial.

---

## 🎯 Checklist Rápido

### 1️⃣ Stripe Dashboard (5 minutos)

```bash
✅ Acessar: https://dashboard.stripe.com/test/dashboard
✅ Ativar "Modo de teste" (toggle no canto superior esquerdo)
✅ Ir em Products → + Add Product
✅ Criar 3 produtos com os preços acima
✅ Marcar "Oferecer período de teste" em cada um
✅ Anotar os 3 Price IDs (price_xxxxx)
```

### 2️⃣ API Keys (2 minutos)

```bash
✅ Acessar: https://dashboard.stripe.com/test/apikeys
✅ Copiar Publishable Key (pk_test_...)
✅ Copiar Secret Key - clicar em "Reveal" (sk_test_...)
```

### 3️⃣ Configurar .env Local (1 minuto)

Edite o arquivo `.env` e adicione:

```bash
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_SEU_VALOR_AQUI"
STRIPE_SECRET_KEY="sk_test_SEU_VALOR_AQUI"
VITE_STRIPE_PRICE_WORKSHOP_STARTER="price_STARTER"
VITE_STRIPE_PRICE_WORKSHOP_PROFESSIONAL="price_PROFESSIONAL"
VITE_STRIPE_PRICE_OWNER_PRO="price_OWNER_PRO"
```

**IMPORTANTE**: Não commite o arquivo `.env`! Ele já está no `.gitignore`.

### 4️⃣ Deploy Edge Functions (3 minutos)

```bash
# Instalar CLI (se necessário)
npm install supabase --save-dev

# Login
npx supabase login

# Link com projeto
npx supabase link --project-ref sqnoxtuzoccjstlzekhc

# Deploy
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-customer-portal
npx supabase functions deploy stripe-webhook
npx supabase functions deploy check-subscription
```

### 5️⃣ Configurar Supabase (2 minutos)

```bash
✅ Acessar: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/secrets
✅ Adicionar:
   - STRIPE_SECRET_KEY = sk_test_...
   - STRIPE_PUBLISHABLE_KEY = pk_test_...
✅ Clicar em Save
```

### 6️⃣ Configurar Webhooks (2 minutos)

```bash
✅ Acessar: https://dashboard.stripe.com/test/webhooks
✅ Clicar em "+ Add endpoint"
✅ URL: https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook
✅ Selecionar eventos:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - checkout.session.completed
   - invoice.payment_succeeded
   - invoice.payment_failed
✅ Copiar Signing Secret (whsec_...)
✅ Adicionar no Supabase: STRIPE_WEBHOOK_SECRET = whsec_...
✅ Adicionar também no .env local
```

---

## 🧪 Testar (5 minutos)

### Teste Rápido:

1. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

2. **Acesse:** http://localhost:5173

3. **Registre-se como Oficina**

4. **Tente criar mais de 10 atendimentos**
   - Modal de upgrade deve aparecer

5. **Clique em "Assinar Plano Starter"**
   - Deve abrir Stripe Checkout em nova aba

6. **Use cartão de teste:**
   ```
   Número: 4242 4242 4242 4242
   Data: 12/30
   CVV: 123
   Nome: Teste
   ```

7. **Complete o pagamento**
   - Deve voltar para dashboard
   - Banner: "Período de teste - 14 dias restantes"

8. **Verifique no Supabase:**
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'SEU_USER_ID';
   ```
   - Deve ter registro com status 'trialing'

---

## ✅ Tudo Funcionando?

Se você:
- ✅ Conseguiu abrir o Stripe Checkout
- ✅ Completou pagamento com cartão teste
- ✅ Voltou para dashboard com banner de trial
- ✅ Viu registro no Supabase

**Parabéns! Está tudo funcionando! 🎉**

---

## 🚨 Problemas Comuns

### ❌ Checkout não abre

**Solução:**
```bash
# Verificar se Edge Function foi deployada
npx supabase functions list

# Se não aparecer, deploy novamente
npx supabase functions deploy create-checkout-session
```

### ❌ "Invalid API Key"

**Solução:**
1. Verifique que `STRIPE_SECRET_KEY` está no Supabase
2. Verifique que começa com `sk_test_`
3. Redeploy da função:
   ```bash
   npx supabase functions deploy create-checkout-session
   ```

### ❌ Assinatura não aparece após pagamento

**Solução:**
1. Verifique webhook no Stripe Dashboard
2. Verifique `STRIPE_WEBHOOK_SECRET` está correto
3. Veja logs: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/logs/edge-functions

---

## 📚 Documentação Completa

Para instruções detalhadas, consulte:

- **Configuração Completa**: `CONFIGURACAO_STRIPE_MODO_TESTE.md`
- **Checklist Detalhado**: `CHECKLIST_STRIPE_TESTE.md`
- **Queries de Verificação**: `VERIFICACAO_PLANOS_E_LIMITES.sql`

---

## 🎓 Próximos Passos

Após testar e validar:

1. [ ] Testar todos os 3 planos
2. [ ] Testar limites de uso (100 atendimentos, etc)
3. [ ] Testar cancelamento
4. [ ] Testar Customer Portal
5. [ ] Quando pronto, migrar para produção

---

## 💡 Dicas

### Cartões de Teste Úteis:

```
✅ Sucesso: 4242 4242 4242 4242
❌ Recusado: 4000 0000 0000 0002
⏳ 3D Secure: 4000 0027 6000 3184
```

### Links Rápidos:

- **Stripe Dashboard**: https://dashboard.stripe.com/test/dashboard
- **Produtos**: https://dashboard.stripe.com/test/products
- **API Keys**: https://dashboard.stripe.com/test/apikeys
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **Logs**: https://dashboard.stripe.com/test/logs
- **Supabase Functions**: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/functions
- **Supabase Secrets**: https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/secrets

---

## 🔒 Segurança

⚠️ **NUNCA commite:**
- Arquivo `.env`
- Secret Keys (sk_test_, sk_live_)
- Webhook Secrets (whsec_)

✅ **Pode commitar:**
- Arquivo `.env.example` (com valores de exemplo)
- Publishable Keys (pk_test_, pk_live_)
- Price IDs (price_)

---

**Precisa de ajuda?** Consulte a documentação completa ou veja os logs de erro no Stripe e Supabase.

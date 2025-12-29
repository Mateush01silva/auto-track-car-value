# 💳 Card #1: Criar Produtos e Planos no Stripe

## 📦 Produtos a Criar

### 1. Vybo Oficina - Starter
- **Preço**: R$ 114,90/mês
- **Trial**: 14 dias
- **Limite**: 100 atendimentos/mês
- **Features**: Básicas

### 2. Vybo Oficina - Professional
- **Preço**: R$ 219,90/mês
- **Trial**: 14 dias
- **Limite**: Ilimitado
- **Features**: Todas (CRM Inteligente, Oportunidades, etc)

### 3. Vybo Proprietário - Pro
- **Preço**: R$ 5,90/mês
- **Trial**: 14 dias
- **Limite**: Ilimitado
- **Features**: Recursos premium para proprietários

---

## 🚀 Passo a Passo

### Opção A: Via Stripe Dashboard (Manual)

1. **Acesse**: https://dashboard.stripe.com/products

2. **Produto 1: Vybo Oficina - Starter**
   ```
   Clique em "+ Add Product"

   Name: Vybo Oficina - Starter
   Description: Plano inicial para oficinas - até 100 atendimentos/mês

   Pricing:
   - Model: Standard pricing
   - Price: 114.90 BRL
   - Billing period: Monthly
   - Free trial: 14 days

   Metadata (importante para identificar):
   - plan_type: workshop_starter
   - monthly_limit: 100
   - features: basic

   SALVAR → Copiar PRICE ID (price_xxxxx)
   ```

3. **Produto 2: Vybo Oficina - Professional**
   ```
   Clique em "+ Add Product"

   Name: Vybo Oficina - Professional
   Description: Plano profissional para oficinas - atendimentos ilimitados + CRM completo

   Pricing:
   - Model: Standard pricing
   - Price: 219.90 BRL
   - Billing period: Monthly
   - Free trial: 14 days

   Metadata:
   - plan_type: workshop_professional
   - monthly_limit: unlimited
   - features: all

   SALVAR → Copiar PRICE ID (price_xxxxx)
   ```

4. **Produto 3: Vybo Proprietário - Pro**
   ```
   Clique em "+ Add Product"

   Name: Vybo Proprietário - Pro
   Description: Recursos premium para proprietários de veículos

   Pricing:
   - Model: Standard pricing
   - Price: 5.90 BRL
   - Billing period: Monthly
   - Free trial: 14 days

   Metadata:
   - plan_type: owner_pro
   - monthly_limit: unlimited
   - features: premium_owner

   SALVAR → Copiar PRICE ID (price_xxxxx)
   ```

---

## 📝 Documentar IDs dos Produtos

Após criar os 3 produtos, anote os IDs em um arquivo `.env.local`:

```env
# Stripe API Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price IDs - Stripe Products
VITE_STRIPE_PRICE_WORKSHOP_STARTER=price_...
VITE_STRIPE_PRICE_WORKSHOP_PROFESSIONAL=price_...
VITE_STRIPE_PRICE_OWNER_PRO=price_...
```

E também crie um arquivo de constantes no código:

**Arquivo: `src/config/stripe.ts`**
```typescript
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,

  prices: {
    workshopStarter: import.meta.env.VITE_STRIPE_PRICE_WORKSHOP_STARTER,
    workshopProfessional: import.meta.env.VITE_STRIPE_PRICE_WORKSHOP_PROFESSIONAL,
    ownerPro: import.meta.env.VITE_STRIPE_PRICE_OWNER_PRO,
  },

  plans: {
    workshopStarter: {
      name: 'Vybo Oficina - Starter',
      price: 114.90,
      interval: 'month',
      trialDays: 14,
      monthlyLimit: 100,
      features: [
        'Até 100 atendimentos/mês',
        'Gestão de clientes',
        'Histórico de manutenções',
        'Exportação CSV',
      ],
    },
    workshopProfessional: {
      name: 'Vybo Oficina - Professional',
      price: 219.90,
      interval: 'month',
      trialDays: 14,
      monthlyLimit: null, // ilimitado
      features: [
        'Atendimentos ilimitados',
        'CRM Inteligente completo',
        'Score de Fidelidade',
        'Oportunidades',
        'Exportação Excel/PDF',
        'Envio de emails em lote',
        'Análises avançadas',
      ],
    },
    ownerPro: {
      name: 'Vybo Proprietário - Pro',
      price: 5.90,
      interval: 'month',
      trialDays: 14,
      monthlyLimit: null,
      features: [
        'Múltiplos veículos',
        'Alertas de manutenção',
        'Relatórios detalhados',
        'Compartilhamento via QR Code',
      ],
    },
  },
};

export type PlanType = 'free' | 'workshopStarter' | 'workshopProfessional' | 'ownerPro';
```

---

## 🧪 Testar Checkout Flow

Para cada produto criado, teste o fluxo de pagamento:

1. **Criar Checkout Session** (você vai implementar isso no Card #2)
2. **Completar pagamento com cartão de teste**:
   ```
   Card: 4242 4242 4242 4242
   Exp: Qualquer data futura (ex: 12/25)
   CVC: Qualquer 3 dígitos (ex: 123)
   ```
3. **Verificar que trial de 14 dias foi aplicado**
4. **Confirmar webhook recebeu o evento**

---

## ✅ Checklist Card #1

- [ ] Produto "Vybo Oficina - Starter" criado no Stripe
- [ ] Produto "Vybo Oficina - Professional" criado no Stripe
- [ ] Produto "Vybo Proprietário - Pro" criado no Stripe
- [ ] Todos com trial de 14 dias configurado
- [ ] Price IDs copiados e documentados
- [ ] Arquivo `src/config/stripe.ts` criado
- [ ] Variáveis de ambiente configuradas
- [ ] Testado checkout de cada produto
- [ ] Metadata (plan_type, monthly_limit) configurada em cada produto

---

## 🔗 Próximo Passo

Após criar os produtos, vá para **Card #2** para implementar:
- Webhooks da Stripe
- Liberação automática de features pós-pagamento
- Integração com Supabase

---

## 📚 Referências

- Stripe Dashboard: https://dashboard.stripe.com/products
- Stripe API Docs: https://stripe.com/docs/api
- Teste de Cartões: https://stripe.com/docs/testing

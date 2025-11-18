# 🚀 Guia de Migração: Lovable Cloud → Supabase

Este guia te ajuda a migrar completamente o AutoTrack do Lovable Cloud para o Supabase.

---

## ✅ Passo 1: Aplicar as Migrations no Banco de Dados

### 1.1 - Acesse o SQL Editor do Supabase

1. Entre no [supabase.com](https://supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### 1.2 - Execute o Script de Migração

1. Abra o arquivo `MIGRATION_COMPLETE.sql` (na raiz do projeto)
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

✅ **Pronto!** Todas as tabelas, funções e políticas foram criadas!

### 1.3 - Verificar se deu certo

Execute este SQL no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver essas tabelas:
- ✅ `profiles`
- ✅ `vehicles`
- ✅ `maintenances`

---

## 🔧 Passo 2: Configurar as Edge Functions

### 2.1 - Criar a função `create-checkout`

1. No Supabase, vá em **Edge Functions** no menu lateral
2. Clique em **Create a new function**
3. Nome: `create-checkout`
4. Cole o código abaixo:

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId } = await req.json();
    if (!priceId) {
      throw new Error("Price ID is required");
    }
    logStep("Price ID received", { priceId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil"
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found");
    }

    const origin = req.headers.get("origin") || "http://localhost:8080";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancel`,
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

5. Clique em **Deploy**

### 2.2 - Criar a função `check-subscription`

1. Ainda em **Edge Functions**, clique em **Create a new function**
2. Nome: `check-subscription`
3. Cole o código abaixo:

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil"
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({
        subscribed: false,
        plan: null,
        subscriptionEnd: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let plan = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0].price.id;

      // Determine plan based on price ID
      if (priceId === "price_1STMpgDxXEVRLmijvkzaB6jI") {
        plan = "pro_monthly";
      } else if (priceId === "price_1STMq5DxXEVRLmij1R7OWNHw") {
        plan = "pro_yearly";
      }

      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", {
        subscriptionId: subscription.id,
        plan,
        endDate: subscriptionEnd
      });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

4. Clique em **Deploy**

---

## 🔐 Passo 3: Configurar Secrets (Variáveis de Ambiente)

### 3.1 - Adicionar a STRIPE_SECRET_KEY

As Edge Functions precisam da chave secreta do Stripe para funcionar.

1. No Supabase, vá em **Project Settings** (⚙️)
2. Clique em **Edge Functions**
3. Na seção **Secrets**, adicione:

```
Nome: STRIPE_SECRET_KEY
Valor: [SUA_CHAVE_SECRETA_DO_STRIPE]
```

### 3.2 - Onde encontrar a chave do Stripe?

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Vá em **Developers** → **API Keys**
3. Copie a **Secret key** (começa com `sk_...`)
4. Cole no Supabase como valor do secret `STRIPE_SECRET_KEY`

⚠️ **IMPORTANTE:** Use a chave de **PRODUÇÃO** (`sk_live_...`) apenas quando for para produção. Para testes, use a chave de **TESTE** (`sk_test_...`).

---

## 🎯 Passo 4: Testar a Migração

### 4.1 - Testar o Frontend

1. No seu projeto local, rode:

```bash
npm run dev
```

2. Abra o navegador em `http://localhost:5173` (ou a porta indicada)
3. Tente fazer login ou criar uma nova conta
4. Verifique se consegue:
   - ✅ Criar uma conta
   - ✅ Fazer login
   - ✅ Ver o dashboard
   - ✅ Adicionar um veículo
   - ✅ Adicionar uma manutenção

### 4.2 - Verificar no Supabase

1. Vá em **Table Editor** no Supabase
2. Abra a tabela `profiles`
3. Você deve ver o perfil do usuário que você criou
4. Abra as tabelas `vehicles` e `maintenances` e veja se os dados estão sendo salvos

### 4.3 - Testar as Edge Functions

No Supabase, vá em **Edge Functions** e veja os logs de execução. Se houver erros, eles aparecerão lá.

---

## 📊 Passo 5: Migrar Dados Existentes (se houver)

Se você já tem dados no Lovable Cloud e quer migrar para o novo Supabase:

### 5.1 - Exportar dados do Lovable Cloud

1. Acesse o Lovable.dev
2. Vá em **Cloud** → **Database** → **Tables**
3. Para cada tabela (`profiles`, `vehicles`, `maintenances`):
   - Abra a tabela
   - Clique em **Export** ou use o SQL Editor para fazer:

   ```sql
   SELECT * FROM profiles;
   SELECT * FROM vehicles;
   SELECT * FROM maintenances;
   ```

   - Salve os resultados como CSV ou JSON

### 5.2 - Importar no novo Supabase

1. No Supabase, vá em **Table Editor**
2. Abra cada tabela
3. Clique em **Insert** → **Import data**
4. Faça upload dos arquivos CSV/JSON exportados

**OU** use SQL direto:

```sql
-- Exemplo de inserção manual
INSERT INTO public.profiles (id, email, full_name)
VALUES ('uuid-aqui', 'email@exemplo.com', 'Nome Completo');
```

---

## 🚀 Passo 6: Deploy do Frontend (Opcional)

Se você quiser fazer deploy do frontend fora do Lovable:

### Opção A: Vercel

```bash
npm install -g vercel
vercel login
vercel
```

### Opção B: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Opção C: Continuar usando Lovable

Você pode continuar usando o Lovable apenas para o frontend! O backend já está 100% no Supabase.

---

## ✅ Checklist Final

Marque conforme for completando:

- [ ] Executei o `MIGRATION_COMPLETE.sql` no Supabase
- [ ] Criei a Edge Function `create-checkout`
- [ ] Criei a Edge Function `check-subscription`
- [ ] Configurei o secret `STRIPE_SECRET_KEY`
- [ ] Atualizei o arquivo `.env` local com as novas credenciais
- [ ] Testei login/cadastro
- [ ] Testei criar veículo
- [ ] Testei criar manutenção
- [ ] (Opcional) Migrei dados existentes do Lovable
- [ ] (Opcional) Fiz deploy do frontend

---

## 🆘 Problemas Comuns

### Erro: "relation already exists"

Isso significa que a tabela já existe. Está tudo ok! Continue com o próximo passo.

### Erro: "policy already exists"

Mesma coisa - a política já existe. Pode continuar!

### Edge Function não funciona

1. Verifique se adicionou o `STRIPE_SECRET_KEY` nos secrets
2. Veja os logs da função no Supabase para identificar o erro
3. Teste localmente primeiro

### Login não funciona

1. Verifique se o `.env` está com as credenciais corretas
2. Verifique se as tabelas foram criadas corretamente
3. Veja os logs do navegador (F12 → Console)

---

## 🎉 Pronto!

Agora seu AutoTrack está 100% no Supabase, com controle total e melhor sustentação!

**Dúvidas?** Abra uma issue no GitHub ou entre em contato.

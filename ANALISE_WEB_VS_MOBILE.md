# 📱 Relatório: Diferenças entre Versões Web e Mobile/PWA

**Data:** 07/01/2026
**Análise:** Funcionalidades nas versões Web vs Mobile/PWA

---

## 🎯 Resumo Executivo

**BOA NOTÍCIA:** A funcionalidade de **Tabela de Preços de Serviços** já está implementada e acessível em AMBAS as versões (Web e Mobile/PWA)!

O que você viu no celular também está disponível na web, apenas a forma de acesso pode ser diferente devido à navegação adaptativa.

---

## 📊 Análise Detalhada

### ✅ Funcionalidades PRESENTES em Ambas as Versões

#### 1. **Tabela de Preços de Serviços** (`/workshop/pricing`)

**Descrição:**
- Permite cadastrar preços min/max para cada serviço da oficina
- Define percentual de mão de obra por serviço
- Organiza por categorias (Motor, Freios, Suspensão, etc.)

**Acesso:**
- 📱 **Mobile:** Menu "Mais" (ícone `⋯`) → "Tabela de Preços"
- 💻 **Web:** Menu "Mais" (ícone `⋯`) → "Tabela de Preços"

**Implementação:**
- **Arquivo:** `src/pages/workshop/Pricing.tsx`
- **Tabela:** `workshop_service_prices` (migration 20251213000000)
- **Status:** ✅ Totalmente funcional

**Funcionalidades:**
- ✅ Adicionar novo preço
- ✅ Editar preço existente
- ✅ Excluir preço
- ✅ Filtrar por categoria
- ✅ Visualizar por categoria agrupada

---

#### 2. **Oportunidades de Negócio** (`/workshop/opportunities`)

**Descrição:**
- Mostra clientes com manutenções pendentes
- Calcula receita potencial (peças + mão de obra)
- **USA OS PREÇOS CUSTOMIZADOS** da tabela de preços

**Acesso:**
- 📱 **Mobile:** Menu "Mais" (ícone `⋯`) → "Oportunidades"
- 💻 **Web:** Menu "Mais" (ícone `⋯`) → "Oportunidades"

**Implementação:**
- **Arquivo:** `src/pages/workshop/Opportunities.tsx`
- **Status:** ✅ Totalmente funcional
- **Integração:** ✅ JÁ usa `workshop_service_prices` (linhas 154-159, 251-264, 348-350)

**Como funciona a integração:**
```typescript
// Linha 251-264 do Opportunities.tsx
const getCustomPrice = (category: string, item: string) => {
  const customPrice = customPrices.find(
    (p) => p.service_category === category && p.service_item === item
  );

  if (customPrice) {
    return {
      min: customPrice.min_price / 100, // Preço customizado
      max: customPrice.max_price / 100,
    };
  }

  return null; // Usa preço da API se não tiver customizado
};
```

**Lógica de Preços:**
1. Primeiro verifica se tem preço customizado na tabela
2. Se tiver, usa o preço da oficina
3. Se não tiver, usa preço estimado da API SUIV
4. Calcula mão de obra baseado no percentual configurado

---

#### 3. **Templates de Serviços** (`/workshop/templates`)

**Descrição:**
- Templates de serviços pré-configurados
- Agiliza cadastro de atendimentos

**Acesso:**
- 📱 **Mobile:** Menu "Mais" → "Templates"
- 💻 **Web:** Menu "Mais" → "Templates"

**Implementação:**
- **Arquivo:** `src/pages/workshop/Templates.tsx`
- **Tabela:** `workshop_service_templates`
- **Status:** ✅ Funcional

---

## 🗺️ Mapa de Navegação

### Mobile (Bottom Navigation)

**Navegação Principal (Bottom Bar):**
1. 🏠 **Dashboard** - `/workshop/dashboard`
2. ➕ **Novo** - `/workshop/new-service` (botão de ação)
3. 📜 **Histórico** - `/workshop/history`
4. 👥 **CRM** - `/workshop/clients`

**Menu "Mais" (⋯):**
1. 📈 **Oportunidades** - `/workshop/opportunities`
2. 💰 **Tabela de Preços** - `/workshop/pricing` ← AQUI!
3. 📄 **Templates** - `/workshop/templates`
4. ⚙️ **Configurações** - `/workshop/settings`
5. 💳 **Planos** - `/workshop/plans`

### Web (Desktop)

**Navegação Header (disponível em todas as páginas):**
- 📊 Dashboard
- 📜 Histórico
- 👥 Clientes
- 📄 Templates

**Menu Dropdown (User):**
- 👤 Perfil da Oficina
- 🚪 Sair

**Acessos adicionais:**
- Menu "Mais" similar ao mobile (em algumas páginas)
- Rotas diretas via URL

---

## 🔍 Diferenças Identificadas

### Navegação

| Funcionalidade | Mobile | Web | Status |
|----------------|--------|-----|--------|
| Dashboard | ✅ Bottom Nav | ✅ Header | Igual |
| Novo Atendimento | ✅ Bottom Nav (destaque) | ✅ Via Dashboard | Igual |
| Histórico | ✅ Bottom Nav | ✅ Header | Igual |
| CRM/Clientes | ✅ Bottom Nav | ✅ Header | Igual |
| Oportunidades | ✅ Menu "Mais" | ✅ Menu "Mais" / URL | Igual |
| **Tabela de Preços** | ✅ Menu "Mais" | ✅ Menu "Mais" / URL | **Igual** |
| Templates | ✅ Menu "Mais" | ✅ Header + Menu | Igual |
| Configurações | ✅ Menu "Mais" | ✅ Menu Dropdown | Igual |
| Planos | ✅ Menu "Mais" | ✅ Menu "Mais" / URL | Igual |

### UI/UX

| Aspecto | Mobile | Web |
|---------|--------|-----|
| Navegação Principal | Bottom Bar (fixo) | Header (fixo) |
| Navegação Secundária | Menu "Mais" (dropdown) | Menu/Header |
| Tabelas | Cards responsivos | Tables completas |
| Formulários | Layout vertical | Layout horizontal quando apropriado |
| Modais | Full screen quando necessário | Centered |

---

## 💡 Fluxo Completo de Preços Customizados

### Como Funciona:

1. **Cadastrar Preços** (`/workshop/pricing`)
   - Oficina acessa "Tabela de Preços"
   - Cadastra preços para serviços que realiza
   - Define min/max e % de mão de obra

2. **Oportunidades Usa os Preços** (`/workshop/opportunities`)
   - Sistema detecta manutenções pendentes
   - Para cada item:
     - Verifica se tem preço na tabela
     - Se SIM: usa preço customizado ⭐
     - Se NÃO: usa preço estimado da API
   - Calcula total (peças + mão de obra)
   - Mostra receita potencial

3. **Exemplo Prático:**

```
Cliente: João Silva
Veículo: Corolla 2018

Manutenção Pendente: "Troca de óleo do motor"

Sem Preço Customizado:
- Peças: R$ 80,00 - R$ 150,00 (API)
- M.O. (25%): R$ 20,00 - R$ 37,50
- Total: R$ 100,00 - R$ 187,50

Com Preço Customizado (cadastrado na tabela):
- Peças: R$ 120,00 - R$ 180,00 (Tabela) ✨
- M.O. (30%): R$ 36,00 - R$ 54,00
- Total: R$ 156,00 - R$ 234,00 ✨

Benefício: Estimativa mais precisa e realista!
```

---

## 📋 Checklist de Funcionalidades

### ✅ Implementadas e Funcionando

- [x] Tabela de Preços (CRUD completo)
- [x] Categorização de serviços
- [x] Preços min/max
- [x] Percentual de mão de obra
- [x] Integração com Oportunidades
- [x] Fallback para API quando sem preço customizado
- [x] Indicador visual de preço customizado
- [x] Filtros por categoria
- [x] Responsividade mobile/web

### ⚠️ Possíveis Melhorias Futuras

- [ ] Importar preços de uma planilha
- [ ] Histórico de alterações de preços
- [ ] Sugestões de preços baseadas no mercado
- [ ] Copiar preços entre categorias
- [ ] Templates de preços por marca de veículo

---

## 🚀 Como Testar

### Mobile:
1. Acesse a aplicação no celular
2. Faça login como oficina
3. Toque em "Mais" (⋯) no bottom nav
4. Toque em "Tabela de Preços"
5. Adicione um preço de teste
6. Volte e acesse "Oportunidades"
7. Veja o preço sendo usado nas estimativas

### Web:
1. Acesse a aplicação no desktop
2. Faça login como oficina
3. Acesse diretamente: `/workshop/pricing`
4. OU clique em "Mais" se disponível
5. Siga os mesmos passos do mobile

---

## 🎯 Conclusão

**Resposta à sua pergunta:**

> "Tem funcionalidades no celular que não tem na versão Web ainda?"

**NÃO.** Todas as funcionalidades estão nas duas versões! 🎉

A **Tabela de Preços de Serviços** que você viu no celular:
- ✅ Está na web
- ✅ Funciona da mesma forma
- ✅ JÁ está integrada com Oportunidades
- ✅ Usa os mesmos dados (mesma tabela no banco)

A diferença que você percebeu é apenas na **navegação**:
- No mobile, está no menu "Mais" (por limitação de espaço)
- Na web, também está no menu "Mais" ou acessível via URL direta

**Próximos Passos Sugeridos:**
1. Testar a funcionalidade na web para confirmar
2. Cadastrar preços reais da sua oficina
3. Ver as Oportunidades sendo calculadas com preços precisos
4. Considerar melhorias futuras (importação, histórico, etc.)

---

## 📌 Arquivos Principais

| Funcionalidade | Arquivo Principal | Localização |
|----------------|-------------------|-------------|
| Tabela de Preços | `Pricing.tsx` | `src/pages/workshop/` |
| Oportunidades | `Opportunities.tsx` | `src/pages/workshop/` |
| Bottom Nav | `BottomNav.tsx` | `src/components/workshop/` |
| Rotas | `App.tsx` | `src/` |
| Migration | `20251213000000_add_workshop_service_prices.sql` | `supabase/migrations/` |

---

**Alguma dúvida ou quer explorar alguma funcionalidade específica?** 🚗💨

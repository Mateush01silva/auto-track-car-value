# 🏷️ Guia: Como Usar Tags Personalizadas no CRM

## O que são Tags?

Tags são etiquetas coloridas personalizadas que você pode criar e atribuir aos seus clientes para organizá-los e categorizá-los da forma que fizer mais sentido para sua oficina.

## Exemplos de Tags Úteis

- 🟡 **VIP** - Clientes de alto valor
- 🔵 **Frota** - Empresas com múltiplos veículos
- 🟢 **Pagamento à Vista** - Preferência de pagamento
- 🟣 **Indicação** - Cliente veio por indicação
- 🔴 **Atenção Especial** - Cliente que precisa de cuidado extra
- 🟠 **Primeira Vez** - Cliente novo

## Como Criar Tags

### Passo 1: Acessar Gerenciador de Tags

1. Acesse a página **CRM Inteligente**
2. No topo da página, clique no botão **"Gerenciar Tags"**
   - Em desktop: Botão visível ao lado do título
   - Em mobile: Pode estar no menu

### Passo 2: Criar Nova Tag

1. No modal "Gerenciar Tags":
   - Digite o **nome da tag** (ex: "VIP")
   - Escolha uma **cor** clicando no seletor de cores
   - Clique em **"Criar Tag"**

2. A tag será criada e aparecerá na lista

### Passo 3: Editar ou Deletar Tags

- **Deletar**: Clique no ícone de lixeira (🗑️) ao lado da tag
  - ⚠️ Isso NÃO apaga os clientes, apenas remove a tag de todos eles
- As tags criadas são exclusivas da sua oficina

## Como Atribuir Tags aos Clientes

### Método: Via Modal de Detalhes

1. Na lista de clientes, **clique em qualquer card de cliente**
2. O modal de detalhes será aberto
3. Role até a seção **"Tags"** (ícone de documento roxo 📄)
4. Você verá todas as tags que você criou:
   - **Tags com fundo colorido e ✓**: Cliente já tem essa tag
   - **Tags com borda tracejada**: Cliente não tem essa tag

5. **Para adicionar/remover tag**:
   - Clique na tag desejada
   - Se estiver desmarcada → será marcada (cliente ganha a tag)
   - Se estiver marcada → será desmarcada (cliente perde a tag)

6. As mudanças são **salvas automaticamente** ao clicar

## Como Filtrar Clientes por Tags

**⚠️ Funcionalidade ainda não implementada no código atual**

Planejado para futuras versões:
- Filtro dropdown na barra de busca
- Mostrar apenas clientes com tag específica
- Combinar múltiplas tags no filtro

## Dicas de Uso

### 💡 Organize por Comportamento
- "Frequente" - Vem todo mês
- "Esporádico" - Vem de vez em quando
- "Inativo" - Não vem há meses

### 💡 Organize por Tipo de Serviço
- "Manutenção Preventiva"
- "Só Emergências"
- "Customização"

### 💡 Organize por Origem
- "Google Ads"
- "Indicação"
- "Cliente Antigo"
- "Parceria [Nome]"

### 💡 Combine com Segmentação Automática
O sistema já segmenta automaticamente em:
- 🟢 **VIP** - Alto gasto/frequência
- 🟡 **Regular** - Cliente fiel
- ⚪ **Novo** - Primeiro atendimento
- 🔴 **Em Risco** - Não retorna há tempo

Use tags personalizadas para adicionar **contexto extra** além da segmentação automática.

## Limite de Tags

**Atualmente**: Sem limite técnico
**Recomendado**: Máximo 20 tags para não poluir a interface

## Perguntas Frequentes

### P: Se eu deletar uma tag, os clientes são deletados?
**R**: Não! Apenas a tag é removida. Os clientes continuam normais.

### P: Posso atribuir múltiplas tags ao mesmo cliente?
**R**: Sim! Um cliente pode ter quantas tags você quiser.

### P: As cores das tags podem ser editadas depois?
**R**: Atualmente não há edição de tags. Você precisa deletar e criar novamente.

### P: Outros usuários da minha oficina veem as mesmas tags?
**R**: Sim, as tags são compartilhadas entre todos os usuários da mesma oficina.

### P: Posso ver um resumo de quantos clientes têm cada tag?
**R**: Atualmente não, mas é uma funcionalidade planejada.

## Localização Visual

```
┌─────────────────────────────────────────────┐
│ CRM Inteligente          [Gerenciar Tags]  │ ← Clique aqui
└─────────────────────────────────────────────┘

         ↓ Abre modal ↓

┌─────────────────────────────────────────────┐
│ Gerenciar Tags                         [×]  │
├─────────────────────────────────────────────┤
│                                             │
│ Nome da Tag: [____________]                 │
│ Cor: [🎨 #3B82F6]                          │
│                                             │
│ [Criar Tag]                                 │
│                                             │
│ Tags Criadas:                               │
│  ┌────────────────────────────────┐         │
│  │ VIP      #FFD700        [🗑️]  │         │
│  │ Frota    #3B82F6        [🗑️]  │         │
│  └────────────────────────────────┘         │
└─────────────────────────────────────────────┘
```

```
Clique em cliente → Abre modal

┌─────────────────────────────────────────────┐
│ [Avatar] João Silva                         │
│          Chevrolet Onix 2020                │
│          [VIP] [Usuário Vybo]               │
├─────────────────────────────────────────────┤
│ ... (dados do cliente) ...                  │
├─────────────────────────────────────────────┤
│ 📄 Tags                                     │
│                                             │
│  [✓ VIP]  [✓ Frota]  [Indicação]  [Novo]  │← Clique para marcar/desmarcar
│                                             │
└─────────────────────────────────────────────┘
```

## Próximos Passos

Depois de criar e organizar suas tags, você pode:
1. **Usar para campanhas de email** (Card #15 - já implementado)
   - Selecionar clientes com tag específica
   - Enviar email personalizado em lote

2. **Análise visual** (futuro)
   - Dashboard mostrando distribuição de tags
   - Gráficos de crescimento por tag

3. **Automação** (futuro)
   - Atribuir tags automaticamente baseado em comportamento
   - Regras: "Cliente com gasto > R$ 5000 = VIP"

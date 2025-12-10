# Feature Flags - Guia Completo

Este guia explica como alternar entre diferentes modos de operação do WiseDrive usando **feature flags**.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Modos Disponíveis](#modos-disponíveis)
- [Como Configurar](#como-configurar)
- [Exemplos de Uso](#exemplos-de-uso)
- [Estrutura do Código](#estrutura-do-código)
- [Testando a Nova API](#testando-a-nova-api)
- [FAQ](#faq)

---

## 🎯 Visão Geral

O WiseDrive agora suporta **dois modos de operação** que podem ser alternados facilmente através de variáveis de ambiente:

### 1. **Modo de Cadastro de Veículos**
- **Fipe** (atual): API gratuita com seleção manual de marca/modelo/ano
- **Plate** (novo): API paga com busca automática por placa

### 2. **Modo de Recomendações de Manutenção**
- **Generic** (atual): Tabela de manutenções genéricas hardcoded
- **Manufacturer** (novo): Revisões específicas do fabricante via API

---

## 🔧 Modos Disponíveis

### Modo de Veículos

#### Fipe (Padrão - GRÁTIS)
- ✅ **Gratuito** - API pública da Fipe
- 👤 **Requer seleção manual** - Usuário escolhe marca/modelo/ano
- 📊 **Cache otimizado** - Resultados salvos no sessionStorage
- 🇧🇷 **Dados da tabela Fipe** - Valores de referência do mercado

**Quando usar:** Para desenvolvimento, testes e uso sem custo

#### Plate (Novo - PAGO)
- 💳 **Requer assinatura** - API paga
- 🚀 **Busca automática** - Apenas digite a placa
- ⚡ **Mais rápido** - Menos cliques para o usuário
- 🎯 **Mais preciso** - Dados específicos do veículo real

**Quando usar:** Em produção com assinatura ativa da API

---

### Modo de Manutenções

#### Generic (Padrão - GRÁTIS)
- ✅ **Incluído no código** - Sem custos adicionais
- 📚 **113 itens** - Manutenções comuns de veículos
- 🔧 **Categorizado** - 13 categorias principais
- 💰 **Custos estimados** - Faixas de preço genéricas

**Quando usar:** Para desenvolvimento, testes e uso básico

#### Manufacturer (Novo - PAGO)
- 💳 **Requer assinatura** - API paga
- 🎯 **Específico do fabricante** - Revisões recomendadas pela montadora
- 📅 **Intervalos precisos** - KM e tempo baseados no manual do veículo
- 🔍 **Personalizadas** - Baseadas em marca/modelo/ano

**Quando usar:** Para usuários premium que querem recomendações personalizadas

---

## ⚙️ Como Configurar

### Passo 1: Editar o arquivo `.env`

Abra o arquivo `.env` na raiz do projeto e configure as variáveis:

```env
# ====================================
# FEATURE FLAGS - Controle de APIs
# ====================================

# Modo de cadastro de veículos:
# - "fipe": Usa API da Fipe (método atual - GRÁTIS)
# - "plate": Usa API com busca por placa (requer assinatura)
VITE_VEHICLE_API_MODE="fipe"

# Modo de recomendações de manutenção:
# - "generic": Usa tabela genérica hardcoded (método atual - GRÁTIS)
# - "manufacturer": Usa revisões específicas do fabricante via API (requer assinatura)
VITE_MAINTENANCE_MODE="generic"

# URL e credenciais da nova API (apenas necessário se usar mode="plate" ou "manufacturer")
VITE_CAR_API_URL=""
VITE_CAR_API_KEY=""
```

### Passo 2: Escolher o Modo

#### Para usar a **API Fipe** (modo atual):
```env
VITE_VEHICLE_API_MODE="fipe"
VITE_MAINTENANCE_MODE="generic"
```
✅ **Não precisa configurar URL ou API Key**

#### Para usar a **nova API com placa**:
```env
VITE_VEHICLE_API_MODE="plate"
VITE_MAINTENANCE_MODE="manufacturer"
VITE_CAR_API_URL="https://api.exemplo.com.br"
VITE_CAR_API_KEY="sua_chave_api_aqui"
```
⚠️ **Requer URL e API Key válidas**

#### Modo híbrido (placa + manutenções genéricas):
```env
VITE_VEHICLE_API_MODE="plate"
VITE_MAINTENANCE_MODE="generic"
VITE_CAR_API_URL="https://api.exemplo.com.br"
VITE_CAR_API_KEY="sua_chave_api_aqui"
```

### Passo 3: Reiniciar o servidor de desenvolvimento

```bash
npm run dev
```

⚠️ **IMPORTANTE:** Após alterar o `.env`, você DEVE reiniciar o servidor Vite para as mudanças terem efeito.

---

## 💡 Exemplos de Uso

### Exemplo 1: Testar a nova API em desenvolvimento

```env
# Arquivo .env
VITE_VEHICLE_API_MODE="plate"
VITE_MAINTENANCE_MODE="generic"  # Mantém manutenções genéricas por enquanto
VITE_CAR_API_URL="https://api-teste.exemplo.com.br"
VITE_CAR_API_KEY="chave_teste_123"
```

Isso permite testar a busca por placa mantendo as manutenções genéricas.

### Exemplo 2: Voltar ao modo gratuito

```env
# Arquivo .env
VITE_VEHICLE_API_MODE="fipe"
VITE_MAINTENANCE_MODE="generic"
VITE_CAR_API_URL=""
VITE_CAR_API_KEY=""
```

Volta completamente ao modo original (gratuito).

### Exemplo 3: Produção com API completa

```env
# Arquivo .env.production
VITE_VEHICLE_API_MODE="plate"
VITE_MAINTENANCE_MODE="manufacturer"
VITE_CAR_API_URL="https://api.exemplo.com.br"
VITE_CAR_API_KEY="${CAR_API_KEY}"  # Use variável de ambiente do servidor
```

---

## 📁 Estrutura do Código

### Arquivos Criados/Modificados

```
src/
├── config/
│   └── featureFlags.ts              # Configuração central de feature flags
│
├── services/
│   ├── fipeApi.ts                   # [EXISTENTE] API da Fipe
│   ├── plateApi.ts                  # [NOVO] API com busca por placa
│   ├── vehicleApiAdapter.ts         # [NOVO] Adapter que unifica as APIs de veículos
│   └── maintenanceApiAdapter.ts     # [NOVO] Adapter para manutenções
│
├── hooks/
│   └── useFeatureFlags.ts           # [NOVO] Hooks React para feature flags
│
└── components/
    └── VehicleFormDialog.tsx        # [MODIFICADO] Suporta ambos os modos

.env                                 # [MODIFICADO] Adicionadas variáveis de feature flags
.env.example                         # [NOVO] Template com documentação
```

### Como o Sistema Funciona

1. **Configuração** (`src/config/featureFlags.ts`)
   - Lê variáveis de ambiente
   - Valida configuração
   - Exporta helpers

2. **Adapters** (`src/services/*Adapter.ts`)
   - Fornecem interface unificada
   - Escolhem qual API usar baseado nos feature flags
   - Tratam erros e fallbacks

3. **Hooks** (`src/hooks/useFeatureFlags.ts`)
   - Facilitam uso nos componentes React
   - Gerenciam estado e loading
   - Fornecem funções auxiliares

4. **Componentes** (ex: `VehicleFormDialog.tsx`)
   - Detectam modo atual automaticamente
   - Renderizam interface apropriada
   - Funcionam com qualquer modo

---

## 🧪 Testando a Nova API

### 1. Preparar o ambiente de teste

```bash
# 1. Copie o .env.example se ainda não tiver .env
cp .env.example .env

# 2. Edite o .env e configure o modo de teste
nano .env
```

### 2. Configurar o modo de teste

```env
VITE_VEHICLE_API_MODE="plate"
VITE_MAINTENANCE_MODE="generic"
VITE_CAR_API_URL="URL_DA_API_TESTE"
VITE_CAR_API_KEY="CHAVE_DE_TESTE"
```

### 3. Ajustar os endpoints da API

Edite `src/services/plateApi.ts` e ajuste os endpoints de acordo com a documentação da sua API:

```typescript
// Linha ~85 - Endpoint de busca por placa
return this.request<PlateSearchResponse>(`/vehicles/search?plate=${cleanPlate}`);

// Linha ~103 - Endpoint de revisões do fabricante
return this.request<ManufacturerRevision[]>(`/revisions?${params}`);
```

### 4. Testar a busca por placa

1. Inicie o servidor: `npm run dev`
2. Abra o formulário de cadastro de veículo
3. Digite uma placa de teste
4. Clique no botão de busca
5. Verifique se os dados aparecem corretamente

### 5. Verificar logs no console

No modo de desenvolvimento, você verá logs úteis:

```javascript
// Abra o console do navegador (F12)
// Você verá informações sobre o modo atual:
🚗 WiseDrive - Feature Flags
Modo de Veículos: plate
Modo de Manutenção: generic
API URL: https://api-teste.exemplo.com.br
API Key: ***configurada***
✅ Configuração válida
```

---

## ❓ FAQ

### P: Como voltar ao modo anterior?

**R:** Edite o `.env` e mude de volta para `"fipe"` e `"generic"`:

```env
VITE_VEHICLE_API_MODE="fipe"
VITE_MAINTENANCE_MODE="generic"
```

Depois reinicie o servidor: `npm run dev`

---

### P: Posso usar a busca por placa sem as revisões do fabricante?

**R:** Sim! Os modos são independentes:

```env
VITE_VEHICLE_API_MODE="plate"        # Nova API
VITE_MAINTENANCE_MODE="generic"      # Manutenções antigas
```

---

### P: A API precisa estar configurada mesmo no modo "fipe"?

**R:** Não. Se você usar `mode="fipe"`, as variáveis `VITE_CAR_API_URL` e `VITE_CAR_API_KEY` podem ficar vazias.

---

### P: Como sei qual modo está ativo?

**R:** Em modo de desenvolvimento, você verá um alerta azul no topo do formulário de veículos mostrando o modo atual. Você também pode verificar no console do navegador (F12) procurando por "WiseDrive - Feature Flags".

---

### P: O que acontece se a nova API falhar?

**R:** O sistema tem fallbacks:
- **Busca por placa:** Mostra erro e permite tentar novamente
- **Revisões do fabricante:** Fallback automático para manutenções genéricas em caso de erro

---

### P: Preciso modificar o banco de dados?

**R:** Não! Os adapters funcionam com a estrutura existente do banco. Não são necessárias migrações.

---

### P: Como testar em produção de forma segura?

**R:** Recomendamos:

1. Criar um arquivo `.env.production` separado
2. Testar primeiro com usuários beta
3. Usar variáveis de ambiente do servidor para credenciais sensíveis
4. Manter o `.env` original como backup

Exemplo `.env.production`:
```env
VITE_VEHICLE_API_MODE="plate"
VITE_MAINTENANCE_MODE="manufacturer"
VITE_CAR_API_URL="${CAR_API_URL}"  # Variável do servidor
VITE_CAR_API_KEY="${CAR_API_KEY}"  # Variável do servidor
```

---

### P: Onde coloco a URL e chave da API SUIV?

**R:** No arquivo `.env` na raiz do projeto:

```env
VITE_CAR_API_URL="https://api.suiv.com.br"
VITE_CAR_API_KEY="sua_chave_api_suiv_aqui"
```

⚠️ **Nunca commite** o `.env` com credenciais reais no Git!

Para obter sua chave de API SUIV, acesse: https://api.suiv.com.br

---

### P: Posso usar diferentes modos em ambientes diferentes?

**R:** Sim! Crie arquivos separados:

- `.env.development` - Para desenvolvimento local
- `.env.staging` - Para testes
- `.env.production` - Para produção

O Vite carrega automaticamente o arquivo correto baseado no comando usado.

---

## 📡 Sobre a API SUIV

O WiseDrive está integrado com a **API SUIV V4**, uma API completa para consulta de informações veiculares no Brasil.

### Funcionalidades da API SUIV:

1. **Consulta por Placa** (`/api/v4/VehicleInfo/byplate`)
   - Retorna: marca, modelo, versão, ano, combustível, VIN, cor, etc.
   - Suporta placas antigas (ABC-1234) e Mercosul (ABC1D23)

2. **Plano de Revisões** (`/api/v4/RevisionPlan`)
   - Revisões específicas do fabricante
   - Peças a serem trocadas por quilometragem
   - Inspeções recomendadas
   - Estimativa de preços e tempo

3. **Catálogo Completo:**
   - `/api/v4/Makers` - Lista de fabricantes
   - `/api/v4/Models` - Modelos por fabricante
   - `/api/v4/Versions` - Versões por modelo

### Como a integração funciona:

**Busca por Placa:**
```
Usuário digita placa → API SUIV retorna dados → WiseDrive cadastra automaticamente
```

**Plano de Revisões:**
```
1. Busca ID da marca (Makers)
2. Busca ID do modelo (Models)
3. Busca ID da versão (Versions)
4. Busca plano de revisão (RevisionPlan)
5. WiseDrive exibe recomendações personalizadas
```

### Autenticação:

A API SUIV usa **query parameter** para autenticação:
```
https://api.suiv.com.br/api/v4/VehicleInfo/byplate?plate=ABC1234&key=SUA_CHAVE_AQUI
```

### Limitações e Custos:

- ⚠️ **API Paga** - Requer assinatura
- Consulte preços e planos em: https://api.suiv.com.br
- Documentação completa: https://api.suiv.com.br/documentation/

---

## 🆘 Suporte

Se encontrar problemas:

1. ✅ Verifique se reiniciou o servidor após alterar o `.env`
2. ✅ Confirme que as variáveis estão no formato correto
3. ✅ Verifique os logs no console do navegador (F12)
4. ✅ Teste primeiro com `mode="fipe"` para garantir que tudo funciona

---

## 🎉 Pronto!

Agora você pode alternar facilmente entre os modos de operação do WiseDrive. Teste à vontade e volte ao modo anterior quando precisar!

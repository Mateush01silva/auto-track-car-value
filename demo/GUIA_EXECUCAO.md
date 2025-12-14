# 🔑 GUIA COMPLETO - Configuração e Execução

## Passo 1: Obter Service Role Key do Supabase

### 1.1 - Acessar Painel do Supabase

1. Ir para: https://supabase.com/dashboard
2. Fazer login
3. Selecionar seu projeto (auto-track-car-value)

### 1.2 - Encontrar a Service Role Key

1. No menu lateral esquerdo, clicar em **⚙️ Settings** (Configurações)
2. Clicar em **API**
3. Rolar a página até a seção **"Project API keys"**
4. Você verá duas chaves:
   - ✅ **`anon` `public`** - Chave pública (já está no .env)
   - 🔐 **`service_role` `secret`** - **Esta é a que precisamos!**

### 1.3 - Copiar a Service Role Key

1. Localizar a linha **`service_role`**
2. Clicar no botão **"Reveal"** (Revelar) ou ícone de olho 👁️
3. Clicar no botão **"Copy"** (Copiar) ou ícone de copiar 📋
4. **IMPORTANTE:** Esta chave é SECRETA! Não compartilhar publicamente!

A chave tem este formato:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

---

## Passo 2: Configurar Ambiente

### 2.1 - Abrir Terminal

**No Windows:**
- Pressionar `Win + R`
- Digitar `cmd` ou `powershell`
- Pressionar Enter

**No Mac/Linux:**
- Abrir "Terminal"

### 2.2 - Navegar até a Pasta do Projeto

```bash
# Substituir pelo caminho correto do seu projeto
cd C:\Users\SeuUsuario\Projetos\auto-track-car-value

# OU no Mac/Linux:
cd ~/Projetos/auto-track-car-value
```

**Verificar se está na pasta correta:**
```bash
# Listar arquivos
ls
# OU no Windows:
dir

# Deve aparecer as pastas: demo, src, supabase, etc.
```

### 2.3 - Instalar Dependências do Demo

```bash
# Entrar na pasta demo
cd demo

# Instalar dependências
npm install
```

**Saída esperada:**
```
added 245 packages, and audited 246 packages in 15s
```

---

## Passo 3: Configurar Service Role Key

### Opção A: Variável de Ambiente Temporária (Recomendado para Teste)

**Windows (CMD):**
```cmd
set SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUA_CHAVE_AQUI
```

**Windows (PowerShell):**
```powershell
$env:SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUA_CHAVE_AQUI"
```

**Mac/Linux:**
```bash
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUA_CHAVE_AQUI"
```

**IMPORTANTE:** Substituir `SUA_CHAVE_AQUI` pela chave que você copiou!

### Opção B: Criar Arquivo .env.local (Permanente)

**1. Criar arquivo `.env.local` na pasta `demo/`:**

```bash
# Windows (PowerShell):
New-Item .env.local

# Mac/Linux:
touch .env.local
```

**2. Abrir arquivo `.env.local` com editor de texto**

**3. Adicionar a chave:**

```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUA_CHAVE_AQUI
```

**4. Salvar e fechar**

### Verificar se a Chave Foi Configurada

**Windows (CMD):**
```cmd
echo %SUPABASE_SERVICE_KEY%
```

**Windows (PowerShell):**
```powershell
echo $env:SUPABASE_SERVICE_KEY
```

**Mac/Linux:**
```bash
echo $SUPABASE_SERVICE_KEY
```

**Deve exibir:** A chave completa (começando com `eyJ...`)

---

## Passo 4: Executar Script de Atualização de Veículos

### 4.1 - Garantir que está na pasta `demo/`

```bash
# Verificar pasta atual
pwd

# Deve mostrar algo como:
# C:\Users\SeuUsuario\Projetos\auto-track-car-value\demo
```

### 4.2 - Executar o Script

```bash
npx tsx update-vehicles-from-api.ts
```

**O que vai acontecer:**

1. Script inicia e mostra:
```
🚀 Iniciando atualização de veículos via API SUIV...

📊 Total de veículos a processar: 15
```

2. Para cada veículo, mostra progresso:
```
[1/15] Processando placa: ABC1234
  📋 Dados atuais: VOLKSWAGEN GOL (2020)
  ✅ Encontrado na API: VOLKSWAGEN GOL 1.0 FLEX (2019/2020)
  💾 Veículo atualizado com sucesso!
```

3. Ao final, mostra resumo:
```
✅ Sucesso: 15 veículos atualizados
⚠️ Não encontrados: 0 veículos
❌ Erros: 0 veículos
```

**⏱️ Tempo estimado:** 15-20 segundos (1 segundo entre cada veículo)

### 4.3 - Possíveis Problemas e Soluções

#### ❌ Erro: "SUPABASE_SERVICE_KEY não configurada"

**Causa:** Variável de ambiente não foi definida

**Solução:**
```bash
# Configurar novamente (escolher comando do seu sistema)
export SUPABASE_SERVICE_KEY="sua-chave-aqui"
```

#### ❌ Erro: "npx: command not found"

**Causa:** Node.js não está instalado

**Solução:**
1. Baixar Node.js: https://nodejs.org/
2. Instalar versão LTS (recomendada)
3. Reiniciar terminal
4. Verificar: `node --version`

#### ❌ Erro: "Cannot find module '@supabase/supabase-js'"

**Causa:** Dependências não foram instaladas

**Solução:**
```bash
cd demo
npm install
```

#### ❌ Erro: "401" da API SUIV

**Causa:** API Key da SUIV inválida no arquivo `.env` principal

**Solução:**
1. Abrir `.env` na raiz do projeto (não em `demo/`)
2. Verificar `VITE_CAR_API_KEY`
3. Garantir que está em uma única linha
4. Verificar se a chave está válida

---

## Passo 5: Executar Script de Popular Cache

**Só executar DEPOIS do Passo 4 ter sucesso!**

```bash
npx tsx populate-revisions-cache.ts
```

**O que vai acontecer:**

1. Script inicia:
```
🚀 Iniciando população de cache de revisões...

📊 Total de veículos sem cache: 15
```

2. Para cada veículo (4 chamadas de API):
```
[1/15] Placa: ABC1234
📋 Processando: VOLKSWAGEN GOL (2020)
  🔍 Buscando ID da marca...
  ✅ Marca ID: 59
  🔍 Buscando ID do modelo...
  ✅ Modelo ID: 4828
  🔍 Buscando ID da versão...
  ✅ Versão ID: 6543
  🔍 Buscando plano de revisão...
  ✅ 12 itens de revisão encontrados
  💾 Inserindo 45 revisões no banco...
  ✅ Cache de revisões populado com sucesso!
```

3. Resumo final:
```
✅ Sucesso: 15 veículos
❌ Erros: 0 veículos
```

**⏱️ Tempo estimado:** 8-10 minutos (2 segundos entre cada veículo + tempo de API)

**⚠️ IMPORTANTE:**
- NÃO interromper o script (deixar rodar até o fim)
- API pode demorar alguns segundos para responder
- Se falhar, pode executar novamente (pula veículos já processados)

---

## Passo 6: Vincular à Oficina (SQL)

### 6.1 - Abrir Supabase SQL Editor

1. Ir para: https://supabase.com/dashboard
2. Selecionar projeto
3. No menu lateral, clicar em **🔍 SQL Editor**
4. Clicar em **"New query"** (Nova consulta)

### 6.2 - Buscar ID da Oficina

Copiar e colar esta query:

```sql
SELECT
  w.id as workshop_id,
  w.name,
  p.email,
  p.full_name
FROM workshops w
JOIN profiles p ON p.id = w.owner_id
WHERE p.email = 'silva.mateush01@gmail.com';
```

Clicar em **"Run"** (Executar) ou pressionar `Ctrl+Enter`

**Resultado esperado:**
```
workshop_id                           | name              | email
--------------------------------------|-------------------|------------------------
12345678-1234-1234-1234-123456789012 | Oficina Silva     | silva.mateush01@gmail.com
```

**Copiar o `workshop_id` mostrado** (vai usar nas próximas queries)

### 6.3 - Criar Manutenções Antigas

Copiar esta query e **substituir `WORKSHOP_ID_AQUI`** pelo ID copiado:

```sql
-- Inserir manutenção antiga para cada veículo
INSERT INTO maintenances (vehicle_id, date, service_type, description, cost, km, created_by_workshop_id)
SELECT
  v.id,
  (now() - interval '12 months'), -- 12 meses atrás
  'Troca de óleo',
  'Manutenção básica',
  25000, -- R$ 250,00
  GREATEST(v.current_km - 10000, 0), -- 10.000 km atrás
  'WORKSHOP_ID_AQUI'::uuid
FROM vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM maintenances m WHERE m.vehicle_id = v.id
);
```

Clicar em **"Run"**

**Resultado esperado:**
```
Success. 15 rows inserted.
```

### 6.4 - Vincular Manutenções à Oficina

Copiar esta query e **substituir `WORKSHOP_ID_AQUI`**:

```sql
-- Vincular todas as manutenções à oficina
INSERT INTO workshop_maintenances (workshop_id, maintenance_id)
SELECT
  'WORKSHOP_ID_AQUI'::uuid,
  m.id
FROM maintenances m
WHERE NOT EXISTS (
  SELECT 1
  FROM workshop_maintenances wm
  WHERE wm.maintenance_id = m.id
  AND wm.workshop_id = 'WORKSHOP_ID_AQUI'::uuid
)
ON CONFLICT DO NOTHING;
```

Clicar em **"Run"**

**Resultado esperado:**
```
Success. 15 rows inserted.
```

### 6.5 - Verificar Vinculação

Copiar esta query e **substituir `WORKSHOP_ID_AQUI`**:

```sql
-- Contar manutenções vinculadas
SELECT COUNT(*) as total_maintenances
FROM workshop_maintenances
WHERE workshop_id = 'WORKSHOP_ID_AQUI'::uuid;
```

**Resultado esperado:**
```
total_maintenances
------------------
15
```

---

## Passo 7: Testar o Sistema! 🎉

### 7.1 - Fazer Login na Oficina

1. Ir para: https://www.vybo.com.br
2. Fazer login com: **silva.mateush01@gmail.com**
3. Usar sua senha normal

### 7.2 - Verificar Dashboard

Deve mostrar:
- ✅ Total de clientes
- ✅ Receita potencial
- ✅ Alertas (críticos, altos, médios)

### 7.3 - Ver Oportunidades

1. Clicar na aba **"Oportunidades"**
2. Deve listar todos os veículos com manutenções atrasadas
3. Ver valores de receita potencial
4. Testar filtros (criticidade, ordenação)

### 7.4 - Testar Busca por Placa

1. Ir para **"Novo Atendimento"**
2. Digitar uma placa dos veículos (ex: a que apareceu nos logs)
3. Sistema deve encontrar automaticamente
4. Mostrar marca, modelo, versão, ano estruturados

---

## 📋 Checklist de Verificação

Após executar tudo, verificar:

- [ ] Script update-vehicles rodou com sucesso (15/15 veículos)
- [ ] Script populate-cache rodou com sucesso (15/15 veículos)
- [ ] Manutenções criadas (15 rows inserted)
- [ ] Manutenções vinculadas (15 rows inserted)
- [ ] Login na oficina funciona
- [ ] Dashboard mostra dados
- [ ] Aba Oportunidades mostra clientes
- [ ] Receita potencial está calculada
- [ ] Busca por placa funciona
- [ ] Dados aparecem estruturados (marca, modelo, versão, ano)

---

## 🆘 Precisa de Ajuda?

### Se algo der errado:

1. **Copiar a mensagem de erro completa**
2. **Verificar qual passo falhou**
3. **Consultar seção de troubleshooting em `README_REAL_PLATES.md`**

### Erros Comuns:

| Erro | Solução |
|------|---------|
| "SUPABASE_SERVICE_KEY não configurada" | Configurar variável de ambiente novamente |
| "401" da API | Verificar VITE_CAR_API_KEY no .env |
| "Cannot find module" | Executar `npm install` na pasta demo |
| "npx: command not found" | Instalar Node.js |
| Oportunidades não aparecem | Verificar se executou Passo 6.3 e 6.4 |

---

## ✅ Pronto!

Se tudo funcionou, você agora tem:
- ✅ 15+ veículos com dados reais da API SUIV
- ✅ Cache de revisões populado (economia de 98%)
- ✅ Oficina demo com clientes vinculados
- ✅ Oportunidades de negócio calculadas
- ✅ Sistema pronto para demonstração!

**Sucesso!** 🎉

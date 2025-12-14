# 🎭 Ambiente de Demonstração - VYBO

Este diretório contém scripts e documentação para criar um ambiente completo de demonstração do sistema VYBO.

## 📦 Conteúdo

- **`DEMO_SETUP.sql`** - Script SQL para criar dados demo (veículos, manutenções, oficina)
- **`create-demo-users.ts`** - Script TypeScript para criar usuários demo via API
- **`CREDENCIAIS_DEMO.md`** - Documentação completa de todas as credenciais e informações

## 🚀 Guia Rápido de Configuração

### Pré-requisitos

1. ✅ Acesso ao painel do Supabase
2. ✅ Service Role Key do Supabase
3. ✅ Node.js instalado (para script de criação de usuários)
4. ✅ Migrations aplicadas:
   - `20251213000001_add_vehicle_revisions_cache.sql`
   - `20251213000002_add_year_fab_to_vehicles.sql`

### Passo 1: Criar Usuários

**Opção A: Via Script Automático (Recomendado)**

```bash
# Configurar Service Role Key
export SUPABASE_SERVICE_KEY="sua-service-role-key-aqui"

# Executar script
npx tsx demo/create-demo-users.ts
```

**Opção B: Via Painel do Supabase**

1. Ir para Authentication > Users
2. Clicar em "Add user" > "Create new user"
3. Criar cada usuário com:
   - E-mail: conforme lista em `CREDENCIAIS_DEMO.md`
   - Senha: `Demo@2024`
   - Auto Confirm: ✅ Sim

**Opção C: Via SQL (Mais Complexo)**

O script `DEMO_SETUP.sql` contém placeholders para as senhas. Você precisará:
1. Gerar hash de senha usando bcrypt
2. Substituir os placeholders no SQL
3. Executar o script completo

### Passo 2: Executar Script SQL

1. Abrir Supabase > SQL Editor
2. Criar nova query
3. Copiar conteúdo de `DEMO_SETUP.sql`
4. **IMPORTANTE:** Se criou usuários via Opção A ou B, remover a seção "ETAPA 2" e "ETAPA 3" do SQL
5. Executar apenas as seções:
   - ETAPA 1: Limpeza (se necessário)
   - ETAPA 4: Histórico de manutenções
   - ETAPA 5: Vincular à oficina

### Passo 3: Criar Oficina Manualmente

Como criamos os usuários via API, precisamos criar a oficina separadamente:

```sql
-- 1. Buscar ID do usuário da oficina
SELECT id FROM auth.users WHERE email = 'oficina.demo@vybo.app';

-- 2. Criar oficina (substituir USER_ID pelo retorno acima)
INSERT INTO workshops (
  owner_id,
  name,
  cnpj,
  address,
  city,
  state,
  monthly_vehicle_limit,
  current_month_vehicles
) VALUES (
  'USER_ID_AQUI',
  'Auto Center Demo',
  '12.345.678/0001-90',
  'Rua da Demonstração, 123',
  'São Paulo',
  'SP',
  100,
  15
);
```

### Passo 4: Criar Veículos e Manutenções

Execute as seções correspondentes do `DEMO_SETUP.sql`, mas ajustando os IDs dos usuários conforme foram criados.

**Dica:** É mais fácil fazer isso via interface do sistema:
1. Login como cada proprietário
2. Adicionar veículo (buscar pela placa na API SUIV)
3. Adicionar histórico de manutenções

### Passo 5: Popular Cache de Revisões

Para cada veículo, busque a placa pela API SUIV:
1. Sistema detectará automaticamente marca/modelo/ano
2. Cache de revisões será populado na primeira busca
3. Oportunidades serão calculadas automaticamente

## 📊 O Que Será Criado

### 1 Oficina Demo
- **Nome:** Auto Center Demo
- **Login:** oficina.demo@vybo.app
- **Clientes:** 15 proprietários vinculados

### 15 Proprietários
Cada um com:
- ✅ Veículo cadastrado
- ✅ Histórico de manutenções
- ✅ Diferentes níveis de atraso

### Distribuição de Status
- ✅ **EM DIA:** 6 veículos (40%)
- 🟡 **EM BREVE:** 3 veículos (20%)
- ⚠️ **ATRASADO:** 4 veículos (27%)
- 🔴 **CRÍTICO:** 2 veículos (13%)

## 🔑 Credenciais de Acesso

**Consultar:** `CREDENCIAIS_DEMO.md`

**Senha padrão:** `Demo@2024` (todas as contas)

## 🎯 Cenários de Demonstração

### 1. Dashboard da Oficina
- Total de clientes: 15
- Receita potencial: R$ XX.XXX
- Alertas críticos: 2
- Alertas altos: 4

### 2. Oportunidades de Negócio
- Listar clientes com manutenções atrasadas
- Filtrar por criticidade
- Ordenar por receita potencial
- Ver detalhes de cada oportunidade

### 3. Novo Atendimento
- Buscar cliente por placa
- Sistema identifica automaticamente marca/modelo/versão
- Cadastrar novo serviço
- Gerar comprovante

### 4. Perfil Proprietário
- Login como qualquer proprietário
- Ver alertas de manutenção
- Histórico completo
- Adicionar nova manutenção

## ⚠️ Importante

### Antes de Apresentar

1. ✅ Testar login de todas as contas
2. ✅ Verificar se oportunidades estão aparecendo
3. ✅ Confirmar que API SUIV está funcionando
4. ✅ Validar cálculos de receita potencial
5. ✅ Testar fluxo completo de novo atendimento

### Durante a Apresentação

**Destacar:**
- 🚀 Velocidade: busca automática por placa
- 💰 Economia: cache de API (98% redução de custos)
- 📊 Inteligência: cálculo automático de oportunidades
- 🎯 Praticidade: zero digitação manual
- 💼 Profissionalismo: interface moderna e intuitiva

### Após a Demonstração

Para limpar dados demo:
```sql
-- Executar seção "ETAPA 1: LIMPEZA" do DEMO_SETUP.sql
```

## 🔧 Troubleshooting

### Problema: Oportunidades não aparecem
**Solução:**
1. Verificar se veículos têm manutenções cadastradas
2. Confirmar que workshop_maintenances vincula oficina às manutenções
3. Checar se migrations de cache foram aplicadas

### Problema: API SUIV não funciona
**Solução:**
1. Verificar .env: `VITE_VEHICLE_API_MODE=plate`
2. Confirmar VITE_CAR_API_KEY configurada
3. Testar busca manual por placa

### Problema: Usuários não conseguem fazer login
**Solução:**
1. Verificar se usuário foi criado no auth.users
2. Confirmar que email_confirmed_at está preenchido
3. Resetar senha se necessário

### Problema: Veículos não aparecem
**Solução:**
1. Confirmar user_id correto na tabela vehicles
2. Verificar RLS policies
3. Checar se campo year_fab existe na tabela

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do console do navegador
2. Logs do Supabase (Logs > Postgres Logs)
3. Configuração das environment variables

## 📝 Notas

- Todos os dados são **fictícios** e para demonstração
- E-mails usam domínio `@vybo.app` (não existem)
- Placas foram geradas aleatoriamente
- Histórico de manutenções é simulado
- **NÃO USAR EM PRODUÇÃO**

---

**Versão:** 1.0
**Última atualização:** 2024-12-13

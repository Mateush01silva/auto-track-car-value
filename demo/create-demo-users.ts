/**
 * Script para criar usuários demo via Supabase Admin API
 *
 * USO:
 * 1. Instalar dependências: npm install @supabase/supabase-js
 * 2. Configurar SUPABASE_URL e SUPABASE_SERVICE_KEY
 * 3. Executar: npx tsx demo/create-demo-users.ts
 */

import { createClient } from '@supabase/supabase-js'

// Configuração - substituir pelos valores reais
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sqnoxtuzoccjstlzekhc.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '' // SERVICE ROLE KEY (não a anon key!)

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERRO: SUPABASE_SERVICE_KEY não configurada!')
  console.error('Configure a variável de ambiente SUPABASE_SERVICE_KEY com a Service Role Key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const DEMO_PASSWORD = 'Demo@2024'

interface DemoUser {
  email: string
  fullName: string
  phone: string
  role: 'owner' | 'workshop'
}

const demoUsers: DemoUser[] = [
  // Oficina
  {
    email: 'oficina.demo@vybo.app',
    fullName: 'Auto Center Demo',
    phone: '(11) 98765-4321',
    role: 'workshop'
  },
  // Proprietários
  {
    email: 'demo.joao@vybo.app',
    fullName: 'João Silva',
    phone: '(11) 91234-5678',
    role: 'owner'
  },
  {
    email: 'demo.maria@vybo.app',
    fullName: 'Maria Santos',
    phone: '(11) 92345-6789',
    role: 'owner'
  },
  {
    email: 'demo.pedro@vybo.app',
    fullName: 'Pedro Oliveira',
    phone: '(11) 93456-7890',
    role: 'owner'
  },
  {
    email: 'demo.ana@vybo.app',
    fullName: 'Ana Costa',
    phone: '(11) 94567-8901',
    role: 'owner'
  },
  {
    email: 'demo.carlos@vybo.app',
    fullName: 'Carlos Ferreira',
    phone: '(11) 95678-9012',
    role: 'owner'
  },
  {
    email: 'demo.juliana@vybo.app',
    fullName: 'Juliana Alves',
    phone: '(11) 96789-0123',
    role: 'owner'
  },
  {
    email: 'demo.roberto@vybo.app',
    fullName: 'Roberto Lima',
    phone: '(11) 97890-1234',
    role: 'owner'
  },
  {
    email: 'demo.fernanda@vybo.app',
    fullName: 'Fernanda Rocha',
    phone: '(11) 98901-2345',
    role: 'owner'
  },
  {
    email: 'demo.ricardo@vybo.app',
    fullName: 'Ricardo Souza',
    phone: '(11) 99012-3456',
    role: 'owner'
  },
  {
    email: 'demo.patricia@vybo.app',
    fullName: 'Patricia Mendes',
    phone: '(11) 91111-2222',
    role: 'owner'
  },
  {
    email: 'demo.marcos@vybo.app',
    fullName: 'Marcos Ribeiro',
    phone: '(11) 92222-3333',
    role: 'owner'
  },
  {
    email: 'demo.camila@vybo.app',
    fullName: 'Camila Martins',
    phone: '(11) 93333-4444',
    role: 'owner'
  },
  {
    email: 'demo.lucas@vybo.app',
    fullName: 'Lucas Carvalho',
    phone: '(11) 94444-5555',
    role: 'owner'
  },
  {
    email: 'demo.beatriz@vybo.app',
    fullName: 'Beatriz Dias',
    phone: '(11) 95555-6666',
    role: 'owner'
  },
  {
    email: 'demo.gustavo@vybo.app',
    fullName: 'Gustavo Nunes',
    phone: '(11) 96666-7777',
    role: 'owner'
  }
]

async function createDemoUsers() {
  console.log('🚀 Iniciando criação de usuários demo...\n')

  let successCount = 0
  let errorCount = 0

  for (const user of demoUsers) {
    try {
      console.log(`📝 Criando usuário: ${user.email}...`)

      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          phone: user.phone,
          role: user.role
        }
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado')
      }

      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: user.email,
          full_name: user.fullName,
          phone: user.phone,
          role: user.role
        })

      if (profileError) {
        // Se perfil já existe, atualizar
        if (profileError.code === '23505') { // Duplicate key
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: user.fullName,
              phone: user.phone,
              role: user.role
            })
            .eq('id', authData.user.id)

          if (updateError) {
            throw updateError
          }
          console.log(`   ✅ Usuário atualizado: ${user.email}`)
        } else {
          throw profileError
        }
      } else {
        console.log(`   ✅ Usuário criado: ${user.email}`)
      }

      successCount++
    } catch (error: any) {
      console.error(`   ❌ Erro ao criar ${user.email}:`, error.message)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Sucesso: ${successCount} usuários`)
  console.log(`❌ Erros: ${errorCount} usuários`)
  console.log('='.repeat(50))
  console.log(`\n🔑 Senha padrão: ${DEMO_PASSWORD}`)
  console.log('\n📋 Próximos passos:')
  console.log('1. Executar o script SQL demo/DEMO_SETUP.sql no Supabase')
  console.log('2. Verificar as credenciais em demo/CREDENCIAIS_DEMO.md')
  console.log('3. Fazer login e testar o sistema!\n')
}

// Executar
createDemoUsers()
  .then(() => {
    console.log('✨ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })

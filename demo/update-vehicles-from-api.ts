/**
 * Script para atualizar veículos existentes com dados da API SUIV
 *
 * Este script:
 * 1. Lê todos os veículos da tabela
 * 2. Para cada placa, consulta a API SUIV
 * 3. Atualiza brand, model, version, year, year_fab
 * 4. Marca revisions_fetched = false para forçar nova busca
 *
 * USO:
 * 1. Configurar variáveis de ambiente no .env
 * 2. Executar: npx tsx demo/update-vehicles-from-api.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Carregar .env do diretório raiz
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''
const CAR_API_URL = process.env.VITE_CAR_API_URL || ''
const CAR_API_KEY = process.env.VITE_CAR_API_KEY || ''

// Validações
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERRO: Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY')
  process.exit(1)
}

if (!CAR_API_URL || !CAR_API_KEY) {
  console.error('❌ ERRO: Configure VITE_CAR_API_URL e VITE_CAR_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface SuivVehicleResponse {
  maker: string
  model: string
  version?: string
  plate: string
  yearModel: number
  yearFab: number
  fuel: string
  vin?: string
  type?: string
  species?: string
  color?: string
  power?: number
  cubicCentimeters?: number
  seatCount?: number
}

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  version: string | null
  year: number
  year_fab: number | null
}

async function searchPlateInSuivApi(plate: string): Promise<SuivVehicleResponse | null> {
  const cleanPlate = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase()

  if (cleanPlate.length !== 7) {
    console.error(`  ⚠️ Placa inválida: ${plate} (length: ${cleanPlate.length})`)
    return null
  }

  const queryParams = new URLSearchParams({
    key: CAR_API_KEY,
    plate: cleanPlate,
    withFipe: 'false',
    searchOtherProviders: 'true',
  })

  const url = `${CAR_API_URL}/api/v4/VehicleInfo/byplate?${queryParams}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`  ❌ Erro na API SUIV (${response.status}):`, errorText.substring(0, 200))
      return null
    }

    const data: SuivVehicleResponse = await response.json()
    return data
  } catch (error) {
    console.error(`  ❌ Erro ao conectar com API SUIV:`, error instanceof Error ? error.message : error)
    return null
  }
}

async function updateVehiclesFromApi() {
  console.log('🚀 Iniciando atualização de veículos via API SUIV...\n')

  // Buscar todos os veículos
  const { data: vehicles, error: fetchError } = await supabase
    .from('vehicles')
    .select('id, plate, brand, model, version, year, year_fab')
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error('❌ Erro ao buscar veículos:', fetchError)
    process.exit(1)
  }

  if (!vehicles || vehicles.length === 0) {
    console.log('⚠️ Nenhum veículo encontrado no banco de dados.')
    process.exit(0)
  }

  console.log(`📊 Total de veículos a processar: ${vehicles.length}\n`)
  console.log('=' .repeat(70))

  let successCount = 0
  let errorCount = 0
  let notFoundCount = 0

  for (const [index, vehicle] of vehicles.entries()) {
    const vehicleData = vehicle as Vehicle
    console.log(`\n[${index + 1}/${vehicles.length}] Processando placa: ${vehicleData.plate}`)
    console.log(`  📋 Dados atuais: ${vehicleData.brand} ${vehicleData.model} (${vehicleData.year})`)

    // Buscar na API SUIV
    const apiData = await searchPlateInSuivApi(vehicleData.plate)

    if (!apiData) {
      console.log(`  ⚠️ Placa não encontrada na API SUIV ou erro na busca`)
      notFoundCount++

      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500))
      continue
    }

    console.log(`  ✅ Encontrado na API: ${apiData.maker} ${apiData.model} ${apiData.version || ''} (${apiData.yearFab}/${apiData.yearModel})`)

    // Atualizar veículo no banco
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        brand: apiData.maker,
        model: apiData.model,
        version: apiData.version || null,
        year: apiData.yearModel,
        year_fab: apiData.yearFab,
        revisions_fetched: false, // Forçar nova busca de revisões
        revisions_fetched_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleData.id)

    if (updateError) {
      console.error(`  ❌ Erro ao atualizar veículo:`, updateError.message)
      errorCount++
    } else {
      console.log(`  💾 Veículo atualizado com sucesso!`)
      successCount++
    }

    // Pausa entre requisições (respeitando rate limit da API)
    await new Promise(resolve => setTimeout(resolve, 1000)) // 1 segundo entre cada requisição
  }

  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMO DA ATUALIZAÇÃO:')
  console.log('='.repeat(70))
  console.log(`✅ Sucesso: ${successCount} veículos atualizados`)
  console.log(`⚠️ Não encontrados: ${notFoundCount} veículos`)
  console.log(`❌ Erros: ${errorCount} veículos`)
  console.log(`📋 Total processado: ${vehicles.length} veículos`)
  console.log('='.repeat(70))

  console.log('\n📋 Próximos passos:')
  console.log('1. Executar script de popular cache: npx tsx demo/populate-revisions-cache.ts')
  console.log('2. Vincular veículos à oficina como clientes')
  console.log('3. Testar login na oficina e verificar oportunidades\n')
}

// Executar
updateVehiclesFromApi()
  .then(() => {
    console.log('✨ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })

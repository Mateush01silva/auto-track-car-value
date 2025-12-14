/**
 * Script para popular cache de revisões de fabricante
 *
 * Este script:
 * 1. Busca veículos que não têm cache de revisões (revisions_fetched = false)
 * 2. Para cada veículo, consulta API SUIV para obter plano de revisão
 * 3. Salva revisões na tabela vehicle_manufacturer_revisions
 * 4. Marca revisions_fetched = true
 *
 * USO:
 * 1. Primeiro execute update-vehicles-from-api.ts
 * 2. Configure variáveis de ambiente no .env
 * 3. Executar: npx tsx demo/populate-revisions-cache.ts
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

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  revisions_fetched: boolean
}

interface ChangedPart {
  nicknameId: number
  setId: number
  setDescription: string
  description: string
  amount: number
}

interface Inspection {
  description: string
  inspectionId: number
}

interface RevisionPlanItem {
  kilometers: number
  months: number
  parcels: number
  durationMinutes: number
  fullPrice: number | null
  parcelPrice: number | null
  changedParts: ChangedPart[]
  inspections: Inspection[]
}

async function requestWithRetry<T>(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        if (response.status === 404) {
          // Não encontrado - não vale a pena tentar novamente
          return null
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`  ❌ Falhou após ${maxRetries} tentativas:`, error instanceof Error ? error.message : error)
        return null
      }
      const delay = Math.pow(2, attempt) * 1000 // Backoff exponencial
      console.log(`  ⚠️ Tentativa ${attempt} falhou, aguardando ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return null
}

async function getMakerId(brand: string): Promise<number | null> {
  const url = `${CAR_API_URL}/api/v4/Makers?key=${CAR_API_KEY}`

  interface Maker {
    id: number
    description: string
  }

  const makers = await requestWithRetry<Maker[]>(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  if (!makers) return null

  const maker = makers.find(m =>
    m.description.toUpperCase() === brand.toUpperCase()
  )

  return maker?.id || null
}

async function getModelId(makerId: number, model: string): Promise<number | null> {
  const url = `${CAR_API_URL}/api/v4/Models?key=${CAR_API_KEY}&makerId=${makerId}`

  interface Model {
    id: number
    description: string
  }

  const models = await requestWithRetry<Model[]>(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  if (!models) return null

  // Busca aproximada por substring
  const foundModel = models.find(m =>
    m.description.toUpperCase().includes(model.toUpperCase())
  )

  return foundModel?.id || null
}

async function getVersionId(modelId: number, year: number): Promise<number | null> {
  const url = `${CAR_API_URL}/api/v4/Versions?key=${CAR_API_KEY}&modelId=${modelId}`

  interface Version {
    id: number
    description: string
    startingYear: number
    endingYear: number
  }

  const versions = await requestWithRetry<Version[]>(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  if (!versions) return null

  const version = versions.find(v =>
    v.startingYear <= year && v.endingYear >= year
  )

  return version?.id || null
}

async function getRevisionPlan(versionId: number, year: number): Promise<RevisionPlanItem[]> {
  const url = `${CAR_API_URL}/api/v4/RevisionPlan?key=${CAR_API_KEY}&versionId=${versionId}&year=${year}`

  const plan = await requestWithRetry<RevisionPlanItem[]>(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  return plan || []
}

function estimateCriticality(category: string): 'Crítica' | 'Alta' | 'Média' | 'Baixa' {
  const lowerCategory = category.toLowerCase()

  if (lowerCategory.includes('motor') || lowerCategory.includes('freio')) {
    return 'Crítica'
  }
  if (lowerCategory.includes('combustível') || lowerCategory.includes('óleo')) {
    return 'Alta'
  }
  if (lowerCategory.includes('filtro')) {
    return 'Média'
  }
  return 'Baixa'
}

async function populateRevisionsForVehicle(vehicle: Vehicle): Promise<boolean> {
  console.log(`\n📋 Processando: ${vehicle.brand} ${vehicle.model} (${vehicle.year})`)

  // Passo 1: Buscar ID da marca
  console.log('  🔍 Buscando ID da marca...')
  const makerId = await getMakerId(vehicle.brand)
  if (!makerId) {
    console.log(`  ❌ Marca "${vehicle.brand}" não encontrada`)
    return false
  }
  console.log(`  ✅ Marca ID: ${makerId}`)

  // Passo 2: Buscar ID do modelo
  console.log('  🔍 Buscando ID do modelo...')
  const modelId = await getModelId(makerId, vehicle.model)
  if (!modelId) {
    console.log(`  ❌ Modelo "${vehicle.model}" não encontrado`)
    return false
  }
  console.log(`  ✅ Modelo ID: ${modelId}`)

  // Passo 3: Buscar ID da versão
  console.log('  🔍 Buscando ID da versão...')
  const versionId = await getVersionId(modelId, vehicle.year)
  if (!versionId) {
    console.log(`  ❌ Versão não encontrada para ano ${vehicle.year}`)
    return false
  }
  console.log(`  ✅ Versão ID: ${versionId}`)

  // Passo 4: Buscar plano de revisão
  console.log('  🔍 Buscando plano de revisão...')
  const revisionPlan = await getRevisionPlan(versionId, vehicle.year)
  if (!revisionPlan || revisionPlan.length === 0) {
    console.log('  ⚠️ Nenhum plano de revisão encontrado')
    // Ainda assim marcar como fetched para não tentar novamente
    await supabase
      .from('vehicles')
      .update({
        revisions_fetched: true,
        revisions_fetched_at: new Date().toISOString()
      })
      .eq('id', vehicle.id)
    return true
  }

  console.log(`  ✅ ${revisionPlan.length} itens de revisão encontrados`)

  // Converter para formato do banco
  const revisionsToInsert: any[] = []

  for (const item of revisionPlan) {
    // Adicionar peças
    for (const part of item.changedParts) {
      revisionsToInsert.push({
        vehicle_id: vehicle.id,
        category: part.setDescription,
        item: part.description,
        description: `Troca de ${part.description} (${part.amount}x)`,
        km_interval: item.kilometers,
        time_interval: item.months,
        type: 'Preventiva',
        criticality: estimateCriticality(part.setDescription),
        min_cost: item.fullPrice ? item.fullPrice * 0.8 : 0,
        max_cost: item.fullPrice || 0,
        estimated_time: item.durationMinutes || 60,
        source: 'suiv'
      })
    }

    // Adicionar inspeções
    for (const inspection of item.inspections) {
      revisionsToInsert.push({
        vehicle_id: vehicle.id,
        category: 'Inspeção',
        item: inspection.description,
        description: `Inspeção: ${inspection.description}`,
        km_interval: item.kilometers,
        time_interval: item.months,
        type: 'Preventiva',
        criticality: 'Baixa',
        min_cost: 0,
        max_cost: 0,
        estimated_time: item.durationMinutes || 30,
        source: 'suiv'
      })
    }
  }

  if (revisionsToInsert.length === 0) {
    console.log('  ⚠️ Nenhuma revisão para inserir')
    await supabase
      .from('vehicles')
      .update({
        revisions_fetched: true,
        revisions_fetched_at: new Date().toISOString()
      })
      .eq('id', vehicle.id)
    return true
  }

  // Inserir no banco
  console.log(`  💾 Inserindo ${revisionsToInsert.length} revisões no banco...`)
  const { error: insertError } = await supabase
    .from('vehicle_manufacturer_revisions')
    .insert(revisionsToInsert)

  if (insertError) {
    console.error('  ❌ Erro ao inserir revisões:', insertError.message)
    return false
  }

  // Marcar como fetched
  const { error: updateError } = await supabase
    .from('vehicles')
    .update({
      revisions_fetched: true,
      revisions_fetched_at: new Date().toISOString()
    })
    .eq('id', vehicle.id)

  if (updateError) {
    console.error('  ❌ Erro ao atualizar flag:', updateError.message)
    return false
  }

  console.log('  ✅ Cache de revisões populado com sucesso!')
  return true
}

async function populateRevisionsCache() {
  console.log('🚀 Iniciando população de cache de revisões...\n')

  // Buscar veículos sem cache
  const { data: vehicles, error: fetchError } = await supabase
    .from('vehicles')
    .select('id, plate, brand, model, year, revisions_fetched')
    .or('revisions_fetched.is.null,revisions_fetched.eq.false')
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error('❌ Erro ao buscar veículos:', fetchError)
    process.exit(1)
  }

  if (!vehicles || vehicles.length === 0) {
    console.log('✅ Todos os veículos já têm cache de revisões!')
    process.exit(0)
  }

  console.log(`📊 Total de veículos sem cache: ${vehicles.length}\n`)
  console.log('='.repeat(70))

  let successCount = 0
  let errorCount = 0

  for (const [index, vehicle] of vehicles.entries()) {
    const vehicleData = vehicle as Vehicle
    console.log(`\n[${index + 1}/${vehicles.length}] Placa: ${vehicleData.plate}`)

    const success = await populateRevisionsForVehicle(vehicleData)

    if (success) {
      successCount++
    } else {
      errorCount++
    }

    // Pausa entre requisições (respeitando rate limit)
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2 segundos
  }

  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMO DA POPULAÇÃO DE CACHE:')
  console.log('='.repeat(70))
  console.log(`✅ Sucesso: ${successCount} veículos`)
  console.log(`❌ Erros: ${errorCount} veículos`)
  console.log(`📋 Total processado: ${vehicles.length} veículos`)
  console.log('='.repeat(70))

  console.log('\n📋 Próximos passos:')
  console.log('1. Vincular veículos à oficina silva.mateush01@gmail.com')
  console.log('2. Fazer login na oficina e verificar aba Oportunidades')
  console.log('3. Verificar cálculos de receita potencial\n')
}

// Executar
populateRevisionsCache()
  .then(() => {
    console.log('✨ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })

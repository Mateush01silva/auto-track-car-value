export interface MaintenanceSubcategory {
  value: string;
  label: string;
}

export interface MaintenanceCategory {
  value: string;
  label: string;
  subcategories: MaintenanceSubcategory[];
}

export const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
  {
    value: "motor",
    label: "Motor",
    subcategories: [
      { value: "troca_oleo", label: "Troca de óleo" },
      { value: "filtro_oleo", label: "Filtro de óleo" },
      { value: "filtro_ar", label: "Filtro de ar" },
      { value: "filtro_combustivel", label: "Filtro de combustível" },
      { value: "velas", label: "Velas de ignição" },
      { value: "correia_dentada", label: "Correia dentada" },
      { value: "correia_acessorios", label: "Correia de acessórios" },
      { value: "bomba_agua", label: "Bomba d'água" },
      { value: "valvulas", label: "Válvulas" },
      { value: "junta_cabecote", label: "Junta do cabeçote" },
      { value: "radiador", label: "Radiador" },
      { value: "termostato", label: "Termostato" },
      { value: "sensor_motor", label: "Sensores do motor" },
      { value: "turbina", label: "Turbina" },
      { value: "retifica_motor", label: "Retífica do motor" },
      { value: "outros_motor", label: "Outros - Motor" },
    ],
  },
  {
    value: "suspensao",
    label: "Suspensão",
    subcategories: [
      { value: "amortecedor", label: "Amortecedor" },
      { value: "mola", label: "Mola" },
      { value: "coxim", label: "Coxim" },
      { value: "bieleta", label: "Bieleta" },
      { value: "bandeja", label: "Bandeja" },
      { value: "pivô", label: "Pivô" },
      { value: "buchas_suspensao", label: "Buchas da suspensão" },
      { value: "barra_estabilizadora", label: "Barra estabilizadora" },
      { value: "terminal_direcao", label: "Terminal de direção" },
      { value: "caixa_direcao", label: "Caixa de direção" },
      { value: "bomba_direcao", label: "Bomba de direção" },
      { value: "outros_suspensao", label: "Outros - Suspensão" },
    ],
  },
  {
    value: "freios",
    label: "Freios",
    subcategories: [
      { value: "pastilhas", label: "Pastilhas de freio" },
      { value: "discos", label: "Discos de freio" },
      { value: "lonas", label: "Lonas de freio" },
      { value: "tambor", label: "Tambor de freio" },
      { value: "cilindro_roda", label: "Cilindro de roda" },
      { value: "cilindro_mestre", label: "Cilindro mestre" },
      { value: "servo_freio", label: "Servo freio" },
      { value: "fluido_freio", label: "Fluido de freio" },
      { value: "abs", label: "Sistema ABS" },
      { value: "freio_mao", label: "Freio de mão" },
      { value: "outros_freios", label: "Outros - Freios" },
    ],
  },
  {
    value: "transmissao",
    label: "Transmissão",
    subcategories: [
      { value: "embreagem", label: "Kit embreagem completo" },
      { value: "disco_embreagem", label: "Disco de embreagem" },
      { value: "platô", label: "Platô" },
      { value: "rolamento_embreagem", label: "Rolamento de embreagem" },
      { value: "cabo_embreagem", label: "Cabo de embreagem" },
      { value: "cambio", label: "Câmbio" },
      { value: "oleo_cambio", label: "Óleo do câmbio" },
      { value: "semi_eixo", label: "Semi-eixo" },
      { value: "junta_homocinética", label: "Junta homocinética" },
      { value: "diferencial", label: "Diferencial" },
      { value: "cardan", label: "Cardan" },
      { value: "outros_transmissao", label: "Outros - Transmissão" },
    ],
  },
  {
    value: "eletrico",
    label: "Elétrico",
    subcategories: [
      { value: "bateria", label: "Bateria" },
      { value: "alternador", label: "Alternador" },
      { value: "motor_arranque", label: "Motor de arranque" },
      { value: "vela_aquecimento", label: "Vela de aquecimento (diesel)" },
      { value: "bobina", label: "Bobina de ignição" },
      { value: "modulo_injecao", label: "Módulo de injeção" },
      { value: "sensores", label: "Sensores elétricos" },
      { value: "chicote_eletrico", label: "Chicote elétrico" },
      { value: "fusivel", label: "Fusíveis" },
      { value: "rele", label: "Relés" },
      { value: "farol", label: "Farol" },
      { value: "lanterna", label: "Lanterna" },
      { value: "lampadas", label: "Lâmpadas" },
      { value: "vidro_eletrico", label: "Vidro elétrico" },
      { value: "trava_eletrica", label: "Trava elétrica" },
      { value: "alarme", label: "Alarme" },
      { value: "outros_eletrico", label: "Outros - Elétrico" },
    ],
  },
  {
    value: "ar_condicionado",
    label: "Ar Condicionado",
    subcategories: [
      { value: "gas_ar", label: "Recarga de gás" },
      { value: "compressor_ar", label: "Compressor" },
      { value: "condensador", label: "Condensador" },
      { value: "evaporador", label: "Evaporador" },
      { value: "filtro_ar_condicionado", label: "Filtro do ar condicionado" },
      { value: "higienizacao_ar", label: "Higienização" },
      { value: "correia_compressor", label: "Correia do compressor" },
      { value: "sensor_ar", label: "Sensores do ar condicionado" },
      { value: "outros_ar", label: "Outros - Ar Condicionado" },
    ],
  },
  {
    value: "pneus_rodas",
    label: "Pneus e Rodas",
    subcategories: [
      { value: "pneus", label: "Pneus" },
      { value: "alinhamento", label: "Alinhamento" },
      { value: "balanceamento", label: "Balanceamento" },
      { value: "geometria", label: "Geometria" },
      { value: "rodas", label: "Rodas" },
      { value: "calotas", label: "Calotas" },
      { value: "valvula_pneu", label: "Válvula do pneu" },
      { value: "remendo_pneu", label: "Remendo de pneu" },
      { value: "outros_pneus", label: "Outros - Pneus e Rodas" },
    ],
  },
  {
    value: "escapamento",
    label: "Escapamento",
    subcategories: [
      { value: "coletor", label: "Coletor de escape" },
      { value: "catalisador", label: "Catalisador" },
      { value: "silenciador", label: "Silenciador" },
      { value: "ponteira", label: "Ponteira" },
      { value: "tubo_escape", label: "Tubo de escape" },
      { value: "junta_escape", label: "Junta de escape" },
      { value: "suporte_escape", label: "Suporte de escape" },
      { value: "outros_escapamento", label: "Outros - Escapamento" },
    ],
  },
  {
    value: "carroceria",
    label: "Carroceria e Pintura",
    subcategories: [
      { value: "pintura", label: "Pintura" },
      { value: "funilaria", label: "Funilaria" },
      { value: "polimento", label: "Polimento" },
      { value: "para_choque", label: "Para-choque" },
      { value: "para_lama", label: "Para-lama" },
      { value: "capo", label: "Capô" },
      { value: "porta", label: "Porta" },
      { value: "vidros", label: "Vidros" },
      { value: "retrovisores", label: "Retrovisores" },
      { value: "borrachas", label: "Borrachas" },
      { value: "outros_carroceria", label: "Outros - Carroceria" },
    ],
  },
  {
    value: "interior",
    label: "Interior",
    subcategories: [
      { value: "estofamento", label: "Estofamento" },
      { value: "painel", label: "Painel" },
      { value: "tapetes", label: "Tapetes" },
      { value: "volante", label: "Volante" },
      { value: "bancos", label: "Bancos" },
      { value: "cinto_seguranca", label: "Cinto de segurança" },
      { value: "air_bag", label: "Air bag" },
      { value: "forro_teto", label: "Forro do teto" },
      { value: "higienizacao_interior", label: "Higienização interna" },
      { value: "outros_interior", label: "Outros - Interior" },
    ],
  },
  {
    value: "revisao",
    label: "Revisões",
    subcategories: [
      { value: "revisao_periodica", label: "Revisão periódica" },
      { value: "revisao_10000", label: "Revisão 10.000 km" },
      { value: "revisao_20000", label: "Revisão 20.000 km" },
      { value: "revisao_30000", label: "Revisão 30.000 km" },
      { value: "revisao_40000", label: "Revisão 40.000 km" },
      { value: "revisao_50000", label: "Revisão 50.000 km" },
      { value: "revisao_60000", label: "Revisão 60.000 km" },
      { value: "pre_viagem", label: "Revisão pré-viagem" },
      { value: "inspecao_geral", label: "Inspeção geral" },
      { value: "outros_revisao", label: "Outros - Revisões" },
    ],
  },
  {
    value: "outros",
    label: "Outros Serviços",
    subcategories: [
      { value: "lavagem", label: "Lavagem" },
      { value: "cristalizacao", label: "Cristalização" },
      { value: "descontaminacao", label: "Descontaminação de pintura" },
      { value: "guincho", label: "Guincho" },
      { value: "vistoria", label: "Vistoria" },
      { value: "documentacao", label: "Documentação" },
      { value: "instalacao_acessorios", label: "Instalação de acessórios" },
      { value: "diagnostico", label: "Diagnóstico" },
      { value: "outros_servicos", label: "Outros serviços" },
    ],
  },
];

export const getSubcategoriesByCategory = (categoryValue: string): MaintenanceSubcategory[] => {
  const category = MAINTENANCE_CATEGORIES.find(cat => cat.value === categoryValue);
  return category?.subcategories || [];
};

export const getCategoryLabel = (categoryValue: string): string => {
  const category = MAINTENANCE_CATEGORIES.find(cat => cat.value === categoryValue);
  return category?.label || categoryValue;
};

export const getSubcategoryLabel = (categoryValue: string, subcategoryValue: string): string => {
  const category = MAINTENANCE_CATEGORIES.find(cat => cat.value === categoryValue);
  const subcategory = category?.subcategories.find(sub => sub.value === subcategoryValue);
  return subcategory?.label || subcategoryValue;
};

export const getFullServiceLabel = (categoryValue: string, subcategoryValue: string): string => {
  return `${getCategoryLabel(categoryValue)} - ${getSubcategoryLabel(categoryValue, subcategoryValue)}`;
};

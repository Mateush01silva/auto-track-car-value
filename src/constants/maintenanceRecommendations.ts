export interface MaintenanceRecommendation {
  category: string;
  item: string;
  description: string;
  kmInterval: number | null; // em km
  timeInterval: number | null; // em meses
  type: "Preventiva" | "Corretiva";
}

export const MAINTENANCE_RECOMMENDATIONS: MaintenanceRecommendation[] = [
  // Motor
  { category: "Motor", item: "Troca de óleo", description: "Substituir o óleo do motor para garantir lubrificação e durabilidade.", kmInterval: 10000, timeInterval: 6, type: "Preventiva" },
  { category: "Motor", item: "Filtro de óleo", description: "Trocar junto com o óleo do motor.", kmInterval: 10000, timeInterval: 6, type: "Preventiva" },
  { category: "Motor", item: "Filtro de ar", description: "Substituir para manter eficiência do motor e consumo ideal.", kmInterval: 15000, timeInterval: 12, type: "Preventiva" },
  { category: "Motor", item: "Filtro de combustível", description: "Evita impurezas no sistema de injeção.", kmInterval: 20000, timeInterval: 12, type: "Preventiva" },
  { category: "Motor", item: "Correia dentada", description: "Inspecionar e substituir conforme desgaste ou prazo.", kmInterval: 50000, timeInterval: 36, type: "Preventiva" },
  { category: "Motor", item: "Velas de ignição", description: "Trocar para manter o bom desempenho e consumo.", kmInterval: 30000, timeInterval: 24, type: "Preventiva" },
  
  // Suspensão
  { category: "Suspensão", item: "Amortecedores", description: "Verificar vazamentos e eficiência de amortecimento.", kmInterval: 40000, timeInterval: 36, type: "Preventiva" },
  { category: "Suspensão", item: "Buchas e coxins", description: "Inspecionar e substituir se houver desgaste.", kmInterval: 30000, timeInterval: 24, type: "Corretiva" },
  { category: "Suspensão", item: "Molas helicoidais", description: "Verificar deformações ou quebras.", kmInterval: 60000, timeInterval: 48, type: "Preventiva" },
  { category: "Suspensão", item: "Pivôs e bandejas", description: "Inspecionar folgas e substituições conforme desgaste.", kmInterval: 30000, timeInterval: 24, type: "Preventiva" },
  
  // Freios
  { category: "Freios", item: "Pastilhas de freio", description: "Verificar espessura e substituir quando necessário.", kmInterval: 20000, timeInterval: 12, type: "Preventiva" },
  { category: "Freios", item: "Discos de freio", description: "Substituir conforme desgaste e vibrações.", kmInterval: 40000, timeInterval: 24, type: "Preventiva" },
  { category: "Freios", item: "Fluido de freio", description: "Substituir completamente para manter eficiência.", kmInterval: 30000, timeInterval: 24, type: "Preventiva" },
  { category: "Freios", item: "Freio de mão", description: "Regular e verificar cabos.", kmInterval: 20000, timeInterval: 12, type: "Preventiva" },
  
  // Transmissão
  { category: "Transmissão", item: "Óleo da transmissão", description: "Substituir conforme especificações do fabricante.", kmInterval: 60000, timeInterval: 48, type: "Preventiva" },
  { category: "Transmissão", item: "Embreagem", description: "Verificar desgaste e patinação.", kmInterval: 70000, timeInterval: 60, type: "Corretiva" },
  { category: "Transmissão", item: "Cabos e acionamentos", description: "Lubrificar e ajustar se necessário.", kmInterval: 30000, timeInterval: 24, type: "Preventiva" },
  
  // Elétrico
  { category: "Elétrico", item: "Bateria", description: "Verificar carga e oxidação nos terminais.", kmInterval: 40000, timeInterval: 24, type: "Preventiva" },
  { category: "Elétrico", item: "Alternador", description: "Checar tensão de carga e correia.", kmInterval: 60000, timeInterval: 48, type: "Preventiva" },
  { category: "Elétrico", item: "Faróis e lâmpadas", description: "Verificar funcionamento e alinhar faróis.", kmInterval: 10000, timeInterval: 6, type: "Preventiva" },
  
  // Ar condicionado
  { category: "Ar condicionado", item: "Filtro de cabine", description: "Substituir para manter qualidade do ar interno.", kmInterval: 15000, timeInterval: 12, type: "Preventiva" },
  { category: "Ar condicionado", item: "Carga de gás", description: "Verificar e completar se necessário.", kmInterval: 30000, timeInterval: 24, type: "Preventiva" },
  { category: "Ar condicionado", item: "Compressor", description: "Inspecionar ruídos e vazamentos.", kmInterval: 50000, timeInterval: 36, type: "Preventiva" },
  
  // Pneus e Rodas
  { category: "Pneus e Rodas", item: "Calibragem", description: "Verificar pressão dos pneus regularmente.", kmInterval: 1000, timeInterval: 0.5, type: "Preventiva" },
  { category: "Pneus e Rodas", item: "Rodízio de pneus", description: "Trocar a posição dos pneus para desgaste uniforme.", kmInterval: 10000, timeInterval: 6, type: "Preventiva" },
  { category: "Pneus e Rodas", item: "Balanceamento", description: "Executar para evitar vibrações.", kmInterval: 10000, timeInterval: 6, type: "Preventiva" },
  { category: "Pneus e Rodas", item: "Alinhamento", description: "Ajustar o alinhamento da direção.", kmInterval: 10000, timeInterval: 6, type: "Preventiva" },
  
  // Escapamento
  { category: "Escapamento", item: "Silencioso e catalisador", description: "Verificar vazamentos e ferrugem.", kmInterval: 40000, timeInterval: 36, type: "Preventiva" },
  { category: "Escapamento", item: "Fixações e suportes", description: "Verificar travas e borrachas de sustentação.", kmInterval: 30000, timeInterval: 24, type: "Preventiva" },
  
  // Carroceria e Pintura
  { category: "Carroceria e Pintura", item: "Polimento", description: "Aplicar para manter brilho e proteger pintura.", kmInterval: null, timeInterval: 12, type: "Preventiva" },
  { category: "Carroceria e Pintura", item: "Verificação de ferrugem", description: "Inspecionar e corrigir pontos de oxidação.", kmInterval: null, timeInterval: 12, type: "Preventiva" },
  { category: "Carroceria e Pintura", item: "Lavagem e enceramento", description: "Recomendada regularmente para preservar a pintura.", kmInterval: null, timeInterval: 1, type: "Preventiva" },
  
  // Revisões
  { category: "Revisões", item: "Revisão básica", description: "Verificação geral de fluidos, filtros e freios.", kmInterval: 10000, timeInterval: 6, type: "Preventiva" },
  { category: "Revisões", item: "Revisão intermediária", description: "Inclui itens adicionais como suspensão e direção.", kmInterval: 20000, timeInterval: 12, type: "Preventiva" },
  { category: "Revisões", item: "Revisão completa", description: "Verificação de todos os sistemas do veículo.", kmInterval: 40000, timeInterval: 24, type: "Preventiva" },
  
  // Interior
  { category: "Interior", item: "Limpeza interna", description: "Aspiração e limpeza dos bancos e tapetes.", kmInterval: null, timeInterval: 3, type: "Preventiva" },
  { category: "Interior", item: "Lubrificação de trilhos e dobradiças", description: "Evita ruídos e travamentos.", kmInterval: 20000, timeInterval: 12, type: "Preventiva" },
  { category: "Interior", item: "Verificação de cintos de segurança", description: "Inspecionar o funcionamento do retrator e travas.", kmInterval: 30000, timeInterval: 24, type: "Preventiva" },
  
  // Outros Serviços
  { category: "Outros Serviços", item: "Alinhamento dos faróis", description: "Verificar direção do facho de luz.", kmInterval: 10000, timeInterval: 6, type: "Preventiva" },
  { category: "Outros Serviços", item: "Limpeza do sistema de injeção", description: "Realizar limpeza para evitar falhas.", kmInterval: 40000, timeInterval: 36, type: "Preventiva" },
  { category: "Outros Serviços", item: "Verificação geral de segurança", description: "Checklist completo de segurança e funcionamento.", kmInterval: 10000, timeInterval: 6, type: "Preventiva" },
];

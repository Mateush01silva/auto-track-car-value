export interface MaintenanceRecommendation {
  category: string;
  item: string;
  description: string;
  kmInterval: number | null; // em km
  timeInterval: number | null; // em meses
  type: "Preventiva" | "Corretiva";
  criticidade: "Crítica" | "Alta" | "Média" | "Baixa";
  custoMinimo: number; // em reais
  custoMaximo: number; // em reais
}

export const MAINTENANCE_RECOMMENDATIONS: MaintenanceRecommendation[] = [
  // Motor
  { category: "Motor", item: "Troca de óleo do motor", description: "Substituir óleo do motor conforme especificação do fabricante. Lubrificação essencial para vida útil do motor.", kmInterval: 10000, timeInterval: 6, type: "Preventiva", criticidade: "Alta", custoMinimo: 150, custoMaximo: 300 },
  { category: "Motor", item: "Filtro de óleo", description: "Trocar filtro junto com óleo. Remove impurezas e partículas metálicas protegendo componentes internos.", kmInterval: 10000, timeInterval: 6, type: "Preventiva", criticidade: "Alta", custoMinimo: 80, custoMaximo: 150 },
  { category: "Motor", item: "Filtro de ar do motor", description: "Garantir entrada de ar limpo. Filtro sujo reduz potência em até 10% e aumenta consumo.", kmInterval: 15000, timeInterval: 12, type: "Preventiva", criticidade: "Média", custoMinimo: 60, custoMaximo: 120 },
  { category: "Motor", item: "Filtro de combustível", description: "Filtrar combustível antes da injeção. Protege bicos injetores e bomba de combustível.", kmInterval: 20000, timeInterval: 12, type: "Preventiva", criticidade: "Média", custoMinimo: 80, custoMaximo: 200 },
  { category: "Motor", item: "Correia dentada", description: "Inspecionar tensão e estado. Substituir preventivamente. Ruptura causa danos catastróficos ao motor.", kmInterval: 60000, timeInterval: 60, type: "Preventiva", criticidade: "Crítica", custoMinimo: 800, custoMaximo: 1500 },
  { category: "Motor", item: "Velas de ignição", description: "Manter ignição eficiente. Velas gastas causam falhas, aumento de consumo e perda de potência.", kmInterval: 30000, timeInterval: 24, type: "Preventiva", criticidade: "Média", custoMinimo: 200, custoMaximo: 400 },
  { category: "Motor", item: "Líquido de arrefecimento", description: "Verificar nível, cor e concentração. Sistema de arrefecimento previne superaquecimento.", kmInterval: 20000, timeInterval: 24, type: "Preventiva", criticidade: "Média", custoMinimo: 100, custoMaximo: 200 },
  { category: "Motor", item: "Correias auxiliares", description: "Verificar correias do alternador, ar condicionado e direção. Ruptura causa pane elétrica e mecânica.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Média", custoMinimo: 150, custoMaximo: 350 },
  { category: "Motor", item: "Filtro de ar condicionado (cabine)", description: "Filtrar ar do interior. Remove pólen, poeira e poluentes. Melhora qualidade do ar e eficiência do AC.", kmInterval: 15000, timeInterval: 12, type: "Preventiva", criticidade: "Baixa", custoMinimo: 50, custoMaximo: 150 },
  { category: "Motor", item: "Bomba d'água", description: "Inspecionar vazamentos e ruídos. Bomba defeituosa causa superaquecimento do motor.", kmInterval: 60000, timeInterval: 60, type: "Corretiva", criticidade: "Alta", custoMinimo: 600, custoMaximo: 1200 },
  { category: "Motor", item: "Tensor da correia", description: "Verificar desgaste e tensionamento. Tensor defeituoso causa folga nas correias.", kmInterval: 60000, timeInterval: 60, type: "Preventiva", criticidade: "Média", custoMinimo: 200, custoMaximo: 400 },
  { category: "Motor", item: "Válvula PCV", description: "Recircular gases do cárter. Válvula entupida causa consumo de óleo e falhas no motor.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Média", custoMinimo: 100, custoMaximo: 250 },
  { category: "Motor", item: "Limpeza do corpo de borboletas", description: "Remover depósitos de carbono. Melhora resposta do acelerador e marcha lenta.", kmInterval: 30000, timeInterval: 24, type: "Preventiva", criticidade: "Baixa", custoMinimo: 150, custoMaximo: 300 },

  // Suspensão
  { category: "Suspensão", item: "Amortecedores", description: "Testar eficiência (veículo não deve balançar mais de 2x). Amortecedores gastos comprometem segurança.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Alta", custoMinimo: 1200, custoMaximo: 2500 },
  { category: "Suspensão", item: "Buchas e coxins", description: "Inspecionar desgaste e folgas em buchas da suspensão. Causam ruídos e desalinhamento.", kmInterval: 40000, timeInterval: 36, type: "Corretiva", criticidade: "Média", custoMinimo: 300, custoMaximo: 800 },
  { category: "Suspensão", item: "Molas helicoidais", description: "Verificar deformações, trincas e perda de altura. Molas fracas afetam estabilidade.", kmInterval: 80000, timeInterval: 60, type: "Corretiva", criticidade: "Média", custoMinimo: 400, custoMaximo: 900 },
  { category: "Suspensão", item: "Pivôs e bandejas", description: "Inspecionar folgas em pivôs, bandejas e braços. Desgaste compromete geometria da suspensão.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Alta", custoMinimo: 500, custoMaximo: 1200 },
  { category: "Suspensão", item: "Barra estabilizadora", description: "Verificar buchas e fixações. Barra estabilizadora reduz rolagem em curvas.", kmInterval: 50000, timeInterval: 48, type: "Preventiva", criticidade: "Média", custoMinimo: 200, custoMaximo: 500 },
  { category: "Suspensão", item: "Batentes e coifas", description: "Inspecionar coifas rasgadas e batentes ressecados. Protegem amortecedores de contaminação.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Média", custoMinimo: 150, custoMaximo: 400 },

  // Freios
  { category: "Freios", item: "Pastilhas de freio", description: "Medir espessura (mínimo 3mm). Pastilhas gastas danificam discos e aumentam distância de frenagem.", kmInterval: 20000, timeInterval: 12, type: "Preventiva", criticidade: "Crítica", custoMinimo: 200, custoMaximo: 500 },
  { category: "Freios", item: "Discos de freio", description: "Verificar espessura (mínimo 8mm) e empenos. Discos gastos causam vibração e perda de eficiência.", kmInterval: 40000, timeInterval: 24, type: "Preventiva", criticidade: "Crítica", custoMinimo: 600, custoMaximo: 1200 },
  { category: "Freios", item: "Fluido de freio", description: "Substituir a cada 2 anos. Fluido higroscópico perde propriedades e causa falha nos freios.", kmInterval: 30000, timeInterval: 24, type: "Preventiva", criticidade: "Crítica", custoMinimo: 100, custoMaximo: 250 },
  { category: "Freios", item: "Freio de mão (estacionamento)", description: "Regular tensão do cabo. Verificar fixações e pastilhas traseiras. Essencial para estacionar em ladeiras.", kmInterval: 20000, timeInterval: 12, type: "Preventiva", criticidade: "Alta", custoMinimo: 150, custoMaximo: 400 },
  { category: "Freios", item: "Cilindro de freio", description: "Verificar vazamentos. Cilindro defeituoso causa perda de pressão no sistema.", kmInterval: 60000, timeInterval: 60, type: "Corretiva", criticidade: "Alta", custoMinimo: 400, custoMaximo: 800 },
  { category: "Freios", item: "Flexíveis de freio", description: "Inspecionar mangueiras. Flexíveis ressecados podem romper causando perda total de frenagem.", kmInterval: 50000, timeInterval: 48, type: "Corretiva", criticidade: "Alta", custoMinimo: 300, custoMaximo: 600 },
  { category: "Freios", item: "Servo-freio", description: "Verificar vácuo. Servo-freio defeituoso deixa pedal duro e reduz eficiência.", kmInterval: 80000, timeInterval: 72, type: "Corretiva", criticidade: "Alta", custoMinimo: 600, custoMaximo: 1200 },

  // Transmissão
  { category: "Transmissão", item: "Óleo da transmissão", description: "Trocar conforme especificação. Câmbio automático requer óleo específico. Protege engrenagens.", kmInterval: 60000, timeInterval: 48, type: "Preventiva", criticidade: "Média", custoMinimo: 300, custoMaximo: 800 },
  { category: "Transmissão", item: "Embreagem (disco, platô e rolamento)", description: "Verificar patinação e ruídos. Kit completo: disco, platô e rolamento. Substituir conjunto.", kmInterval: 80000, timeInterval: 60, type: "Corretiva", criticidade: "Alta", custoMinimo: 1500, custoMaximo: 3500 },
  { category: "Transmissão", item: "Cabos de embreagem", description: "Lubrificar e regular folga livre do pedal (1-2cm). Cabo desregulado dificulta trocas.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Baixa", custoMinimo: 150, custoMaximo: 350 },
  { category: "Transmissão", item: "Atuador de embreagem", description: "Verificar funcionamento (embreagem hidráulica). Atuador defeituoso impede engate de marchas.", kmInterval: 60000, timeInterval: 60, type: "Corretiva", criticidade: "Média", custoMinimo: 400, custoMaximo: 800 },
  { category: "Transmissão", item: "Diferencial", description: "Trocar óleo do diferencial. Protege engrenagens da tração (principalmente 4x4 e traseira).", kmInterval: 60000, timeInterval: 48, type: "Preventiva", criticidade: "Média", custoMinimo: 500, custoMaximo: 1000 },

  // Elétrico
  { category: "Elétrico", item: "Bateria", description: "Verificar carga (12,6V desligado). Limpar terminais. Testar alternador. Vida útil: 2-4 anos.", kmInterval: 40000, timeInterval: 24, type: "Preventiva", criticidade: "Média", custoMinimo: 350, custoMaximo: 800 },
  { category: "Elétrico", item: "Alternador", description: "Verificar tensão de saída (13,8-14,4V). Ruídos indicam rolamento gasto. Trocar se necessário.", kmInterval: 80000, timeInterval: 60, type: "Preventiva", criticidade: "Média", custoMinimo: 600, custoMaximo: 1500 },
  { category: "Elétrico", item: "Motor de arranque", description: "Testar partida. Motor de arranque com ruído metálico indica bendix defeituoso.", kmInterval: 100000, timeInterval: 72, type: "Corretiva", criticidade: "Média", custoMinimo: 800, custoMaximo: 1800 },
  { category: "Elétrico", item: "Faróis e lâmpadas", description: "Verificar funcionamento. Regular altura e convergência dos faróis. LED dura mais.", kmInterval: 10000, timeInterval: 12, type: "Preventiva", criticidade: "Média", custoMinimo: 50, custoMaximo: 200 },
  { category: "Elétrico", item: "Fusíveis e relés", description: "Identificar causa antes de substituir. Evitar fusíveis de amperagem incorreta.", kmInterval: null, timeInterval: null, type: "Corretiva", criticidade: "Baixa", custoMinimo: 30, custoMaximo: 150 },
  { category: "Elétrico", item: "Chicote elétrico", description: "Inspecionar fios desencapados e emendas malfeitas. Chicote deteriorado causa panes elétricas.", kmInterval: 80000, timeInterval: 72, type: "Corretiva", criticidade: "Baixa", custoMinimo: 500, custoMaximo: 1200 },
  { category: "Elétrico", item: "Sensor de oxigênio (Sonda lambda)", description: "Medir mistura ar/combustível. Sonda lambda defeituosa aumenta emissões e consumo.", kmInterval: 80000, timeInterval: 60, type: "Corretiva", criticidade: "Média", custoMinimo: 400, custoMaximo: 900 },

  // Ar condicionado
  { category: "Ar condicionado", item: "Filtro de cabine (ar condicionado)", description: "Filtrar ar interno. Remover pólen, poeira e poluentes. Trocar anualmente.", kmInterval: 15000, timeInterval: 12, type: "Preventiva", criticidade: "Baixa", custoMinimo: 50, custoMaximo: 150 },
  { category: "Ar condicionado", item: "Carga de gás refrigerante", description: "Verificar pressão do sistema. Recarga quando resfriamento diminuir.", kmInterval: 30000, timeInterval: 24, type: "Preventiva", criticidade: "Baixa", custoMinimo: 200, custoMaximo: 500 },
  { category: "Ar condicionado", item: "Compressor do ar condicionado", description: "Verificar ruídos, vazamentos e eficiência de resfriamento. Trocar se necessário.", kmInterval: 60000, timeInterval: 48, type: "Corretiva", criticidade: "Média", custoMinimo: 800, custoMaximo: 2000 },
  { category: "Ar condicionado", item: "Higienização do sistema", description: "Limpar evaporador e dutos. Eliminar fungos, bactérias e mau cheiro.", kmInterval: 20000, timeInterval: 12, type: "Preventiva", criticidade: "Baixa", custoMinimo: 150, custoMaximo: 300 },

  // Pneus e Rodas
  { category: "Pneus e Rodas", item: "Calibragem dos pneus", description: "Verificar semanalmente com pneus frios. Seguir especificação do fabricante.", kmInterval: 1000, timeInterval: 0.5, type: "Preventiva", criticidade: "Média", custoMinimo: 0, custoMaximo: 30 },
  { category: "Pneus e Rodas", item: "Rodízio de pneus", description: "Alternar posição para desgaste uniforme. Seguir padrão recomendado.", kmInterval: 10000, timeInterval: 6, type: "Preventiva", criticidade: "Média", custoMinimo: 80, custoMaximo: 150 },
  { category: "Pneus e Rodas", item: "Balanceamento", description: "Equilibrar após reparos ou trocas. Elimina vibrações no volante.", kmInterval: 10000, timeInterval: 6, type: "Preventiva", criticidade: "Média", custoMinimo: 100, custoMaximo: 200 },
  { category: "Pneus e Rodas", item: "Alinhamento (geometria)", description: "Ajustar cambagem, caster e convergência. Alinhamento incorreto desgasta pneus.", kmInterval: 10000, timeInterval: 6, type: "Preventiva", criticidade: "Média", custoMinimo: 100, custoMaximo: 200 },
  { category: "Pneus e Rodas", item: "Substituição de pneus", description: "Trocar ao atingir TWI (1,6mm de sulco) ou 5 anos. Verificar rachaduras laterais.", kmInterval: 50000, timeInterval: 60, type: "Preventiva", criticidade: "Alta", custoMinimo: 1200, custoMaximo: 2800 },
  { category: "Pneus e Rodas", item: "Válvulas dos pneus", description: "Trocar válvulas ao montar pneus novos. Vazamento lento causa descalibragem.", kmInterval: 50000, timeInterval: 60, type: "Preventiva", criticidade: "Baixa", custoMinimo: 50, custoMaximo: 100 },

  // Escapamento
  { category: "Escapamento", item: "Silencioso", description: "Verificar furos e corrosão interna. Silencioso furado causa ruído excessivo.", kmInterval: 60000, timeInterval: 60, type: "Preventiva", criticidade: "Média", custoMinimo: 400, custoMaximo: 1200 },
  { category: "Escapamento", item: "Catalisador", description: "Inspecionar substrato cerâmico. Catalisador entupido causa perda de potência.", kmInterval: 100000, timeInterval: 96, type: "Preventiva", criticidade: "Média", custoMinimo: 1200, custoMaximo: 3000 },
  { category: "Escapamento", item: "Fixações e suportes do escapamento", description: "Verificar borrachas de suporte e abraçadeiras. Fixações soltas causam ruídos metálicos.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Baixa", custoMinimo: 100, custoMaximo: 300 },

  // Direção
  { category: "Direção", item: "Fluido da direção hidráulica", description: "Verificar nível e vazamentos. Trocar conforme manual. Direção elétrica não usa fluido.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Média", custoMinimo: 150, custoMaximo: 400 },
  { category: "Direção", item: "Caixa de direção", description: "Inspecionar folgas. Testar em movimento. Caixa com folga causa imprecisão na direção.", kmInterval: 80000, timeInterval: 72, type: "Corretiva", criticidade: "Alta", custoMinimo: 800, custoMaximo: 2000 },
  { category: "Direção", item: "Terminais de direção", description: "Verificar folgas nas articulações. Terminais gastos causam vibração no volante.", kmInterval: 50000, timeInterval: 48, type: "Preventiva", criticidade: "Alta", custoMinimo: 300, custoMaximo: 800 },
  { category: "Direção", item: "Bomba da direção hidráulica", description: "Verificar vazamentos e ruídos. Bomba defeituosa dificulta manobras.", kmInterval: 80000, timeInterval: 72, type: "Corretiva", criticidade: "Média", custoMinimo: 600, custoMaximo: 1500 },

  // Carroceria e Pintura
  { category: "Carroceria e Pintura", item: "Polimento e cristalização", description: "Remover oxidação superficial. Aplicar cera protetora. Não polir em excesso.", kmInterval: null, timeInterval: 12, type: "Preventiva", criticidade: "Baixa", custoMinimo: 200, custoMaximo: 500 },
  { category: "Carroceria e Pintura", item: "Verificação de ferrugem", description: "Inspecionar para-lamas, soleiras e portas. Tratar pontos de oxidação imediatamente.", kmInterval: null, timeInterval: 12, type: "Preventiva", criticidade: "Média", custoMinimo: 300, custoMaximo: 1000 },
  { category: "Carroceria e Pintura", item: "Lavagem e enceramento", description: "Lavar quinzenalmente. Encerar trimestralmente. Lavar chassi para remover sal.", kmInterval: null, timeInterval: 0.5, type: "Preventiva", criticidade: "Baixa", custoMinimo: 50, custoMaximo: 150 },
  { category: "Carroceria e Pintura", item: "Proteção de pintura", description: "Aplicar selante, vitrificação ou PPF. Protege contra riscos e desbotamento.", kmInterval: null, timeInterval: 24, type: "Preventiva", criticidade: "Baixa", custoMinimo: 500, custoMaximo: 2000 },
  { category: "Carroceria e Pintura", item: "Borrachas de vedação", description: "Verificar borrachas de portas, vidros e porta-malas. Trocar se ressecadas.", kmInterval: 60000, timeInterval: 48, type: "Preventiva", criticidade: "Baixa", custoMinimo: 200, custoMaximo: 600 },

  // Revisões
  { category: "Revisões", item: "Revisão básica (10.000 km)", description: "Verificação geral: fluidos, filtros, freios, pneus, luzes. Manutenção essencial.", kmInterval: 10000, timeInterval: 6, type: "Preventiva", criticidade: "Alta", custoMinimo: 300, custoMaximo: 600 },
  { category: "Revisões", item: "Revisão intermediária (20.000 km)", description: "Inclui revisão básica mais: suspensão, direção, bateria, scanner. Mais completa.", kmInterval: 20000, timeInterval: 12, type: "Preventiva", criticidade: "Alta", custoMinimo: 500, custoMaximo: 900 },
  { category: "Revisões", item: "Revisão completa (40.000 km)", description: "Inspeção detalhada de todos os sistemas. Diagnóstico eletrônico completo.", kmInterval: 40000, timeInterval: 24, type: "Preventiva", criticidade: "Alta", custoMinimo: 800, custoMaximo: 1500 },

  // Interior
  { category: "Interior", item: "Limpeza interna completa", description: "Aspirar profundamente. Limpar painéis, vidros e forros. Manter interior conservado.", kmInterval: null, timeInterval: 3, type: "Preventiva", criticidade: "Baixa", custoMinimo: 80, custoMaximo: 200 },
  { category: "Interior", item: "Lubrificação de trilhos e dobradiças", description: "Aplicar silicone spray em trilhos de bancos. Graphite em fechaduras.", kmInterval: 20000, timeInterval: 12, type: "Preventiva", criticidade: "Baixa", custoMinimo: 50, custoMaximo: 150 },
  { category: "Interior", item: "Verificação de cintos de segurança", description: "Testar retratores e travas. Cintos têm validade. Substituir se danificados.", kmInterval: 40000, timeInterval: 24, type: "Preventiva", criticidade: "Alta", custoMinimo: 100, custoMaximo: 300 },
  { category: "Interior", item: "Limpeza de bancos (higienização)", description: "Remover manchas e odores. Higienização a vapor ou produtos específicos.", kmInterval: null, timeInterval: 6, type: "Preventiva", criticidade: "Baixa", custoMinimo: 200, custoMaximo: 500 },
  { category: "Interior", item: "Ajuste de bancos e retrovisores", description: "Verificar ajustes elétricos. Lubrificar mecanismos. Regular retrovisores.", kmInterval: 20000, timeInterval: 12, type: "Preventiva", criticidade: "Baixa", custoMinimo: 80, custoMaximo: 200 },

  // Outros Serviços
  { category: "Outros Serviços", item: "Alinhamento e regulagem dos faróis", description: "Regular altura e direção do facho luminoso. Melhora visibilidade sem ofuscar.", kmInterval: 10000, timeInterval: 12, type: "Preventiva", criticidade: "Média", custoMinimo: 80, custoMaximo: 150 },
  { category: "Outros Serviços", item: "Limpeza do sistema de injeção", description: "Limpar sistema de combustível com aditivos. Descontaminar bicos injetores.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Média", custoMinimo: 200, custoMaximo: 500 },
  { category: "Outros Serviços", item: "Scanner diagnóstico (leitura de código de falhas)", description: "Ler códigos de falha OBD-II. Identificar problemas antes que se agravem.", kmInterval: 20000, timeInterval: 12, type: "Preventiva", criticidade: "Alta", custoMinimo: 150, custoMaximo: 350 },
  { category: "Outros Serviços", item: "Despoluição (limpeza de bicos)", description: "Desentupir bicos injetores. Limpar válvulas de admissão. Melhora desempenho.", kmInterval: 40000, timeInterval: 36, type: "Preventiva", criticidade: "Média", custoMinimo: 200, custoMaximo: 500 },
  { category: "Outros Serviços", item: "Troca de palhetas do limpador", description: "Substituir palhetas ressecadas. Limpadores eficientes são questão de segurança.", kmInterval: 10000, timeInterval: 6, type: "Preventiva", criticidade: "Média", custoMinimo: 80, custoMaximo: 150 },
  { category: "Outros Serviços", item: "Troca de fluido de lavador", description: "Completar reservatório. Usar água desmineralizada com detergente automotivo.", kmInterval: 5000, timeInterval: 3, type: "Preventiva", criticidade: "Baixa", custoMinimo: 20, custoMaximo: 50 },
];

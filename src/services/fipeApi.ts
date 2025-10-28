// API FIPE para buscar dados de veículos brasileiros

const FIPE_BASE_URL = "https://parallelum.com.br/fipe/api/v1";

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: number;
  nome: string;
}

export interface FipeYear {
  codigo: string;
  nome: string;
}

export interface FipeVehicle {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
}

export const fipeApi = {
  // Buscar marcas de carros
  getBrands: async (): Promise<FipeBrand[]> => {
    const response = await fetch(`${FIPE_BASE_URL}/carros/marcas`);
    if (!response.ok) throw new Error("Erro ao buscar marcas");
    return response.json();
  },

  // Buscar modelos de uma marca
  getModels: async (brandCode: string): Promise<{ modelos: FipeModel[] }> => {
    const response = await fetch(`${FIPE_BASE_URL}/carros/marcas/${brandCode}/modelos`);
    if (!response.ok) throw new Error("Erro ao buscar modelos");
    return response.json();
  },

  // Buscar anos de um modelo
  getYears: async (brandCode: string, modelCode: number): Promise<FipeYear[]> => {
    const response = await fetch(`${FIPE_BASE_URL}/carros/marcas/${brandCode}/modelos/${modelCode}/anos`);
    if (!response.ok) throw new Error("Erro ao buscar anos");
    return response.json();
  },

  // Buscar detalhes completos do veículo
  getVehicleDetails: async (brandCode: string, modelCode: number, yearCode: string): Promise<FipeVehicle> => {
    const response = await fetch(`${FIPE_BASE_URL}/carros/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`);
    if (!response.ok) throw new Error("Erro ao buscar detalhes do veículo");
    return response.json();
  },
};

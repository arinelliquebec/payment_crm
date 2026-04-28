export interface CepData {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
}

export async function consultarCep(cep: string): Promise<CepData | null> {
  try {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      return null;
    }

    const response = await fetch(`/api/cep/${cleanCep}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao consultar CEP:", error);
    return null;
  }
}

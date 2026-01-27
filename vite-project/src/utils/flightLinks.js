// src/utils/flightLinks.js

const IATA_MAP = {
  'SÃO PAULO': 'GRU', 'SAO PAULO': 'GRU', 'SP': 'GRU',
  'RIO DE JANEIRO': 'GIG', 'RJ': 'GIG',
  'BRASÍLIA': 'BSB', 'BRASILIA': 'BSB',
  'BELO HORIZONTE': 'CNF', 'BH': 'CNF',
  'SALVADOR': 'SSA',
  'FORTALEZA': 'FOR',
  'CURITIBA': 'CWB',
  'RECIFE': 'REC',
  'PORTO ALEGRE': 'POA'
};

// Função para normalizar cidade para código IATA
function normalizarCidade(cidade) {
  if (!cidade) return 'GRU';
  
  const cidadeLimpa = cidade.trim().toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos

  // Se já for um código IATA de 3 letras
  if (cidadeLimpa.length === 3) return cidadeLimpa;

  // Busca no mapa ou retorna as 3 primeiras letras
  return IATA_MAP[cidadeLimpa] || IATA_MAP[cidade.toUpperCase()] || cidadeLimpa.substring(0, 3);
}

// Função Principal: Gera o Link do Skyscanner
export function gerarLinkSkyscanner(origem, destino, dataIda, dataVolta = null) {
  try {
    const origemIata = normalizarCidade(origem);
    const destinoIata = normalizarCidade(destino);
    
    // Converte data de DD/MM/YYYY para YYMMDD (Formato Skyscanner)
    // Ex: 24/02/2026 -> 260224
    const [dia, mes, ano] = dataIda.split('/');
    const anoCurto = ano.slice(-2);
    const dataIdaSky = `${anoCurto}${mes}${dia}`;

    let urlBase = `https://www.skyscanner.com.br/transport/flights/${origemIata}/${destinoIata}/${dataIdaSky}`;

    if (dataVolta) {
      const [diaV, mesV, anoV] = dataVolta.split('/');
      const anoCurtoV = anoV.slice(-2);
      const dataVoltaSky = `${anoCurtoV}${mesV}${diaV}`;
      
      return `${urlBase}/${dataVoltaSky}/?adultsv2=1&cabinclass=economy&rtn=1`;
    }

    // Apenas ida
    return `${urlBase}/?adultsv2=1&cabinclass=economy&rtn=0`;

  } catch (error) {
    console.error("Erro ao gerar link:", error);
    // Fallback para a home do Skyscanner se der erro
    return "https://www.skyscanner.com.br/";
  }
}
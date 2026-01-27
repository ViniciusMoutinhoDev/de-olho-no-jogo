// src/utils/logistics.js

const IATA_MAP = {
  'SÃO PAULO': 'GRU', 'SAO PAULO': 'GRU', 'SP': 'GRU',
  'RIO DE JANEIRO': 'GIG', 'RJ': 'GIG',
  'BRASÍLIA': 'BSB', 'BRASILIA': 'BSB',
  'BELO HORIZONTE': 'CNF', 'BH': 'CNF',
  'SALVADOR': 'SSA', 'FORTALEZA': 'FOR',
  'CURITIBA': 'CWB', 'RECIFE': 'REC',
  'PORTO ALEGRE': 'POA', 'MANAUS': 'MAO',
  'FLORIANÓPOLIS': 'FLN'
};

function normalizarTexto(txt) {
  if (!txt) return '';
  return txt.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Verifica se é "local" (mesma cidade ou estado)
export function isJogoLocal(cidadeUsuario, cidadeJogo) {
  const c1 = normalizarTexto(cidadeUsuario);
  const c2 = normalizarTexto(cidadeJogo);
  // Lógica simples: se a cidade contém o nome da outra (ex: "São Paulo" e "São Paulo - SP")
  return c1.includes(c2) || c2.includes(c1);
}

// Gera Data Formatada para APIs (YYMMDD)
function formatDataSkyscanner(dateObj) {
  const dia = String(dateObj.getDate()).padStart(2, '0');
  const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
  const ano = String(dateObj.getFullYear()).slice(-2);
  return `${ano}${mes}${dia}`;
}

export function gerarLinksLogistica(origem, destino, timestamp, estadio) {
  const origemNorm = normalizarTexto(origem);
  const destinoNorm = normalizarTexto(destino);
  const dateIda = new Date(timestamp * 1000);
  
  // LÓGICA DE DATA INTELIGENTE
  // Se o jogo for depois das 21:00, voltar no dia seguinte
  const horaJogo = dateIda.getHours();
  const voltarDiaSeguinte = horaJogo >= 21;

  const dateVolta = new Date(dateIda);
  if (voltarDiaSeguinte) {
    dateVolta.setDate(dateVolta.getDate() + 1); // Adiciona 1 dia
  }

  // 1. LINK SKYSCANNER (Ida e Volta)
  const origemIata = IATA_MAP[origemNorm] || origemNorm.substring(0, 3);
  const destinoIata = IATA_MAP[destinoNorm] || destinoNorm.substring(0, 3);
  const strIda = formatDataSkyscanner(dateIda);
  const strVolta = formatDataSkyscanner(dateVolta);
  
  const linkVoo = `https://www.skyscanner.com.br/transport/flights/${origemIata}/${destinoIata}/${strIda}/${strVolta}/?adultsv2=1&cabinclass=economy&rtn=1`;

  // 2. LINK BOOKING.COM (Hospedagem)
  // Formato Booking aceita data YYYY-MM-DD
  const checkin = dateIda.toISOString().split('T')[0];
  const checkout = dateVolta.toISOString().split('T')[0];
  const linkHotel = `https://www.booking.com/searchresults.html?ss=${destino}&checkin=${checkin}&checkout=${checkout}&group_adults=1&no_rooms=1&group_children=0`;

  // 3. LINK GOOGLE MAPS (Rotas Locais)
  // Maps format: origin=MinhaCasa&destination=Estadio,Cidade
  const linkRota = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origem)}&destination=${encodeURIComponent(estadio + ',' + destino)}&travelmode=driving`;

  return {
    linkVoo,
    linkHotel,
    linkRota,
    voltarDiaSeguinte,
    horaJogo
  };
}
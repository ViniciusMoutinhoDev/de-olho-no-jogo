import urllib.parse
from datetime import timedelta
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
import math

# Simulação simples de distâncias entre cidades
# Você pode evoluir isso depois para usar API real
DISTANCIAS_FIXAS = {
    ("São Paulo", "Rio de Janeiro"): 430,
    ("Rio de Janeiro", "São Paulo"): 430,
    ("São Paulo", "Belo Horizonte"): 590,
    ("Belo Horizonte", "São Paulo"): 590,
}

def calcular_logistica(origem, destino):
    if not origem or not destino:
        return "CARRO", 0

    if origem == destino:
        return "CARRO", 10

    distancia = DISTANCIAS_FIXAS.get((origem, destino), 300)

    # Regra simples:
    # Até 600km → CARRO
    # Acima disso → AVIÃO
    if distancia <= 600:
        modo = "CARRO"
    else:
        modo = "AVIAO"

    return modo, distancia


def calcular_custos_carro(distancia):
    if not distancia:
        return 0

    consumo_km_por_litro = 10
    preco_gasolina = 6.0

    litros = distancia / consumo_km_por_litro
    custo = litros * preco_gasolina

    pedagios = distancia * 0.05

    total = custo + pedagios

    return round(total, 2)


# --- CACHE EM MEMÓRIA ---
GEO_CACHE = {}

# Inicializa o geolocator
geolocator = Nominatim(user_agent="fut_travel_api_v2")

# --- MAPEAMENTO DE ESTADOS BRASILEIROS ---
ESTADOS_BRASIL = {
    'SÃO PAULO': 'SP', 'SANTOS': 'SP', 'CAMPINAS': 'SP', 'SÃO CAETANO DO SUL': 'SP',
    'GUARULHOS': 'SP', 'BRAGANÇA PAULISTA': 'SP', 'BARUERI': 'SP',
    'RIO DE JANEIRO': 'RJ', 'NITERÓI': 'RJ', 'VOLTA REDONDA': 'RJ',
    'BELO HORIZONTE': 'MG', 'UBERLÂNDIA': 'MG', 'JUIZ DE FORA': 'MG',
    'PORTO ALEGRE': 'RS', 'CAXIAS DO SUL': 'RS', 'PELOTAS': 'RS',
    'CURITIBA': 'PR', 'LONDRINA': 'PR', 'MARINGÁ': 'PR',
    'FLORIANÓPOLIS': 'SC', 'JOINVILLE': 'SC', 'CHAPECÓ': 'SC', 'CRICIÚMA': 'SC',
    'SALVADOR': 'BA', 'FEIRA DE SANTANA': 'BA',
    'RECIFE': 'PE', 'OLINDA': 'PE',
    'FORTALEZA': 'CE', 'JUAZEIRO DO NORTE': 'CE',
    'BRASÍLIA': 'DF',
    'GOIÂNIA': 'GO', 'APARECIDA DE GOIÂNIA': 'GO',
    'CUIABÁ': 'MT',
    'MANAUS': 'AM',
    'BELÉM': 'PA',
    'VITÓRIA': 'ES',
    'NATAL': 'RN',
    'MACEIÓ': 'AL',
    'JOÃO PESSOA': 'PB',
    'SÃO LUÍS': 'MA',
    'ARACAJU': 'SE',
    'TERESINA': 'PI'
}

def obter_estado(cidade):
    """Retorna a sigla do estado da cidade"""
    if not cidade:
        return None
    
    cidade_upper = cidade.upper().strip()
    
    # Remove sufixos comuns
    cidade_limpa = cidade_upper.replace(' - SP', '').replace(' - RJ', '').replace(' - MG', '')
    
    return ESTADOS_BRASIL.get(cidade_limpa)

def obter_coords(cidade):
    """Busca coordenadas geográficas com cache"""
    global GEO_CACHE
    
    if not cidade or cidade == "A definir":
        return None
    
    if cidade in GEO_CACHE:
        return GEO_CACHE[cidade]
    
    try:
        loc = geolocator.geocode(f"{cidade}, Brasil", timeout=5)
        if loc:
            coords = (loc.latitude, loc.longitude)
            GEO_CACHE[cidade] = coords
            return coords
    except:
        pass
    return None

def calcular_logistica_completa(origem, destino, estadio=None):
    """
    Calcula logística completa diferenciando viagem (outro estado) e locomoção local
    
    Returns:
        dict: {
            'tipo': 'VIAGEM' | 'LOCAL',
            'modo': 'AVIAO' | 'CARRO' | 'ONIBUS' | 'METRO/TREM',
            'distancia_km': int,
            'mesmo_estado': bool,
            'custo_estimado': float
        }
    """
    estado_origem = obter_estado(origem)
    estado_destino = obter_estado(destino)
    
    c1 = obter_coords(origem)
    c2 = obter_coords(destino)
    
    dist_km = 0
    mesmo_estado = (estado_origem == estado_destino) if (estado_origem and estado_destino) else False
    
    if c1 and c2:
        dist_km = int(geodesic(c1, c2).km)
    
    # DECISÃO DE MODO DE TRANSPORTE
    if mesmo_estado:
        # Locomoção LOCAL (mesmo estado)
        if dist_km <= 30:
            modo = "METRO/TREM"
            custo = dist_km * 0.15  # R$ 0,15/km (transporte público)
            tipo = "LOCAL"
        elif dist_km <= 150:
            modo = "CARRO"
            custo = calcular_custos_carro(dist_km, so_ida=True)  # Só ida
            tipo = "LOCAL"
        else:
            modo = "ONIBUS"
            custo = dist_km * 0.30  # R$ 0,30/km (ônibus interestadual)
            tipo = "LOCAL"
    else:
        # VIAGEM (outro estado)
        if dist_km <= 500:
            modo = "CARRO"
            custo = calcular_custos_carro(dist_km)  # Ida e volta
            tipo = "VIAGEM"
        else:
            modo = "AVIAO"
            custo = estimar_passagem_aerea(dist_km)
            tipo = "VIAGEM"
    
    return {
        'tipo': tipo,
        'modo': modo,
        'distancia_km': dist_km,
        'mesmo_estado': mesmo_estado,
        'custo_estimado': custo
    }

def calcular_custos_carro(distancia_km, consumo_kml=10.0, preco_gas=5.80, pedagio_km=0.15, so_ida=False):
    """Calcula custo total de viagem de carro"""
    km_total = distancia_km if so_ida else distancia_km * 2
    
    litros = km_total / consumo_kml
    custo_gas = litros * preco_gas
    custo_pedagio = km_total * pedagio_km
    
    return custo_gas + custo_pedagio

def estimar_passagem_aerea(distancia_km):
    """Estimativa de custo de passagem aérea baseada na distância"""
    # Fórmula baseada em médias de mercado brasileiro
    if distancia_km < 1000:
        return 400  # Voos regionais
    elif distancia_km < 2000:
        return 600  # Voos médios
    else:
        return 900  # Voos longos

def gerar_links_viagem_completa(origem, destino, data_jogo_obj, estadio=None):
    """
    Gera todos os links necessários para planejamento de viagem
    
    Returns:
        dict: {
            'skyscanner_ida_volta': str,
            'google_flights': str,
            'hoteis_booking': str,
            'hoteis_airbnb': str,
            'rota_estadio': str (se for local)
        }
    """
    if not data_jogo_obj:
        return {}
    
    # Datas: 1 dia antes (ida) e 1 dia depois (volta)
    data_ida = data_jogo_obj - timedelta(days=1)
    data_volta = data_jogo_obj + timedelta(days=1)
    
    # Formatações
    ida_str = data_ida.strftime('%Y-%m-%d')
    volta_str = data_volta.strftime('%Y-%m-%d')
    
    ida_sky = data_ida.strftime('%y%m%d')
    volta_sky = data_volta.strftime('%y%m%d')
    
    # Limpeza de nomes
    origem_clean = origem.split(',')[0].strip().replace(' ', '-').lower()
    destino_clean = destino.split(',')[0].strip().replace(' ', '-').lower()
    
    links = {}
    
    # 1. SKYSCANNER (Ida e Volta)
    links['skyscanner_ida_volta'] = f"https://www.skyscanner.com.br/transporte/passagens-aereas/{origem_clean}/{destino_clean}/{ida_sky}/{volta_sky}"
    
    # 2. GOOGLE FLIGHTS
    query_flights = f"Flights from {origem} to {destino} on {ida_str} returning {volta_str}"
    links['google_flights'] = f"https://www.google.com/travel/flights?q={urllib.parse.quote(query_flights)}"
    
    # 3. HOTÉIS BOOKING.COM (próximo ao estádio ou cidade)
    local_busca = estadio if estadio else destino
    checkin = ida_str
    checkout = volta_str
    links['hoteis_booking'] = f"https://www.booking.com/searchresults.pt-br.html?ss={urllib.parse.quote(local_busca)}&checkin={checkin}&checkout={checkout}"
    
    # 4. AIRBNB
    links['hoteis_airbnb'] = f"https://www.airbnb.com.br/s/{urllib.parse.quote(destino)}/homes?checkin={ida_str}&checkout={volta_str}"
    
    # 5. ROTA ATÉ O ESTÁDIO (Google Maps)
    if estadio:
        links['rota_estadio'] = f"https://www.google.com/maps/dir/{urllib.parse.quote(origem)}/{urllib.parse.quote(estadio)}"
    
    return links

def calcular_custos_viagem_completa(logistica, num_dias=2):
    """
    Calcula todos os custos estimados de uma viagem
    
    Args:
        logistica: dict retornado por calcular_logistica_completa
        num_dias: número de dias da viagem (padrão: 2 = 1 dia antes + dia do jogo)
    
    Returns:
        dict com breakdown de custos
    """
    custos = {
        'transporte': logistica.get('custo_estimado', 0),
        'estacionamento': 0,
        'hospedagem': 0,
        'alimentacao': 0,
        'ingresso': 0,  # Usuário vai preencher
        'extras': 0,
        'total': 0
    }
    
    # ESTACIONAMENTO (se for de carro e viagem)
    if logistica['modo'] == 'CARRO' and logistica['tipo'] == 'VIAGEM':
        custos['estacionamento'] = 50 * num_dias  # R$ 50/dia
    
    # HOSPEDAGEM (apenas se for viagem para outro estado)
    if logistica['tipo'] == 'VIAGEM':
        # Estimativa: R$ 200/noite (hotel simples)
        custos['hospedagem'] = 200 * (num_dias - 1)  # -1 porque volta no dia seguinte
    
    # ALIMENTAÇÃO
    # Local: 1 refeição antes do jogo
    # Viagem: 3 refeições/dia
    if logistica['tipo'] == 'LOCAL':
        custos['alimentacao'] = 50  # 1 refeição
    else:
        custos['alimentacao'] = 150 * num_dias  # R$ 150/dia (3 refeições)
    
    # TOTAL
    custos['total'] = sum(custos.values())
    
    return custos
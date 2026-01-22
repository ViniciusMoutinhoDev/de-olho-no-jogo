import urllib.parse
from datetime import timedelta
from geopy.distance import geodesic
from geopy.geocoders import Nominatim

# --- CACHE EM MEMÓRIA (Substitui o st.session_state) ---
GEO_CACHE = {}

# Inicializa o geolocator
geolocator = Nominatim(user_agent="fut_travel_api_v1")

def obter_coords(cidade):
    global GEO_CACHE
    
    if not cidade or cidade == "A definir": return None
    
    # Verifica se já temos essa cidade salva no dicionário
    if cidade in GEO_CACHE:
        return GEO_CACHE[cidade]
    
    try:
        # Busca no Google/OpenStreetMap
        loc = geolocator.geocode(f"{cidade}", timeout=5)
        if loc:
            coords = (loc.latitude, loc.longitude)
            # Salva no cache
            GEO_CACHE[cidade] = coords
            return coords
    except:
        pass
    return None

def calcular_logistica(origem, destino):
    c1 = obter_coords(origem)
    c2 = obter_coords(destino)
    
    dist_km = 0
    modo = "INDEFINIDO"
    
    if c1 and c2:
        dist_km = int(geodesic(c1, c2).km)
        # Regra de Negócio: Até 500km sugere Carro
        modo = "CARRO" if dist_km <= 500 else "AVIAO"
    
    return modo, dist_km

def gerar_links_viagem(origem, destino, data_jogo_obj):
    if not data_jogo_obj: return None, None
    
    ida = (data_jogo_obj - timedelta(days=1)).strftime('%Y-%m-%d')
    volta = (data_jogo_obj + timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Link Google Flights
    query = f"Flights from {origem} to {destino} on {ida} returning {volta}"
    link_google = f"https://www.google.com/travel/flights?q={urllib.parse.quote(query)}"
    
    # Link Skyscanner
    ida_sky = (data_jogo_obj - timedelta(days=1)).strftime('%y%m%d')
    volta_sky = (data_jogo_obj + timedelta(days=1)).strftime('%y%m%d')
    
    # Limpeza básica para URL
    origem_clean = origem.split(',')[0].strip().replace(' ', '-').lower()
    destino_clean = destino.split(',')[0].strip().replace(' ', '-').lower()
    
    link_sky = f"https://www.skyscanner.com.br/transporte/passagens-aereas/{origem_clean}/{destino_clean}/{ida_sky}/{volta_sky}"
    
    return link_google, link_sky

def calcular_custos_carro(distancia_km, consumo_kml=10.0, preco_gas=5.80, pedagio_km=0.15):
    ida_volta = distancia_km * 2
    litros = ida_volta / consumo_kml
    custo_gas = litros * preco_gas
    custo_pedagio = ida_volta * pedagio_km
    return custo_gas + custo_pedagio
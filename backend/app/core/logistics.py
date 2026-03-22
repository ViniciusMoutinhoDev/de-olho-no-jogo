import urllib.parse
from datetime import timedelta
from geopy.distance import geodesic
from geopy.geocoders import Nominatim

_geolocator = Nominatim(user_agent="fut_travel_api_v1")
_GEO_CACHE: dict[str, tuple[float, float]] = {}


def obter_coords(cidade: str) -> tuple[float, float] | None:
    if not cidade or cidade == "A definir":
        return None

    if cidade in _GEO_CACHE:
        return _GEO_CACHE[cidade]

    try:
        loc = _geolocator.geocode(cidade, timeout=5)
        if loc:
            coords = (loc.latitude, loc.longitude)
            _GEO_CACHE[cidade] = coords
            return coords
    except Exception:
        pass

    return None


def calcular_logistica(origem: str, destino: str) -> tuple[str, int]:
    c1 = obter_coords(origem)
    c2 = obter_coords(destino)

    if c1 and c2:
        dist_km = int(geodesic(c1, c2).km)
        modo = "CARRO" if dist_km <= 500 else "AVIAO"
        return modo, dist_km

    return "INDEFINIDO", 0


def gerar_links_viagem(origem: str, destino: str, data_jogo_iso: str) -> tuple[str | None, str | None]:
    if not data_jogo_iso:
        return None, None

    from datetime import datetime
    data_jogo_obj = datetime.fromisoformat(data_jogo_iso)

    ida = (data_jogo_obj - timedelta(days=1)).strftime("%Y-%m-%d")
    volta = (data_jogo_obj + timedelta(days=1)).strftime("%Y-%m-%d")

    query = f"Flights from {origem} to {destino} on {ida} returning {volta}"
    link_google = f"https://www.google.com/travel/flights?q={urllib.parse.quote(query)}"

    ida_sky = (data_jogo_obj - timedelta(days=1)).strftime("%y%m%d")
    volta_sky = (data_jogo_obj + timedelta(days=1)).strftime("%y%m%d")
    origem_clean = origem.split(",")[0].strip().replace(" ", "-").lower()
    destino_clean = destino.split(",")[0].strip().replace(" ", "-").lower()
    link_sky = (
        f"https://www.skyscanner.com.br/transporte/passagens-aereas"
        f"/{origem_clean}/{destino_clean}/{ida_sky}/{volta_sky}"
    )

    return link_google, link_sky


def calcular_custos_carro(
    distancia_km: int,
    consumo_kml: float = 10.0,
    preco_gas: float = 5.80,
    pedagio_km: float = 0.15,
) -> float:
    ida_volta = distancia_km * 2
    litros = ida_volta / consumo_kml
    custo_gas = litros * preco_gas
    custo_pedagio = ida_volta * pedagio_km
    return custo_gas + custo_pedagio

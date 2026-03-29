"""
logistics.py — Motor de logística de viagem

Cache de geocodificação em dois níveis:
  1. Memória (dict em processo) — acesso O(1)
  2. SQLite (geo_cache)          — persiste entre reinicializações

Escalabilidade: Nominatim tem rate limit de 1 req/s.
O cache duplo garante que cada cidade seja geocodificada no máximo 1x.
"""
import math
import threading
import urllib.parse
from datetime import datetime, timedelta

from geopy.distance import geodesic
from geopy.geocoders import Nominatim

from app.db.database import conectar

# ─── Geocodificação com cache duplo (RAM + SQLite) ────────────────────────────

_geolocator    = Nominatim(user_agent="fut_travel_api_v1")
_mem_cache:  dict[str, tuple[float, float]] = {}
_geo_lock    = threading.Lock()   # Nominatim: 1 req simultânea por user-agent


def _cache_get(cidade: str) -> tuple[float, float] | None:
    """Verifica memória primeiro, depois SQLite."""
    if cidade in _mem_cache:
        return _mem_cache[cidade]
    conn = conectar()
    try:
        row = conn.execute("SELECT lat, lon FROM geo_cache WHERE cidade = ?", (cidade,)).fetchone()
        if row:
            coords = (row["lat"], row["lon"])
            _mem_cache[cidade] = coords
            return coords
    finally:
        conn.close()
    return None


def _cache_set(cidade: str, coords: tuple[float, float]) -> None:
    """Grava em memória e SQLite."""
    _mem_cache[cidade] = coords
    conn = conectar()
    try:
        conn.execute(
            "INSERT OR REPLACE INTO geo_cache (cidade, lat, lon) VALUES (?, ?, ?)",
            (cidade, coords[0], coords[1])
        )
        conn.commit()
    finally:
        conn.close()


def obter_coords(cidade: str) -> tuple[float, float] | None:
    if not cidade or cidade in ("A definir", ""):
        return None
    cached = _cache_get(cidade)
    if cached:
        return cached
    with _geo_lock:
        # Double-checked locking: outro thread pode ter geocodificado enquanto esperava
        cached = _cache_get(cidade)
        if cached:
            return cached
        try:
            loc = _geolocator.geocode(cidade, timeout=6)
            if loc:
                coords = (loc.latitude, loc.longitude)
                _cache_set(cidade, coords)
                return coords
        except Exception:
            pass
    return None


# ─── Estimativas de custo ──────────────────────────────────────────────────────

def _custo_carro(km: int) -> dict:
    """Ida + volta, consumo 10 km/l, gasolina R$6,00, pedágio R$0,15/km."""
    ida_volta = km * 2
    total     = (ida_volta / 10.0) * 6.00 + ida_volta * 0.15
    return {"min": round(total * 0.85), "max": round(total * 1.20)}


def _custo_onibus(km: int) -> dict:
    """R$0,30–0,50/km (Buser, ClickBus, rodoviária)."""
    return {"min": round(km * 0.30), "max": round(km * 0.50)}


def _custo_aviao(km: int) -> dict:
    """Estimativa por faixa de distância baseada em histórico de preços ANAC."""
    if km < 400:
        mn, mx = 220, 500
    elif km < 700:
        mn = round(220 + (km - 400) * 0.50)
        mx = round(500 + (km - 400) * 0.80)
    elif km < 2000:
        mn = round(370 + (km - 700) * 0.35)
        mx = round(740 + (km - 700) * 0.50)
    else:
        mn, mx = 820, 1800
    return {"min": round(mn * 0.9), "max": round(mx * 1.1)}


# ─── Estimativas de duração ────────────────────────────────────────────────────

def _duracao_carro(km: int)  -> float: return round(km / 80  + math.floor(km / 200) * 0.33, 1)
def _duracao_onibus(km: int) -> float: return round(km / 70  + 1.0, 1)
def _duracao_aviao(km: int)  -> float: return round(km / 800 + 2.0, 1)


# ─── Links por modal ──────────────────────────────────────────────────────────

def _links_carro(o: str, d: str) -> dict:
    return {
        "google_maps": f"https://www.google.com/maps/dir/{urllib.parse.quote(o)}/{urllib.parse.quote(d)}",
        "waze":        f"https://waze.com/ul?q={urllib.parse.quote(d)}&navigate=yes",
    }


def _links_onibus(o: str, d: str, data_iso: str | None) -> dict:
    return {
        "buser":    f"https://www.buser.com.br/passagem-de-onibus/{urllib.parse.quote(o.lower())}/{urllib.parse.quote(d.lower())}",
        "clickbus": f"https://www.clickbus.com.br/passagem-de-onibus/{urllib.parse.quote(o)}/{urllib.parse.quote(d)}",
    }


def _links_aviao(o: str, d: str, data_iso: str | None) -> dict:
    ida = volta = ""
    if data_iso:
        try:
            dt   = datetime.fromisoformat(data_iso)
            ida  = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
            volta= (dt + timedelta(days=1)).strftime("%Y-%m-%d")
        except Exception:
            pass

    gf = f"https://www.google.com/travel/flights?q={urllib.parse.quote(f'Voos de {o} para {d} em {ida} voltando {volta}')}"

    def sky_slug(c): return c.split(",")[0].strip().lower().replace(" ", "-")
    try:
        sky_ida  = datetime.fromisoformat(ida).strftime("%y%m%d") if ida else ""
        sky_vol  = datetime.fromisoformat(volta).strftime("%y%m%d") if volta else ""
        sky = (
            f"https://www.skyscanner.com.br/transporte/passagens-aereas"
            f"/{sky_slug(o)}/{sky_slug(d)}/{sky_ida}/{sky_vol}"
            if sky_ida else "https://www.skyscanner.com.br"
        )
    except Exception:
        sky = "https://www.skyscanner.com.br"

    return {"google_flights": gf, "skyscanner": sky}


# ─── Função principal ─────────────────────────────────────────────────────────

# Cache em memória de rotas calculadas (origem+destino) — TTL 24h
_rota_cache: dict[str, tuple[dict, datetime]] = {}
_ROTA_TTL   = timedelta(hours=24)


def calcular_todas_opcoes(
    origem:        str,
    destino:       str,
    data_jogo_iso: str | None = None,
) -> dict:
    """
    Calcula as 3 opções de viagem (carro / ônibus / avião).
    Cache de rota em memória com TTL de 24h — a data_jogo não entra na chave
    pois afeta apenas os links (não os custos/distância).
    """
    cache_key = f"{origem.lower()}|{destino.lower()}"
    if cache_key in _rota_cache:
        cached_data, ts = _rota_cache[cache_key]
        if datetime.utcnow() - ts < _ROTA_TTL:
            # Apenas recalcula os links (dependem da data_jogo)
            result = dict(cached_data)
            result["opcoes"] = [_injetar_links(op, origem, destino, data_jogo_iso)
                                 for op in result["opcoes"]]
            return result

    c1 = obter_coords(origem)
    c2 = obter_coords(destino)
    if not c1 or not c2:
        return {"erro": f"Não foi possível localizar: {'origem' if not c1 else 'destino'}", "distancia_km": 0, "opcoes": [], "recomendacao": None}

    km     = int(geodesic(c1, c2).km)
    opcoes = _montar_opcoes(km, origem, destino, data_jogo_iso)

    # Score: 70% custo mínimo + 30% duração
    def score(op): return op["custo"]["min"] / 1000 * 0.70 + op["duracao_h"] / 24 * 0.30
    melhor = min(opcoes, key=score)
    melhor["recomendado"] = True

    result = {
        "origem":       origem,
        "destino":      destino,
        "distancia_km": km,
        "opcoes":       opcoes,
        "recomendacao": melhor["modal"],
    }

    # Cacheia sem links (links dependem de data_jogo que pode variar)
    sem_links = dict(result)
    sem_links["opcoes"] = [{k: v for k, v in op.items() if k != "links"} for op in opcoes]
    _rota_cache[cache_key] = (sem_links, datetime.utcnow())

    return result


def _montar_opcoes(km: int, o: str, d: str, data_iso: str | None) -> list[dict]:
    opcoes = [
        {"modal": "carro",  "emoji": "🚗", "label": "Carro",
         "custo": _custo_carro(km),  "duracao_h": _duracao_carro(km),
         "links": _links_carro(o, d),  "recomendado": False},
    ]
    if km >= 50:
        opcoes.append(
            {"modal": "onibus", "emoji": "🚌", "label": "Ônibus",
             "custo": _custo_onibus(km), "duracao_h": _duracao_onibus(km),
             "links": _links_onibus(o, d, data_iso), "recomendado": False}
        )
    if km >= 200:
        opcoes.append(
            {"modal": "aviao",  "emoji": "✈️",  "label": "Avião",
             "custo": _custo_aviao(km),  "duracao_h": _duracao_aviao(km),
             "links": _links_aviao(o, d, data_iso),  "recomendado": False}
        )
    return opcoes


def _injetar_links(op: dict, o: str, d: str, data_iso: str | None) -> dict:
    opcp = dict(op)
    if op["modal"]  == "carro":  opcp["links"] = _links_carro(o, d)
    elif op["modal"]== "onibus": opcp["links"] = _links_onibus(o, d, data_iso)
    elif op["modal"]== "aviao":  opcp["links"] = _links_aviao(o, d, data_iso)
    return opcp


# ─── Compat. com código legado ────────────────────────────────────────────────

def calcular_logistica(origem: str, destino: str) -> tuple[str, int]:
    c1 = obter_coords(origem); c2 = obter_coords(destino)
    if c1 and c2:
        km = int(geodesic(c1, c2).km)
        return ("CARRO" if km <= 500 else "AVIAO"), km
    return "INDEFINIDO", 0

def gerar_links_viagem(o: str, d: str, data_iso: str) -> tuple[str | None, str | None]:
    links = _links_aviao(o, d, data_iso)
    return links.get("google_flights"), links.get("skyscanner")

def calcular_custos_carro(km: int, consumo_kml: float = 10.0,
                           preco_gas: float = 5.80, pedagio_km: float = 0.15) -> float:
    ida_volta = km * 2
    return (ida_volta / consumo_kml) * preco_gas + ida_volta * pedagio_km

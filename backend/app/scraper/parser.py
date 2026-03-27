import time
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.scraper.client import get, team_image_url
from app.db.repositories.club_repo import consultar_estadio_por_id, consultar_estadio_do_clube

logger = logging.getLogger(__name__)


def _extrair_venue(e: dict) -> tuple[str, str]:
    """Extrai estádio e cidade de um evento. Fallback para banco local."""
    venue = e.get("venue") or {}
    if venue.get("name") and venue.get("city"):
        return venue["name"], venue["city"].get("name", "A definir")

    # Fallback: banco local pelo time da casa
    home_id = e["homeTeam"]["id"]
    dados = consultar_estadio_por_id(home_id)
    if not dados:
        dados = consultar_estadio_do_clube(e["homeTeam"]["name"])
    if dados:
        return dados["estadio"], dados["cidade"]

    return "A definir", "A definir"


def _buscar_venue_individual(event_id: int) -> tuple[str, str]:
    """Busca venue do endpoint individual /event/{id} quando a listagem não traz."""
    data = get(f"/event/{event_id}")
    if data:
        venue = data.get("event", {}).get("venue") or {}
        if venue.get("name") and venue.get("city"):
            return venue["name"], venue["city"].get("name", "A definir")
    return "A definir", "A definir"


def _montar_jogo(e: dict, time_id: int, estadio: str, cidade: str) -> dict:
    ts = e.get("startTimestamp")
    dt_obj = datetime.fromtimestamp(ts) if ts else None
    status = e["status"]["type"]
    placar = (
        f"{e.get('homeScore', {}).get('display', 0)} - {e.get('awayScore', {}).get('display', 0)}"
        if status == "finished" else "vs"
    )
    return {
        "id":        e["id"],
        "timestamp": ts,
        "data_fmt":  dt_obj.strftime("%d/%m/%Y %H:%M") if dt_obj else "TBD",
        "dt_obj":    dt_obj.isoformat() if dt_obj else None,
        "home":      e["homeTeam"]["name"],
        "home_id":   e["homeTeam"]["id"],
        "home_logo": team_image_url(e["homeTeam"]["id"]),
        "away":      e["awayTeam"]["name"],
        "away_id":   e["awayTeam"]["id"],
        "away_logo": team_image_url(e["awayTeam"]["id"]),
        "placar":    placar,
        "status":    status,
        "estadio":   estadio,
        "cidade":    cidade,
        "torneio":   e.get("tournament", {}).get("name"),
        "is_home":   e["homeTeam"]["id"] == time_id,
    }


def buscar_id_time(nome_time: str) -> dict | None:
    data = get(f"/search/{nome_time}")
    if not data:
        return None

    for item in data.get("results", []):
        entity = item.get("entity", {})
        if entity.get("sport", {}).get("name") != "Football":
            continue

        time_id = entity["id"]
        cor = "#000000"
        det = get(f"/team/{time_id}", timeout=5)
        if det:
            cor = det.get("team", {}).get("teamColors", {}).get("primary", "#000000")

        return {
            "id":   time_id,
            "nome": entity["name"],
            "pais": entity.get("country", {}).get("name"),
            "logo": team_image_url(time_id),
            "cor":  cor,
        }

    return None


def buscar_jogos(time_id: int, tipo: str = "next", limite_paginas: int | None = None) -> list[dict]:
    raw_events = []
    pagina = 0

    # 1. Coleta todos os eventos paginando
    while True:
        if limite_paginas is not None and pagina >= limite_paginas:
            break

        data = get(f"/team/{time_id}/events/{tipo}/{pagina}")
        if not data:
            break

        events = data.get("events", [])
        if not events:
            break

        raw_events.extend(events)

        if not data.get("hasNextPage", False):
            break

        pagina += 1
        time.sleep(0.3)

    if not raw_events:
        return []

    # 2. Separa eventos com e sem venue
    com_venue    = []
    sem_venue    = []

    for e in raw_events:
        venue = e.get("venue") or {}
        if venue.get("name") and venue.get("city"):
            com_venue.append(e)
        else:
            sem_venue.append(e)

    # 3. Para eventos sem venue, busca em paralelo via /event/{id}
    venue_map: dict[int, tuple[str, str]] = {}

    if sem_venue:
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {
                executor.submit(_buscar_venue_individual, e["id"]): e["id"]
                for e in sem_venue
            }
            for future in as_completed(futures):
                event_id = futures[future]
                try:
                    venue_map[event_id] = future.result()
                except Exception:
                    venue_map[event_id] = ("A definir", "A definir")

    # 4. Monta lista final
    jogos = []
    for e in raw_events:
        venue = e.get("venue") or {}
        if venue.get("name") and venue.get("city"):
            estadio = venue["name"]
            cidade  = venue["city"].get("name", "A definir")
        else:
            estadio, cidade = venue_map.get(e["id"], ("A definir", "A definir"))
            # Fallback banco local se ainda não resolveu
            if estadio == "A definir":
                estadio, cidade = _extrair_venue(e)

        jogos.append(_montar_jogo(e, time_id, estadio, cidade))

    return jogos


def buscar_detalhes_jogo(event_id: int) -> list[dict] | None:
    data = get(f"/event/{event_id}/incidents", timeout=5)
    if not data:
        return None

    gols = []
    for inc in data.get("incidents", []):
        if inc.get("incidentType") != "goal":
            continue

        jogador = inc.get("player", {}).get("shortName") or inc.get("player", {}).get("name", "Desconhecido")
        obs = " (GC)" if inc.get("incidentClass") == "ownGoal" else ""

        gols.append({
            "minuto":      inc.get("time"),
            "jogador":     f"{jogador}{obs}",
            "lado":        "home" if inc.get("isHome") else "away",
            "is_home_goal": inc.get("isHome"),
        })

    gols.sort(key=lambda x: x["minuto"])
    return gols


def buscar_jogos_por_ano(time_id: int, ano: int) -> list:
    """Busca todos os jogos passados de um time em um ano específico."""
    jogos = []
    pagina = 0
    ano_inicio = datetime(ano, 1, 1).timestamp()
    ano_fim    = datetime(ano, 12, 31, 23, 59, 59).timestamp()

    while True:
        data = get(f"/team/{time_id}/events/last/{pagina}")
        if not data:
            break

        events = data.get("events", [])
        if not events:
            break

        saiu_do_ano = False
        for e in events:
            ts = e.get("startTimestamp", 0)
            if ts < ano_inicio:
                saiu_do_ano = True
                break
            if ts > ano_fim:
                continue

            estadio, cidade = _extrair_venue(e)
            jogos.append(_montar_jogo(e, time_id, estadio, cidade))

        if saiu_do_ano or not data.get("hasNextPage", False):
            break

        pagina += 1
        time.sleep(0.2)

    jogos.sort(key=lambda x: x["timestamp"], reverse=True)
    return jogos

import time
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.scraper.client import get, team_image_url
from app.db.repositories.club_repo import consultar_estadio_por_id, consultar_estadio_do_clube

logger = logging.getLogger(__name__)


def _extrair_venue(e: dict) -> tuple[str, str]:
    venue = e.get("venue") or {}
    if venue.get("name") and venue.get("city"):
        return venue["name"], venue["city"].get("name", "A definir")
    home_id = e["homeTeam"]["id"]
    dados = consultar_estadio_por_id(home_id) or consultar_estadio_do_clube(e["homeTeam"]["name"])
    if dados:
        return dados["estadio"], dados["cidade"]
    return "A definir", "A definir"


def _buscar_venue_individual(event_id: int) -> tuple[str, str]:
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


def _resolver_venues(raw_events: list) -> dict[int, tuple[str, str]]:
    """Resolve venues em paralelo para eventos que não têm venue na listagem."""
    sem_venue = [e for e in raw_events if not (e.get("venue") or {}).get("name")]
    venue_map: dict[int, tuple[str, str]] = {}
    if not sem_venue:
        return venue_map
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(_buscar_venue_individual, e["id"]): e["id"] for e in sem_venue}
        for future in as_completed(futures):
            eid = futures[future]
            try:
                venue_map[eid] = future.result()
            except Exception:
                venue_map[eid] = ("A definir", "A definir")
    return venue_map


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
        return {"id": time_id, "nome": entity["name"],
                "pais": entity.get("country", {}).get("name"),
                "logo": team_image_url(time_id), "cor": cor}
    return None


def buscar_jogos(time_id: int, tipo: str = "next", limite_paginas: int | None = None) -> list[dict]:
    raw_events = []
    pagina = 0
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

    venue_map = _resolver_venues(raw_events)
    jogos = []
    for e in raw_events:
        venue = e.get("venue") or {}
        if venue.get("name") and venue.get("city"):
            estadio, cidade = venue["name"], venue["city"].get("name", "A definir")
        else:
            estadio, cidade = venue_map.get(e["id"], _extrair_venue(e))
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
        gols.append({"minuto": inc.get("time"), "jogador": f"{jogador}{obs}",
                     "lado": "home" if inc.get("isHome") else "away",
                     "is_home_goal": inc.get("isHome")})
    gols.sort(key=lambda x: x["minuto"])
    return gols


def buscar_jogos_por_ano(time_id: int, ano: int) -> list:
    from datetime import datetime, timezone
    
    agora = datetime.now().timestamp()
    ano_atual = datetime.now().year
    raw_events = []
    ids_vistos = set()

    # --- Jogos PASSADOS (last/) ---
    pagina = 0
    while True:
        data = get(f"/team/{time_id}/events/last/{pagina}")
        if not data:
            break
        events = data.get("events", [])
        if not events:
            break

        achou_ano = False
        passou_do_ano = False

        for e in events:
            ts = e.get("startTimestamp")
            if not ts:
                continue
            ano_jogo = datetime.fromtimestamp(ts).year
            if ano_jogo == ano:
                achou_ano = True
                if e["id"] not in ids_vistos:
                    raw_events.append(e)
                    ids_vistos.add(e["id"])
            elif ano_jogo < ano:
                # SofaScore pagina do mais recente para o mais antigo.
                # Se já passamos do ano buscado, não há mais o que encontrar.
                passou_do_ano = True

        if passou_do_ano:
            break  # Early exit: não precisa varrer páginas mais antigas

        if not data.get("hasNextPage", False):
            break
        pagina += 1
        time.sleep(0.2)

    # --- Jogos FUTUROS / recém-terminados que o SofaScore ainda não moveu (next/) ---
    # Só busca se for o ano atual ou futuro
    if ano >= ano_atual:
        pagina = 0
        while True:
            data = get(f"/team/{time_id}/events/next/{pagina}")
            if not data:
                break
            events = data.get("events", [])
            if not events:
                break
            for e in events:
                ts = e.get("startTimestamp")
                if not ts:
                    continue
                if datetime.fromtimestamp(ts).year == ano and e["id"] not in ids_vistos:
                    raw_events.append(e)
                    ids_vistos.add(e["id"])
            if not data.get("hasNextPage", False):
                break
            pagina += 1
            time.sleep(0.2)

    if not raw_events:
        return []

    # Filtra: já aconteceu (timestamp no passado) OU status finished
    # Para anos passados: só finished. Para ano atual: aceita qualquer um que já passou.
    def jogo_valido(e):
        ts = e.get("startTimestamp", 0)
        status = e.get("status", {}).get("type", "")
        if status == "finished":
            return True
        # Aceita jogos que claramente já ocorreram (passado há mais de 2h)
        if ts and ts < (agora - 7200):
            return True
        return False

    eventos_filtrados = [e for e in raw_events if jogo_valido(e)]

    if not eventos_filtrados:
        return []

    venue_map = _resolver_venues(eventos_filtrados)
    jogos = []
    for e in eventos_filtrados:
        venue = e.get("venue") or {}
        if venue.get("name") and venue.get("city"):
            estadio, cidade = venue["name"], venue["city"].get("name", "A definir")
        else:
            estadio, cidade = venue_map.get(e["id"], _extrair_venue(e))
        jogos.append(_montar_jogo(e, time_id, estadio, cidade))

    jogos.sort(key=lambda x: x["timestamp"], reverse=True)
    return jogos
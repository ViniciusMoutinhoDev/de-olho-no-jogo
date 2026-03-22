import time
import logging
from datetime import datetime

from app.scraper.client import get, team_image_url
from app.db.repositories.club_repo import consultar_estadio_por_id, consultar_estadio_do_clube

logger = logging.getLogger(__name__)


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
            "id": time_id,
            "nome": entity["name"],
            "pais": entity.get("country", {}).get("name"),
            "logo": team_image_url(time_id),
            "cor": cor,
        }

    return None


def buscar_jogos(time_id: int, tipo: str = "next", limite_paginas: int | None = None) -> list[dict]:
    jogos = []
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

        for e in events:
            estadio_nome = "A definir"
            cidade_nome = "A definir"

            if "venue" in e and e["venue"].get("city"):
                estadio_nome = e["venue"].get("name", "A definir")
                cidade_nome = e["venue"].get("city", {}).get("name", "A definir")
            else:
                home_id = e["homeTeam"]["id"]
                dados = consultar_estadio_por_id(home_id)
                if not dados:
                    dados = consultar_estadio_do_clube(e["homeTeam"]["name"])
                if dados:
                    estadio_nome = dados["estadio"]
                    cidade_nome = dados["cidade"]

            ts = e.get("startTimestamp")
            dt_obj = datetime.fromtimestamp(ts) if ts else None
            status = e["status"]["type"]
            placar = (
                f"{e.get('homeScore', {}).get('display', 0)} - {e.get('awayScore', {}).get('display', 0)}"
                if status == "finished"
                else "vs"
            )

            jogos.append({
                "id": e["id"],
                "timestamp": ts,
                "data_fmt": dt_obj.strftime("%d/%m/%Y %H:%M") if dt_obj else "TBD",
                "dt_obj": dt_obj.isoformat() if dt_obj else None,
                "home": e["homeTeam"]["name"],
                "home_id": e["homeTeam"]["id"],
                "home_logo": team_image_url(e["homeTeam"]["id"]),
                "away": e["awayTeam"]["name"],
                "away_id": e["awayTeam"]["id"],
                "away_logo": team_image_url(e["awayTeam"]["id"]),
                "placar": placar,
                "status": status,
                "estadio": estadio_nome,
                "cidade": cidade_nome,
                "torneio": e.get("tournament", {}).get("name"),
                "is_home": e["homeTeam"]["id"] == time_id,
            })

        if not data.get("hasNextPage", False):
            break

        pagina += 1
        time.sleep(0.3)

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
            "minuto": inc.get("time"),
            "jogador": f"{jogador}{obs}",
            "lado": "home" if inc.get("isHome") else "away",
            "is_home_goal": inc.get("isHome"),
        })

    gols.sort(key=lambda x: x["minuto"])
    return gols

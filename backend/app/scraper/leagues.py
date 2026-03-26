from app.scraper.client import get, team_image_url
from curl_cffi import requests


PAISES = [
    {"id": "brasil",    "nome": "Brasil",     "bandeira": "🇧🇷"},
    {"id": "england",   "nome": "Inglaterra", "bandeira": "🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
    {"id": "spain",     "nome": "Espanha",    "bandeira": "🇪🇸"},
    {"id": "france",    "nome": "França",     "bandeira": "🇫🇷"},
    {"id": "argentina", "nome": "Argentina",  "bandeira": "🇦🇷"},
]

LIGAS_POR_PAIS = {
    "brasil": [
        {"id": 325,  "nome": "Brasileirão Série A",  "tipo": "liga"},
        {"id": 390,  "nome": "Copa do Brasil",        "tipo": "copa"},
        {"id": 62,  "nome": "Campeonato Paulista",   "tipo": "liga"},
        {"id": 244,  "nome": "Campeonato Carioca",    "tipo": "liga"},
        {"id": 77,   "nome": "Brasileirão Série B",   "tipo": "liga"},
    ],
    "england": [
        {"id": 17,   "nome": "Premier League",        "tipo": "liga"},
        {"id": 24,   "nome": "Championship",          "tipo": "liga"},
        {"id": 19,   "nome": "FA Cup",                "tipo": "copa"},
        {"id": 21,   "nome": "EFL Cup",               "tipo": "copa"},
    ],
    "spain": [
        {"id": 8,    "nome": "La Liga",               "tipo": "liga"},
        {"id": 11,   "nome": "La Liga 2",             "tipo": "liga"},
        {"id": 329,  "nome": "Copa del Rey",          "tipo": "copa"},
    ],
    "france": [
        {"id": 34,   "nome": "Ligue 1",               "tipo": "liga"},
        {"id": 182,  "nome": "Ligue 2",               "tipo": "liga"},
        {"id": 192,  "nome": "Coupe de France",       "tipo": "copa"},
    ],
    "argentina": [
        {"id": 155,  "nome": "Liga Profesional",      "tipo": "liga"},
        {"id": 703,  "nome": "Primera Nacional",      "tipo": "liga"},
        {"id": 475,  "nome": "Copa de la Liga",       "tipo": "copa"},
    ],
}

# Mapeamento pelo texto exato do SofaScore (promotion.text)
# Chave em lowercase para comparação case-insensitive
PROMOTION_TEXT_MAP = {
    # Champions / topo europeu
    "champions league":         {"cor": "#00C07F", "label": "Champions League"},
    "champions league q.":      {"cor": "#00C07F", "label": "Champions League"},
    # Europa League
    "europa league":            {"cor": "#60A5FA", "label": "Europa League"},
    "europa league q.":         {"cor": "#60A5FA", "label": "Europa League"},
    # Conference League
    "conference league":        {"cor": "#A78BFA", "label": "Conference League"},
    "conference league q.":     {"cor": "#A78BFA", "label": "Conference League"},
    # Rebaixamento
    "relegation":               {"cor": "#F87171", "label": "Rebaixamento"},
    "relegation playoff":       {"cor": "#F59E0B", "label": "Playoff rebaixamento"},
    "playoff":                  {"cor": "#F59E0B", "label": "Playoff"},
    # Libertadores
    "libertadores":             {"cor": "#00C07F", "label": "Libertadores"},
    "copa libertadores":        {"cor": "#00C07F", "label": "Libertadores"},
    # Sul-Americana
    "sul-americana":            {"cor": "#60A5FA", "label": "Sul-Americana"},
    "copa sudamericana":        {"cor": "#60A5FA", "label": "Sul-Americana"},
    "sudamericana":             {"cor": "#60A5FA", "label": "Sul-Americana"},
    # Promoção genérica (Série B → Série A, etc.)
    "promotion":                {"cor": "#00C07F", "label": "Promoção"},
    "promotion playoff":        {"cor": "#F59E0B", "label": "Playoff promoção"},
    # Próxima fase (copas)
    "next round":               {"cor": "#00C07F", "label": "Próxima fase"},
    "knockout stage":           {"cor": "#00C07F", "label": "Fase eliminatória"},
    # Série B Brasil
    "série b":                  {"cor": "#F87171", "label": "Rebaixamento (Série B)"},
    "serie b":                  {"cor": "#F87171", "label": "Rebaixamento (Série B)"},
}


def _parse_promotion(row: dict) -> dict:
    """
    Extrai cor e label diretamente do campo promotion.text do SofaScore.
    Usa apenas text e id — não existe campo type na API real.
    """
    promo = row.get("promotion")
    if not promo:
        return {"cor": None, "label": None, "texto": None}

    texto = promo.get("text", "") or ""
    texto_lower = texto.lower().strip()

    # Busca exata primeiro
    mapped = PROMOTION_TEXT_MAP.get(texto_lower)

    # Busca por palavras-chave se não encontrou
    if not mapped:
        if "relegat" in texto_lower or "descenso" in texto_lower:
            if "playoff" in texto_lower:
                mapped = {"cor": "#F59E0B", "label": "Playoff rebaixamento"}
            else:
                mapped = {"cor": "#F87171", "label": "Rebaixamento"}
        elif "champion" in texto_lower:
            mapped = {"cor": "#00C07F", "label": "Champions League"}
        elif "europa" in texto_lower:
            mapped = {"cor": "#60A5FA", "label": "Europa League"}
        elif "conference" in texto_lower:
            mapped = {"cor": "#A78BFA", "label": "Conference League"}
        elif "libertad" in texto_lower:
            mapped = {"cor": "#00C07F", "label": "Libertadores"}
        elif "sudamerica" in texto_lower or "sul-americ" in texto_lower:
            mapped = {"cor": "#60A5FA", "label": "Sul-Americana"}
        elif "promot" in texto_lower:
            if "playoff" in texto_lower:
                mapped = {"cor": "#F59E0B", "label": "Playoff promoção"}
            else:
                mapped = {"cor": "#00C07F", "label": "Promoção"}
        elif "playoff" in texto_lower:
            mapped = {"cor": "#F59E0B", "label": "Playoff"}
        else:
            # Fallback — mostra o texto original com cor neutra
            mapped = {"cor": "#7A8BA6", "label": texto}

    return {
        "cor":   mapped["cor"],
        "label": mapped["label"],
        "texto": texto,
    }


def buscar_info_liga(tournament_id):
    data = get(f"/tournament/{tournament_id}")
    if not data:
        return {"error": "Erro ao buscar liga"}

    tournament = data.get("tournament", {})
    country = tournament.get("category", {})
    country_code = country.get("alpha2")

    flag_url = f"https://img.sofascore.com/api/v1/country/{country_code}/flag"

    return {
        "liga": tournament.get("name"),
        "pais": country.get("name"),
        "flag": flag_url
    }

def buscar_tabela_liga(tournament_id: int, season_id: int | None = None) -> dict:
    
    if not season_id:
        data = get(f"/unique-tournament/{tournament_id}/seasons")
        if not data:
            return {"error": "Não foi possível buscar temporadas"}
        seasons = data.get("seasons", [])
        if not seasons:
            return {"error": "Nenhuma temporada encontrada"}
        season_id = seasons[0]["id"]

    data = get(f"/unique-tournament/{tournament_id}/season/{season_id}/standings/total")
    if not data:
        return {"error": "Standings não disponíveis"}

    standings = data.get("standings", [])
    resultado = {
        "tournament_id": tournament_id,
        "season_id":     season_id,
        "grupos":        [],
        "legenda":       [],

    }

    # Para deduplicar legenda por label
    legenda_map = {}

    for group in standings:
        rows = []
        for row in group.get("rows", []):
            team = row.get("team", {})
            promo = _parse_promotion(row)

            if promo["cor"] and promo["label"] not in legenda_map.values():
                legenda_map[promo["cor"]] = promo["label"]

            rows.append({
                "posicao":     row.get("position"),
                "time_id":     team.get("id"),
                "time":        team.get("name"),
                "logo":        team_image_url(team.get("id", 0)),
                "jogos":       row.get("matches"),
                "vitorias":    row.get("wins"),
                "empates":     row.get("draws"),
                "derrotas":    row.get("losses"),
                "gols_pro":    row.get("scoresFor"),
                "gols_contra": row.get("scoresAgainst"),
                "saldo":       row.get("scoreDiff"),
                "pontos":      row.get("points"),
                "promo_cor":   promo["cor"],
                "promo_label": promo["label"],
                "promo_texto": promo["texto"],
            })

        resultado["grupos"].append({
            "nome":   group.get("name", ""),
            "tabela": rows,
        })

    resultado["legenda"] = [{"cor": k, "label": v} for k, v in legenda_map.items()]
    return resultado


def buscar_jogos_liga(tournament_id: int, season_id: int | None = None, rodada: int | None = None) -> list:
    if not season_id:
        data = get(f"/unique-tournament/{tournament_id}/seasons")
        if not data:
            return []
        seasons = data.get("seasons", [])
        if not seasons:
            return []
        season_id = seasons[0]["id"]

    path = (
        f"/unique-tournament/{tournament_id}/season/{season_id}/events/round/{rodada}"
        if rodada else
        f"/unique-tournament/{tournament_id}/season/{season_id}/events/last/0"
    )

    data = get(path)
    if not data:
        return []

    jogos = []
    for e in data.get("events", []):
        from datetime import datetime
        ts = e.get("startTimestamp")
        dt = datetime.fromtimestamp(ts).isoformat() if ts else None
        status = e["status"]["type"]
        placar = (
            f"{e.get('homeScore',{}).get('display',0)} - {e.get('awayScore',{}).get('display',0)}"
            if status == "finished" else "vs"
        )
        jogos.append({
            "id":        e["id"],
            "timestamp": ts,
            "dt_obj":    dt,
            "data_fmt":  datetime.fromtimestamp(ts).strftime("%d/%m %H:%M") if ts else "TBD",
            "home":      e["homeTeam"]["name"],
            "home_logo": team_image_url(e["homeTeam"]["id"]),
            "away":      e["awayTeam"]["name"],
            "away_logo": team_image_url(e["awayTeam"]["id"]),
            "placar":    placar,
            "status":    status,
            "rodada":    e.get("roundInfo", {}).get("round"),
        })
    return jogos


import logging
from app.scraper.client import get, team_image_url

logger = logging.getLogger(__name__)

# Lista de países exibidos na UI
PAISES = [
    {"id": "brasil",    "nome": "Brasil",     "bandeira": "🇧🇷"},
    {"id": "england",   "nome": "Inglaterra", "bandeira": "🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
    {"id": "spain",     "nome": "Espanha",    "bandeira": "🇪🇸"},
    {"id": "france",    "nome": "França",     "bandeira": "🇫🇷"},
    {"id": "argentina", "nome": "Argentina",  "bandeira": "🇦🇷"},
    {"id": "germany",   "nome": "Alemanha",   "bandeira": "🇩🇪"},
    {"id": "italy",     "nome": "Itália",     "bandeira": "🇮🇹"},
    {"id": "portugal",  "nome": "Portugal",   "bandeira": "🇵🇹"},
    {"id": "usa",       "nome": "EUA",        "bandeira": "🇺🇸"},
    {"id": "mexico",    "nome": "México",     "bandeira": "🇲🇽"},
]

# Torneios âncora: IDs que sabemos com certeza serem corretos
# Usados para descobrir o category_id real do país no SofaScore
_ANCHOR_TOURNAMENTS = {
    "brasil":    325,   # Brasileirão Série A
    "england":   17,    # Premier League
    "spain":     8,     # La Liga
    "france":    34,    # Ligue 1
    "argentina": 155,   # Liga Profesional Argentina
    "germany":   35,    # Bundesliga
    "italy":     23,    # Serie A (Itália)
    "portugal":  238,   # Primeira Liga
    "usa":       242,   # MLS
    "mexico":    52,    # Liga MX
}

# Cache: pais_id → category_id (descoberto via API)
_cache_category: dict[str, int] = {}

# Cache: category_id → lista de ligas
_cache_ligas: dict[int, list] = {}


def _descobrir_category_id(pais_id: str) -> int | None:
    """
    Descobre o category_id real do SofaScore usando um torneio âncora conhecido.
    Ex: buscando '/unique-tournament/325' retorna o category.id do Brasil.
    """
    if pais_id in _cache_category:
        return _cache_category[pais_id]

    anchor_id = _ANCHOR_TOURNAMENTS.get(pais_id)
    if not anchor_id:
        return None

    data = get(f"/unique-tournament/{anchor_id}")
    if not data:
        return None

    cat_id = (
        data.get("uniqueTournament", {})
            .get("category", {})
            .get("id")
    )
    if cat_id:
        _cache_category[pais_id] = cat_id
        logger.info(f"Descoberto category_id para '{pais_id}': {cat_id}")
    return cat_id



def _parse_torneios(raw_tournaments: list[dict], principal: bool) -> list[dict]:
    """Converte lista bruta de torneios no formato padronizado."""
    ligas: list[dict] = []
    vistos: set[int] = set()
    for t in raw_tournaments:
        tid = t.get("id")
        if not tid or tid in vistos:
            continue
        vistos.add(tid)
        nome = t.get("name", "") or t.get("translationKey", "") or ""
        if not nome:
            continue
        nome_lower = nome.lower()
        tipo = "copa" if any(w in nome_lower for w in [
            "cup", "copa", "coupe", "pokal", "coppa", "taça",
            "supercup", "supercoppa", "shield", "trophy", "trofeo",
        ]) else "liga"
        ligas.append({
            "id":        tid,
            "nome":      nome,
            "tipo":      tipo,
            "slug":      t.get("slug", ""),
            "principal": principal,
        })
    return ligas


def buscar_ligas_por_categoria(pais_id: str) -> dict:
    """
    Retorna as ligas de um país divididas em:
      - principais: grupo "Popular" do SofaScore (as mais importantes)
      - todas:      todas as ligas disponíveis (incluindo divisões inferiores)
    """
    category_id = _descobrir_category_id(pais_id)
    if not category_id:
        logger.warning(f"Não foi possível descobrir category_id para '{pais_id}'")
        return {"principais": [], "todas": []}

    cache_key = f"{category_id}"
    if cache_key in _cache_ligas:
        return _cache_ligas[cache_key]

    data = get(f"/category/{category_id}/unique-tournaments")
    if not data:
        return {"principais": [], "todas": []}

    principais: list[dict] = []
    todas:      list[dict] = []

    try:
        grupos = data.get("groups", [])
        if grupos:
            for i, grupo in enumerate(grupos):
                nome_grupo = (grupo.get("name") or "").lower()
                # O primeiro grupo OU grupos com "popular" no nome = principais
                is_principal = (i == 0) or ("popular" in nome_grupo)
                torneios = _parse_torneios(
                    grupo.get("uniqueTournaments", []),
                    principal=is_principal
                )
                if is_principal:
                    principais.extend(torneios)
                todas.extend(torneios)
        else:
            # Estrutura plana sem groups
            flat = _parse_torneios(data.get("uniqueTournaments", []), principal=True)
            principais = flat
            todas      = flat

    except Exception as e:
        logger.error(f"Erro ao parsear ligas da categoria {category_id}: {e}")

    # Ordena: ligas antes de copas, depois alfabético
    _sort = lambda lst: sorted(lst, key=lambda x: (x["tipo"] == "copa", x["nome"].lower()))
    resultado = {
        "principais": _sort(principais),
        "todas":      _sort(todas),
    }

    if resultado["principais"] or resultado["todas"]:
        _cache_ligas[cache_key] = resultado
    return resultado




def buscar_ligas_por_nome(query: str) -> list[dict]:
    """
    Busca ligas/torneios por nome usando o endpoint de search do SofaScore.
    Retorna lista de {id, nome, tipo, pais} com dados reais.
    """
    if not query or len(query.strip()) < 2:
        return []

    data = get(f"/search/{query.strip()}")
    if not data:
        return []

    ligas = []
    vistos = set()

    for item in data.get("results", []):
        entity = item.get("entity", {})
        # Filtra apenas entidades do tipo "UniqueOfficialTournament" ou "UniqueTournament"
        entity_type = item.get("type", "")
        if "tournament" not in entity_type.lower() and "Tournament" not in entity_type:
            continue

        tid = entity.get("id")
        if not tid or tid in vistos:
            continue
        vistos.add(tid)

        nome = entity.get("name", "")
        pais = entity.get("category", {}).get("name", "") if entity.get("category") else ""
        nome_lower = nome.lower()
        tipo = "liga"
        if any(w in nome_lower for w in ["cup", "copa", "coupe", "pokal", "coppa", "taça", "supercup"]):
            tipo = "copa"

        ligas.append({
            "id":   tid,
            "nome": nome,
            "tipo": tipo,
            "pais": pais,
        })

    return ligas[:10]  # Limita a 10 resultados


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


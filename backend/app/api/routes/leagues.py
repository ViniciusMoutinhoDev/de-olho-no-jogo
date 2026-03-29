from fastapi import APIRouter, HTTPException, Query
from app.scraper.leagues import (
    PAISES,
    buscar_ligas_por_categoria,
    buscar_ligas_por_nome,
    buscar_tabela_liga,
    buscar_jogos_liga,
    buscar_info_liga,
)

router = APIRouter()


@router.get("/paises")
def listar_paises():
    return PAISES


@router.get("/search")
def search_ligas(q: str = Query(..., min_length=2)):
    """Busca ligas/torneios por nome no SofaScore."""
    return buscar_ligas_por_nome(q)


@router.get("/{pais_id}/ligas")
def listar_ligas(pais_id: str):
    """
    Retorna as ligas de um país divididas em:
    - principais: ligas do grupo Popular (exibição padrão)
    - todas: todas as ligas incluindo divisões inferiores (para busca)
    """
    resultado = buscar_ligas_por_categoria(pais_id)
    if not resultado["principais"] and not resultado["todas"]:
        raise HTTPException(status_code=404, detail="País não encontrado ou sem ligas")
    return resultado


@router.get("/{tournament_id}/tabela")
def tabela(
    tournament_id: int,
    season_id: int = Query(None),
):
    result = buscar_tabela_liga(tournament_id, season_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/{tournament_id}/jogos")
def jogos_liga(
    tournament_id: int,
    season_id: int = Query(None),
    rodada: int = Query(None),
):
    return buscar_jogos_liga(tournament_id, season_id, rodada)


@router.get("/{tournament_id}/info")
def info_liga(tournament_id: int):
    result = buscar_info_liga(tournament_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
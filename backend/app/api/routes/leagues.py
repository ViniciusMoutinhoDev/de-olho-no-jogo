from fastapi import APIRouter, HTTPException, Query
from app.scraper.leagues import (
    PAISES, LIGAS_POR_PAIS, buscar_tabela_liga, buscar_jogos_liga
)

from app.scraper.leagues import buscar_info_liga
router = APIRouter()


@router.get("/paises")
def listar_paises():
    return PAISES


@router.get("/{pais_id}/ligas")
def listar_ligas(pais_id: str):
    ligas = LIGAS_POR_PAIS.get(pais_id)
    if ligas is None:
        raise HTTPException(status_code=404, detail="País não encontrado")
    return ligas


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
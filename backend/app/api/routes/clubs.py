from fastapi import APIRouter, HTTPException, Query

from app.scraper.parser import buscar_id_time, buscar_jogos
from app.db.repositories.club_repo import listar_todos_clubes

router = APIRouter()


@router.get("/")
def listar_clubes():
    return listar_todos_clubes()


@router.get("/search")
def search_clube(nome: str = Query(..., min_length=2)):
    result = buscar_id_time(nome)
    if not result:
        raise HTTPException(status_code=404, detail="Clube não encontrado")
    return result


@router.get("/{club_id}/matches")
def matches_clube(
    club_id: int,
    tipo: str = Query("next", pattern="^(next|last)$"),
    limite_paginas: int = Query(None, ge=1, le=20),
):
    jogos = buscar_jogos(club_id, tipo=tipo, limite_paginas=limite_paginas)
    return jogos

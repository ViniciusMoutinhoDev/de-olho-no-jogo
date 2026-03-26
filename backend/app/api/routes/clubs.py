from fastapi import APIRouter, HTTPException, Query
from app.scraper.parser import buscar_id_time, buscar_jogos, buscar_detalhes_jogo, buscar_jogos_por_ano
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
    return buscar_jogos(club_id, tipo=tipo, limite_paginas=limite_paginas)


@router.get("/{club_id}/historico/{ano}")
def historico_por_ano(club_id: int, ano: int):
    """Retorna todos os jogos de um clube em um ano específico."""
    if ano < 2000 or ano > 2030:
        raise HTTPException(status_code=400, detail="Ano inválido")
    jogos = buscar_jogos_por_ano(club_id, ano)
    return {"ano": ano, "total": len(jogos), "jogos": jogos}

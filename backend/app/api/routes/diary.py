from fastapi import APIRouter, Depends, HTTPException

from app.db.models import JogoPayload
from app.db.repositories.diary_repo import (
    ler_diario,
    adicionar_ao_diario,
    remover_do_diario,
    verificar_jogo_no_diario,
)
from app.core.security import get_current_user_id

router = APIRouter()


@router.get("/")
def get_diario(user_id: int = Depends(get_current_user_id)):
    return ler_diario(user_id)


@router.post("/", status_code=201)
def add_jogo(jogo: JogoPayload, user_id: int = Depends(get_current_user_id)):
    ok = adicionar_ao_diario(user_id, jogo.model_dump())
    if not ok:
        raise HTTPException(status_code=409, detail="Jogo já salvo no diário")
    return {"message": "Jogo adicionado"}


@router.delete("/{id_sofascore}")
def remove_jogo(id_sofascore: int, user_id: int = Depends(get_current_user_id)):
    remover_do_diario(user_id, id_sofascore)
    return {"message": "Jogo removido"}


@router.get("/{id_sofascore}/check")
def check_jogo(id_sofascore: int, user_id: int = Depends(get_current_user_id)):
    return {"saved": verificar_jogo_no_diario(user_id, id_sofascore)}

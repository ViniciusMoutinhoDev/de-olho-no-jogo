from fastapi import APIRouter, HTTPException, Depends, status

from app.db.models import UsuarioCreate, UsuarioLogin, TokenResponse, ClubeCoracaoPayload
from app.db.repositories.user_repo import (
    criar_usuario, buscar_usuario_por_email,
    buscar_usuario_por_id, salvar_clube_coracao, remover_clube_coracao,
    atualizar_cidade_origem,
)
from app.core.security import hash_senha, verificar_senha, criar_token, get_current_user_id

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UsuarioCreate):
    if buscar_usuario_por_email(payload.email):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    ok = criar_usuario(payload.email, hash_senha(payload.senha), payload.nome, payload.cidade_origem)
    if not ok:
        raise HTTPException(status_code=500, detail="Erro ao criar usuário")
    return {"message": "Usuário criado com sucesso"}


@router.post("/login", response_model=TokenResponse)
def login(payload: UsuarioLogin):
    user = buscar_usuario_por_email(payload.email)
    if not user or not verificar_senha(payload.senha, user["senha_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = criar_token(user["id"])
    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        nome=user["nome"],
        cidade_origem=user["cidade_origem"],
        clube_coracao_id=user.get("clube_coracao_id"),
        clube_coracao_nome=user.get("clube_coracao_nome"),
        clube_coracao_logo=user.get("clube_coracao_logo"),
        endereco_casa=user.get("endereco_casa"),
        endereco_trabalho=user.get("endereco_trabalho"),
    )


@router.get("/me")
def me(user_id: int = Depends(get_current_user_id)):
    user = buscar_usuario_por_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.pop("senha_hash", None)
    return user


@router.put("/enderecos")
def atualizar_enderecos_route(payload: dict, user_id: int = Depends(get_current_user_id)):
    """Atualiza o endereço de casa ou do trabalho do usuário."""
    from app.db.repositories.user_repo import atualizar_enderecos
    
    tipo = payload.get("tipo")
    endereco = (payload.get("endereco") or "").strip()
    
    if tipo not in ["casa", "trabalho"]:
        raise HTTPException(status_code=400, detail="Tipo inválido. Use 'casa' ou 'trabalho'.")
        
    ok = atualizar_enderecos(user_id, tipo, endereco)
    if not ok:
        raise HTTPException(status_code=500, detail="Erro ao atualizar endereço")
    return {"tipo": tipo, "endereco": endereco}


@router.post("/clube-coracao")
def set_clube_coracao(payload: ClubeCoracaoPayload, user_id: int = Depends(get_current_user_id)):
    salvar_clube_coracao(user_id, payload.clube_id, payload.nome, payload.logo)
    return {"message": "Clube do coração salvo"}


@router.delete("/clube-coracao")
def del_clube_coracao(user_id: int = Depends(get_current_user_id)):
    remover_clube_coracao(user_id)
    return {"message": "Clube do coração removido"}


@router.put("/cidade")
def atualizar_cidade(payload: dict, user_id: int = Depends(get_current_user_id)):
    """Atualiza a cidade de origem do usuário."""
    cidade = (payload.get("cidade") or "").strip()
    if not cidade:
        raise HTTPException(status_code=400, detail="Cidade inválida")
    ok = atualizar_cidade_origem(user_id, cidade)
    if not ok:
        raise HTTPException(status_code=500, detail="Erro ao atualizar cidade")
    return {"cidade_origem": cidade}

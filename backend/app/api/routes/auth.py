from fastapi import APIRouter, HTTPException, status

from app.db.models import UsuarioCreate, UsuarioLogin, TokenResponse
from app.db.repositories.user_repo import criar_usuario, buscar_usuario_por_email
from app.core.security import hash_senha, verificar_senha, criar_token

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UsuarioCreate):
    if buscar_usuario_por_email(payload.email):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    ok = criar_usuario(
        email=payload.email,
        senha_hash=hash_senha(payload.senha),
        nome=payload.nome,
        cidade=payload.cidade_origem,
    )
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
    )

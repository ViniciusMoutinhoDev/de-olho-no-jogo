from pydantic import BaseModel
from typing import Optional


# --- Auth ---
class UsuarioCreate(BaseModel):
    email: str
    senha: str
    nome: str
    cidade_origem: str = "São Paulo"


class UsuarioLogin(BaseModel):
    email: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    nome: str
    cidade_origem: str


# --- Diário ---
class JogoPayload(BaseModel):
    id: int
    data_fmt: str
    home: str
    away: str
    estadio: str
    cidade: str
    placar: str
    torneio: Optional[str] = "Amistoso"
    home_logo: Optional[str] = ""
    away_logo: Optional[str] = ""


class DiarioEntry(BaseModel):
    id: int
    user_id: int
    id_jogo_sofascore: int
    data_jogo: str
    match_name: str
    estadio: str
    cidade: str
    placar: str
    torneio: Optional[str]
    home_logo: Optional[str]
    away_logo: Optional[str]
from pydantic import BaseModel
from typing import Optional


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
    clube_coracao_id:   Optional[int]  = None
    clube_coracao_nome: Optional[str]  = None
    clube_coracao_logo: Optional[str]  = None


class ClubeCoracaoPayload(BaseModel):
    clube_id:   int
    nome:       str
    logo:       str


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

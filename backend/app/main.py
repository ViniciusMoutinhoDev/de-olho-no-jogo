from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import inicializar_banco
from app.api.routes import auth, clubs, diary, travel, leagues

app = FastAPI(title="De Olho No Jogo", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/api/auth",    tags=["auth"])
app.include_router(clubs.router,   prefix="/api/clubs",   tags=["clubs"])
app.include_router(diary.router,   prefix="/api/diary",   tags=["diary"])
app.include_router(travel.router,  prefix="/api/travel",  tags=["travel"])
app.include_router(leagues.router, prefix="/api/leagues", tags=["leagues"])


@app.on_event("startup")
def startup():
    inicializar_banco()


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.1.0"}

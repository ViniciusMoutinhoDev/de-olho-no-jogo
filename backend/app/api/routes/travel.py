from fastapi import APIRouter, Query

from app.core.logistics import (
    calcular_logistica,
    gerar_links_viagem,
    calcular_custos_carro,
    calcular_todas_opcoes,
    _cidade_para_iata,
)

router = APIRouter()


@router.get("/opcoes")
def opcoes_viagem(
    origem:     str = Query(..., description="Cidade de origem, ex: São Paulo"),
    destino:    str = Query(..., description="Cidade do estádio, ex: Belo Horizonte"),
    data_jogo:  str = Query(None, description="ISO datetime do jogo, ex: 2026-04-15T16:00:00"),
):
    """
    Retorna as 3 opções de viagem (carro, ônibus, avião) com:
    - estimativa de custo (min/max em R$)
    - duração estimada em horas
    - links para plataformas de compra/planejamento
    - recomendação automática por melhor custo-benefício
    - códigos IATA dos aeroportos (quando detectados)
    """
    result = calcular_todas_opcoes(origem, destino, data_jogo)
    # Adiciona IATA para o frontend exibir "GRU → POA"
    result["iata_origem"]  = _cidade_para_iata(origem)
    result["iata_destino"] = _cidade_para_iata(destino)
    return result


# ─── Endpoints legados (mantidos para compatibilidade) ────────────────────────

@router.get("/logistics")
def logistica(
    origem:  str = Query(...),
    destino: str = Query(...),
):
    modo, dist = calcular_logistica(origem, destino)
    result = {"modo": modo, "distancia_km": dist}
    if modo == "CARRO":
        result["custo_estimado_brl"] = round(calcular_custos_carro(dist), 2)
    return result


@router.get("/links")
def travel_links(
    origem:     str = Query(...),
    destino:    str = Query(...),
    data_jogo:  str = Query(..., description="ISO datetime, ex: 2025-08-10T16:00:00"),
):
    link_google, link_sky = gerar_links_viagem(origem, destino, data_jogo)
    return {"google_flights": link_google, "skyscanner": link_sky}

from fastapi import APIRouter, Query

from app.core.logistics import calcular_logistica, gerar_links_viagem, calcular_custos_carro

router = APIRouter()


@router.get("/logistics")
def logistica(
    origem: str = Query(...),
    destino: str = Query(...),
):
    modo, dist = calcular_logistica(origem, destino)
    result = {"modo": modo, "distancia_km": dist}

    if modo == "CARRO":
        result["custo_estimado_brl"] = round(calcular_custos_carro(dist), 2)
    
    return result


@router.get("/links")
def travel_links(
    origem: str = Query(...),
    destino: str = Query(...),
    data_jogo: str = Query(..., description="ISO datetime, ex: 2025-08-10T16:00:00"),
):
    link_google, link_sky = gerar_links_viagem(origem, destino, data_jogo)
    return {"google_flights": link_google, "skyscanner": link_sky}

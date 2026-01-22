from curl_cffi import requests
import logging
import time
from datetime import datetime
# Importa a nova função de busca por ID
from database import consultar_estadio_por_id, consultar_estadio_do_clube

logging.basicConfig(level=logging.INFO)

# ... (MANTENHA A FUNÇÃO buscar_id_time IGUAL, NÃO PRECISA MUDAR) ...
# Copie a função buscar_id_time do seu código anterior ou use este encurtado se preferir

def buscar_id_time(nome_time):
    url_search = f"https://www.sofascore.com/api/v1/search/{nome_time}"
    try:
        response = requests.get(url_search, impersonate="chrome110", timeout=10)
        if response.status_code == 200:
            data = response.json()
            for item in data.get('results', []):
                entity = item.get('entity', {})
                if entity.get('sport', {}).get('name') == 'Football':
                    time_id = entity['id']
                    # Pega cor
                    cor = "#000000"
                    try:
                        resp_det = requests.get(f"https://www.sofascore.com/api/v1/team/{time_id}", impersonate="chrome110", timeout=5)
                        if resp_det.status_code == 200:
                            cor = resp_det.json().get('team', {}).get('teamColors', {}).get('primary', '#000000')
                    except: pass
                    
                    return {
                        'id': time_id,
                        'nome': entity['name'],
                        'pais': entity.get('country', {}).get('name'),
                        'logo': f"https://api.sofascore.app/api/v1/team/{time_id}/image",
                        'cor': cor
                    }
    except: pass
    return None

def buscar_jogos(time_id, tipo='next', limite_paginas=None): 
    jogos = []
    pagina = 0
    tem_proxima = True
    
    while tem_proxima:
        # Se definimos um limite e atingimos ele, paramos!
        if limite_paginas is not None and pagina >= limite_paginas:
            break

        url = f"https://www.sofascore.com/api/v1/team/{time_id}/events/{tipo}/{pagina}"
        
        try:
            logging.info(f"📡 Consultando API (Pág {pagina}): {url}")
            response = requests.get(url, impersonate="chrome110", timeout=10)
            
            if response.status_code != 200: break

            data = response.json()
            events = data.get('events', [])
            
            if not events: break
            
            for e in events:
                # ... (LÓGICA DE EXTRAÇÃO MANTIDA IGUAL AO ANTERIOR) ...
                # Vou resumir aqui para não ficar gigante, mas mantenha a lógica
                # de extrair estádio, data, placar, logos, ID, etc.
                # Copie o miolo do seu scraper anterior aqui dentro do loop for
                estadio_nome = "A definir"
                cidade_nome = "A definir"
                
                if 'venue' in e and e['venue'].get('city'):
                    estadio_nome = e['venue'].get('name')
                    cidade_nome = e['venue'].get('city', {}).get('name')
                else:
                    home_id = e['homeTeam']['id']
                    dados_banco = consultar_estadio_por_id(home_id)
                    if dados_banco:
                        estadio_nome = dados_banco['estadio']
                        cidade_nome = dados_banco['cidade']
                    else:
                        dados_nome = consultar_estadio_do_clube(e['homeTeam']['name'])
                        if dados_nome:
                            estadio_nome = dados_nome['estadio']
                            cidade_nome = dados_nome['cidade']

                ts = e.get('startTimestamp')
                dt_obj = datetime.fromtimestamp(ts) if ts else None
                placar_str = f"{e.get('homeScore', {}).get('display', 0)} - {e.get('awayScore', {}).get('display', 0)}" if e['status']['type'] == 'finished' else "vs"

                jogos.append({
                    'id': e['id'],
                    'timestamp': ts,
                    'data_fmt': dt_obj.strftime('%d/%m/%Y %H:%M') if dt_obj else "TBD",
                    'dt_obj': dt_obj, # Importante para ordenação
                    'home': e['homeTeam']['name'],
                    'home_id': e['homeTeam']['id'],
                    'home_logo': f"https://api.sofascore.app/api/v1/team/{e['homeTeam']['id']}/image",
                    'away': e['awayTeam']['name'],
                    'away_id': e['awayTeam']['id'],
                    'away_logo': f"https://api.sofascore.app/api/v1/team/{e['awayTeam']['id']}/image",
                    'placar': placar_str,
                    'status': e['status']['type'],
                    'estadio': estadio_nome,
                    'cidade': cidade_nome,
                    'torneio': e.get('tournament', {}).get('name'),
                    'is_home': e['homeTeam']['id'] == time_id
                })
            
            tem_proxima = data.get('hasNextPage', False)
            if tem_proxima:
                pagina += 1
                time.sleep(0.3)
            else:
                break
            
        except Exception as e:
            logging.error(f"Erro: {e}")
            break
            
    return jogos
# ... (Mantenha todo o código anterior acima) ...

def buscar_detalhes_jogo(event_id):
    """Busca quem fez os gols de uma partida específica."""
    url = f"https://www.sofascore.com/api/v1/event/{event_id}/incidents"
    
    try:
        response = requests.get(url, impersonate="chrome110", timeout=5)
        if response.status_code != 200: return None
        
        data = response.json()
        incidents = data.get('incidents', [])
        
        gols = []
        
        # Filtra apenas gols (exclui cartões, substituições, etc.)
        # incidentType 'goal' ou 'period' (pênaltis)
        for inc in incidents:
            if inc.get('incidentType') == 'goal':
                jogador = inc.get('player', {}).get('shortName', inc.get('player', {}).get('name', 'Desconhecido'))
                if inc.get('isHome'):
                    lado = 'home'
                else:
                    lado = 'away'
                
                # Tratamento para gol contra
                obs = ""
                if inc.get('incidentClass') == 'ownGoal':
                    obs = " (GC)"
                
                gols.append({
                    'minuto': inc.get('time'),
                    'jogador': f"{jogador}{obs}",
                    'lado': lado,
                    'is_home_goal': inc.get('isHome')
                })
        
        # Ordena por minuto
        gols.sort(key=lambda x: x['minuto'])
        return gols

    except Exception as e:
        logging.error(f"Erro ao buscar detalhes {event_id}: {e}")
        return None
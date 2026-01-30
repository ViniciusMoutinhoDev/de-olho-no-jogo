from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

from scraper import buscar_id_time, buscar_jogos, buscar_detalhes_jogo
from database import (
    adicionar_ao_diario, ler_diario, listar_todos_clubes, 
    verificar_jogo_no_diario, remover_do_diario, 
    criar_usuario, buscar_usuario_por_email
)
from utils import calcular_logistica, calcular_custos_carro

app = Flask(__name__)
CORS(app)

# --- CONFIGURAÇÃO DE SEGURANÇA ---
app.config["JWT_SECRET_KEY"] = "segredo-super-secreto-mudeme" # Em produção, use env var
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30) # Login dura 30 dias
jwt = JWTManager(app)

CACHE_MEMORIA = {}

# --- ROTAS DE AUTENTICAÇÃO ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    senha = data.get('password')
    nome = data.get('name')
    cidade = data.get('city', 'São Paulo') # Cidade padrão

    if not email or not senha:
        return jsonify({"error": "Dados incompletos"}), 400

    if buscar_usuario_por_email(email):
        return jsonify({"error": "Email já cadastrado"}), 400

    senha_hash = generate_password_hash(senha)
    if criar_usuario(email, senha_hash, nome, cidade):
        # Gera token direto para ele já entrar logado
        user_data = buscar_usuario_por_email(email)
        token = create_access_token(identity=str(user_data[0]), additional_claims={"city": cidade, "name": nome})
        return jsonify({"message": "Criado com sucesso", "token": token, "user": {"name": nome, "city": cidade}})
    
    return jsonify({"error": "Erro ao criar usuário"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    senha = data.get('password')

    user = buscar_usuario_por_email(email) # Retorna (id, nome, senha_hash, cidade)
    
    if user and check_password_hash(user[2], senha):
        # Cria o token com ID e Cidade embutidos
        token = create_access_token(identity=str(user[0]), additional_claims={"city": user[3], "name": user[1]})
        return jsonify({"token": token, "user": {"name": user[1], "city": user[3]}})
    
    return jsonify({"error": "Email ou senha inválidos"}), 401

# --- ROTAS DO SISTEMA ---

@app.route('/api/buscar-time', methods=['GET'])
def get_time():
    nome = request.args.get('nome')
    res = buscar_id_time(nome)
    return jsonify(res) if res else (jsonify({"error": "Não encontrado"}), 404)

@app.route('/api/jogos', methods=['GET'])
@jwt_required(optional=True) # Opcional: Se logado, checa se salvou. Se não, mostra normal.
def get_jogos():
    current_user_id = get_jwt_identity() # Pode ser None se não estiver logado
    
    time_id = request.args.get('id')
    tipo = request.args.get('tipo', 'next')
    # Usa a cidade do usuário logado se disponível, senão usa a da URL, senão São Paulo
    origem_padrao = request.args.get('origem', 'São Paulo')
    
    # Se quiser forçar usar a cidade do cadastro:
    # claims = get_jwt()
    # origem = claims.get("city", origem_padrao) if current_user_id else origem_padrao
    origem = origem_padrao # Por enquanto vamos manter flexível

    modo_parcial = request.args.get('partial', 'false') == 'true'
    
    chave_cache = f"{time_id}_{tipo}_{'partial' if modo_parcial else 'full'}"
    chave_cache_full = f"{time_id}_{tipo}_full"

    if chave_cache_full in CACHE_MEMORIA:
        todos_jogos = CACHE_MEMORIA[chave_cache_full]
    elif modo_parcial and chave_cache in CACHE_MEMORIA:
        todos_jogos = CACHE_MEMORIA[chave_cache]
    else:
        limite = 2 if modo_parcial else None 
        if tipo == 'next': todos_jogos = buscar_jogos(int(time_id), 'next')
        else: todos_jogos = buscar_jogos(int(time_id), 'last', limite_paginas=limite)
        CACHE_MEMORIA[chave_cache] = todos_jogos

    agora = datetime.now()
    resultado = []

    for jogo in todos_jogos:
        # Check se é futuro/passado
        ts = jogo.get('timestamp')
        if not ts: continue
        dt_obj = datetime.fromtimestamp(ts)
        is_futuro = dt_obj > agora
        if tipo == 'next' and not is_futuro: continue
        if tipo == 'last' and is_futuro: continue

        # VERIFICAÇÃO PERSONALIZADA: Está salvo PARA ESSE USUÁRIO?
        salvo = False
        if current_user_id:
            salvo = verificar_jogo_no_diario(current_user_id, jogo['id'])
        
        jogo_export = jogo.copy()
        jogo_export['salvo'] = salvo
        if 'dt_obj' in jogo_export: del jogo_export['dt_obj'] 
        
        # Logística
        if is_futuro:
            modo, dist = calcular_logistica(origem, jogo['cidade'])
            custo = calcular_custos_carro(dist) if modo == "CARRO" else 0
            jogo_export['logistica'] = {'modo': modo, 'distancia': dist, 'custo_estimado': custo}

        resultado.append(jogo_export)

    if tipo == 'next': resultado.sort(key=lambda x: x['timestamp'])
    else: resultado.sort(key=lambda x: x['timestamp'], reverse=True)

    return jsonify(resultado)

@app.route('/api/diario', methods=['GET', 'POST', 'DELETE'])
@jwt_required() # <--- AGORA PROTEGIDO! SÓ COM LOGIN
def endpoint_diario():
    user_id = get_jwt_identity() # Pega o ID do token automaticamente

    if request.method == 'GET':
        df = ler_diario(user_id)
        return jsonify(df.to_dict(orient='records') if not df.empty else [])

    if request.method == 'POST':
        sucesso = adicionar_ao_diario(user_id, request.json)
        return jsonify({"success": sucesso})

    if request.method == 'DELETE':
        id_jogo = request.args.get('id')
        sucesso = remover_do_diario(user_id, id_jogo)
        return jsonify({"success": sucesso})

@app.route('/api/detalhes', methods=['GET'])
def get_detalhes():
    id_jogo = request.args.get('id')
    chave = f"detalhes_{id_jogo}"
    if chave in CACHE_MEMORIA: return jsonify(CACHE_MEMORIA[chave])
    gols = buscar_detalhes_jogo(id_jogo)
    if gols is not None: CACHE_MEMORIA[chave] = gols
    return jsonify(gols or [])

@app.route('/api/clubes', methods=['GET'])
def get_clubes():
    df = listar_todos_clubes()
    return jsonify(df.to_dict(orient='records') if not df.empty else [])

if __name__ == '__main__':
    app.run(debug=True, port=5000)